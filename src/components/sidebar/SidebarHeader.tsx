
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home } from "lucide-react";
import DarkModeToggle from "@/components/shared/DarkModeToggle";

interface SidebarHeaderProps {
  onToggleDarkMode?: () => void;
  isDark: boolean;
  onNavigation?: () => void;
  isCollapsed?: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  onToggleDarkMode, 
  isDark, 
  onNavigation,
  isCollapsed = false 
}) => {
  return (
    <div className={cn(
      "p-6 pt-5 flex items-center gap-2 transition-all duration-300",
      isCollapsed ? "justify-center flex-col px-2" : "justify-between"
    )}>
      {!isCollapsed && (
        <div className="transition-opacity duration-300">
          <h2 className="text-lg font-bold tracking-wide text-primary">
            Teamtegrate
          </h2>
          <p className="text-sm text-muted-foreground">Manage your tasks & projects</p>
        </div>
      )}
      
      <div className={cn(
        "flex items-center gap-2 transition-all duration-300",
        isCollapsed && "flex-col"
      )}>
        <Link
          to="/dashboard"
          onClick={onNavigation}
          className={cn(
            "rounded-full p-1.5 hover:bg-muted border border-transparent hover:border-primary transition-colors duration-200",
            "focus:outline-none"
          )}
          style={{
            minWidth: "34px",
            minHeight: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Go to Dashboard"
          title="Dashboard"
        >
          <Home className="h-5 w-5 text-primary" />
        </Link>
        
        {onToggleDarkMode && (
          <DarkModeToggle 
            isDark={isDark}
            onToggle={onToggleDarkMode}
            size="md"
          />
        )}
      </div>
    </div>
  );
};

export default SidebarHeader;
