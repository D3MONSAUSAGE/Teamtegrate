
import React from 'react';
import { Button } from "@/components/ui/button";
import { SelectTrigger } from "@/components/ui/select";
import { UserCog, Loader2 } from 'lucide-react';

interface RoleSelectTriggerProps {
  isChanging: boolean;
}

const RoleSelectTrigger: React.FC<RoleSelectTriggerProps> = ({ isChanging }) => {
  return (
    <SelectTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        disabled={isChanging}
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        {isChanging ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserCog className="h-4 w-4" />
        )}
      </Button>
    </SelectTrigger>
  );
};

export default RoleSelectTrigger;
