import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: Array<{
    url: string;
    name: string;
    alt?: string;
  }>;
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleDownload = async () => {
    const image = images[currentIndex];
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="text-white">
          <h3 className="text-lg font-medium truncate max-w-md">{currentImage.name}</h3>
          <p className="text-sm text-white/70">{currentIndex + 1} of {images.length}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden cursor-move"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`
        }}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt || currentImage.name}
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `scale(${zoom})`,
            transition: zoom === 1 ? 'transform 0.2s ease-out' : 'none'
          }}
          draggable={false}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden',
                index === currentIndex ? 'border-primary' : 'border-white/30'
              )}
              onClick={() => {
                setCurrentIndex(index);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};