
import React from 'react';
import { buttonVariants } from "@/components/ui/button";
import { SelectTrigger } from "@/components/ui/select";
import { UserCog, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface RoleSelectTriggerProps {
  isChanging: boolean;
}

const RoleSelectTrigger: React.FC<RoleSelectTriggerProps> = ({ isChanging }) => {
  return (
    <SelectTrigger asChild>
      <button
        disabled={isChanging}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        )}
      >
        {isChanging ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserCog className="h-4 w-4" />
        )}
      </button>
    </SelectTrigger>
  );
};

export default RoleSelectTrigger;
