
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import SectionContainer from '@/components/shared/SectionContainer';
import { features } from '@/data/landingPageData';

const FeaturesSection: React.FC = () => {
  return (
    <SectionContainer background="muted" maxWidth="7xl">
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <span className="text-sm font-medium text-primary">✨ Features</span>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Everything Your Team Needs
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Powerful features designed to simplify team management and boost productivity
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Card 
              key={index} 
              className="group border-border hover:border-primary/30 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/80 to-white/60 dark:from-card/80 dark:to-card/60 backdrop-blur-sm animate-fade-in hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8 relative overflow-hidden">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="mb-6 relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <IconComponent className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    {/* Floating dots */}
                    <div className="absolute -top-2 -right-2 w-3 h-3 bg-accent rounded-full opacity-60 group-hover:animate-bounce"></div>
                  </div>
                  
                  <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>

                {/* Hover effect border */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom CTA section */}
      <div className="mt-16 text-center animate-fade-in">
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-3xl p-8 md:p-12 border border-primary/20">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to transform your workflow?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of teams already using our platform to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-400"></div>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default FeaturesSection;
