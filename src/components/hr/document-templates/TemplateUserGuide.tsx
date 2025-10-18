import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface TemplateUserGuideProps {
  onCreateTemplate: () => void;
}

export const TemplateUserGuide = ({ onCreateTemplate }: TemplateUserGuideProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Document Templates</CardTitle>
          <CardDescription>
            Create configurable document checklists for your employees and track compliance automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">How it works:</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3 p-4 border rounded-lg">
                <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">1. Create Templates</h4>
                  <p className="text-sm text-muted-foreground">
                    Define which documents are required (W4, Application, Certificates, etc.) and set expiration dates.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 border rounded-lg">
                <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">2. Assign to Employees</h4>
                  <p className="text-sm text-muted-foreground">
                    Assign templates to specific employees, roles (e.g., all managers), or entire teams.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 border rounded-lg">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">3. Track Compliance</h4>
                  <p className="text-sm text-muted-foreground">
                    View a visual matrix showing which employees are compliant, missing documents, or have expiring documents.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 border rounded-lg">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium mb-1">4. Get Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive automatic notifications when documents are expiring or employees are non-compliant.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Example Templates:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Restaurant Staff:</strong> Food Handler Certificate (annual), W4, Application, Uniform Agreement</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Management:</strong> Background Check, Contract, Emergency Contact, Policy Acknowledgment</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span><strong>Healthcare Workers:</strong> Medical License (annual), CPR Certification, HIPAA Training, TB Test</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={onCreateTemplate}>
              Create Your First Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
