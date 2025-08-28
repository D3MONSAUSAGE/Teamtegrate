
import React from 'react';

interface CalendarViewSelectorProps {
  viewType: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
}

const CalendarViewSelector: React.FC<CalendarViewSelectorProps> = ({  
  viewType, 
  onViewChange 
}) => {
  const getViewLabel = (view: string) => {
    switch(view) {
      case 'day': return 'Day';
      case 'week': return 'Week';
      case 'month': return 'Month';
      default: return 'Month';
    }
  };

  const views: Array<'day' | 'week' | 'month'> = ['day', 'week', 'month'];

  return (
    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
      {views.map((view, index) => {
        const isActive = viewType === view;
        const isFirst = index === 0;
        const isLast = index === views.length - 1;
        
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`
              px-3 py-1.5 text-sm font-medium transition-colors
              ${isFirst ? 'rounded-l-md' : ''} 
              ${isLast ? 'rounded-r-md' : ''}
              ${!isFirst ? 'border-l border-gray-300 dark:border-gray-600' : ''}
              ${isActive 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            <span className="capitalize">{getViewLabel(view)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CalendarViewSelector;
