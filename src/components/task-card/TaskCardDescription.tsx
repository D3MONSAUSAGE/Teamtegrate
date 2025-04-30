
import React from 'react';

interface TaskCardDescriptionProps {
  description: string;
}

const TaskCardDescription: React.FC<TaskCardDescriptionProps> = ({ description }) => {
  return (
    <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
      {description}
    </p>
  );
};

export default TaskCardDescription;
