import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Shield, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/shared/BrandLogo';

const SecurityPage = () => {
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
          <div className="flex items-center gap-3 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Security Policy</h1>
          </div>
          
          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Our Commitment to Security</h2>
              <p>
                At TeamTegrate, we take the security of your data seriously. We implement industry-standard 
                security measures to protect your information and ensure the integrity of our platform.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Data Protection Measures</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Encryption</h3>
                  <p>All data transmitted between your device and our servers is encrypted using industry-standard TLS 1.3 encryption. Sensitive data at rest is encrypted using AES-256 encryption.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Authentication & Authorization</h3>
                  <p>We implement multi-factor authentication (MFA) and role-based access controls to ensure only authorized users can access your data.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Regular Security Audits</h3>
                  <p>Our systems undergo regular security assessments, penetration testing, and vulnerability scanning to identify and address potential security risks.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Infrastructure Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cloud infrastructure hosted on secure, SOC 2 Type II certified platforms</li>
                <li>Network segmentation and firewall protection</li>
                <li>Automated security monitoring and incident detection</li>
                <li>Regular backups with point-in-time recovery capabilities</li>
                <li>DDoS protection and rate limiting</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Privacy & Compliance</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Data Minimization</h3>
                  <p>We collect only the minimum amount of data necessary to provide our services and delete data when it's no longer needed.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Compliance Standards</h3>
                  <p>Our security practices comply with relevant regulations including GDPR, CCPA, and industry-specific requirements.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">Third-Party Security</h3>
                  <p>All third-party integrations undergo security assessments, and we maintain data processing agreements with our vendors.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Your Security Responsibilities</h2>
              <p>While we implement robust security measures, your account security also depends on your actions:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Use strong, unique passwords for your account</li>
                <li>Enable two-factor authentication when available</li>
                <li>Keep your devices and browsers updated</li>
                <li>Log out of shared or public devices</li>
                <li>Report any suspicious activity immediately</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Incident Response</h2>
              <p>
                In the unlikely event of a security incident, we have established procedures to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Quickly identify and contain the incident</li>
                <li>Assess the scope and impact</li>
                <li>Notify affected users within 72 hours when required</li>
                <li>Implement corrective measures</li>
                <li>Conduct post-incident analysis to prevent future occurrences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Reporting Security Issues</h2>
              <p>
                If you discover a security vulnerability or have concerns about our security practices, 
                please report them responsibly:
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>security@teamtegrate.com</span>
                </div>
                <p className="mt-2 text-sm">
                  We appreciate responsible disclosure and will work with security researchers to 
                  address valid concerns promptly.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p>If you have questions about our security practices, please contact us:</p>
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

export default SecurityPage;