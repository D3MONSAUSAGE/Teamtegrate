
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from 'lucide-react';
import { Task } from '@/types';
import EnhancedTaskCard from './EnhancedTaskCard';

interface NativeTaskSectionProps {
  title: string;
  tasks: Task[];
  icon: React.ComponentType<{ className?: string }>;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: string) => Promise<void>;
  emptyMessage: string;
  emptyDescription: string;
  maxVisible?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  gradient?: string;
}

const NativeTaskSection: React.FC<NativeTaskSectionProps> = ({
  title,
  tasks,
  icon: Icon,
  onCreateTask,
  onEditTask,
  onStatusChange,
  emptyMessage,
  emptyDescription,
  maxVisible = 3,
  showViewAll = false,
  onViewAll,
  gradient = "from-blue-500 to-purple-600"
}) => {
  const visibleTasks = tasks.slice(0, maxVisible);
  const hasMoreTasks = tasks.length > maxVisible;

  return (
    <div className="px-4 py-2">
      {/* Section Header */}
      <motion.div 
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className={`p-2 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="h-4 w-4 text-white" />
          </motion.div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showViewAll && hasMoreTasks && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="text-xs px-3 h-8"
            >
              View all
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCreateTask}
              className="h-8 w-8 p-0 rounded-full hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Tasks List */}
      {visibleTasks.length > 0 ? (
        <div className="space-y-3">
          {visibleTasks.map((task, index) => (
            <EnhancedTaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onStatusChange={onStatusChange}
              onDelete={() => {}}
              onClick={() => {}}
              index={index}
            />
          ))}
          
          {hasMoreTasks && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-2"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewAll}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                +{tasks.length - maxVisible} more tasks
              </Button>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div 
          className="text-center py-8 px-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Icon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          </motion.div>
          <h3 className="text-base font-medium text-foreground mb-1">
            {emptyMessage}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {emptyDescription}
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={onCreateTask}
              size="sm"
              className={`bg-gradient-to-r ${gradient} hover:shadow-lg transition-all duration-300 text-white border-0`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NativeTaskSection;
