import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Calendar, Copy, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { warehouseSettingsApi, type ItemDailySettings, type DayOfWeekSettings } from '@/contexts/warehouse/api/warehouseSettingsApi';

interface WarehouseSettingsTabProps {
  warehouseId: string;
  onRefresh?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export const WarehouseSettingsTab: React.FC<WarehouseSettingsTabProps> = ({
  warehouseId,
  onRefresh
}) => {
  const [itemSettings, setItemSettings] = useState<ItemDailySettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);

  useEffect(() => {
    loadSettings();
  }, [warehouseId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await warehouseSettingsApi.getItemsDailySettings(warehouseId);
      setItemSettings(settings);
      if (settings.length > 0 && !selectedItemId) {
        setSelectedItemId(settings[0].item_id);
      }
    } catch (error) {
      console.error('Error loading warehouse settings:', error);
      toast.error('Failed to load warehouse settings');
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = itemSettings.find(item => item.item_id === selectedItemId);

  const updateItemDaySettings = async (itemId: string, day: number, reorder_min: number, reorder_max: number) => {
    if (reorder_min < 0 || reorder_max < reorder_min) {
      toast.error('Invalid values: Min must be >= 0 and Max must be >= Min');
      return;
    }

    try {
      await warehouseSettingsApi.setItemDaySettings(warehouseId, itemId, day, reorder_min, reorder_max);
      
      // Update local state
      setItemSettings(prev => prev.map(item => 
        item.item_id === itemId 
          ? {
              ...item,
              days: {
                ...item.days,
                [day]: { reorder_min, reorder_max }
              }
            }
          : item
      ));
      
      toast.success(`Updated ${DAYS_OF_WEEK[day].label} settings`);
      onRefresh?.();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const copyDaySettings = async (fromDay: number, toDay: number) => {
    if (!selectedItem) return;
    
    try {
      const fromSettings = selectedItem.days[fromDay];
      await updateItemDaySettings(
        selectedItem.item_id,
        toDay,
        fromSettings.reorder_min,
        fromSettings.reorder_max
      );
      toast.success(`Copied ${DAYS_OF_WEEK[fromDay].short} settings to ${DAYS_OF_WEEK[toDay].short}`);
    } catch (error) {
      console.error('Error copying settings:', error);
      toast.error('Failed to copy settings');
    }
  };

  const applyToAllDays = async (itemId: string, reorder_min: number, reorder_max: number) => {
    if (reorder_min < 0 || reorder_max < reorder_min) {
      toast.error('Invalid values: Min must be >= 0 and Max must be >= Min');
      return;
    }

    try {
      setSaving(true);
      const weeklySettings: DayOfWeekSettings = {};
      for (let day = 0; day <= 6; day++) {
        weeklySettings[day] = { reorder_min, reorder_max };
      }
      
      await warehouseSettingsApi.setItemWeeklySettings(warehouseId, itemId, weeklySettings);
      
      // Update local state
      setItemSettings(prev => prev.map(item => 
        item.item_id === itemId 
          ? { ...item, days: weeklySettings }
          : item
      ));
      
      toast.success('Applied settings to all days');
      onRefresh?.();
    } catch (error) {
      console.error('Error applying to all days:', error);
      toast.error('Failed to apply settings');
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (currentStock: number, day: number) => {
    if (!selectedItem) return 'normal';
    const settings = selectedItem.days[day];
    if (currentStock <= settings.reorder_min) return 'low';
    if (currentStock >= settings.reorder_max) return 'high';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'destructive';
      case 'high': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading warehouse settings...</p>
        </div>
      </div>
    );
  }

  if (itemSettings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No items found in this warehouse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Warehouse Settings</h2>
          <p className="text-muted-foreground">Configure daily reorder levels for inventory items</p>
        </div>
        <Button onClick={loadSettings} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">
            <Calendar className="h-4 w-4 mr-2" />
            Daily Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Item List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Items ({itemSettings.length})</CardTitle>
                <CardDescription>Select an item to configure daily settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {itemSettings.map((item) => (
                    <div
                      key={item.item_id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedItemId === item.item_id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedItemId(item.item_id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.item_name}</p>
                          {item.item_sku && (
                            <p className="text-sm text-muted-foreground">SKU: {item.item_sku}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {item.current_stock || 0}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Settings */}
            {selectedItem && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedItem.item_name}
                    <Badge variant={getStatusColor(getStockStatus(selectedItem.current_stock || 0, new Date().getDay()))}>
                      Stock: {selectedItem.current_stock || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Set minimum and maximum stock levels for each day</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        className="w-20"
                        id="global-min"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        className="w-20"
                        id="global-max"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const minInput = document.getElementById('global-min') as HTMLInputElement;
                          const maxInput = document.getElementById('global-max') as HTMLInputElement;
                          const min = parseInt(minInput?.value || '0');
                          const max = parseInt(maxInput?.value || '100');
                          applyToAllDays(selectedItem.item_id, min, max);
                        }}
                        disabled={saving}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Apply to All Days
                      </Button>
                    </div>
                  </div>

                  {/* Daily Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {DAYS_OF_WEEK.map((day) => {
                      const daySettings = selectedItem.days[day.value];
                      const status = getStockStatus(selectedItem.current_stock || 0, day.value);
                      const isToday = day.value === new Date().getDay();
                      
                      return (
                        <Card key={day.value} className={`${isToday ? 'ring-2 ring-primary' : ''}`}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center justify-between">
                              {day.label}
                              {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Reorder Min</Label>
                              <Input
                                type="number"
                                value={daySettings.reorder_min}
                                onChange={(e) => {
                                  const newMin = parseInt(e.target.value) || 0;
                                  updateItemDaySettings(selectedItem.item_id, day.value, newMin, daySettings.reorder_max);
                                }}
                                className="h-8"
                                min="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Reorder Max</Label>
                              <Input
                                type="number"
                                value={daySettings.reorder_max}
                                onChange={(e) => {
                                  const newMax = parseInt(e.target.value) || 100;
                                  updateItemDaySettings(selectedItem.item_id, day.value, daySettings.reorder_min, newMax);
                                }}
                                className="h-8"
                                min={daySettings.reorder_min}
                              />
                            </div>
                            <Badge variant={getStatusColor(status)} className="w-full justify-center text-xs">
                              {status === 'low' ? 'Low Stock' : status === 'high' ? 'Overstock' : 'Normal'}
                            </Badge>
                            {copyFromDay !== null && copyFromDay !== day.value && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full h-7 text-xs"
                                onClick={() => {
                                  copyDaySettings(copyFromDay, day.value);
                                  setCopyFromDay(null);
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Paste
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full h-7 text-xs"
                              onClick={() => setCopyFromDay(copyFromDay === day.value ? null : day.value)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {copyFromDay === day.value ? 'Cancel' : 'Copy'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {copyFromDay !== null && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Copying settings from <strong>{DAYS_OF_WEEK[copyFromDay].label}</strong>. 
                        Click "Paste" on any day or "Cancel" to stop.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};