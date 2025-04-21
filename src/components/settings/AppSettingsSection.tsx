
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDarkMode } from "@/hooks/useDarkMode";
import { ToggleLeft, ToggleRight } from "lucide-react";

const AppSettingsSection = () => {
  const { isDark, toggle } = useDarkMode();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">App Settings</h2>
      <div className="bg-card dark:bg-[#1f2133] p-6 rounded-lg border border-border dark:border-gray-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Label htmlFor="dark-mode-switch" className="mb-1">Dark Mode</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
          </div>
          <button
            id="dark-mode-switch"
            aria-label="Toggle dark mode"
            type="button"
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors duration-200 ring-1 ${
              isDark 
                ? "bg-primary text-white ring-primary/50" 
                : "bg-white text-black ring-muted dark:ring-gray-700"
            } hover:ring-primary/50`}
            onClick={toggle}
          >
            {isDark ? (
              <>
                <ToggleRight className="h-6 w-6 text-white" />
                <span className="text-white font-medium">Dark</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-6 w-6 text-black" />
                <span className="text-black font-medium">Light</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notifications" className="block mb-1">Email Notifications</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications for task updates</p>
          </div>
          <Switch id="notifications" defaultChecked />
        </div>
        
        <div>
          <Label className="block mb-2">Default Task Priority</Label>
          <RadioGroup defaultValue="medium" className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="low" id="low" />
              <Label htmlFor="low" className="cursor-pointer">Low</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="high" />
              <Label htmlFor="high" className="cursor-pointer">High</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="reminders" className="block mb-1">Task Reminders</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Get notifications before task deadlines</p>
          </div>
          <Switch id="reminders" defaultChecked />
        </div>
      </div>
    </div>
  );
};

export default AppSettingsSection;
