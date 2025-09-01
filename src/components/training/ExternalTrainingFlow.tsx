import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, ExternalLink, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComplianceTemplate {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  external_base_url: string;
  url_parameters: any;
  language_options: string[];
  role_classifications: string[];
  completion_method: string;
}

interface ComplianceRecord {
  id?: string;
  template_id: string;
  language_selected: string;
  role_classification: string;
  external_training_url?: string;
  completion_date?: string;
  certificate_url?: string;
  is_completed: boolean;
  completion_notes?: string;
}

interface ExternalTrainingFlowProps {
  templateId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

const ExternalTrainingFlow: React.FC<ExternalTrainingFlowProps> = ({
  templateId,
  onComplete,
  onClose
}) => {
  const { user } = useAuth();
  const [template, setTemplate] = useState<ComplianceTemplate | null>(null);
  const [record, setRecord] = useState<ComplianceRecord | null>(null);
  const [currentStep, setCurrentStep] = useState<'setup' | 'training' | 'completion'>('setup');
  const [language, setLanguage] = useState('');
  const [roleClassification, setRoleClassification] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [trainingUrl, setTrainingUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplate();
    checkExistingRecord();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_training_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      setTemplate(data);

      // Set default values
      if (data.language_options.length === 1) {
        setLanguage(data.language_options[0]);
      }
      if (data.role_classifications.length === 1) {
        setRoleClassification(data.role_classifications[0]);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load training template');
    }
  };

  const checkExistingRecord = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('compliance_training_records')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setRecord(data);
        setLanguage(data.language_selected);
        setRoleClassification(data.role_classification);
        setCompletionNotes(data.completion_notes || '');
        
        if (data.is_completed) {
          setCurrentStep('completion');
        } else if (data.external_training_url) {
          setCurrentStep('training');
          setTrainingUrl(data.external_training_url);
        }
      }
    } catch (error) {
      console.error('Error checking existing record:', error);
    }
  };

  const buildTrainingUrl = (baseUrl: string, params: any, selectedLanguage: string, selectedRole: string) => {
    let url = baseUrl;
    
    // Replace URL parameters with actual values
    if (params.language_path && selectedLanguage) {
      const languageMap = params.language_mapping || {
        'English': 'English',
        'Spanish': 'Spanish'
      };
      url = url.replace('{language}', languageMap[selectedLanguage] || selectedLanguage);
    }
    
    if (params.role_path && selectedRole) {
      const roleMap = params.role_mapping || {
        'Employee': 'NonSupervisory',
        'Supervisor': 'Supervisory'
      };
      url = url.replace('{role}', roleMap[selectedRole] || selectedRole);
    }
    
    return url;
  };

  const startTraining = async () => {
    if (!template || !language || !roleClassification || !user) return;

    setLoading(true);
    try {
      const generatedUrl = buildTrainingUrl(
        template.external_base_url,
        template.url_parameters,
        language,
        roleClassification
      );

      const recordData: Partial<ComplianceRecord> = {
        template_id: templateId,
        language_selected: language,
        role_classification: roleClassification,
        external_training_url: generatedUrl,
        is_completed: false
      };

      if (record) {
        const { error } = await supabase
          .from('compliance_training_records')
          .update(recordData)
          .eq('id', record.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('compliance_training_records')
          .insert({
            template_id: templateId,
            language_selected: language,
            role_classification: roleClassification,
            external_training_url: generatedUrl,
            is_completed: false,
            user_id: user.id,
            organization_id: user.organizationId
          })
          .select()
          .single();

        if (error) throw error;
        setRecord(data);
      }

      setTrainingUrl(generatedUrl);
      setCurrentStep('training');
      
      // Open external training in new tab
      window.open(generatedUrl, '_blank');
      
      toast.success('External training started! Complete the training and return here to mark it as completed.');
    } catch (error) {
      console.error('Error starting training:', error);
      toast.error('Failed to start training');
    } finally {
      setLoading(false);
    }
  };

  const uploadCertificate = async (file: File): Promise<string> => {
    const fileName = `${user?.id}/${templateId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('training-certificates')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('training-certificates')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const markCompleted = async () => {
    if (!record || !user) return;

    setLoading(true);
    try {
      let certificateUrl = record.certificate_url;
      
      if (certificateFile) {
        certificateUrl = await uploadCertificate(certificateFile);
      }

      const { error } = await supabase
        .from('compliance_training_records')
        .update({
          is_completed: true,
          completion_date: new Date().toISOString(),
          completion_notes: completionNotes,
          certificate_url: certificateUrl
        })
        .eq('id', record.id);

      if (error) throw error;

      setCurrentStep('completion');
      toast.success('Training completed successfully!');
      onComplete?.();
    } catch (error) {
      console.error('Error marking training as completed:', error);
      toast.error('Failed to mark training as completed');
    } finally {
      setLoading(false);
    }
  };

  if (!template) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{template.title}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
        {template.jurisdiction && (
          <div className="text-sm text-muted-foreground">
            Jurisdiction: {template.jurisdiction}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStep === 'setup' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="language">Select Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your preferred language" />
                </SelectTrigger>
                <SelectContent>
                  {template.language_options.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Role Classification</Label>
              <RadioGroup value={roleClassification} onValueChange={setRoleClassification}>
                {template.role_classifications.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <RadioGroupItem value={role} id={role} />
                    <Label htmlFor={role}>{role}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={startTraining} 
                disabled={!language || !roleClassification || loading}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Start External Training
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {currentStep === 'training' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Training in Progress</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete the external training and return here to mark it as completed.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.open(trainingUrl, '_blank')}
                className="mb-3"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Reopen Training
              </Button>
            </div>

            <div>
              <Label htmlFor="completion-notes">Completion Notes (Optional)</Label>
              <Textarea
                id="completion-notes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about your training completion..."
              />
            </div>

            {template.completion_method === 'external_certificate' && (
              <div>
                <Label htmlFor="certificate">Upload Certificate (Optional)</Label>
                <Input
                  id="certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={markCompleted} disabled={loading} className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('setup')}
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'completion' && record?.is_completed && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-green-700">Training Completed!</h3>
              <p className="text-sm text-muted-foreground">
                Completed on {new Date(record.completion_date!).toLocaleDateString()}
              </p>
            </div>
            {record.certificate_url && (
              <Button 
                variant="outline" 
                onClick={() => window.open(record.certificate_url!, '_blank')}
              >
                View Certificate
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExternalTrainingFlow;