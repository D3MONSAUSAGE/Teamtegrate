
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

interface TasksTabsNavProps {
  counts: { todo: number; inprogress: number; pending: number; completed: number; };
}

const TasksTabsNav: React.FC<TasksTabsNavProps> = ({ counts }) => {
  const isMobile = useIsMobile();
  const navItemClass = isMobile ? 'text-xs py-1.5 px-2' : '';
  return (
    <div className="overflow-x-auto pb-2 no-scrollbar">
      <TabsList className="mb-4 w-full flex-nowrap justify-start px-0 h-auto">
        <TabsTrigger value="todo" className={`${navItemClass} whitespace-nowrap`}>
          To Do ({counts.todo})
        </TabsTrigger>
        <TabsTrigger value="inprogress" className={`${navItemClass} whitespace-nowrap`}>
          In Progress ({counts.inprogress})
        </TabsTrigger>
        <TabsTrigger value="pending" className={`${navItemClass} whitespace-nowrap`}>
          Pending ({counts.pending})
        </TabsTrigger>
        <TabsTrigger value="completed" className={`${navItemClass} whitespace-nowrap`}>
          Completed ({counts.completed})
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

export default TasksTabsNav;
