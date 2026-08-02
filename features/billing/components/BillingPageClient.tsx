'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  Gauge,
  LifeBuoy,
  ReceiptText,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'

import { createBillingPortalAction, createCheckoutAction } from '@/features/billing/actions'
import type { BillingReadyViewModel, BillingViewModel } from '@/features/billing/viewModel'
import type { PlanCode } from '@/src/modules/billing/domain/catalog'
import { PlanGrid } from './PlanGrid'

const statusStyles: Record<BillingReadyViewModel['status'], string> = {
  free: 'bg-white',
  paid: 'bg-[#A3E635]',
  past_due: 'bg-amber-300',
  cancelled: 'bg-zinc-300',
  misconfigured: 'bg-red-200',
}

function VerificationPanel({ model }: { model: Exclude<BillingViewModel, BillingReadyViewModel> }) {
  return (
    <div className="min-h-[100dvh] min-w-0 break-words bg-[#FDFBF7] p-3 text-black sm:p-5 md:p-10">
      <section aria-live="polite" className="mx-auto min-w-0 max-w-4xl border-4 border-black bg-white p-4 shadow-[8px_8px_0_0_#000] sm:p-7 md:p-10">
        <div className="inline-flex max-w-full min-w-0 items-center gap-2 border-3 border-black bg-[#06B6D4] px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0_0_#000]">
          {model.status === 'loading' ? <RefreshCw aria-hidden className="h-4 w-4 animate-spin" /> : <AlertTriangle aria-hidden className="h-4 w-4" />}
          {model.status === 'loading' ? 'Server verification in progress' : 'Server verification unavailable'}
        </div>
        <h1 className="mt-6 text-4xl font-black uppercase leading-none md:text-6xl">{model.title}</h1>
        <p className="mt-4 max-w-2xl text-base font-bold text-zinc-700">{model.message}</p>
        {model.status === 'unavailable' && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 min-h-12 border-4 border-black bg-[#FFE600] px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0_0_#000]"
          >
            Retry verification
          </button>
        )}
      </section>
    </div>
  )
}

function AvailabilityCard({
  icon: Icon,
  title,
  availability,
}: {
  icon: typeof CreditCard
  title: string
  availability: BillingReadyViewModel['availability']['payment']
}) {
  const available = availability.state === 'available'
  return (
    <article className="border-3 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <div className="flex items-center gap-2">
        <Icon aria-hidden className="h-5 w-5" />
        <h3 className="font-black uppercase">{title}</h3>
      </div>
      <p className={`mt-3 inline-flex border-2 border-black px-2 py-1 text-xs font-black uppercase ${available ? 'bg-[#A3E635]' : 'bg-zinc-200'}`}>
        {availability.label}
      </p>
      <p className="mt-3 text-sm font-bold text-zinc-700">{availability.reason}</p>
    </article>
  )
}

