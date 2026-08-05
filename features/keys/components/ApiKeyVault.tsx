import { KeyRound, ShieldAlert } from 'lucide-react'

export default function ApiKeyVault() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 p-4 md:p-8">
      <section className="border-4 border-outline bg-accent p-8 shadow-brutal-lg">
        <div className="flex items-center gap-3">
          <KeyRound className="h-9 w-9" />
          <h1 className="text-4xl font-black uppercase">API key vault unavailable</h1>
        </div>
        <p className="mt-5 max-w-2xl text-lg font-bold">
          CoQuest does not currently create, store, validate, rotate, or revoke public API credentials.
        </p>
      </section>

      <section className="border-4 border-outline bg-card p-6 shadow-brutal-lg">
        <h2 className="flex items-center gap-2 text-xl font-black uppercase">
          <ShieldAlert className="h-6 w-6 text-[#FF5722]" /> Fail-closed status
        </h2>
        <p className="mt-3 font-bold text-ink-muted">
          This screen intentionally exposes no generated tokens, sample secrets, quotas, paid slots, or working API examples.
          A durable hashed-credential system and documented authorization boundary must ship before this feature can be enabled.
        </p>
      </section>
    </main>
  )
}
