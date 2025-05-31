
import React from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { TaskFormValues } from '@/types';
import { TaskAssigneeSelect } from './TaskAssigneeSelect';

interface TaskAssignmentSectionProps {
  register: UseFormRegister<TaskFormValues>;
  selectedMember: string;
  setSelectedMember: React.Dispatch<React.SetStateAction<string>>;
  setValue: UseFormSetValue<TaskFormValues>;
}

const TaskAssignmentSection: React.FC<TaskAssignmentSectionProps> = ({
  register,
  selectedMember,
  setSelectedMember,
  setValue
}) => {
  return (
    <div className="space-y-4">
      <TaskAssigneeSelect
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        setValue={setValue}
      />
    </div>
  );
};

export default TaskAssignmentSection;
