
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Search, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WeekSelectorProps {
  weekStart: Date;
  weekEnd: Date;
  onWeekChange: (direction: "prev" | "next") => void;
  onExportCsv: () => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({
  weekStart,
  weekEnd,
  onWeekChange,
  onExportCsv,
}) => {
  const [searchValue, setSearchValue] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    let date: Date | null = null;
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(searchValue)) {
        date = new Date(searchValue);
      } else if (/^\d{4}-\d{2}$/.test(searchValue)) {
        date = new Date(searchValue + "-01");
      } else {
        throw new Error("Invalid date format");
      }
      if (date && !isNaN(date.getTime())) {
        onWeekChange(date > weekStart ? "next" : "prev");
      }
    } catch (error) {
      toast.error('Invalid date format. Please use YYYY-MM-DD or YYYY-MM');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onWeekChange("prev")}
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
          onClick={() => onWeekChange("next")}
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
          onClick={onExportCsv}
          variant="secondary"
          title="Export CSV"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </div>
  );
};

export default WeekSelector;
