import { Card, CardContent } from "@/components/ui/card";
import { moodConfig, type MoodType, type IconStyleType } from "@/lib/mood-config";
import { Smile, Meh, Pause, Flame, Leaf, Moon, Heart, CircleDot, Ban, Circle } from "lucide-react";
import type { User } from "@shared/schema";

interface PartnerMoodProps {
  partner: User | null;
  isConnected: boolean;
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

export function PartnerMood({ partner, isConnected }: PartnerMoodProps) {
  if (!partner) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-ignite-text">
            Partner Not Connected
          </h2>
          <p className="text-ignite-text-muted">
            Share your partner code or connect using their code to see their mood.
          </p>
        </div>
      </div>
    );
  }

  const partnerMoodConfig = moodConfig[partner.currentMood as MoodType];
  const IconComponent = iconComponents[partnerMoodConfig.icons[partner.iconStyle as IconStyleType] as keyof typeof iconComponents];
  
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} minute${diff > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Partner Status */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 text-ignite-text-muted">
          <Circle 
            className={`text-xs ${partner.isOnline ? 'text-green-400 fill-green-400' : 'text-gray-500 fill-gray-500'} ${isConnected ? 'animate-pulse' : ''}`} 
          />
          <span className="text-sm">
            {partner.isOnline ? 'Online now' : 'Offline'}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-ignite-text">
          {partner.username} is feeling...
        </h2>
        
        {/* Partner's Current Mood */}
        <div className="relative">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${partnerMoodConfig.bgClass} ${partnerMoodConfig.shadowClass}`}>
            <IconComponent className={`text-4xl ${partner.currentMood === 'neutral' ? 'text-ignite-bg' : 'text-white'}`} />
          </div>
          <p className={`mt-4 text-lg font-medium text-ignite-${partner.currentMood}`}>
            {partnerMoodConfig.label}
          </p>
          <p className="text-sm text-ignite-text-muted mt-1">
            {partnerMoodConfig.description}
          </p>
          <p className="text-xs text-ignite-text-dim mt-2">
            Updated {getTimeAgo(new Date(partner.lastMoodUpdate!))}
            {partner.moodExpiresAt && (
              <span className="block mt-1">
                Expires in {getTimeAgo(new Date(partner.moodExpiresAt))}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Today's Journey - Simplified */}
      <Card className="bg-ignite-surface border-ignite-surface-light/30">
        <CardContent className="p-6">
          <h3 className="font-medium text-ignite-text mb-4 flex items-center">
            <Heart className="text-ignite-text-muted mr-2 h-4 w-4" />
            Current Status
          </h3>
          <div className="text-center">
            <div className={`w-10 h-10 mx-auto ${partnerMoodConfig.bgClass} rounded-full flex items-center justify-center shadow-lg`}>
              <IconComponent className={`text-sm ${partner.currentMood === 'neutral' ? 'text-ignite-bg' : 'text-white'}`} />
            </div>
            <span className={`text-xs font-medium mt-2 block text-ignite-${partner.currentMood}`}>
              {partnerMoodConfig.label}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Gentle Encouragement */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto bg-ignite-surface rounded-full flex items-center justify-center">
          <Heart className="text-ignite-open h-5 w-5" />
        </div>
        <p className="text-sm text-ignite-text-muted leading-relaxed">
          Your partner's mood is just the beginning of conversation. Open communication builds deeper connection.
        </p>
      </div>
    </div>
  );
}
