
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

interface KeyboardShortcutsConfig {
  onNewTask?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig = {}) => {
  const navigate = useNavigate();

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    // Cmd/Ctrl + K for search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      if (config.onSearch) {
        config.onSearch();
      } else {
        toast.info('Search functionality', {
          description: 'Press Cmd/Ctrl + K to search (feature coming soon)'
        });
      }
      return;
    }

    // Cmd/Ctrl + N for new task
    if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
      event.preventDefault();
      if (config.onNewTask) {
        config.onNewTask();
      } else {
        navigate('/dashboard/tasks/create');
      }
      return;
    }

    // Cmd/Ctrl + R for refresh
    if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
      event.preventDefault();
      if (config.onRefresh) {
        config.onRefresh();
      } else {
        window.location.reload();
      }
      return;
    }

    // Single key shortcuts (only when not in input fields)
    switch (event.key) {
      case '1':
        event.preventDefault();
        navigate('/dashboard');
        break;
      case '2':
        event.preventDefault();
        navigate('/dashboard/tasks');
        break;
      case '3':
        event.preventDefault();
        navigate('/dashboard/projects');
        break;
      case '4':
        event.preventDefault();
        navigate('/dashboard/calendar');
        break;
      case '5':
        event.preventDefault();
        navigate('/dashboard/focus');
        break;
      case '6':
        event.preventDefault();
        navigate('/dashboard/chat');
        break;
      case '?':
        event.preventDefault();
        showShortcutsHelp();
        break;
    }
  }, [navigate, config]);

  const showShortcutsHelp = () => {
    toast.info('Keyboard Shortcuts', {
      description: (
        <div className="space-y-1 text-sm">
          <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Cmd/Ctrl + N</kbd> New Task</div>
          <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Cmd/Ctrl + K</kbd> Search</div>
          <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">1-6</kbd> Navigate Pages</div>
          <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">?</kbd> Show Shortcuts</div>
        </div>
      ),
      duration: 5000
    });
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return { showShortcutsHelp };
};
