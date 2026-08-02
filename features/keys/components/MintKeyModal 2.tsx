'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Copy, Check, KeyRound, AlertTriangle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { sfx } from '@/lib/sfx'
import { ApiRune, RUNE_SCOPES, RuneScope } from '../types'

interface MintKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onMint: (newRune: ApiRune) => void
}

const QUOTA_OPTIONS = [
  { label: '500 MP / Day', value: 500, desc: 'Casual Bot / Webhook' },
  { label: '1,000 MP / Day', value: 1000, desc: 'Standard Guild Bot' },
  { label: '2,500 MP / Day', value: 2500, desc: 'High Frequency Scout' },
  { label: '5,000 MP / Day', value: 5000, desc: 'Heavy Automation' },
]

export default function MintKeyModal({ isOpen, onClose, onMint }: MintKeyModalProps) {
  const [label, setLabel] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<RuneScope[]>([
    'scouts:read',
    'strikes:write',
  ])
  const [quotaMp, setQuotaMp] = useState<number>(1000)
  const [mintedRune, setMintedRune] = useState<ApiRune | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const toggleScope = (scopeId: RuneScope) => {
    sfx.playHoverBlip()
    if (selectedScopes.includes(scopeId)) {
      if (selectedScopes.length === 1) {
        setErrorMsg('At least one ability scope is required!')
        return
      }
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId))
    } else {
      setSelectedScopes([...selectedScopes, scopeId])
    }
    setErrorMsg('')
  }

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      setErrorMsg('Please enter a name for your API Rune!')
      sfx.playCriticalWarning()
      return
    }

    // Generate secret token
    const randomBytes = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    const rawSecret = `cq_live_secret_${randomBytes}`
    const suffix = randomBytes.slice(-4)
    const maskedHash = `cq_live_••••••••${suffix}`

    const newRune: ApiRune = {
      id: `rune_${Date.now()}`,
      label: label.trim(),
      keyPrefix: 'cq_live_secret_',
      keyHash: maskedHash,
      rawKey: rawSecret,
      scopes: selectedScopes,
      status: 'ACTIVE',
      createdAt: 'Just now',
      lastActive: 'Never',
      dailyQuotaMp: quotaMp,
      usedQuotaMp: 0,
    }

    setMintedRune(newRune)
    onMint(newRune)
    sfx.playCoinDrop()

    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFE600', '#06B6D4', '#10B981', '#F59E0B'],
      })
    } catch {
      // fallback if confetti fails
    }
  }

  const handleCopySecret = async () => {
    if (!mintedRune?.rawKey) return
    try {
      await navigator.clipboard.writeText(mintedRune.rawKey)
      setCopied(true)
      sfx.playCoinDrop()
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  const handleClose = () => {
    sfx.playHoverBlip()
    setLabel('')
    setSelectedScopes(['scouts:read', 'strikes:write'])
    setQuotaMp(1000)
    setMintedRune(null)
    setCopied(false)
    setErrorMsg('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl bg-white border-4 border-black p-6 shadow-[10px_10px_0_0_#000] relative overflow-hidden"
      >
        {/* Modal Top Ribbon */}
        <div className="bg-[#FFE600] border-b-4 border-black -mx-6 -mt-6 p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-black text-[#FFE600] p-2 border-2 border-black">
              <KeyRound className="w-6 h-6 stroke-[3px]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide text-black">
                {mintedRune ? '✨ RUNE FORGED SUCCESSFULLY!' : '⚔️ FORGE NEW API RUNE'}
              </h2>
              <p className="text-xs font-bold text-black/80">
                {mintedRune
                  ? 'Copy your secret bearer scroll token before closing.'
                  : 'Mint an encrypted bearer token to bridge external bots into CoQuest.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 bg-white border-2 border-black hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3px]" />
          </button>
        </div>

        {mintedRune ? (
          /* Secret Key Reveal View */
          <div className="space-y-5">
            <div className="border-4 border-black bg-emerald-50 p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-xs uppercase bg-emerald-400 text-black px-2 py-0.5 border-2 border-black">
                  🔐 SECRET BEARER RUNE (REVEALED ONCE)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  Label: {mintedRune.label}
                </span>
              </div>
              <div className="font-mono font-bold text-sm bg-black text-[#FFE600] p-3 border-2 border-black break-all select-all flex items-center justify-between gap-2 shadow-[3px_3px_0_0_#000]">
                <span>{mintedRune.rawKey}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-100 p-2 border-2 border-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                <span>
                  Save this key now! CoQuest stores only the cryptographic hash and cannot reveal it again.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopySecret}
                className="flex-1 bg-[#06B6D4] text-black font-black uppercase text-sm py-3 px-4 border-4 border-black shadow-[4px_4px_0_0_#000] hover:bg-cyan-300 flex items-center justify-center gap-2 cursor-pointer transition-transform active:translate-y-1"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 stroke-[3px] text-black" />
                    <span>COPIED TO SCROLLBOARD!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 stroke-[3px]" />
                    <span>📋 COPY SECRET RUNE</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                className="bg-black text-white font-black uppercase text-sm py-3 px-6 border-4 border-black shadow-[4px_4px_0_0_#FFE600] hover:bg-zinc-800 cursor-pointer"
              >
                DONE & CLOSE
              </button>
            </div>
          </div>
        ) : (
          /* Rune Creation Form */
          <form onSubmit={handleMint} className="space-y-5">
            {errorMsg && (
              <div className="bg-red-500 text-white font-black text-xs uppercase p-3 border-3 border-black flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Rune Label Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">
                🏷️ RUNE LABEL / BOT IDENTIFIER
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Discord_Bounty_Notifier or Zapier_Lead_Webhook"
                className="w-full bg-zinc-50 border-3 border-black p-3 font-bold text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#06B6D4] shadow-[3px_3px_0_0_#000]"
              />
            </div>

            {/* Scope Toggles */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                🛡️ RPG ABILITY SCOPES (PERMISSIONS)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {RUNE_SCOPES.map((scope) => {
                  const isSelected = selectedScopes.includes(scope.id)
                  return (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => toggleScope(scope.id)}
                      className={`p-3 border-3 border-black text-left flex flex-col justify-between transition-all cursor-pointer shadow-[3px_3px_0_0_#000] ${
                        isSelected
                          ? `${scope.badgeColor} ring-2 ring-black font-black`
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg">{scope.icon}</span>
                          <span
                            className={`w-4 h-4 border-2 border-black flex items-center justify-center text-[10px] ${
                              isSelected ? 'bg-black text-white' : 'bg-white'
                            }`}
                          >
                            {isSelected && '✓'}
                          </span>
                        </div>
                        <div className="font-black text-xs tracking-tight">{scope.name}</div>
                      </div>
                      <div className="text-[10px] mt-2 leading-tight opacity-90">
                        {scope.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Daily Mana Quota */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-2">
                🧪 DAILY MANA QUOTA LIMIT (MP / DAY)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUOTA_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      sfx.playHoverBlip()
                      setQuotaMp(opt.value)
                    }}
                    className={`p-2 border-3 border-black text-center cursor-pointer transition-all shadow-[2px_2px_0_0_#000] ${
                      quotaMp === opt.value
                        ? 'bg-[#FFE600] font-black text-black ring-2 ring-black'
                        : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 font-bold'
                    }`}
                  >
                    <div className="text-xs font-black">{opt.label}</div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t-3 border-black">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 font-black uppercase text-xs border-3 border-black bg-zinc-200 hover:bg-zinc-300 text-black cursor-pointer shadow-[2px_2px_0_0_#000]"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 font-black uppercase text-xs border-3 border-black bg-[#10B981] hover:bg-emerald-400 text-black cursor-pointer shadow-[4px_4px_0_0_#000] flex items-center gap-2 active:translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>FORGE RUNE SCROLL</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
