
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import SectionContainer from '@/components/shared/SectionContainer';
import { HERO_CONFIG } from '@/constants/brandConstants';

const HeroSection: React.FC = () => {
  return (
    <SectionContainer 
      background="default" 
      maxWidth="4xl"
      className="text-center bg-gradient-to-br from-background to-muted"
    >
      <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
        {HERO_CONFIG.title}
        <span className="text-primary block">{HERO_CONFIG.highlight}</span>
      </h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        {HERO_CONFIG.subtitle}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/login?signup=true">
          <Button size="lg" className="w-full sm:w-auto">
            {HERO_CONFIG.cta.primary}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            {HERO_CONFIG.cta.secondary}
          </Button>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        {HERO_CONFIG.features.join(' • ')}
      </p>
    </SectionContainer>
  );
};

export default HeroSection;
