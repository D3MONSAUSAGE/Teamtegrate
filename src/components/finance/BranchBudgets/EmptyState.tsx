
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const EmptyState: React.FC = () => {
  return (
    <Card>
      <CardContent className="py-10 flex-col items-center flex justify-center">
        <div className="text-gray-800 font-medium text-center mb-1">
          You don't have any branches yet.
        </div>
        <div className="text-muted-foreground mb-2 text-center">
          Please create a branch first to set budgets.
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
