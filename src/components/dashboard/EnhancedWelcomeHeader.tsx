
import React from 'react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Plus, Sparkles, Calendar, Sun, Moon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EnhancedWelcomeHeaderProps {
  userName?: string;
  onCreateTask: () => void;
}

const EnhancedWelcomeHeader: React.FC<EnhancedWelcomeHeaderProps> = ({
  userName,
  onCreateTask
}) => {
  const isMobile = useIsMobile();
  const currentHour = new Date().getHours();
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
  const timeIcon = currentHour < 18 ? Sun : Moon;
  const TimeIcon = timeIcon;

  const getGreeting = () => {
    if (timeOfDay === 'morning') return 'Good morning';
    if (timeOfDay === 'afternoon') return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="modern-card p-6 md:p-8 animate-fade-in overflow-hidden relative">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 animate-gradient" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`
            }}
          />
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <TimeIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                {getGreeting()}, {userName}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">
                  {format(new Date(), "EEEE, MMMM d")}
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Ready to make today productive? Here's your dashboard overview to keep you on track.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={onCreateTask} 
            size={isMobile ? "default" : "lg"} 
            className="interactive-button bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-primary/20"
          >
            <Plus className="h-5 w-5 mr-2" /> 
            Create Task
            <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWelcomeHeader;
