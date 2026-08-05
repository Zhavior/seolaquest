'use client'

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition, type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
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
  QUEST_XP_REWARD,
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

export default function OnboardingForm({ initialDraft }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(() => clampOnboardingStep(initialDraft.onboardingStep))
  const [displayName, setDisplayName] = useState(initialDraft.displayName)
  const [profileIconKey, setProfileIconKey] = useState<ProfileIconKey>(
    initialDraft.profileIconKey ?? DEFAULT_PROFILE_ICON_KEY,
  )
  const [businessDescription, setBusinessDescription] = useState(initialDraft.businessDescription)
  const [targetCustomer, setTargetCustomer] = useState(initialDraft.targetCustomer)
  const [firstKeyword, setFirstKeyword] = useState(initialDraft.firstKeyword)
  const [preferredSource, setPreferredSource] = useState<PreferredSource>(() =>
    isSelectablePreferredSource(initialDraft.preferredSource)
      ? (initialDraft.preferredSource as PreferredSource)
      : DEFAULT_PREFERRED_SOURCE,
  )
  const [error, setError] = useState('')
  const [signedOut, setSignedOut] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [celebrating, setCelebrating] = useState(false)
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

  useEffect(() => {
    stepHeadingRef.current?.focus({ preventScroll: true })
  }, [step])

  // The toggle mirrors the shared player preference, so muting here stays muted
  // in the app shell rather than resetting at the end of setup.
  useEffect(() => {
    setSoundOn(sfx.isEnabled())
  }, [])

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
        step,
        value: {
          displayName: normalizedDisplayName,
          profileIconKey,
        },
      }
    }

    if (step === 2) return { step, value: normalizedBusinessDescription }
    if (step === 3) return { step, value: normalizedTargetCustomer }
    if (step === 4) return { step, value: normalizedFirstKeyword }
    if (step === 5) return { step, value: preferredSource }

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

    // A stem like "alternative to " is only half a weapon. Put the caret where
    // the hunter has to keep typing instead of making them find it.
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

      setStep(result.nextStep)
    })
  }

  function complete() {
    setError('')

    startTransition(async () => {
      const result = await completeOnboardingAction()
      if (!result.ok) return handleFailure(result)

      // Celebrate before leaving. The reward is already committed server-side;
      // this only gives the moment somewhere to land instead of a bare redirect.
      sfx.playLevelUp()
      setCelebrating(true)

      const celebration = new URLSearchParams({
        keywordId: result.keyword.id,
        questComplete: 'first-quest',
        xp: String(result.reward.xpAwarded),
        samples: String(result.reward.sampleQuestsSeeded),
      })
      if (result.reward.didLevelUp) celebration.set('levelUp', String(result.reward.level))

      router.push(`/app?${celebration.toString()}`)
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] px-4 py-6 sm:px-6 sm:py-10">
      <header className="mx-auto mb-6 flex w-full max-w-3xl items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-xl font-black uppercase tracking-widest underline-offset-4 hover:underline focus-visible:outline-4 focus-visible:outline-offset-4"
        >
          CoQuest
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="inline-flex min-h-11 items-center gap-2 border-3 border-black bg-white px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0_0_#000] focus-visible:outline-4 focus-visible:outline-offset-4"
          >
            {soundOn ? <Volume2 aria-hidden size={16} /> : <VolumeX aria-hidden size={16} />}
            <span className="hidden sm:inline">{soundOn ? 'Sound on' : 'Sound off'}</span>
          </button>

          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="min-h-11 border-3 border-black bg-white px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0_0_#000] focus-visible:outline-4 focus-visible:outline-offset-4"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 border-3 border-black bg-[#A3E635] px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0_0_#000]">
            <ScrollText aria-hidden size={18} /> Level 1 quest
          </div>

          <div className="inline-flex items-center gap-2 border-3 border-black bg-[#FFE600] px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0_0_#000]">
            <Sparkles aria-hidden size={18} /> Reward +{QUEST_XP_REWARD} XP
          </div>
        </div>

        <h1 className="mt-5 text-3xl font-black uppercase sm:text-4xl">{QUEST_TITLE}</h1>

        <p className="mt-2 max-w-2xl font-bold text-gray-700">
          Six objectives. Each one is saved the moment you clear it, so you can close this page and
          pick the quest back up later.
        </p>

        <QuestLog step={step} progress={questProgress} />

        <form className="mt-6" onSubmit={submit}>
          {error ? (
            <p
              id="onboarding-error"
              className="mb-4 border-3 border-black bg-[#FCA5A5] p-3 font-black"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {signedOut ? (
            <Link
              href="/sign-in?redirect_url=%2Fonboarding"
              className="mb-4 block border-3 border-black bg-[#FDE68A] p-3 font-black underline hover:bg-[#FCD34D]"
            >
              Your session ended. Sign in to resume your saved setup.
            </Link>
          ) : null}

          {step === 1 && (
            <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
              <div className="grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <label htmlFor="display-name" className="block font-black uppercase">
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
                    className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2"
                    placeholder="Signal Sage"
                  />

                  <p className="mt-4 text-xs font-black uppercase">Choose your sigil</p>

                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PROFILE_ICON_OPTIONS.map((option) => {
                      const active = option.key === profileIconKey

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            sfx.playHoverBlip()
                            setProfileIconKey(option.key)
                            setError('')
                          }}
                          aria-pressed={active}
                          className={[
                            'border-3 p-3 text-left transition',
                            active
                              ? 'border-black bg-[#A3E635] shadow-[4px_4px_0_0_#000]'
                              : 'border-black bg-white hover:bg-[#F4F0EA]',
                          ].join(' ')}
                        >
                          <div className="text-3xl">{option.emoji}</div>
                          <div className="mt-2 text-xs font-black uppercase">{option.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-3 border-black bg-[#F4F0EA] p-4">
                  <p className="text-xs font-black uppercase text-gray-600">Hunter card</p>

                  <div className="mt-3 flex items-center gap-3 border-3 border-black bg-white p-3">
                    <div className="flex h-14 w-14 items-center justify-center border-3 border-black bg-[#FDE68A] text-3xl">
                      {selectedIcon.emoji}
                    </div>

                    <div>
                      <p className="break-words font-black uppercase">
                        {normalizedDisplayName || 'Your hunter'}
                      </p>
                      <p className="text-sm font-bold text-gray-600">Level 1 · {selectedIcon.label}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-bold text-gray-700">
                    This is your workspace identity. Richer avatars can be unlocked later.
                  </p>
                </div>
              </div>
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
              <label htmlFor="business-description" className="block font-black uppercase">
                Business or product
              </label>

              <textarea
                id="business-description"
                name="businessDescription"
                rows={5}
                maxLength={500}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'onboarding-error' : undefined}
                value={businessDescription}
                onChange={(event) => setBusinessDescription(event.target.value)}
                className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2"
              />

              <button
                type="button"
                onClick={skipCurrentStep}
                className="mt-3 text-sm font-black uppercase underline underline-offset-4"
              >
                Skip for now
              </button>
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
              <label htmlFor="target-customer" className="block font-black uppercase">
                Target customer
              </label>

              <textarea
                id="target-customer"
                name="targetCustomer"
                rows={4}
                maxLength={300}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'onboarding-error' : undefined}
                value={targetCustomer}
                onChange={(event) => setTargetCustomer(event.target.value)}
                className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2"
              />

              <button
                type="button"
                onClick={skipCurrentStep}
                className="mt-3 text-sm font-black uppercase underline underline-offset-4"
              >
                Skip for now
              </button>
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
              <p className="flex items-center gap-2 text-xs font-black uppercase">
                <Swords aria-hidden size={16} /> Weapon rack — tap one to equip it
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {KEYWORD_PRESETS.map((preset) => {
                  const equipped = normalizedFirstKeyword === preset.phrase.trim()

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => equipPreset(preset)}
                      aria-pressed={equipped}
                      className={[
                        'border-3 border-black p-3 text-left transition',
                        equipped
                          ? 'bg-[#A3E635] shadow-[4px_4px_0_0_#000]'
                          : 'bg-white hover:bg-[#F4F0EA]',
                      ].join(' ')}
                    >
                      <p className="flex items-center gap-2 text-sm font-black uppercase">
                        <span aria-hidden className="text-lg">{preset.emoji}</span>
                        {preset.name}
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-gray-700">
                        “{preset.phrase.trim()}”
                      </p>
                      <p className="mt-2 text-xs font-bold text-gray-600">{preset.hint}</p>
                    </button>
                  )
                })}
              </div>

              <label htmlFor="first-keyword" className="mt-6 block font-black uppercase">
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
                className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2"
                placeholder="looking for a local piano teacher"
              />

              <p className="mt-2 text-sm font-bold text-gray-700">
                Edit it freely — a preset is a starting point, not a lock. One strong phrase beats a
                long sentence.
              </p>
            </StepPanel>
          )}

          {step === 5 && (
            <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
              <fieldset>
                <legend className="font-black uppercase">Preferred source</legend>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
            </StepPanel>
          )}

          {step === 6 && (
            <StepPanel focusRef={stepHeadingRef} objective={currentObjective}>
              <p className="mb-3 text-xs font-black uppercase">
                Preview — saved setup, not live results
              </p>

              <div className="mb-3 flex items-center gap-3 border-3 border-black bg-[#F4F0EA] p-3">
                <div className="flex h-12 w-12 items-center justify-center border-3 border-black bg-white text-2xl">
                  {selectedIcon.emoji}
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-gray-600">Hunter</p>
                  <p className="break-words font-bold">{normalizedDisplayName || 'Your hunter'}</p>
                </div>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <ReviewItem label="Sigil" value={selectedIcon.label} />
                <ReviewItem label="Trade" value={normalizedBusinessDescription || 'Skipped for now'} />
                <ReviewItem label="Quarry" value={normalizedTargetCustomer || 'Skipped for now'} />
                <ReviewItem
                  label="Hunting ground"
                  value={preferredSource === 'X' ? 'X' : 'Reddit (locked)'}
                />
                <div className="sm:col-span-2">
                  <ReviewItem label="Equipped weapon" value={normalizedFirstKeyword} />
                </div>
              </dl>

              <div className="mt-4 flex items-start gap-3 border-3 border-black bg-[#ECFCCB] p-3">
                <ShieldCheck className="mt-0.5 shrink-0" aria-hidden />
                <p className="font-bold">
                  Signing creates your first tracked keyword and turns on your schedule. It does not
                  send messages, post content, or import old leads.
                </p>
              </div>

              <div className="mt-4 flex items-start gap-3 border-3 border-black bg-[#FFE600] p-3">
                <Sparkles className="mt-0.5 shrink-0" aria-hidden />
                <p className="font-bold">
                  Claiming this contract pays +{QUEST_XP_REWARD} XP and stocks your queue with three
                  tutorial signals to practise on.
                </p>
              </div>
            </StepPanel>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setError('')
                setStep((current) => Math.max(1, current - 1))
              }}
              disabled={pending || step === 1}
              className="inline-flex min-h-11 items-center justify-center gap-2 border-3 border-black bg-white px-4 py-2 font-black uppercase shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft aria-hidden size={18} /> Back
            </button>

            {step < LAST_ONBOARDING_STEP ? (
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 border-3 border-black bg-[#FDE68A] px-4 py-2 font-black uppercase shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue <ArrowRight aria-hidden size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={complete}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 border-3 border-black bg-[#A3E635] px-4 py-2 font-black uppercase shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check aria-hidden size={18} /> Complete setup
              </button>
            )}
          </div>
        </form>
      </main>

      {celebrating ? <QuestCompleteOverlay /> : null}
    </div>
  )
}

/**
 * The objective rail. Cleared objectives stay visible so progress reads as
 * ground taken rather than a bar that merely moves.
 */
function QuestLog({ step, progress }: { step: number; progress: number }) {
  return (
    <section aria-label="Quest objectives" className="mt-6 border-3 border-black bg-[#F4F0EA] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase">
          Objective {step} of {LAST_ONBOARDING_STEP}
        </p>
        <p className="text-xs font-black uppercase text-gray-600">{progress}% cleared</p>
      </div>

      <div className="mt-2 h-4 w-full border-3 border-black bg-white">
        <div
          className="h-full bg-[#A3E635] transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {QUEST_OBJECTIVES.map((objective) => {
          const cleared = objective.step < step
          const active = objective.step === step

          return (
            <li
              key={objective.step}
              aria-current={active ? 'step' : undefined}
              className={[
                'border-3 border-black p-2 text-center text-[10px] font-black uppercase',
                cleared ? 'bg-[#A3E635]' : active ? 'bg-[#FDE68A] shadow-[3px_3px_0_0_#000]' : 'bg-white',
              ].join(' ')}
            >
              <span className="block text-sm">
                {cleared ? <Check aria-hidden className="mx-auto h-4 w-4" /> : objective.step}
              </span>
              <span className="mt-1 block truncate">{objective.label}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function QuestCompleteOverlay() {
  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
    >
      <div className="w-full max-w-md border-4 border-black bg-[#A3E635] p-6 text-center shadow-[10px_10px_0_0_#000]">
        <Sparkles aria-hidden className="mx-auto h-10 w-10 animate-pulse" strokeWidth={3} />
        <p className="mt-3 text-2xl font-black uppercase leading-tight">Quest complete</p>
        <p className="mt-2 text-4xl font-black">+{QUEST_XP_REWARD} XP</p>
        <p className="mt-3 font-bold text-black/80">Arming your first hunt…</p>
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
  focusRef: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <section className="border-3 border-black bg-white p-4 sm:p-5">
      <p className="text-xs font-black uppercase text-gray-600">
        Objective {objective.step}
        {objective.optional ? ' — optional' : ''}
      </p>

      <h2
        ref={focusRef}
        tabIndex={-1}
        className="mt-1 text-2xl font-black uppercase focus:outline-none"
      >
        {objective.title}
      </h2>

      <p className="mt-2 max-w-2xl font-bold text-gray-700">{objective.objective}</p>
      <div className="mt-5">{children}</div>
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
      className={`block border-3 border-black p-4 ${
        disabled
          ? 'cursor-not-allowed bg-[#E7E2DA] opacity-70'
          : selected
            ? 'cursor-pointer bg-[#FDE68A]'
            : 'cursor-pointer bg-[#F4F0EA]'
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
      <p className="flex flex-wrap items-center gap-2 text-lg font-black uppercase">
        <Search aria-hidden size={18} />
        {title}
        {badge ? (
          <span className="border-2 border-black bg-[#F7D046] px-2 py-0.5 text-xs font-black uppercase">
            {badge}
          </span>
        ) : null}
      </p>
      <p className="mt-2 font-bold text-gray-700">{description}</p>
    </label>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black bg-[#F4F0EA] p-3">
      <dt className="text-xs font-black uppercase text-gray-600">{label}</dt>
      <dd className="mt-1 break-words font-bold">{value}</dd>
    </div>
  )
}
