
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Users, Zap, Target } from 'lucide-react';
import SectionContainer from '@/components/shared/SectionContainer';
import FeatureSlideshow from './FeatureSlideshow';
import { HERO_CONFIG } from '@/constants/brandConstants';

const HeroSection: React.FC = () => {
  return (
    <SectionContainer 
      background="default" 
      maxWidth="7xl"
      className="relative text-center bg-gradient-to-br from-background via-background/50 to-primary/5 overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        {/* Floating stats cards */}
        <div className="hidden lg:block absolute top-20 left-10 animate-float">
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">10K+</p>
                <p className="text-xs text-muted-foreground">Active Teams</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute top-32 right-10 animate-float delay-300">
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Zap className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">40%</p>
                <p className="text-xs text-muted-foreground">Productivity Boost</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-32 left-20 animate-float delay-700">
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Target className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main hero content */}
        <div className="animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="text-sm font-medium text-primary">🎉 New: AI-powered task management</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 px-4 leading-tight">
            {HERO_CONFIG.title}
            <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent animate-gradient">
              {HERO_CONFIG.highlight}
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto px-4 leading-relaxed">
            {HERO_CONFIG.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 mb-8">
            <Link to="/login?signup=true" className="w-full sm:w-auto group">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                {HERO_CONFIG.cta.primary}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto group">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 bg-white/80 dark:bg-card/80 backdrop-blur-sm border-2 hover:bg-accent/10 hover:border-primary/30 transition-all duration-300 group-hover:scale-105">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                {HERO_CONFIG.cta.secondary}
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground px-4">
            {HERO_CONFIG.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Feature Slideshow */}
        <div className="mt-16 animate-fade-in delay-500">
          <FeatureSlideshow />
        </div>
      </div>
    </SectionContainer>
  );
};

export default HeroSection;
