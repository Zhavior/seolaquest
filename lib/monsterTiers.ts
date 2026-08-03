export type RankGroup = 'COMMON' | 'VETERAN' | 'ARCANE' | 'HIGH_BOSS' | 'MYTHIC' | 'GOD_TIER' | 'COSMIC';

export type MonsterTier = {
  tier: number; // 1 - 50
  name: string;
  icon: string;
  rankGroup: RankGroup;
  borderColor: string;
  badgeBg: string;
  minFollowers: number;
  maxFollowers: number;
  xpReward: number; // Dynamic calculation
};

/**
 * Dynamic XP Calculation formula:
 * XP Reward = 50 + floor((T - 1)^1.85 * 7.35)
 * Scales smoothly from +50 XP for Slime Scouts (T1) up to +10,003 XP for God-King Imperator (T50)!
 */
export function calculateXpReward(tier: number): number {
  const safeTier = Math.max(1, Math.min(50, tier));
  return 50 + Math.floor(Math.pow(safeTier - 1, 1.85) * 7.35);
}

// 50-Tier Progression Matrix spanning 7 Rank Categories
export const MONSTER_TIERS: MonsterTier[] = [
  // 🟢 COMMON (T1–T8 | 0–2.5k Followers)
  { tier: 1, name: 'Slime Scout', icon: '🧪', rankGroup: 'COMMON', borderColor: 'border-lime-500', badgeBg: 'bg-[#A3E635] text-black', minFollowers: 0, maxFollowers: 100, xpReward: calculateXpReward(1) },
  { tier: 2, name: 'Goblin Thief', icon: '👺', rankGroup: 'COMMON', borderColor: 'border-lime-500', badgeBg: 'bg-[#A3E635] text-black', minFollowers: 101, maxFollowers: 250, xpReward: calculateXpReward(2) },
  { tier: 3, name: 'Cave Bat', icon: '🦇', rankGroup: 'COMMON', borderColor: 'border-lime-500', badgeBg: 'bg-[#A3E635] text-black', minFollowers: 251, maxFollowers: 500, xpReward: calculateXpReward(3) },
  { tier: 4, name: 'Skeleton Guard', icon: '💀', rankGroup: 'COMMON', borderColor: 'border-lime-500', badgeBg: 'bg-[#A3E635] text-black', minFollowers: 501, maxFollowers: 800, xpReward: calculateXpReward(4) },
  { tier: 5, name: 'Forest Kobold', icon: '🦎', rankGroup: 'COMMON', borderColor: 'border-lime-500', badgeBg: 'bg-[#A3E635] text-black', minFollowers: 801, maxFollowers: 1200, xpReward: calculateXpReward(5) },
  { tier: 6, name: 'Swamp Crawler', icon: '🕷️', rankGroup: 'COMMON', borderColor: 'border-lime-500', badgeBg: 'bg-[#A3E635] text-black', minFollowers: 1201, maxFollowers: 1600, xpReward: calculateXpReward(6) },
  { tier: 7, name: 'Rust Beetle', icon: '🪲', rankGroup: 'COMMON', borderColor: 'border-lime-500', badgeBg: 'bg-[#A3E635] text-black', minFollowers: 1601, maxFollowers: 2000, xpReward: calculateXpReward(7) },
  { tier: 8, name: 'Gnoll Raider', icon: '🐺', rankGroup: 'COMMON', borderColor: 'border-lime-500', badgeBg: 'bg-[#A3E635] text-black', minFollowers: 2001, maxFollowers: 2500, xpReward: calculateXpReward(8) },

  // 🟡 VETERAN (T9–T16 | 2.5k–15k Followers)
  { tier: 9, name: 'Hobgoblin Warlord', icon: '👹', rankGroup: 'VETERAN', borderColor: 'border-yellow-400', badgeBg: 'bg-[#FFE600] text-black', minFollowers: 2501, maxFollowers: 3500, xpReward: calculateXpReward(9) },
  { tier: 10, name: 'Stone Golem', icon: '🗿', rankGroup: 'VETERAN', borderColor: 'border-yellow-400', badgeBg: 'bg-[#FFE600] text-black', minFollowers: 3501, maxFollowers: 5000, xpReward: calculateXpReward(10) },
  { tier: 11, name: 'Shadow Assassin', icon: '🗡️', rankGroup: 'VETERAN', borderColor: 'border-yellow-400', badgeBg: 'bg-[#FFE600] text-black', minFollowers: 5001, maxFollowers: 6500, xpReward: calculateXpReward(11) },
  { tier: 12, name: 'Frost Ogre', icon: '🥶', rankGroup: 'VETERAN', borderColor: 'border-yellow-400', badgeBg: 'bg-[#FFE600] text-black', minFollowers: 6501, maxFollowers: 8000, xpReward: calculateXpReward(12) },
  { tier: 13, name: 'Blood Harpy', icon: '🦅', rankGroup: 'VETERAN', borderColor: 'border-yellow-400', badgeBg: 'bg-[#FFE600] text-black', minFollowers: 8001, maxFollowers: 9500, xpReward: calculateXpReward(13) },
  { tier: 14, name: 'Crypt Ghoul', icon: '🧟', rankGroup: 'VETERAN', borderColor: 'border-yellow-400', badgeBg: 'bg-[#FFE600] text-black', minFollowers: 9501, maxFollowers: 11000, xpReward: calculateXpReward(14) },
  { tier: 15, name: 'Venom Serpent', icon: '🐍', rankGroup: 'VETERAN', borderColor: 'border-yellow-400', badgeBg: 'bg-[#FFE600] text-black', minFollowers: 11001, maxFollowers: 13000, xpReward: calculateXpReward(15) },
  { tier: 16, name: 'Iron Executioner', icon: '🪓', rankGroup: 'VETERAN', borderColor: 'border-yellow-400', badgeBg: 'bg-[#FFE600] text-black', minFollowers: 13001, maxFollowers: 15000, xpReward: calculateXpReward(16) },

  // 🟣 ARCANE (T17–T24 | 15k–45k Followers)
  { tier: 17, name: 'Arcane Sorcerer', icon: '🧙‍♂️', rankGroup: 'ARCANE', borderColor: 'border-purple-500', badgeBg: 'bg-[#A855F7] text-white', minFollowers: 15001, maxFollowers: 18000, xpReward: calculateXpReward(17) },
  { tier: 18, name: 'Cryptic Lich', icon: '🔮', rankGroup: 'ARCANE', borderColor: 'border-purple-500', badgeBg: 'bg-[#A855F7] text-white', minFollowers: 18001, maxFollowers: 21000, xpReward: calculateXpReward(18) },
  { tier: 19, name: 'Vampire Lord', icon: '🧛', rankGroup: 'ARCANE', borderColor: 'border-purple-500', badgeBg: 'bg-[#A855F7] text-white', minFollowers: 21001, maxFollowers: 25000, xpReward: calculateXpReward(19) },
  { tier: 20, name: 'Nether Wraith', icon: '👻', rankGroup: 'ARCANE', borderColor: 'border-purple-500', badgeBg: 'bg-[#A855F7] text-white', minFollowers: 25001, maxFollowers: 29000, xpReward: calculateXpReward(20) },
  { tier: 21, name: 'Void Weaver', icon: '🕸️', rankGroup: 'ARCANE', borderColor: 'border-purple-500', badgeBg: 'bg-[#A855F7] text-white', minFollowers: 29001, maxFollowers: 33000, xpReward: calculateXpReward(21) },
  { tier: 22, name: 'Astral Warden', icon: '🛡️', rankGroup: 'ARCANE', borderColor: 'border-purple-500', badgeBg: 'bg-[#A855F7] text-white', minFollowers: 33001, maxFollowers: 37000, xpReward: calculateXpReward(22) },
  { tier: 23, name: 'Rune Guardian', icon: '🗿', rankGroup: 'ARCANE', borderColor: 'border-purple-500', badgeBg: 'bg-[#A855F7] text-white', minFollowers: 37001, maxFollowers: 41000, xpReward: calculateXpReward(23) },
  { tier: 24, name: 'Chaos Elemental', icon: '⚡', rankGroup: 'ARCANE', borderColor: 'border-purple-500', badgeBg: 'bg-[#A855F7] text-white', minFollowers: 41001, maxFollowers: 45000, xpReward: calculateXpReward(24) },

  // 🔴 HIGH BOSS (T25–T32 | 45k–100k Followers)
  { tier: 25, name: 'Beholder Sentinel', icon: '👁️', rankGroup: 'HIGH_BOSS', borderColor: 'border-red-500', badgeBg: 'bg-[#EF4444] text-white', minFollowers: 45001, maxFollowers: 51000, xpReward: calculateXpReward(25) },
  { tier: 26, name: 'Storm Leviathan', icon: '🌊', rankGroup: 'HIGH_BOSS', borderColor: 'border-red-500', badgeBg: 'bg-[#EF4444] text-white', minFollowers: 51001, maxFollowers: 58000, xpReward: calculateXpReward(26) },
  { tier: 27, name: 'Infernal Balrog', icon: '👹', rankGroup: 'HIGH_BOSS', borderColor: 'border-red-500', badgeBg: 'bg-[#EF4444] text-white', minFollowers: 58001, maxFollowers: 65000, xpReward: calculateXpReward(27) },
  { tier: 28, name: 'Abyssal Kraken', icon: '🦑', rankGroup: 'HIGH_BOSS', borderColor: 'border-red-500', badgeBg: 'bg-[#EF4444] text-white', minFollowers: 65001, maxFollowers: 72000, xpReward: calculateXpReward(28) },
  { tier: 29, name: 'Hellfire Wyrm', icon: '🐲', rankGroup: 'HIGH_BOSS', borderColor: 'border-red-500', badgeBg: 'bg-[#EF4444] text-white', minFollowers: 72001, maxFollowers: 79000, xpReward: calculateXpReward(29) },
  { tier: 30, name: 'Dread Centurion', icon: '⚔️', rankGroup: 'HIGH_BOSS', borderColor: 'border-red-500', badgeBg: 'bg-[#EF4444] text-white', minFollowers: 79001, maxFollowers: 86000, xpReward: calculateXpReward(30) },
  { tier: 31, name: 'Shadow Lich King', icon: '👑', rankGroup: 'HIGH_BOSS', borderColor: 'border-red-500', badgeBg: 'bg-[#EF4444] text-white', minFollowers: 86001, maxFollowers: 93000, xpReward: calculateXpReward(31) },
  { tier: 32, name: 'Doom Titan', icon: '🌋', rankGroup: 'HIGH_BOSS', borderColor: 'border-red-500', badgeBg: 'bg-[#EF4444] text-white', minFollowers: 93001, maxFollowers: 100000, xpReward: calculateXpReward(32) },

  // 🟠 MYTHIC OVERLORD (T33–T40 | 100k–350k Followers)
  { tier: 33, name: 'Kraken Dreadnought', icon: '🦑', rankGroup: 'MYTHIC', borderColor: 'border-orange-500', badgeBg: 'bg-[#F97316] text-white', minFollowers: 100001, maxFollowers: 130000, xpReward: calculateXpReward(33) },
  { tier: 34, name: 'Phoenix Ascendant', icon: '🦅🔥', rankGroup: 'MYTHIC', borderColor: 'border-orange-500', badgeBg: 'bg-[#F97316] text-white', minFollowers: 130001, maxFollowers: 160000, xpReward: calculateXpReward(34) },
  { tier: 35, name: 'Void Hydra', icon: '🐍', rankGroup: 'MYTHIC', borderColor: 'border-orange-500', badgeBg: 'bg-[#F97316] text-white', minFollowers: 160001, maxFollowers: 190000, xpReward: calculateXpReward(35) },
  { tier: 36, name: 'Chrono Behemoth', icon: '⏳', rankGroup: 'MYTHIC', borderColor: 'border-orange-500', badgeBg: 'bg-[#F97316] text-white', minFollowers: 190001, maxFollowers: 220000, xpReward: calculateXpReward(36) },
  { tier: 37, name: 'ANCIENT DRAGON OVERLORD', icon: '🐉🔥', rankGroup: 'MYTHIC', borderColor: 'border-orange-500', badgeBg: 'bg-[#F97316] text-white font-black', minFollowers: 220001, maxFollowers: 250000, xpReward: calculateXpReward(37) },
  { tier: 38, name: 'Star Devourer', icon: '💫', rankGroup: 'MYTHIC', borderColor: 'border-orange-500', badgeBg: 'bg-[#F97316] text-white', minFollowers: 250001, maxFollowers: 280000, xpReward: calculateXpReward(38) },
  { tier: 39, name: 'Eclipse Archfiend', icon: '🌘', rankGroup: 'MYTHIC', borderColor: 'border-orange-500', badgeBg: 'bg-[#F97316] text-white', minFollowers: 280001, maxFollowers: 315000, xpReward: calculateXpReward(39) },
  { tier: 40, name: 'World-Eater Wurm', icon: '🐛', rankGroup: 'MYTHIC', borderColor: 'border-orange-500', badgeBg: 'bg-[#F97316] text-white', minFollowers: 315001, maxFollowers: 350000, xpReward: calculateXpReward(40) },

  // 💎 GOD-TIER WORLD BOSS (T41–T47 | 350k–1M Followers)
  { tier: 41, name: 'Void Sovereign', icon: '🌌', rankGroup: 'GOD_TIER', borderColor: 'border-cyan-400', badgeBg: 'bg-[#00F0FF] text-black font-black', minFollowers: 350001, maxFollowers: 420000, xpReward: calculateXpReward(41) },
  { tier: 42, name: 'Celestial Archon', icon: '👼', rankGroup: 'GOD_TIER', borderColor: 'border-cyan-400', badgeBg: 'bg-[#00F0FF] text-black font-black', minFollowers: 420001, maxFollowers: 500000, xpReward: calculateXpReward(42) },
  { tier: 43, name: 'Solar Wyrm', icon: '☀️', rankGroup: 'GOD_TIER', borderColor: 'border-cyan-400', badgeBg: 'bg-[#00F0FF] text-black font-black', minFollowers: 500001, maxFollowers: 600000, xpReward: calculateXpReward(43) },
  { tier: 44, name: 'Astral Conqueror', icon: '⚔️', rankGroup: 'GOD_TIER', borderColor: 'border-cyan-400', badgeBg: 'bg-[#00F0FF] text-black font-black', minFollowers: 600001, maxFollowers: 700000, xpReward: calculateXpReward(44) },
  { tier: 45, name: 'Singularity Monarch', icon: '🕳️', rankGroup: 'GOD_TIER', borderColor: 'border-cyan-400', badgeBg: 'bg-[#00F0FF] text-black font-black', minFollowers: 700001, maxFollowers: 800000, xpReward: calculateXpReward(45) },
  { tier: 46, name: 'Nova Empyrean', icon: '💥', rankGroup: 'GOD_TIER', borderColor: 'border-cyan-400', badgeBg: 'bg-[#00F0FF] text-black font-black', minFollowers: 800001, maxFollowers: 900000, xpReward: calculateXpReward(46) },
  { tier: 47, name: 'Galaxy Dreadlord', icon: '🌌', rankGroup: 'GOD_TIER', borderColor: 'border-cyan-400', badgeBg: 'bg-[#00F0FF] text-black font-black', minFollowers: 900001, maxFollowers: 1000000, xpReward: calculateXpReward(47) },

  // 🌌 COSMIC REALM (T48–T50 | 1M+ Followers)
  { tier: 48, name: 'COSMIC TITAN', icon: '🪐', rankGroup: 'COSMIC', borderColor: 'border-yellow-300', badgeBg: 'bg-[#FFE600] text-black font-black', minFollowers: 1000001, maxFollowers: 2500000, xpReward: calculateXpReward(48) },
  { tier: 49, name: 'OMNIPRESENT DEMI-GOD', icon: '✨', rankGroup: 'COSMIC', borderColor: 'border-pink-500', badgeBg: 'bg-[#EC4899] text-white font-black', minFollowers: 2500001, maxFollowers: 5000000, xpReward: calculateXpReward(49) },
  { tier: 50, name: 'GOD-KING IMPERATOR!', icon: '👑⚡', rankGroup: 'COSMIC', borderColor: 'border-amber-400', badgeBg: 'bg-gradient-to-r from-[#FFE600] via-[#F97316] to-[#EC4899] text-black font-black', minFollowers: 5000001, maxFollowers: Infinity, xpReward: calculateXpReward(50) },
];

