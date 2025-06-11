
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
  console.log('LandingPage: Starting to render');
  
  const { isLoading, isOptimized } = useMobileOptimization({
    enableReducedMotion: true,
    optimizeScrolling: true,
    enableTouchOptimization: true,
  });

  useEffect(() => {
    console.log('LandingPage: useEffect running');
    // Ensure body can scroll on mobile
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    
    return () => {
      // Clean up
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.minHeight = '';
    };
  }, []);

  console.log('LandingPage: isLoading:', isLoading, 'isOptimized:', isOptimized);

  if (isLoading) {
    console.log('LandingPage: Showing loading state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Teamtegrate...</p>
        </div>
      </div>
    );
  }

  console.log('LandingPage: Rendering main content');
  
  try {
    return (
      <div className={`min-h-screen bg-background overflow-x-hidden w-full ${isOptimized ? 'fade-in' : 'loading'}`}>
        <LandingNavigation />
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
    );
  } catch (error) {
    console.error('LandingPage: Error in render:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load landing page</h2>
          <p className="text-muted-foreground mb-4">There was an error loading the page components</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default LandingPage;
