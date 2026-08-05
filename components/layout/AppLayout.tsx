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

  // Toggle collapse state with persistence
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
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
  const planTier = user?.planTier || "LEGEND";

  const navSections: NavSection[] = [
    {
      title: "TACTICAL COMMAND",
      items: [
        { label: "LIVING HQ", path: "/dashboard", altPath: "/app", icon: LayoutDashboard, color: "bg-[#A3E635]", hotkey: "B" },
        { label: "QUEST BOARD", path: "/signals", altPath: "/app/runs", icon: Scroll, color: "bg-[#FFE600]", badge: "12", hotkey: "S" },
        { label: "QUEST LOG", path: "/keywords", altPath: "/app/keywords", icon: Swords, color: "bg-[#FF5722] text-white", badge: "0/3", hotkey: "Q" },
      ],
    },
    {
      title: "GUILD & OPERATIONS",
      items: [
        { label: "GUILD HALL", path: "/guild", altPath: "/app/guild", icon: Shield, color: "bg-[#06B6D4] text-white", hotkey: "G" },
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
    <div className="min-h-screen bg-[#FDFBF7] text-black flex flex-col font-black relative select-none selection:bg-[#FFE600] selection:text-black">
      
      {/* Authentic Parchment / Commander's Paper Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      {/* 1. TOP UNIVERSAL HUD */}
      <header className="w-full border-b-4 border-black bg-white px-4 py-2.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-50 flex items-center justify-between relative">
        
        {/* Left: Brand, Toggle & Adventurer Identity */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="grid size-9 shrink-0 place-items-center border-3 border-black bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none md:hidden"
          >
            <Menu className="size-5 text-black" strokeWidth={3} />
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand Sidebar (Cmd+B)" : "Collapse Sidebar (Cmd+B)"}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="hidden md:grid size-9 shrink-0 place-items-center border-3 border-black bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 text-black" strokeWidth={3} />
            ) : (
              <PanelLeftClose className="size-5 text-black" strokeWidth={3} />
            )}
          </button>

          <Link
            href="/dashboard"
            className="font-black text-xl md:text-2xl tracking-[0.16em] uppercase border-3 border-black bg-[#FFE600] px-3.5 py-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD600] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1.5"
          >
            <span>COQUEST</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2.5 border-3 border-black bg-white px-3 py-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="grid size-6 place-items-center border-2 border-black bg-[#FFE600]">
              <User className="size-3.5 shrink-0 text-black" strokeWidth={3} />
            </div>
            <span className="font-black text-xs uppercase tracking-wider text-black">{userName}</span>
            <span className="bg-black text-[#FFE600] text-[10px] font-black px-2 py-0.5 tracking-widest uppercase border border-black -rotate-1">
              LVL {userLevel}
            </span>
          </div>
        </div>

        {/* Center: Mana Vault Indicators */}
        <div className="flex items-center gap-3.5 border-3 border-black bg-black text-white px-4 py-1.5 shadow-[4px_4px_0px_0px_#06B6D4]">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-[#06B6D4] animate-pulse" strokeWidth={3} />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-300 hidden md:inline">
              Mana Vault:
            </span>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }).map((_, i) => {
              const activeCount = Math.round((currentMp / maxMp) * 10);
              const isActive = i < activeCount;
              return (
                <span
                  key={i}
                  className={`inline-block h-4 w-2.5 border border-white transition-all ${
                    isActive
                      ? "bg-gradient-to-t from-cyan-500 to-[#A3E635] shadow-[0_0_8px_#06B6D4]"
                      : "bg-slate-800 opacity-40"
                  }`}
                />
              );
            })}
          </div>

          <span className="font-mono text-xs font-black border-l-2 border-dashed border-[#06B6D4] pl-3 text-[#FFE600] tracking-wider">
            {currentMp}/{maxMp} MP
          </span>
          <span className="hidden lg:inline-block bg-[#FFE600] text-black border border-black px-2 py-0.5 text-[9px] font-black tracking-widest uppercase -rotate-1">
            {planTier}
          </span>
        </div>

        {/* Right: Quick Recharge Action & SFX Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSfxEnabled((v) => !v)}
            className="hidden xl:flex items-center gap-1.5 bg-black text-[#FFE600] border-2 border-white px-2.5 py-1 text-[10px] uppercase font-black shadow-[2px_2px_0_0_#fff] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#fff] active:translate-y-0.5 active:shadow-none transition-all"
          >
            {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            SFX {sfxEnabled ? 'ON' : 'OFF'}
          </button>

          <div className="hidden lg:flex items-center gap-2 border-2 border-black bg-[#A3E635] px-3 py-1 text-xs font-black tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1">
            <span className="h-2.5 w-2.5 rounded-full bg-black animate-pulse" />
            <span>RADAR ACTIVE</span>
          </div>

          <Link
            href="/billing"
            className="border-3 border-black bg-[#06B6D4] text-white px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1.5"
          >
            <Zap className="size-4 text-[#FFE600]" strokeWidth={3} />
            <span>+ RECHARGE</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN BODY (SIDEBAR + CONTENT AREA) */}
      <div className="flex flex-1 relative z-10">
        
        {/* DESKTOP SMART COLLAPSIBLE SIDEBAR */}
        <aside
          aria-label="Sidebar navigation"
          role="navigation"
          className={`border-r-4 border-black bg-white p-4 hidden md:flex flex-col justify-between shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto shrink-0 transition-[width,padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
                  className="grid size-10 place-items-center border-3 border-black bg-[#FFE600] shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-all mb-2"
                >
                  <PanelLeftOpen className="size-5 text-black" strokeWidth={3} />
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
                      title={`${item.label} (${item.hotkey || ''})`}
                      className={`relative group grid size-11 place-items-center border-3 border-black transition-all ${
                        isActive
                          ? `${item.color} shadow-[3.5px_3.5px_0_0_#000] -translate-x-0.5 -translate-y-0.5`
                          : "bg-white hover:bg-[#FAF7F2] hover:shadow-[3px_3px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5"
                      }`}
                    >
                      <Icon className="size-5 text-black" strokeWidth={3} />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 bg-[#FF5722] text-white text-[8px] font-black border border-black px-1 rounded-full">
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip on Hover */}
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-black text-[#FFE600] border-2 border-white text-xs font-black uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-[4px_4px_0_0_#000]">
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom Collapsed Icon Actions */}
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="grid size-10 place-items-center border-2 border-black bg-[#A3E635] shadow-[2px_2px_0_0_#000]" title="3/3 Party Agents Active">
                  <span className="h-2.5 w-2.5 rounded-full bg-black border border-white animate-pulse" />
                </div>

                <Link
                  href="/sign-in"
                  title="Log Out"
                  className="grid size-11 place-items-center border-3 border-black bg-[#FF5722] text-white shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-all"
                >
                  <LogOut className="size-5" strokeWidth={3} />
                </Link>
              </div>
            </div>
          ) : (
            /* FULL EXPANDED MODE */
            <div className="flex flex-col justify-between h-full">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b-3 border-black pb-2.5 mb-1">
                  <span className="text-xs font-black text-black uppercase tracking-[0.2em]">
                    Command Compass
                  </span>
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    title="Collapse Sidebar (Cmd+B)"
                    aria-label="Collapse navigation"
                    className="text-[9px] font-black uppercase bg-[#FFE600] text-black border-2 border-black px-1.5 py-0.5 shadow-[1.5px_1.5px_0_0_#000] -rotate-2 hover:bg-[#FFD600]"
                  >
                    ONLINE ⚔️
                  </button>
                </div>

                {navSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] px-1 flex items-center gap-1.5">
                      <Sparkles className="size-3 text-black" />
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
                            className={`flex items-center justify-between p-3 border-3 border-black font-black text-xs uppercase tracking-wider transition-all ${
                              isActive
                                ? `${item.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5`
                                : "bg-white hover:bg-[#FAF7F2] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="size-4 shrink-0" strokeWidth={3} />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.badge && (
                                <span className="bg-[#FF5722] text-white text-[9px] font-black border-2 border-black px-1.5 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                                  {item.badge}
                                </span>
                              )}
                              {item.hotkey && !item.badge && (
                                <span className="font-mono text-[9px] font-black text-black bg-slate-100 border border-black px-1 py-0.2">
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

              {/* Bottom Sidebar Mini-Party Status Card & Log Out */}
              <div className="mt-5 space-y-3 pt-2">
                <div className="border-3 border-black bg-[#A3E635] p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-black uppercase mb-1.5 tracking-wider">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-black border border-white animate-pulse" />
                      <span>Party Status</span>
                    </div>
                    <span className="text-black bg-[#FFE600] border-2 border-black px-1.5 text-[9px] font-black uppercase -rotate-1">
                      3/3 Active
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-black leading-snug">
                    Scouts currently patrolling r/SaaS and Twitter streams.
                  </div>
                </div>

                <Link
                  href="/sign-in"
                  className="flex items-center justify-between p-3 border-3 border-black font-black text-xs uppercase tracking-wider bg-[#FF5722] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="size-4 shrink-0" strokeWidth={3} />
                    <span>LOG OUT</span>
                  </div>
                  <span className="font-mono text-[9px] font-black text-black bg-[#FFE600] border border-black px-1.5">
                    ESC
                  </span>
                </Link>
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
              className="absolute inset-y-0 left-0 h-dvh w-[88vw] max-w-[320px] border-r-4 border-black bg-white shadow-[10px_0_0_rgba(0,0,0,0.3)] p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-250"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b-3 border-black pb-2.5 mb-2">
                  <span className="font-black text-xs uppercase tracking-widest">Navigation</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                    className="grid size-8 place-items-center border-2 border-black bg-[#FFE600] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <X className="size-4 text-black" strokeWidth={3} />
                  </button>
                </div>

                {navSections.map((section) => (
                  <div key={section.title} className="space-y-2">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] px-1 flex items-center gap-1.5">
                      <Sparkles className="size-3 text-black" />
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
                            className={`flex items-center justify-between p-3 border-3 border-black font-black text-xs uppercase tracking-wider transition-all ${
                              isActive
                                ? `${item.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5`
                                : "bg-white hover:bg-[#FAF7F2] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="size-4 shrink-0" strokeWidth={3} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="bg-[#FF5722] text-white text-[9px] font-black border-2 border-black px-1.5 py-0.5">
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
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-3 border-3 border-black font-black text-xs uppercase tracking-wider bg-[#FF5722] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="size-4 shrink-0" strokeWidth={3} />
                    <span>LOG OUT</span>
                  </div>
                </Link>
              </div>
            </aside>
          </div>
        )}

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 min-w-0 p-4 md:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}

export default AppLayout;
