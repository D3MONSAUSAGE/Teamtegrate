
import React from "react";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";

interface SidebarHeaderProps {
  onToggleDarkMode?: () => void;
  isDark: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onToggleDarkMode, isDark }) => {
  return (
    <div className="p-6 pt-5 flex items-center justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold tracking-wide text-primary">
          TeamStream
        </h2>
        <p className="text-sm text-muted-foreground">Manage your tasks & projects</p>
      </div>
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
  );
};

export default SidebarHeader;
