import { useState, useEffect, useCallback } from 'react';
import { MessageDraft } from '@/types/chat';

const DRAFT_STORAGE_KEY = 'chat_drafts';
const DRAFT_DEBOUNCE_MS = 300;

export function useDraftPersistence(roomId: string) {
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const savedDrafts = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDrafts) {
          const drafts: MessageDraft[] = JSON.parse(savedDrafts);
          const roomDraft = drafts.find(d => d.roomId === roomId);
          if (roomDraft) {
            setDraft(roomDraft.content);
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [roomId]);

  // Debounced save function
  const saveDraft = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      
      return (content: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const savedDrafts = localStorage.getItem(DRAFT_STORAGE_KEY);
            let drafts: MessageDraft[] = savedDrafts ? JSON.parse(savedDrafts) : [];
            
            // Remove existing draft for this room
            drafts = drafts.filter(d => d.roomId !== roomId);
            
            // Add new draft if content is not empty
            if (content.trim()) {
              drafts.push({
                roomId,
                content,
                timestamp: Date.now()
              });
            }
            
            // Clean old drafts (older than 7 days)
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            drafts = drafts.filter(d => d.timestamp > weekAgo);
            
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
          } catch (error) {
            console.error('Failed to save draft:', error);
          }
        }, DRAFT_DEBOUNCE_MS);
      };
    })(),
    [roomId]
  );

  const updateDraft = useCallback((content: string) => {
    setDraft(content);
    saveDraft(content);
  }, [saveDraft]);

  const clearDraft = useCallback(() => {
    setDraft('');
    saveDraft('');
  }, [saveDraft]);

  return {
    draft,
    updateDraft,
    clearDraft,
    isLoading
  };
}