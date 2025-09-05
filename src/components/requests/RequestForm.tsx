import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { RequestType, FormField, REQUEST_CATEGORIES } from '@/types/requests';
import { useRequests } from '@/hooks/useRequests';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RequestFormProps {
  requestTypes: RequestType[];
  onSuccess: () => void;
}

export default function RequestForm({ requestTypes, onSuccess }: RequestFormProps) {
  const { createRequest } = useRequests();
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium'
    }
  });

  const onSubmit = async (data: any) => {
    if (!selectedRequestType) return;
    
    setIsSubmitting(true);
    try {
      await createRequest({
        request_type_id: selectedRequestType.id,
        title: data.title,
        description: data.description,
        form_data: formData,
        priority: data.priority,
        due_date: dueDate?.toISOString()
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (field: FormField) => {
    const value = formData[field.field] || '';

    const updateFormData = (newValue: any) => {
      setFormData(prev => ({
        ...prev,
        [field.field]: newValue
      }));
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => updateFormData(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFormData(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={updateFormData}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => updateFormData(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateFormData(Number(e.target.value))}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            required={field.required}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value}
              onCheckedChange={updateFormData}
            />
            <Label className="text-sm font-normal">{field.label}</Label>
          </div>
        );

      default:
        return null;
    }
  };

  const groupedRequestTypes = requestTypes.reduce((groups, type) => {
    if (!groups[type.category]) {
      groups[type.category] = [];
    }
    groups[type.category].push(type);
    return groups;
  }, {} as Record<string, RequestType[]>);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Request Type Selection */}
      {!selectedRequestType ? (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Select Request Type</Label>
            <p className="text-sm text-muted-foreground">Choose the type of request you'd like to submit</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(groupedRequestTypes).map(([category, types]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {REQUEST_CATEGORIES[category as keyof typeof REQUEST_CATEGORIES]}
                </h3>
                {types.map((type) => (
                  <Card 
                    key={type.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedRequestType(type)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{type.name}</CardTitle>
                    </CardHeader>
                    {type.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Selected Request Type Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{selectedRequestType.name}</h3>
              {selectedRequestType.description && (
                <p className="text-sm text-muted-foreground">{selectedRequestType.description}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequestType(null)}
            >
              Change Type
            </Button>
          </div>

          {/* Basic Request Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="Brief description of your request"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select {...register('priority')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Provide additional details about your request"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Dynamic Form Fields */}
          {selectedRequestType.form_schema && selectedRequestType.form_schema.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold">Request Details</h4>
              <div className="grid gap-4">
                {selectedRequestType.form_schema.map((field) => (
                  <div key={field.field} className="space-y-2">
                    <Label htmlFor={field.field}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {renderFormField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </form>
  );
}