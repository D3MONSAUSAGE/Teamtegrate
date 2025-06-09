
import React from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarFooterProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  isCollapsed?: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ user, isCollapsed = false }) => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate("/dashboard/settings");
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "p-4 border-t border-sidebar-border bg-sidebar-background min-h-[56px] transition-all duration-300",
        isCollapsed ? "flex flex-col items-center gap-2 px-2" : "flex items-center justify-between"
      )}>
        {!isCollapsed && (
          <div className="transition-opacity duration-300">
            <p className="text-xs text-sidebar-foreground/70 mb-0.5">Logged in as</p>
            <p className="font-semibold text-sidebar-primary text-sm">{user.name}</p>
          </div>
        )}
        
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Settings"
                onClick={handleSettingsClick}
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              Settings
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="ml-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Settings"
            onClick={handleSettingsClick}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
};

export default SidebarFooter;
