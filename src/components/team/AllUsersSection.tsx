
import React from 'react';
import { Loader2, Users as UsersIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface AllUsersSectionProps {
  allUsers?: AppUser[];
  isUsersLoading: boolean;
}

const AllUsersSection: React.FC<AllUsersSectionProps> = ({
  allUsers,
  isUsersLoading
}) => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4 mt-8">All App Users</h2>
      <p className="text-sm text-muted-foreground mb-4">
        These are all users registered in the system. Add them as team members to assign tasks and collaborate.
      </p>
      
      {isUsersLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading users...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" /> 
              Total Users: {allUsers?.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allUsers?.map((appUser) => (
                <div 
                  key={appUser.id} 
                  className="flex flex-col items-center text-center"
                >
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage 
                      src={appUser.avatar_url || undefined} 
                      alt={`${appUser.name || 'User'}'s avatar`} 
                    />
                    <AvatarFallback>
                      {appUser.name?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{appUser.name || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">{appUser.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AllUsersSection;
