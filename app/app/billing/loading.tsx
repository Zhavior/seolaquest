export default function BillingLoading() {
  return (
    <div className="min-h-[50vh] bg-[#F4F0EA] p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 h-6 w-40 animate-pulse border-4 border-black bg-[#FFE600]" />
        <div className="mb-8 h-14 w-full animate-pulse border-4 border-black bg-white" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-48 animate-pulse border-4 border-black bg-white" />
          <div className="h-48 animate-pulse border-4 border-black bg-white" />
          <div className="h-48 animate-pulse border-4 border-black bg-white" />
        </div>
      </div>
    </div>
  )
}
