import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, AlertCircle, Trash2, Plus, RefreshCw, Settings } from 'lucide-react';
import { useTrainingCourses } from '@/hooks/useTrainingData';
import { useRetrainingNotifications } from '@/hooks/useRetrainingNotifications';
import { toast } from '@/components/ui/sonner';

interface RetrainingSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RetrainingSettings: React.FC<RetrainingSettingsProps> = ({ open, onOpenChange }) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [intervalMonths, setIntervalMonths] = useState<number>(12);
  const [warningDays, setWarningDays] = useState<number>(30);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [upcomingRetraining, setUpcomingRetraining] = useState<any[]>([]);

  const { data: courses = [] } = useTrainingCourses();
  const {
    settings,
    loading,
    error,
    saveRetrainingSettings,
    deleteRetrainingSettings,
    getRetrainingSettingsForCourse,
    getUpcomingRetraining,
    triggerRetrainingCheck
  } = useRetrainingNotifications();

  // Load upcoming retraining assignments
  useEffect(() => {
    const loadUpcomingRetraining = async () => {
      try {
        const upcoming = await getUpcomingRetraining();
        setUpcomingRetraining(upcoming);
      } catch (err) {
        console.error('Error loading upcoming retraining:', err);
      }
    };

    if (open) {
      loadUpcomingRetraining();
    }
  }, [open, getUpcomingRetraining]);

  const handleSaveSettings = async () => {
    if (!selectedCourseId) {
      toast.error('Please select a course');
      return;
    }

    try {
      await saveRetrainingSettings(selectedCourseId, intervalMonths, warningDays, isActive);
      toast.success('Retraining settings saved successfully!');
      
      // Reset form
      setSelectedCourseId('');
      setIntervalMonths(12);
      setWarningDays(30);
      setIsActive(true);
    } catch (err) {
      toast.error('Failed to save retraining settings');
    }
  };

  const handleDeleteSettings = async (courseId: string) => {
    try {
      await deleteRetrainingSettings(courseId);
      toast.success('Retraining settings deleted');
    } catch (err) {
      toast.error('Failed to delete retraining settings');
    }
  };

  const handleTriggerCheck = async () => {
    try {
      await triggerRetrainingCheck();
      toast.success('Retraining check triggered successfully');
      
      // Reload upcoming retraining
      const upcoming = await getUpcomingRetraining();
      setUpcomingRetraining(upcoming);
    } catch (err) {
      toast.error('Failed to trigger retraining check');
    }
  };

  const formatNextDue = (completedAt: string, intervalMonths: number) => {
    const completed = new Date(completedAt);
    const nextDue = new Date(completed);
    nextDue.setMonth(nextDue.getMonth() + intervalMonths);
    return nextDue.toLocaleDateString();
  };

  const getIntervalLabel = (months: number) => {
    if (months === 3) return '3 months';
    if (months === 6) return '6 months';
    if (months === 12) return 'Annual';
    if (months === 24) return 'Biennial';
    return `${months} months`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Course Retraining Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Configure Retraining
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.filter(course => 
                        !getRetrainingSettingsForCourse(course.id)
                      ).map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Retraining Interval</Label>
                  <Select 
                    value={intervalMonths.toString()} 
                    onValueChange={(value) => setIntervalMonths(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Every 3 months</SelectItem>
                      <SelectItem value="6">Every 6 months</SelectItem>
                      <SelectItem value="12">Annual (12 months)</SelectItem>
                      <SelectItem value="24">Biennial (24 months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warning Period (days before due)</Label>
                  <Input
                    type="number"
                    value={warningDays}
                    onChange={(e) => setWarningDays(parseInt(e.target.value))}
                    min={1}
                    max={90}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label>Enable automatic retraining</Label>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                Save Retraining Settings
              </Button>
            </CardContent>
          </Card>

          {/* Current Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Current Retraining Settings
                </CardTitle>
                <Button onClick={handleTriggerCheck} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Now
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {settings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No retraining settings configured yet
                </p>
              ) : (
                <div className="space-y-3">
                  {settings.map((setting) => {
                    const course = courses?.find(c => c.id === setting.course_id);
                    return (
                      <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{course?.title || 'Unknown Course'}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {getIntervalLabel(setting.retraining_interval_months)}
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {setting.warning_period_days} days warning
                            </span>
                            <Badge variant={setting.is_active ? 'default' : 'secondary'}>
                              {setting.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteSettings(setting.course_id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Retraining */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Upcoming Retraining ({upcomingRetraining.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRetraining.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming retraining assignments
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingRetraining.map((assignment) => {
                    const dueDate = new Date(assignment.due_date);
                    const isOverdue = dueDate < new Date();
                    
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{assignment.content_title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Due: {dueDate.toLocaleDateString()}</span>
                            <Badge variant={isOverdue ? 'destructive' : 'outline'}>
                              {isOverdue ? 'Overdue' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RetrainingSettings;