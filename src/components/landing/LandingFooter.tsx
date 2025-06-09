
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Github, Linkedin } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';
import { BRAND_CONFIG } from '@/constants/brandConstants';

const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-background to-muted/50 border-t border-border/50">
      {/* Newsletter section */}
      <div className="border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Stay Updated
            </h3>
            <p className="text-muted-foreground mb-6">
              Get the latest updates, tips, and exclusive offers delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all duration-300 font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand section */}
          <div className="md:col-span-2">
            <BrandLogo size="lg" className="mb-4" />
            <p className="text-muted-foreground text-sm mb-6 max-w-md leading-relaxed">
              {BRAND_CONFIG.description}
            </p>
            <div className="flex space-x-4">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' }
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-lg">Product</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Features', href: '/login' },
                { label: 'Pricing', href: '/login' },
                { label: 'Demo', href: '/login' },
                { label: 'API', href: '/login' },
                { label: 'Integrations', href: '/login' }
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link 
                    to={href} 
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-lg">Company</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'About', href: '/login' },
                { label: 'Contact', href: '/login' },
                { label: 'Support', href: '/login' },
                { label: 'Blog', href: '/login' },
                { label: 'Careers', href: '/login' }
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link 
                    to={href} 
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact info */}
        <div className="border-t border-border/50 pt-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Mail, label: 'Email', value: 'hello@teamtegrate.com' },
              { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
              { icon: MapPin, label: 'Address', value: 'San Francisco, CA' }
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              &copy; 2024 {BRAND_CONFIG.name}. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              {[
                { label: 'Privacy Policy', href: '/login' },
                { label: 'Terms of Service', href: '/login' },
                { label: 'Cookie Policy', href: '/login' },
                { label: 'Security', href: '/login' }
              ].map(({ label, href }) => (
                <Link 
                  key={label}
                  to={href} 
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
