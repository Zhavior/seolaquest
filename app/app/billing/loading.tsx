export default function BillingLoading() {
  return (
    <div className="p-10 max-w-6xl mx-auto space-y-8">

      {/* Page title shimmer */}
      <div className="h-7 w-48 animate-pulse rounded-xl bg-black/10" />

      {/* Top banner shimmer */}
      <div className="h-24 w-full animate-pulse rounded-2xl bg-black/10" />

      {/* 3 plan cards shimmer */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-2xl bg-black/10" />
        <div className="h-56 animate-pulse rounded-2xl bg-black/[0.15]" />
        <div className="h-56 animate-pulse rounded-2xl bg-black/10" />
      </div>

      {/* Bottom detail shimmer */}
      <div className="h-32 w-full animate-pulse rounded-2xl bg-black/10" />

    </div>
  )
}
