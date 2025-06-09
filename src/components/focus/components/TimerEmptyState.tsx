
import React from 'react';
import { Play } from 'lucide-react';

const TimerEmptyState: React.FC = () => {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
        <Play className="h-8 w-8" />
      </div>
      <p className="text-lg font-medium mb-2">Ready to Focus?</p>
      <p className="text-sm">Select a task from the list to begin your focus session.</p>
    </div>
  );
};

export default TimerEmptyState;
