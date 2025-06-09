
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Shield, Clock } from 'lucide-react';
import SectionContainer from '@/components/shared/SectionContainer';

const CTASection: React.FC = () => {
  return (
    <SectionContainer background="primary" maxWidth="6xl" className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="text-center relative z-10 animate-fade-in">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 border border-white/30 mb-6">
          <Sparkles className="h-4 w-4 text-white mr-2" />
          <span className="text-sm font-medium text-white">Limited Time Offer</span>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
          Ready to Transform Your Team?
        </h2>
        
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto leading-relaxed">
          Join thousands of teams already using TeamTegrate to boost productivity and streamline collaboration.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link to="/login?signup=true" className="group">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-3xl transition-all duration-300 group-hover:scale-105"
            >
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-primary-foreground/80 text-sm mb-8">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            <span>No setup fees</span>
          </div>
          <div className="flex items-center">
            <ArrowRight className="h-4 w-4 mr-2" />
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Social proof */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <p className="text-primary-foreground/90 mb-4">
            "Switching to TeamTegrate was the best decision we made for our team. 
            Our productivity increased by 40% in just the first month!"
          </p>
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold">M</span>
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Mike Chen</p>
              <p className="text-primary-foreground/70 text-sm">Team Lead, StartupXYZ</p>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default CTASection;
