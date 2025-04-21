
import React from "react";

interface SidebarFooterProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ user }) => {
  return (
    <div className="p-4 border-t border-border bg-background">
      <div className="text-xs text-muted-foreground">
        <p>Logged in as</p>
        <p className="font-semibold text-primary">{user.name}</p>
        <p className="text-muted-foreground">{user.email}</p>
        <p className="mt-1 font-medium text-primary">{user.role === "manager" ? "Manager" : "Team Member"}</p>
      </div>
    </div>
  );
};

export default SidebarFooter;
