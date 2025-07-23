
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, CheckCircle2, User, Calendar, MessageCircle } from 'lucide-react';

const RecentActivityFeed: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'task_completed',
      title: 'Marketing Campaign Review',
      user: 'John Doe',
      time: '2 hours ago',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 2,
      type: 'task_assigned',
      title: 'API Documentation Update',
      user: 'Sarah Wilson',
      time: '4 hours ago',
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 3,
      type: 'deadline_approaching',
      title: 'Q4 Financial Report',
      user: 'Michael Chen',
      time: '6 hours ago',
      icon: Calendar,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      id: 4,
      type: 'comment_added',
      title: 'Project Timeline Discussion',
      user: 'Emily Rodriguez',
      time: '1 day ago',
      icon: MessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="h-full"
    >
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Recent Activity
              </CardTitle>
              <p className="text-sm text-slate-600 mt-0.5">
                Latest updates from your team
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-4 hover:bg-slate-50/50 transition-colors duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900 truncate">
                        {activity.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-xs bg-slate-200 text-slate-600">
                          {activity.user.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{activity.user}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentActivityFeed;
