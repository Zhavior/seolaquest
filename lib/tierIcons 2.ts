export interface PlanTier {
  id: string;
  name: string;
  price: string;
  period: string;
  badge: string;
  iconPath: string;
  iconBg: string;           // CSS class for tier-themed icon container glow
  fallbackEmoji: string;
  borderColor: string;
  bgHeader: string;
  cardBg: string;
  textColor: string;
  priceColor: string;
  effectId: 'peasant' | 'swordsman' | 'knight' | 'sorcerer' | 'dragon';
  buttonText: string;
  buttonBg: string;
  buttonTextClass: string;
  buttonShadow: string;
  perks: { icon: string; text: string }[];
  bgIconName: string;
}

export const PLANS: PlanTier[] = [
  {
    id: 'peasant',
    name: 'THE PEASANT',
    price: '$0',
    period: '/mo',
    badge: 'FREE TIER',
    iconPath: '/icons/peasant.png',
    iconBg: 'icon-glow-green',
    fallbackEmoji: '🌾',
    borderColor: 'border-green-500',
    bgHeader: 'bg-green-100',
    cardBg: 'bg-[#D4D4D8]',
    textColor: 'text-black',
    priceColor: 'text-black',
    effectId: 'peasant',
    buttonText: '[START FARMING]',
    buttonBg: 'bg-black hover:bg-zinc-800',
    buttonTextClass: 'text-[#D4D4D8]',
    buttonShadow: 'shadow-[4px_4px_0_0_#fff]',
    perks: [
      { icon: '🌾', text: '+100 Auto-Replies / Mo' },
      { icon: '🔍', text: 'Basic Manual Scans' },
      { icon: '🛡️', text: 'Standard 1x XP Rate' },
      { icon: '📜', text: 'Public Guild Support' }
    ],
    bgIconName: 'Sprout'
  },
  {
    id: 'swordsman',
    name: 'THE SWORDSMAN',
    price: '$15.99',
    period: '/mo',
    badge: 'TIER 0',
    iconPath: '/icons/swordsman.png',
    iconBg: 'icon-glow-lime',
    fallbackEmoji: '🗡️',
    borderColor: 'border-lime-400',
    bgHeader: 'bg-lime-200',
    cardBg: 'bg-[#A3E635]',
    textColor: 'text-black',
    priceColor: 'text-black',
    effectId: 'swordsman',
    buttonText: '[RECRUIT SWORDSMAN]',
    buttonBg: 'bg-black hover:bg-zinc-800',
    buttonTextClass: 'text-[#A3E635]',
    buttonShadow: 'shadow-[4px_4px_0_0_#fff]',
    perks: [
      { icon: '🗡️', text: '+2,500 Auto-Replies / Mo' },
      { icon: '📜', text: 'Real-time Reddit & X Radar' },
      { icon: '⚡', text: '5x Faster Scout Speed' },
      { icon: '👑', text: 'Priority Guild Support' }
    ],
    bgIconName: 'Sword'
  },
  {
    id: 'knight',
    name: 'THE KNIGHT',
    price: '$24.99',
    period: '/mo',
    badge: 'TIER 1',
    iconPath: '/icons/knight.png',
    iconBg: 'icon-glow-cyan',
    fallbackEmoji: '🛡️',
    borderColor: 'border-cyan-400',
    bgHeader: 'bg-cyan-200',
    cardBg: 'bg-[#3B82F6]',
    textColor: 'text-white',
    priceColor: 'text-[#FFE600]',
    effectId: 'knight',
    buttonText: '[EQUIP SHIELD]',
    buttonBg: 'bg-[#FFE600] hover:bg-yellow-300',
    buttonTextClass: 'text-black',
    buttonShadow: 'shadow-[4px_4px_0_0_#000]',
    perks: [
      { icon: '🗡️', text: '+6,000 Auto-Replies / Mo' },
      { icon: '📜', text: 'Real-time Reddit & X Radar' },
      { icon: '⚡', text: '15-Min Rapid Scout' },
      { icon: '👑', text: 'Priority Guild Support' }
    ],
    bgIconName: 'Shield'
  },
  {
    id: 'sorcerer',
    name: 'THE SORCERER',
    price: '$49.99',
    period: '/mo',
    badge: 'TIER 2 (PRO)',
    iconPath: '/icons/sorcerer.png',
    iconBg: 'icon-glow-purple',
    fallbackEmoji: '🔮',
    borderColor: 'border-purple-500',
    bgHeader: 'bg-purple-200',
    cardBg: 'bg-[#8B5CF6]',
    textColor: 'text-white',
    priceColor: 'text-[#FFE600]',
    effectId: 'sorcerer',
    buttonText: '[CAST ARCANE NOVA]',
    buttonBg: 'bg-black hover:bg-zinc-800',
    buttonTextClass: 'text-white',
    buttonShadow: 'shadow-[4px_4px_0_0_rgba(255,230,0,1)]',
    perks: [
      { icon: '🔮', text: '+15,000 Auto-Replies / Mo' },
      { icon: '📜', text: 'Real-time Reddit & X Radar' },
      { icon: '⚡', text: '5x Faster Scout Speed' },
      { icon: '👑', text: 'Priority Guild Support' }
    ],
    bgIconName: 'Sparkles'
  },
  {
    id: 'dragon_slayer',
    name: 'DRAGON SLAYER',
    price: '$199.00',
    period: '/mo',
    badge: 'DRAGON OVERLORD',
    iconPath: '/icons/dragon.gif',
    iconBg: 'icon-glow-red',
    fallbackEmoji: '🐉',
    borderColor: 'border-red-500',
    bgHeader: 'bg-red-200',
    cardBg: 'bg-[#EF4444]',
    textColor: 'text-white',
    priceColor: 'text-[#FFE600]',
    effectId: 'dragon',
    buttonText: '[SUMMON DRAGON]',
    buttonBg: 'bg-[#F59E0B] hover:bg-amber-400',
    buttonTextClass: 'text-black',
    buttonShadow: 'shadow-[4px_4px_0_0_#000]',
    perks: [
      { icon: '🐉', text: '+100,000+ Auto-Replies / Mo' },
      { icon: '📜', text: 'Real-time Reddit & X Radar' },
      { icon: '⚡', text: 'Instant Scout Speed' },
      { icon: '👑', text: 'Priority Guild Support' }
    ],
    bgIconName: 'Flame'
  }
];
