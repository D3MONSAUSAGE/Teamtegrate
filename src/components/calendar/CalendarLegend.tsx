
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';
import { generateProjectBadgeColor } from '@/utils/colorUtils';

interface CalendarLegendProps {
  projects: Project[];
  isVisible: boolean;
}

const CalendarLegend: React.FC<CalendarLegendProps> = ({ projects, isVisible }) => {
  if (!isVisible || projects.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Project Color Legend</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${generateProjectBadgeColor(project.id, project.name)}`} />
            <span className="text-xs text-muted-foreground">{project.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span className="text-xs text-muted-foreground">No Project</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarLegend;
