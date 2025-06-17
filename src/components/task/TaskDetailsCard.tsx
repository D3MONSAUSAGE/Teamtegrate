
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TimeSelector from "@/components/ui/time-selector";
import { 
  CalendarIcon, 
  DollarSign, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { format } from "date-fns";
import { Project, TaskPriority } from '@/types';
import { UseFormReturn } from 'react-hook-form';

interface TaskDetailsCardProps {
  form: UseFormReturn<any>;
  deadlineDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  timeInput: string;
  onTimeChange: (time: string) => void;
  projects: Project[];
  currentProjectId?: string;
}

const TaskDetailsCard: React.FC<TaskDetailsCardProps> = ({
  form,
  deadlineDate,
  onDateChange,
  timeInput,
  onTimeChange,
  projects,
  currentProjectId
}) => {
  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Briefcase className="h-5 w-5" />
          Task Details
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-medium">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Enter a clear, descriptive task title..."
            className="text-base h-12 border-2 focus:border-primary"
            {...form.register('title', { required: "Title is required" })}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {String(form.formState.errors.title.message || 'Title is required')}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium">Description</Label>
          <Textarea
            id="description"
            placeholder="Provide detailed information about the task..."
            className="min-h-[120px] border-2 focus:border-primary resize-none"
            {...form.register('description')}
          />
        </div>

        {/* Priority and Project Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-medium">Priority</Label>
            <Select 
              defaultValue="Medium"
              onValueChange={(value) => form.setValue('priority', value as TaskPriority)}
            >
              <SelectTrigger className="h-12 border-2 focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Low Priority
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="High">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    High Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Project</Label>
            <Select 
              defaultValue={currentProjectId || "none"}
              onValueChange={(value) => form.setValue('projectId', value)}
              disabled={!!currentProjectId}
            >
              <SelectTrigger className="h-12 border-2 focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Deadline Section */}
        <div className="space-y-2">
          <Label className="text-base font-medium">
            Deadline <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 border-2 focus:border-primary"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadlineDate ? format(deadlineDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-2" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineDate}
                    onSelect={onDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <TimeSelector
                value={timeInput}
                onChange={onTimeChange}
                placeholder="Select time"
              />
            </div>
          </div>
        </div>

        {/* Cost Section - Moved to its own row */}
        <div className="space-y-2">
          <Label htmlFor="cost" className="text-base font-medium">Cost (Optional)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="pl-10 h-12 border-2 focus:border-primary"
              {...form.register('cost')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskDetailsCard;
