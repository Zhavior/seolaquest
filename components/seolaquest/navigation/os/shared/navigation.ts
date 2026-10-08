import {
  Activity,
  LayoutDashboard,
  History,
  ListChecks,
  Send,
  Tags,
  Trophy,
  UserCircle,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { IconName } from '@/features/handbook/artifact/IconSprite'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
  /** Painted emblem from the landing page's icon sprite, used by the rail. */
  emblem: IconName
  section: 'tactical' | 'guild' | 'system'
  color?: string
  badge?: string
  description?: string
}

/**
 * One plain name per page. The same name is used in the rail, the phone tray,
 * the browser tab title, the page heading and the loading message, so a person
 * never has to work out that two words mean the same place. The description is
 * shown under each name in the rail and searched by the command palette.
 */
export const navigation: NavigationItem[] = [
  {
    label: 'Home',
    href: '/app',
    emblem: 'map',
    icon: LayoutDashboard,
    section: 'tactical',
    color: 'bg-emerald-400',
    description: 'Your next step and the leads to look at.',
  },
  {
    label: 'Follow-ups',
    href: '/app/leads',
    emblem: 'scroll',
    icon: ListChecks,
    section: 'tactical',
    color: 'bg-yellow-400',
    description: 'Leads you contacted, and what happened next.',
  },
  {
    label: 'Keywords',
    href: '/app/keywords',
    emblem: 'flag',
    icon: Tags,
    section: 'tactical',
    color: 'bg-orange-400',
    // No badge: '0/3' was a literal on every account, not a count.
    description: 'The phrases we search for.',
  },
  {
    label: 'Scans',
    href: '/app/runs',
    emblem: 'spyglass',
    icon: History,
    section: 'tactical',
    color: 'bg-lime-400',
    description: 'Every scan and what it found.',
  },
  {
    label: 'CRM exports',
    href: '/app/deliveries',
    emblem: 'lighthouse',
    icon: Send,
    section: 'tactical',
    color: 'bg-sky-400',
    description: 'Leads you sent to your CRM.',
  },
  {
    label: 'Goals',
    href: '/app/quests',
    emblem: 'crown',
    icon: Trophy,
    section: 'guild',
    color: 'bg-cyan-400',
    // No badge. The one that used to sit here was the literal string '12' on
    // every account, which is worse than no count at all.
    description: 'Small goals that earn XP as you work.',
  },
  {
    label: 'Activity',
    href: '/app/guild',
    emblem: 'medal',
    icon: Activity,
    section: 'guild',
    color: 'bg-cyan-400',
    description: 'What you have done, and your results.',
  },
  {
    label: 'Profile',
    href: '/app/profile',
    emblem: 'shield',
    icon: UserCircle,
    section: 'system',
    color: 'bg-rose-400',
    description: 'Your name, details and saved notes.',
  },
  {
    label: 'Billing',
    href: '/app/billing',
    emblem: 'chest',
    icon: CreditCard,
    section: 'system',
    color: 'bg-amber-400',
    description: 'Your plan and scan credits.',
  },
  {
    label: 'Settings',
    href: '/app/settings',
    emblem: 'sword',
    icon: Settings,
    section: 'system',
    color: 'bg-purple-400',
    description: 'Your preferences.',
  },
]
