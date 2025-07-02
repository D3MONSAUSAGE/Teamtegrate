import React, { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Sparkles, DollarSign, Users, Calendar as CalendarIconLucide } from "lucide-react"
import { toast } from '@/components/ui/sonner';
import MultiSelect from './MultiSelect';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectOperations } from '@/hooks/useProjectOperations';
import { useUsers } from '@/hooks/useUsers';

const FormSchema = z.object({
  title: z.string().min(2, {
    message: "Project title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
  budget: z.number().optional(),
})

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  onProjectCreated
}) => {
  const { control, handleSubmit, reset, register, formState: { errors } } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      budget: undefined,
    },
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { user } = useAuth();
  const { createProject, isLoading } = useProjectOperations();
  const { users, isLoading: usersLoading, error: usersError } = useUsers();

  // Transform users into options for MultiSelect with proper null checks
  const userOptions = Array.isArray(users) ? users.map(user => ({
    value: user.id,
    label: `${user.name || user.email} (${user.email})`
  })).filter(option => option.value && option.label) : [];

  const onSubmit = async (data: any) => {
    try {
      if (!user?.organizationId) {
        toast.error('Organization context required');
        return;
      }

      const projectData = {
        title: data.title,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate,
        managerId: user.id,
        budget: data.budget || 0,
        budgetSpent: 0,
        teamMemberIds: selectedMembers,
        isCompleted: false,
        status: 'To Do' as const,
        tasksCount: 0,
        tags: [],
        organizationId: user.organizationId
      };

      const newProject = await createProject(projectData);
      
      if (newProject) {
        reset();
        setSelectedMembers([]);
        onOpenChange(false);
        onProjectCreated?.();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const onMemberChange = useCallback((value: string[]) => {
    setSelectedMembers(value);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Create New Project
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Start organizing your work by creating a new project with clear goals and timelines.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CalendarIconLucide className="h-4 w-4" />
              Project Details
            </div>
            
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive project title..."
                  {...register("title")}
                  className="h-12"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the project goals, scope, and key deliverables..."
                  {...register("description")}
                  className="h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Budget Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <DollarSign className="h-4 w-4" />
              Budget (Optional)
            </div>
            
            <div className="pl-6">
              <div className="space-y-2">
                <Label htmlFor="budget">Project Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("budget", { 
                    setValueAs: value => value === "" ? undefined : Number(value),
                    valueAsNumber: true 
                  })}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Users className="h-4 w-4" />
              Team Members
            </div>
            
            <div className="pl-6">
              <MultiSelect 
                onChange={onMemberChange} 
                options={userOptions}
                placeholder="Select team members..."
                isLoading={usersLoading}
                error={usersError}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
