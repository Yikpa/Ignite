export type MoodType = "open" | "neutral" | "closed";
export type IconStyleType = "basic" | "playful" | "explicit";

export interface MoodConfig {
  color: string;
  bgClass: string;
  shadowClass: string;
  label: string;
  description: string;
  icons: Record<IconStyleType, string>;
}

export const moodConfig: Record<MoodType, MoodConfig> = {
  open: {
    color: '#FF6B6B',
    bgClass: 'bg-ignite-open',
    shadowClass: 'shadow-ignite-open/20',
    label: 'Open',
    description: 'Available and receptive to intimacy',
    icons: {
      basic: 'smile',
      playful: 'flame',
      explicit: 'heart'
    }
  },
  neutral: {
    color: '#FFD93D',
    bgClass: 'bg-ignite-neutral',
    shadowClass: 'shadow-ignite-neutral/20',
    label: 'Neutral',
    description: 'Open to possibilities',
    icons: {
      basic: 'meh',
      playful: 'leaf',
      explicit: 'circle-dot'
    }
  },
  closed: {
    color: '#6B7280',
    bgClass: 'bg-ignite-closed',
    shadowClass: 'shadow-ignite-closed/20',
    label: 'Closed',
    description: 'Not available right now',
    icons: {
      basic: 'pause',
      playful: 'moon',
      explicit: 'ban'
    }
  }
};
