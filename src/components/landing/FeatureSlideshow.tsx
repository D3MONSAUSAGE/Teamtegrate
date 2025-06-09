
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel';
import { Users, MessageCircle, BarChart3, Clock, FileText, Target } from 'lucide-react';

interface FeatureSlide {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  imageSrc: string;
  features: string[];
}

const featureSlides: FeatureSlide[] = [
  {
    id: 'dashboard',
    title: 'Unified Dashboard',
    description: 'Get a complete overview of your team\'s productivity, tasks, and progress in one centralized location.',
    icon: BarChart3,
    imageSrc: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=500&fit=crop',
    features: ['Real-time metrics', 'Task overview', 'Team performance']
  },
  {
    id: 'chat',
    title: 'Team Communication',
    description: 'Seamless chat functionality with file sharing, mentions, and real-time collaboration features.',
    icon: MessageCircle,
    imageSrc: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=500&fit=crop',
    features: ['Real-time messaging', 'File sharing', 'Team channels']
  },
  {
    id: 'projects',
    title: 'Project Management',
    description: 'Organize projects, assign tasks, track progress, and manage deadlines with powerful project tools.',
    icon: Target,
    imageSrc: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=500&fit=crop',
    features: ['Task assignment', 'Progress tracking', 'Deadline management']
  },
  {
    id: 'time-tracking',
    title: 'Time Tracking',
    description: 'Track work hours, manage breaks, and generate detailed reports for better productivity insights.',
    icon: Clock,
    imageSrc: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop',
    features: ['Clock in/out', 'Break tracking', 'Time reports']
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Comprehensive reports and analytics to understand team performance and project success.',
    icon: BarChart3,
    imageSrc: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=500&fit=crop',
    features: ['Performance metrics', 'Custom reports', 'Data insights']
  },
  {
    id: 'collaboration',
    title: 'Team Collaboration',
    description: 'Foster teamwork with shared documents, collaborative editing, and team management tools.',
    icon: Users,
    imageSrc: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=500&fit=crop',
    features: ['Document sharing', 'Team roles', 'Collaborative tools']
  }
];

const FeatureSlideshow: React.FC = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="relative max-w-5xl mx-auto">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {featureSlides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div className="bg-gradient-to-br from-white/90 to-white/70 dark:from-card/90 dark:to-card/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden transform hover:scale-[1.02] transition-all duration-700">
                {/* Feature Image */}
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img 
                    src={slide.imageSrc} 
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {/* Feature Icon */}
                  <div className="absolute top-6 left-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                      <slide.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>

                  {/* Feature Badge */}
                  <div className="absolute top-6 right-6">
                    <div className="px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                      {current} of {count}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    {slide.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                    {slide.description}
                  </p>

                  {/* Feature List */}
                  <div className="flex flex-wrap gap-3">
                    {slide.features.map((feature, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium text-primary">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Buttons */}
        <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-card/90 backdrop-blur-sm border border-border/60 hover:bg-primary hover:text-primary-foreground transition-all duration-200" />
        <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-card/90 backdrop-blur-sm border border-border/60 hover:bg-primary hover:text-primary-foreground transition-all duration-200" />
      </Carousel>

      {/* Slide Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {featureSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === current - 1 
                ? 'bg-primary scale-125 shadow-lg' 
                : 'bg-muted hover:bg-primary/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureSlideshow;
