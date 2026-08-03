import {
  LayoutDashboard,
  Radar,
  Search,
  Package,
  Swords,
  User,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
}

export const navigation: NavigationItem[] = [
  {
    label: 'Guild',
    href: '/app/guild',
    icon: LayoutDashboard,
  },
  {
    label: 'Radar',
    href: '/app/keywords',
    icon: Radar,
  },
  {
    label: 'Leads',
    href: '/app/deliveries',
    icon: Package,
  },
  {
    label: 'Search',
    href: '/app/keys',
    icon: Search,
  },
  {
    label: 'Runs',
    href: '/app/runs',
    icon: Swords,
  },
  {
    label: 'Profile',
    href: '/app/profile',
    icon: User,
  },
  {
    label: 'Settings',
    href: '/app/settings',
    icon: Settings,
  },
]
