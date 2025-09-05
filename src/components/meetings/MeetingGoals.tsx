import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingGoal {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: Date;
}

interface MeetingOutcome {
  id: string;
  description: string;
  type: 'decision' | 'action_item' | 'insight';
  timestamp: Date;
}

interface MeetingGoalsProps {
  meetingId: string;
  onGoalComplete?: (goalId: string) => void;
  onOutcomeAdd?: (outcome: MeetingOutcome) => void;
  className?: string;
}

export const MeetingGoals: React.FC<MeetingGoalsProps> = ({
  meetingId,
  onGoalComplete,
  onOutcomeAdd,
  className
}) => {
  const [goals, setGoals] = useState<MeetingGoal[]>([]);
  const [outcomes, setOutcomes] = useState<MeetingOutcome[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [outcomeType, setOutcomeType] = useState<'decision' | 'action_item' | 'insight'>('decision');
  const [showAddGoal, setShowAddGoal] = useState(false);

  // Initialize with some example goals for demo
  useEffect(() => {
    setGoals([
      {
        id: '1',
        title: 'Define project requirements',
        description: 'Gather and document all functional requirements',
        completed: false,
        priority: 'high'
      },
      {
        id: '2', 
        title: 'Set project timeline',
        description: 'Agree on milestones and deadlines',
        completed: false,
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Assign team roles',
        completed: true,
        priority: 'high'
      }
    ]);
  }, []);

  const addGoal = () => {
    if (!newGoalTitle.trim()) return;

    const goal: MeetingGoal = {
      id: Date.now().toString(),
      title: newGoalTitle.trim(),
      completed: false,
      priority: 'medium'
    };

    setGoals(prev => [...prev, goal]);
    setNewGoalTitle('');
    setShowAddGoal(false);
  };

  const toggleGoal = (goalId: string) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updated = { ...goal, completed: !goal.completed };
        if (updated.completed) {
          onGoalComplete?.(goalId);
        }
        return updated;
      }
      return goal;
    }));
  };

  const addOutcome = () => {
    if (!newOutcome.trim()) return;

    const outcome: MeetingOutcome = {
      id: Date.now().toString(),
      description: newOutcome.trim(),
      type: outcomeType,
      timestamp: new Date()
    };

    setOutcomes(prev => [...prev, outcome]);
    onOutcomeAdd?.(outcome);
    setNewOutcome('');
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getOutcomeColor = (type: string) => {
    switch (type) {
      case 'decision': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'action_item': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'insight': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Goals Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Meeting Goals
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {completionRate}% complete
              </Badge>
              
              <Button
                onClick={() => setShowAddGoal(!showAddGoal)}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Goal
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Goal Form */}
          {showAddGoal && (
            <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
              <Input
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="Enter goal title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addGoal();
                  }
                }}
              />
              
              <div className="flex gap-2">
                <Button onClick={addGoal} size="sm" disabled={!newGoalTitle.trim()}>
                  Add Goal
                </Button>
                <Button onClick={() => setShowAddGoal(false)} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Goals List */}
          <div className="space-y-2">
            {goals.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No goals set</p>
                <p className="text-xs">Define meeting objectives to track progress</p>
              </div>
            ) : (
              goals.map((goal) => (
                <div
                  key={goal.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all",
                    goal.completed ? 'bg-green-50 border-green-200' : 'bg-card border-border'
                  )}
                >
                  <Button
                    onClick={() => toggleGoal(goal.id)}
                    size="sm"
                    variant="ghost"
                    className="p-0 h-auto mt-0.5"
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        goal.completed ? 'line-through text-muted-foreground' : ''
                      )}>
                        {goal.title}
                      </span>
                      
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getPriorityColor(goal.priority))}
                      >
                        {goal.priority}
                      </Badge>
                    </div>

                    {goal.description && (
                      <p className={cn(
                        "text-sm text-muted-foreground",
                        goal.completed ? 'line-through' : ''
                      )}>
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Outcomes Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Meeting Outcomes
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Outcome Form */}
          <div className="space-y-3">
            <div className="flex gap-1">
              {(['decision', 'action_item', 'insight'] as const).map((type) => (
                <Button
                  key={type}
                  onClick={() => setOutcomeType(type)}
                  size="sm"
                  variant={outcomeType === type ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {type === 'decision' && 'Decision'}
                  {type === 'action_item' && 'Action Item'}
                  {type === 'insight' && 'Insight'}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder={`Describe the ${outcomeType.replace('_', ' ')}...`}
                className="flex-1 min-h-[60px] resize-none"
              />
              <Button
                onClick={addOutcome}
                disabled={!newOutcome.trim()}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Outcomes List */}
          <div className="space-y-2">
            {outcomes.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <p className="text-sm">No outcomes recorded yet</p>
                <p className="text-xs">Document decisions and key insights</p>
              </div>
            ) : (
              outcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    getOutcomeColor(outcome.type)
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">{outcome.description}</p>
                    <Badge variant="outline" className="text-xs">
                      {outcome.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs opacity-70 mt-2">
                    <Clock className="h-3 w-3" />
                    {outcome.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};