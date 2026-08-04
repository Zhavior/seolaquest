import {
  Castle,
  LayoutDashboard,
  History,
  Send,
  UserCircle,
  Swords,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
  section: 'tactical' | 'guild' | 'system'
  badge?: string
  hotkey?: string
  description?: string
}

export const navigation: NavigationItem[] = [
  {
    label: 'Battle Area',
    href: '/app',
    icon: LayoutDashboard,
    section: 'tactical',
    hotkey: 'B',
    description: 'Core command dashboard and battlefield overview.',
  },
  {
    label: 'Live Signal Radar',
    href: '/app/runs',
    icon: History,
    section: 'tactical',
    badge: '+3',
    hotkey: 'S',
    description: 'Incoming signal queue and active hunt matches.',
  },
  {
    label: 'Quest Log',
    href: '/app/keywords',
    icon: Swords,
    section: 'tactical',
    badge: '0/3',
    hotkey: 'Q',
    description: 'Daily objectives, streaks, and quest progress.',
  },
  {
    label: 'Guild Hall',
    href: '/app/guild',
    icon: Castle,
    section: 'guild',
    hotkey: 'G',
    description: 'Guild activity, wins, and community rewards.',
  },
  {
    label: 'Campaign Broadcast',
    href: '/app/deliveries',
    icon: Send,
    section: 'guild',
    hotkey: 'C',
    description: 'Outbound campaigns, deliveries, and broadcast ops.',
  },
  {
    label: 'Knowledge Lore',
    href: '/app/profile',
    icon: UserCircle,
    section: 'system',
    hotkey: 'L',
    description: 'Saved knowledge, profile, and account identity.',
  },
  {
    label: 'Account & Mana',
    href: '/app/billing',
    icon: CreditCard,
    section: 'system',
    hotkey: 'M',
    description: 'Mana balance, billing, and account controls.',
  },
  {
    label: 'Settings',
    href: '/app/settings',
    icon: Settings,
    section: 'system',
    hotkey: 'K',
    description: 'Preferences, system options, and app settings.',
  },
]
