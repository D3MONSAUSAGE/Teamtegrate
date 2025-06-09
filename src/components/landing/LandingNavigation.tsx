
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/shared/BrandLogo';

const LandingNavigation: React.FC = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full overflow-x-hidden">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between w-full">
        <BrandLogo />
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-sm sm:text-base">Login</Button>
          </Link>
          <Link to="/login?signup=true">
            <Button size="sm" className="text-sm sm:text-base whitespace-nowrap">Get Started Free</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavigation;
