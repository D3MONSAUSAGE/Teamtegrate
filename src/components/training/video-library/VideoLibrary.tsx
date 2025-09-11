import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Video, Play } from 'lucide-react';
import { VideoLibraryItemCard } from './VideoLibraryItemCard';
import { VideoPlayerDialog } from './VideoPlayerDialog';
import { useVideoLibraryItems, useVideoLibraryCategories } from '@/hooks/useVideoLibrary';

export const VideoLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { data: videos, isLoading: videosLoading } = useVideoLibraryItems(selectedCategory || undefined);
  const { data: categories } = useVideoLibraryCategories();

  // Filter videos based on search term
  const filteredVideos = videos?.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handlePlayVideo = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Video Library</h2>
          <p className="text-muted-foreground">
            Access training videos to learn how to perform tasks and procedures
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Available Videos</span>
          </CardTitle>
          <CardDescription>
            Click on any video to watch and learn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {videosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading videos...</div>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => (
                <VideoLibraryItemCard
                  key={video.id}
                  video={video}
                  onPlayVideo={handlePlayVideo}
                />
              ))}
            </div>
          ) : videos?.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No videos available</h3>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to add training videos to the library
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No videos found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms or category filter
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVideo && (
        <VideoPlayerDialog
          videoId={selectedVideo}
          open={!!selectedVideo}
          onOpenChange={(open) => !open && setSelectedVideo(null)}
        />
      )}
    </div>
  );
};