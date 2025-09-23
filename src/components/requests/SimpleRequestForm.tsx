import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, AlertCircle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedRequests } from '@/hooks/useEnhancedRequests';
import { cn } from '@/lib/utils';

interface SimpleRequestType {
  id: string;
  name: string;
  description?: string;
  requires_approval: boolean;
  category?: string;
  subcategory?: string;
  parent_id?: string;
  is_subcategory?: boolean;
  display_order?: number;
}

interface SimpleRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const requestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  request_type_id: z.string().min(1, 'Request type is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.date().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const PRIORITY_CONFIG = {
  low: { color: 'bg-blue-100 text-blue-800', label: 'Low' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' },
};

export default function SimpleRequestForm({ onSuccess, onCancel }: SimpleRequestFormProps) {
  const { user } = useAuth();
  const { requestTypes, createRequestWithAutoAssignment, loading: hookLoading } = useEnhancedRequests();
  const [loading, setLoading] = useState(false);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: '',
      description: '',
      request_type_id: '',
      priority: 'medium',
      due_date: undefined,
    },
  });

  // Convert hook request types to simple format with proper subcategory handling
  const simpleRequestTypes: SimpleRequestType[] = requestTypes.map(rt => ({
    id: rt.id,
    name: rt.name,
    description: rt.description,
    requires_approval: rt.requires_approval,
    category: rt.category,
    subcategory: rt.subcategory,
    parent_id: rt.parent_category_id,
    is_subcategory: !!rt.parent_category_id,
    display_order: 0
  }));

  const onSubmit = async (data: RequestFormData) => {
    setLoading(true);
    try {
      await createRequestWithAutoAssignment({
        request_type_id: data.request_type_id,
        title: data.title,
        description: data.description,
        form_data: {},
        priority: data.priority,
        due_date: data.due_date ? data.due_date.toISOString().split('T')[0] : undefined,
      });
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (hookLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading request types...</p>
        </CardContent>
      </Card>
    );
  }

  if (simpleRequestTypes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No request types available. Contact your administrator to set up request types.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedRequestType = simpleRequestTypes.find(rt => rt.id === form.watch('request_type_id'));

  return (
    <div className="space-y-6">
      {/* Request Type Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Check className="h-4 w-4" />
          Request Type Selection
        </div>
        
        <div className="pl-6 space-y-2">
          <Label htmlFor="request_type">Request Type *</Label>
          <Select
            value={form.watch('request_type_id')}
            onValueChange={(value) => form.setValue('request_type_id', value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select a request type">
                {selectedRequestType && (
                  <div className="flex items-center gap-2">
                    {selectedRequestType.is_subcategory ? (
                      <span>
                        {simpleRequestTypes.find(rt => rt.id === selectedRequestType.parent_id)?.name} 
                        <span className="text-muted-foreground mx-2">›</span>
                        {selectedRequestType.name}
                      </span>
                    ) : (
                      <span>{selectedRequestType.name}</span>
                    )}
                    {selectedRequestType.requires_approval && (
                      <Badge variant="outline" className="text-xs">Approval Required</Badge>
                    )}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {simpleRequestTypes
                .filter(type => !type.is_subcategory) // Show only parent categories
                .map((parentType) => {
                  const subcategories = simpleRequestTypes.filter(type => type.parent_id === parentType.id);
                  
                  return (
                    <div key={parentType.id}>
                      <SelectItem value={parentType.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{parentType.name}</div>
                            {parentType.description && (
                              <div className="text-sm text-muted-foreground">{parentType.description}</div>
                            )}
                          </div>
                          {parentType.requires_approval && (
                            <Badge variant="outline" className="ml-2">Requires Approval</Badge>
                          )}
                        </div>
                      </SelectItem>
                      
                      {subcategories.map((subType) => (
                        <SelectItem key={subType.id} value={subType.id}>
                          <div className="flex items-center justify-between w-full pl-4">
                            <div>
                              <div className="font-medium text-sm">↳ {subType.name}</div>
                              {subType.description && (
                                <div className="text-xs text-muted-foreground">{subType.description}</div>
                              )}
                            </div>
                            {subType.requires_approval && (
                              <Badge variant="outline" className="ml-2 text-xs">Requires Approval</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
            </SelectContent>
          </Select>
          {form.formState.errors.request_type_id && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {form.formState.errors.request_type_id.message}
            </p>
          )}
        </div>
      </div>

    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

      {/* Request Details Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <AlertCircle className="h-4 w-4" />
          Request Details
        </div>
        
        <div className="pl-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              placeholder="Enter a clear, descriptive title..."
              {...form.register('title')}
              className="h-12"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide additional details about your request..."
              rows={4}
              {...form.register('description')}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* Priority & Timing Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <CalendarIcon className="h-4 w-4" />
          Priority & Timing
        </div>
        
        <div className="pl-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(value: any) => form.setValue('priority', value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal",
                      !form.watch('due_date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('due_date') ? (
                      format(form.watch('due_date')!, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('due_date')}
                    onSelect={(date) => form.setValue('due_date', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Request Type Info */}
      {selectedRequestType && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Request Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type:</span>
              <span className="text-sm font-medium">{selectedRequestType.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Approval Required:</span>
              <Badge variant={selectedRequestType.requires_approval ? "default" : "secondary"}>
                {selectedRequestType.requires_approval ? "Yes" : "No"}
              </Badge>
            </div>
            {selectedRequestType.description && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                {selectedRequestType.description}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
      </div>
    </form>
    </div>
  );
}