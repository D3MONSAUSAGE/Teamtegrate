
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface NativeMobileHeaderProps {
  userName: string;
  onCreateTask: () => void;
  isLoading: boolean;
  dailyScore: number;
}

const NativeMobileHeader: React.FC<NativeMobileHeaderProps> = ({
  userName,
  onCreateTask,
  isLoading,
  dailyScore
}) => {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  
  // Dynamic background based on time of day
  const getTimeBasedGradient = () => {
    if (currentHour < 6) return 'from-slate-900 via-purple-900 to-slate-800'; // Night
    if (currentHour < 12) return 'from-orange-400 via-pink-400 to-purple-500'; // Morning
    if (currentHour < 17) return 'from-blue-400 via-cyan-400 to-teal-500'; // Afternoon
    if (currentHour < 20) return 'from-orange-500 via-red-500 to-pink-600'; // Evening
    return 'from-indigo-600 via-purple-600 to-blue-800'; // Night
  };

  return (
    <motion.div 
      className={`relative overflow-hidden bg-gradient-to-br ${getTimeBasedGradient()}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-lg"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="relative px-6 py-8 pb-6">
        {/* Header content */}
        <div className="flex items-start justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">
                {greeting}
              </h1>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-5 w-5 text-yellow-300" />
              </motion.div>
            </div>
            <p className="text-xl font-semibold text-white/90 mb-1">
              {userName.split(' ')[0]}
            </p>
            <p className="text-sm text-white/70">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button 
              onClick={onCreateTask}
              disabled={isLoading}
              className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
        </div>

        {/* Daily progress ring */}
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="white"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 45 * (1 - dailyScore / 100)
                }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <div className="text-2xl font-bold text-white">
                  {dailyScore}%
                </div>
                <div className="text-xs text-white/70 font-medium">
                  Daily Goal
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background/20 to-transparent" />
    </motion.div>
  );
};

export default NativeMobileHeader;
