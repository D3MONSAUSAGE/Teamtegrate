import { useState, useEffect, useCallback, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface FormPersistenceData {
  formData: any;
  selectedMember: string | undefined;
  selectedMembers: string[];
  deadlineDate: Date | undefined;
  timeInput: string;
  scheduledStartDate: Date | undefined;
  scheduledEndDate: Date | undefined;
  scheduledStartTime: string;
  scheduledEndTime: string;
  warningPeriodHours: number;
  isRecurring: boolean;
  recurrenceFrequency: 'weekly' | 'daily' | 'monthly';
  recurrenceInterval: number;
  recurrenceDays: number[];
  timestamp: number;
}

const STORAGE_KEY = 'task_form_draft';
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useTaskFormPersistence = (
  form: UseFormReturn<any>,
  selectedMember: string | undefined,
  selectedMembers: string[],
  deadlineDate: Date | undefined,
  timeInput: string,
  scheduledStartDate: Date | undefined,
  scheduledEndDate: Date | undefined,
  scheduledStartTime: string,
  scheduledEndTime: string,
  warningPeriodHours: number,
  isRecurring: boolean,
  recurrenceFrequency: 'weekly' | 'daily' | 'monthly',
  recurrenceInterval: number,
  recurrenceDays: number[],
  editingTask?: any
) => {
  const [hasDraft, setHasDraft] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const lastSavedData = useRef<string>('');

  // Check for existing draft on mount
  useEffect(() => {
    if (editingTask) return; // Don't restore draft when editing existing task
    
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const data: FormPersistenceData = JSON.parse(savedDraft);
        
        // Check if draft is not expired
        if (Date.now() - data.timestamp < DRAFT_EXPIRY_MS) {
          setHasDraft(true);
        } else {
          // Remove expired draft
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [editingTask]);

  // Save draft function
  const saveDraft = useCallback(() => {
    if (editingTask) return; // Don't save draft when editing existing task

    try {
      const currentData: FormPersistenceData = {
        formData: form.getValues(),
        selectedMember,
        selectedMembers,
        deadlineDate,
        timeInput,
        scheduledStartDate,
        scheduledEndDate,
        scheduledStartTime,
        scheduledEndTime,
        warningPeriodHours,
        isRecurring,
        recurrenceFrequency,
        recurrenceInterval,
        recurrenceDays,
        timestamp: Date.now()
      };

      const dataString = JSON.stringify(currentData);
      
      // Only save if data has changed
      if (dataString !== lastSavedData.current) {
        localStorage.setItem(STORAGE_KEY, dataString);
        lastSavedData.current = dataString;
        setHasDraft(true);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [
    form, selectedMember, selectedMembers, deadlineDate, timeInput,
    scheduledStartDate, scheduledEndDate, scheduledStartTime, scheduledEndTime,
    warningPeriodHours, isRecurring, recurrenceFrequency, recurrenceInterval,
    recurrenceDays, editingTask
  ]);

  // Auto-save draft with debouncing
  useEffect(() => {
    if (editingTask) return;

    const timeoutId = setTimeout(saveDraft, 1000); // Debounce for 1 second
    return () => clearTimeout(timeoutId);
  }, [saveDraft, editingTask]);

  // Restore draft function
  const restoreDraft = useCallback((
    setSelectedMember: (value: string | undefined) => void,
    setSelectedMembers: (value: string[]) => void,
    setDeadlineDate: (value: Date | undefined) => void,
    setTimeInput: (value: string) => void,
    setScheduledStartDate: (value: Date | undefined) => void,
    setScheduledEndDate: (value: Date | undefined) => void,
    setScheduledStartTime: (value: string) => void,
    setScheduledEndTime: (value: string) => void,
    setWarningPeriodHours: (value: number) => void,
    setIsRecurring: (value: boolean) => void,
    setRecurrenceFrequency: (value: 'weekly' | 'daily' | 'monthly') => void,
    setRecurrenceInterval: (value: number) => void,
    setRecurrenceDays: (value: number[]) => void
  ) => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const data: FormPersistenceData = JSON.parse(savedDraft);
        
        // Check if draft is not expired
        if (Date.now() - data.timestamp < DRAFT_EXPIRY_MS) {
          // Restore form data
          Object.keys(data.formData).forEach(key => {
            form.setValue(key, data.formData[key]);
          });
          
          // Restore state data
          setSelectedMember(data.selectedMember);
          setSelectedMembers(data.selectedMembers || []);
          setDeadlineDate(data.deadlineDate ? new Date(data.deadlineDate) : undefined);
          setTimeInput(data.timeInput || '09:00');
          setScheduledStartDate(data.scheduledStartDate ? new Date(data.scheduledStartDate) : undefined);
          setScheduledEndDate(data.scheduledEndDate ? new Date(data.scheduledEndDate) : undefined);
          setScheduledStartTime(data.scheduledStartTime || '');
          setScheduledEndTime(data.scheduledEndTime || '');
          setWarningPeriodHours(data.warningPeriodHours || 24);
          setIsRecurring(data.isRecurring || false);
          setRecurrenceFrequency(data.recurrenceFrequency || 'weekly');
          setRecurrenceInterval(data.recurrenceInterval || 1);
          setRecurrenceDays(data.recurrenceDays || [1]);
          
          setIsDraftRestored(true);
          setHasDraft(false);
          
          return true;
        } else {
          // Remove expired draft
          localStorage.removeItem(STORAGE_KEY);
          setHasDraft(false);
        }
      }
    } catch (error) {
      console.error('Error restoring draft:', error);
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
    }
    
    return false;
  }, [form]);

  // Clear draft function
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
      setIsDraftRestored(false);
      lastSavedData.current = '';
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, []);

  return {
    hasDraft,
    isDraftRestored,
    restoreDraft,
    clearDraft,
    saveDraft
  };
};