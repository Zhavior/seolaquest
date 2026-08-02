import { useCallback, useRef, useState } from 'react'

function createAudioCtx() {
  if (typeof window === 'undefined') return null
  return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
}

function playBlip(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'square'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.06)
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.06)
}

function playCoinDrop(ctx: AudioContext) {
  const times = [0, 0.09]
  const freqs = [1200, 1600]
  times.forEach((t, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + t)
    osc.frequency.exponentialRampToValueAtTime(freqs[i] * 0.5, ctx.currentTime + t + 0.1)
    gain.gain.setValueAtTime(0.18, ctx.currentTime + t)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12)
    osc.start(ctx.currentTime + t)
    osc.stop(ctx.currentTime + t + 0.15)
  })
}

export function useBillingSfx() {
  const [sfxEnabled, setSfxEnabled] = useState(true)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioCtx()
    }
    return audioCtxRef.current
  }, [])

  const sfxBlip = useCallback(() => {
    if (!sfxEnabled) return
    const ctx = getAudioCtx()
    if (ctx) playBlip(ctx)
  }, [sfxEnabled, getAudioCtx])

  const sfxCoin = useCallback(() => {
    if (!sfxEnabled) return
    const ctx = getAudioCtx()
    if (ctx) playCoinDrop(ctx)
  }, [sfxEnabled, getAudioCtx])

  return { sfxEnabled, setSfxEnabled, sfxBlip, sfxCoin }
}
