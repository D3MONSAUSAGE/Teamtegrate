import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Users, Download, Plus } from 'lucide-react';
import { useRequestTemplates, RequestTemplate } from '@/hooks/requests/useRequestTemplates';
import { REQUEST_CATEGORIES } from '@/types/requests';
import { toast } from '@/components/ui/sonner';

interface RequestTemplateMarketplaceProps {
  onSelectTemplate: (template: RequestTemplate) => void;
  onCreateNew: () => void;
}

export const RequestTemplateMarketplace: React.FC<RequestTemplateMarketplaceProps> = ({
  onSelectTemplate,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { 
    templates, 
    loading, 
    getFeaturedTemplates, 
    getTemplatesByCategory, 
    searchTemplates 
  } = useRequestTemplates();

  const handleSelectTemplate = async (template: RequestTemplate) => {
    try {
      onSelectTemplate(template);
      toast.success(`Template "${template.name}" selected`);
    } catch (error) {
      console.error('Error selecting template:', error);
      toast.error('Failed to select template');
    }
  };

  const getDisplayTemplates = () => {
    if (searchQuery) {
      return searchTemplates(searchQuery);
    }
    if (selectedCategory === 'all') {
      return templates;
    }
    return getTemplatesByCategory(selectedCategory);
  };

  const TemplateCard: React.FC<{ template: RequestTemplate }> = ({ template }) => (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group" 
          onClick={() => handleSelectTemplate(template)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {template.icon && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm">{template.icon}</span>
            </div>
          )}
          <div>
            <h3 className="font-medium text-sm">{template.name}</h3>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </div>
        </div>
        {template.is_featured && (
          <Badge variant="secondary" className="gap-1">
            <Star className="w-3 h-3" />
            Featured
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {template.usage_count}
          </div>
          <Badge variant="outline" className="text-xs">
            {REQUEST_CATEGORIES[template.category as keyof typeof REQUEST_CATEGORIES] || template.category}
          </Badge>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Download className="w-3 h-3 mr-1" />
          Use Template
        </Button>
      </div>

      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const featuredTemplates = getFeaturedTemplates();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Request Templates</h2>
          <p className="text-sm text-muted-foreground">
            Start with a pre-built template or create your own
          </p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Create New
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Featured Templates */}
      {!searchQuery && featuredTemplates.length > 0 && (
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Featured Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="it_access">IT & Access</TabsTrigger>
          <TabsTrigger value="hr_admin">HR & Admin</TabsTrigger>
          <TabsTrigger value="time_schedule">Time & Schedule</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getDisplayTemplates().map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
          
          {getDisplayTemplates().length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? 'No templates found matching your search.' : 'No templates available in this category.'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};