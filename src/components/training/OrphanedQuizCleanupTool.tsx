import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Database, 
  FileX, 
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Archive,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';

interface OrphanedAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  attempt_number: number;
  score: number;
  max_score: number;
  passed: boolean;
  started_at: string;
  completed_at: string;
  answers_count: number;
  has_overrides: boolean;
}

interface OrphanedQuizCleanupToolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrphanedQuizCleanupTool: React.FC<OrphanedQuizCleanupToolProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [orphanedAttempts, setOrphanedAttempts] = useState<OrphanedAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttempts, setSelectedAttempts] = useState<Set<string>>(new Set());
  const [actionInProgress, setActionInProgress] = useState(false);
  const { user } = useAuth();
  
  const isAdmin = user && ['admin', 'superadmin', 'manager'].includes(user.role);

  const fetchOrphanedAttempts = async () => {
    if (!user?.organizationId || !isAdmin) return;
    
    setLoading(true);
    try {
      // Find quiz attempts where the referenced quiz no longer exists
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          quiz_id,
          user_id,
          attempt_number,
          score,
          max_score,
          passed,
          started_at,
          completed_at,
          answers,
          users!inner(name, email)
        `)
        .eq('organization_id', user.organizationId)
        .order('started_at', { ascending: false });

      if (error) throw error;

      if (!attempts || attempts.length === 0) {
        setOrphanedAttempts([]);
        return;
      }

      // Check which quizzes still exist
      const quizIds = [...new Set(attempts.map(a => a.quiz_id))];
      const { data: existingQuizzes, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .in('id', quizIds);

      if (quizError) throw quizError;

      const existingQuizIds = new Set(existingQuizzes?.map(q => q.id) || []);
      
      // Get overrides for orphaned attempts
      const orphanedAttemptsList = attempts.filter(attempt => !existingQuizIds.has(attempt.quiz_id));
      const orphanedAttemptIds = orphanedAttemptsList.map(a => a.id);
      
      let overridesMap: Record<string, boolean> = {};
      if (orphanedAttemptIds.length > 0) {
        const { data: overrides } = await supabase
          .from('quiz_answer_overrides')
          .select('quiz_attempt_id')
          .in('quiz_attempt_id', orphanedAttemptIds);
        
        overridesMap = (overrides || []).reduce((acc, override) => {
          acc[override.quiz_attempt_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }

      const orphanedData: OrphanedAttempt[] = orphanedAttemptsList.map(attempt => ({
        id: attempt.id,
        quiz_id: attempt.quiz_id,
        user_id: attempt.user_id,
        user_name: (attempt.users as any)?.name || 'Unknown User',
        user_email: (attempt.users as any)?.email || '',
        attempt_number: attempt.attempt_number,
        score: attempt.score,
        max_score: attempt.max_score,
        passed: attempt.passed,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        answers_count: Array.isArray(attempt.answers) ? attempt.answers.length : 0,
        has_overrides: overridesMap[attempt.id] || false
      }));

      setOrphanedAttempts(orphanedData);
      
    } catch (error) {
      console.error('Error fetching orphaned attempts:', error);
      toast.error('Failed to fetch orphaned quiz attempts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAttempt = (attemptId: string) => {
    const newSelected = new Set(selectedAttempts);
    if (newSelected.has(attemptId)) {
      newSelected.delete(attemptId);
    } else {
      newSelected.add(attemptId);
    }
    setSelectedAttempts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAttempts.size === orphanedAttempts.length) {
      setSelectedAttempts(new Set());
    } else {
      setSelectedAttempts(new Set(orphanedAttempts.map(a => a.id)));
    }
  };

  const handleDeleteAttempts = async (attemptIds: string[]) => {
    if (!isAdmin || attemptIds.length === 0) return;
    
    setActionInProgress(true);
    try {
      // First delete overrides
      await supabase
        .from('quiz_answer_overrides')
        .delete()
        .in('quiz_attempt_id', attemptIds);
      
      // Then delete attempts
      const { error } = await supabase
        .from('quiz_attempts')
        .delete()
        .in('id', attemptIds);
        
      if (error) throw error;
      
      toast.success(`Successfully deleted ${attemptIds.length} orphaned quiz attempts`);
      setSelectedAttempts(new Set());
      await fetchOrphanedAttempts();
      
    } catch (error) {
      console.error('Error deleting attempts:', error);
      toast.error('Failed to delete orphaned attempts');
    } finally {
      setActionInProgress(false);
    }
  };

  const exportOrphanedData = () => {
    if (orphanedAttempts.length === 0) return;
    
    const csvData = orphanedAttempts.map(attempt => ({
      'Attempt ID': attempt.id,
      'Quiz ID (Deleted)': attempt.quiz_id,
      'User Name': attempt.user_name,
      'User Email': attempt.user_email,
      'Attempt Number': attempt.attempt_number,
      'Score': attempt.score,
      'Max Score': attempt.max_score,
      'Percentage': Math.round((attempt.score / attempt.max_score) * 100),
      'Status': attempt.passed ? 'PASSED' : 'FAILED',
      'Answers Count': attempt.answers_count,
      'Has Overrides': attempt.has_overrides ? 'Yes' : 'No',
      'Started': format(new Date(attempt.started_at), 'yyyy-MM-dd HH:mm:ss'),
      'Completed': attempt.completed_at ? format(new Date(attempt.completed_at), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orphaned-quiz-attempts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (open && isAdmin) {
      fetchOrphanedAttempts();
    }
  }, [open, isAdmin, user?.organizationId]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Orphaned Quiz Cleanup</h1>
            <p className="text-muted-foreground">
              Manage quiz attempts that reference deleted quizzes
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchOrphanedAttempts}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {orphanedAttempts.length > 0 && (
            <Button
              onClick={exportOrphanedData}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attempts">Orphaned Attempts</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileX className="h-4 w-4 text-red-600" />
                  Orphaned Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {orphanedAttempts.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Quiz attempts with deleted quizzes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4 text-orange-600" />
                  With Overrides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {orphanedAttempts.filter(a => a.has_overrides).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Attempts with manual score adjustments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Passed Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {orphanedAttempts.filter(a => a.passed).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Orphaned attempts that passed
                </p>
              </CardContent>
            </Card>
          </div>

          {orphanedAttempts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {orphanedAttempts.length} orphaned quiz attempts. These attempts reference quizzes that no longer exist in the system.
                Review the data and decide whether to export for records or delete to clean up the database.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="attempts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Orphaned Quiz Attempts</CardTitle>
                {orphanedAttempts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSelectAll}
                    >
                      {selectedAttempts.size === orphanedAttempts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedAttempts.size} selected
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading orphaned attempts...</span>
                </div>
              ) : orphanedAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Orphaned Attempts Found</h3>
                  <p className="text-muted-foreground">
                    All quiz attempts have valid quiz references. Your database is clean!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {orphanedAttempts.map((attempt) => (
                      <Card key={attempt.id} className="border-red-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedAttempts.has(attempt.id)}
                                onChange={() => handleSelectAttempt(attempt.id)}
                                className="mt-1"
                              />
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{attempt.user_name}</h4>
                                  <Badge variant="destructive" className="text-xs">
                                    Orphaned
                                  </Badge>
                                  {attempt.has_overrides && (
                                    <Badge variant="outline" className="text-xs bg-orange-50">
                                      Overrides
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>Email: {attempt.user_email}</p>
                                  <p>Deleted Quiz ID: <code className="bg-red-100 px-1 rounded text-xs">{attempt.quiz_id}</code></p>
                                  <p>Attempt #{attempt.attempt_number} • {attempt.answers_count} answers</p>
                                  <p>Started: {format(new Date(attempt.started_at), 'PPp')}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg font-bold">{Math.round((attempt.score / attempt.max_score) * 100)}%</span>
                                {attempt.passed ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {attempt.score}/{attempt.max_score} pts
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Cleanup Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Permanently remove orphaned quiz attempts from the database. This action cannot be undone.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Deleting orphaned attempts will permanently remove all associated data including answers and overrides. 
                  Consider exporting the data first for your records.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={() => handleDeleteAttempts(Array.from(selectedAttempts))}
                  disabled={selectedAttempts.size === 0 || actionInProgress}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {actionInProgress ? 'Deleting...' : `Delete ${selectedAttempts.size} Selected Attempts`}
                </Button>

                {orphanedAttempts.length > 0 && (
                  <Button
                    onClick={() => handleDeleteAttempts(orphanedAttempts.map(a => a.id))}
                    disabled={actionInProgress}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {actionInProgress ? 'Deleting...' : `Delete All ${orphanedAttempts.length} Orphaned Attempts`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrphanedQuizCleanupTool;