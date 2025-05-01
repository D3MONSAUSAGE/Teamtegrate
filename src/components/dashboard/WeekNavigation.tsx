
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-3 md:space-y-0 border-b pb-4">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleWeekChange("prev")}
          disabled={isSearching}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleWeekChange("next")}
          disabled={isSearching}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {onDateChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 ml-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden md:inline">
                  {format(selectedDate, 'MMM d, yyyy')}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex items-center space-x-2 w-full md:w-auto">
        <Input
          placeholder="Search by date (YYYY-MM-DD)"
          className="w-full md:w-[200px]"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <Button
          variant="outline"
          onClick={handleSearch}
          disabled={isSearching || !searchValue}
        >
          Search
        </Button>
        <Button
          variant="outline"
          onClick={handleExport}
          className="hidden md:flex"
        >
          Export
        </Button>
      </div>
    </div>
  );
};

export default WeekNavigation;
