'use client'

import type { ReactNode } from 'react'

export default function Workspace({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="flex-1 overflow-auto bg-[#F4EFE6] p-6">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 grid gap-6 md:grid-cols-3">

          <section className="border-[3px] border-black bg-[#FFF8D6] p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="text-xs font-black uppercase tracking-widest">
              Realm Status
            </div>

            <div className="mt-3 text-3xl font-black">
              Healthy
            </div>

            <div className="mt-2 text-sm">
              +18% this week
            </div>
          </section>

          <section className="border-[3px] border-black bg-[#FFF8D6] p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="text-xs font-black uppercase tracking-widest">
              AI Guild
            </div>

            <div className="mt-3 text-3xl font-black">
              4 Active
            </div>

            <div className="mt-2 text-sm">
              2 queued
            </div>
          </section>

          <section className="border-[3px] border-black bg-[#FFF8D6] p-5 shadow-[6px_6px_0px_0px_#000]">
            <div className="text-xs font-black uppercase tracking-widest">
              Treasury
            </div>

            <div className="mt-3 text-3xl font-black">
              $2,941
            </div>

            <div className="mt-2 text-sm">
              Stripe Connected
            </div>
          </section>

        </div>

        {children}

      </div>
    </main>
  )
}
