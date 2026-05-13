import { 
  Trophy, 
  ShoppingBag, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Home as HomeIcon,
  LogOut,
  Target,
  CircleHelp,
  Flame,
  Shield,
  Star,
  Zap,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Crown,
  CheckCircle2,
  Lock,
  Volume2,
  VolumeX,
  Bell,
  Fingerprint,
  ChevronRight,
  Zap as ZapIcon,
  Search
} from 'lucide-react';

export const calculateLevel = (score: number) => {
  return Math.floor(Math.sqrt(score / 50)) + 1;
};

export const calculateRoyalPass = (score: number) => {
  // Max level 50, let's say 2000 points per level
  const pointsPerLevel = 2000;
  const level = Math.floor(score / pointsPerLevel) + 1;
  const progress = (score % pointsPerLevel) / pointsPerLevel * 100;
  return {
    level: Math.min(level, 25),
    progress: level >= 25 ? 100 : progress,
    pointsToNext: pointsPerLevel - (score % pointsPerLevel)
  };
};

export const ICONS = {
  Home: HomeIcon,
  Shop: ShoppingBag,
  Leaderboard: Trophy,
  Profile: UserIcon,
  Settings: SettingsIcon,
  Logout: LogOut,
  Tapper: Target,
  Help: CircleHelp,
  Flame: Flame,
  Shield: Shield,
  Star: Star,
  Zap: Zap,
  Alert: AlertCircle,
  Plus: Plus,
  Trash: Trash2,
  Edit: Edit2,
  Photo: ImageIcon,
  Crown: Crown,
  Check: CheckCircle2,
  Lock: Lock,
  Trophy: Trophy,
  Sound: Volume2,
  Mute: VolumeX,
  Notification: Bell,
  Security: Fingerprint,
  Chevron: ChevronRight,
  ZapIcon: ZapIcon,
  Search: Search
};

export const LEVELS = [
  { rank: 'Bronze IV', min: 1, icon: 'Shield' },
  { rank: 'Bronze III', min: 2, icon: 'Shield' },
  { rank: 'Bronze II', min: 3, icon: 'Shield' },
  { rank: 'Bronze I', min: 4, icon: 'Shield' },
  { rank: 'Silver', min: 5, icon: 'Shield' },
  { rank: 'Gold', min: 15, icon: 'Star' },
  { rank: 'Platinum', min: 30, icon: 'Target' },
  { rank: 'Diamond', min: 50, icon: 'Flame' },
  { rank: 'Crown', min: 80, icon: 'Zap' },
  { rank: 'Ace', min: 120, icon: 'Trophy' },
  { rank: 'Conqueror', min: 200, icon: 'Star' },
];

export const THEME = {
  primary: '#F2A900', // PUBG Yellow
  secondary: '#1A1A1A', // Dark Gray
  accent: '#E6E6E6', // Light Gray
  background: '#0F0F0F',
  card: '#1F1F1F',
  text: '#FFFFFF',
  textMuted: '#A0A0A0'
};

export const LEVEL_REWARDS: Record<number, number> = {
  1: 250,
  2: 250,
  10: 359,
  15: 500,
  20: 650,
  30: 840,
  50: 1000,
  75: 1250
};

export const ROYAL_PASS_REWARDS = [
  { level: 1, type: 'money', value: 500, name: '500 BP', icon: 'Zap' },
  { level: 2, type: 'money', value: 500, name: '500 BP', icon: 'Zap' },
  { level: 3, type: 'skin', value: 'default', name: 'Starter Helmet', icon: 'Shield' },
  { level: 4, type: 'money', value: 1000, name: '1000 BP', icon: 'Zap' },
  { level: 5, type: 'frame', value: 'bronze_frame', name: 'Bronze Border', icon: 'Photo' },
  { level: 6, type: 'money', value: 1500, name: '1500 BP', icon: 'Zap' },
  { level: 7, type: 'money', value: 1500, name: '1500 BP', icon: 'Zap' },
  { level: 8, type: 'money', value: 2000, name: '2000 BP', icon: 'Zap' },
  { level: 9, type: 'money', value: 2000, name: '2000 BP', icon: 'Zap' },
  { level: 10, type: 'skin', value: 'pan', name: 'Royale Pan', icon: 'Flame' },
  { level: 11, type: 'money', value: 3000, name: '3000 BP', icon: 'Zap' },
  { level: 12, type: 'money', value: 3000, name: '3000 BP', icon: 'Zap' },
  { level: 13, type: 'money', value: 3500, name: '3500 BP', icon: 'Zap' },
  { level: 14, type: 'money', value: 4000, name: '4000 BP', icon: 'Zap' },
  { level: 15, type: 'frame', value: 'silver_frame', name: 'Silver Guardian', icon: 'Photo' },
  { level: 16, type: 'money', value: 5000, name: '5000 BP', icon: 'Zap' },
  { level: 17, type: 'money', value: 5000, name: '5000 BP', icon: 'Zap' },
  { level: 18, type: 'money', value: 6000, name: '6000 BP', icon: 'Zap' },
  { level: 19, type: 'money', value: 7000, name: '7000 BP', icon: 'Zap' },
  { level: 20, type: 'skin', value: 'flare_gun', name: 'Golden Flare', icon: 'Zap' },
  { level: 21, type: 'money', value: 8000, name: '8000 BP', icon: 'Zap' },
  { level: 22, type: 'money', value: 10000, name: '10000 BP', icon: 'Zap' },
  { level: 23, type: 'money', value: 12000, name: '12000 BP', icon: 'Zap' },
  { level: 24, type: 'money', value: 15000, name: '15000 BP', icon: 'Zap' },
  { level: 25, type: 'frame', value: 'gold_frame', name: 'Winner Winner Frame', icon: 'Photo' },
];

export const SHORE_ITEMS = {
  frames: [
    { id: 'none', name: 'No Frame', cost: 0, image: null }
  ],
  skins: [
    { id: 'default', name: 'Steel Helmet', cost: 0, icon: 'Shield' },
    { id: 'pan', name: 'The Pan', cost: 400, icon: 'Flame' },
    { id: 'flare_gun', name: 'Flare Gun', cost: 2000, icon: 'Zap' },
    { id: 'airdrop', name: 'Air Drop', cost: 8000, icon: 'ShoppingBag' }
  ]
};
