import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/shared/BrandLogo';

const CookiePolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <BrandLogo />
            <Link to="/login">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Cookie Policy</h1>
          
          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">What Are Cookies</h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device when you visit our website. 
                They are widely used to make websites work more efficiently and provide information to the owners of the site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Cookies</h2>
              <p>We use cookies for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly and cannot be switched off.</li>
                <li><strong>Performance Cookies:</strong> These help us understand how visitors interact with our website by collecting anonymous information.</li>
                <li><strong>Functionality Cookies:</strong> These enable enhanced functionality and personalization, such as remembering your preferences.</li>
                <li><strong>Marketing Cookies:</strong> These are used to deliver relevant advertisements and track the effectiveness of our campaigns.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Strictly Necessary Cookies</h3>
                  <p>These cookies are essential for the website to function and cannot be disabled. They include authentication, security, and basic functionality cookies.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Analytics Cookies</h3>
                  <p>We use Google Analytics and similar services to understand how our website is used and to improve user experience.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Preference Cookies</h3>
                  <p>These remember your choices such as language, region, or theme preferences to enhance your experience.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Managing Cookies</h2>
              <p>
                You can control and manage cookies in various ways. Most web browsers automatically accept cookies, 
                but you can modify your browser settings to decline cookies if you prefer. However, this may prevent 
                you from taking full advantage of our website.
              </p>
              <p className="mt-4">
                You can also delete cookies that have already been set. The procedure for managing and deleting 
                cookies varies depending on which browser you use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Cookies</h2>
              <p>
                Some cookies on our website are set by third-party services that appear on our pages. We do not 
                control these cookies, and you should check the relevant third party's website for more information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. Any changes will be posted on this page, 
                and the "Last Updated" date will be revised accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p>If you have any questions about our use of cookies, please contact us:</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@teamtegrate.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>123 Business Street, City, State 12345</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">
            © 2024 TeamTegrate. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;