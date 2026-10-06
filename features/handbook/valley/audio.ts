'use client'

/**
 * Sound for the public valley. Off until the visitor turns it on, and the
 * choice is remembered. Everything is synthesised with the Web Audio API, so
 * nothing is downloaded and cues start without latency.
 *
 * Two layers:
 * - Ambience: a low-passed wind bed with slow gusts, and a sparse torch crackle
 *   under it. Kept around -26 dB so it sits under speech and music.
 * - Interface cues: hover, claim, dismiss and level-up, each well under a
 *   second.
 *
 * The signed-in app has its own cue system in `lib/sfx`; this one covers the
 * public site only.
 */

const KEY = 'sq-sound'
const AMBIENCE_DB = -26

const dbToGain = (db: number) => Math.pow(10, db / 20)

type Ambience = { stop: (at: number) => void }

class ValleyAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambience: Ambience | null = null
  private noise: AudioBuffer | null = null
  private listeners = new Set<() => void>()
  private on = false
  private lastHoverAt = 0

  constructor() {
    if (typeof window === 'undefined') return
    try {
      this.on = window.localStorage.getItem(KEY) === '1'
    } catch {
      // Storage can be blocked; sound simply starts off.
    }
    // A browser only lets audio start inside a user gesture. If sound was left
    // on last visit, the first click or key press brings the ambience back.
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      if (this.on) this.start()
    }
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock, { passive: true })
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return
      if (document.hidden) void this.ctx.suspend().catch(() => {})
      else if (this.on) void this.ctx.resume().catch(() => {})
    })
  }

  get enabled(): boolean {
    return this.on
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = () => this.on

  /** Call from a click handler: browsers block audio that starts any other way. */
  toggle(): boolean {
    this.on = !this.on
    try {
      window.localStorage.setItem(KEY, this.on ? '1' : '0')
    } catch {
      // The toggle still works for this visit.
    }
    if (this.on) this.start()
    else this.stop()
    this.listeners.forEach((listener) => listener())
    return this.on
  }

  /** Short dry tick for pointing at a lead card. Rate-limited so sweeping the list is not a buzz. */
  hover() {
    const ctx = this.live()
    if (!ctx) return
    const now = ctx.currentTime
    if (now - this.lastHoverAt < 0.06) return
    this.lastHoverAt = now
    const src = this.noiseSource(ctx)
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 2400
    band.Q.value = 1.4
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
    src.connect(band).connect(gain).connect(this.master!)
    src.start(now, Math.random())
    src.stop(now + 0.05)
  }

  /** A struck bell near 800 Hz that rings out over a quarter second. */
  claim() {
    const ctx = this.live()
    if (!ctx) return
    const now = ctx.currentTime
    // A bell's partials are not whole-number multiples; 2.76x gives the metallic edge.
    ;[
      [800, 0.11, 0.28],
      [800 * 2.76, 0.035, 0.16],
      [800 * 5.4, 0.012, 0.08],
    ].forEach(([freq, peak, decay]) => this.tone(ctx, 'sine', freq, now, peak, decay))
  }

  /** Low, dry slide: filtered noise sweeping down. */
  dismiss() {
    const ctx = this.live()
    if (!ctx) return
    const now = ctx.currentTime
    const src = this.noiseSource(ctx)
    const low = ctx.createBiquadFilter()
    low.type = 'lowpass'
    low.Q.value = 0.8
    low.frequency.setValueAtTime(900, now)
    low.frequency.exponentialRampToValueAtTime(140, now + 0.16)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    src.connect(low).connect(gain).connect(this.master!)
    src.start(now, Math.random())
    src.stop(now + 0.2)
  }

  /** Warm major chord (root, major third, fifth, octave), rolled upward. */
  levelUp() {
    const ctx = this.live()
    if (!ctx) return
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      this.tone(ctx, 'triangle', freq, now + i * 0.07, 0.06, 0.9),
    )
  }

  private live(): AudioContext | null {
    if (!this.on || !this.ctx || !this.master || this.ctx.state !== 'running') return null
    return this.ctx
  }

  private ensure(): AudioContext | null {
    if (this.ctx && this.ctx.state !== 'closed') return this.ctx
    try {
      const Ctx =
        window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return null
      const ctx = new Ctx()
      const master = ctx.createGain()
      master.gain.value = 1
      master.connect(ctx.destination)
      this.ctx = ctx
      this.master = master
      return ctx
    } catch {
      return null
    }
  }

  private start() {
    const ctx = this.ensure()
    if (!ctx) return
    void ctx.resume().catch(() => {})
    if (!this.ambience) this.ambience = this.startAmbience(ctx)
  }

  private stop() {
    if (!this.ctx) return
    this.ambience?.stop(this.ctx.currentTime)
    this.ambience = null
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise && this.noise.sampleRate === ctx.sampleRate) return this.noise
    const length = ctx.sampleRate * 4
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    // Brown-ish noise: integrated white noise, which carries more low end than white.
    let last = 0
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
      data[i] = last * 3.5
    }
    this.noise = buffer
    return buffer
  }

  private noiseSource(ctx: AudioContext): AudioBufferSourceNode {
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer(ctx)
    src.loop = true
    return src
  }

  private tone(ctx: AudioContext, type: OscillatorType, freq: number, at: number, peak: number, decay: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    osc.connect(gain).connect(this.master!)
    osc.start(at)
    osc.stop(at + decay + 0.02)
  }

  private startAmbience(ctx: AudioContext): Ambience {
    const now = ctx.currentTime
    const bus = ctx.createGain()
    bus.gain.setValueAtTime(0.0001, now)
    bus.gain.exponentialRampToValueAtTime(dbToGain(AMBIENCE_DB), now + 2.5)
    bus.connect(this.master!)

    // Wind: noise held inside 60-400 Hz, with a slow LFO opening the filter for gusts.
    const wind = this.noiseSource(ctx)
    const high = ctx.createBiquadFilter()
    high.type = 'highpass'
    high.frequency.value = 60
    const low = ctx.createBiquadFilter()
    low.type = 'lowpass'
    low.frequency.value = 260
    low.Q.value = 0.6
    const gust = ctx.createOscillator()
    gust.frequency.value = 0.07
    const gustDepth = ctx.createGain()
    gustDepth.gain.value = 140
    gust.connect(gustDepth).connect(low.frequency)
    wind.connect(high).connect(low).connect(bus)

    // Rustle: a quieter, brighter band that swells with its own slower cycle.
    const rustle = this.noiseSource(ctx)
    const rustleBand = ctx.createBiquadFilter()
    rustleBand.type = 'bandpass'
    rustleBand.frequency.value = 1800
    rustleBand.Q.value = 0.7
    const rustleGain = ctx.createGain()
    rustleGain.gain.value = 0.05
    const rustleLfo = ctx.createOscillator()
    rustleLfo.frequency.value = 0.045
    const rustleDepth = ctx.createGain()
    rustleDepth.gain.value = 0.05
    rustleLfo.connect(rustleDepth).connect(rustleGain.gain)
    rustle.connect(rustleBand).connect(rustleGain).connect(bus)

    // Torch crackle: sparse random pops from a pre-rendered loop.
    const crackle = ctx.createBufferSource()
    crackle.buffer = this.crackleBuffer(ctx)
    crackle.loop = true
    const crackleBand = ctx.createBiquadFilter()
    crackleBand.type = 'bandpass'
    crackleBand.frequency.value = 3200
    crackleBand.Q.value = 0.9
    const crackleGain = ctx.createGain()
    crackleGain.gain.value = 0.35
    crackle.connect(crackleBand).connect(crackleGain).connect(bus)

    const sources = [wind, gust, rustle, rustleLfo, crackle]
    sources.forEach((source) => source.start(now))

    return {
      stop(at) {
        bus.gain.cancelScheduledValues(at)
        bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), at)
        bus.gain.exponentialRampToValueAtTime(0.0001, at + 0.6)
        sources.forEach((source) => source.stop(at + 0.65))
        window.setTimeout(() => bus.disconnect(), 800)
      },
    }
  }

  private crackleBuffer(ctx: AudioContext): AudioBuffer {
    const seconds = 6
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    const pops = 26
    for (let p = 0; p < pops; p++) {
      const start = Math.floor(Math.random() * (data.length - 2000))
      const length = 120 + Math.floor(Math.random() * 900)
      const level = 0.25 + Math.random() * 0.75
      for (let i = 0; i < length; i++) {
        data[start + i] += (Math.random() * 2 - 1) * level * Math.exp(-i / (length / 5))
      }
    }
    return buffer
  }
}

export const valleyAudio = new ValleyAudio()
