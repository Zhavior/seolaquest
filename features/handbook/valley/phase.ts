/**
 * Time-of-day for the valley.
 *
 * The sky follows the visitor's own clock. Nothing is sent anywhere and no
 * location is requested: the browser's local time and time zone name are all
 * that is read. A visitor can preview any phase instead.
 */

export type Phase = 'dawn' | 'day' | 'dusk' | 'night'
export type SkyMode = 'auto' | Phase

export type PhaseLook = {
  sky: [string, string, string]
  fog: string
  fogD: number
  sun: string
  sunI: number
  moonO: number
  stars: number
  hemiS: string
  hemiG: string
  hemiI: number
  dirC: string
  dirI: number
  lamp: number
  bloom: number
  exp: number
  cloudC: string
  cloudS: string
  cover: number
  tint: string
}

export const PHASE_LOOKS: Record<Phase, PhaseLook> = {
  night: { sky: ['#05061A', '#0F1236', '#232A66'], fog: '#10153E', fogD: 0.003, sun: '#9FB0FF', sunI: 0, moonO: 1, stars: 1, hemiS: '#1C2A6A', hemiG: '#07060F', hemiI: 0.42, dirC: '#8FA8FF', dirI: 0.75, lamp: 1.6, bloom: 0.9, exp: 1.0, cloudC: '#4A4E8C', cloudS: '#0E0F2A', cover: 0.35, tint: '#DDE4FF' },
  dawn: { sky: ['#22245A', '#7A4F8C', '#FFB07A'], fog: '#C98A8E', fogD: 0.0034, sun: '#FFB870', sunI: 1.0, moonO: 0, stars: 0.25, hemiS: '#7A6AA8', hemiG: '#2A2A40', hemiI: 0.8, dirC: '#FFB070', dirI: 3.0, lamp: 0.9, bloom: 0.75, exp: 1.1, cloudC: '#FFC9A8', cloudS: '#4B3A7C', cover: 0.45, tint: '#FFE8D8' },
  day: { sky: ['#4F9FEA', '#8CCBF5', '#EAF6FC'], fog: '#CFE6F5', fogD: 0.0011, sun: '#FFF0C0', sunI: 0.8, moonO: 0, stars: 0, hemiS: '#9CC8FF', hemiG: '#4A6A3A', hemiI: 1.15, dirC: '#FFF1D6', dirI: 3.6, lamp: 0.25, bloom: 0.38, exp: 1.0, cloudC: '#FFFFFF', cloudS: '#9DB5D8', cover: 0.5, tint: '#FFFFFF' },
  dusk: { sky: ['#1A1546', '#6C3A6A', '#F58B4C'], fog: '#C27A6A', fogD: 0.0034, sun: '#FF9D58', sunI: 1.1, moonO: 0.8, stars: 0.7, hemiS: '#6A4F8A', hemiG: '#1C1630', hemiI: 0.7, dirC: '#FF8F4A', dirI: 2.8, lamp: 1.1, bloom: 0.8, exp: 1.12, cloudC: '#D98A86', cloudS: '#3A2A63', cover: 0.5, tint: '#FFE0CC' },
}

/** Hour used when a visitor previews a phase rather than following their clock. */
export const PREVIEW_HOUR: Record<Phase, number> = { dawn: 6.6, day: 12.5, dusk: 18.4, night: 23 }

export const PHASE_LABEL: Record<Phase, string> = { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' }

export const SKY_MODES: SkyMode[] = ['auto', 'dawn', 'day', 'dusk', 'night']

export function phaseOf(hour: number): Phase {
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

export type SkyInfo = { hour: number; phase: Phase; label: string }

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function zoneName(): string {
  try {
    return (Intl.DateTimeFormat().resolvedOptions().timeZone || '').split('/').pop()?.replace(/_/g, ' ') ?? ''
  } catch {
    return ''
  }
}

export function skyInfo(mode: SkyMode, now: Date = new Date()): SkyInfo {
  const local = now.getHours() + now.getMinutes() / 60
  if (mode !== 'auto') {
    return { hour: PREVIEW_HOUR[mode], phase: mode, label: `Previewing ${PHASE_LABEL[mode]}` }
  }
  const phase = phaseOf(local)
  const zone = zoneName()
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  return { hour: local, phase, label: `Your sky: ${PHASE_LABEL[phase]} · ${clock}${zone ? ` · ${zone}` : ''}` }
}

/** Where the sun sits for a phase and hour, as a unit-length direction. */
export function sunDirection(info: Pick<SkyInfo, 'hour' | 'phase'>): [number, number, number] {
  const { hour, phase } = info
  let v: [number, number, number]
  if (phase === 'day') {
    const t = Math.min(1, Math.max(0, (hour - 8) / 9))
    v = [-0.55 + 1.1 * t, 0.35 + 0.55 * Math.sin(Math.PI * t), -0.6]
  } else if (phase === 'dawn') {
    const t = Math.min(1, Math.max(0, (hour - 5) / 3))
    v = [0.55, 0.02 + 0.2 * t, -0.85]
  } else if (phase === 'dusk') {
    const t = Math.min(1, Math.max(0, (hour - 17) / 3))
    v = [0.45, 0.2 - 0.18 * t, -0.85]
  } else {
    v = [0.4, 0.55, -0.75]
  }
  const len = Math.hypot(...v)
  return [v[0] / len, v[1] / len, v[2] / len]
}
