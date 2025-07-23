
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Play, Square, Zap } from 'lucide-react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';

const FloatingTimeTracker: React.FC = () => {
  const { currentEntry, elapsedTime, clockIn, clockOut, isLoading, breakState } = useTimeTrackingPage();
  
  const isActivelyWorking = currentEntry.isClocked && !breakState.isOnBreak;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl shadow-2xl">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dashboard-primary/10 via-transparent to-dashboard-teal/10" />
        {isActivelyWorking && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-dashboard-success/20 via-transparent to-dashboard-success/5"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        <CardContent className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Status Icon */}
              <motion.div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isActivelyWorking 
                    ? 'bg-dashboard-success/20 text-dashboard-success' 
                    : 'bg-dashboard-gray-100 text-dashboard-gray-600'
                }`}
                animate={{ scale: isActivelyWorking ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 1.5, repeat: isActivelyWorking ? Infinity : 0 }}
              >
                {isActivelyWorking ? (
                  <Zap className="h-8 w-8" />
                ) : (
                  <Clock className="h-8 w-8" />
                )}
              </motion.div>
              
              {/* Time Display */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-dashboard-gray-900">
                  Time Tracking
                </h3>
                <div className="flex items-center gap-4">
                  {isActivelyWorking && (
                    <motion.div
                      className="flex items-center gap-2"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <div className="w-3 h-3 bg-dashboard-success rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-dashboard-success">Active</span>
                    </motion.div>
                  )}
                  <span className="text-3xl font-mono font-bold text-dashboard-gray-900">
                    {elapsedTime}
                  </span>
                </div>
                <p className="text-dashboard-gray-600">
                  {isActivelyWorking ? 'Currently tracking time' : 'Ready to start tracking'}
                </p>
              </div>
            </div>
            
            {/* Control Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={isActivelyWorking ? () => clockOut() : () => clockIn()}
                disabled={isLoading}
                size="lg"
                className={`relative group px-8 py-6 rounded-2xl font-semibold transition-all duration-300 ${
                  isActivelyWorking
                    ? 'bg-gradient-to-r from-dashboard-error to-red-500 hover:from-dashboard-error-light hover:to-red-400 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-dashboard-success to-green-500 hover:from-dashboard-success-light hover:to-green-400 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <div className="relative flex items-center gap-3">
                  {isActivelyWorking ? (
                    <>
                      <Square className="h-5 w-5" />
                      Clock Out
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Clock In
                    </>
                  )}
                </div>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FloatingTimeTracker;
