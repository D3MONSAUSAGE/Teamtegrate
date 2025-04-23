
import React from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarFooterProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate("/dashboard/settings");
  };

  return (
    <div className="p-4 border-t border-border bg-background flex items-center justify-between">
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground mb-0.5">Logged in as</p>
        <p className="font-semibold text-primary text-sm">{user.name}</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="ml-2"
        aria-label="Settings"
        onClick={handleSettingsClick}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default SidebarFooter;

