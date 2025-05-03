
import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { FileCheck2 } from "lucide-react";
import { Task } from "@/types";

interface CompletedTasksTableProps {
  completedTasks: Task[];
}

const CompletedTasksTable: React.FC<CompletedTasksTableProps> = ({ completedTasks }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileCheck2 size={18}/> Completed Tasks This Week</CardTitle>
      </CardHeader>
      <CardContent>
        {completedTasks.length === 0 ? (
          <div className="text-muted-foreground">No tasks completed this week.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell>
                    {(task.completedAt || task.updatedAt) 
                      ? format(new Date(task.completedAt || task.updatedAt), "MMM d") 
                      : "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] whitespace-pre-line">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    {task.projectId ? 
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs">Project</span>
                      : <span className="px-2 py-1 bg-neutral-100 text-muted-foreground rounded-md text-xs">Personal</span>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletedTasksTable;
