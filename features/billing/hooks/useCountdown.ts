import { useState, useEffect } from 'react'

export function useCountdown(startSec = 299) {
  const [sec, setSec] = useState(startSec)
  useEffect(() => {
    const id = setInterval(() => setSec(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
