// components/layout/AppLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scroll,
  Swords,
  Shield,
  Radio,
  BookOpen,
  Store,
  Settings,
  User,
  Zap,
  LogOut,
  Volume2,
  VolumeX,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';

import LogOutButton from '@/components/auth/LogOutButton';
import { useTheme } from '@/components/theme/ThemeProvider';
import { THEME_META, type Theme } from '@/components/theme/theme-config';
import { sfx } from '@/lib/sfx';

export interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    level?: number;
    mp?: number;
    maxMp?: number;
    planTier?: string;
  };
}

interface NavSection {
  title: string;
  items: {
    label: string;
    path: string;
    altPath?: string;
    icon: LucideIcon;
    color: string;
    badge?: string;
    hotkey?: string;
  }[];
}

/** Sidebar-only theme switcher — three labelled swatch buttons under System & Vault. */
function SidebarThemePicker() {
  const { theme, setTheme } = useTheme()

  const meta: { key: Theme; label: string; bg: string; ring: string; textClass: string }[] = [
    {
      key: 'parchment',
      label: 'LIGHT',
      bg: '#E8E0D0',
      ring: '#B0A090',
      textClass: 'text-[#4A3F2F]',
    },
    {
      key: 'grey',
      label: 'GREY',
      bg: '#2D3340',
      ring: '#4A5260',
      textClass: 'text-[#C8D0DC]',
    },
    {
      key: 'blue',
      label: 'BLUE',
      bg: '#0F1E45',
      ring: '#2A4080',
      textClass: 'text-[#7EB8F0]',
    },
  ]

  return (
    <div className="mt-4 border-t-2 border-outline pt-4">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-muted mb-2 px-0.5 flex items-center gap-1.5">
        <Sparkles className="size-2.5 text-ink-muted" />
        Interface Theme
      </p>
      <div
        role="radiogroup"
        aria-label="Interface theme"
        className="grid grid-cols-3 gap-1.5"
      >
        {meta.map(({ key, label, bg, ring, textClass }) => {
          const active = theme === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={THEME_META[key].label}
              title={THEME_META[key].label}
              onClick={() => {
                if (key !== theme) {
                  setTheme(key)
                  sfx.playSidebarCollapse()
                }
              }}
              className={clsx(
                'relative flex flex-col items-center gap-1.5 py-2 px-1 border-2 font-black text-[9px] uppercase tracking-widest leading-none transition-all duration-150',
                'active:translate-y-[1px]',
                active
                  ? 'shadow-brutal-sm -translate-y-0.5'
                  : 'opacity-60 hover:opacity-90 hover:-translate-y-0.5',
              )}
              style={{
                backgroundColor: bg,
                borderColor: active ? ring : 'rgba(0,0,0,0.35)',
                outline: active ? `2px solid ${ring}` : 'none',
                outlineOffset: '1px',
              }}
            >
              {/* colour swatch pill */}
              <span
                className="block w-full h-3 rounded-sm border border-black/20"
                style={{ backgroundColor: bg, filter: 'brightness(0.85) saturate(1.1)' }}
              />
              <span className={clsx('leading-none', textClass)}>{label}</span>
              {active && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-accent border border-outline" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AppLayout({ children, user }: AppLayoutProps) {

  const pathname = usePathname();
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const saved = localStorage.getItem('coquest_sidebar_collapsed')
      return saved === 'true'
    } catch {
      return false
    }
  });

  // Toggle collapse state with persistence and audio feedback
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (next) {
        sfx.playSidebarCollapse();
      } else {
        sfx.playSidebarExpand();
      }
      try {
        localStorage.setItem('coquest_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcut listener (Cmd+B or Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const userName = user?.name || "REINALD";
  const userLevel = user?.level || 10;
  const currentMp = user?.mp ?? 70;
  const maxMp = user?.maxMp ?? 100;

  const navSections: NavSection[] = [
    {
      title: "TACTICAL COMMAND",
      items: [
        { label: "LIVING HQ", path: "/dashboard", altPath: "/app", icon: LayoutDashboard, color: "bg-success", hotkey: "B" },
        { label: "QUEST BOARD", path: "/signals", altPath: "/app/runs", icon: Scroll, color: "bg-accent", badge: "12", hotkey: "S" },
        { label: "QUEST LOG", path: "/keywords", altPath: "/app/keywords", icon: Swords, color: "bg-accent-2 text-white", badge: "0/3", hotkey: "Q" },
      ],
    },
    {
      title: "GUILD & OPERATIONS",
      items: [
        { label: "GUILD HALL", path: "/guild", altPath: "/app/guild", icon: Shield, color: "bg-info text-white", hotkey: "G" },
        { label: "CAMPAIGN BROADCAST", path: "/deliveries", altPath: "/app/deliveries", icon: Radio, color: "bg-[#38BDF8]", hotkey: "C" },
      ],
    },
    {
      title: "SYSTEM & VAULT",
      items: [
        { label: "KNOWLEDGE LORE", path: "/profile", altPath: "/app/profile", icon: BookOpen, color: "bg-[#FB7185]", hotkey: "L" },
        { label: "BAZAAR & SUPPLIES", path: "/billing", altPath: "/app/billing", icon: Store, color: "bg-[#F59E0B]", hotkey: "M" },
        { label: "ARMORY SETTINGS", path: "/settings", altPath: "/app/settings", icon: Settings, color: "bg-[#A855F7] text-white", hotkey: "K" },
      ],
    },
  ];

  const allNavItems = navSections.flatMap((s) => s.items);

  return (
    <div className="h-dvh bg-surface text-ink flex flex-col font-black relative select-none selection:bg-accent selection:text-on-accent overflow-hidden overscroll-none">
      
      {/* Authentic Parchment / Commander's Paper Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      {/* TOP HUD */}
      <header className="sticky top-0 inset-x-0 z-50 w-full border-b-4 border-outline bg-card shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between px-3 sm:px-4 h-14 pt-safe">

        {/* LEFT: sidebar toggle + brand + user */}
        <div className="flex items-center gap-2">

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="grid size-10 shrink-0 place-items-center border-2 border-outline bg-accent shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none md:hidden"
          >
            <Menu className="size-4 text-on-accent" strokeWidth={3} />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand Sidebar (Cmd+B)' : 'Collapse Sidebar (Cmd+B)'}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="hidden md:grid size-10 shrink-0 place-items-center border-2 border-outline bg-card shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 text-ink" strokeWidth={3} />
            ) : (
              <PanelLeftClose className="size-4 text-ink" strokeWidth={3} />
            )}
          </button>

          {/* Brand wordmark */}
          <Link
            href="/dashboard"
            className="font-black text-base sm:text-lg tracking-[0.14em] uppercase border-2 border-outline bg-accent px-3 py-1.5 h-10 flex items-center shadow-brutal-sm hover:bg-highlight-strong hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
          >
            SEOLAQUEST
          </Link>

          {/* User identity chip — sm+ */}
          <div className="hidden sm:flex items-center gap-2 border-2 border-outline bg-card px-2.5 h-10 shadow-brutal-sm">
            <div className="grid size-5 place-items-center border-2 border-outline bg-accent">
              <User className="size-3 shrink-0 text-on-accent" strokeWidth={3} />
            </div>
            <span className="font-black text-[11px] uppercase tracking-wider text-ink">{userName}</span>
            <span className="bg-black text-[#FFE600] text-[9px] font-black px-1.5 py-0.5 tracking-widest uppercase border border-outline">
              LVL {userLevel}
            </span>
          </div>
        </div>

        {/* RIGHT: compact stat pills + actions */}
        <div className="flex shrink-0 items-center gap-1.5">

          {/* Quest count */}
          <Link
            href="/app/runs"
            title="Active Quests"
            className="hidden sm:flex items-center gap-1.5 border-2 border-outline bg-accent-2 text-white px-2.5 h-10 text-[11px] font-black uppercase tracking-wider shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
          >
            <Scroll className="size-3.5 shrink-0" strokeWidth={3} />
            <span>12 QUESTS</span>
          </Link>

          {/* MP pill */}
          <div className="hidden sm:flex items-center gap-1.5 border-2 border-outline bg-card px-2.5 h-10 text-[11px] font-black uppercase tracking-wider shadow-brutal-sm">
            <Zap className="size-3.5 shrink-0 text-[#06B6D4] animate-pulse" strokeWidth={3} />
            <span className="text-ink">{currentMp}<span className="text-ink-muted">/{maxMp}</span> MP</span>
          </div>

          {/* Mobile: combined badge */}
          <Link
            href="/app/runs"
            className="flex sm:hidden items-center gap-1 border-2 border-outline bg-accent-2 text-white px-2 h-10 text-[10px] font-black uppercase shadow-brutal-sm"
          >
            <Scroll className="size-3.5" strokeWidth={3} />
            <span>12</span>
          </Link>

          {/* Thin divider — desktop */}
          <div className="hidden sm:block w-px h-6 bg-outline mx-0.5" />

          {/* SFX toggle */}
          <button
            type="button"
            onClick={() => setSfxEnabled((v) => !v)}
            aria-label={sfxEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            className="grid size-10 shrink-0 place-items-center border-2 border-outline bg-card shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
          >
            {sfxEnabled ? (
              <Volume2 className="size-4 text-ink" strokeWidth={3} />
            ) : (
              <VolumeX className="size-4 text-ink-muted" strokeWidth={3} />
            )}
          </button>

          {/* Recharge CTA */}
          <Link
            href="/billing?offer=founder"
            className="flex shrink-0 items-center gap-1.5 border-2 border-outline bg-accent-2 px-3 h-10 font-black uppercase tracking-wider text-white text-[11px] shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
          >
            <Zap className="size-3.5 shrink-0" strokeWidth={3} />
            <span className="hidden sm:inline">RECHARGE</span>
            <span className="sm:hidden">+</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        
        {/* DESKTOP SMART COLLAPSIBLE SIDEBAR */}
        <aside
          aria-label="Sidebar navigation"
          role="navigation"
          className={`border-r-4 border-outline bg-card p-4 hidden md:flex flex-col justify-between shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] h-full overflow-y-auto shrink-0 transition-[width,padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            collapsed ? "w-20 px-2" : "w-72 px-4"
          }`}
        >
          {collapsed ? (
            /* COLLAPSED RAIL MODE */
            <div className="flex flex-col items-center justify-between h-full space-y-4">
              <div className="space-y-3 w-full flex flex-col items-center">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  title="Expand Sidebar (Cmd+B)"
                  aria-label="Expand navigation"
                  className="grid size-10 place-items-center border-3 border-outline bg-accent shadow-brutal-sm hover:-translate-y-0.5 transition-all mb-2"
                >
                  <PanelLeftOpen className="size-5 text-on-accent" strokeWidth={3} />
                </button>

                <div className="w-full h-0.5 bg-black/20 my-1" />

                {allNavItems.map((item) => {
                  const isActive =
                    pathname === item.path ||
                    pathname === item.altPath ||
                    (pathname?.startsWith(item.path) && item.path !== "/") ||
                    (item.altPath && pathname?.startsWith(item.altPath) && item.altPath !== "/app");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onMouseEnter={() => sfx.playSidebarHover()}
                      onFocus={() => sfx.playSidebarHover()}
                      onClick={() => sfx.playCoinDrop()}
                      title={`${item.label} (${item.hotkey || ''})`}
                      className={`relative group grid size-11 place-items-center border-3 border-outline transition-all ${
                        isActive
                          ? `${item.color} shadow-brutal -translate-x-0.5 -translate-y-0.5`
                          : "bg-card hover:bg-canvas hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5"
                      }`}
                    >
                      <Icon className="size-5 text-on-accent" strokeWidth={3} />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 bg-accent-2 text-white text-[8px] font-black border border-outline px-1 rounded-full">
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip on Hover */}
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-black text-[#FFE600] border-2 border-white text-xs font-black uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-brutal">
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Collapsed Icon Actions */}
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="grid size-10 place-items-center border-2 border-outline bg-success shadow-brutal-sm" title="3/3 Party Agents Active">
                  <span className="h-2.5 w-2.5 rounded-full bg-black border border-white animate-pulse" />
                </div>

                <LogOutButton
                  title="Log Out"
                  aria-label="Log out"
                  onMouseEnter={() => sfx.playSidebarHover()}
                  onBeforeSignOut={() => sfx.playCoinDrop()}
                  className="grid size-11 place-items-center border-3 border-outline bg-accent-2 text-white shadow-brutal-sm hover:-translate-y-0.5 transition-all"
                >
                  <LogOut className="size-5" strokeWidth={3} />
                </LogOutButton>
              </div>
            </div>
          ) : (
            /* FULL EXPANDED MODE */
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b-3 border-outline pb-2.5 mb-1">
                  <span className="text-xs font-black text-ink uppercase tracking-[0.2em]">
                    Command Compass
                  </span>
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    onMouseEnter={() => sfx.playSidebarHover()}
                    onFocus={() => sfx.playSidebarHover()}
                    title="Collapse Sidebar (Cmd+B)"
                    aria-label="Collapse navigation"
                    className="text-[9px] font-black uppercase bg-accent text-on-accent border-2 border-outline px-1.5 py-0.5 shadow-brutal-sm -rotate-2 hover:bg-highlight-strong"
                  >
                    ONLINE ⚔️
                  </button>
                </div>

                {navSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <div className="text-[10px] font-black text-ink-muted uppercase tracking-[0.18em] px-1 flex items-center gap-1.5">
                      <Sparkles className="size-3 text-ink" />
                      <span>{section.title}</span>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const isActive =
                          pathname === item.path ||
                          pathname === item.altPath ||
                          (pathname?.startsWith(item.path) && item.path !== "/") ||
                          (item.altPath && pathname?.startsWith(item.altPath) && item.altPath !== "/app");
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            onMouseEnter={() => sfx.playSidebarHover()}
                            onFocus={() => sfx.playSidebarHover()}
                            onClick={() => sfx.playCoinDrop()}
                            className={`flex items-center justify-between p-3 border-3 border-outline font-black text-xs uppercase tracking-wider transition-all ${
                              isActive
                                ? `${item.color} shadow-brutal -translate-x-0.5 -translate-y-0.5`
                                : "bg-card hover:bg-canvas hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="size-4 shrink-0" strokeWidth={3} />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.badge && (
                                <span className="bg-accent-2 text-white text-[9px] font-black border-2 border-outline px-1.5 py-0.5 shadow-brutal-sm">
                                  {item.badge}
                                </span>
                              )}
                              {item.hotkey && !item.badge && (
                                <span className="font-mono text-[9px] font-black text-ink bg-inset border border-outline px-1 py-0.2">
                                  {item.hotkey}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── INTERFACE THEME SWITCHER ── */}
              <SidebarThemePicker />

              {/* Bottom Sidebar Mini-Party Status Card & Log Out */}
              <div className="mt-5 space-y-3 pt-2">
                <div className="border-3 border-outline bg-success p-3.5 shadow-brutal relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5 tracking-wider">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-black border border-white animate-pulse" />
                      <span>Party Status</span>
                    </div>
                    <span className="text-on-accent bg-accent border-2 border-outline px-1.5 text-[9px] font-black uppercase -rotate-1">
                      3/3 Active
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-ink leading-snug">
                    Scouts currently patrolling r/SaaS and Twitter streams.
                  </div>
                </div>

                <LogOutButton
                  className="w-full flex items-center justify-between p-3 border-3 border-outline font-black text-xs uppercase tracking-wider bg-accent-2 text-white shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="size-4 shrink-0" strokeWidth={3} />
                    <span>LOG OUT</span>
                  </div>
                  <span className="font-mono text-[9px] font-black text-on-accent bg-accent border border-outline px-1.5">
                    ESC
                  </span>
                </LogOutButton>
              </div>
            </div>
          )}
        </aside>

        {/* MOBILE SLIDE-IN OVERLAY DRAWER */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            <aside
              aria-label="Mobile navigation"
              role="navigation"
              className="absolute inset-y-0 left-0 h-dvh w-[88vw] max-w-[320px] border-r-4 border-outline bg-card shadow-[10px_0_0_rgba(0,0,0,0.3)] p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-250"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b-3 border-outline pb-2.5 mb-2">
                  <span className="font-black text-xs uppercase tracking-widest">Navigation</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                    className="grid size-8 place-items-center border-2 border-outline bg-accent shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <X className="size-4 text-on-accent" strokeWidth={3} />
                  </button>
                </div>

                {navSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <div className="text-[10px] font-black text-ink-muted uppercase tracking-[0.18em] px-1 flex items-center gap-1.5">
                      <Sparkles className="size-3 text-ink" />
                      <span>{section.title}</span>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const isActive =
                          pathname === item.path ||
                          pathname === item.altPath ||
                          (pathname?.startsWith(item.path) && item.path !== "/") ||
                          (item.altPath && pathname?.startsWith(item.altPath) && item.altPath !== "/app");
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center justify-between p-3 border-3 border-outline font-black text-xs uppercase tracking-wider transition-all ${
                              isActive
                                ? `${item.color} shadow-brutal -translate-x-0.5 -translate-y-0.5`
                                : "bg-card hover:bg-canvas hover:shadow-brutal-sm"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="size-4 shrink-0" strokeWidth={3} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="bg-accent-2 text-white text-[9px] font-black border-2 border-outline px-1.5 py-0.5">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 pt-2">
                <LogOutButton
                  onBeforeSignOut={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-between p-3 border-3 border-outline font-black text-xs uppercase tracking-wider bg-accent-2 text-white shadow-brutal active:translate-x-0 active:translate-y-0 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="size-4 shrink-0" strokeWidth={3} />
                    <span>LOG OUT</span>
                  </div>
                </LogOutButton>
              </div>
            </aside>
          </div>
        )}

        {/* PAGE CONTENT CONTAINER */}
        <main className="w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-contain flex-1 min-h-0 min-w-0 p-3 sm:p-4 md:p-8 pb-24 md:pb-8 box-border">
          {children}
        </main>

        {/* STICKY MOBILE QUICK-NAV BAR (< md) */}
        <nav
          aria-label="Mobile quick navigation"
          className="fixed bottom-0 inset-x-0 w-full max-w-full z-50 bg-card border-t-4 border-outline px-2 py-1 shadow-[0_-4px_0_0_rgba(0,0,0,1)] flex items-center justify-around md:hidden pb-safe"
        >
          <Link
            href="/dashboard"
            onClick={() => sfx.playCoinDrop()}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[56px] px-2 py-1 font-black text-[9px] uppercase tracking-wider transition-colors ${
              pathname === "/dashboard" || pathname === "/app" ? "text-on-accent bg-accent border-2 border-outline -rotate-1 shadow-brutal-sm" : "text-ink-muted hover:text-on-accent"
            }`}
          >
            <LayoutDashboard className="size-4 shrink-0" strokeWidth={3} />
            <span>HQ</span>
          </Link>

          <Link
            href="/signals"
            onClick={() => sfx.playCoinDrop()}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[56px] px-2 py-1 font-black text-[9px] uppercase tracking-wider transition-colors ${
              pathname === "/signals" || pathname === "/app/runs" ? "text-on-accent bg-accent border-2 border-outline -rotate-1 shadow-brutal-sm" : "text-ink-muted hover:text-on-accent"
            }`}
          >
            <Scroll className="size-4 shrink-0" strokeWidth={3} />
            <span>QUESTS</span>
          </Link>

          <Link
            href="/guild"
            onClick={() => sfx.playCoinDrop()}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[56px] px-2 py-1 font-black text-[9px] uppercase tracking-wider transition-colors ${
              pathname === "/guild" || pathname === "/app/guild" ? "text-on-accent bg-accent border-2 border-outline -rotate-1 shadow-brutal-sm" : "text-ink-muted hover:text-on-accent"
            }`}
          >
            <Shield className="size-4 shrink-0" strokeWidth={3} />
            <span>GUILD</span>
          </Link>

          <Link
            href="/settings"
            onClick={() => sfx.playCoinDrop()}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[56px] px-2 py-1 font-black text-[9px] uppercase tracking-wider transition-colors ${
              pathname === "/settings" || pathname === "/app/settings" ? "text-on-accent bg-accent border-2 border-outline -rotate-1 shadow-brutal-sm" : "text-ink-muted hover:text-on-accent"
            }`}
          >
            <Settings className="size-4 shrink-0" strokeWidth={3} />
            <span>ARMORY</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open full menu"
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[56px] px-2 py-1 font-black text-[9px] uppercase tracking-wider text-ink-muted hover:text-ink"
          >
            <Menu className="size-4 shrink-0 text-ink" strokeWidth={3} />
            <span>MENU</span>
          </button>
        </nav>

      </div>
    </div>
  );
}

export default AppLayout;
