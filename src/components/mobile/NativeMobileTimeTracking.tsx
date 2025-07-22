
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Play, Pause, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NativeMobileTimeTrackingProps {
  currentTime?: string;
  isWorking?: boolean;
  isOnBreak?: boolean;
  onStartWork?: () => void;
  onStopWork?: () => void;
  onStartBreak?: () => void;
}

const NativeMobileTimeTracking: React.FC<NativeMobileTimeTrackingProps> = ({
  currentTime = "00:00:00",
  isWorking = false,
  isOnBreak = false,
  onStartWork = () => {},
  onStopWork = () => {},
  onStartBreak = () => {}
}) => {
  return (
    <div className="px-4 py-2">
      <motion.div 
        className="flex items-center gap-3 mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Clock className="h-4 w-4 text-white" />
        </motion.div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Time Tracking</h2>
          <p className="text-xs text-muted-foreground">
            {isWorking ? (isOnBreak ? 'On break' : 'Working') : 'Ready to start'}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950/50 dark:via-blue-950/30 dark:to-indigo-950/30 border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
          <CardContent className="relative p-6">
            {/* Time Display */}
            <div className="text-center mb-6">
              <motion.div 
                className="text-4xl font-mono font-bold text-foreground mb-2"
                key={currentTime}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {currentTime}
              </motion.div>
              <div className={`text-sm font-medium ${
                isOnBreak ? 'text-orange-600' : 
                isWorking ? 'text-green-600' : 
                'text-muted-foreground'
              }`}>
                {isOnBreak ? 'Break Time' : isWorking ? 'Working' : 'Not Started'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              {!isWorking ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={onStartWork}
                    className="h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Work
                  </Button>
                </motion.div>
              ) : (
                <>
                  {!isOnBreak && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={onStartBreak}
                        variant="outline"
                        className="h-12 px-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200 dark:border-orange-800 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/70 dark:hover:to-amber-900/70"
                      >
                        <Coffee className="h-5 w-5 text-orange-600" />
                      </Button>
                    </motion.div>
                  )}
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onStopWork}
                      className="h-12 px-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Pause className="h-5 w-5 mr-2" />
                      {isOnBreak ? 'Resume' : 'Stop'}
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NativeMobileTimeTracking;
