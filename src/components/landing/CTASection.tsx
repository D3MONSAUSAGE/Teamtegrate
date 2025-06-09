
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import SectionContainer from '@/components/shared/SectionContainer';

const CTASection: React.FC = () => {
  return (
    <SectionContainer background="primary" maxWidth="4xl">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
          Ready to Transform Your Team?
        </h2>
        <p className="text-lg text-primary-foreground/80 mb-8">
          Join thousands of teams already using TeamTegrate to boost productivity and streamline collaboration.
        </p>
        <Link to="/login?signup=true">
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
            Start Your Free Trial Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <p className="text-sm text-primary-foreground/70 mt-4">
          14-day free trial • No setup fees • Cancel anytime
        </p>
      </div>
    </SectionContainer>
  );
};

export default CTASection;
