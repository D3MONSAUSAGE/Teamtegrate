
import { ChecklistSection, ChecklistItemStatus, ChecklistFrequency, ExecutionWindow } from '@/types/checklist';

// Convert Date objects to ISO strings for JSON storage
export const prepareJsonSections = (sections: ChecklistSection[]) => {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      completedAt: item.completedAt ? item.completedAt.toISOString() : undefined,
    }))
  }));
};

// Convert ISO strings back to Date objects
export const processStoredSections = (sections: any): ChecklistSection[] => {
  if (!sections || !Array.isArray(sections)) return [];
  return sections.map(section => ({
    id: section.id,
    title: section.title,
    items: Array.isArray(section.items) ? section.items.map(item => ({
      id: item.id,
      text: item.text,
      status: item.status as ChecklistItemStatus,
      notes: item.notes,
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
      completedBy: item.completedBy,
      requiredPhoto: item.requiredPhoto || false,
      photoUrl: item.photoUrl,
    })) : [],
  }));
};

export const validateChecklistStatus = (status: string): "draft" | "in-progress" | "completed" => {
  if (status === "draft" || status === "in-progress" || status === "completed") {
    return status;
  }
  return "draft";
};

export const validateChecklistFrequency = (frequency: string): ChecklistFrequency => {
  if (frequency === "once" || frequency === "daily" || frequency === "weekly" || frequency === "monthly") {
    return frequency as ChecklistFrequency;
  }
  return "once";
};

// Check if current time is within execution window
export const isWithinExecutionWindow = (window: ExecutionWindow): boolean => {
  const now = new Date();
  
  // Check date range
  if (window.startDate && now < window.startDate) return false;
  if (window.endDate && now > window.endDate) return false;
  
  // Check time range if provided
  if (window.startTime && window.endTime) {
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    
    if (currentTimeString < window.startTime || currentTimeString > window.endTime) return false;
  }
  
  return true;
};
