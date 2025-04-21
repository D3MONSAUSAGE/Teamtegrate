
import React from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SettingsLayoutProps {
  children: React.ReactNode;
  onCancel?: () => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ 
  children, 
  onCancel 
}) => {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-8">
        {children}
        
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
