
import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import TaskCommentsDialog from '@/components/TaskCommentsDialog';
import { Task } from '@/types';
import { useTaskTabs } from './tasks/useTaskTabs';
import TasksHeader from './tasks/TasksHeader';
import TasksTabsNav from './tasks/TasksTabsNav';
import TasksTabPanel from './tasks/TasksTabPanel';

const TasksPage = () => {
  const { sortBy, setSortBy, todo, inprogress, pending, completed, counts } = useTaskTabs();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showComments, setShowComments] = useState(false);

  // handlers
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  return (
    <div className="w-full max-w-full">
      <TasksHeader
        sortBy={sortBy}
        setSortBy={(value) => setSortBy(value)}
        onNewTask={() => {
          setEditingTask(undefined);
          setIsCreateTaskOpen(true);
        }}
      />
      <Tabs defaultValue="todo" className="w-full">
        <TasksTabsNav counts={counts} />
        <TabsContent value="todo" className="w-full">
          <TasksTabPanel tasks={todo} status="todo" onEdit={handleEditTask} onAddTask={() => {
            setEditingTask(undefined);
            setIsCreateTaskOpen(true);
          }} />
        </TabsContent>
        <TabsContent value="inprogress" className="w-full">
          <TasksTabPanel tasks={inprogress} status="inprogress" onEdit={handleEditTask} onAddTask={() => {}} />
        </TabsContent>
        <TabsContent value="pending" className="w-full">
          <TasksTabPanel tasks={pending} status="pending" onEdit={handleEditTask} onAddTask={() => {}} />
        </TabsContent>
        <TabsContent value="completed" className="w-full">
          <TasksTabPanel tasks={completed} status="completed" onEdit={handleEditTask} onAddTask={() => {}} />
        </TabsContent>
      </Tabs>
      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
      />
      <TaskCommentsDialog
        open={showComments}
        onOpenChange={setShowComments}
        task={selectedTask}
      />
    </div>
  );
};

export default TasksPage;
