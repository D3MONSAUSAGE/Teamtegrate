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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { RequestType } from '@/types/requests';
import { cn } from '@/lib/utils';

interface SimpleRequestType {
  id: string;
  name: string;
  description?: string;
  requires_approval: boolean;
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
  const [requestTypes, setRequestTypes] = useState<SimpleRequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);

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

  useEffect(() => {
    fetchRequestTypes();
  }, [user?.organizationId]);

  const fetchRequestTypes = async () => {
    if (!user?.organizationId) return;

    try {
      setLoadingTypes(true);
      const { data, error } = await supabase
        .from('request_types')
        .select('id, name, description, requires_approval')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRequestTypes(data || []);
    } catch (error) {
      console.error('Error fetching request types:', error);
      toast.error('Failed to load request types');
    } finally {
      setLoadingTypes(false);
    }
  };

  const onSubmit = async (data: RequestFormData) => {
    if (!user?.organizationId) {
      toast.error('No organization found');
      return;
    }

    setLoading(true);
    try {
      // Create the request first
      const requestData = {
        organization_id: user.organizationId,
        requested_by: user.id,
        request_type_id: data.request_type_id,
        title: data.title,
        description: data.description || '',
        priority: data.priority,
        status: 'submitted',
        due_date: data.due_date ? data.due_date.toISOString().split('T')[0] : null,
        form_data: {},
      };

      const { data: newRequest, error } = await supabase
        .from('requests')
        .insert(requestData)
        .select(`
          *,
          request_type:request_types(
            id, name, category, description, organization_id, created_by, created_at, updated_at,
            requires_approval, approval_roles, is_active, 
            default_job_roles, expertise_tags
          )
        `)
        .single();

      if (error) throw error;

      // Import and use smart assignment service
      const { SmartAssignmentService } = await import('@/services/smartAssignmentService');
      
      if (newRequest.request_type) {
        // Transform the request type to match our interface
        const requestType: RequestType = {
          id: newRequest.request_type.id || '',
          organization_id: newRequest.request_type.organization_id || '',
          name: newRequest.request_type.name || '',
          description: newRequest.request_type.description,
          category: newRequest.request_type.category || '',
          form_schema: [], // Initialize empty form schema
          requires_approval: newRequest.request_type.requires_approval ?? true,
          approval_roles: newRequest.request_type.approval_roles || [],
          is_active: newRequest.request_type.is_active ?? true,
          created_by: newRequest.request_type.created_by || '',
          created_at: newRequest.request_type.created_at || '',
          updated_at: newRequest.request_type.updated_at || '',
          default_job_roles: newRequest.request_type.default_job_roles || [],
          selected_user_ids: [], // Not available in database yet
          expertise_tags: newRequest.request_type.expertise_tags || [],
        };
        
        const assignmentResult = await SmartAssignmentService.assignRequest(
          newRequest.id,
          requestType,
          requestData,
          user.organizationId
        );

        // Send notifications to assigned users
        if (assignmentResult.assignedUsers.length > 0) {
          await SmartAssignmentService.sendAssignmentNotifications(
            newRequest.id,
            assignmentResult.assignedUsers,
            data.title,
            user.organizationId
          );
        }
      }

      toast.success('Request submitted and assigned successfully');
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTypes) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading request types...</p>
        </CardContent>
      </Card>
    );
  }

  if (requestTypes.length === 0) {
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

  const selectedRequestType = requestTypes.find(rt => rt.id === form.watch('request_type_id'));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Request Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="request_type">Request Type *</Label>
        <Select
          value={form.watch('request_type_id')}
          onValueChange={(value) => form.setValue('request_type_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a request type" />
          </SelectTrigger>
          <SelectContent>
            {requestTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{type.name}</div>
                    {type.description && (
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    )}
                  </div>
                  {type.requires_approval && (
                    <Badge variant="outline" className="ml-2">Requires Approval</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.request_type_id && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {form.formState.errors.request_type_id.message}
          </p>
        )}
      </div>

      {/* Request Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Request Title *</Label>
        <Input
          id="title"
          placeholder="Enter a clear, descriptive title"
          {...form.register('title')}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* Priority and Due Date Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={form.watch('priority')}
            onValueChange={(value: any) => form.setValue('priority', value)}
          >
            <SelectTrigger>
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
                  "w-full justify-start text-left font-normal",
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

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Provide additional details about your request"
          rows={4}
          {...form.register('description')}
        />
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
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Submitting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Submit Request
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}