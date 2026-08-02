'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  KeyRound,
  Plus,
  Search,
  Flame,
  Sparkles,
  RefreshCw,
  Terminal,
  FlaskConical,
  Lock,
  Gauge,
  AlertTriangle,
  X,
} from 'lucide-react'
import { sfx } from '@/lib/sfx'
import { ApiRune } from '../types'
import RuneKeyCard from './RuneKeyCard'
import MintKeyModal from './MintKeyModal'
import ManaShopModal from '@/components/ManaShopModal'
import { ApiVaultHeader } from './ApiVaultHeader'
import { ApiVaultStats } from './ApiVaultStats'

import { useApiKeyVault, TOTAL_DAILY_VAULT_MP } from '../hooks/useApiKeyVault'

export default function ApiKeyVault() {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isMintModalOpen,
    setIsMintModalOpen,
    isShopModalOpen,
    setIsShopModalOpen,
    isSlotWarningOpen,
    setIsSlotWarningOpen,
    activeCount,
    revokedCount,
    maxAllowedSlots,
    extraSlots,
    hasArcaneSpeed,
    handleOpenMint,
    handleMintRune,
    handleShatterRune,
    handleResetSeed,
    totalVaultMpConsumed,
    filteredRunes
  } = useApiKeyVault()

  return (
    <div className="min-h-screen max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* 🔐 Lore Header & Mana Quota Banner */}
      <section className="border-4 border-black bg-white p-6 md:p-8 shadow-[8px_8px_0_0_#000] relative overflow-hidden">
        {/* Top Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#FFE600] via-[#06B6D4] to-[#10B981] border-b-3 border-black" />

        <ApiVaultHeader 
          setIsShopModalOpen={setIsShopModalOpen}
          handleOpenMint={handleOpenMint}
        />

        <ApiVaultStats 
          totalVaultMpConsumed={totalVaultMpConsumed}
          totalDailyVaultMp={TOTAL_DAILY_VAULT_MP}
          activeCount={activeCount}
          maxAllowedSlots={maxAllowedSlots}
          extraSlots={extraSlots}
          hasArcaneSpeed={hasArcaneSpeed}
          revokedCount={revokedCount}
        />
      </section>

      {/* ⚔️ Action Bar: Search, Filters & Stats */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 stroke-[3px]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runes by label or key hash..."
            className="w-full bg-white border-3 border-black pl-11 pr-4 py-3 font-bold text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] shadow-[4px_4px_0_0_#000]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {(['ALL', 'ACTIVE', 'REVOKED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                sfx.playHoverBlip()
                setStatusFilter(tab)
              }}
              className={`px-4 py-3 font-black text-xs uppercase border-3 border-black cursor-pointer transition-all shadow-[3px_3px_0_0_#000] ${
                statusFilter === tab
                  ? 'bg-black text-[#FFE600]'
                  : 'bg-white text-black hover:bg-zinc-100'
              }`}
            >
              {tab === 'ALL' ? 'ALL RUNES' : tab === 'ACTIVE' ? '🟢 ACTIVE' : '💀 REVOKED'}
            </button>
          ))}

          <button
            onClick={handleResetSeed}
            title="Reset to default seed runes"
            className="p-3 bg-zinc-100 hover:bg-zinc-200 border-3 border-black text-black cursor-pointer shadow-[3px_3px_0_0_#000]"
          >
            <RefreshCw className="w-4 h-4 stroke-[3px]" />
          </button>
        </div>
      </div>

      {/* 📜 Active Key Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-black">
          <span>FORGED RUNES ({filteredRunes.length})</span>
          <span className="font-mono text-zinc-500">BEARER SCROLL TOKEN REGISTRY</span>
        </div>

        {filteredRunes.length === 0 ? (
          <div className="border-4 border-black bg-white p-12 text-center space-y-4 shadow-[8px_8px_0_0_#000]">
            <div className="text-4xl">🔮</div>
            <h3 className="font-black text-xl text-black uppercase">NO API RUNES FOUND</h3>
            <p className="text-sm font-bold text-zinc-600 max-w-md mx-auto">
              {searchQuery
                ? `No runes match "${searchQuery}". Try clearing your search.`
                : 'Mint your first API Rune scroll to start making authenticated calls into the CoQuest engine!'}
            </p>
            <button
              onClick={handleOpenMint}
              className="bg-[#FFE600] text-black font-black uppercase text-xs px-6 py-3 border-3 border-black shadow-[4px_4px_0_0_#000] hover:bg-yellow-300 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>FORGE FIRST RUNE</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredRunes.map((rune) => (
                <RuneKeyCard key={rune.id} rune={rune} onShatter={handleShatterRune} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 📜 Quick Integration Reference Scroll */}
      <section className="border-4 border-black bg-[#18181B] text-white p-6 shadow-[6px_6px_0_0_#000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-zinc-700 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#38BDF8]" />
            <h3 className="font-black text-sm uppercase tracking-wide text-white">
              ⚔️ API RUNE QUICK INTEGRATION CODE
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#FFE600] bg-black px-2 py-0.5 border border-zinc-700">
            HTTP BEARER AUTH
          </span>
        </div>

        <div className="font-mono text-xs text-zinc-300 bg-black p-4 border-2 border-zinc-700 overflow-x-auto space-y-2">
          <div className="text-zinc-500 font-bold">{`// Example: Fetching live detected Reddit/X bounties using your API Rune`}</div>
          <div className="text-[#38BDF8]">
            curl -X GET &quot;https://api.coquest.io/v1/scouts/bounties&quot; \
          </div>
          <div className="text-[#10B981]">
            &nbsp;&nbsp;-H &quot;Authorization: Bearer <span className="text-[#FFE600]">cq_live_secret_x882a...</span>&quot; \
          </div>
          <div className="text-[#10B981]">
            &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot;
          </div>
        </div>
      </section>

      {/* Mint Modal */}
      <MintKeyModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        onMint={handleMintRune}
      />

      {/* Alchemist Shop Modal */}
      {isShopModalOpen && (
        <ManaShopModal onClose={() => setIsShopModalOpen(false)} />
      )}

      {/* 🔒 Slot Limit Warning Modal */}
      {isSlotWarningOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#F4F0EA] border-4 border-black p-6 md:p-8 max-w-lg w-full text-black shadow-[10px_10px_0_0_#000] relative space-y-4"
          >
            <button
              onClick={() => setIsSlotWarningOpen(false)}
              className="absolute top-4 right-4 bg-white border-2 border-black p-1 hover:bg-black hover:text-white"
            >
              <X className="w-5 h-5 stroke-[3px]" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#FF0055] text-white border-2 border-black shadow-[2px_2px_0_0_#000]">
                <AlertTriangle className="w-7 h-7 stroke-[3px]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase bg-black text-[#FF0055] px-2 py-0.5 border border-black">
                  VAULT CAPACITY REACHED
                </span>
                <h3 className="text-2xl font-black uppercase text-black mt-0.5">
                  RUNE SLOT LIMIT EXCEEDED
                </h3>
              </div>
            </div>

            <p className="text-sm font-bold text-zinc-700">
              Your account currently has <span className="font-mono font-black text-black">{activeCount} / {maxAllowedSlots} Active API Rune Slots</span> in use. To generate separate keys for Staging, Discord, or CRM integrations, upgrade your Rune Vault in The Alchemist Shop!
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  sfx.playElixirDrink()
                  setIsSlotWarningOpen(false)
                  setIsShopModalOpen(true)
                }}
                className="w-full bg-[#FFE600] hover:bg-yellow-300 text-black font-black uppercase text-xs py-3 border-3 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center gap-2 cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 stroke-[3px]" />
                <span>UNLOCK EXTRA RUNE SLOT ($10/MO)</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

