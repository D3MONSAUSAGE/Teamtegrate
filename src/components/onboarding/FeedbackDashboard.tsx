import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Calendar, User, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useOrganizationFeedback } from '@/hooks/onboarding/useOnboardingFeedback';
import { format } from 'date-fns';
import { CreateFeedbackCheckpoint } from './CreateFeedbackCheckpoint';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { OnboardingFeedbackStatus } from '@/types/onboarding';

export const FeedbackDashboard: React.FC = () => {
  const { data: feedbackCheckpoints, isLoading, error } = useOrganizationFeedback();
  const [statusFilter, setStatusFilter] = useState<OnboardingFeedbackStatus | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Error loading feedback data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const filteredCheckpoints = feedbackCheckpoints?.filter((checkpoint) => 
    statusFilter === 'all' || checkpoint.status === statusFilter
  ) || [];

  // Calculate summary statistics
  const totalCheckpoints = feedbackCheckpoints?.length || 0;
  const completedCheckpoints = feedbackCheckpoints?.filter(cp => cp.status === 'completed').length || 0;
  const avgRating = feedbackCheckpoints?.reduce((sum, cp) => sum + (cp.rating || 0), 0) / Math.max(completedCheckpoints, 1);
  const pendingCheckpoints = totalCheckpoints - completedCheckpoints;

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Checkpoints</p>
                <p className="text-2xl font-bold">{totalCheckpoints}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCheckpoints}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCheckpoints}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}/5</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Feedback Checkpoints</h2>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as OnboardingFeedbackStatus | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Schedule Feedback Checkpoint</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <CreateFeedbackCheckpoint 
              onSuccess={() => setIsCreateDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Feedback Checkpoints List */}
      <div className="grid gap-4">
        {filteredCheckpoints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feedback checkpoints</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'No feedback checkpoints have been created yet.'
                  : `No ${statusFilter} feedback checkpoints found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCheckpoints.map((checkpoint) => (
            <Card key={checkpoint.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-semibold">
                        {checkpoint.checkpoint_label || `${checkpoint.days_offset}-Day Check-in`}
                      </h4>
                      <Badge variant={checkpoint.status === 'completed' ? "default" : "secondary"}>
                        {checkpoint.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                        {checkpoint.instance?.employee?.name || 'Unknown Employee'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Due: {checkpoint.instance?.start_date 
                            ? format(
                                new Date(new Date(checkpoint.instance.start_date).getTime() + checkpoint.days_offset * 24 * 60 * 60 * 1000),
                                'MMM d, yyyy'
                              )
                            : 'N/A'
                          }
                        </span>
                      </div>
                      
                      {checkpoint.status === 'completed' && checkpoint.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{checkpoint.rating}/5</span>
                        </div>
                      )}
                    </div>
                    
                    {checkpoint.status === 'completed' && checkpoint.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm">{checkpoint.notes}</p>
                      </div>
                    )}
                    
                    {checkpoint.completed_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Completed on {format(new Date(checkpoint.completed_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  
                  {checkpoint.instance?.template && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Template:</p>
                      <p className="text-sm font-medium">{checkpoint.instance.template.name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};