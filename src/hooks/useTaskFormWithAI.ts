
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Task } from "@/types";
import { format } from "date-fns";

export const useTaskFormWithAI = (
  editingTask?: Task,
  currentProjectId?: string
) => {
  // Create a default deadline date (tomorrow at noon)
  const getDefaultDeadline = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return tomorrow;
  };

  // Parse and validate a date with fallback
  const parseAndValidateDate = (date: Date | string | undefined): Date => {
    if (!date) return getDefaultDeadline();
    
    try {
      const parsedDate = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(parsedDate.getTime())) {
        console.warn(`Invalid date: ${date}, using default deadline`);
        return getDefaultDeadline();
      }
      return parsedDate;
    } catch (error) {
      console.warn('Error parsing date:', error);
      return getDefaultDeadline();
    }
  };

  // Initialize state for the deadline date and time
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(
    editingTask ? parseAndValidateDate(editingTask.deadline) : getDefaultDeadline()
  );
  
  // Format time for input field (HH:MM)
  const formatTimeForInput = (date: Date | undefined): string => {
    if (!date) return "12:00";
    try {
      return format(date, "HH:mm");
    } catch {
      return "12:00";
    }
  };
  
  const [timeInput, setTimeInput] = useState<string>(
    editingTask?.deadline ? formatTimeForInput(parseAndValidateDate(editingTask.deadline)) : "12:00"
  );

  // Setup form with react-hook-form
  const form = useForm({
    defaultValues: {
      title: editingTask?.title || "",
      description: editingTask?.description || "",
      priority: editingTask?.priority || "Medium",
      projectId: currentProjectId || editingTask?.projectId || "none",
      deadline: editingTask?.deadline ? parseAndValidateDate(editingTask.deadline) : getDefaultDeadline(),
      assignedToName: editingTask?.assignedToName || ""
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;

  // State for member selection
  const [selectedMember, setSelectedMember] = useState<string | undefined>(editingTask?.assignedToId);

  // Handle date changes
  const handleDateChange = (date: Date | undefined) => {
    setDeadlineDate(date);
    
    // If we have both date and time, update the deadline
    if (date && timeInput) {
      const [hours, minutes] = timeInput.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 12, minutes || 0, 0, 0);
      setValue("deadline", newDate);
    }
  };

  // Handle time changes
  const handleTimeChange = (time: string) => {
    setTimeInput(time);
    
    // If we have both date and time, update the deadline
    if (deadlineDate && time) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(deadlineDate);
      newDate.setHours(hours || 12, minutes || 0, 0, 0);
      setValue("deadline", newDate);
    }
  };

  // Reset form if editingTask changes
  useEffect(() => {
    if (editingTask) {
      const taskDeadline = parseAndValidateDate(editingTask.deadline);
      
      reset({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        projectId: currentProjectId || editingTask.projectId || "none",
        deadline: taskDeadline,
        assignedToName: editingTask.assignedToName
      });
      
      setDeadlineDate(taskDeadline);
      setTimeInput(formatTimeForInput(taskDeadline));
      setSelectedMember(editingTask.assignedToId);
    } else {
      const defaultDeadline = getDefaultDeadline();
      
      reset({
        title: "",
        description: "",
        priority: "Medium",
        projectId: currentProjectId || "none",
        deadline: defaultDeadline,
        assignedToName: ""
      });
      
      setDeadlineDate(defaultDeadline);
      setTimeInput(formatTimeForInput(defaultDeadline));
      setSelectedMember(undefined);
    }
  }, [editingTask, currentProjectId, reset]);

  return {
    form,
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    watch,
    selectedMember,
    setSelectedMember,
    deadlineDate,
    timeInput,
    handleDateChange,
    handleTimeChange
  };
};

export default useTaskFormWithAI;
