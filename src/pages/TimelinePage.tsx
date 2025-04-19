
import React from 'react';
import { useTask } from '@/contexts/task';
import { Timeline } from "@/components/ui/timeline";
import { format } from 'date-fns';
import { CheckIcon, UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import useTeamMembers from '@/hooks/useTeamMembers';

const TimelinePage = () => {
  const { tasks, projects } = useTask();
  const { teamMembers } = useTeamMembers();
  
  // Get completed tasks and projects sorted by completion date
  const completedTasks = tasks
    .filter(task => task.status === 'Completed' && task.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const completedProjects = projects
    .filter(project => project.is_completed)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(project => {
      // Find the project manager name
      const manager = teamMembers.find(member => member.id === project.managerId);
      return {
        ...project,
        completedBy: manager?.name || 'Unknown Manager'
      };
    });

  // Group items by month and year
  const timelineData = [];
  const processedMonths = new Set();

  [...completedTasks, ...completedProjects].sort((a, b) => {
    const dateA = ('completedAt' in a) ? new Date(a.completedAt!) : new Date(a.updatedAt);
    const dateB = ('completedAt' in b) ? new Date(b.completedAt!) : new Date(b.updatedAt);
    return dateB.getTime() - dateA.getTime();
  }).forEach(item => {
    const date = ('completedAt' in item) ? new Date(item.completedAt!) : new Date(item.updatedAt);
    const monthYear = format(date, 'MMMM yyyy');
    
    if (!processedMonths.has(monthYear)) {
      processedMonths.add(monthYear);
      timelineData.push({
        title: monthYear,
        content: (
          <div className="space-y-4">
            {[...completedTasks, ...completedProjects]
              .filter(entry => {
                const entryDate = ('completedAt' in entry) ? new Date(entry.completedAt!) : new Date(entry.updatedAt);
                return format(entryDate, 'MMMM yyyy') === monthYear;
              })
              .map((entry, idx) => (
                <div key={idx} className="bg-card p-4 rounded-lg border">
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
                              {('assignedToName' in entry && entry.assignedToName) ? 
                                entry.assignedToName.split(' ').map(n => n[0]).join('') : 
                                ('completedBy' in entry && entry.completedBy) ?
                                  entry.completedBy.split(' ').map(n => n[0]).join('') :
                                  <UserIcon className="h-3 w-3" />
                              }
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {('assignedToName' in entry && entry.assignedToName) ? 
                              entry.assignedToName : 
                              ('completedBy' in entry && entry.completedBy) ?
                                entry.completedBy :
                                'Unassigned'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ),
      });
    }
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Timeline</h1>
        <p className="text-muted-foreground text-sm">
          A chronological view of completed tasks and projects
        </p>
      </div>
      <Timeline data={timelineData} />
    </div>
  );
};

export default TimelinePage;
