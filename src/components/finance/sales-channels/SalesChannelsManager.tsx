import React, { useState } from 'react';
import { Plus, Percent, DollarSign, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSalesChannels } from '@/hooks/useSalesChannels';
import { useTeams } from '@/hooks/useTeams';
import { useAuth } from '@/contexts/AuthContext';
import { SalesChannelDialog } from './SalesChannelDialog';
import type { SalesChannel } from '@/types/salesChannels';

export const SalesChannelsManager: React.FC = () => {
  const { channels, isLoading, toggleChannelStatus, deleteChannel } = useSalesChannels();
  const { teams } = useTeams();
  const { hasRoleAccess } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<SalesChannel | null>(null);

  const canManage = hasRoleAccess('manager');

  const handleEdit = (channel: SalesChannel) => {
    setEditingChannel(channel);
    setDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingChannel(null);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (channel: SalesChannel) => {
    await toggleChannelStatus(channel.id, !channel.is_active);
  };

  const handleDelete = async (channel: SalesChannel) => {
    if (window.confirm(`Are you sure you want to delete "${channel.name}"? This action cannot be undone.`)) {
      await deleteChannel(channel.id);
    }
  };

  const formatCommissionRate = (channel: SalesChannel) => {
    if (channel.commission_type === 'percentage') {
      return `${(channel.commission_rate * 100).toFixed(2)}%`;
    } else {
      return `$${channel.flat_fee_amount?.toFixed(2) || '0.00'}`;
    }
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'All Teams';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading sales channels...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sales Channels</h2>
          <p className="text-muted-foreground">
            Manage third-party platforms and their commission fees for accurate tax reporting
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Channel
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Channels</CardTitle>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No sales channels configured yet.</p>
              {canManage && (
                <Button onClick={handleCreateNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Channel
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        {channel.description && (
                          <div className="text-sm text-muted-foreground">
                            {channel.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {channel.commission_type === 'percentage' ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        {formatCommissionRate(channel)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {getTeamName(channel.team_id)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                        {channel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(channel)}>
                              Edit Channel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(channel)}>
                              {channel.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(channel)}
                              className="text-destructive"
                            >
                              Delete Channel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SalesChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        channel={editingChannel}
      />
    </div>
  );
};