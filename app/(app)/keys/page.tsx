import Link from 'next/link'
import { Ban, KeyRound, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'API Keys Unavailable | CoQuest',
  description: 'CoQuest API credentials are not currently issued.',
}

export default function ApiKeysPage() {
  return (
    <div className="mx-auto min-h-[70vh] max-w-5xl space-y-6 p-4 md:p-8">
      <section className="relative overflow-hidden border-4 border-black bg-white p-7 shadow-[8px_8px_0_0_#000] sm:p-10">
        <KeyRound className="absolute -right-8 -top-8 h-48 w-48 text-[#A855F7] opacity-10" />
        <div className="relative max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 border-2 border-black bg-[#FF5722] px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0_0_#000]">
            <Ban size={15} /> Credential issuance disabled
          </span>
          <h1 className="text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">API key vault unavailable</h1>
          <p className="text-sm font-bold leading-relaxed text-zinc-700 sm:text-base">
            CoQuest does not currently create, store, validate, rotate, or revoke public API keys. No credential shown by an
            older browser-only demo was a working server secret.
          </p>
        </div>
      </section>

      <section className="border-4 border-black bg-[#FFF7AA] p-6 shadow-[6px_6px_0_0_#000]">
        <h2 className="flex items-center gap-2 text-xl font-black uppercase"><ShieldAlert className="text-red-600" /> Do not use demo credentials</h2>
        <p className="mt-3 text-sm font-bold leading-relaxed text-zinc-800">
          Do not paste production secrets here or build integrations against example `cq_live_...` strings. API access will
          stay closed until a tenant-scoped credential service, audited hashes, revocation, permissions, and rate controls exist.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 text-xs font-black uppercase">
        <Link href="/api-terms" className="border-3 border-black bg-[#A855F7] px-5 py-3 text-black shadow-[4px_4px_0_0_#000]">Read API status</Link>
        <Link href="/specs" className="border-3 border-black bg-white px-5 py-3 shadow-[4px_4px_0_0_#000]">Architecture gates</Link>
      </div>
    </div>
  )
}
