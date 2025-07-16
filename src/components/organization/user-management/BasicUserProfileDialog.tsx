
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Calendar, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BasicUserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BasicUserProfileDialog: React.FC<BasicUserProfileDialogProps> = ({
  userId,
  open,
  onOpenChange
}) => {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, avatar_url, created_at, timezone')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId && open
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Failed to load user profile</AlertDescription>
          </Alert>
        ) : user ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {user.name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {user.timezone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Timezone</span>
                    <span className="text-sm font-medium">{user.timezone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default BasicUserProfileDialog;
