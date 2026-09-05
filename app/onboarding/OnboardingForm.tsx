'use client'

import React, { FormEvent, useEffect, useMemo, useRef, useState, useTransition, type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  Coins,
  Crown,
  Flame,
  Hammer,
  Rocket,
  ScrollText,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react'
import {
  completeOnboardingAction,
  saveOnboardingStepAction,
  skipOnboardingStepAction,
} from '@/features/auth/actions'
import {
  DEFAULT_PROFILE_ICON_KEY,
  PROFILE_ICON_OPTIONS,
  type ProfileIconKey,
} from '@/features/auth/profileIconOptions'
import { KEYWORD_PRESETS } from '@/features/auth/keywordPresets'
import {
  objectiveForStep,
  QUEST_OBJECTIVES,
  QUEST_TITLE,
} from '@/features/auth/questSteps'
import {
  clampOnboardingStep,
  DEFAULT_PREFERRED_SOURCE,
  isSelectablePreferredSource,
  LAST_ONBOARDING_STEP,
  type OnboardingDraft,
  type PreferredSource,
  type SaveOnboardingStepInput,
} from '@/features/auth/onboarding'
import { sfx } from '@/lib/sfx'

type Props = {
  initialDraft: OnboardingDraft
}

// RPG Sigil Class Specs for Gamified Selector
const SIGIL_CLASS_SPECS: Record<string, { title: string; perk: string; color: string }> = {
  target: { title: 'Sharpshooter', perk: 'Profile emblem · appearance only', color: 'bg-highlight-strong' },
  star: { title: 'Stargazer', perk: 'Profile emblem · appearance only', color: 'bg-highlight' },
  rocket: { title: 'Vanguard', perk: 'Profile emblem · appearance only', color: 'bg-[#BAE6FD]' },
  lightning: { title: 'Stormbringer', perk: 'Profile emblem · appearance only', color: 'bg-highlight' },
  crystalBall: { title: 'Oracle', perk: 'Profile emblem · appearance only', color: 'bg-[#DDD6FE]' },
  shield: { title: 'Guardian', perk: 'Profile emblem · appearance only', color: 'bg-[#BBF7D0]' },
  crown: { title: 'Sovereign', perk: 'Profile emblem · appearance only', color: 'bg-highlight-strong' },
  fire: { title: 'Pyromancer', perk: 'Profile emblem · appearance only', color: 'bg-[#FECACA]' },
  sword: { title: 'Blade Master', perk: 'Profile emblem · appearance only', color: 'bg-[#E9D5FF]' },
  robot: { title: 'Cyber Scout', perk: 'Profile emblem · appearance only', color: 'bg-[#CFFAFE]' },
}

// RPG Weapon Presets Rarity Mapping
const WEAPON_RARITY: Record<string, { label: string; bg: string; text: string }> = {
  'rec-blade': { label: 'RARE [II]', bg: 'bg-blue-100', text: 'text-blue-800' },
  'comp-spear': { label: 'EPIC [III]', bg: 'bg-purple-100', text: 'text-purple-800' },
  'budget-orb': { label: 'UNCOMMON [I]', bg: 'bg-emerald-100', text: 'text-ink' },
  'direct-bow': { label: 'LEGENDARY [MAX]', bg: 'bg-amber-100', text: 'text-amber-800' },
}

function getProfileIconComponent(key: ProfileIconKey) {
  switch (key) {
    case 'rocket': return Rocket
    case 'target': return Target
    case 'lightning': return Zap
    case 'crystalBall': return Sparkles
    case 'shield': return Shield
    case 'crown': return Crown
    case 'fire': return Flame
    case 'sword': return Swords
    case 'star': return Star
    case 'robot': return Bot
    default: return Target
  }
}

function getPresetIconComponent(presetId: string) {
  switch (presetId) {
    case 'recommendation-blade': return Swords
    case 'alternative-arrow': return Target
    case 'frustration-hammer': return Hammer
    case 'switching-shield': return ShieldCheck
    case 'budget-orb': return Coins
    case 'hiring-dagger': return Briefcase
    default: return Swords
  }
}

export default function OnboardingForm({ initialDraft }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(() => clampOnboardingStep(initialDraft.onboardingStep))
  const [displayName, setDisplayName] = useState(() => {
    if (initialDraft.displayName) return initialDraft.displayName
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('seolaquest_onboarding_draft')
        if (raw) return JSON.parse(raw).displayName || ''
      } catch {}
    }
    return ''
  })
  const [profileIconKey, setProfileIconKey] = useState<ProfileIconKey>(() => {
    if (initialDraft.profileIconKey) return initialDraft.profileIconKey
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('seolaquest_onboarding_draft')
        if (raw) {
          const key = JSON.parse(raw).profileIconKey
          if (key) return key as ProfileIconKey
        }
      } catch {}
    }
    return DEFAULT_PROFILE_ICON_KEY
  })
  const [businessDescription, setBusinessDescription] = useState(() => {
    if (initialDraft.businessDescription) return initialDraft.businessDescription
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('seolaquest_onboarding_draft')
        if (raw) return JSON.parse(raw).businessDescription || ''
      } catch {}
    }
    return ''
  })
  const [targetCustomer, setTargetCustomer] = useState(() => {
    if (initialDraft.targetCustomer) return initialDraft.targetCustomer
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('seolaquest_onboarding_draft')
        if (raw) return JSON.parse(raw).targetCustomer || ''
      } catch {}
    }
    return ''
  })
  const [firstKeyword, setFirstKeyword] = useState(() => {
    if (initialDraft.firstKeyword) return initialDraft.firstKeyword
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('seolaquest_onboarding_draft')
        if (raw) return JSON.parse(raw).firstKeyword || ''
      } catch {}
    }
    return ''
  })
  const [preferredSource, setPreferredSource] = useState<PreferredSource>(() => {
    if (isSelectablePreferredSource(initialDraft.preferredSource)) {
      return initialDraft.preferredSource as PreferredSource
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('seolaquest_onboarding_draft')
        if (raw) {
          const source = JSON.parse(raw).preferredSource
          if (isSelectablePreferredSource(source)) return source as PreferredSource
        }
      } catch {}
    }
    return DEFAULT_PREFERRED_SOURCE
  })

  const [error, setError] = useState('')
  const [signedOut, setSignedOut] = useState(false)
  const [soundOn, setSoundOn] = useState(() => sfx.isEnabled())
  const [celebrating, setCelebrating] = useState(false)
  // What the completion actually produced, so the celebration can report the
  // real number rather than a constant that was true for every account.
  const [questsAssigned, setQuestsAssigned] = useState(0)
  const [pending, startTransition] = useTransition()

  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const keywordInputRef = useRef<HTMLInputElement>(null)

  const normalizedDisplayName = displayName.replace(/\s+/g, ' ').trim()
  const normalizedBusinessDescription = businessDescription.replace(/\s+/g, ' ').trim()
  const normalizedTargetCustomer = targetCustomer.replace(/\s+/g, ' ').trim()
  const normalizedFirstKeyword = firstKeyword.replace(/\s+/g, ' ').trim()

  const currentObjective = objectiveForStep(step)
  const objectivesCleared = step - 1
  const questProgress = Math.round((objectivesCleared / LAST_ONBOARDING_STEP) * 100)

  const selectedIcon = useMemo(
    () => PROFILE_ICON_OPTIONS.find((option) => option.key === profileIconKey) ?? PROFILE_ICON_OPTIONS[0],
    [profileIconKey],
  )

  const currentClassSpec = SIGIL_CLASS_SPECS[profileIconKey] ?? SIGIL_CLASS_SPECS.target

  useEffect(() => {
    stepHeadingRef.current?.focus({ preventScroll: true })
  }, [step])

  // Auto-save draft inputs to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(
        'seolaquest_onboarding_draft',
        JSON.stringify({
          displayName,
          profileIconKey,
          businessDescription,
          targetCustomer,
          firstKeyword,
          preferredSource,
          step,
        }),
      )
    } catch {
      // Ignore storage errors
    }
  }, [displayName, profileIconKey, businessDescription, targetCustomer, firstKeyword, preferredSource, step])

  function toggleSound() {
    const next = sfx.toggle()
    setSoundOn(next)
    if (next) sfx.playHoverBlip()
  }

  function validateCurrentStep(): string | null {
    if (step === 1) {
      if (!normalizedDisplayName) return 'Add a display name to continue.'
      if (normalizedDisplayName.length > 60) return 'Use 60 characters or fewer.'
      if (!PROFILE_ICON_OPTIONS.some((option) => option.key === profileIconKey)) {
        return 'Choose a hunter icon to continue.'
      }
      return null
    }

    if (step === 2) {
      if (!normalizedBusinessDescription) return 'Describe what your business or product does.'
      if (normalizedBusinessDescription.length > 500) return 'Use 500 characters or fewer.'
      return null
    }

    if (step === 3) {
      if (!normalizedTargetCustomer) return 'Describe the customer you want to find.'
      if (normalizedTargetCustomer.length > 300) return 'Use 300 characters or fewer.'
      return null
    }

    if (step === 4) {
      if (normalizedFirstKeyword.length < 3) return 'Use at least 3 characters for your keyword.'
      if (normalizedFirstKeyword.length > 80) return 'Use 80 characters or fewer.'
      return null
    }

    if (step === 5) {
      if (!isSelectablePreferredSource(preferredSource)) {
        return 'Choose an available source before continuing.'
      }
      return null
    }

    return null
  }

  function currentInput(): SaveOnboardingStepInput | null {
    if (step === 1) {
      return {
        step: 1,
        value: {
          displayName: normalizedDisplayName,
          profileIconKey,
        },
      }
    }

    if (step === 2) return { step: 2, value: normalizedBusinessDescription }
    if (step === 3) return { step: 3, value: normalizedTargetCustomer }
    if (step === 4) return { step: 4, value: normalizedFirstKeyword }
    if (step === 5) return { step: 5, value: preferredSource }

    return null
  }

  function handleFailure(result: { code: string; message: string }) {
    sfx.playCriticalWarning()
    setError(result.message)
    setSignedOut(result.code === 'SIGNED_OUT')

    if (result.code === 'ALREADY_COMPLETE') {
      router.replace('/app')
      router.refresh()
    }
  }

  function equipPreset(preset: (typeof KEYWORD_PRESETS)[number]) {
    sfx.playSwordSlash()
    setFirstKeyword(preset.phrase)
    setError('')

    if (preset.needsCompletion) {
      requestAnimationFrame(() => {
        const input = keywordInputRef.current
        if (!input) return
        input.focus()
        input.setSelectionRange(input.value.length, input.value.length)
      })
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationMessage = validateCurrentStep()
    if (validationMessage) {
      sfx.playCriticalWarning()
      setError(validationMessage)
      return
    }

    const input = currentInput()
    if (!input) return

    startTransition(async () => {
      const result = await saveOnboardingStepAction(input)
      if (!result.ok) return handleFailure(result)
      sfx.playCoinDrop()
      setStep(result.nextStep)
    })
  }

  function skipCurrentStep() {
    if (step !== 2 && step !== 3) return

    const skippedStep = step
    setError('')

    startTransition(async () => {
      const result = await skipOnboardingStepAction(skippedStep)
      if (!result.ok) return handleFailure(result)

      if (skippedStep === 2) setBusinessDescription('')
      if (skippedStep === 3) setTargetCustomer('')

      sfx.playCoinDrop()
      setStep(result.nextStep)
    })
  }

  function complete() {
    setError('')

    startTransition(async () => {
      const result = await completeOnboardingAction()
      if (!result.ok) return handleFailure(result)

      sfx.playLevelUp()
      setQuestsAssigned(result.reward.questsAssigned)
      setCelebrating(true)

      const celebration = new URLSearchParams({
        keywordId: result.keyword.id,
        questComplete: 'first-quest',
        quests: String(result.reward.questsAssigned),
        samples: String(result.reward.sampleQuestsSeeded),
      })

      router.push(`/app?${celebration.toString()}`)
      router.refresh()
    })
  }

  return (
    <div className="min-h-dvh bg-canvas px-3 py-3 sm:px-6 flex flex-col justify-between text-ink font-sans selection:bg-highlight selection:text-on-accent">
      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 shrink-0 py-1">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-xl font-semibold normal-case tracking-wide underline-offset-4 hover:underline focus-visible:outline-4 focus-visible:outline-offset-4 text-ink"
        >
          <Crown className="h-6 w-6 text-ink-muted" />
          <span>SEOlaQuest</span>
          <span className="border border-outline bg-accent px-1.5 py-0.5 text-[10px] font-semibold normal-case shadow-brutal-sm rounded-xl">
            BETA
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="inline-flex min-h-11 items-center gap-2 border border-outline bg-card px-3 py-1.5 text-xs font-semibold normal-case shadow-brutal-sm focus-visible:outline-4 focus-visible:outline-offset-4 text-ink rounded-xl"
          >
            {soundOn ? <Volume2 aria-hidden size={16} /> : <VolumeX aria-hidden size={16} />}
            <span className="hidden sm:inline">{soundOn ? 'Sound on' : 'Sound off'}</span>
          </button>

          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="min-h-11 border border-outline bg-card px-3 py-1.5 text-xs font-semibold normal-case shadow-brutal-sm focus-visible:outline-4 focus-visible:outline-offset-4 text-ink rounded-xl"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main Single-Screen Gamified Card */}
      <main className="mx-auto w-full max-w-6xl flex-1 min-h-0 flex flex-col justify-between border border-outline bg-card p-5 sm:p-8 shadow-brutal-lg rounded-xl">
        {/* Quest Title & Gamified Badges */}
        <div className="shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 border border-outline bg-highlight px-2.5 py-1 text-xs font-semibold normal-case shadow-brutal-sm rounded-xl">
                <ScrollText aria-hidden size={16} /> Getting started
              </span>
              <span className="inline-flex items-center gap-1.5 border border-outline bg-accent px-2.5 py-1 text-xs font-semibold normal-case shadow-brutal-sm  rounded-xl">
                <Sparkles aria-hidden size={16} /> Reward: your quest board
              </span>
            </div>

            <span className="inline-flex items-center gap-1 border border-outline bg-highlight-strong px-2 py-0.5 text-xs font-semibold normal-case shadow-brutal-sm rounded-xl">
              <Flame size={14} className="text-amber-600" /> Stage {step} of {LAST_ONBOARDING_STEP}
            </span>
          </div>

          <h1 className="mt-1.5 text-2xl font-semibold normal-case sm:text-3xl tracking-tight text-ink flex items-center gap-2">
            <Swords className="h-6 w-6 text-ink-muted" />
            {QUEST_TITLE}
          </h1>
          <p className="mt-0.5 max-w-3xl text-xs font-bold text-ink-muted">
            Six objectives. Each stage saves automatically when cleared, so you can resume anytime.
          </p>

          <QuestLog
            step={step}
            progress={questProgress}
            onSelectStep={(s) => {
              setStep(s)
              sfx.playHoverBlip()
            }}
          />
        </div>

        {/* Global Error Notice */}
        {error ? (
          <p
            id="onboarding-error"
            className="mt-2 border border-outline bg-[#FCA5A5] p-2 text-xs font-semibold shrink-0 text-on-accent shadow-brutal-sm rounded-xl"
            role="alert"
          >
            ⚠️ {error}
          </p>
        ) : null}

        {signedOut ? (
          <Link
            href="/sign-in?redirect_url=%2Fonboarding"
            className="mt-2 block border border-outline bg-highlight-strong p-2 text-xs font-semibold underline hover:bg-[#FCD34D] shrink-0 text-on-accent shadow-brutal-sm rounded-xl"
          >
            Your session ended. Sign in to resume your saved setup.
          </Link>
        ) : null}

        {/* Main Stage Grid (Form + RPG Adventurer Card) */}
        <form className="mt-2 flex-1 min-h-0 flex flex-col justify-between" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 flex-1 min-h-0 items-stretch">
            {/* Form Stage Panel (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col justify-between min-h-0">
              <div className="flex-1 min-h-0">
                {step === 1 && (
                  <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
                    <GuildRegistryStation
                      displayName={displayName}
                      setDisplayName={setDisplayName}
                      profileIconKey={profileIconKey}
                      setProfileIconKey={setProfileIconKey}
                      classSpec={currentClassSpec}
                      error={error}
                    />
                  </StepPanel>
                )}

                {step === 2 && (
                  <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
                    <TradeLicenseStation
                      businessDescription={businessDescription}
                      setBusinessDescription={setBusinessDescription}
                      onSkip={skipCurrentStep}
                      error={error}
                    />
                  </StepPanel>
                )}

                {step === 3 && (
                  <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
                    <QuarryBountyStation
                      targetCustomer={targetCustomer}
                      setTargetCustomer={setTargetCustomer}
                      onSkip={skipCurrentStep}
                      error={error}
                    />
                  </StepPanel>
                )}

                {step === 4 && (
                  <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
                    <WeaponArmoryStation
                      firstKeyword={firstKeyword}
                      setFirstKeyword={setFirstKeyword}
                      equipPreset={equipPreset}
                      keywordInputRef={keywordInputRef}
                      error={error}
                    />
                  </StepPanel>
                )}

                {step === 5 && (
                  <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
                    <HuntingRealmStation
                      preferredSource={preferredSource}
                      setPreferredSource={setPreferredSource}
                      firstKeyword={firstKeyword}
                    />
                  </StepPanel>
                )}

                {step === 6 && (
                  <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
                    <ContractReviewStation
                      displayName={normalizedDisplayName}
                      selectedIcon={selectedIcon}
                      classSpec={currentClassSpec}
                      businessDescription={normalizedBusinessDescription}
                      targetCustomer={normalizedTargetCustomer}
                      preferredSource={preferredSource}
                      firstKeyword={normalizedFirstKeyword}
                    />
                  </StepPanel>
                )}
              </div>
            </div>

            {/* RPG Hunter Card Sidebar (4 Cols) */}
            <aside className="lg:col-span-4 flex flex-col justify-between shrink-0">
              <div className="border border-outline bg-canvas p-3.5 shadow-brutal h-full flex flex-col justify-between relative rounded-xl">
                <div>
                  <div className="flex items-center justify-between border-b border-outline pb-1.5 mb-2">
                    <p className="text-[11px] font-semibold normal-case text-ink flex items-center gap-1">
                      <ShieldCheck size={14} className="text-ink-muted" /> Adventurer Seal
                    </p>
                    <span className="border border-outline bg-highlight px-1.5 py-0.5 text-[9px] font-semibold normal-case rounded-xl">
                      Profile emblem
                    </span>
                  </div>

                  {/* Character Avatar Box */}
                  <div className="mt-2 flex items-center gap-3 border border-outline bg-card p-2.5 shadow-brutal-sm rounded-xl">
                    <div className="flex h-12 w-12 items-center justify-center border border-outline bg-highlight-strong text-on-accent shrink-0 rounded-xl">
                      {React.createElement(getProfileIconComponent(profileIconKey), { className: 'h-6 w-6 stroke-[2.5]' })}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="break-words font-semibold normal-case truncate text-sm text-ink">
                          {normalizedDisplayName || 'Your Hunter'}
                        </p>
                        <span className="text-[9px] font-mono font-semibold bg-forest text-white px-1 py-0.2">
                          {selectedIcon.code}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-ink-muted">
                        {currentClassSpec.title}
                      </p>
                      <span className="inline-block mt-0.5 rounded bg-amber-100 border border-amber-300 px-1 py-0.2 text-[9px] font-bold text-amber-900 rounded-xl">
                        {currentClassSpec.perk}
                      </span>
                    </div>
                  </div>

                  {/* Character Stats & Equipment */}
                  <dl className="mt-3 space-y-1.5 border-t border-outline pt-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold normal-case text-ink-muted">Trade Domain:</dt>
                      <dd className="font-bold truncate max-w-[130px] text-right text-ink">{normalizedBusinessDescription || 'Skipped'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold normal-case text-ink-muted">Quarry Prey:</dt>
                      <dd className="font-bold truncate max-w-[130px] text-right text-ink">{normalizedTargetCustomer || 'Skipped'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold normal-case text-ink-muted">Equipped Weapon:</dt>
                      <dd className="font-bold truncate max-w-[130px] text-right text-ink">{normalizedFirstKeyword || 'Unarmed'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="font-semibold normal-case text-ink-muted">Hunting Realm:</dt>
                      <dd className="font-bold text-right text-ink">{preferredSource === 'X' ? 'X' : 'Reddit (Locked)'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-3 border-t border-outline pt-2 bg-amber-100/60 p-2 border border-amber-400 text-center rounded-xl">
                  <p className="text-[10px] font-semibold normal-case text-amber-900 flex items-center justify-center gap-1">
                    <Coins size={12} /> Claim Payout: quests on your board
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {/* Action Navigation Footer */}
          <div className="mt-3 pt-2.5 border-t border-outline flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                setError('')
                setStep((current) => Math.max(1, current - 1))
              }}
              disabled={pending || step === 1}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-outline bg-card px-4 py-2 text-sm font-semibold normal-case shadow-brutal-sm disabled:cursor-not-allowed disabled:opacity-50 text-ink rounded-xl"
            >
              <ArrowLeft aria-hidden size={18} /> Back
            </button>

            {step < LAST_ONBOARDING_STEP ? (
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-outline bg-highlight-strong px-5 py-2 text-sm font-semibold normal-case shadow-brutal-sm disabled:cursor-not-allowed disabled:opacity-50 text-on-accent hover:bg-[#FCD34D] rounded-xl"
              >
                Continue <ArrowRight aria-hidden size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={complete}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-outline bg-highlight px-6 py-2.5 text-sm font-semibold normal-case shadow-brutal disabled:cursor-not-allowed disabled:opacity-50 text-on-accent hover:bg-[#86EFAC] rounded-xl"
              >
                <Check aria-hidden size={18} /> Complete setup
              </button>
            )}
          </div>
        </form>
      </main>

      {celebrating ? <QuestCompleteOverlay questsAssigned={questsAssigned} /> : null}
    </div>
  )
}

/* ==========================================================================
   STAGE FORM PANELS
   ========================================================================== */

function GuildRegistryStation({
  displayName,
  setDisplayName,
  profileIconKey,
  setProfileIconKey,
  classSpec,
  error,
}: {
  displayName: string
  setDisplayName: (val: string) => void
  profileIconKey: ProfileIconKey
  setProfileIconKey: (key: ProfileIconKey) => void
  classSpec: { title: string; perk: string; color: string }
  error?: string
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
      <div>
        <label htmlFor="display-name" className="block font-semibold normal-case text-xs text-ink">
          Display name
        </label>

        <input
          id="display-name"
          name="displayName"
          autoComplete="name"
          required
          maxLength={60}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'onboarding-error' : undefined}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-1.5 w-full border border-outline bg-canvas p-2.5 text-sm font-bold text-ink focus-visible:outline-4 focus-visible:outline-offset-2 rounded-xl"
          placeholder="Signal Sage"
        />

        <p className="mt-3 text-xs font-semibold normal-case text-ink flex items-center gap-1">
          <Zap size={14} className="text-amber-500" /> Choose your hunter sigil & class
        </p>

        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROFILE_ICON_OPTIONS.map((option) => {
            const active = option.key === profileIconKey
            const spec = SIGIL_CLASS_SPECS[option.key] ?? SIGIL_CLASS_SPECS.target
            const IconComp = getProfileIconComponent(option.key)

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  sfx.playHoverBlip()
                  setProfileIconKey(option.key)
                }}
                aria-pressed={active}
                className={[
                  'border p-2 text-left transition relative overflow-hidden rounded-xl',
                  active
                    ? 'border-outline bg-highlight shadow-brutal-sm'
                    : 'border-outline bg-card hover:bg-canvas',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <IconComp className="h-5 w-5 stroke-[2.5] text-ink" />
                  <span className="text-[9px] font-mono font-semibold border border-outline px-1 bg-card text-ink rounded-xl">
                    {option.code}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-semibold normal-case truncate text-ink">{option.label}</div>
                <div className="text-[9px] font-bold text-ink-muted truncate">{spec.title}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border border-outline bg-canvas p-3.5 flex flex-col justify-between rounded-xl">
        <div>
          <p className="text-[11px] font-semibold normal-case text-ink-muted">Sigil Class Spec</p>

          <div className="mt-2 flex items-center gap-3 border border-outline bg-card p-2.5 shadow-brutal-sm rounded-xl">
            <div className="flex h-12 w-12 items-center justify-center border border-outline bg-highlight-strong text-on-accent shrink-0 rounded-xl">
              {React.createElement(getProfileIconComponent(profileIconKey), { className: 'h-6 w-6 stroke-[2.5]' })}
            </div>

            <div className="min-w-0">
              <p className="break-words font-semibold normal-case text-sm truncate text-ink">
                {displayName || 'Your hunter'}
              </p>
              <p className="text-xs font-bold text-ink-muted">{classSpec.title}</p>
              <span className="inline-block mt-0.5 rounded bg-emerald-100 border border-emerald-300 px-1 py-0.2 text-[10px] font-semibold text-ink rounded-xl">
                ⚡ {classSpec.perk}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs font-bold text-ink-muted">
          This is your workspace adventurer identity. Richer avatar classes can be unlocked later.
        </p>
      </div>
    </div>
  )
}

function TradeLicenseStation({
  businessDescription,
  setBusinessDescription,
  onSkip,
  error,
}: {
  businessDescription: string
  setBusinessDescription: (val: string) => void
  onSkip: () => void
  error?: string
}) {
  return (
    <div>
      <label htmlFor="business-description" className="block font-semibold normal-case text-xs text-ink">
        Business or product
      </label>

      <textarea
        id="business-description"
        name="businessDescription"
        rows={4}
        maxLength={500}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'onboarding-error' : undefined}
        value={businessDescription}
        onChange={(event) => setBusinessDescription(event.target.value)}
        className="mt-1.5 w-full border border-outline bg-canvas p-2.5 text-sm font-bold text-ink focus-visible:outline-4 focus-visible:outline-offset-2 rounded-xl"
        placeholder="Describe what your business or product does..."
      />

      <button
        type="button"
        onClick={onSkip}
        className="mt-2 text-xs font-semibold normal-case underline underline-offset-4 text-ink"
      >
        Skip for now
      </button>
    </div>
  )
}

function QuarryBountyStation({
  targetCustomer,
  setTargetCustomer,
  onSkip,
  error,
}: {
  targetCustomer: string
  setTargetCustomer: (val: string) => void
  onSkip: () => void
  error?: string
}) {
  return (
    <div>
      <label htmlFor="target-customer" className="block font-semibold normal-case text-xs text-ink">
        Target customer
      </label>

      <textarea
        id="target-customer"
        name="targetCustomer"
        rows={3}
        maxLength={300}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'onboarding-error' : undefined}
        value={targetCustomer}
        onChange={(event) => setTargetCustomer(event.target.value)}
        className="mt-1.5 w-full border border-outline bg-canvas p-2.5 text-sm font-bold text-ink focus-visible:outline-4 focus-visible:outline-offset-2 rounded-xl"
        placeholder="Describe the customer you want to find..."
      />

      <button
        type="button"
        onClick={onSkip}
        className="mt-2 text-xs font-semibold normal-case underline underline-offset-4 text-ink"
      >
        Skip for now
      </button>
    </div>
  )
}

function WeaponArmoryStation({
  firstKeyword,
  setFirstKeyword,
  equipPreset,
  keywordInputRef,
  error,
}: {
  firstKeyword: string
  setFirstKeyword: (val: string) => void
  equipPreset: (preset: (typeof KEYWORD_PRESETS)[number]) => void
  keywordInputRef: RefObject<HTMLInputElement | null>
  error?: string
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold normal-case text-ink">
        <Swords aria-hidden size={16} /> Weapon rack — tap one to equip it
      </p>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {KEYWORD_PRESETS.map((preset) => {
          const equipped = firstKeyword.replace(/\s+/g, ' ').trim() === preset.phrase.trim()
          const rarity = WEAPON_RARITY[preset.id] ?? { label: 'COMMON', bg: 'bg-inset', text: 'text-ink' }
          const PresetIcon = getPresetIconComponent(preset.id)

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => equipPreset(preset)}
              aria-pressed={equipped}
              className={[
                'border border-outline p-2.5 text-left transition relative rounded-xl',
                equipped
                  ? 'bg-highlight shadow-brutal-sm'
                  : 'bg-card hover:bg-canvas',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-semibold normal-case text-ink">
                  <PresetIcon className="h-4 w-4 stroke-[2.5] text-ink shrink-0" />
                  <span className="font-mono text-[10px] bg-forest text-white px-1 font-semibold">{preset.code}</span>
                  <span>{preset.name}</span>
                </p>
                <span className={`text-[9px] font-semibold px-1 py-0.5 rounded border border-outline  rounded-xl ${rarity.bg} ${rarity.text}`}>
                  {rarity.label}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] font-bold text-ink-muted truncate">
                “{preset.phrase.trim()}”
              </p>
              <p className="mt-1 text-[10px] font-bold text-ink-muted">{preset.hint}</p>
            </button>
          )
        })}
      </div>

      <label htmlFor="first-keyword" className="mt-3 block font-semibold normal-case text-xs text-ink">
        Equipped keyword
      </label>

      <input
        id="first-keyword"
        name="firstKeyword"
        ref={keywordInputRef}
        required
        maxLength={80}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'onboarding-error' : undefined}
        value={firstKeyword}
        onChange={(event) => setFirstKeyword(event.target.value)}
        className="mt-1.5 w-full border border-outline bg-canvas p-2.5 text-sm font-bold text-ink focus-visible:outline-4 focus-visible:outline-offset-2 rounded-xl"
        placeholder="looking for a local piano teacher"
      />

      <p className="mt-1.5 text-xs font-bold text-ink-muted">
        Edit it freely — a preset is a starting point, not a lock.
      </p>
    </div>
  )
}

