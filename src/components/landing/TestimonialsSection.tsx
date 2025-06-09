
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import SectionContainer from '@/components/shared/SectionContainer';
import { testimonials } from '@/data/landingPageData';

const TestimonialsSection: React.FC = () => {
  return (
    <SectionContainer background="default" maxWidth="7xl">
      <div className="text-center mb-16 animate-fade-in">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
          <span className="text-sm font-medium text-accent-foreground">💬 Testimonials</span>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Loved by Teams Worldwide
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          See what our customers have to say about TeamTegrate
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {testimonials.map((testimonial, index) => (
          <Card 
            key={index} 
            className="group border-border hover:border-accent/30 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/90 to-white/70 dark:from-card/90 dark:to-card/70 backdrop-blur-sm animate-fade-in hover:scale-105 relative overflow-hidden"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <CardContent className="p-8 relative">
              {/* Quote icon background */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <Quote className="h-16 w-16 text-primary" />
              </div>

              {/* Stars */}
              <div className="flex mb-6 relative z-10">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1 group-hover:scale-110 transition-transform duration-300" 
                    style={{ transitionDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>

              {/* Testimonial content */}
              <blockquote className="text-foreground/90 mb-6 text-lg leading-relaxed relative z-10 group-hover:text-foreground transition-colors duration-300">
                "{testimonial.content}"
              </blockquote>

              {/* Author info */}
              <div className="flex items-center relative z-10">
                {/* Avatar placeholder */}
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>

              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust indicators */}
      <div className="text-center animate-fade-in">
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl p-8 border border-border/50">
          <h3 className="text-xl font-bold text-foreground mb-6">
            Trusted by industry leaders
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            {/* Company placeholder logos */}
            {['TechCorp', 'StartupXYZ', 'GrowthCo', 'InnovateInc'].map((company, index) => (
              <div 
                key={company}
                className="flex items-center justify-center p-4 bg-white/50 dark:bg-card/50 rounded-xl hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mr-3"></div>
                <span className="font-semibold text-foreground/70">{company}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default TestimonialsSection;
