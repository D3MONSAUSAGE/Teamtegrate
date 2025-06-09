
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import BrandLogo from '@/components/shared/BrandLogo';
import DarkModeToggle from '@/components/shared/DarkModeToggle';
import { useDarkMode } from '@/hooks/useDarkMode';

const LandingNavigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-mobile-menu]')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between w-full">
          <BrandLogo className="animate-fade-in" />
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-foreground/80 hover:text-primary transition-colors duration-300 font-medium"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('benefits')}
              className="text-foreground/80 hover:text-primary transition-colors duration-300 font-medium"
            >
              Benefits
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="text-foreground/80 hover:text-primary transition-colors duration-300 font-medium"
            >
              Testimonials
            </button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Dark Mode Toggle */}
            <DarkModeToggle 
              isDark={isDark}
              onToggle={toggleDarkMode}
              size="md"
              className="hidden sm:flex"
            />

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-sm hover:bg-primary/10 transition-all duration-300">
                  Login
                </Button>
              </Link>
              <Link to="/login?signup=true">
                <Button size="sm" className="text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
              data-mobile-menu
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" data-mobile-menu>
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl"></div>
          <div className="relative z-50 pt-20 px-4 h-full overflow-y-auto">
            <div className="bg-white/90 dark:bg-card/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-border/50 animate-scale-in" data-mobile-menu>
              <div className="space-y-4">
                {/* Mobile Dark Mode Toggle */}
                <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-primary/10 transition-colors duration-300">
                  <span className="font-medium text-foreground">Dark Mode</span>
                  <DarkModeToggle 
                    isDark={isDark}
                    onToggle={toggleDarkMode}
                    size="md"
                  />
                </div>
                
                <div className="border-t border-border/50 pt-4">
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="block w-full text-left py-3 px-4 rounded-lg hover:bg-primary/10 transition-colors duration-300 font-medium text-foreground"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => scrollToSection('benefits')}
                    className="block w-full text-left py-3 px-4 rounded-lg hover:bg-primary/10 transition-colors duration-300 font-medium text-foreground"
                  >
                    Benefits
                  </button>
                  <button 
                    onClick={() => scrollToSection('testimonials')}
                    className="block w-full text-left py-3 px-4 rounded-lg hover:bg-primary/10 transition-colors duration-300 font-medium text-foreground"
                  >
                    Testimonials
                  </button>
                </div>
                
                <div className="border-t border-border/50 pt-4 space-y-3">
                  <Link to="/login" className="block">
                    <Button variant="outline" className="w-full min-h-[48px]">
                      Login
                    </Button>
                  </Link>
                  <Link to="/login?signup=true" className="block">
                    <Button className="w-full bg-gradient-to-r from-primary to-primary/80 min-h-[48px]">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed nav */}
      <div className="h-20"></div>
    </>
  );
};

export default LandingNavigation;
