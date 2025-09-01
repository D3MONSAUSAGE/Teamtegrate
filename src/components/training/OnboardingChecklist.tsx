import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Calendar, FileText, Users, Settings, GraduationCap, ExternalLink } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'documentation' | 'equipment' | 'training' | 'meetings' | 'systems';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  dueDate?: string;
  completed: boolean;
  hasLink?: boolean;
  linkUrl?: string;
}

export function OnboardingChecklist() {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      title: 'Read Employee Handbook',
      description: 'Review company policies, benefits, and code of conduct',
      category: 'documentation',
      priority: 'high',
      estimatedTime: '30 min',
      dueDate: '2024-01-18',
      completed: true,
      hasLink: true,
      linkUrl: '/handbook'
    },
    {
      id: '2',
      title: 'Complete I-9 Form',
      description: 'Provide employment eligibility verification documents',
      category: 'documentation',
      priority: 'high',
      estimatedTime: '10 min',
      dueDate: '2024-01-17',
      completed: true
    },
    {
      id: '3',
      title: 'Set Up Workstation',
      description: 'Configure laptop, peripherals, and workspace ergonomics',
      category: 'equipment',
      priority: 'high',
      estimatedTime: '45 min',
      completed: true
    },
    {
      id: '4',
      title: 'Access Company Systems',
      description: 'Log into email, project management tools, and internal systems',
      category: 'systems',
      priority: 'high',
      estimatedTime: '20 min',
      completed: false,
      hasLink: true,
      linkUrl: '/systems-access'
    },
    {
      id: '5',
      title: 'Security Awareness Training',
      description: 'Complete mandatory cybersecurity training module',
      category: 'training',
      priority: 'high',
      estimatedTime: '1 hour',
      dueDate: '2024-01-22',
      completed: false,
      hasLink: true,
      linkUrl: '/security-training'
    },
    {
      id: '6',
      title: 'Meet Your Team',
      description: 'Schedule introductory meetings with direct team members',
      category: 'meetings',
      priority: 'medium',
      estimatedTime: '1 hour',
      completed: false
    },
    {
      id: '7',
      title: 'Department Overview Session',
      description: 'Attend presentation on department goals and processes',
      category: 'training',
      priority: 'medium',
      estimatedTime: '1.5 hours',
      dueDate: '2024-01-24',
      completed: false
    },
    {
      id: '8',
      title: 'Benefits Enrollment',
      description: 'Choose health insurance, retirement plan, and other benefits',
      category: 'documentation',
      priority: 'medium',
      estimatedTime: '30 min',
      dueDate: '2024-01-25',
      completed: false,
      hasLink: true,
      linkUrl: '/benefits'
    },
    {
      id: '9',
      title: 'Company Culture Workshop',
      description: 'Learn about company values, culture, and traditions',
      category: 'training',
      priority: 'low',
      estimatedTime: '45 min',
      completed: false
    },
    {
      id: '10',
      title: 'Set Up Professional Headshot',
      description: 'Schedule photo session for company directory and profiles',
      category: 'documentation',
      priority: 'low',
      estimatedTime: '15 min',
      completed: false
    }
  ]);

  const toggleItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getCategoryIcon = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'documentation':
        return <FileText className="w-4 h-4" />;
      case 'equipment':
        return <Settings className="w-4 h-4" />;
      case 'training':
        return <GraduationCap className="w-4 h-4" />;
      case 'meetings':
        return <Users className="w-4 h-4" />;
      case 'systems':
        return <Settings className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'documentation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'equipment':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'training':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'meetings':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'systems':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: ChecklistItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const completedItems = checklistItems.filter(item => item.completed).length;
  const totalItems = checklistItems.length;
  const progressPercentage = (completedItems / totalItems) * 100;

  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Onboarding Progress
          </CardTitle>
          <CardDescription>
            {completedItems} of {totalItems} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Checklist by Category */}
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([category, items]) => {
          const categoryCompleted = items.filter(item => item.completed).length;
          const categoryTotal = items.length;
          const categoryProgress = (categoryCompleted / categoryTotal) * 100;

          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {getCategoryIcon(category as ChecklistItem['category'])}
                    <span className="capitalize">{category}</span>
                  </CardTitle>
                  <Badge variant="outline" className={getCategoryColor(category as ChecklistItem['category'])}>
                    {categoryCompleted}/{categoryTotal}
                  </Badge>
                </div>
                <Progress value={categoryProgress} className="h-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className={`space-y-1 ${item.completed ? 'opacity-60' : ''}`}>
                            <h4 className={`font-medium ${item.completed ? 'line-through' : ''}`}>
                              {item.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            {item.hasLink && (
                              <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.estimatedTime}
                          </div>
                          {item.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due {item.dueDate}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}