import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_STORAGE_KEY = 'label_drafts';
const DRAFT_DEBOUNCE_MS = 500;
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface LabelDraftData {
  // Meta
  selectedItemId: string;
  selectedTemplate: string;
  timestamp: number;
  
  // Company Info
  companyName: string;
  companyAddress: string;
  netWeight: string;
  lotCode: string;
  expirationDate: string;
  
  // Nutritional Info
  ingredients: string;
  servingSize: string;
  servingsPerContainer: string;
  calories: string;
  totalFat: string;
  saturatedFat: string;
  transFat: string;
  cholesterol: string;
  sodium: string;
  totalCarbs: string;
  dietaryFiber: string;
  totalSugars: string;
  addedSugars: string;
  protein: string;
  vitaminD: string;
  calcium: string;
  iron: string;
  potassium: string;
  allergens: string;
  
  // Other
  quantityToPrint: number;
  barcodeValue: string;
}

export function useLabelDraftPersistence(draftKey: string = 'default') {
  const [draftData, setDraftData] = useState<Partial<LabelDraftData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Load draft on mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (stored) {
          const drafts = JSON.parse(stored);
          const draft = drafts[draftKey];
          
          if (draft) {
            // Check if draft is not too old
            const age = Date.now() - draft.timestamp;
            if (age < DRAFT_MAX_AGE_MS) {
              setDraftData(draft);
              setLastSaved(draft.timestamp);
              console.log('📄 Label draft restored:', draftKey);
              return draft;
            } else {
              console.log('🗑️ Label draft expired, clearing:', draftKey);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load label draft:', error);
      } finally {
        setIsLoading(false);
      }
      return null;
    };
    
    loadDraft();
  }, [draftKey]);

  // Debounced save function
  const saveDraft = useCallback((data: Partial<LabelDraftData>) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      try {
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
        const drafts = stored ? JSON.parse(stored) : {};
        
        const newDraft = {
          ...drafts[draftKey],
          ...data,
          timestamp: Date.now()
        };

        drafts[draftKey] = newDraft;
        
        // Clean up old drafts
        Object.keys(drafts).forEach(key => {
          const age = Date.now() - drafts[key].timestamp;
          if (age > DRAFT_MAX_AGE_MS) {
            delete drafts[key];
            console.log('🗑️ Cleaned up old draft:', key);
          }
        });
        
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
        setLastSaved(Date.now());
        console.log('💾 Label draft saved:', draftKey);
      } catch (error) {
        console.error('Failed to save label draft:', error);
        // Check if quota exceeded
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('⚠️ localStorage quota exceeded, clearing old drafts');
          try {
            // Try to clear all drafts and save just this one
            const newDrafts = {
              [draftKey]: {
                ...data,
                timestamp: Date.now()
              }
            };
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(newDrafts));
          } catch (e) {
            console.error('Failed to save even after clearing:', e);
          }
        }
      }
    }, DRAFT_DEBOUNCE_MS);
  }, [draftKey]);

  const updateDraft = useCallback((data: Partial<LabelDraftData>) => {
    setDraftData(prev => ({ ...prev, ...data }));
    saveDraft(data);
  }, [saveDraft]);
  
  const clearDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const drafts = JSON.parse(stored);
        delete drafts[draftKey];
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      }
      setDraftData(null);
      setLastSaved(null);
      console.log('🗑️ Label draft cleared:', draftKey);
    } catch (error) {
      console.error('Failed to clear label draft:', error);
    }
  }, [draftKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return {
    draftData,
    isLoading,
    lastSaved,
    updateDraft,
    clearDraft
  };
}
