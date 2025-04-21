
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChecklistTemplate } from '@/types/checklist';
import { useChecklists } from '@/contexts/checklists';
import { toast } from '@/components/ui/sonner';
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface UseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ChecklistTemplate | null;
}

const createChecklistSchema = z.object({
  branch: z.string().min(1, "Branch is required"),
  enableExecutionWindow: z.boolean().default(false),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

type CreateChecklistFormValues = z.infer<typeof createChecklistSchema>;

const UseTemplateDialog: React.FC<UseTemplateDialogProps> = ({ open, onOpenChange, template }) => {
  const { addChecklist } = useChecklists();
  const form = useForm<CreateChecklistFormValues>({
    resolver: zodResolver(createChecklistSchema),
    defaultValues: {
      branch: "",
      enableExecutionWindow: false,
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      startTime: "08:00",
      endTime: "18:00",
    },
  });
  
  const { watch } = form;
  const enableExecutionWindow = watch("enableExecutionWindow");
  
  if (!template) return null;
  
  const onSubmit = async (data: CreateChecklistFormValues) => {
    try {
      const executionWindow = data.enableExecutionWindow 
        ? {
            startDate: data.startDate,
            endDate: data.endDate,
            startTime: data.startTime,
            endTime: data.endTime,
          } 
        : undefined;
      
      await addChecklist({
        title: template.title,
        description: template.description,
        sections: template.sections,
        templateId: template.id,
        branch: data.branch,
        startDate: new Date(),
        status: 'draft',
        executionWindow: executionWindow,
      });
      
      toast.success("Checklist created successfully");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error creating checklist:', error);
      toast.error("Failed to create checklist");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Checklist from Template</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{template.title}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {template.branchOptions && template.branchOptions.length > 0 ? (
                          template.branchOptions.map(branch => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="main">Main</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enableExecutionWindow"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set Execution Window</FormLabel>
                      <FormDescription>
                        Limit when this checklist can be executed
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {enableExecutionWindow && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  const startDate = form.getValues().startDate;
                                  return startDate && date < startDate;
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Checklist</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UseTemplateDialog;
