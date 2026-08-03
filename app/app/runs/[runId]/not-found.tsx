import Link from 'next/link'

export default function ScanRunNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F4F0EA] p-6">
      <section className="max-w-xl border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Scan run not found</p>
        <h1 className="mt-3 text-3xl font-black uppercase">This scan run is not available in your account.</h1>
        <p className="mt-4 font-bold text-zinc-700">
          It may have been removed, the ID may be invalid, or the link may belong to a different account.
        </p>
        <Link
          href="/app/runs"
          className="mt-6 inline-flex border-4 border-black bg-[#FFE600] px-5 py-3 font-black uppercase shadow-[4px_4px_0_0_#000]"
        >
          View my scan runs
        </Link>
      </section>
    </div>
  )
}
