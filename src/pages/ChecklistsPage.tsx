
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChecklistsView from '@/components/checklists/ChecklistsView';
import ChecklistReports from '@/components/checklists/ChecklistReports';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateChecklistDialog from '@/components/checklists/CreateChecklistDialog';
import { useIsMobile } from '@/hooks/use-mobile';

const ChecklistsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checklists</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Checklist
        </Button>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4 w-full flex justify-between md:justify-start md:w-auto overflow-x-auto">
          <TabsTrigger value="active" className="flex-1 md:flex-none">Active Checklists</TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 md:flex-none">Templates</TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 md:flex-none">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4">
          <ChecklistsView type="active" />
        </TabsContent>
        <TabsContent value="templates" className="space-y-4">
          <ChecklistsView type="template" />
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <ChecklistReports />
        </TabsContent>
      </Tabs>
      
      <CreateChecklistDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />
    </div>
  );
};

export default ChecklistsPage;
