'use client'

import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { sfx } from '@/lib/sfx'
import { BadgeCheck, Compass, Radar, Swords, Zap } from 'lucide-react'
import Link from 'next/link'
import PixelParticleBackground from './PixelParticleBackground'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
}

const quests = [
  {
    title: 'Pain spike detected',
    detail: 'Repeated frustration around slow prospecting and weak demand validation.',
    tag: 'Rare',
  },
  {
    title: 'Founder signal cluster',
    detail: 'Operators want a faster way to confirm what buyers actually want.',
    tag: 'Epic',
  },
]

function AnimatedStatBar({
  label,
  value,
  fill,
  tone = 'yellow',
}: {
  label: string
  value: string
  fill: number
  tone?: 'yellow' | 'white' | 'orange'
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const shouldReduceMotion = useReducedMotion()

  const width = shouldReduceMotion || isInView ? fill : 0

  const panelTone =
    tone === 'yellow'
      ? 'bg-[#FFE600]'
      : tone === 'orange'
        ? 'bg-[#ffede7]'
        : 'bg-white'

  const barTone =
    tone === 'yellow'
      ? 'bg-black'
      : tone === 'orange'
        ? 'bg-[#ff5a36]'
        : 'bg-black'

  return (
    <div ref={ref} className={`border-2 border-black px-3 py-3 ${panelTone}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black uppercase text-black">{value}</p>
      <div className="mt-3 h-2.5 overflow-hidden border-2 border-black bg-white">
        <motion.div
          className={`h-full ${barTone}`}
          initial={shouldReduceMotion ? false : { width: 0 }}
          animate={{ width: `${width}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.95, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
    </div>
  )
}

function RarityBadge({ tag }: { tag: string }) {
  const shouldReduceMotion = useReducedMotion()

  if (tag === 'Epic') {
    return (
      <motion.span
        className="border border-[#a855f7]/60 bg-[#a855f7]/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b4fe]"
        animate={
          shouldReduceMotion
            ? {}
            : {
                boxShadow: [
                  '0 0 0 rgba(168,85,247,0)',
                  '0 0 12px rgba(168,85,247,0.28)',
                  '0 0 0 rgba(168,85,247,0)',
                ],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {tag}
      </motion.span>
    )
  }

  return (
    <motion.span
      className="border border-[#00ff95]/40 bg-[#00ff95]/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#00ff95]"
      animate={
        shouldReduceMotion
          ? {}
          : {
              boxShadow: [
                '0 0 0 rgba(0,255,149,0)',
                '0 0 10px rgba(0,255,149,0.22)',
                '0 0 0 rgba(0,255,149,0)',
              ],
            }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      {tag}
    </motion.span>
  )
}

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion()
  const [activeMobileTab, setActiveMobileTab] = useState<'brief' | 'matches'>('matches')
  const handleArcadePress = useCallback(() => {
    sfx.playCoinDrop()
  }, [])

  const handleHoverBlip = useCallback(() => {
    sfx.playHoverBlip()
  }, [])

  const handleRadarBlip = useCallback(() => {
    sfx.playRadarBlip()
  }, [])

  const handleUnlockChime = useCallback(() => {
    sfx.playBountyUnlock()
  }, [])

  const primaryCtaClassName =
    'group relative inline-flex items-center justify-center gap-3 overflow-hidden border-4 border-black bg-[#ff5a36] px-8 py-4 text-lg font-black uppercase tracking-[0.18em] text-black shadow-[8px_8px_0_0_#000] transition-all duration-75 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[#ff744f] hover:shadow-[10px_10px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[4px_4px_0_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE600] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ebd8] sm:px-10 sm:py-5 sm:text-xl'

  const secondaryCtaClassName =
    'group relative inline-flex items-center justify-center gap-3 overflow-hidden border-4 border-black bg-white px-8 py-4 text-lg font-black uppercase tracking-[0.14em] text-black shadow-[8px_8px_0_0_#000] transition-all duration-75 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[#fff6cf] hover:shadow-[10px_10px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[4px_4px_0_0_#000] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE600] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ebd8] sm:px-10 sm:py-5 sm:text-xl'

  return (
    <section className="relative z-10 overflow-hidden bg-[#f4ebd8] px-4 pb-16 pt-24 sm:px-6 sm:pb-24 sm:pt-32">
      <PixelParticleBackground />

      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.04] mix-blend-multiply">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-6 flex border-4 border-black bg-white p-1 shadow-[4px_4px_0_0_#000] sm:hidden">
          <button
            type="button"
            onPointerDown={() => {
                sfx.playCoinDrop()
                handleArcadePress()
              }}
            onClick={() => {
              sfx.playHoverBlip()
              setActiveMobileTab('brief')
            }}
            className={`flex-1 border-2 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${
              activeMobileTab === 'brief'
                ? 'border-black bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                : 'border-transparent bg-transparent text-black/55'
            }`}
          >
            Quest brief
          </button>
          <button
            type="button"
            onPointerDown={() => {
                sfx.playRadarBlip()
                handleArcadePress()
              }}
            onClick={() => {
              sfx.playRadarBlip()
              setActiveMobileTab('matches')
            }}
            className={`flex-1 border-2 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${
              activeMobileTab === 'matches'
                ? 'border-black bg-[#FFE600] text-black shadow-[2px_2px_0_0_#000]'
                : 'border-transparent bg-transparent text-black/55'
            }`}
          >
            Matches (2)
          </button>
        </div>

        <div className="grid items-center gap-12 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:gap-16">
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="show"
          className={`relative max-w-2xl ${activeMobileTab === 'brief' ? 'block' : 'hidden'} sm:block`}
        >
          <motion.div
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE600] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] shadow-[4px_4px_0_0_#000] sm:text-xs"
          >
            <Radar className="h-3.5 w-3.5" />
            RPG-powered customer intelligence
          </motion.div>

          <motion.h1
            custom={0.08}
            variants={fadeUp}
            className="mt-6 max-w-4xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-black sm:text-7xl lg:text-[92px]"
          >
            Turn market noise
            <span className="mt-2 block text-[#ff5a36]">into winning quests</span>
          </motion.h1>

          <motion.p
            custom={0.16}
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg font-bold leading-relaxed text-black/80 sm:text-xl"
          >
            CoQuest helps founders and operators scan market conversations, review live demand signals,
            and turn scattered pain into clearer customer intelligence.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              onMouseEnter={handleHoverBlip}
              onFocus={handleHoverBlip}
              onPointerDown={handleArcadePress}
              className={primaryCtaClassName}
            >
              <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                <span className="absolute inset-y-0 left-[-20%] w-[18%] -skew-x-12 bg-[#FFE600]/45 blur-[1px]" />
              </span>
              <Zap className="relative z-[1] h-5 w-5" />
              <span className="relative z-[1]">Start hunting free</span>
            </Link>

            <Link
              href="/landing#demo"
              onMouseEnter={handleHoverBlip}
              onFocus={handleHoverBlip}
              onPointerDown={handleRadarBlip}
              className={secondaryCtaClassName}
            >
              <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                <span className="absolute inset-0 bg-[#FFE600]/10" />
              </span>
              <Compass className="relative z-[1] h-5 w-5" />
              <span className="relative z-[1]">See the quest board</span>
            </Link>
          </motion.div>

          <motion.div
            custom={0.32}
            variants={fadeUp}
            className="mt-7 flex max-w-xl items-start gap-3 border-[3px] border-black bg-white px-4 py-4 shadow-[6px_6px_0_0_#000]"
          >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-black bg-[#FFE600] text-black shadow-[4px_4px_0_0_#000]">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-black">
                Zero fake proof
              </p>
              <p className="mt-1 text-sm font-bold leading-relaxed text-black/70">
                No invented case studies, no inflated automation claims, and no pretend live scans.
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }
          }
          className={`relative ${activeMobileTab === 'matches' ? 'block' : 'hidden'} sm:block`}
        >
          <div className="absolute -left-6 top-10 hidden h-24 w-24 border-4 border-black bg-[#FFE600] shadow-[8px_8px_0_0_#000] lg:block" />

          <div className="relative border-4 border-black bg-white shadow-[16px_16px_0_0_#000]">
            <div className="border-b-4 border-black bg-black px-5 py-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FFE600]">
                    Live quest console
                  </p>
                  <p className="mt-1 text-sm font-bold text-white/75">
                    Signal review interface
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 border-2 border-black bg-[#ff5a36]" />
                  <span className="h-3 w-3 border-2 border-black bg-[#FFE600]" />
                  <span className="h-3 w-3 border-2 border-black bg-white" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 bg-[#f4ebd8] p-5 sm:p-6">
              <div className="border-[3px] border-black bg-white p-4 shadow-[6px_6px_0_0_#000]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Active quest
                    </p>
                    <h2 className="mt-1 text-xl font-black uppercase text-black">
                      Detect B2B buying pain
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-black bg-[#ff5a36] text-black shadow-[4px_4px_0_0_#000]">
                    <Swords className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <AnimatedStatBar label="Credits" value="50 mana" fill={84} tone="yellow" />
                  <AnimatedStatBar label="Signal density" value="Rising" fill={62} tone="orange" />
                  <AnimatedStatBar label="Scan confidence" value="Manual" fill={38} tone="white" />
                </div>
              </div>

              <div className="border-[3px] border-black bg-black p-4 text-white shadow-[6px_6px_0_0_#000]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE600]">
                      Quest feed
                    </p>
                    <h3 className="mt-1 text-lg font-black uppercase text-white">
                      2 rising quests
                    </h3>
                  </div>
                  <Zap className="h-5 w-5 text-[#FFE600]" />
                </div>

                <div className="mt-4 grid gap-3">
                  {quests.map((quest) => (
                    <button
                      key={quest.title}
                      type="button"
                      onMouseEnter={handleHoverBlip}
                      onFocus={handleHoverBlip}
                      onPointerDown={quest.tag === 'Epic' ? handleUnlockChime : handleRadarBlip}
                      className="w-full border-2 border-white/20 bg-white/5 p-3 text-left transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE600] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-black uppercase tracking-[0.08em] text-white">
                          {quest.title}
                        </p>
                        <RarityBadge tag={quest.tag} />
                      </div>
                      <p className="mt-2 text-sm font-bold leading-relaxed text-white/75">
                        {quest.detail}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  )
}
