import { KeyRound } from 'lucide-react'

export default function ApiKeysPage() {
  return <div className="min-h-screen max-w-4xl mx-auto p-4 md:p-8"><section className="border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]"><h1 className="flex items-center gap-3 text-3xl font-black uppercase"><KeyRound /> API access</h1><p className="mt-5 font-bold text-gray-700">API keys are not available in this version of HypeQuest. No keys have been created, displayed, or stored for your account.</p><div className="mt-6 border-3 border-black bg-[#F4F0EA] p-4 font-bold">The next safe step is to define the external API, scopes, rate limits, key hashing, and revocation flow before exposing this page.</div></section></div>
}
