import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSalesChannels } from '@/hooks/useSalesChannels';
import { Store, X, Percent, DollarSign, Info, TrendingDown, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export interface ChannelSalesEntry {
  channelId: string;
  channelName: string;
  amount: number;
}

interface ChannelSalesInputProps {
  teamId: string | null;
  value: ChannelSalesEntry[];
  onChange: (entries: ChannelSalesEntry[]) => void;
  grossSales?: number;
}

const ChannelSalesInput: React.FC<ChannelSalesInputProps> = ({ 
  teamId, 
  value, 
  onChange,
  grossSales = 0
}) => {
  const { channels, isLoading } = useSalesChannels();
  const [activeChannels, setActiveChannels] = useState<typeof channels>([]);
  const [inputMode, setInputMode] = useState<'amount' | 'percentage'>('amount');
  const [percentageInputs, setPercentageInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const filtered = channels.filter(ch => 
      ch.is_active && (!ch.team_id || ch.team_id === teamId)
    );
    setActiveChannels(filtered);
  }, [channels, teamId]);

  const handleAmountChange = (channelId: string, channelName: string, inputValue: string) => {
    const amount = parseFloat(inputValue) || 0;
    const existingIndex = value.findIndex((e) => e.channelId === channelId);
    
    if (amount > 0) {
      if (existingIndex >= 0) {
        const newValue = [...value];
        newValue[existingIndex] = { channelId, channelName, amount };
        onChange(newValue);
      } else {
        onChange([...value, { channelId, channelName, amount }]);
      }
    } else if (existingIndex >= 0) {
      onChange(value.filter((e) => e.channelId !== channelId));
    }
  };

  const handlePercentageChange = (channelId: string, channelName: string, inputValue: string) => {
    setPercentageInputs(prev => ({ ...prev, [channelId]: inputValue }));
    const percentage = parseFloat(inputValue) || 0;
    
    if (grossSales > 0 && percentage > 0) {
      const amount = (grossSales * percentage) / 100;
      handleAmountChange(channelId, channelName, amount.toString());
    } else {
      handleAmountChange(channelId, channelName, '0');
    }
  };

  const handleRemoveChannel = (channelId: string) => {
    onChange(value.filter(e => e.channelId !== channelId));
    setPercentageInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[channelId];
      return newInputs;
    });
  };

  const getTotalChannelSales = () => value.reduce((sum, entry) => sum + entry.amount, 0);

  const getTotalChannelFees = () => {
    return value.reduce((sum, entry) => {
      const channel = channels.find(ch => ch.id === entry.channelId);
      if (!channel) return sum;
      
      if (channel.commission_type === 'percentage') {
        return sum + (entry.amount * channel.commission_rate);
      } else if (channel.commission_type === 'flat_fee') {
        return sum + (channel.flat_fee_amount || 0);
      }
      return sum;
    }, 0);
  };

  const getChannelFee = (channelId: string, amount: number) => {
    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) return 0;
    
    if (channel.commission_type === 'percentage') {
      return amount * channel.commission_rate;
    } else if (channel.commission_type === 'flat_fee') {
      return channel.flat_fee_amount || 0;
    }
    return 0;
  };

  const getNetAfterFees = (channelId: string, amount: number) => {
    return amount - getChannelFee(channelId, amount);
  };

  const getAdjustedNetSales = () => {
    if (grossSales === 0) return 0;
    return grossSales - getTotalChannelFees();
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
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No active sales channels configured. Set up channels in Settings to track delivery service fees.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Manual Channel Sales Entry
          </div>
          <Badge variant="secondary">{value.length} channels</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Enter sales for delivery channels from your POS. Fees are auto-calculated and deducted in weekly reports.
          </AlertDescription>
        </Alert>

        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'amount' | 'percentage')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Dollar Amount
            </TabsTrigger>
            <TabsTrigger value="percentage" className="flex items-center gap-2" disabled={!grossSales || grossSales === 0}>
              <Percent className="h-4 w-4" />
              Percentage
              {(!grossSales || grossSales === 0) && <Badge variant="outline" className="ml-1 text-xs">Needs Total</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="amount" className="space-y-3 mt-4">
            {activeChannels.map((channel) => {
              const entry = value.find((e) => e.channelId === channel.id);
              const channelAmount = entry?.amount || 0;
              const fee = getChannelFee(channel.id, channelAmount);
              const net = getNetAfterFees(channel.id, channelAmount);

              return (
                <div key={channel.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {channel.commission_type === 'percentage'
                            ? `${(channel.commission_rate * 100).toFixed(1)}% commission`
                            : `$${channel.flat_fee_amount?.toFixed(2)} flat fee`}
                        </div>
                      </div>
                      {entry && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveChannel(channel.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={entry?.amount || ''}
                        onChange={(e) => handleAmountChange(channel.id, channel.name, e.target.value)}
                        className="pl-9"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {channelAmount > 0 && (
                      <div className="flex justify-between text-xs bg-background p-2 rounded">
                        <span className="text-muted-foreground">Fee: <span className="text-destructive font-medium">-{formatCurrency(fee)}</span></span>
                        <span className="text-muted-foreground">Net: <span className="text-primary font-medium">{formatCurrency(net)}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="percentage" className="space-y-3 mt-4">
            {grossSales > 0 && (
              <div className="bg-primary/10 p-3 rounded-lg mb-3">
                <div className="text-sm text-muted-foreground">Today's Gross Sales</div>
                <div className="text-2xl font-bold">{formatCurrency(grossSales)}</div>
              </div>
            )}

            {activeChannels.map((channel) => {
              const entry = value.find((e) => e.channelId === channel.id);
              const percentage = percentageInputs[channel.id] || '';
              const channelAmount = entry?.amount || 0;
              const fee = getChannelFee(channel.id, channelAmount);
              const net = getNetAfterFees(channel.id, channelAmount);

              return (
                <div key={channel.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {channel.commission_type === 'percentage'
                            ? `${(channel.commission_rate * 100).toFixed(1)}% commission`
                            : `$${channel.flat_fee_amount?.toFixed(2)} flat fee`}
                        </div>
                      </div>
                      {entry && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveChannel(channel.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          value={percentage}
                          onChange={(e) => handlePercentageChange(channel.id, channel.name, e.target.value)}
                          className="pl-9"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      {percentage && (
                        <div className="text-sm font-medium min-w-24 text-right">
                          = {formatCurrency(channelAmount)}
                        </div>
                      )}
                    </div>

                    {channelAmount > 0 && (
                      <div className="flex justify-between text-xs bg-background p-2 rounded">
                        <span className="text-muted-foreground">Fee: <span className="text-destructive font-medium">-{formatCurrency(fee)}</span></span>
                        <span className="text-muted-foreground">Net: <span className="text-primary font-medium">{formatCurrency(net)}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        {value.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-accent p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Total Channel Sales</div>
                <div className="text-xl font-bold">{formatCurrency(getTotalChannelSales())}</div>
              </div>
              <div className="bg-destructive/10 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Total Fees</div>
                <div className="text-xl font-bold text-destructive flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  {formatCurrency(getTotalChannelFees())}
                </div>
              </div>
              {grossSales > 0 && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Adjusted Net</div>
                  <div className="text-xl font-bold text-primary">{formatCurrency(getAdjustedNetSales())}</div>
                </div>
              )}
            </div>
            
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Tax Deductible:</strong> {formatCurrency(getTotalChannelFees())} in channel fees will reduce your taxable income.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChannelSalesInput;
