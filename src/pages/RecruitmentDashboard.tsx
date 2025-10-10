import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecruitmentPipeline } from '@/hooks/recruitment/useRecruitmentPipeline';
import { useRecruitmentCandidates } from '@/hooks/recruitment/useRecruitmentCandidates';
import { useRecruitmentPositions } from '@/hooks/recruitment/useRecruitmentPositions';
import { CreatePositionDialog } from '@/components/recruitment/CreatePositionDialog';
import { CreateCandidateDialog } from '@/components/recruitment/CreateCandidateDialog';
import { RecruitmentPipelineView } from '@/components/recruitment/RecruitmentPipelineView';
import { PositionsList } from '@/components/recruitment/PositionsList';
import { RejectedCandidatesList } from '@/components/recruitment/RejectedCandidatesList';
import { HiredCandidatesList } from '@/components/recruitment/HiredCandidatesList';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Users, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const RecruitmentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPosition, setSelectedPosition] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('pipeline');
  const { stages, isLoading: stagesLoading, initializeDefaultStages, isInitializing } = useRecruitmentPipeline();
  const { candidates, isLoading: candidatesLoading } = useRecruitmentCandidates({ positionId: selectedPosition, status: 'active' });
  const { candidates: rejectedCandidates } = useRecruitmentCandidates({ status: 'rejected' });
  const { candidates: hiredCandidates } = useRecruitmentCandidates({ status: 'hired' });
  const { positions, isLoading: positionsLoading } = useRecruitmentPositions();

  // Initialize pipeline stages if none exist
  useEffect(() => {
    if (!stagesLoading && stages.length === 0 && !isInitializing) {
      initializeDefaultStages();
    }
  }, [stages, stagesLoading, initializeDefaultStages, isInitializing]);

  const isLoading = stagesLoading || candidatesLoading || positionsLoading;

  const openPositions = positions.filter(p => p.status === 'open');
  const activeCandidates = candidates; // Already filtered to active only
  const interviewsThisWeek = 0; // TODO: Calculate from interviews table
  const pendingApprovals = candidates.filter(c => 
    c.current_stage?.stage_name === 'Manager Approval'
  );

  const handleCandidateClick = (candidateId: string) => {
    navigate(`/dashboard/recruitment/candidate/${candidateId}`, {
      state: { from: location.pathname }
    });
  };

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
          <CreateCandidateDialog positionId={selectedPosition} />
          <CreatePositionDialog />
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedCandidates.length})
          </TabsTrigger>
          <TabsTrigger value="hired">
            Hired ({hiredCandidates.length})
          </TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <RecruitmentPipelineView 
                positionId={selectedPosition}
                onCandidateClick={handleCandidateClick}
                statusFilter="active"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <RejectedCandidatesList onCandidateClick={handleCandidateClick} />
        </TabsContent>

        <TabsContent value="hired" className="space-y-4">
          <HiredCandidatesList onCandidateClick={handleCandidateClick} />
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <PositionsList onViewCandidates={(positionId) => {
            setSelectedPosition(positionId);
            setActiveTab('pipeline');
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
