
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/shared/BrandLogo';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <BrandLogo size="md" />
            <Link to="/login">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-8 md:p-12">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: July 19, 2025
            </p>

            <div className="space-y-8">
              <section>
                <p className="text-foreground leading-relaxed">
                  TeamTegrate ("we", "our", or "us") is committed to protecting your privacy. 
                  This Privacy Policy explains how your personal information is collected, used, 
                  and disclosed when you use our mobile application and related services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  We collect information that you provide to us directly, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Name, email address, and organization info during account creation</li>
                  <li>Tasks, projects, and other user-generated content</li>
                  <li>Usage data and technical information (device, IP, browser)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Provide and improve our app</li>
                  <li>Respond to support requests</li>
                  <li>Communicate app updates</li>
                  <li>Ensure account and data security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  3. Sharing of Information
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  We do not sell your data. We may share your information:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>With trusted service providers (e.g., hosting, analytics)</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  4. Data Security
                </h2>
                <p className="text-foreground leading-relaxed">
                  We implement industry-standard measures to protect your data, including 
                  encryption, access controls, and secure backups.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  5. Your Rights
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  You may:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Access or delete your data</li>
                  <li>Request correction or restriction</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <p className="text-foreground leading-relaxed mt-4">
                  Contact <a href="mailto:support@teamtegrate.com" className="text-primary hover:underline">
                    support@teamtegrate.com
                  </a> for any privacy-related requests.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  6. Changes
                </h2>
                <p className="text-foreground leading-relaxed">
                  We may update this policy. Changes will be posted at:{' '}
                  <a href="https://teamtegrate.com/privacy" className="text-primary hover:underline">
                    https://teamtegrate.com/privacy
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  7. Contact
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  If you have questions about this Privacy Policy, contact us at:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span className="text-foreground">
                      Email: <a href="mailto:support@teamtegrate.com" className="text-primary hover:underline">
                        support@teamtegrate.com
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-foreground">
                      Address: [Insert your business address here]
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 TeamTegrate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
