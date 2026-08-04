'use client'

interface SidebarHeaderProps {
  collapsed: boolean
  title: string
  subtitle: string
  onToggleCollapse: () => void
}

export function SidebarHeader({
  collapsed,
  title,
  subtitle,
  onToggleCollapse,
}: SidebarHeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-gradient-to-b from-[#FFF7E6] to-[#F7E6B5] px-5 py-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black tracking-tight">
            {collapsed ? 'CQ' : title}
          </h1>

          {!collapsed && (
            <p className="mt-1 text-xs font-semibold text-stone-600">
              {subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-xl border border-stone-300 bg-white p-2 transition hover:bg-stone-100"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
    </header>
  )
}
