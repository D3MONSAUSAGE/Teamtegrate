
import React from 'react';
import { Project, Task } from '@/types';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock, AlertTriangle, Zap, Star, Target, DollarSign } from "lucide-react";

interface TaskFormFieldsEnhancedProps {
  register: any;
  errors: any;
  setValue: any;
  selectedMember: string | undefined;
  setSelectedMember: (id: string | undefined) => void;
  projects: Project[];
  editingTask?: Task;
  currentProjectId?: string;
  date: Date | undefined;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
}

const TaskFormFieldsEnhanced: React.FC<TaskFormFieldsEnhancedProps> = ({
  register,
  errors,
  setValue,
  projects,
  editingTask,
  currentProjectId,
  date,
  timeInput,
  onDateChange,
  onTimeChange
}) => {
  const [selectedPriority, setSelectedPriority] = React.useState(editingTask?.priority || "Medium");

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    const timeValue = typeof e === 'string' ? e : e.target.value;
    onTimeChange(timeValue);
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'High': return <Zap className="h-4 w-4 text-red-600" />;
      case 'Medium': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'Low': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Star className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200';
    }
  };

  const priorityOptions = [
    { value: 'Low', label: 'Low Priority', description: 'Can be done when time permits' },
    { value: 'Medium', label: 'Medium Priority', description: 'Standard priority task' },
    { value: 'High', label: 'High Priority', description: 'Urgent, needs immediate attention' }
  ];

  const quickDatePresets = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'This Week', days: 7 },
    { label: 'Next Week', days: 14 },
  ];

  const handleQuickDate = (days: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Title Field */}
      <Card className="border-2 border-border/30 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <Label htmlFor="title" className="font-medium">
              Task Title <span className="text-red-500">*</span>
            </Label>
          </div>
          <Input
            id="title"
            placeholder="Enter a clear, descriptive task title..."
            className="border-2 focus:border-primary/50 transition-colors"
            {...register('title', { required: "Title is required" })}
          />
          {errors.title && (
            <p className="text-sm font-medium text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {errors.title.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Description Field */}
      <Card className="border-2 border-border/30 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label htmlFor="description" className="font-medium">Description</Label>
          <Textarea
            id="description"
            placeholder="Provide detailed information about this task..."
            className="resize-none h-24 border-2 focus:border-primary/50 transition-colors"
            {...register('description')}
          />
        </CardContent>
      </Card>

      {/* Priority and Project Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Enhanced Priority Field */}
        <Card className="border-2 border-border/30 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <Label className="font-medium">Priority Level</Label>
            <Select 
              value={selectedPriority} 
              onValueChange={(value) => {
                setSelectedPriority(value);
                setValue('priority', value);
              }}
            >
              <SelectTrigger className="border-2 focus:border-primary/50">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(selectedPriority)}
                    <span>{selectedPriority}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-2">
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2 py-1">
                      {getPriorityIcon(option.value)}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge className={cn("text-xs", getPriorityColor(selectedPriority))}>
              {getPriorityIcon(selectedPriority)}
              <span className="ml-1">{selectedPriority} Priority</span>
            </Badge>
          </CardContent>
        </Card>

        {/* Project Field */}
        <Card className="border-2 border-border/30 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <Label className="font-medium">Project</Label>
            <Select 
              defaultValue={currentProjectId || editingTask?.projectId || "none"}
              onValueChange={(value) => setValue('projectId', value)}
            >
              <SelectTrigger className="border-2 focus:border-primary/50">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-2">
                <SelectItem value="none">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      {project.title}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Deadline Picker */}
      <Card className="border-2 border-border/30 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <Label className="font-medium">Deadline</Label>
          </div>
          
          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-2">
            {quickDatePresets.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(preset.days)}
                className="text-xs hover:bg-primary/10 hover:border-primary/40 transition-colors"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-2 hover:border-primary/40",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur-xl border-2">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onDateChange}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={timeInput}
                  onChange={handleTimeChange}
                  className="pl-10 border-2 focus:border-primary/50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Field */}
      <Card className="border-2 border-border/30 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <Label htmlFor="cost" className="font-medium">Cost (Optional)</Label>
          </div>
          <Input
            id="cost"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="border-2 focus:border-primary/50 transition-colors"
            {...register('cost')}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskFormFieldsEnhanced;
