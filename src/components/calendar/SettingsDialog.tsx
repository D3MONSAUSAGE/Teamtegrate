import React from 'react';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calendar Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Display Options</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-weekends">Show weekends</Label>
              <Switch id="show-weekends" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-declined">Show declined events</Label>
              <Switch id="show-declined" />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-tasks">Show completed tasks</Label>
              <Switch id="show-tasks" defaultChecked />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Time & Format</h3>
            
            <div className="space-y-2">
              <Label htmlFor="start-week">Week starts on</Label>
              <Select defaultValue="sunday">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="monday">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-format">Time format</Label>
              <Select defaultValue="12h">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;