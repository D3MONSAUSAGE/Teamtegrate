
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const InvoiceAccessRestriction: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-yellow-500" />
          Access Restricted
        </CardTitle>
        <CardDescription>
          Invoice upload is restricted to managers, admins, and superadmins only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            You need manager-level permissions or higher to upload invoices.
            Please contact your administrator if you need access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceAccessRestriction;
