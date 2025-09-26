import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText } from 'lucide-react';

export const ReportsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Warehouse Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics & Reports</h3>
          <p className="text-muted-foreground text-center max-w-md">
            View warehouse performance, stock movement analytics, and generate comprehensive reports.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};