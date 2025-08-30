import React, { useState } from 'react';
import { Menu, ChevronLeft, ChevronRight, Plus, Search, Settings, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import CalendarViewSelector from './CalendarViewSelector';
import SearchDialog from './SearchDialog';
import SettingsDialog from './SettingsDialog';

interface GoogleCalendarHeaderProps {
  selectedDate: Date;
  viewType: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onAddTask: () => void;
  onScheduleMeeting: () => void;
  onMenuToggle?: () => void;
}

const GoogleCalendarHeader: React.FC<GoogleCalendarHeaderProps> = ({
  selectedDate,
  viewType,
  onViewChange,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onAddTask,
  onScheduleMeeting,
  onMenuToggle
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getDateLabel = () => {
    switch (viewType) {
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
      default:
        return format(selectedDate, 'MMMM yyyy');
    }
  };
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="p-2" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="text-xl font-normal text-gray-700 dark:text-gray-200">
            Calendar
          </div>
        </div>
      </div>

      {/* Center section */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToday}
          className="px-4 py-2 text-sm font-medium border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Today
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h1 className="text-xl font-normal text-gray-900 dark:text-gray-100 min-w-[200px]">
          {getDateLabel()}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="p-2" onClick={() => setIsSearchOpen(true)}>
          <Search className="h-5 w-5" />
        </Button>
        
        <CalendarViewSelector 
          viewType={viewType} 
          onViewChange={onViewChange}
        />
        
        <Button variant="ghost" size="sm" className="p-2" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="sm" className="p-2" title="Grid View (Coming Soon)">
          <Grid3X3 className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={onAddTask}
          className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </Button>
      </div>

      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </header>
  );
};

export default GoogleCalendarHeader;