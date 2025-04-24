
// Utility to merge and group items for the timeline
import { format } from "date-fns";
import { CheckIcon, UserIcon, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React from "react";

export function buildTimelineData({ tasks, projects, teamMembers, journalEntries }) {
  // Gather all timeline items (tasks, projects, journal entries)
  const allItems: any[] = [
    ...tasks
      .filter(task => task.status === 'Completed' && task.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .map(task => ({
        type: "task",
        ...task,
        date: task.completedAt,
      })),
    ...projects
      .filter(project => project.is_completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map(project => {
        const manager = teamMembers.find(member => member.id === project.managerId);
        return {
          type: "project",
          ...project,
          date: project.updatedAt,
          completedBy: manager?.name || "Unknown Manager"
        };
      }),
    ...(journalEntries || []).map(entry => ({
      type: "journal",
      ...entry,
      date: entry.created_at,
    })),
  ];

  // Group by month/year for timeline display
  allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const processedMonths = new Set();
  const timelineData = [];

  for (const item of allItems) {
    const dateObj = new Date(item.date);
    const monthYear = format(dateObj, 'MMMM yyyy');
    if (!processedMonths.has(monthYear)) {
      processedMonths.add(monthYear);
      timelineData.push({
        title: monthYear,
        content: (
          <div className="space-y-4">
            {allItems
              .filter(x => format(new Date(x.date), 'MMMM yyyy') === monthYear)
              .map((entry, idx) => {
                if (entry.type === "journal") {
                  // Journal entry display
                  const showName = entry.is_public && entry.author_name;
                  return (
                    <div key={entry.id || idx} className="bg-card p-4 rounded-lg border flex gap-3 items-start">
                      <div className="pt-1">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-foreground flex gap-2 items-center">
                          {entry.title}
                          <span className="text-xs px-2 py-0.5 rounded ml-2 bg-muted/50 text-muted-foreground">
                            {entry.is_public ? "Public" : "Personal"}
                          </span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.content}</p>
                        <div className="flex justify-between items-end mt-2">
                          <p className="text-xs text-muted-foreground">
                            Journal entry · {format(new Date(entry.created_at), 'MMM d, yyyy')}
                          </p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {entry.is_public
                                  ? (showName
                                      ? (entry.author_name || "U")
                                        .split(" ")
                                        .map((str: string) => str[0])
                                        .join("")
                                      : "T")
                                  : "Y"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {entry.is_public
                                ? (showName ? entry.author_name : "Team")
                                : "You"
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default: tasks/projects
                return (
                  <div key={entry.id || idx} className="bg-card p-4 rounded-lg border">
                    <div className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-foreground">
                          {'projectId' in entry ? entry.title : `Project: ${entry.title}`}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            Completed on {format(
                              ('completedAt' in entry) ? new Date(entry.completedAt!) : new Date(entry.updatedAt),
                              'MMM d, yyyy'
                            )}
                          </p>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {('completedByName' in entry && entry.completedByName) ? 
                                  entry.completedByName.split(' ').map((n: string) => n[0]).join('') : 
                                  ('completedBy' in entry && entry.completedBy) ?
                                    entry.completedBy.split(' ').map((n: string) => n[0]).join('') :
                                    <UserIcon className="h-3 w-3" />
                                }
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {'Completed by '}
                              {('completedByName' in entry && entry.completedByName) ? 
                                entry.completedByName : 
                                ('completedBy' in entry && entry.completedBy) ?
                                  entry.completedBy :
                                  'Unknown'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ),
      });
    }
  }
  return timelineData;
}
