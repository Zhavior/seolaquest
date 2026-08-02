'use client'

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition, type ReactNode, type RefObject } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { ArrowLeft, ArrowRight, Check, Search, ShieldCheck, Sparkles } from 'lucide-react'
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
import {
  clampOnboardingStep,
  type OnboardingDraft,
  type PreferredSource,
  type SaveOnboardingStepInput,
} from '@/features/auth/onboarding'

const steps = [
  'Identity',
  'Business',
  'Customer',
  'Keyword',
  'Source',
  'Review',
] as const

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
  const [preferredSource, setPreferredSource] = useState<PreferredSource>(
    initialDraft.preferredSource ?? 'REDDIT',
  )
  const [error, setError] = useState('')
  const [signedOut, setSignedOut] = useState(false)
  const [pending, startTransition] = useTransition()
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)

  const normalizedDisplayName = displayName.replace(/\s+/g, ' ').trim()
  const normalizedBusinessDescription = businessDescription.replace(/\s+/g, ' ').trim()
  const normalizedTargetCustomer = targetCustomer.replace(/\s+/g, ' ').trim()
  const normalizedFirstKeyword = firstKeyword.replace(/\s+/g, ' ').trim()

  const selectedIcon = useMemo(
    () => PROFILE_ICON_OPTIONS.find((option) => option.key === profileIconKey) ?? PROFILE_ICON_OPTIONS[0],
    [profileIconKey],
  )

  useEffect(() => {
    stepHeadingRef.current?.focus({ preventScroll: true })
  }, [step])

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
      if (preferredSource !== 'REDDIT' && preferredSource !== 'X') {
        return 'Choose a preferred source before continuing.'
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

    if (step === 2) {
      return {
        step,
        value: normalizedBusinessDescription,
      }
    }

    if (step === 3) {
      return {
        step,
        value: normalizedTargetCustomer,
      }
    }

    if (step === 4) {
      return {
        step,
        value: normalizedFirstKeyword,
      }
    }

    if (step === 5) {
      return {
        step,
        value: preferredSource,
      }
    }

    return null
  }

  function handleFailure(result: { code: string; message: string }) {
    setError(result.message)
    setSignedOut(result.code === 'SIGNED_OUT')

    if (result.code === 'ALREADY_COMPLETE') {
      router.replace('/app')
      router.refresh()
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationMessage = validateCurrentStep()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    const input = currentInput()
    if (!input) return

    startTransition(async () => {
      const result = await saveOnboardingStepAction(input)
      if (!result.ok) return handleFailure(result)
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

      router.push(`/app?keywordId=${encodeURIComponent(result.keyword.id)}`)
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-[#F4F0EA] px-4 py-6 sm:px-6 sm:py-10">
      <header className="mx-auto mb-6 flex w-full max-w-3xl items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-xl font-black uppercase tracking-widest underline-offset-4 hover:underline focus-visible:outline-4 focus-visible:outline-offset-4"
        >
          CoQuest
        </Link>

        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="min-h-11 border-3 border-black bg-white px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0_0_#000] focus-visible:outline-4 focus-visible:outline-offset-4"
          >
            Sign out
          </button>
        </SignOutButton>
      </header>

      <main className="mx-auto w-full max-w-3xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000] sm:p-8">
        <div className="inline-flex items-center gap-2 border-3 border-black bg-[#A3E635] px-3 py-2 text-sm font-black uppercase">
          <Sparkles aria-hidden="true" size={18} /> First-value setup
        </div>

        <h1 className="mt-5 text-3xl font-black uppercase sm:text-4xl">
          Set up your first real hunt
        </h1>

        <p className="mt-2 max-w-2xl font-bold text-gray-700">
          Each completed step is saved to your account. You can close this page and resume later.
        </p>

        <ol aria-label="Onboarding progress" className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {steps.map((label, index) => {
            const number = index + 1
            const active = number === step
            const completed = number < step

            return (
              <li
                key={label}
                className={[
                  'border-3 p-2 text-center text-xs font-black uppercase',
                  completed
                    ? 'border-black bg-[#A3E635]'
                    : active
                      ? 'border-black bg-[#FDE68A]'
                      : 'border-black bg-[#F4F0EA]',
                ].join(' ')}
              >
                <span className="block">{number}</span>
                <span className="block truncate">{label}</span>
              </li>
            )
          })}
        </ol>

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
            <p className="mb-4 border-3 border-black bg-[#FDE68A] p-3 font-black">
              Your session ended. Sign back in to keep going.
            </p>
          ) : null}

          {step === 1 && (
            <StepPanel
              focusRef={stepHeadingRef}
              title="Choose your hunter identity"
              description="Pick a name and flat icon for your private workspace profile."
            >
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

                  <p className="mt-4 text-xs font-black uppercase">Choose an icon</p>

                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PROFILE_ICON_OPTIONS.map((option) => {
                      const active = option.key === profileIconKey

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
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
                  <p className="text-xs font-black uppercase text-gray-600">Preview</p>

                  <div className="mt-3 flex items-center gap-3 border-3 border-black bg-white p-3">
                    <div className="flex h-14 w-14 items-center justify-center border-3 border-black bg-[#FDE68A] text-3xl">
                      {selectedIcon.emoji}
                    </div>

                    <div>
                      <p className="break-words font-black uppercase">
                        {normalizedDisplayName || 'Your hunter'}
                      </p>
                      <p className="text-sm font-bold text-gray-600">{selectedIcon.label}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-bold text-gray-700">
                    This is just your current placeholder identity. We can upgrade it into richer avatars later.
                  </p>
                </div>
              </div>
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel
              focusRef={stepHeadingRef}
              title="What do you sell or help with?"
              description="Keep it plain. One short paragraph is enough to personalize the hunt."
            >
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
            <StepPanel
              focusRef={stepHeadingRef}
              title="Who are you trying to find?"
              description="Describe the ideal customer so the first keyword is more useful."
            >
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
            <StepPanel
              focusRef={stepHeadingRef}
              title="What should the first hunt search for?"
              description="Use a short phrase you would expect real customers to mention."
            >
              <label htmlFor="first-keyword" className="block font-black uppercase">
                First keyword
              </label>

              <input
                id="first-keyword"
                name="firstKeyword"
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
                A single strong keyword works better than a long sentence.
              </p>
            </StepPanel>
          )}

          {step === 5 && (
            <StepPanel
              focusRef={stepHeadingRef}
              title="Where should CoQuest start looking?"
              description="This only sets the starting source. You can add more providers later."
            >
              <fieldset>
                <legend className="font-black uppercase">Preferred source</legend>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SourceOption
                    value="REDDIT"
                    selected={preferredSource === 'REDDIT'}
                    onChange={setPreferredSource}
                    title="Reddit"
                    description="Best default for broad discovery and intent-rich posts."
                  />

                  <SourceOption
                    value="X"
                    selected={preferredSource === 'X'}
                    onChange={setPreferredSource}
                    title="X"
                    description="Requires configured X provider access. Selection alone does not enable it."
                  />
                </div>
              </fieldset>
            </StepPanel>
          )}

          {step === 6 && (
            <StepPanel
              focusRef={stepHeadingRef}
              title="Review before saving"
              description="Your setup is persisted. Completing it creates the keyword; it does not run a scan."
            >
              <p className="mb-3 text-xs font-black uppercase">
                Preview — saved setup, not live results
              </p>

              <div className="mb-3 flex items-center gap-3 border-3 border-black bg-[#F4F0EA] p-3">
                <div className="flex h-12 w-12 items-center justify-center border-3 border-black bg-white text-2xl">
                  {selectedIcon.emoji}
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-gray-600">Identity</p>
                  <p className="break-words font-bold">{normalizedDisplayName || 'Your hunter'}</p>
                </div>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <ReviewItem label="Icon" value={selectedIcon.label} />
                <ReviewItem label="Business" value={normalizedBusinessDescription || 'Skipped for now'} />
                <ReviewItem label="Target customer" value={normalizedTargetCustomer || 'Skipped for now'} />
                <ReviewItem
                  label="Preferred source"
                  value={preferredSource === 'X' ? 'X (configuration required)' : 'Reddit'}
                />
                <div className="sm:col-span-2">
                  <ReviewItem label="First keyword" value={normalizedFirstKeyword} />
                </div>
              </dl>

              <div className="mt-4 flex items-start gap-3 border-3 border-black bg-[#ECFCCB] p-3">
                <ShieldCheck className="mt-0.5 shrink-0" aria-hidden="true" />
                <p className="font-bold">
                  Completing setup creates your first tracked keyword and turns on your schedule. It does not send messages, post content, or import old leads.
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
              <ArrowLeft aria-hidden="true" size={18} /> Back
            </button>

            {step < 6 ? (
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 border-3 border-black bg-[#FDE68A] px-4 py-2 font-black uppercase shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue <ArrowRight aria-hidden="true" size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={complete}
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 border-3 border-black bg-[#A3E635] px-4 py-2 font-black uppercase shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check aria-hidden="true" size={18} /> Complete setup
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}

function StepPanel({
  title,
  description,
  children,
  focusRef,
}: {
  title: string
  description: string
  children: ReactNode
  focusRef: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <section className="border-3 border-black bg-white p-4 sm:p-5">
      <h2 ref={focusRef} tabIndex={-1} className="text-2xl font-black uppercase focus:outline-none">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl font-bold text-gray-700">{description}</p>
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
}: {
  value: PreferredSource
  selected: boolean
  onChange: (value: PreferredSource) => void
  title: string
  description: string
}) {
  return (
    <label className={`block cursor-pointer border-3 p-4 ${selected ? 'border-black bg-[#FDE68A]' : 'border-black bg-[#F4F0EA]'}`}>
      <input
        type="radio"
        name="preferredSource"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <p className="flex items-center gap-2 text-lg font-black uppercase">
        <Search aria-hidden="true" size={18} />
        {title}
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
