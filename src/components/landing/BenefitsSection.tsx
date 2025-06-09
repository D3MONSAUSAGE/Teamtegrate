
import React from 'react';
import { CheckCircle, TrendingUp, Users, Clock, Shield, Zap } from 'lucide-react';
import SectionContainer from '@/components/shared/SectionContainer';
import { benefits } from '@/data/landingPageData';

const BenefitsSection: React.FC = () => {
  const benefitIcons = [TrendingUp, Clock, Users, Shield, Zap, CheckCircle];

  return (
    <SectionContainer id="benefits" background="muted" maxWidth="7xl">
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
          <span className="text-sm font-medium text-secondary-foreground">🚀 Benefits</span>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Why Teams Choose TeamTegrate
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Join thousands of teams already transforming their productivity
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {benefits.map((benefit, index) => {
          const IconComponent = benefitIcons[index] || CheckCircle;
          return (
            <div 
              key={index} 
              className="group flex items-start space-x-4 p-6 rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-card/80 dark:to-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 animate-fade-in hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <IconComponent className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div className="flex-1">
                <span className="text-foreground text-lg font-medium leading-relaxed group-hover:text-primary transition-colors duration-300">
                  {benefit}
                </span>
              </div>
              {/* Hover effect indicator */}
              <div className="w-2 h-2 bg-primary/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </div>
          );
        })}
      </div>

      {/* Stats section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in">
        {[
          { number: '10,000+', label: 'Happy Teams', icon: Users },
          { number: '50M+', label: 'Tasks Completed', icon: CheckCircle },
          { number: '40%', label: 'Productivity Increase', icon: TrendingUp },
          { number: '99.9%', label: 'Uptime Guarantee', icon: Shield }
        ].map((stat, index) => (
          <div 
            key={index}
            className="text-center group p-6 rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-card/60 dark:to-card/40 backdrop-blur-sm border border-border/30 hover:border-primary/30 hover:shadow-lg transition-all duration-500 animate-fade-in"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <stat.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
              {stat.number}
            </div>
            <div className="text-sm md:text-base text-muted-foreground group-hover:text-foreground transition-colors duration-300">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};

export default BenefitsSection;
