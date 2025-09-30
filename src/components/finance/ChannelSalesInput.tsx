import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Plus, Trash2 } from 'lucide-react';
import { useSalesChannels } from '@/hooks/useSalesChannels';

export interface ChannelSalesEntry {
  channelId: string;
  channelName: string;
  amount: number;
}

interface ChannelSalesInputProps {
  teamId: string | null;
  value: ChannelSalesEntry[];
  onChange: (entries: ChannelSalesEntry[]) => void;
}

const ChannelSalesInput: React.FC<ChannelSalesInputProps> = ({ teamId, value, onChange }) => {
  const { channels, isLoading } = useSalesChannels();
  const [activeChannels, setActiveChannels] = useState<typeof channels>([]);

  useEffect(() => {
    // Filter channels for the selected team or org-wide channels
    const filtered = channels.filter(ch => 
      ch.is_active && (!ch.team_id || ch.team_id === teamId)
    );
    setActiveChannels(filtered);
  }, [channels, teamId]);

  const handleAmountChange = (channelId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const existing = value.find(e => e.channelId === channelId);
    
    if (existing) {
      // Update existing entry
      onChange(value.map(e => 
        e.channelId === channelId 
          ? { ...e, amount: numAmount }
          : e
      ));
    } else {
      // Add new entry
      const channel = activeChannels.find(ch => ch.id === channelId);
      if (channel) {
        onChange([...value, { 
          channelId, 
          channelName: channel.name, 
          amount: numAmount 
        }]);
      }
    }
  };

  const handleRemoveChannel = (channelId: string) => {
    onChange(value.filter(e => e.channelId !== channelId));
  };

  const getTotalChannelSales = () => {
    return value.reduce((sum, entry) => sum + entry.amount, 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading sales channels...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeChannels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Delivery Channel Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active sales channels configured. Configure channels in Settings to track delivery service fees.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Delivery Channel Sales (Optional)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Enter sales amounts for each delivery service (UberEats, DoorDash, etc.)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeChannels.map(channel => {
          const entry = value.find(e => e.channelId === channel.id);
          const hasValue = entry && entry.amount > 0;
          
          return (
            <div key={channel.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`channel-${channel.id}`} className="flex items-center gap-2">
                  {channel.name}
                  <Badge variant="outline" className="text-xs">
                    {channel.commission_type === 'percentage' 
                      ? `${(channel.commission_rate * 100).toFixed(1)}%`
                      : `$${channel.flat_fee_amount?.toFixed(2)}`
                    }
                  </Badge>
                </Label>
                {hasValue && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveChannel(channel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                id={`channel-${channel.id}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={entry?.amount || ''}
                onChange={(e) => handleAmountChange(channel.id, e.target.value)}
                className="font-mono"
              />
            </div>
          );
        })}

        {value.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total Channel Sales</span>
              <span className="font-mono">${getTotalChannelSales().toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChannelSalesInput;
