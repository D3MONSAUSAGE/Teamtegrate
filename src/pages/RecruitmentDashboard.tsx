import { useEffect } from 'react';
import { useRecruitmentPipeline } from '@/hooks/recruitment/useRecruitmentPipeline';
import { useRecruitmentCandidates } from '@/hooks/recruitment/useRecruitmentCandidates';
import { useRecruitmentPositions } from '@/hooks/recruitment/useRecruitmentPositions';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase, Users, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const RecruitmentDashboard = () => {
  const { stages, isLoading: stagesLoading, initializeDefaultStages, isInitializing } = useRecruitmentPipeline();
  const { candidates, isLoading: candidatesLoading } = useRecruitmentCandidates();
  const { positions, isLoading: positionsLoading } = useRecruitmentPositions();

  // Initialize pipeline stages if none exist
  useEffect(() => {
    if (!stagesLoading && stages.length === 0 && !isInitializing) {
      initializeDefaultStages();
    }
  }, [stages, stagesLoading, initializeDefaultStages, isInitializing]);

  const isLoading = stagesLoading || candidatesLoading || positionsLoading;

  const openPositions = positions.filter(p => p.status === 'open');
  const activeCandidates = candidates.filter(c => c.status === 'active');
  const interviewsThisWeek = 0; // TODO: Calculate from interviews table
  const pendingApprovals = candidates.filter(c => 
    c.current_stage?.stage_name === 'Manager Approval'
  );

  if (isLoading || isInitializing) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">
            Manage your hiring pipeline and track candidates
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
          <Button variant="outline">
            <Briefcase className="mr-2 h-4 w-4" />
            Create Position
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openPositions.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCandidates.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviewsThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled interviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting manager review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map(stage => (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80 rounded-lg border bg-card p-4"
                style={{ borderTopColor: stage.color_code, borderTopWidth: '3px' }}
              >
                <div className="mb-4">
                  <h3 className="font-semibold">{stage.stage_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {candidates.filter(c => c.current_stage_id === stage.id).length} candidates
                  </p>
                </div>
                
                <div className="space-y-2">
                  {candidates
                    .filter(c => c.current_stage_id === stage.id)
                    .slice(0, 3)
                    .map(candidate => (
                      <Card key={candidate.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">
                            {candidate.first_name} {candidate.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {candidate.position?.job_title || 'Unknown Position'}
                          </p>
                          {candidate.overall_rating && (
                            <div className="mt-1 flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-xs ${
                                    i < candidate.overall_rating! 
                                      ? 'text-yellow-500' 
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  
                  {candidates.filter(c => c.current_stage_id === stage.id).length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No candidates in this stage
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
