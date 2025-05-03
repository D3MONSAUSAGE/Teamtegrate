
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, FileCheck2, FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DailySummaryCardProps {
  totalHours: string;
  loading: boolean;
  completedTasksCount: number;
  completedProjectTasksCount: number;
  completedPersonalTasksCount: number;
  formattedDate: string;
}

const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  totalHours,
  loading,
  completedTasksCount,
  completedProjectTasksCount,
  completedPersonalTasksCount,
  formattedDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Daily Performance Summary ({formattedDate})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:gap-12">
        <div className="flex flex-col gap-1 min-w-[150px]">
          <span className="text-muted-foreground text-xs">Total Hours Tracked</span>
          <span className="text-2xl font-bold text-primary">{loading ? <Skeleton className="w-14 h-6" /> : `${totalHours} h`}</span>
        </div>
        <div className="flex flex-col gap-1 min-w-[150px]">
          <span className="text-muted-foreground text-xs flex gap-1 items-center"><FileCheck2 size={14}/>Completed Tasks</span>
          <span className="text-xl font-semibold">{completedTasksCount}</span>
        </div>
        <div className="flex flex-col gap-1 min-w-[150px]">
          <span className="text-muted-foreground text-xs flex gap-1 items-center"><FolderKanban size={14}/>Project Tasks Done</span>
          <span className="text-xl font-semibold">{completedProjectTasksCount}</span>
        </div>
        <div className="flex flex-col gap-1 min-w-[150px]">
          <span className="text-muted-foreground text-xs">Personal Tasks Done</span>
          <span className="text-xl font-semibold">{completedPersonalTasksCount}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailySummaryCard;
