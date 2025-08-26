import React, { useState } from 'react';
import { Grid, List, Search, Filter, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ImageLightbox } from './ImageLightbox';
import { AudioPlayer } from './AudioPlayer';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
  name: string;
  size?: number;
  duration?: number;
  waveform?: number[];
  transcript?: string;
  createdAt: string;
  messageId: string;
}

interface EnhancedMediaGalleryProps {
  items: MediaItem[];
  className?: string;
}

export function EnhancedMediaGallery({ items, className }: EnhancedMediaGalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'audio' | 'video' | 'file'>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const mediaTypes = {
    all: items.length,
    image: items.filter(item => item.type === 'image').length,
    audio: items.filter(item => item.type === 'audio').length,
    video: items.filter(item => item.type === 'video').length,
    file: items.filter(item => item.type === 'file').length,
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.transcript && item.transcript.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const imageItems = filteredItems.filter(item => item.type === 'image');

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleImageClick = (index: number) => {
    const imageIndex = imageItems.findIndex(item => item === filteredItems[index]);
    if (imageIndex >= 0) {
      setSelectedImageIndex(imageIndex);
      setLightboxOpen(true);
    }
  };

  const handleDownload = (item: MediaItem) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderGridItem = (item: MediaItem, index: number) => {
    const commonClasses = "group relative overflow-hidden rounded-lg border bg-card hover:bg-accent/50 transition-colors";
    
    switch (item.type) {
      case 'image':
        return (
          <div key={item.id} className={cn(commonClasses, "aspect-square cursor-pointer")}>
            <img
              src={item.url}
              alt={item.name}
              className="w-full h-full object-cover"
              onClick={() => handleImageClick(index)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 bg-background/80"
                  onClick={() => handleImageClick(index)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 bg-background/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                  }}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-xs truncate">{item.name}</p>
            </div>
          </div>
        );
        
      case 'audio':
        return (
          <div key={item.id} className={cn(commonClasses, "aspect-square p-4 flex flex-col")}>
            <AudioPlayer
              audioUrl={item.url}
              fileName={item.name}
              duration={item.duration}
              waveform={item.waveform}
              transcript={item.transcript}
              className="flex-1 border-0 shadow-none p-0 bg-transparent"
            />
          </div>
        );
        
      default:
        return (
          <Card key={item.id} className={cn(commonClasses, "aspect-square p-4 flex flex-col items-center justify-center text-center")}>
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mb-2">
              <span className="text-xs font-mono">{item.name.split('.').pop()?.toUpperCase()}</span>
            </div>
            <p className="text-sm font-medium truncate w-full">{item.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(item)}
              className="mt-2"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </Card>
        );
    }
  };

  const renderListItem = (item: MediaItem, index: number) => {
    return (
      <Card key={item.id} className="p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors">
        {/* Thumbnail/Icon */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => handleImageClick(index)}
            />
          ) : (
            <span className="text-xs font-mono">{item.name.split('.').pop()?.toUpperCase()}</span>
          )}
        </div>
        
        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{item.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {item.type}
            </Badge>
            {item.size && (
              <span className="text-xs text-muted-foreground">{formatFileSize(item.size)}</span>
            )}
            <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
          </div>
          {item.transcript && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              "{item.transcript}"
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {item.type === 'image' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleImageClick(index)}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDownload(item)}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Media Gallery</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {Object.entries(mediaTypes).map(([type, count]) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedType(type as any)}
            className="text-xs"
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
          </Button>
        ))}
      </div>

      {/* Media Grid/List */}
      <div className={cn(
        viewMode === 'grid' 
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
          : "space-y-2"
      )}>
        {filteredItems.map((item, index) => (
          viewMode === 'grid' ? renderGridItem(item, index) : renderListItem(item, index)
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Filter className="h-8 w-8 mx-auto mb-2" />
          <p>No media files found</p>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxOpen && imageItems.length > 0 && (
        <ImageLightbox
          images={imageItems.map(item => ({
            url: item.url,
            name: item.name,
            alt: item.name
          }))}
          initialIndex={selectedImageIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}