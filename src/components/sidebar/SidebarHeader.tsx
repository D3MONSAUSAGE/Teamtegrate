
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sun, Moon, Home } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarHeaderProps {
  onToggleDarkMode?: () => void;
  isDark: boolean;
  onNavigation?: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onToggleDarkMode, isDark, onNavigation }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className={cn(
      "p-6 pt-5 flex items-center gap-2",
      isCollapsed ? "justify-center flex-col" : "justify-between"
    )}>
      {!isCollapsed && (
        <div>
          <h2 className="text-lg font-bold tracking-wide text-primary">
            TeamStream
          </h2>
          <p className="text-sm text-muted-foreground">Manage your tasks & projects</p>
        </div>
      )}
      
      <div className={cn(
        "flex items-center gap-2",
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
        <button
          aria-label="Toggle dark mode"
          className={cn(
            "rounded-full p-1.5 hover:bg-muted border border-transparent hover:border-primary transition-colors duration-200",
            "focus:outline-none"
          )}
          onClick={onToggleDarkMode}
          style={{
            minWidth: "34px",
            minHeight: "34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDark ? <Moon className="h-5 w-5 text-yellow-300" /> : <Sun className="h-5 w-5 text-yellow-400" />}
        </button>
      </div>
    </div>
  );
};

export default SidebarHeader;
