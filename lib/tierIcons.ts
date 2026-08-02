import type { PlanCode } from '@/src/modules/billing/domain/catalog'

export interface PlanTier {
  code: PlanCode
  id: string
  name: string
  price: string
  period: string
  badge: string
  enabled: boolean
  iconPath: string
  iconBg: string
  fallbackEmoji: string
  cardBg: string
  textColor: string
  priceColor: string
  effectId: 'peasant' | 'swordsman' | 'knight' | 'sorcerer'
  buttonText: string
  buttonBg: string
  buttonTextClass: string
  buttonShadow: string
  perks: { icon: string; text: string }[]
  bgIconName: string
}

export const PLANS: PlanTier[] = [
  {
    code: 'FREE',
    id: 'free',
    name: 'FREE SCOUT',
    price: '$0',
    period: '/mo',
    badge: 'CURRENT BASE',
    enabled: true,
    iconPath: '/icons/peasant.png',
    iconBg: 'icon-glow-green',
    fallbackEmoji: '🌾',
    cardBg: 'bg-[#D4D4D8]',
    textColor: 'text-black',
    priceColor: 'text-black',
    effectId: 'peasant',
    buttonText: '[FREE ACCESS]',
    buttonBg: 'bg-zinc-300',
    buttonTextClass: 'text-zinc-700',
    buttonShadow: 'shadow-[4px_4px_0_0_#fff]',
    perks: [
      { icon: '🔍', text: 'Explore the dashboard' },
      { icon: '🛡️', text: 'No paid feature claims' },
    ],
    bgIconName: 'Sprout',
  },
  {
    code: 'BETA',
    id: 'beta_hunter',
    name: 'BETA HUNTER',
    price: '$14.99',
    period: '/mo',
    badge: 'ENABLED BETA',
    enabled: true,
    iconPath: '/icons/swordsman.png',
    iconBg: 'icon-glow-lime',
    fallbackEmoji: '🗡️',
    cardBg: 'bg-[#A3E635]',
    textColor: 'text-black',
    priceColor: 'text-black',
    effectId: 'swordsman',
    buttonText: '[JOIN PAID BETA]',
    buttonBg: 'bg-black hover:bg-zinc-800',
    buttonTextClass: 'text-[#A3E635]',
    buttonShadow: 'shadow-[4px_4px_0_0_#fff]',
    perks: [
      { icon: '⚔️', text: '50 scans included' },
      { icon: '📡', text: 'Paid radar access' },
      { icon: '🧪', text: 'Optional credit top-ups' },
    ],
    bgIconName: 'Sword',
  },
  {
    code: 'PRO',
    id: 'pro_hunter',
    name: 'PRO HUNTER',
    price: 'COMING',
    period: ' SOON',
    badge: 'DISABLED',
    enabled: false,
    iconPath: '/icons/knight.png',
    iconBg: 'icon-glow-cyan',
    fallbackEmoji: '🛡️',
    cardBg: 'bg-[#3B82F6]',
    textColor: 'text-white',
    priceColor: 'text-[#FFE600]',
    effectId: 'knight',
    buttonText: '[NOT FOR SALE]',
    buttonBg: 'bg-zinc-700',
    buttonTextClass: 'text-zinc-300',
    buttonShadow: 'shadow-[4px_4px_0_0_#000]',
    perks: [{ icon: '🔒', text: 'No entitlement is granted' }],
    bgIconName: 'Shield',
  },
  {
    code: 'AGENCY',
    id: 'agency_hunter',
    name: 'AGENCY HUNTER',
    price: 'COMING',
    period: ' SOON',
    badge: 'DISABLED',
    enabled: false,
    iconPath: '/icons/sorcerer.png',
    iconBg: 'icon-glow-purple',
    fallbackEmoji: '🔮',
    cardBg: 'bg-[#8B5CF6]',
    textColor: 'text-white',
    priceColor: 'text-[#FFE600]',
    effectId: 'sorcerer',
    buttonText: '[NOT FOR SALE]',
    buttonBg: 'bg-zinc-700',
    buttonTextClass: 'text-zinc-300',
    buttonShadow: 'shadow-[4px_4px_0_0_#000]',
    perks: [{ icon: '🔒', text: 'No entitlement is granted' }],
    bgIconName: 'Sparkles',
  },
]
