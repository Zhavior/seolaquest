import Link from 'next/link'

export default function DeliveryNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas p-6">
      <section className="max-w-xl border-4 border-outline bg-card p-8 shadow-brutal-lg">
        <p className="text-xs font-black uppercase tracking-widest text-ink-muted">Delivery not found</p>
        <h1 className="mt-3 text-3xl font-black uppercase">This delivery is not available in your account.</h1>
        <p className="mt-4 font-bold text-ink-muted">
          It may have been removed, or the link may belong to a different account.
        </p>
        <Link
          href="/app/deliveries"
          className="mt-6 inline-flex border-4 border-outline bg-accent px-5 py-3 font-black uppercase shadow-brutal"
        >
          View my deliveries
        </Link>
      </section>
    </div>
  )
}
