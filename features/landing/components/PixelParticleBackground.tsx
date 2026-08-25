'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 3750

function createRng(seed: number) {
  let value = seed >>> 0
  return function next() {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

// `window.devicePixelRatio` is a live property, so reading it inside the frame
// loop asked the browser for it 60 times a second. It only ever changes when the
// window moves between displays or the page zooms, which `resize` already covers.
function useDevicePixelRatio() {
  const [dpr, setDpr] = useState(1)

  useEffect(() => {
    const read = () => setDpr(Math.min(window.devicePixelRatio || 1, 2))
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  return dpr
}

function PixelParticleCloud({ count = PARTICLE_COUNT }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const pixelRatio = useDevicePixelRatio()

  const geometry = useMemo(() => {
    const rng = createRng(1337 + count)

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const seeds = new Float32Array(count)

    const palette = [
      new THREE.Color('#111111'),
      new THREE.Color('#facc15'),
      new THREE.Color('#ff5a36'),
    ]

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3

      const leftCluster = rng() < 0.52
      const rightCluster = !leftCluster && rng() < 0.58

      let x = 0
      let y = 0
      let z = 0

      if (leftCluster) {
        x = -6.2 + (rng() - 0.5) * 4.2
        y = (rng() - 0.5) * 7.5
        z = (rng() - 0.5) * 5
      } else if (rightCluster) {
        x = 4.2 + (rng() - 0.5) * 5.4
        y = (rng() - 0.5) * 6.8
        z = (rng() - 0.5) * 5
      } else {
        x = (rng() - 0.5) * 18
        y = (rng() - 0.5) * 10
        z = (rng() - 0.5) * 6
      }

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      const toneRoll = rng()
      const color =
        toneRoll > 0.9 ? palette[2] : toneRoll > 0.68 ? palette[1] : palette[0]

      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      const sizeRoll = rng()
      sizes[i] = sizeRoll > 0.94 ? 3.6 : sizeRoll > 0.7 ? 2.6 : 1.7
      seeds[i] = rng() * 1000
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return g
  }, [count])

  useFrame((state) => {
    const points = pointsRef.current
    const material = materialRef.current
    if (!points || !material) return

    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uPixelRatio.value = pixelRatio
    points.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.015
    points.rotation.x = Math.cos(state.clock.elapsedTime * 0.04) * 0.01
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        vertexColors
        blending={THREE.NormalBlending}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
        }}
        vertexShader={`
          attribute float aSize;
          attribute float aSeed;
          varying vec3 vColor;
          varying float vAlpha;

          uniform float uTime;
          uniform float uPixelRatio;

          void main() {
            vColor = color;
            vec3 pos = position;

            float speed = 0.12 + fract(aSeed * 0.37) * 0.32;
            float rise = mod(position.y + uTime * speed + 12.0, 24.0) - 12.0;
            float sway = sin(uTime * 0.22 + aSeed * 1.7) * 0.12;
            float drift = cos(uTime * 0.16 + aSeed * 1.13) * 0.08;

            pos.x += sway + drift;
            pos.y = rise;

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            gl_PointSize = aSize * uPixelRatio * 3.2;
            gl_PointSize *= (18.0 / -mvPosition.z);

            vAlpha = 0.08 + fract(aSeed * 13.17) * 0.07;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vec2 uv = gl_PointCoord;
            float inset = 0.08;

            if (uv.x < inset || uv.x > 1.0 - inset || uv.y < inset || uv.y > 1.0 - inset) {
              discard;
            }

            gl_FragColor = vec4(vColor, vAlpha);
          }
        `}
      />
    </points>
  )
}

// Drives the render loop only while `active`. The Canvas stays in `demand` mode,
// which paints once on mount (so the field is never blank) and then renders only
// when we ask it to.
//
// Preferred over toggling `frameloop` between 'always' and 'never': a Canvas
// mounted as 'never' has never started its loop, and whether flipping the prop
// reliably starts it is version-dependent. `demand` + explicit invalidate has one
// documented behaviour and does not depend on that.
function FrameDriver({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (!active) return

    let raf = 0
    const tick = () => {
      invalidate()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [active, invalidate])

  return null
}

export default function PixelParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  // The hero scrolls away but the canvas kept drawing 5,000 shaded points for
  // the whole session, on a background layer nobody could see. Gating the
  // frameloop is invisible while the hero is on screen and stops the GPU work
  // once it isn't — or once the tab is backgrounded.
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    let isOnScreen = false

    const sync = () => setIsActive(isOnScreen && !document.hidden)

    const observer = new IntersectionObserver(
      ([entry]) => {
        isOnScreen = entry.isIntersecting
        sync()
      },
      { threshold: 0 },
    )
    observer.observe(node)
    document.addEventListener('visibilitychange', sync)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 14], fov: 42 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <FrameDriver active={isActive} />
        <PixelParticleCloud count={5000} />
      </Canvas>
    </div>
  )
}