export function BillingPageClient({ model }: { model: BillingViewModel }) {
  const [purchasingPlan, setPurchasingPlan] = useState<PlanCode | null>(null)
  const [message, setMessage] = useState('Billing state is server-verified.')
  const [openingPortal, setOpeningPortal] = useState(false)

  if (model.status === 'loading' || model.status === 'unavailable') {
    return <VerificationPanel model={model} />
  }

  const selectPlan = async (plan: PlanCode) => {
    if (model.availability.checkout.state !== 'available') {
      setMessage(`${model.availability.checkout.label}. No charge was made.`)
      return
    }
    setPurchasingPlan(plan)
    setMessage('Requesting a secure Stripe Checkout URL…')
    try {
      const result = await createCheckoutAction(plan)
      if (result.ok && result.url) {
        window.location.assign(result.url)
        return
      }
      setMessage(result.message ?? 'Checkout is unavailable. No charge was made.')
    } catch {
      setMessage('Checkout could not be started. No charge was made.')
    }
    setPurchasingPlan(null)
  }

  const openPortal = async () => {
    if (model.availability.portal.state !== 'available') {
      setMessage(model.availability.portal.reason)
      return
    }
    setOpeningPortal(true)
    setMessage('Requesting Stripe billing management…')
    try {
      const result = await createBillingPortalAction()
      if (result.ok && result.url) {
        window.location.assign(result.url)
        return
      }
      setMessage(result.message ?? 'Billing management is unavailable.')
    } catch {
      setMessage('Billing management could not be opened.')
    }
    setOpeningPortal(false)
  }

  const returnStyle = model.checkoutReturn.state === 'verified'
    ? 'bg-[#A3E635]'
    : model.checkoutReturn.state === 'cancelled'
      ? 'bg-zinc-200'
      : 'bg-amber-200'

  return (
    <div className="min-h-[100dvh] min-w-0 break-words bg-[#FDFBF7] text-black">
      <div className="mx-auto min-w-0 max-w-[1400px] p-3 pb-16 sm:p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-4 border-black bg-black p-3 text-white shadow-[5px_5px_0_0_#06B6D4]">
          <p aria-live="polite" className="flex min-w-0 flex-1 items-center gap-2 text-sm font-black uppercase">
            <ShieldCheck aria-hidden className="h-5 w-5 shrink-0 text-[#A3E635]" />
            {message}
          </p>
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={model.availability.portal.state !== 'available' || openingPortal}
            className="min-h-11 w-full border-3 border-white bg-[#FFE600] px-4 py-2 text-xs font-black uppercase text-black disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:w-auto"
          >
            {openingPortal ? 'Opening Stripe…' : 'Manage billing'}
          </button>
        </div>

        {model.checkoutReturn.state !== 'none' && (
          <section role="status" className={`mt-6 min-w-0 border-4 border-black p-4 shadow-[6px_6px_0_0_#000] sm:p-5 ${returnStyle}`}>
            <h2 className="text-xl font-black uppercase">{model.checkoutReturn.title}</h2>
            <p className="mt-2 font-bold">{model.checkoutReturn.message}</p>
          </section>
        )}

        <header className={`mt-8 min-w-0 border-4 border-black p-4 shadow-[8px_8px_0_0_#000] sm:p-6 md:p-9 ${statusStyles[model.status]}`}>
          <p className="text-xs font-black uppercase tracking-widest">Server-owned billing state</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-black uppercase leading-none md:text-7xl">{model.subscription.statusLabel}</h1>
              <p className="mt-4 text-lg font-black">{model.subscription.planName} · {model.subscription.providerStatus}</p>
              <p className="mt-2 max-w-3xl font-bold text-zinc-700">{model.subscription.renewalLabel}</p>
            </div>
            <div className="min-w-0 border-4 border-black bg-white p-4 shadow-[5px_5px_0_0_#000] sm:p-5">
              <p className="text-xs font-black uppercase text-zinc-600">Current scan credits</p>
              <p className="mt-1 text-5xl font-black">{model.credits.balance.toLocaleString()}</p>
              <p className="mt-1 text-xs font-bold text-zinc-600">Highest recorded balance: {model.credits.highestRecordedBalance.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <section aria-labelledby="scan-cost-heading" className="mt-10 min-w-0 border-4 border-black bg-[#FFE600] p-4 shadow-[8px_8px_0_0_#000] sm:p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <Gauge aria-hidden className="h-8 w-8 shrink-0" />
                <h2 id="scan-cost-heading" className="text-2xl font-black uppercase sm:text-3xl md:text-4xl">Know the scan cost first</h2>
              </div>
              <p className="mt-4 font-bold">{model.credits.explanation}</p>
              <p className="mt-3 text-sm font-bold text-zinc-700">{model.credits.refundExplanation}</p>
              <p className="mt-3 text-sm font-bold text-zinc-700">A source match is not proof of purchase intent or a qualified customer.</p>
            </div>
            <div className="w-full min-w-0 border-4 border-black bg-white p-4 shadow-[5px_5px_0_0_#000] sm:p-5 lg:w-auto lg:min-w-[260px]">
              <p className="text-xs font-black uppercase text-zinc-600">Estimated next manual scan</p>
              <p className="mt-2 text-3xl font-black">-{model.credits.estimatedScanCost} credit</p>
              <p className="mt-1 text-sm font-bold">Estimated balance after: {model.credits.estimatedBalanceAfterScan}</p>
              <div className={`mt-4 border-3 border-black p-3 ${model.scan.eligible ? 'bg-[#A3E635]' : 'bg-zinc-200'}`}>
                <p className="font-black uppercase">{model.scan.label}</p>
                <p className="mt-1 text-xs font-bold">{model.scan.reason}</p>
              </div>
              <Link
                href="/app"
                aria-disabled={!model.scan.eligible}
                className={`mt-4 flex min-h-12 items-center justify-center gap-2 border-4 border-black px-4 py-3 text-sm font-black uppercase shadow-[4px_4px_0_0_#000] ${model.scan.eligible ? 'bg-[#FF5722] text-white' : 'pointer-events-none bg-zinc-300 text-zinc-600 shadow-none'}`}
              >
                <Search aria-hidden className="h-4 w-4" /> Review scan action
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="availability-heading" className="mt-12">
          <h2 id="availability-heading" className="text-2xl font-black uppercase sm:text-3xl md:text-4xl">Current availability</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <AvailabilityCard icon={CircleDollarSign} title="Payments" availability={model.availability.payment} />
            <AvailabilityCard icon={CreditCard} title="Checkout" availability={model.availability.checkout} />
            <AvailabilityCard icon={ServerCog} title="Scan worker" availability={model.availability.worker} />
            <AvailabilityCard icon={WalletCards} title="Credit top-ups" availability={model.availability.creditTopUps} />
          </div>
        </section>

        <PlanGrid
          plans={model.catalog}
          currentPlan={model.subscription.plan}
          purchasingPlan={purchasingPlan}
          checkoutAvailability={model.availability.checkout}
          onSelectPlan={(plan) => void selectPlan(plan)}
        />

        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          <article className="min-w-0 border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000] sm:p-6">
            <div className="flex items-center gap-2"><Clock3 aria-hidden className="h-6 w-6" /><h2 className="text-xl font-black uppercase">Currency, tax, renewal</h2></div>
            <p className="mt-4 text-sm font-bold">All catalog prices are shown in {model.currency.code} ({model.currency.label}). {model.currency.checkoutDisclosure}</p>
            <p className="mt-3 text-sm font-bold">{model.subscription.renewalLabel}</p>
          </article>
          <article className="min-w-0 border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000] sm:p-6">
            <div className="flex items-center gap-2"><ReceiptText aria-hidden className="h-6 w-6" /><h2 className="text-xl font-black uppercase">Invoices and receipts</h2></div>
            <p className="mt-4 text-sm font-bold">{model.support.receiptCopy}</p>
          </article>
          <article className="min-w-0 border-4 border-black bg-white p-4 shadow-[6px_6px_0_0_#000] sm:p-6">
            <div className="flex items-center gap-2"><LifeBuoy aria-hidden className="h-6 w-6" /><h2 className="text-xl font-black uppercase">Support and refunds</h2></div>
            <p className="mt-4 text-sm font-bold">{model.support.refundCopy}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a className="inline-flex items-center gap-2 border-3 border-black bg-[#06B6D4] px-4 py-2 text-sm font-black uppercase" href={`mailto:${model.support.email}?subject=CoQuest%20billing%20support`}>
                Email support <ExternalLink aria-hidden className="h-4 w-4" />
              </a>
              <Link className="inline-flex items-center gap-2 border-3 border-black bg-white px-4 py-2 text-sm font-black uppercase" href="/terms#billing-terms">
                Billing terms <CheckCircle2 aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </section>

        <p className="mt-8 text-center text-xs font-bold text-zinc-500">
          Server billing snapshot checked {new Date(model.checkedAt).toLocaleString()}.
        </p>
      </div>
    </div>
  )
}
