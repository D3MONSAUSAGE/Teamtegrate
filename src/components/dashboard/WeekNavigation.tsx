
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Search, Download } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface WeekNavigationProps {
  weekStart: Date;
  weekEnd: Date;
  handleWeekChange: (direction: "prev" | "next") => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  handleSearch: () => void;
  isSearching: boolean;
  handleExport: () => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  weekStart,
  weekEnd,
  handleWeekChange,
  searchValue,
  setSearchValue,
  handleSearch,
  isSearching,
  handleExport,
  selectedDate = new Date(),
  onDateChange
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="modern-card p-6 space-y-4 animate-fade-in">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Week Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWeekChange("prev")}
            disabled={isSearching}
            className="interactive-button border-border/60 hover:border-primary/60 bg-white/50 dark:bg-card/50 backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="glass-card px-4 py-2 rounded-lg border border-border/40">
            <div className="text-sm font-semibold text-foreground">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleWeekChange("next")}
            disabled={isSearching}
            className="interactive-button border-border/60 hover:border-primary/60 bg-white/50 dark:bg-card/50 backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {onDateChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="interactive-button border-border/60 hover:border-primary/60 bg-white/50 dark:bg-card/50 backdrop-blur-sm flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {format(selectedDate, 'MMM d, yyyy')}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 glass-card border-border/60" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onDateChange(date)}
                  initialFocus
                  className="rounded-lg"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Search and Export */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by date (YYYY-MM-DD)"
              className="pl-10 bg-white/50 dark:bg-input/50 backdrop-blur-sm border-border/60 focus:border-primary/60"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>
          
          <Button
            variant="outline"
            onClick={handleSearch}
            disabled={isSearching || !searchValue}
            className="interactive-button border-border/60 hover:border-primary/60 bg-white/50 dark:bg-card/50 backdrop-blur-sm"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="interactive-button border-border/60 hover:border-primary/60 bg-white/50 dark:bg-card/50 backdrop-blur-sm hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WeekNavigation;
