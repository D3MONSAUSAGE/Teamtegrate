
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumDashboardHeaderProps {
  onCreateTask: () => void;
}

const PremiumDashboardHeader: React.FC<PremiumDashboardHeaderProps> = ({ onCreateTask }) => {
  const { user } = useAuth();
  
  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const [currentTime, setCurrentTime] = React.useState(getCurrentTime());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden bg-gradient-to-r from-dashboard-bg via-dashboard-card to-dashboard-bg border-b border-dashboard-border/20 backdrop-blur-xl"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-dashboard-primary/5 via-transparent to-dashboard-teal/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Main Greeting */}
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Sparkles className="h-8 w-8 text-dashboard-primary" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-dashboard-gray-900 via-dashboard-primary to-dashboard-teal bg-clip-text text-transparent">
                  {getCurrentTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-dashboard-primary/10 text-dashboard-primary border-dashboard-primary/20 hover:bg-dashboard-primary/20 transition-all duration-300"
                  >
                    {user?.role || 'User'}
                  </Badge>
                  <div className="flex items-center gap-2 text-dashboard-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-sm">{currentTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-dashboard-gray-600 max-w-md"
            >
              Your productivity command center awaits. Ready to make today exceptional?
            </motion.p>
          </motion.div>

          {/* Floating Action Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onCreateTask}
              size="lg"
              className="relative group bg-gradient-to-r from-dashboard-primary to-dashboard-teal hover:from-dashboard-primary-dark hover:to-dashboard-teal-dark shadow-xl hover:shadow-2xl transition-all duration-300 text-white px-8 py-6 rounded-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-dashboard-primary to-dashboard-teal rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3">
                <Plus className="h-5 w-5" />
                <span className="font-semibold">Create Task</span>
              </div>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumDashboardHeader;
