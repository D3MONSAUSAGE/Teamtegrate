
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";

const TeamManagement: React.FC = () => {
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const storedMembers = localStorage.getItem('teamMembers');
    if (storedMembers) {
      const members = JSON.parse(storedMembers);
      setTeamMembersCount(members.length);
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Team Management</h2>
        <Link to="/dashboard/team">
          <Button variant="ghost" size="sm" className="text-primary">
            View team <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold">Manage Your Team</h3>
          <p className="text-gray-500">
            {teamMembersCount > 0 
              ? `${teamMembersCount} team member${teamMembersCount > 1 ? 's' : ''} added`
              : 'Add team members to assign tasks'
            }
          </p>
        </div>
        <Link to="/dashboard/team">
          <Button className="gap-2 whitespace-nowrap">
            <Users className="h-4 w-4" /> Team Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TeamManagement;
