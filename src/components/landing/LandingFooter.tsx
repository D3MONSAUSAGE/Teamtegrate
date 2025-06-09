
import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '@/components/shared/BrandLogo';
import { BRAND_CONFIG } from '@/constants/brandConstants';

const LandingFooter: React.FC = () => {
  return (
    <footer className="py-12 px-4 bg-background border-t">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <BrandLogo size="sm" className="mb-4" />
            <p className="text-muted-foreground text-sm">
              {BRAND_CONFIG.description}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground">Features</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Demo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground">About</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground">Privacy</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 {BRAND_CONFIG.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
