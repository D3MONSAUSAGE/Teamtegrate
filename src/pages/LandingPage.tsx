
import React, { useEffect } from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

// Lazy load components for better performance
const LandingNavigation = React.lazy(() => import('@/components/landing/LandingNavigation'));
const HeroSection = React.lazy(() => import('@/components/landing/HeroSection'));
const FeaturesSection = React.lazy(() => import('@/components/landing/FeaturesSection'));
const BenefitsSection = React.lazy(() => import('@/components/landing/BenefitsSection'));
const TestimonialsSection = React.lazy(() => import('@/components/landing/TestimonialsSection'));
const CTASection = React.lazy(() => import('@/components/landing/CTASection'));
const LandingFooter = React.lazy(() => import('@/components/landing/LandingFooter'));

const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading TeamTegrate...</p>
    </div>
  </div>
);

const LandingPage = () => {
  console.log('LandingPage: Starting to render');
  
  const { isOptimized } = useMobileOptimization({
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

  console.log('LandingPage: isOptimized:', isOptimized);

  console.log('LandingPage: Rendering main content');
  
  try {
    return (
      <div className={`min-h-screen bg-background overflow-x-hidden w-full ${isOptimized ? 'fade-in' : 'loading'}`}>
        <React.Suspense fallback={<div className="h-16 bg-background" />}>
          <LandingNavigation />
        </React.Suspense>
        
        <React.Suspense fallback={<LoadingSpinner />}>
          <HeroSection />
        </React.Suspense>
        
        <React.Suspense fallback={<div className="h-32 bg-muted animate-pulse" />}>
          <div id="features">
            <FeaturesSection />
          </div>
        </React.Suspense>
        
        <React.Suspense fallback={<div className="h-32 bg-background animate-pulse" />}>
          <div id="benefits">
            <BenefitsSection />
          </div>
        </React.Suspense>
        
        <React.Suspense fallback={<div className="h-32 bg-muted animate-pulse" />}>
          <div id="testimonials">
            <TestimonialsSection />
          </div>
        </React.Suspense>
        
        <React.Suspense fallback={<div className="h-32 bg-primary animate-pulse" />}>
          <CTASection />
        </React.Suspense>
        
        <React.Suspense fallback={<div className="h-16 bg-background" />}>
          <LandingFooter />
        </React.Suspense>
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
