
import React from 'react';
import { CheckCircle } from 'lucide-react';
import SectionContainer from '@/components/shared/SectionContainer';
import { benefits } from '@/data/landingPageData';

const BenefitsSection: React.FC = () => {
  return (
    <SectionContainer background="muted" maxWidth="4xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Why Teams Choose TeamTegrate
        </h2>
        <p className="text-lg text-muted-foreground">
          Join thousands of teams already transforming their productivity
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-foreground">{benefit}</span>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};

export default BenefitsSection;
