
import React from "react";

interface TaskCardDescriptionProps {
  description: string;
}

const TaskCardDescription: React.FC<TaskCardDescriptionProps> = ({ description }) => {
  return (
    <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
      {description}
    </div>
  );
};

export default TaskCardDescription;
