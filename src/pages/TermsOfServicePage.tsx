import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/shared/BrandLogo';

const TermsOfServicePage: React.FC = () => {
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
              Terms of Service
            </h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: January 17, 2025
            </p>

            <div className="space-y-8">
              <section>
                <p className="text-foreground leading-relaxed">
                  Welcome to TeamTegrate! These Terms of Service ("Terms") govern your use of our 
                  mobile application and related services ("Service") operated by TeamTegrate ("us", "we", or "our"). 
                  By accessing or using our Service, you agree to be bound by these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-foreground leading-relaxed">
                  By creating an account or using TeamTegrate, you acknowledge that you have read, 
                  understood, and agree to be bound by these Terms and our Privacy Policy. 
                  If you do not agree with these terms, please do not use our Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  2. Description of Service
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  TeamTegrate is a productivity and project management application that allows users to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Create and manage tasks and projects</li>
                  <li>Collaborate with team members</li>
                  <li>Track time and monitor progress</li>
                  <li>Integrate with calendar and other productivity tools</li>
                  <li>Access reports and analytics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  3. User Accounts
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  To use our Service, you must create an account. You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  4. Acceptable Use Policy
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>Violate any laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Upload malicious code or harmful content</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the Service for commercial purposes without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  5. Intellectual Property
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  The Service and its original content, features, and functionality are owned by 
                  TeamTegrate and are protected by copyright, trademark, and other laws. You retain 
                  ownership of content you create, but grant us a license to use it to provide the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  6. Privacy and Data Protection
                </h2>
                <p className="text-foreground leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also 
                  governs your use of the Service, to understand our practices regarding your personal data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  7. Service Availability
                </h2>
                <p className="text-foreground leading-relaxed">
                  We strive to provide reliable service but cannot guarantee 100% uptime. 
                  We reserve the right to modify, suspend, or discontinue the Service with reasonable notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  8. Limitation of Liability
                </h2>
                <p className="text-foreground leading-relaxed">
                  To the maximum extent permitted by law, TeamTegrate shall not be liable for any 
                  indirect, incidental, special, or consequential damages arising out of or in 
                  connection with your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  9. Termination
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  Either party may terminate your account:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
                  <li>You may delete your account at any time</li>
                  <li>We may suspend or terminate accounts that violate these Terms</li>
                  <li>Upon termination, your right to use the Service ceases immediately</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  10. Changes to Terms
                </h2>
                <p className="text-foreground leading-relaxed">
                  We may update these Terms from time to time. We will notify you of any material 
                  changes by posting the new Terms on this page with an updated effective date. 
                  Your continued use constitutes acceptance of the revised Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  11. Governing Law
                </h2>
                <p className="text-foreground leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of 
                  the State of California, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  12. Contact Information
                </h2>
                <p className="text-foreground leading-relaxed mb-4">
                  If you have any questions about these Terms of Service, please contact us:
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

export default TermsOfServicePage;