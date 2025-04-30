
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useProjectOperations } from '@/hooks/useProjectOperations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { useUsers } from '@/hooks/useUsers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamMembersSection, FormValues } from "@/components/project/TeamMembersSection";
import { X, Plus, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { user } = useAuth();
  const { createProject, isLoading } = useProjectOperations();
  const { users } = useUsers();
  const [newTag, setNewTag] = useState('');
  
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      budget: undefined,
      teamMembers: [],
      tags: [],
    }
  });
  
  const { fields: teamMemberFields, append: appendTeamMember, remove: removeTeamMember } = useFieldArray({
    control,
    name: "teamMembers"
  });

  // Using FieldArrayWithId type explicitly to fix the TypeScript error
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: "teamMembers" // This needs to match a key in FormValues
  });

  const handleAddTag = () => {
    if (newTag && newTag.trim() !== '') {
      const tags = watch('tags') || [];
      
      // Check if the tag already exists
      if (!tags.includes(newTag.trim())) {
        // We'll need to manually update the tags array since we're not using useFieldArray for it
        setValue('tags', [...tags, newTag.trim()]);
        setNewTag('');
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    try {
      console.log("Submitting project data:", data);
      
      // Extract team member IDs from the form data
      const teamMemberIds = data.teamMembers.map(member => member.memberId);
      
      const project = await createProject({
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managerId: user.id,
        budget: data.budget,
        teamMembers: teamMemberIds,
        status: 'To Do',
        tasks_count: 0,
        tags: data.tags || [],
        is_completed: false
      });
      
      if (project) {
        onOpenChange(false);
        reset();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  // Function to remove a tag directly from the tags array
  const handleRemoveTag = (indexToRemove: number) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter((_, index) => index !== indexToRemove));
  };

  // Get the current tags from the form
  const currentTags = watch('tags') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Create a new project to organize your tasks and collaborate with team members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Project Details</TabsTrigger>
              <TabsTrigger value="team">Team Members</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe the project goals, scope, and other relevant details..."
                  className="h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate', { required: 'Start date is required' })}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register('endDate', { required: 'End date is required' })}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('budget', { valueAsNumber: true })}
                  placeholder="Enter project budget (optional)"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="team">
              <TeamMembersSection 
                teamMembers={users}
                teamMemberFields={teamMemberFields}
                setValue={setValue}
                watch={watch}
                fieldArrayProps={{
                  append: appendTeamMember,
                  remove: removeTeamMember
                }}
              />
            </TabsContent>

            <TabsContent value="tags">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="newTag" className="sr-only">Add Tag</Label>
                    <div className="flex">
                      <Input
                        id="newTag"
                        placeholder="Enter a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="rounded-r-none"
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddTag} 
                        className="rounded-l-none"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {currentTags.length > 0 ? (
                    currentTags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleRemoveTag(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags added yet. Add tags to categorize your project.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
