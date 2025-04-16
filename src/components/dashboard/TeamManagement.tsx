
import React from 'react';
import { Button } from "@/components/ui/button";
import { Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeamManagement: React.FC = () => {
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
      
      <div className="bg-white p-6 rounded-lg border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Manage Your Team</h3>
          <p className="text-gray-500">Assign tasks to team members and track their progress</p>
        </div>
        <Link to="/dashboard/team">
          <Button className="gap-2">
            <Users className="h-4 w-4" /> Team Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TeamManagement;
