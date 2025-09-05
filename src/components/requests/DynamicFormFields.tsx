import { useState } from 'react';
import { CalendarDays, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/types/requests';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DynamicFormFieldsProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export default function DynamicFormFields({ fields, values, onChange, errors = {} }: DynamicFormFieldsProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }

    if (field.type === 'number' && value !== '' && value !== undefined) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return 'Must be a valid number';
      }
      if (field.min !== undefined && numValue < field.min) {
        return `Must be at least ${field.min}`;
      }
      if (field.max !== undefined && numValue > field.max) {
        return `Must be no more than ${field.max}`;
      }
    }

    if (field.type === 'text' && value && typeof value === 'string') {
      if (field.min !== undefined && value.length < field.min) {
        return `Must be at least ${field.min} characters`;
      }
      if (field.max !== undefined && value.length > field.max) {
        return `Must be no more than ${field.max} characters`;
      }
    }

    return null;
  };

  const handleChange = (field: FormField, value: any) => {
    onChange(field.field, value);
    
    // Validate field
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field.field]: error || ''
    }));
  };

  const renderField = (field: FormField) => {
    const value = values[field.field] || '';
    const error = validationErrors[field.field] || errors[field.field];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={cn(error && "border-destructive")}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={cn(error && "border-destructive")}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleChange(field, val)}>
            <SelectTrigger className={cn(error && "border-destructive")}>
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
                  !value && "text-muted-foreground",
                  error && "border-destructive"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleChange(field, date?.toISOString())}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(field, e.target.value ? Number(e.target.value) : '')}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className={cn(error && "border-destructive")}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => handleChange(field, checked)}
            />
            <Label className="text-sm font-normal cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      default:
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unsupported field type: {field.type}
            </AlertDescription>
          </Alert>
        );
    }
  };

  // Group fields by any section metadata if available
  const groupedFields = fields.reduce((groups, field) => {
    const section = (field as any).section || 'default';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(field);
    return groups;
  }, {} as Record<string, FormField[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([section, sectionFields]) => (
        <div key={section} className="space-y-4">
          {section !== 'default' && (
            <div className="border-b pb-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {section.replace('_', ' ')}
              </h4>
            </div>
          )}
          
          <div className="grid gap-4 md:grid-cols-2">
            {sectionFields.map((field) => {
              const error = validationErrors[field.field] || errors[field.field];
              const isCheckbox = field.type === 'checkbox';
              
              return (
                <div 
                  key={field.field} 
                  className={cn(
                    "space-y-2",
                    isCheckbox && "md:col-span-2"
                  )}
                >
                  {!isCheckbox && (
                    <Label htmlFor={field.field} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  )}
                  
                  {renderField(field)}
                  
                  {error && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {error}
                    </p>
                  )}
                  
                  {field.placeholder && !isCheckbox && (
                    <p className="text-xs text-muted-foreground">
                      {field.placeholder}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}