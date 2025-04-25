
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBreakpoint } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

const TeamManagement: React.FC = () => {
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const { isMobile } = useBreakpoint();
  
  useEffect(() => {
    const storedMembers = localStorage.getItem('teamMembers');
    if (storedMembers) {
      const members = JSON.parse(storedMembers);
      setTeamMembersCount(members.length);
    }
  }, []);

  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">Team Management</h2>
          <Link to="/dashboard/team">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90">
              View team <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="bg-secondary/30 p-6 rounded-lg border border-border flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-card-foreground">Manage Your Team</h3>
            <p className="text-muted-foreground">
              {teamMembersCount > 0 
                ? `${teamMembersCount} team member${teamMembersCount > 1 ? 's' : ''} added`
                : 'Add team members to assign tasks'
              }
            </p>
          </div>
          <Link to="/dashboard/team">
            <Button className="gap-2 whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90">
              <Users className="h-4 w-4" /> Team Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamManagement;
