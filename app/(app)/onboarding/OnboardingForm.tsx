'use client'

import { FormEvent, useEffect, useRef, useState, useTransition, type RefObject } from 'react'
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
  clampOnboardingStep,
  type OnboardingDraft,
  type PreferredSource,
  type SaveOnboardingStepInput,
} from '@/features/auth/onboarding'

const steps = [
  'Display name',
  'Business',
  'Customer',
  'Keyword',
  'Source',
  'Review',
]

type Props = {
  initialDraft: OnboardingDraft
}

export default function OnboardingForm({ initialDraft }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(() => clampOnboardingStep(initialDraft.onboardingStep))
  const [displayName, setDisplayName] = useState(initialDraft.displayName)
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

  useEffect(() => {
    stepHeadingRef.current?.focus({ preventScroll: true })
  }, [step])

  function currentInput(): SaveOnboardingStepInput | null {
    if (step === 1) return { step, value: displayName }
    if (step === 2) return { step, value: businessDescription }
    if (step === 3) return { step, value: targetCustomer }
    if (step === 4) return { step, value: firstKeyword }
    if (step === 5) return { step, value: preferredSource }
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
    const input = currentInput()
    if (!input) return

    startTransition(async () => {
      const result = await saveOnboardingStepAction(input)
      if (!result.ok) return handleFailure(result)
      setStep(Math.min(6, input.step + 1))
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
      setStep(skippedStep + 1)
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
        <Link href="/" className="inline-flex min-h-11 items-center text-xl font-black uppercase tracking-widest underline-offset-4 hover:underline focus-visible:outline-4 focus-visible:outline-offset-4">
          CoQuest
        </Link>
        <SignOutButton redirectUrl="/">
          <button type="button" className="min-h-11 border-3 border-black bg-white px-3 py-2 text-sm font-black uppercase shadow-[3px_3px_0_0_#000] focus-visible:outline-4 focus-visible:outline-offset-4">
            Sign out
          </button>
        </SignOutButton>
      </header>

      <main className="mx-auto w-full max-w-3xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000] sm:p-8">
        <div className="inline-flex items-center gap-2 border-3 border-black bg-[#A3E635] px-3 py-2 text-sm font-black uppercase">
          <Sparkles aria-hidden="true" size={18} /> First-value setup
        </div>
        <h1 className="mt-5 text-3xl font-black uppercase sm:text-4xl">Set up your first real hunt</h1>
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
                aria-current={active ? 'step' : undefined}
                className={`border-2 border-black px-2 py-2 text-center text-[11px] font-black uppercase ${active ? 'bg-[#FFE600]' : completed ? 'bg-[#A3E635]' : 'bg-gray-100'}`}
              >
                <span className="block text-base" aria-hidden="true">{completed ? '✓' : number}</span>
                {label}
              </li>
            )
          })}
        </ol>

        <form onSubmit={submit} className="mt-8">
          {step === 1 && (
            <StepPanel focusRef={stepHeadingRef} title="What should we call you?" description="This name appears in your private CoQuest workspace.">
              <label htmlFor="display-name" className="block font-black uppercase">Display name</label>
              <input id="display-name" name="displayName" autoComplete="name" required maxLength={60} aria-invalid={Boolean(error)} aria-describedby={error ? 'onboarding-error' : undefined} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2" />
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel focusRef={stepHeadingRef} title="What do you sell or build?" description="A short description helps keep future searches relevant. You can skip this safely and add it later.">
              <label htmlFor="business-description" className="block font-black uppercase">Business or product description</label>
              <textarea id="business-description" name="businessDescription" required maxLength={500} rows={5} aria-invalid={Boolean(error)} aria-describedby={error ? 'onboarding-error' : undefined} value={businessDescription} onChange={(event) => setBusinessDescription(event.target.value)} placeholder="Example: We build accessible websites for local service businesses." className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2" />
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel focusRef={stepHeadingRef} title="Who is the target customer?" description="Describe the person or company whose public request would be useful to review. You can skip this safely and add it later.">
              <label htmlFor="target-customer" className="block font-black uppercase">Target customer</label>
              <textarea id="target-customer" name="targetCustomer" required maxLength={300} rows={4} aria-invalid={Boolean(error)} aria-describedby={error ? 'onboarding-error' : undefined} value={targetCustomer} onChange={(event) => setTargetCustomer(event.target.value)} placeholder="Example: A Halifax contractor who needs a new website." className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2" />
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel focusRef={stepHeadingRef} title="Choose the first keyword or phrase" description="Use words a real customer might write publicly when they need help.">
              <label htmlFor="first-keyword" className="block font-black uppercase">First keyword or phrase</label>
              <input id="first-keyword" name="firstKeyword" required minLength={3} maxLength={80} aria-invalid={Boolean(error)} aria-describedby={error ? 'onboarding-error' : undefined} value={firstKeyword} onChange={(event) => setFirstKeyword(event.target.value)} placeholder="need a website" className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2" />
              <div className="mt-4 border-2 border-dashed border-black bg-[#E0F2FE] p-3">
                <p className="text-xs font-black uppercase">Preview — setup only, not live results</p>
                <p className="mt-1 font-bold">CoQuest will save “{firstKeyword.trim() || 'your keyword'}” to your account.</p>
              </div>
            </StepPanel>
          )}

          {step === 5 && (
            <StepPanel focusRef={stepHeadingRef} title="Choose preferred source coverage" description="This records your preference. It does not activate monitoring or guarantee provider availability.">
              <fieldset>
                <legend className="font-black uppercase">Preferred source</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SourceOption value="REDDIT" selected={preferredSource === 'REDDIT'} onChange={setPreferredSource} title="Reddit" description="Available only when the Reddit scan provider and worker are configured." />
                  <SourceOption value="X" selected={preferredSource === 'X'} onChange={setPreferredSource} title="X" description="Requires configured X provider access. Selection alone does not enable it." />
                </div>
              </fieldset>
            </StepPanel>
          )}

          {step === 6 && (
            <StepPanel focusRef={stepHeadingRef} title="Review before saving" description="Your setup is persisted. Completing it creates the keyword; it does not run a scan.">
              <p className="mb-3 text-xs font-black uppercase">Preview — saved setup, not live results</p>
              <dl className="grid gap-3 sm:grid-cols-2">
                <ReviewItem label="Display name" value={displayName} />
                <ReviewItem label="Business" value={businessDescription || 'Skipped for now'} />
                <ReviewItem label="Target customer" value={targetCustomer || 'Skipped for now'} />
                <ReviewItem label="Preferred source" value={preferredSource === 'X' ? 'X (configuration required)' : 'Reddit'} />
                <div className="sm:col-span-2"><ReviewItem label="First keyword" value={firstKeyword} /></div>
              </dl>

              <section aria-labelledby="scan-cost-heading" className="mt-5 border-3 border-black bg-[#FFE600] p-4">
                <h2 id="scan-cost-heading" className="flex items-center gap-2 text-lg font-black uppercase"><ShieldCheck aria-hidden="true" /> Scan cost and next action</h2>
                <p className="mt-2 font-bold">Saving this setup costs 0 scan credits and starts no scan.</p>
                <p className="mt-1 font-bold">A manual scan costs 1 scan credit and requires active paid access plus an available credit. Your next action is to review the saved keyword in the dashboard; you choose if and when to scan.</p>
              </section>

              <button type="button" onClick={complete} disabled={pending} className="mt-6 flex w-full items-center justify-center gap-2 border-3 border-black bg-[#A3E635] p-4 font-black uppercase shadow-[4px_4px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4">
                <Check aria-hidden="true" /> {pending ? 'Creating keyword…' : 'Create keyword and open dashboard'}
              </button>
            </StepPanel>
          )}

          {error && <p id="onboarding-error" role="alert" className="mt-5 border-3 border-black bg-[#FFB4A2] p-3 font-bold">{error}</p>}
          {signedOut && <Link href="/sign-in?redirect_url=%2Fonboarding" className="mt-3 inline-flex min-h-11 items-center font-black underline decoration-2 underline-offset-4 focus-visible:outline-4">Sign in to resume</Link>}

          {step < 6 && (
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => { setError(''); setStep((current) => Math.max(1, current - 1)) }} disabled={pending || step === 1} className="inline-flex min-h-11 items-center gap-2 border-3 border-black bg-white px-4 py-2 font-black uppercase disabled:invisible focus-visible:outline-4 focus-visible:outline-offset-4">
                <ArrowLeft aria-hidden="true" /> Back
              </button>
              <div className="flex flex-wrap justify-end gap-3">
                {(step === 2 || step === 3) && (
                  <button type="button" onClick={skipCurrentStep} disabled={pending} className="min-h-11 px-3 py-2 font-black uppercase underline decoration-2 underline-offset-4 focus-visible:outline-4">Skip for now</button>
                )}
                <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center gap-2 border-3 border-black bg-[#FFE600] px-5 py-2 font-black uppercase shadow-[3px_3px_0_0_#000] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4">
                  {pending ? 'Saving…' : 'Save and continue'} <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </form>

        <p aria-live="polite" className="sr-only">{pending ? `Saving step ${step} of 6` : `Step ${step} of 6`}</p>
      </main>
    </div>
  )
}

function StepPanel({ focusRef, title, description, children }: { focusRef: RefObject<HTMLHeadingElement | null>; title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 ref={focusRef} tabIndex={-1} className="text-2xl font-black uppercase focus-visible:outline-4 focus-visible:outline-offset-4">{title}</h2>
      <p className="mt-2 font-bold text-gray-700">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function SourceOption({ value, selected, onChange, title, description }: { value: PreferredSource; selected: boolean; onChange: (value: PreferredSource) => void; title: string; description: string }) {
  return (
    <label className={`cursor-pointer border-3 border-black p-4 shadow-[3px_3px_0_0_#000] focus-within:outline-4 focus-within:outline-offset-4 ${selected ? 'bg-[#A3E635]' : 'bg-white'}`}>
      <span className="flex items-center gap-3 font-black uppercase"><input type="radio" name="preferredSource" value={value} checked={selected} onChange={() => onChange(value)} className="h-5 w-5 accent-black" /> <Search aria-hidden="true" size={20} /> {title}</span>
      <span className="mt-2 block text-sm font-bold text-gray-700">{description}</span>
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
