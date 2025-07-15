
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Download, Pin, Clock, User, Hash } from 'lucide-react';
import ProjectUpdateItem from './ProjectUpdateItem';
import ProjectUpdateEditor from './ProjectUpdateEditor';
import { useProjectComments } from '@/hooks/useProjectComments';
import { updateProjectComment, deleteProjectComment, searchProjectComments, getProjectCommentStats } from '@/contexts/task/api/enhancedComments';
import { EnhancedTaskComment, CommentFilter } from '@/types/enhancedComments';
import { toast } from 'sonner';

interface ProjectNotebookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

const ProjectNotebookDialog: React.FC<ProjectNotebookDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  projectTitle
}) => {
  const { comments, loading, addComment, refreshComments } = useProjectComments(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CommentFilter>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedSidebarItem, setSelectedSidebarItem] = useState('all');

  // Convert comments to enhanced format
  const enhancedComments: EnhancedTaskComment[] = useMemo(() => {
    return comments.map(comment => ({
      id: comment.id,
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: comment.createdAt,
      organizationId: comment.organizationId,
      category: (comment as any).category || 'general',
      isPinned: (comment as any).isPinned || false,
      metadata: (comment as any).metadata || {},
      updatedAt: (comment as any).updatedAt
    }));
  }, [comments]);

  // Load stats when dialog opens
  useEffect(() => {
    if (open && projectId) {
      getProjectCommentStats(projectId)
        .then(setStats)
        .catch(console.error);
    }
  }, [open, projectId]);

  // Filter comments based on current filters
  const filteredComments = useMemo(() => {
    let filtered = enhancedComments;

    // Search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(comment =>
        comment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filter.category && filter.category !== 'all') {
      filtered = filtered.filter(comment => comment.category === filter.category);
    }

    // Sidebar filter
    switch (selectedSidebarItem) {
      case 'pinned':
        filtered = filtered.filter(comment => comment.isPinned);
        break;
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(comment => comment.createdAt >= oneWeekAgo);
        break;
      case 'mine':
        // This would need user context to filter by current user
        break;
    }

    // Show pinned first, then sort by creation date
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [enhancedComments, searchQuery, filter, selectedSidebarItem]);

  const handleAddUpdate = async (content: string, category: string, isPinned: boolean) => {
    try {
      await addComment(content);
      // Note: The current addComment doesn't support category/isPinned, 
      // but we'll refresh to get the latest data
      await refreshComments();
      toast.success('Update added successfully');
    } catch (error) {
      toast.error('Failed to add update');
    }
  };

  const handleEditComment = async (commentId: string, updates: { content?: string; category?: string; is_pinned?: boolean }) => {
    try {
      await updateProjectComment(commentId, updates);
      await refreshComments();
      setEditingCommentId(null);
      toast.success('Update saved successfully');
    } catch (error) {
      toast.error('Failed to save update');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteProjectComment(commentId);
      await refreshComments();
      toast.success('Update deleted successfully');
    } catch (error) {
      toast.error('Failed to delete update');
    }
  };

  const sidebarItems = [
    { id: 'all', label: 'All Updates', icon: Hash, count: enhancedComments.length },
    { id: 'recent', label: 'Recent', icon: Clock, count: stats?.recent_comments || 0 },
    { id: 'pinned', label: 'Pinned', icon: Pin, count: stats?.pinned_comments || 0 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Project Journal - {projectTitle}</span>
              <Badge variant="secondary" className="text-xs">
                {enhancedComments.length} {enhancedComments.length === 1 ? 'update' : 'updates'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-48 border-r bg-muted/30 p-3 shrink-0">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <Button
                  key={item.id}
                  variant={selectedSidebarItem === item.id ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => setSelectedSidebarItem(item.id)}
                >
                  <item.icon className="h-3 w-3 mr-2" />
                  {item.label}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {item.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search and Filters */}
            <div className="p-3 border-b bg-background shrink-0">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search updates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-8"
                  />
                </div>
                <Select value={filter.category || 'all'} onValueChange={(value) => setFilter({ ...filter, category: value === 'all' ? undefined : value })}>
                  <SelectTrigger className="w-32 h-8">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Updates List */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading updates...
                    </div>
                  ) : filteredComments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery || filter.category || selectedSidebarItem !== 'all' 
                        ? 'No updates match your filters'
                        : 'No updates yet. Add the first one below!'
                      }
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredComments.map((comment) => (
                        <ProjectUpdateItem
                          key={comment.id}
                          comment={comment}
                          onEdit={handleEditComment}
                          onDelete={handleDeleteComment}
                          isEditing={editingCommentId === comment.id}
                          onEditStart={() => setEditingCommentId(comment.id)}
                          onEditCancel={() => setEditingCommentId(null)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Add Update Form */}
            <div className="p-3 shrink-0">
              <ProjectUpdateEditor 
                onSubmit={handleAddUpdate}
                placeholder="Share a project update..."
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectNotebookDialog;
