
import React from 'react';
import { useProjectReportsData } from './projects/hooks/useProjectReportsData';
import { CHART_COLORS, STATUS_COLORS } from './projects/constants';
import ProjectCompletionRatesChart from './projects/ProjectCompletionRatesChart';
import ProjectTasksByStatusChart from './projects/ProjectTasksByStatusChart';
import ProjectTimelineChart from './projects/ProjectTimelineChart';

const ProjectReports: React.FC = () => {
  const { projectStatus, projectTasksByStatus, onTimeCompletionData } = useProjectReportsData();
  
  return (
    <div className="space-y-6">
      {/* Project Completion Rates */}
      <ProjectCompletionRatesChart projectStatus={projectStatus} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Tasks by Status */}
        <ProjectTasksByStatusChart 
          projectTasksByStatus={projectTasksByStatus} 
          statusColors={STATUS_COLORS} 
        />
        
        {/* Project On-Time Completion */}
        <ProjectTimelineChart 
          onTimeCompletionData={onTimeCompletionData} 
          colors={CHART_COLORS} 
        />
      </div>
    </div>
  );
};

export default ProjectReports;