export function getMonsterTierByNumber(tierNumber: number): MonsterTier {
  const safeIndex = Math.max(0, Math.min(49, tierNumber - 1));
  return MONSTER_TIERS[safeIndex];
}

export function getMonsterTierByFollowers(followers: number): MonsterTier {
  const safeFollowers = Math.max(0, followers);
  for (let i = MONSTER_TIERS.length - 1; i >= 0; i--) {
    if (safeFollowers >= MONSTER_TIERS[i].minFollowers) {
      return MONSTER_TIERS[i];
    }
  }
  return MONSTER_TIERS[0];
}

export function getMonsterForLead(lead: { id: string; author: string; followers?: number }): MonsterTier {
  if (lead.followers !== undefined && lead.followers !== null) {
    return getMonsterTierByFollowers(lead.followers);
  }
  // Deterministic calculation from lead.id + lead.author
  let hash = 0;
  const str = lead.id + lead.author;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const norm = Math.abs(hash) % 100;
  let tierNumber = 1;
  if (norm < 25) {
    tierNumber = 1 + (norm % 8); // T1-T8 Common
  } else if (norm < 45) {
    tierNumber = 9 + (norm % 8); // T9-T16 Veteran
  } else if (norm < 65) {
    tierNumber = 17 + (norm % 8); // T17-T24 Arcane
  } else if (norm < 82) {
    tierNumber = 25 + (norm % 8); // T25-T32 High Boss
  } else if (norm < 92) {
    tierNumber = 33 + (norm % 8); // T33-T40 Mythic Overlord
  } else if (norm < 97) {
    tierNumber = 41 + (norm % 7); // T41-T47 God Tier
  } else {
    tierNumber = 48 + (norm % 3); // T48-T50 Cosmic
  }

  return getMonsterTierByNumber(tierNumber);
}
