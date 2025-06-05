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

  // Enhanced test sound function with user interaction requirement
  const playTestSound = async () => {
    if (!soundEnabled) {
      toast.info("Sound is currently disabled. Enable sound to test.");
      return;
    }

    // Show loading toast
    const loadingToastId = toast.loading("Testing sound playback...");
    
    try {
      console.log("Starting sound test with volume:", soundVolume);
      
      // Test sound playback with multiple fallbacks
      const success = await testSoundPlayback(soundVolume);
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      if (success) {
        toast.success("Sound test successful! 🔊", {
          description: "Your browser supports audio playback.",
          duration: 3000,
        });
        
        // Play a success sound as additional confirmation
        setTimeout(() => {
          playSuccessSound(soundVolume);
        }, 500);
      } else {
        toast.error("Sound test failed", {
          description: "Please check your browser audio settings and try again.",
          duration: 5000,
        });
        
        // Try playing an error sound as fallback
        setTimeout(() => {
          playErrorSound(soundVolume);
        }, 500);
      }
    } catch (error) {
      console.error("Error during sound test:", error);
      toast.dismiss(loadingToastId);
      toast.error("Sound test error", {
        description: "An error occurred while testing audio. Check browser permissions.",
        duration: 5000,
      });
    }
  };

  // Handle volume changes with immediate feedback
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setSoundVolume(newVolume);
    
    // Provide immediate audio feedback for volume changes (debounced)
    if (soundEnabled && newVolume > 0) {
      // Clear any existing timeout
      if ((window as any).volumeTestTimeout) {
        clearTimeout((window as any).volumeTestTimeout);
      }
      
      // Set a new timeout for volume feedback
      (window as any).volumeTestTimeout = setTimeout(() => {
        playSuccessSound(newVolume).catch(() => {
          // Silently fail if sound doesn't work
          console.log("Volume test sound failed");
        });
      }, 200);
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Enable notification and interaction sounds</p>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume-slider">Volume</Label>
                <div className="flex items-center gap-2">
                  {soundVolume === 0 ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : soundVolume < 0.5 ? (
                    <Volume1 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm w-10 text-right text-muted-foreground">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="volume-slider"
                  value={[soundVolume * 100]}
                  max={100}
                  min={0}
                  step={5}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
                <button
                  onClick={playTestSound}
                  className="text-sm text-primary hover:text-primary/80 hover:underline font-medium px-2 py-1 rounded transition-colors"
                  type="button"
                >
                  Test Sound
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click "Test Sound" to verify audio is working in your browser
              </p>
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
