import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Library } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceLibrary } from './ResourceLibrary';
import { CreateResourceDialog } from './CreateResourceDialog';
import { ResourceFilterOptions } from '@/types/resources';

interface ResourceManagerProps {
  className?: string;
}

export const ResourceManager: React.FC<ResourceManagerProps> = ({ className }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ResourceFilterOptions>({});

  const handleFilterChange = (newFilters: Partial<ResourceFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const activeFilters = { ...filters, search: searchQuery || undefined };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Library className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Resource Management</h2>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchQuery('');
            setFilters({});
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger 
            value="all" 
            onClick={() => handleFilterChange({ category: undefined })}
          >
            All Resources
          </TabsTrigger>
          <TabsTrigger 
            value="hr_documentation"
            onClick={() => handleFilterChange({ category: 'hr_documentation' })}
          >
            HR Documentation
          </TabsTrigger>
          <TabsTrigger 
            value="compliance_training"
            onClick={() => handleFilterChange({ category: 'compliance_training' })}
          >
            Compliance
          </TabsTrigger>
          <TabsTrigger 
            value="job_specific_training"
            onClick={() => handleFilterChange({ category: 'job_specific_training' })}
          >
            Job Training
          </TabsTrigger>
          <TabsTrigger 
            value="culture_engagement"
            onClick={() => handleFilterChange({ category: 'culture_engagement' })}
          >
            Culture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ResourceLibrary filters={activeFilters} />
        </TabsContent>
        <TabsContent value="hr_documentation">
          <ResourceLibrary filters={activeFilters} />
        </TabsContent>
        <TabsContent value="compliance_training">
          <ResourceLibrary filters={activeFilters} />
        </TabsContent>
        <TabsContent value="job_specific_training">
          <ResourceLibrary filters={activeFilters} />
        </TabsContent>
        <TabsContent value="culture_engagement">
          <ResourceLibrary filters={activeFilters} />
        </TabsContent>
      </Tabs>

      <CreateResourceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};