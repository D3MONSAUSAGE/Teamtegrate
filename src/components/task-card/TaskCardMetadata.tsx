
import React, { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { resolveUserName } from '@/contexts/task/api/task/resolveUserNames';

interface TaskCardMetadataProps {
  deadline: Date;
  assignedToName?: string;
  assignedToId?: string;
  getAssignedToName?: () => string;
}

const TaskCardMetadata: React.FC<TaskCardMetadataProps> = ({
  deadline,
  assignedToId,
  assignedToName,
  getAssignedToName
}) => {
  const [displayName, setDisplayName] = useState<string>(
    assignedToName || getAssignedToName?.() || 'Unassigned'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch user name from database if we only have an ID
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserName = async () => {
      if (!assignedToId) {
        setDisplayName('Unassigned');
        return;
      }
      
      // If we already have a proper name that's not an ID, use it
      if (assignedToName && assignedToName !== assignedToId && assignedToName !== 'Unassigned' && assignedToName !== 'Assigned') {
        setDisplayName(assignedToName);
        return;
      }
      
      setIsLoading(true);
      try {
        const name = await resolveUserName(assignedToId);
        if (isMounted) {
          setDisplayName(name);
        }
      } catch (error) {
        console.error('Error fetching assignee name:', error);
        if (isMounted) {
          setDisplayName(getAssignedToName?.() || 'Assigned');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserName();
    
    return () => {
      isMounted = false;
    };
  }, [assignedToId, assignedToName, getAssignedToName]);
  
  // Check if deadline is today
  const isToday = new Date().toDateString() === new Date(deadline).toDateString();
  
  // Check if deadline is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = tomorrow.toDateString() === new Date(deadline).toDateString();
  
  // Set deadline class based on urgency
  const deadlineClass = isToday ? "text-orange-500 font-medium" : 
                       isTomorrow ? "text-amber-500" : 
                       "text-gray-500";

  return (
    <div className="flex items-center justify-between pt-1 md:pt-2">
      <motion.div 
        className={`flex items-center text-xs gap-1 ${deadlineClass}`}
        whileHover={{ scale: 1.05 }}
      >
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">
          {isToday ? "Today" : isTomorrow ? "Tomorrow" : format(deadline, 'MMM d')} 
          {" at "} 
          {format(deadline, 'h:mm a')}
        </span>
      </motion.div>
      
      <motion.div 
        className="flex items-center text-xs text-gray-500 gap-1"
        whileHover={{ scale: 1.05 }}
      >
        <User className="h-3 w-3 flex-shrink-0" />
        <span 
          className={`truncate max-w-[100px] ${displayName === 'Unassigned' ? "italic text-gray-400" : ""}`}
        >
          {isLoading ? 'Loading...' : displayName}
        </span>
      </motion.div>
    </div>
  );
};

export default TaskCardMetadata;
