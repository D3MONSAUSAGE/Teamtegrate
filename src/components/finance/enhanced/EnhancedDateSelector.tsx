import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  CalendarDays,
  BarChart3,
  GitCompare as Compare,
  Bookmark,
  X
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, subDays } from 'date-fns';

interface DatePreset {
  id: string;
  label: string;
  description: string;
  range: DateRange;
  category: 'quick' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
}

interface EnhancedDateSelectorProps {
  selectedRange?: DateRange;
  onRangeChange: (range: DateRange) => void;
  showComparison?: boolean;
  comparisonRange?: DateRange;
  onComparisonChange?: (range?: DateRange) => void;
  savedPresets?: DatePreset[];
  onSavePreset?: (preset: DatePreset) => void;
  onDeletePreset?: (presetId: string) => void;
}

export const EnhancedDateSelector: React.FC<EnhancedDateSelectorProps> = ({
  selectedRange,
  onRangeChange,
  showComparison = false,
  comparisonRange,
  onComparisonChange,
  savedPresets = [],
  onSavePreset,
  onDeletePreset
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'comparison'>('presets');
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [presetName, setPresetName] = useState('');

  const quickPresets: DatePreset[] = [
    {
      id: 'today',
      label: 'Today',
      description: 'Current day',
      range: { from: new Date(), to: new Date() },
      category: 'quick'
    },
    {
      id: 'yesterday', 
      label: 'Yesterday',
      description: 'Previous day',
      range: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) },
      category: 'quick'
    },
    {
      id: 'last-7-days',
      label: 'Last 7 Days',
      description: 'Previous week',
      range: { from: subDays(new Date(), 7), to: new Date() },
      category: 'quick'
    },
    {
      id: 'last-30-days',
      label: 'Last 30 Days', 
      description: 'Previous month',
      range: { from: subDays(new Date(), 30), to: new Date() },
      category: 'quick'
    }
  ];

  const monthlyPresets: DatePreset[] = [
    {
      id: 'this-month',
      label: 'This Month',
      description: format(new Date(), 'MMMM yyyy'),
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
      category: 'monthly'
    },
    {
      id: 'last-month',
      label: 'Last Month',
      description: format(subMonths(new Date(), 1), 'MMMM yyyy'),
      range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
      category: 'monthly'
    },
    {
      id: 'last-3-months',
      label: 'Last 3 Months',
      description: 'Quarterly view',
      range: { from: startOfMonth(subMonths(new Date(), 3)), to: endOfMonth(new Date()) },
      category: 'quarterly'
    },
    {
      id: 'last-6-months',
      label: 'Last 6 Months',
      description: 'Bi-annual view',
      range: { from: startOfMonth(subMonths(new Date(), 6)), to: endOfMonth(new Date()) },
      category: 'quarterly'
    }
  ];

  const yearlyPresets: DatePreset[] = [
    {
      id: 'this-year',
      label: 'This Year',
      description: format(new Date(), 'yyyy'),
      range: { from: startOfYear(new Date()), to: endOfYear(new Date()) },
      category: 'yearly'
    },
    {
      id: 'last-year',
      label: 'Last Year',
      description: format(subYears(new Date(), 1), 'yyyy'),
      range: { from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) },
      category: 'yearly'
    }
  ];

  const allPresets = [...quickPresets, ...monthlyPresets, ...yearlyPresets, ...savedPresets];

  const handlePresetClick = (preset: DatePreset) => {
    onRangeChange(preset.range);
  };

  const handleSavePreset = () => {
    if (!selectedRange?.from || !selectedRange?.to || !presetName.trim() || !onSavePreset) return;
    
    const newPreset: DatePreset = {
      id: `custom-${Date.now()}`,
      label: presetName.trim(),
      description: `${format(selectedRange.from, 'MMM dd, yyyy')} - ${format(selectedRange.to, 'MMM dd, yyyy')}`,
      range: selectedRange,
      category: 'custom'
    };
    
    onSavePreset(newPreset);
    setPresetName('');
    setShowPresetSave(false);
  };

  const getPresetsByCategory = (category: DatePreset['category']) => {
    return allPresets.filter(p => p.category === category);
  };

  const isRangeSelected = (preset: DatePreset) => {
    if (!selectedRange?.from || !selectedRange?.to) return false;
    return (
      selectedRange.from.getTime() === preset.range.from?.getTime() &&
      selectedRange.to.getTime() === preset.range.to?.getTime()
    );
  };

  const formatSelectedRange = () => {
    if (!selectedRange?.from) return 'Select date range';
    if (!selectedRange?.to) return format(selectedRange.from, 'MMM dd, yyyy');
    return `${format(selectedRange.from, 'MMM dd, yyyy')} - ${format(selectedRange.to, 'MMM dd, yyyy')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Advanced Date Selection
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'presets' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('presets')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Presets
            </Button>
            <Button
              variant={activeTab === 'custom' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('custom')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Custom
            </Button>
            {showComparison && (
              <Button
                variant={activeTab === 'comparison' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('comparison')}
              >
                <Compare className="h-4 w-4 mr-1" />
                Compare
              </Button>
            )}
          </div>
        </div>
        
        {/* Selected Range Display */}
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Selected Period</p>
              <p className="text-lg font-semibold text-primary">{formatSelectedRange()}</p>
            </div>
            {selectedRange?.from && selectedRange?.to && onSavePreset && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPresetSave(true)}
              >
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {activeTab === 'presets' && (
          <div className="space-y-6">
            {/* Quick Access */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Quick Access
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getPresetsByCategory('quick').map(preset => (
                  <Button
                    key={preset.id}
                    variant={isRangeSelected(preset) ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto p-3 flex flex-col items-start gap-1"
                    onClick={() => handlePresetClick(preset)}
                  >
                    <span className="font-medium text-xs">{preset.label}</span>
                    <span className="text-xs opacity-70">{preset.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Monthly */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Monthly & Quarterly
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[...getPresetsByCategory('monthly'), ...getPresetsByCategory('quarterly')].map(preset => (
                  <Button
                    key={preset.id}
                    variant={isRangeSelected(preset) ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto p-3 flex flex-col items-start gap-1"
                    onClick={() => handlePresetClick(preset)}
                  >
                    <span className="font-medium text-sm">{preset.label}</span>
                    <span className="text-xs text-muted-foreground">{preset.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Yearly */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Yearly
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {getPresetsByCategory('yearly').map(preset => (
                  <Button
                    key={preset.id}
                    variant={isRangeSelected(preset) ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto p-3 flex flex-col items-start gap-1"
                    onClick={() => handlePresetClick(preset)}
                  >
                    <span className="font-medium text-sm">{preset.label}</span>
                    <span className="text-xs text-muted-foreground">{preset.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Saved Presets */}
            {savedPresets.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Saved Presets
                </h4>
                <div className="space-y-2">
                  {getPresetsByCategory('custom').map(preset => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <Button
                        variant={isRangeSelected(preset) ? 'default' : 'ghost'}
                        size="sm"
                        className="flex-1 justify-start h-auto p-2"
                        onClick={() => handlePresetClick(preset)}
                      >
                        <div className="text-left">
                          <p className="font-medium text-sm">{preset.label}</p>
                          <p className="text-xs text-muted-foreground">{preset.description}</p>
                        </div>
                      </Button>
                      {onDeletePreset && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeletePreset(preset.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Custom Date Range</h4>
              <DatePickerWithRange
                date={selectedRange}
                onDateChange={onRangeChange}
                className="w-full"
              />
            </div>
            
            {/* Save Preset Section */}
            {showPresetSave && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h5 className="text-sm font-medium mb-2">Save Current Range</h5>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Preset name..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                  />
                  <Button size="sm" onClick={handleSavePreset} disabled={!presetName.trim()}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowPresetSave(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'comparison' && showComparison && onComparisonChange && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Comparison Period</h4>
              <DatePickerWithRange
                date={comparisonRange}
                onDateChange={onComparisonChange}
                className="w-full"
              />
            </div>
            
            {comparisonRange?.from && comparisonRange?.to && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Comparing: {format(comparisonRange.from, 'MMM dd, yyyy')} - {format(comparisonRange.to, 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onComparisonChange(undefined)}
              disabled={!comparisonRange}
            >
              Clear Comparison
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};