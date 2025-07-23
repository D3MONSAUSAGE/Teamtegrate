
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, Settings } from 'lucide-react';

interface BottomActionButtonsProps {
  onCreateTask: () => void;
}

const BottomActionButtons: React.FC<BottomActionButtonsProps> = ({ onCreateTask }) => {
  const actions = [
    {
      icon: Plus,
      title: 'New Task',
      bgColor: 'bg-blue-500 hover:bg-blue-600',
      onClick: onCreateTask
    },
    {
      icon: Calendar,
      title: 'Schedule',
      bgColor: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => console.log('Schedule')
    },
    {
      icon: Users,
      title: 'Team',
      bgColor: 'bg-green-500 hover:bg-green-600',
      onClick: () => console.log('Team')
    },
    {
      icon: Settings,
      title: 'Settings',
      bgColor: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => console.log('Settings')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const IconComponent = action.icon;
        return (
          <Button
            key={index}
            className={`${action.bgColor} text-white h-16 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200`}
            onClick={action.onClick}
          >
            <IconComponent className="h-5 w-5" />
            <span className="text-sm font-medium">{action.title}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default BottomActionButtons;
