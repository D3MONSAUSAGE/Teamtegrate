import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  PlusCircle, 
  UserPlus, 
  Users, 
  BarChart3, 
  Settings,
  Download,
  TrendingUp,
  BookOpen,
  PenTool,
  Shield
} from 'lucide-react';
import ComplianceTrainingTemplateManager from './ComplianceTrainingTemplateManager';

interface ManagementPanelProps {
  onCreateCourse: () => void;
  onCreateQuiz: () => void;
  onAssignContent: () => void;
  onViewAnalytics: () => void;
  onExportData?: () => void;
  onSettings?: () => void;
  userRole: string;
}

const ManagementPanel: React.FC<ManagementPanelProps> = ({
  onCreateCourse,
  onCreateQuiz,
  onAssignContent,
  onViewAnalytics,
  onExportData,
  onSettings,
  userRole
}) => {
  const [showComplianceManager, setShowComplianceManager] = useState(false);
  const quickActions = [
    {
      title: 'Create Course',
      description: 'Build new training modules',
      icon: Plus,
      onClick: onCreateCourse,
      primary: true,
      color: 'from-primary to-primary/80'
    },
    {
      title: 'Create Quiz',
      description: 'Add assessment questions',
      icon: PlusCircle,
      onClick: onCreateQuiz,
      primary: false,
      color: 'from-accent to-accent/80'
    },
    {
      title: 'Compliance Setup',
      description: 'Configure external compliance training',
      icon: Shield,
      onClick: () => setShowComplianceManager(true),
      primary: false,
      color: 'from-amber-500 to-amber-400'
    },
    {
      title: 'Assign Training',
      description: 'Distribute content to teams',
      icon: UserPlus,
      onClick: onAssignContent,
      primary: false,
      color: 'from-blue-500 to-blue-400'
    },
    {
      title: 'View Analytics',
      description: 'Monitor progress & performance',
      icon: BarChart3,
      onClick: onViewAnalytics,
      primary: false,
      color: 'from-purple-500 to-purple-400'
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-muted/30 to-muted/10">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Management Center</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Training administration</p>
              <Badge variant="secondary" className="text-xs">
                {userRole}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSettings && (
              <Button variant="ghost" size="sm" onClick={onSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {onExportData && (
              <Button variant="ghost" size="sm" onClick={onExportData}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <ActionCard
              key={action.title}
              action={action}
              delay={index * 100}
            />
          ))}
        </div>

        {/* Management Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Courses</span>
            </div>
            <p className="text-xs text-muted-foreground">Content creation</p>
          </div>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Teams</span>
            </div>
            <p className="text-xs text-muted-foreground">Assignment tracking</p>
          </div>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Analytics</span>
            </div>
            <p className="text-xs text-muted-foreground">Performance insights</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Action Card Component
const ActionCard: React.FC<{
  action: {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    onClick: () => void;
    primary: boolean;
    color: string;
  };
  delay: number;
}> = ({ action, delay }) => {
  const IconComponent = action.icon;

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
        action.primary ? 'ring-2 ring-primary/20' : ''
      }`}
      onClick={action.onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-5`} />
      <div className="relative p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-sm">{action.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {action.description}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ManagementPanel;