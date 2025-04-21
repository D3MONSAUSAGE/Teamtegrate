import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDarkMode } from "@/hooks/useDarkMode";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { useSoundSettings } from "@/hooks/useSoundSettings";
import { Volume, VolumeOff, VolumeX, Volume1, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { testSoundPlayback, playSuccessSound, playErrorSound } from "@/utils/sounds";

const AppSettingsSection = () => {
  const { isDark, toggle } = useDarkMode();
  const { enabled: soundEnabled, volume: soundVolume, setEnabled: setSoundEnabled, setVolume: setSoundVolume } = useSoundSettings();

  // Enhanced test sound function with multiple fallback methods
  const playTestSound = async () => {
    if (!soundEnabled) {
      toast.info("Sound is currently disabled. Enable sound to test.");
      return;
    }

    toast.loading("Testing sound playback...", { id: "sound-test" });
    
    try {
      // Try to play the test sound with our improved function that uses multiple fallbacks
      const success = await testSoundPlayback(soundVolume);
      
      if (success) {
        toast.success("Sound test successful!", { id: "sound-test" });
        playSuccessSound(soundVolume);
      } else {
        // If test failed but we didn't get an exception, try alternative sound
        playErrorSound(soundVolume);
        toast.error("Primary sound test failed. Using fallback sound.", { id: "sound-test" });
      }
    } catch (error) {
      console.error("Error testing sound:", error);
      toast.error("Sound test failed. Check browser audio permissions.", { id: "sound-test" });
    }
  };

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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound-toggle" className="block mb-1">App Sounds</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enable notification sounds</p>
            </div>
            <button
              id="sound-toggle"
              aria-label="Toggle sound"
              type="button"
              className={`flex items-center gap-2 px-3 py-2 rounded-full border transition ${
                soundEnabled
                  ? "bg-primary text-white border-primary"
                  : "bg-muted text-muted-foreground border-border"
              }`}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <>
                  <Volume className="h-5 w-5" />
                  <span className="font-medium">On</span>
                </>
              ) : (
                <>
                  <VolumeOff className="h-5 w-5" />
                  <span className="font-medium">Off</span>
                </>
              )}
            </button>
          </div>
          
          {soundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume-slider">Volume</Label>
                <div className="flex items-center gap-2">
                  {soundVolume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : soundVolume < 0.5 ? (
                    <Volume1 className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span className="text-xs w-8 text-right">{Math.round(soundVolume * 100)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="volume-slider"
                  defaultValue={[soundVolume * 100]}
                  max={100}
                  step={5}
                  onValueChange={(value) => setSoundVolume(value[0] / 100)}
                  className="flex-1"
                />
                <button
                  onClick={playTestSound}
                  className="text-xs text-primary hover:underline"
                  type="button"
                >
                  Test
                </button>
              </div>
            </div>
          )}
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
