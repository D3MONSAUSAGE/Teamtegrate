
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminWelcomeHeader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                  <Badge variant="default" className="bg-primary/90 text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Enhanced
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Comprehensive system administration and security monitoring
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">System Healthy</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Multi-tenant security active
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminWelcomeHeader;
