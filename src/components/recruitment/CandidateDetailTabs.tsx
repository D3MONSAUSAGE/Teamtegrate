import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Users, StickyNote, Activity, Info } from 'lucide-react';
import { CandidateOverviewTab } from './CandidateOverviewTab';
import { CandidateDocumentsTab } from './CandidateDocumentsTab';
import { CandidateInterviewsTab } from './CandidateInterviewsTab';
import { CandidateReferencesTab } from './CandidateReferencesTab';
import { CandidateNotesTab } from './CandidateNotesTab';
import { CandidateActivityTab } from './CandidateActivityTab';
import type { CandidateWithDetails } from '@/types/recruitment';

interface CandidateDetailTabsProps {
  candidate: CandidateWithDetails;
}

export function CandidateDetailTabs({ candidate }: CandidateDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Documents</span>
        </TabsTrigger>
        <TabsTrigger value="interviews" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Interviews</span>
        </TabsTrigger>
        <TabsTrigger value="references" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">References</span>
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          <span className="hidden sm:inline">Notes</span>
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Activity</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <CandidateOverviewTab candidate={candidate} />
      </TabsContent>

      <TabsContent value="documents">
        <CandidateDocumentsTab candidate={candidate} />
      </TabsContent>

      <TabsContent value="interviews">
        <CandidateInterviewsTab candidate={candidate} />
      </TabsContent>

      <TabsContent value="references">
        <CandidateReferencesTab candidate={candidate} />
      </TabsContent>

      <TabsContent value="notes">
        <CandidateNotesTab candidate={candidate} />
      </TabsContent>

      <TabsContent value="activity">
        <CandidateActivityTab candidate={candidate} />
      </TabsContent>
    </Tabs>
  );
}
