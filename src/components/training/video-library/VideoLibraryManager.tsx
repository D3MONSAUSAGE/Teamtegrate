import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Video, Settings, Users, FolderOpen } from 'lucide-react';
import { AddVideoDialog } from './AddVideoDialog';
import { AddCategoryDialog } from './AddCategoryDialog';
import { VideoPermissionsDialog } from './VideoPermissionsDialog';
import { DeleteVideoDialog } from './DeleteVideoDialog';
import { EditVideoDialog } from './EditVideoDialog';
import { VideoLibraryItemCard } from './VideoLibraryItemCard';
import { VideoLibraryCategoryCard } from './VideoLibraryCategoryCard';
import { useAllVideoLibraryItems, useVideoLibraryCategories, VideoLibraryItem } from '@/hooks/useVideoLibrary';

export const VideoLibraryManager: React.FC = () => {
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoToEdit, setVideoToEdit] = useState<VideoLibraryItem | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<{ id: string; title: string } | null>(null);

  const { data: videos, isLoading: videosLoading } = useAllVideoLibraryItems();
  const { data: categories, isLoading: categoriesLoading } = useVideoLibraryCategories();

  const handleManagePermissions = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const handleEditVideo = (video: VideoLibraryItem) => {
    setVideoToEdit(video);
  };

  const handleDeleteVideo = (videoId: string, videoTitle: string) => {
    setVideoToDelete({ id: videoId, title: videoTitle });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Video Library Management</h2>
          <p className="text-muted-foreground">
            Manage training videos and assign permissions to teams and users
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowAddCategory(true)} variant="outline">
            <FolderOpen className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => setShowAddVideo(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>
      </div>

      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="videos" className="flex items-center space-x-2">
            <Video className="h-4 w-4" />
            <span>Videos</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Training Videos</span>
              </CardTitle>
              <CardDescription>
                Manage your organization's video library and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videosLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading videos...</div>
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <VideoLibraryItemCard
                      key={video.id}
                      video={video}
                      onManagePermissions={handleManagePermissions}
                      onEditVideo={handleEditVideo}
                      onDeleteVideo={handleDeleteVideo}
                      showManagement
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No videos yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start building your video library by adding your first training video
                  </p>
                  <Button onClick={() => setShowAddVideo(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Video
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>Video Categories</span>
              </CardTitle>
              <CardDescription>
                Organize your videos with categories for better navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">Loading categories...</div>
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <VideoLibraryCategoryCard
                      key={category.id}
                      category={category}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No categories yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create categories to organize your training videos
                  </p>
                  <Button onClick={() => setShowAddCategory(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddVideoDialog 
        open={showAddVideo} 
        onOpenChange={setShowAddVideo}
      />

      <AddCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
      />

      {selectedVideo && (
        <VideoPermissionsDialog
          videoId={selectedVideo}
          open={!!selectedVideo}
          onOpenChange={(open) => !open && setSelectedVideo(null)}
        />
      )}

      {videoToEdit && (
        <EditVideoDialog
          video={videoToEdit}
          open={!!videoToEdit}
          onOpenChange={(open) => !open && setVideoToEdit(null)}
        />
      )}

      {videoToDelete && (
        <DeleteVideoDialog
          videoId={videoToDelete.id}
          videoTitle={videoToDelete.title}
          open={!!videoToDelete}
          onOpenChange={(open) => !open && setVideoToDelete(null)}
        />
      )}
    </div>
  );
};