
// Task validation utilities to prevent UUID empty string errors

export const validateTaskAssignment = (assignedToId?: string, assignedToIds?: string[]): boolean => {
  // Check single assignment
  if (assignedToId !== undefined && assignedToId !== null) {
    if (assignedToId.trim() === '') {
      return false;
    }
  }
  
  // Check multiple assignments
  if (assignedToIds !== undefined && assignedToIds !== null) {
    if (assignedToIds.some(id => id === null || id === undefined || id.trim() === '')) {
      return false;
    }
  }
  
  return true;
};

export const sanitizeTaskAssignment = (data: any) => {
  // Clean up assigned_to_id - convert empty strings to null
  if (data.assigned_to_id !== undefined) {
    data.assigned_to_id = data.assigned_to_id && data.assigned_to_id.trim() !== '' 
      ? data.assigned_to_id.trim() 
      : null;
  }
  
  // Clean up assigned_to_ids - filter out empty strings and nulls
  if (data.assigned_to_ids !== undefined) {
    if (Array.isArray(data.assigned_to_ids)) {
      data.assigned_to_ids = data.assigned_to_ids
        .filter(id => id !== null && id !== undefined && id.trim() !== '')
        .map(id => id.trim());
      
      // Set to null if array is empty
      if (data.assigned_to_ids.length === 0) {
        data.assigned_to_ids = null;
      }
    } else {
      data.assigned_to_ids = null;
    }
  }
  
  // Clean up assigned_to_names to match assigned_to_ids
  if (data.assigned_to_names !== undefined) {
    if (!data.assigned_to_ids || !Array.isArray(data.assigned_to_ids)) {
      data.assigned_to_names = null;
    } else if (Array.isArray(data.assigned_to_names)) {
      // Ensure assigned_to_names has same length as assigned_to_ids
      data.assigned_to_names = data.assigned_to_names
        .slice(0, data.assigned_to_ids.length)
        .filter(name => name !== null && name !== undefined && name.trim() !== '')
        .map(name => name.trim());
      
      if (data.assigned_to_names.length === 0) {
        data.assigned_to_names = null;
      }
    }
  }
  
  return data;
};

export const createTaskValidationSchema = () => {
  return {
    beforeSubmit: (data: any) => {
      // Validate assignment data
      if (!validateTaskAssignment(data.assigned_to_id, data.assigned_to_ids)) {
        throw new Error('Invalid task assignment data: empty strings not allowed in UUID fields');
      }
      
      // Sanitize data
      return sanitizeTaskAssignment(data);
    }
  };
};
