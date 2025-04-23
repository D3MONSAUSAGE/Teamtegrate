
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Search, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface WeekNavigationProps {
  weekStart: Date;
  weekEnd: Date;
  handleWeekChange: (dir: "prev" | "next") => void;
  searchValue: string;
  setSearchValue: (val: string) => void;
  handleSearch: () => void;
  isSearching: boolean;
  handleExport: () => void;
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
}) => (
  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <div className="flex gap-2 items-center">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleWeekChange("prev")}
        title="Previous week"
      >
        <CalendarDays className="h-4 w-4" />
        <span className="sr-only">Previous Week</span>
      </Button>
      <span className="font-medium">
        {format(weekStart, "MMM dd, yyyy")} - {format(weekEnd, "MMM dd, yyyy")}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleWeekChange("next")}
        title="Next week"
      >
        <CalendarDays className="h-4 w-4 rotate-180" />
        <span className="sr-only">Next Week</span>
      </Button>
    </div>
    <div className="flex gap-2 mt-2 md:mt-0">
      <Input
        placeholder="Search week (yyyy-MM or yyyy-MM-dd)"
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        className="max-w-[170px]"
        onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
        disabled={isSearching}
      />
      <Button
        onClick={handleSearch}
        variant="outline"
        disabled={isSearching}
        title="Go"
        size="icon"
      >
        <Search className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleExport}
        variant="secondary"
        title="Export CSV"
      >
        <FileText className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  </div>
);

export default WeekNavigation;
