
import React from 'react';
import TaskScheduleSection from '../form/TaskScheduleSection';

interface MobileTaskScheduleProps {
  scheduledStartDate: Date | undefined;
  scheduledEndDate: Date | undefined;
  scheduledStartTime: string;
  scheduledEndTime: string;
  onScheduledStartDateChange: (date: Date | undefined) => void;
  onScheduledEndDateChange: (date: Date | undefined) => void;
  onScheduledStartTimeChange: (time: string) => void;
  onScheduledEndTimeChange: (time: string) => void;
}

const MobileTaskSchedule: React.FC<MobileTaskScheduleProps> = ({
  scheduledStartDate,
  scheduledEndDate,
  scheduledStartTime,
  scheduledEndTime,
  onScheduledStartDateChange,
  onScheduledEndDateChange,
  onScheduledStartTimeChange,
  onScheduledEndTimeChange
}) => {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-3">
        Set specific start and end times for this task
      </p>
      <TaskScheduleSection
        scheduledStartDate={scheduledStartDate}
        scheduledEndDate={scheduledEndDate}
        scheduledStartTime={scheduledStartTime}
        scheduledEndTime={scheduledEndTime}
        onScheduledStartDateChange={onScheduledStartDateChange}
        onScheduledEndDateChange={onScheduledEndDateChange}
        onScheduledStartTimeChange={onScheduledStartTimeChange}
        onScheduledEndTimeChange={onScheduledEndTimeChange}
      />
    </div>
  );
};

export default MobileTaskSchedule;
