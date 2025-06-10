
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, UserCheck } from 'lucide-react';
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
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-purple-600 bg-clip-text text-transparent">
              Team Management
            </h2>
          </div>
          <Link to="/dashboard/team">
            <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-500/10 transition-colors">
              View team <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="glass-card border shadow-lg bg-gradient-to-br from-secondary/30 via-secondary/20 to-secondary/10 backdrop-blur-sm rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20">
              <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground text-lg">Manage Your Team</h3>
              <p className="text-muted-foreground">
                {teamMembersCount > 0 
                  ? `${teamMembersCount} team member${teamMembersCount > 1 ? 's' : ''} added`
                  : 'Add team members to assign tasks and collaborate'
                }
              </p>
              {teamMembersCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Team active
                  </span>
                </div>
              )}
            </div>
          </div>
          <Link to="/dashboard/team">
            <Button className="gap-2 whitespace-nowrap bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Users className="h-4 w-4" /> Team Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamManagement;