function HuntingRealmStation({
  preferredSource,
  setPreferredSource,
  firstKeyword,
}: {
  preferredSource: PreferredSource
  setPreferredSource: (src: PreferredSource) => void
  firstKeyword?: string
}) {
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    sfx.playRadarBlip()
    const logSequence = [
      `> Connecting to Hunting Grounds (${preferredSource} Live Feed)...`,
      `> Arming weapon matrix for keyword "${firstKeyword || 'target'}...`,
      `> Scanning Rival Guilds & signal noise...`,
      `> Calibrating AI bounty matcher...`,
      `> WORKSPACE ASSETS SUMMONED & READY.`,
    ]

    let currentLog = 0
    const interval = setInterval(() => {
      if (currentLog < logSequence.length) {
        setLogs((prev) => [...prev, logSequence[currentLog]])
        setProgress(Math.round(((currentLog + 1) / logSequence.length) * 100))
        currentLog++
        sfx.playRadarBlip()
      } else {
        clearInterval(interval)
      }
    }, 450)

    return () => clearInterval(interval)
  }, [preferredSource, firstKeyword])

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="font-semibold normal-case text-xs text-ink">Preferred source</legend>

        <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
          <SourceOption
            value="X"
            selected={preferredSource === 'X'}
            onChange={setPreferredSource}
            title="X"
            description="Live source for real-time posts with buying intent."
          />

          <SourceOption
            value="REDDIT"
            selected={false}
            onChange={setPreferredSource}
            title="Reddit"
            description="Broad discovery across subreddits. Not available to select yet."
            badge="Locked"
          />
        </div>
      </fieldset>

      {/* Ritual of Summoning Terminal (Labor Illusion) */}
      <div className="border border-outline bg-forest p-3 font-mono text-xs text-ink-muted shadow-brutal rounded-xl">
        <div className="flex items-center justify-between border-b border-hairline pb-1.5 mb-2 text-[10px] normal-case text-ink-muted font-bold">
          <span>⚡ Ritual of Summoning Terminal</span>
          <span className="text-yellow-400">{progress}% READY</span>
        </div>
        <div className="space-y-1 min-h-[95px]">
          {logs.map((log, i) => (
            <p key={i} className="flex items-center gap-1.5 font-bold">
              <span className="text-yellow-400">✦</span> {log}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContractReviewStation({
  displayName,
  selectedIcon,
  classSpec,
  businessDescription,
  targetCustomer,
  preferredSource,
  firstKeyword,
}: {
  displayName: string
  selectedIcon: (typeof PROFILE_ICON_OPTIONS)[number]
  classSpec: { title: string; perk: string; color: string }
  businessDescription: string
  targetCustomer: string
  preferredSource: PreferredSource
  firstKeyword: string
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold normal-case text-ink-muted">
        Preview — saved setup, not live results
      </p>

      <div className="mb-3 flex items-center gap-3 border border-outline bg-canvas p-2.5 rounded-xl">
        <div className="flex h-10 w-10 items-center justify-center border border-outline bg-card text-ink shrink-0 rounded-xl">
          {React.createElement(getProfileIconComponent(selectedIcon.key), { className: 'h-5 w-5 stroke-[2.5]' })}
        </div>

        <div>
          <p className="text-[10px] font-semibold normal-case text-ink-muted">Hunter Class</p>
          <p className="break-words font-bold text-xs text-ink">{displayName || 'Your hunter'} ({classSpec.title})</p>
        </div>
      </div>

      <dl className="grid gap-2 sm:grid-cols-2 text-xs">
        <ReviewItem label="Sigil" value={`${selectedIcon.code} ${selectedIcon.label} (${classSpec.perk})`} />
        <ReviewItem label="Trade" value={businessDescription || 'Skipped for now'} />
        <ReviewItem label="Quarry" value={targetCustomer || 'Skipped for now'} />
        <ReviewItem
          label="Hunting ground"
          value={preferredSource === 'X' ? 'X' : 'Reddit (locked)'}
        />
        <div className="sm:col-span-2">
          <ReviewItem label="Equipped weapon" value={firstKeyword} />
        </div>
      </dl>

      <div className="mt-3 flex items-start gap-2.5 border border-outline bg-[#ECFCCB] p-2.5 text-xs text-on-accent rounded-xl">
        <ShieldCheck className="mt-0.5 shrink-0" aria-hidden size={16} />
        <p className="font-bold">
          Signing creates your first tracked keyword and turns on your schedule. It does not send messages or post content.
        </p>
      </div>

      <div className="mt-2.5 flex items-start gap-2.5 border border-outline bg-accent p-2.5 text-xs text-on-accent  rounded-xl">
        <Sparkles className="mt-0.5 shrink-0" aria-hidden size={16} />
        <p className="font-bold">
          Claiming this contract puts the active quests on your board and stocks your queue with three tutorial signals.
        </p>
      </div>
    </div>
  )
}

function QuestLog({
  step,
  progress,
  onSelectStep,
}: {
  step: number
  progress: number
  onSelectStep: (step: number) => void
}) {
  return (
    <section aria-label="Quest objectives" className="mt-2.5 border border-outline bg-canvas p-2.5 rounded-xl">
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="font-semibold normal-case text-ink flex items-center gap-1">
          <ScrollText size={14} /> Objective {step} of {LAST_ONBOARDING_STEP}
        </p>
        <p className="font-semibold normal-case text-ink-muted">{progress}% cleared</p>
      </div>

      <div className="mt-1.5 h-3 w-full border border-outline bg-card rounded-xl">
        <div
          className="h-full bg-highlight transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {QUEST_OBJECTIVES.map((objective) => {
          const cleared = objective.step < step
          const active = objective.step === step

          return (
            <li
              key={objective.step}
              aria-current={active ? 'step' : undefined}
              onClick={() => onSelectStep(objective.step)}
              className={[
                'cursor-pointer border border-outline p-1.5 text-center text-[10px] font-semibold normal-case transition rounded-xl',
                cleared ? 'bg-highlight' : active ? 'bg-highlight-strong shadow-brutal-sm' : 'bg-card hover:bg-inset',
              ].join(' ')}
            >
              <span className="block text-xs text-ink">
                {cleared ? <Check aria-hidden className="mx-auto h-3.5 w-3.5" /> : objective.step}
              </span>
              <span className="mt-0.5 block truncate text-ink">{objective.label}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/**
 * Reports what finishing setup actually produced.
 *
 * It used to read "+50 XP AWARDED", which stopped being true when progression
 * moved to `GamifyProfile`: completing onboarding assigns quests, it does not
 * mint XP. XP is now only ever earned from outcomes, and a celebration banner
 * announcing a reward the ledger never issued would put the very first number a
 * new hunter sees permanently out of step with their profile.
 */
function QuestCompleteOverlay({ questsAssigned }: { questsAssigned: number }) {
  useEffect(() => {
    sfx.playLevelUp()
    const timer = setTimeout(() => sfx.playBountyUnlock(), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4"
    >
      <div className="w-full max-w-md border border-outline bg-highlight p-6 text-center shadow-brutal-lg text-on-accent relative overflow-hidden rounded-xl">
        <Trophy className="mx-auto h-16 w-16 stroke-[2.5] text-on-accent animate-bounce mb-2" />
        <span className="inline-block border border-outline bg-forest text-white px-2 py-0.5 text-[10px] font-mono font-semibold normal-case mb-2 rounded-xl">
          [RANK_1_UNLOCKED]
        </span>
        <p className="text-3xl font-semibold normal-case tracking-wider">VICTORY!</p>
        <p className="mt-1 text-xl font-semibold normal-case leading-tight">Quest Complete — Charter Sealed</p>
        <div className="my-3 inline-block border border-outline bg-accent px-4 py-2 font-semibold text-3xl shadow-brutal  rounded-xl">
          {questsAssigned} {questsAssigned === 1 ? 'QUEST IS' : 'QUESTS ARE'} ON YOUR BOARD
        </div>
        <p className="mt-2 font-semibold text-xs normal-case bg-forest text-white p-2 border border-outline rounded-xl">
          ⚡ Summoning Workspace & Seeding Tutorial Signals…
        </p>
      </div>
    </div>
  )
}

function StepPanel({
  objective,
  children,
  focusRef,
}: {
  objective: { step: number; title: string; objective: string; optional?: boolean }
  children: ReactNode
  focusRef?: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <section className="border border-outline bg-card p-3.5 sm:p-4 rounded-xl">
      <p className="text-[11px] font-semibold normal-case text-ink-muted">
        Objective {objective.step}
        {objective.optional ? ' — optional' : ''}
      </p>

      <h2
        ref={focusRef}
        tabIndex={-1}
        className="mt-0.5 text-xl font-semibold normal-case text-ink focus:outline-none"
      >
        {objective.title}
      </h2>

      <p className="mt-1 text-xs font-bold text-ink-muted">{objective.objective}</p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function SourceOption({
  value,
  selected,
  onChange,
  title,
  description,
  badge,
}: {
  value: PreferredSource
  selected: boolean
  onChange: (value: PreferredSource) => void
  title: string
  description: string
  badge?: string
}) {
  const disabled = !isSelectablePreferredSource(value)

  return (
    <label
      className={`block border border-outline p-3  rounded-xl ${
        disabled
          ? 'cursor-not-allowed bg-[#E7E2DA] opacity-70'
          : selected
            ? 'cursor-pointer bg-highlight-strong'
            : 'cursor-pointer bg-canvas'
      }`}
    >
      <input
        type="radio"
        name="preferredSource"
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={() => {
          sfx.playHoverBlip()
          onChange(value)
        }}
        className="sr-only"
      />
      <p className="flex flex-wrap items-center gap-2 text-base font-semibold normal-case text-ink">
        <Search aria-hidden size={16} />
        {title}
        {badge ? (
          <span className="border border-outline bg-[#F7D046] px-1.5 py-0.5 text-[10px] font-semibold normal-case text-on-accent rounded-xl">
            {badge}
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-xs font-bold text-ink-muted">{description}</p>
    </label>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-outline bg-canvas p-2.5 rounded-xl">
      <dt className="text-[10px] font-semibold normal-case text-ink-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-bold text-xs text-ink">{value}</dd>
    </div>
  )
}
