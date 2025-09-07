import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RequestType } from '@/types/requests';
import { useEnhancedRequests } from '@/hooks/useEnhancedRequests';
import RequestTypeCard from './RequestTypeCard';
import DynamicFormFields from './DynamicFormFields';
import FileUpload from './FileUpload';
import { cn } from '@/lib/utils';

interface RequestWizardProps {
  requestTypes: RequestType[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  form_data: Record<string, any>;
  attachments: File[];
}

export default function RequestWizard({ requestTypes, onSuccess, onCancel }: RequestWizardProps) {
  const { createRequestWithAutoAssignment, loading: requestsLoading } = useEnhancedRequests();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | null>(null);
  const [formData, setFormData] = useState<Partial<FormData>>({
    priority: 'medium',
    form_data: {},
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium'
    }
  });

  // Auto-save draft functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedRequestType && formData.title) {
        setIsDraft(true);
        // Here you would implement actual draft saving to localStorage or backend
        localStorage.setItem('request_draft', JSON.stringify({
          selectedRequestType,
          formData,
          currentStep
        }));
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [selectedRequestType, formData, currentStep]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('request_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setSelectedRequestType(parsed.selectedRequestType);
        setFormData(parsed.formData);
        setCurrentStep(parsed.currentStep);
        
        // Set form values
        if (parsed.formData.title) setValue('title', parsed.formData.title);
        if (parsed.formData.description) setValue('description', parsed.formData.description);
        if (parsed.formData.priority) setValue('priority', parsed.formData.priority);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, [setValue]);

  const steps = [
    { title: 'Select Type', description: 'Choose your request type' },
    { title: 'Basic Info', description: 'Provide basic details' },
    ...(selectedRequestType?.form_schema && selectedRequestType.form_schema.length > 0 
      ? [{ title: 'Details', description: 'Fill in specific details' }] 
      : []
    ),
    { title: 'Attachments', description: 'Upload files (optional)' },
    { title: 'Review', description: 'Review and submit' }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(['title']);
      if (!isValid) return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedRequestType) return;
    
    setIsSubmitting(true);
    try {
      await createRequestWithAutoAssignment({
        request_type_id: selectedRequestType.id,
        title: data.title,
        description: data.description,
        form_data: formData.form_data || {},
        priority: data.priority,
        due_date: formData.due_date
      });
      
      // Clear draft
      localStorage.removeItem('request_draft');
      onSuccess();
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateDynamicFormData = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      form_data: {
        ...prev.form_data,
        [key]: value
      }
    }));
  };

  const groupedRequestTypes = requestTypes.reduce((groups, type) => {
    if (!groups[type.category]) {
      groups[type.category] = [];
    }
    groups[type.category].push(type);
    return groups;
  }, {} as Record<string, RequestType[]>);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">What type of request would you like to make?</h3>
              <p className="text-muted-foreground">Select the category that best matches your needs</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(groupedRequestTypes).map(([category, types]) => (
                <div key={category} className="space-y-3">
                  {types.map((type) => (
                    <RequestTypeCard
                      key={type.id}
                      requestType={type}
                      onClick={() => setSelectedRequestType(type)}
                      isSelected={selectedRequestType?.id === type.id}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Tell us about your request</h3>
              <p className="text-muted-foreground">Provide basic information about what you need</p>
            </div>

            {selectedRequestType && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{selectedRequestType.name}</Badge>
                    {selectedRequestType.requires_approval && (
                      <Badge variant="outline">Requires Approval</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Request Title *</label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Brief description of your request"
                  onChange={(e) => updateFormData('title', e.target.value)}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => updateFormData('priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date (Optional)</label>
                <input
                  type="date"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => updateFormData('due_date', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  {...register('description')}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4}
                  placeholder="Provide additional context and details"
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        if (!selectedRequestType?.form_schema || selectedRequestType.form_schema.length === 0) {
          return renderStep(); // Skip to next step
        }
        
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Specific Details</h3>
              <p className="text-muted-foreground">Please provide the following information</p>
            </div>

            <DynamicFormFields
              fields={selectedRequestType.form_schema}
              values={formData.form_data || {}}
              onChange={updateDynamicFormData}
            />
          </div>
        );

      case steps.length - 2: // Attachments step
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Upload Attachments</h3>
              <p className="text-muted-foreground">Add any supporting documents (optional)</p>
            </div>

            <FileUpload
              onFilesChange={(files) => updateFormData('attachments', files)}
              maxFiles={5}
              maxSize={10 * 1024 * 1024} // 10MB
            />
          </div>
        );

      case steps.length - 1: // Review step
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Review Your Request</h3>
              <p className="text-muted-foreground">Please review all details before submitting</p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <span className="font-medium">Type:</span>
                    <span className="col-span-2">{selectedRequestType?.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="font-medium">Title:</span>
                    <span className="col-span-2">{watch('title')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <span className="font-medium">Priority:</span>
                    <span className="col-span-2">
                      <Badge className={`${watch('priority') === 'urgent' ? 'bg-red-100 text-red-800' : 
                        watch('priority') === 'high' ? 'bg-orange-100 text-orange-800' :
                        watch('priority') === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'}`}>
                        {watch('priority')}
                      </Badge>
                    </span>
                  </div>
                  {watch('description') && (
                    <div className="grid grid-cols-3 gap-4">
                      <span className="font-medium">Description:</span>
                      <span className="col-span-2">{watch('description')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {formData.form_data && Object.keys(formData.form_data).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Additional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(formData.form_data).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="col-span-2">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {formData.attachments && formData.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Attachments ({formData.attachments.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline">{file.name}</Badge>
                          <span className="text-sm text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Create New Request</h2>
            {isDraft && (
              <div className="flex items-center gap-2 mt-1">
                <Save className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Draft saved automatically</span>
              </div>
            )}
          </div>
          <Badge variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{steps[currentStep].title}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 0 ? onCancel : prevStep}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !selectedRequestType || requestsLoading}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={currentStep === 0 && !selectedRequestType}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}