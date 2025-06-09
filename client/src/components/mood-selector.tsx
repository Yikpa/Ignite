import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { moodConfig, type MoodType } from "@/lib/mood-config";
import { Smile, Meh, Pause, Flame, Leaf, Moon, Heart, CircleDot, Ban, Clock } from "lucide-react";
import type { User } from "@shared/schema";

interface MoodSelectorProps {
  user: User;
}

const iconComponents: Record<string, any> = {
  smile: Smile,
  meh: Meh,
  pause: Pause,
  flame: Flame,
  leaf: Leaf,
  moon: Moon,
  heart: Heart,
  'circle-dot': CircleDot,
  ban: Ban,
};

export function MoodSelector({ user }: MoodSelectorProps) {
  const [selectedDuration, setSelectedDuration] = useState<string>("no-limit");
  const [customDuration, setCustomDuration] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMoodMutation = useMutation({
    mutationFn: async ({ mood, duration }: { mood: MoodType; duration?: number | null }) => {
      const res = await apiRequest("PATCH", `/api/users/${user.id}/mood`, { mood, duration });
      return res.json();
    },
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData([`/api/users/${user.id}`], updatedUser);
      toast({
        title: "Mood Updated",
        description: `Your mood has been set to ${moodConfig[updatedUser.currentMood].label}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update mood. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Timer effect to update time remaining
  useEffect(() => {
    if (user.moodExpiresAt && user.currentMood !== 'neutral') {
      const updateTimer = () => {
        const now = new Date();
        const expiresAt = new Date(user.moodExpiresAt!);
        const diff = expiresAt.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining("");
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        } else {
          setTimeRemaining(`${minutes}m remaining`);
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      
      return () => clearInterval(interval);
    } else {
      setTimeRemaining("");
    }
  }, [user.moodExpiresAt, user.currentMood]);

  const currentMoodConfig = moodConfig[user.currentMood];
  const IconComponent = iconComponents[currentMoodConfig.icons[user.iconStyle]];

  const handleMoodUpdate = (mood: MoodType) => {
    let duration: number | null = null;
    
    if (mood !== 'neutral' && selectedDuration !== 'no-limit') {
      if (selectedDuration === 'custom') {
        duration = parseInt(customDuration);
        if (isNaN(duration) || duration <= 0) {
          toast({
            title: "Invalid Duration",
            description: "Please enter a valid number of minutes.",
            variant: "destructive"
          });
          return;
        }
      } else {
        duration = parseInt(selectedDuration);
      }
    }
    
    updateMoodMutation.mutate({ mood, duration });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Current Mood Display */}
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-ignite-text">How are you feeling?</h2>
        <div className="relative">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${currentMoodConfig.bgClass} ${currentMoodConfig.shadowClass}`}>
            <IconComponent className={`text-4xl ${user.currentMood === 'neutral' ? 'text-ignite-bg' : 'text-white'}`} />
          </div>
          <p className={`mt-4 text-lg font-medium text-ignite-${user.currentMood}`}>
            {currentMoodConfig.label}
          </p>
          <p className="text-sm text-ignite-text-muted mt-1">
            {currentMoodConfig.description}
          </p>
          {timeRemaining && (
            <p className="text-xs text-ignite-text-dim mt-2">
              {timeRemaining}
            </p>
          )}
        </div>
      </div>

      {/* Duration Selection */}
      <div className="space-y-4">
        <h3 className="text-center text-ignite-text-muted text-sm uppercase tracking-wide font-medium">
          Duration
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { value: "no-limit", label: "No limit" },
            { value: "30", label: "30 min" },
            { value: "60", label: "1 hour" },
            { value: "120", label: "2 hours" },
            { value: "240", label: "4 hours" },
            { value: "custom", label: "Custom" }
          ].map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              onClick={() => setSelectedDuration(option.value)}
              className={`px-3 py-2 rounded-xl text-sm transition-all ${
                selectedDuration === option.value
                  ? 'bg-ignite-surface border border-ignite-surface-light text-ignite-text'
                  : 'text-ignite-text-muted hover:text-ignite-text'
              }`}
            >
              <Clock className="h-3 w-3 mr-1" />
              {option.label}
            </Button>
          ))}
        </div>
        {selectedDuration === "custom" && (
          <div className="flex items-center justify-center space-x-2">
            <Input
              type="number"
              placeholder="Minutes"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="w-24 bg-ignite-surface border-ignite-surface-light text-ignite-text text-center"
              min="1"
            />
            <span className="text-ignite-text-muted text-sm">minutes</span>
          </div>
        )}
        {selectedDuration === "no-limit" && (
          <p className="text-xs text-ignite-text-dim text-center">
            You'll receive gentle reminders if you stay Open for extended periods
          </p>
        )}
      </div>

      {/* Mood Selection */}
      <div className="space-y-4">
        <h3 className="text-center text-ignite-text-muted text-sm uppercase tracking-wide font-medium">
          Select Your Mood
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {(Object.entries(moodConfig) as [MoodType, typeof moodConfig[MoodType]][]).map(([mood, config]) => {
            const MoodIcon = iconComponents[config.icons[user.iconStyle]];
            const isActive = user.currentMood === mood;
            
            return (
              <Button
                key={mood}
                variant="ghost"
                onClick={() => handleMoodUpdate(mood)}
                disabled={updateMoodMutation.isPending}
                className={`flex flex-col items-center space-y-3 p-4 rounded-2xl transition-all hover:scale-105 h-auto ${
                  isActive ? 'bg-ignite-open/10 border border-ignite-open/30' : ''
                }`}
              >
                <div className={`w-16 h-16 ${config.bgClass} rounded-full flex items-center justify-center shadow-lg`}>
                  <MoodIcon className={`text-2xl ${mood === 'neutral' ? 'text-ignite-bg' : 'text-white'}`} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-ignite-text">{config.label}</p>
                  <p className="text-xs text-ignite-text-dim">
                    {mood === 'open' ? 'Ready' : mood === 'neutral' ? 'Maybe' : 'Not now'}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>


    </div>
  );
}
