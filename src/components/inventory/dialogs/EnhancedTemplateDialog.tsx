import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Package, Settings, ArrowRight, ArrowLeft } from 'lucide-react';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ItemSelectionStep } from './steps/ItemSelectionStep';
import { ScheduleConfigStep } from './steps/ScheduleConfigStep';
import { ReviewStep } from './steps/ReviewStep';
import type { InventoryTemplate, InventoryItem } from '@/contexts/inventory/types';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EnhancedTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTeam?: string;
}

export interface TemplateFormData {
  // Basic Info
  name: string;
  description: string;
  team_id: string | null; // null means "All Teams"
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Items
  selectedItems: Array<{
    item: InventoryItem;
    inStockQuantity: number;
    minimumQuantity?: number;
    maximumQuantity?: number;
    sortOrder: number;
  }>;
  
  // Schedule
  execution_frequency: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  execution_days: string[];
  execution_time_start?: string;
  execution_time_due?: string;
  execution_window_hours: number;
  notification_settings: {
    remind_before_hours: number;
    remind_overdue: boolean;
    escalate_overdue_hours: number;
  };
}

const STEP_ICONS = {
  basic: Settings,
  items: Package,
  schedule: Clock,
  review: Calendar
};

const STEP_LABELS = {
  basic: 'Basic Info',
  items: 'Select Items',
  schedule: 'Schedule',
  review: 'Review & Create'
};

export const EnhancedTemplateDialog: React.FC<EnhancedTemplateDialogProps> = ({
  open,
  onOpenChange,
  selectedTeam
}) => {
  const { createTemplate, addItemToTemplate } = useInventory();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<'basic' | 'items' | 'schedule' | 'review'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    team_id: selectedTeam || null,
    priority: 'medium',
    selectedItems: [],
    execution_frequency: 'manual',
    execution_days: [],
    execution_time_start: '09:00',
    execution_time_due: '17:00',
    execution_window_hours: 24,
    notification_settings: {
      remind_before_hours: 2,
      remind_overdue: true,
      escalate_overdue_hours: 24
    }
  });

  const updateFormData = (updates: Partial<TemplateFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const steps = ['basic', 'items', 'schedule', 'review'] as const;
  const currentStepIndex = steps.indexOf(currentStep);
  
  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.trim().length > 0;
      case 'items':
        return formData.selectedItems.length > 0;
      case 'schedule':
        return true; // Schedule step is always valid
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleCreate = async () => {
    if (!user?.organizationId) return;
    
    setIsLoading(true);
    try {
      // Create the template
      const template = await createTemplate({
        organization_id: user.organizationId,
        team_id: formData.team_id,
        name: formData.name,
        description: formData.description,
        category: formData.team_id ? 'team' : 'organization', // Use team or organization category
        priority: formData.priority,
        execution_frequency: formData.execution_frequency,
        execution_days: formData.execution_days,
        execution_time_start: formData.execution_time_start,
        execution_time_due: formData.execution_time_due,
        execution_window_hours: formData.execution_window_hours,
        notification_settings: formData.notification_settings,
        is_active: true,
        created_by: user.id
      });

      // Add items with proper validation
      const itemPromises = formData.selectedItems.map(async ({ item, inStockQuantity, minimumQuantity, maximumQuantity, sortOrder }) => {
        try {
          // Validate quantities to prevent database constraint violations
          const validatedMin = minimumQuantity && minimumQuantity >= 0 ? minimumQuantity : undefined;
          const validatedMax = maximumQuantity && maximumQuantity >= 0 ? maximumQuantity : undefined;
          const validatedInStock = Math.max(0, inStockQuantity || 0);
          
          // Ensure min <= max if both are provided
          if (validatedMin !== undefined && validatedMax !== undefined && validatedMin > validatedMax) {
            console.warn(`Invalid quantities for ${item.name}: min(${validatedMin}) > max(${validatedMax})`);
            return; // Skip this item
          }
          
          await addItemToTemplate(template.id, item.id, validatedInStock, validatedMin, validatedMax, sortOrder);
        } catch (error) {
          console.error(`Failed to add item ${item.name} to template:`, error);
          throw error;
        }
      });
      
      await Promise.all(itemPromises);

      toast({
        title: 'Success',
        description: `Template "${formData.name}" created successfully with ${formData.selectedItems.length} items`
      });

      // Reset and close
      setFormData({
        name: '',
        description: '',
        team_id: selectedTeam || null,
        priority: 'medium',
        selectedItems: [],
        execution_frequency: 'manual',
        execution_days: [],
        execution_time_start: '09:00',
        execution_time_due: '17:00',
        execution_window_hours: 24,
        notification_settings: {
          remind_before_hours: 2,
          remind_overdue: true,
          escalate_overdue_hours: 24
        }
      });
      setCurrentStep('basic');
      onOpenChange(false);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <BasicInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 'items':
        return (
          <ItemSelectionStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 'schedule':
        return (
          <ScheduleConfigStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 'review':
        return (
          <ReviewStep
            formData={formData}
            selectedTeam={selectedTeam}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Inventory Template
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-2">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[step];
            const isActive = step === currentStep;
            const isCompleted = index < currentStepIndex;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                }`}>
                  <div className={`rounded-full p-2 ${
                    isActive ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-success text-success-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{STEP_LABELS[step]}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {steps.length}</span>
            {formData.selectedItems.length > 0 && (
              <Badge variant="secondary">
                {formData.selectedItems.length} items selected
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {currentStep === 'review' ? (
              <Button
                onClick={handleCreate}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? 'Creating...' : 'Create Template'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};