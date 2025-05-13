
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Task } from "@/types";
import { format } from "date-fns";

/**
 * Validates a date string
 */
const isValidDateString = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

export const useTaskForm = (
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

  // Format the deadline for form display
  const formatDateForForm = (date: Date | string | undefined): string => {
    try {
      if (!date) return '';
      
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        console.warn(`Invalid date: ${date}, using default`);
        return format(getDefaultDeadline(), 'yyyy-MM-dd');
      }
      
      return format(dateObj, 'yyyy-MM-dd');
    } catch (error) {
      console.warn('Error formatting date for form:', error);
      return format(getDefaultDeadline(), 'yyyy-MM-dd');
    }
  };

  // Setup form with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      title: editingTask?.title || "",
      description: editingTask?.description || "",
      priority: editingTask?.priority || "Medium",
      projectId: currentProjectId || editingTask?.projectId || "none",
      deadline: formatDateForForm(editingTask?.deadline || getDefaultDeadline()),
      assignedToName: editingTask?.assignedToName || ""
    }
  });

  // State for member selection
  const [selectedMember, setSelectedMember] = useState<string | undefined>(editingTask?.assignedToId);

  // Reset form if editingTask changes
  useEffect(() => {
    if (editingTask) {
      reset({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        projectId: currentProjectId || editingTask.projectId || "none",
        deadline: formatDateForForm(editingTask.deadline),
        assignedToName: editingTask.assignedToName
      });
      setSelectedMember(editingTask.assignedToId);
    } else {
      reset({
        title: "",
        description: "",
        priority: "Medium",
        projectId: currentProjectId || "none",
        deadline: formatDateForForm(getDefaultDeadline()),
        assignedToName: ""
      });
      setSelectedMember(undefined);
    }
  }, [editingTask, currentProjectId, reset]);

  return {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    watch,
    selectedMember,
    setSelectedMember
  };
};

export default useTaskForm;
