
import React from 'react';
import TaskDeadlinePicker from './TaskDeadlinePicker';

interface TaskDeadlineWithTimeProps {
  register: any;
  timeInput: string;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  watch: any;
  setValue: (name: string, value: any) => void;
}

const TaskDeadlineWithTime: React.FC<TaskDeadlineWithTimeProps> = ({
  register,
  timeInput,
  onTimeChange,
  watch,
  setValue
}) => {
  const deadlineValue = watch('deadline');
  const date = deadlineValue ? new Date(deadlineValue) : undefined;
  
  const handleDateChange = (newDate: Date | undefined) => {
    setValue('deadline', newDate ? newDate.toISOString().split('T')[0] : '');
  };
  
  return (
    <TaskDeadlinePicker
      date={date}
      timeInput={timeInput}
      onDateChange={handleDateChange}
      onTimeChange={onTimeChange}
    />
  );
};

export default TaskDeadlineWithTime;
