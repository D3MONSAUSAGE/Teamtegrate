import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { CreateOnboardingTemplateRequest } from '@/types/onboarding';
import { useJobRoles } from '@/hooks/useJobRoles';

interface BasicInfoStepProps {
  data: CreateOnboardingTemplateRequest;
  onChange: (data: CreateOnboardingTemplateRequest) => void;
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const { jobRoles, isLoading: isLoadingRoles } = useJobRoles();

  const updateField = (field: keyof CreateOnboardingTemplateRequest, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Basic Template Information</h3>
        <p className="text-muted-foreground">
          Let's start with the basic details for your onboarding template
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>
            This information will help employees and managers understand what this onboarding process covers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Software Engineer Onboarding, Sales Representative Training"
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={data.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe what this onboarding template covers, who it's for, and what employees can expect to learn..."
              rows={4}
              className="text-base resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Target Job Role (Optional)</Label>
            <Select 
              value={data.role_id || 'none'} 
              onValueChange={(value) => updateField('role_id', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoadingRoles 
                    ? "Loading roles..." 
                    : jobRoles.length === 0 
                    ? "No job roles available - create one in Settings" 
                    : "Select a job role (optional)..."
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific role</SelectItem>
                {jobRoles
                  .filter((role) => role.id && role.id.trim() !== '')
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.description && (
                        <span className="text-muted-foreground ml-2">
                          - {role.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {jobRoles.length === 0 && !isLoadingRoles && (
              <p className="text-sm text-muted-foreground">
                You can create job roles in Settings → Job Roles to better organize your templates.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips for a great template</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use a clear, descriptive name that indicates the role or department</li>
          <li>• Include expected duration and key outcomes in the description</li>
          <li>• Link to a specific job role to auto-assign this template to new hires</li>
        </ul>
      </div>
    </div>
  );
}