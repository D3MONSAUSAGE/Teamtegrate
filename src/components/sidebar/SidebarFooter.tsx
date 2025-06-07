
import React from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ user }) => {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleSettingsClick = () => {
    navigate("/dashboard/settings");
  };

  return (
    <div className={cn(
      "p-4 border-t border-border bg-background min-h-[56px]",
      isCollapsed ? "flex flex-col items-center gap-2" : "flex items-center justify-between"
    )}>
      {!isCollapsed && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Logged in as</p>
          <p className="font-semibold text-primary text-sm">{user.name}</p>
        </div>
      )}
      <Button
        size="icon"
        variant="ghost"
        className={cn(isCollapsed ? "" : "ml-2")}
        aria-label="Settings"
        onClick={handleSettingsClick}
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default SidebarFooter;
