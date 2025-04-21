
import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ExecutionWindowOptionsProps {
  enableExecutionWindow: boolean;
  setEnableExecutionWindow: (v: boolean) => void;
  executionStartDate: Date | null;
  setExecutionStartDate: (d: Date | null) => void;
  executionEndDate: Date | null;
  setExecutionEndDate: (d: Date | null) => void;
  executionStartTime: string;
  setExecutionStartTime: (t: string) => void;
  executionEndTime: string;
  setExecutionEndTime: (t: string) => void;
}

const ExecutionWindowOptions: React.FC<ExecutionWindowOptionsProps> = ({
  enableExecutionWindow,
  setEnableExecutionWindow,
  executionStartDate,
  setExecutionStartDate,
  executionEndDate,
  setExecutionEndDate,
  executionStartTime,
  setExecutionStartTime,
  executionEndTime,
  setExecutionEndTime,
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted">
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="enable-execution-window"
          checked={enableExecutionWindow}
          onChange={e => setEnableExecutionWindow(e.target.checked)}
          className="mr-2"
        />
        <label
          htmlFor="enable-execution-window"
          className="font-medium select-none"
        >
          Set Execution Window
        </label>
      </div>
      {enableExecutionWindow && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                    {executionStartDate
                      ? format(executionStartDate, "PPP")
                      : <span>Pick a date</span>
                    }
                    <span className="ml-auto pl-2">
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={executionStartDate ?? undefined}
                    onSelect={setExecutionStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    disabled={date => executionEndDate ? date > executionEndDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                    {executionEndDate
                      ? format(executionEndDate, "PPP")
                      : <span>Pick a date</span>
                    }
                    <span className="ml-auto pl-2">
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={executionEndDate ?? undefined}
                    onSelect={setExecutionEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                    disabled={date => executionStartDate ? date < executionStartDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                type="time"
                className="w-full border rounded-md px-3 py-2"
                value={executionStartTime}
                onChange={e => setExecutionStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Time
              </label>
              <input
                type="time"
                className="w-full border rounded-md px-3 py-2"
                value={executionEndTime}
                onChange={e => setExecutionEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionWindowOptions;

