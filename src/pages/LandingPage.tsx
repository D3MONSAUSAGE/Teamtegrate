
import React, { useEffect } from 'react';
import LandingNavigation from '@/components/landing/LandingNavigation';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

const LandingPage = () => {
  const { isLoading, isOptimized } = useMobileOptimization({
    enableReducedMotion: true,
    optimizeScrolling: true,
    enableTouchOptimization: true,
  });

  useEffect(() => {
    // Ensure body prevents scrolling completely
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.minHeight = '100vh';
    
    return () => {
      // Clean up
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.minHeight = '';
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Teamtegrate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-background overflow-hidden w-full ${isOptimized ? 'fade-in' : 'loading'}`}>
      <LandingNavigation />
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="benefits">
          <BenefitsSection />
        </div>
        <div id="testimonials">
          <TestimonialsSection />
        </div>
        <CTASection />
        <LandingFooter />
      </div>
    </div>
  );
};

export default LandingPage;
