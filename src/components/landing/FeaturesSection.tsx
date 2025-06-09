
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import SectionContainer from '@/components/shared/SectionContainer';
import { features } from '@/data/landingPageData';

const FeaturesSection: React.FC = () => {
  return (
    <SectionContainer background="default">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Everything Your Team Needs
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Powerful features designed to simplify team management and boost productivity
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </SectionContainer>
  );
};

export default FeaturesSection;
