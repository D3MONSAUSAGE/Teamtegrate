import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/shared/BrandLogo';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
            <BrandLogo />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-lg text-muted-foreground mt-4">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold">Agreement to Terms</h2>
              <p>
                By accessing and using TeamTegrate, you accept and agree to be bound by the terms
                and provision of this agreement.
              </p>

              <h2 className="text-2xl font-semibold">Use License</h2>
              <p>
                Permission is granted to temporarily use TeamTegrate for personal and commercial use.
                This license does not include the right to distribute or modify the service.
              </p>

              <h2 className="text-2xl font-semibold">User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password
                and for restricting access to your account.
              </p>

              <h2 className="text-2xl font-semibold">Prohibited Uses</h2>
              <p>
                You may not use our service for any unlawful purpose or to solicit others to perform
                or participate in any unlawful acts.
              </p>

              <h2 className="text-2xl font-semibold">Service Availability</h2>
              <p>
                We strive to maintain service availability but cannot guarantee uninterrupted access.
                We reserve the right to modify or discontinue the service at any time.
              </p>

              <h2 className="text-2xl font-semibold">Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="flex items-center gap-2 text-primary">
                <Mail className="h-4 w-4" />
                <span>legal@teamtegrate.com</span>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 TeamTegrate. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;