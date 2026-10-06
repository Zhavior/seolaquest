import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { PHASE_LOOKS, skyInfo, sunDirection, type PhaseLook, type SkyMode } from './phase'

/**
 * The valley: a procedural low-poly landscape with a time-of-day sky, a lake,
 * a forest, four beacon towers and a far keep, grown from one deterministic
 * noise function so every visitor sees the same land. Nothing here is a model
 * or a texture file; it is all generated on the visitor's GPU.
 *
 * Solid surfaces use the painted look (see `paintedMaterial`): soft banded
 * light instead of realistic falloff, brush mottling on the ground, a rim of
 * light on the landmarks, and soft contact blobs instead of cast shadows.
 *
 * Beacons carry sample scores supplied by the page. They are decoration and
 * say so wherever the page shows them.
 */

export type ValleyOptions = {
  canvas: HTMLCanvasElement
  /** Element whose size the canvas follows. */
  host: HTMLElement
  /**
   * Scores for the four beacon markers. The home page passes labelled samples;
   * the dashboard passes real lead scores. `null` means no measured score and
   * draws a dash, never a made-up number.
   */
  scores: Array<number | null>
  mode: SkyMode
  reducedMotion: boolean
  /**
   * Scales fog, mist and the drifting fog banks. 1 is the full-page look; a
   * small framed view reads clearer with less (the dashboard uses 0.45).
   */
  atmosphere?: number
}

export type ValleyHandle = {
  setMode: (mode: SkyMode) => void
  /** 0 at the establishing shot, 1 at the far end of the camera path. */
  setProgress: (progress: number) => void
  setPaused: (paused: boolean) => void
  setReducedMotion: (reduced: boolean) => void
  /** Sync each beacon to the sample hunt: which are open, claimed or dismissed, and which is selected. */
  setBeacons: (beacons: BeaconView[]) => void
  /** Replace the beacon scores, e.g. when new leads arrive. `null` draws a dash. */
  setScores: (scores: Array<number | null>) => void
  /** Light-pillar surge, expanding ring and sparks at one beacon (a claim). */
  burst: (index: number) => void
  /** Jump the sky to its target immediately (used when a still frame is wanted). */
  snap: () => void
  dispose: () => void
}

export type BeaconState = 'open' | 'claimed' | 'dismissed'
export type BeaconView = { state: BeaconState; selected: boolean }

type Tier = 'high' | 'low'

type Blend = {
  colors: Record<string, THREE.Color>
  n: Record<string, number>
}

const COLOR_KEYS = ['top', 'mid', 'hor', 'fog', 'sun', 'hemiS', 'hemiG', 'dirC', 'cloudC', 'cloudS', 'tint'] as const
const NUMBER_KEYS = ['fogD', 'sunI', 'moonO', 'stars', 'hemiI', 'dirI', 'lamp', 'bloom', 'exp', 'cover'] as const

function blendFor(p: PhaseLook): Blend {
  return {
    colors: {
      top: new THREE.Color(p.sky[0]),
      mid: new THREE.Color(p.sky[1]),
      hor: new THREE.Color(p.sky[2]),
      fog: new THREE.Color(p.fog),
      sun: new THREE.Color(p.sun),
      hemiS: new THREE.Color(p.hemiS),
      hemiG: new THREE.Color(p.hemiG),
      dirC: new THREE.Color(p.dirC),
      cloudC: new THREE.Color(p.cloudC),
      cloudS: new THREE.Color(p.cloudS),
      tint: new THREE.Color(p.tint),
    },
    n: {
      fogD: p.fogD, sunI: p.sunI, moonO: p.moonO, stars: p.stars, hemiI: p.hemiI,
      dirI: p.dirI, lamp: p.lamp, bloom: p.bloom, exp: p.exp, cover: p.cover,
    },
  }
}

function tierColor(score: number | null): { fill: string } {
  if (score === null) return { fill: '#6E6590' }
  if (score >= 80) return { fill: '#FF8A3D' }
  if (score >= 40) return { fill: '#5DB2FF' }
  return { fill: '#C9CBD2' }
}

/* ── deterministic noise ─────────────────────────────────────────────── */

function h2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
function vn(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1)
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy
}
function fbm(x: number, y: number, octaves = 5): number {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < octaves; i++) { v += a * vn(x * f, y * f); f *= 2.03; a *= 0.5 }
  return v
}
function ridged(x: number, y: number): number {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < 5; i++) { v += a * (1 - Math.abs(2 * vn(x * f + i * 17, y * f) - 1)); f *= 2.1; a *= 0.5 }
  return v
}
function sstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function pathX(z: number): number {
  return 16 * Math.sin(z * 0.022) + 8 * Math.sin(z * 0.051 + 1.3)
}
const LAKE = { x: -34, z: -70 }
function heightAt(x: number, z: number): number {
  const d = Math.abs(x - pathX(z))
  const side = sstep(16, 100, d)
  const depth = sstep(10, 300, -z)
  let h = 3.2 * fbm(x * 0.02 + 3, z * 0.02)
  const m = ridged(x * 0.012, z * 0.012)
  h += side * side * (16 + 78 * m * (0.35 + 0.65 * depth) + 34 * fbm(x * 0.03, z * 0.03, 4))
  h += depth * depth * 55 * sstep(60, 200, d)
  h += 15 * Math.exp(-(Math.pow(x - 8, 2) + Math.pow(z - 40, 2)) / (2 * 22 * 22))
  h -= 7 * Math.exp(-(Math.pow(x - LAKE.x, 2) + Math.pow(z - LAKE.z, 2)) / (2 * 26 * 26))
  return h
}

/* ── shaders ─────────────────────────────────────────────────────────── */

const SKY_FRAG = [
  'varying vec3 vD; uniform vec3 uTop,uMid,uHor,uSunDir,uSunCol,uMoonDir,uCloudC,uCloudS; uniform float uSunI,uMoonO,uStars,uCover,uT;',
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}',
  'float fbm3(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}',
  'float cl(vec2 p){ float c=fbm(p*1.3+vec2(uT*.012,0.)); return smoothstep(.5-uCover*.22,.84,c); }',
  'float clLo(vec2 p){ float c=fbm3(p*1.3+vec2(uT*.012,0.)); return smoothstep(.5-uCover*.22,.84,c); }',
  'void main(){',
  ' vec3 d=normalize(vD); float e=max(d.y,0.);',
  ' vec3 col=mix(uHor,uMid,smoothstep(0.,.32,e)); col=mix(col,uTop,smoothstep(.22,.9,e));',
  ' float s=max(dot(d,normalize(uSunDir)),0.);',
  ' col+=uSunCol*uSunI*(.5*pow(s,6.)+1.2*pow(s,48.)+3.*smoothstep(.9992,.9997,s));',
  ' vec2 sg=floor(d.xz/(e+.2)*220.); float sr=hash(sg+floor(e*90.)); col+=vec3(.9,.95,1.)*step(.9972,sr)*(.55+.45*sin(uT*2.2+sr*60.))*smoothstep(.12,.5,e)*uStars;',
  ' float m=max(dot(d,normalize(uMoonDir)),0.); float md=smoothstep(.9987,.9992,m); vec3 mc=vec3(.95,.92,.82)*(.82+.18*noise(d.xz*60.)); col=mix(col,mc*1.4,md*uMoonO); col+=vec3(.55,.62,1.)*uMoonO*.35*pow(m,40.);',
  ' vec2 cp=d.xz/(e+.16)*.55; float cm=smoothstep(.02,.16,e)*(1.-smoothstep(.75,1.,e)*.5);',
  ' float c=cl(cp)*cm; vec2 L=normalize(uSunDir.xz+vec2(1e-4)); float c2=cl(cp+L*.05)*cm;',
  ' float lit=clamp(.55+(c-c2)*5.,0.,1.); vec3 cc=mix(uCloudS,uCloudC,lit); cc+=uSunCol*uSunI*.45*pow(s,4.)*(1.-c2);',
  ' col=mix(col,cc,c*.9);',
  ' float rays=0.; vec2 q=cp; vec2 st=(normalize(uSunDir).xz/(max(normalize(uSunDir).y,0.)+.16)*.55-cp)/12.; for(int i=0;i<12;i++){q+=st; rays+=1.-clLo(q)*cm;} rays/=12.; col+=uSunCol*uSunI*pow(rays,3.)*pow(s,3.)*.5;',
  ' col=mix(col,uHor*1.05,exp(-e*9.)*.7);',
  ' gl_FragColor=vec4(col,1.); }',
].join('\n')

const NOISE_GLSL = [
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
].join('\n')

const WATER_FRAG = [
  'varying vec3 vW; uniform float uT,uSunI,uFogD; uniform vec3 uHor,uTop,uSunDir,uSunCol,uFog;',
  NOISE_GLSL,
  'void main(){',
  ' vec3 V=normalize(cameraPosition-vW); vec2 p=vW.xz*.35;',
  ' vec3 N=normalize(vec3((noise(p+vec2(uT*.3,0.))-.5)*.35+(noise(p*2.3-uT*.2)-.5)*.2,1.,(noise(p+vec2(3.,uT*.28))-.5)*.35));',
  ' float f=pow(1.-max(dot(V,N),0.),3.); vec3 R=reflect(-V,N);',
  ' vec3 refl=mix(uHor,uTop,smoothstep(0.,.7,max(R.y,0.)));',
  ' vec3 deep=uTop*.18+vec3(.01,.03,.04); vec3 col=mix(deep,refl,.25+.7*f);',
  ' float sp=pow(max(dot(R,normalize(uSunDir)),0.),90.); col+=uSunCol*uSunI*sp*2.5;',
  ' float dist=length(cameraPosition-vW); float fg=1.-exp(-pow(dist*uFogD,2.)); col=mix(col,uFog,fg);',
  ' gl_FragColor=vec4(col,.94); }',
].join('\n')

const MIST_FRAG = [
  'varying vec3 vW; uniform float uT,uA; uniform vec3 uC;',
  NOISE_GLSL,
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.1+vec2(3.1,1.7);a*=.5;}return v;}',
  'void main(){ float d=length(cameraPosition-vW); float n=fbm(vW.xz*.012+vec2(uT*.015,uT*.006)); float a=smoothstep(.38,.8,n)*uA*smoothstep(25.,90.,d)*(1.-smoothstep(300.,720.,d)); gl_FragColor=vec4(uC,a); }',
].join('\n')

const WORLD_VERT = 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }'

const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uExp: { value: 1.1 },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uVig: { value: 0.55 },
    uGrain: { value: 0.012 },
    uCA: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: [
    'uniform sampler2D tDiffuse; uniform float uTime,uExp,uVig,uGrain,uCA; uniform vec3 uTint; varying vec2 vUv;',
    'vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }',
    'float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }',
    'void main(){ vec2 c=vUv-.5; vec3 col=vec3(texture2D(tDiffuse,vUv+c*uCA).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-c*uCA).b);',
    ' col*=uExp*uTint; col=aces(col); float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,1.15);',
    ' col=pow(col,vec3(1./2.2));',
    ' float v=smoothstep(.95,.25,length(c)*1.25); col*=mix(1.-uVig,1.,v);',
    ' col+=(hash(vUv*vec2(1920.,1080.)+fract(uTime))-.5)*uGrain;',
    ' gl_FragColor=vec4(col,1.); }',
  ].join('\n'),
}

/* ── painted look ────────────────────────────────────────────────────── */

/**
 * Light ramp for the painted look: three soft bands (shade, mid, lit) instead
 * of a smooth realistic falloff. MeshToonMaterial samples it by half-Lambert,
 * so 0 faces away from the light and 1 faces it.
 */
function paintRamp(): THREE.DataTexture {
  const W = 64
  const data = new Uint8Array(W)
  for (let i = 0; i < W; i++) {
    const x = i / (W - 1)
    data[i] = Math.round((0.32 + 0.27 * sstep(0.38, 0.47, x) + 0.27 * sstep(0.6, 0.69, x)) * 255)
  }
  const t = new THREE.DataTexture(data, W, 1, THREE.RedFormat)
  t.minFilter = THREE.LinearFilter
  t.magFilter = THREE.LinearFilter
  t.needsUpdate = true
  return t
}

type PaintOptions = {
  color?: THREE.ColorRepresentation
  vertexColors?: boolean
  /** Strength of the bright edge along the silhouette. Landmarks only. */
  rim?: number
  rimColor?: THREE.ColorRepresentation
  /** World-space mottling that reads as brush strokes. Only for non-instanced meshes. */
  brush?: boolean
  /** Sway the upper vertices in the breeze (trees). */
  wind?: { uWindT: { value: number }; uWindA: { value: number } }
}

const BRUSH_GLSL = [
  'varying vec3 vPaintW;',
  'float pHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'float pNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(pHash(i),pHash(i+vec2(1.,0.)),f.x),mix(pHash(i+vec2(0.,1.)),pHash(i+vec2(1.,1.)),f.x),f.y);}',
].join('\n')

const WIND_GLSL = [
  'float hW = clamp((position.y - 3.0) / 8.5, 0.0, 1.0);',
  'hW *= hW;',
  'float gust = 0.6 + 0.4 * sin(uWindT * 0.23 + mvPosition.x * 0.004);',
  'float swayW = sin(uWindT * 1.15 + mvPosition.x * 0.045 + mvPosition.z * 0.018);',
  'mvPosition.x += swayW * 0.55 * hW * gust * uWindA;',
  'mvPosition.z += cos(uWindT * 0.9 + mvPosition.z * 0.04) * 0.22 * hW * gust * uWindA;',
].join('\n')

/**
 * The one material behind every solid surface. Built on MeshToonMaterial so
 * fog, instancing, vertex and instance colours keep working; the extras are
 * patched in at compile time and keyed so differently patched materials never
 * share a program.
 */
function paintedMaterial(ramp: THREE.Texture, o: PaintOptions = {}): THREE.MeshToonMaterial {
  const m = new THREE.MeshToonMaterial({ color: o.color ?? 0xffffff, vertexColors: o.vertexColors ?? false, gradientMap: ramp })
  const rim = o.rim ?? 0
  const key = `painted:${rim > 0 ? 'rim' : ''}:${o.brush ? 'brush' : ''}:${o.wind ? 'wind' : ''}`
  if (key === 'painted:::') return m
  const rimUniforms = { uRimC: { value: new THREE.Color(o.rimColor ?? 0xffe9c4) }, uRimI: { value: rim } }
  m.customProgramCacheKey = () => key
  m.onBeforeCompile = (shader) => {
    let vs = shader.vertexShader
    let fs = shader.fragmentShader
    if (o.wind) {
      Object.assign(shader.uniforms, o.wind)
      vs = 'uniform float uWindT;\nuniform float uWindA;\n' + vs.replace(
        '#include <project_vertex>',
        THREE.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;', WIND_GLSL + '\nmvPosition = modelViewMatrix * mvPosition;'),
      )
    }
    if (o.brush) {
      vs = 'varying vec3 vPaintW;\n' + vs.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintW = (modelMatrix * vec4(transformed, 1.0)).xyz;')
      fs = BRUSH_GLSL + '\n' + fs.replace('#include <color_fragment>', [
        '#include <color_fragment>',
        'float pb = pNoise(vPaintW.xz * 0.09) * 0.6 + pNoise(vPaintW.xz * 0.37 + 7.0) * 0.3 + pNoise(vPaintW.xz * 1.3) * 0.1;',
        'diffuseColor.rgb *= 0.88 + 0.22 * pb;',
        'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.07, 1.0, 0.88), smoothstep(0.55, 0.8, pb));',
      ].join('\n'))
    }
    if (rim > 0) {
      Object.assign(shader.uniforms, rimUniforms)
      fs = 'uniform vec3 uRimC;\nuniform float uRimI;\n' + fs.replace('#include <opaque_fragment>', [
        'float rimF = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 2.5);',
        'outgoingLight += uRimC * rimF * uRimI;',
        '#include <opaque_fragment>',
      ].join('\n'))
    }
    shader.vertexShader = vs
    shader.fragmentShader = fs
  }
  return m
}

/* ── scene ───────────────────────────────────────────────────────────── */

const TILT = (1.5 * Math.PI) / 180

export function createValley(opts: ValleyOptions): ValleyHandle {
  const { canvas, host } = opts
  let mode = opts.mode
  let reduce = opts.reducedMotion
  const atmosphere = Math.max(0, opts.atmosphere ?? 1)

  const small = Math.min(host.clientWidth, window.innerHeight) < 700
  let tier: Tier = small || (navigator.hardwareConcurrency || 8) < 4 ? 'low' : 'high'
  const dprCap = tier === 'high' ? 1.75 : 1

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier === 'high', powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))
  // The painted look has no cast shadows: contact blobs sit under landmarks instead.
  renderer.shadowMap.enabled = false

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(52, 1, 0.5, 2600)
  scene.fog = new THREE.FogExp2(0x161a44, 0.003)

  const disposables: Array<{ dispose: () => void }> = []
  const track = <T extends { dispose: () => void }>(item: T): T => { disposables.push(item); return item }

  /* sky dome */
  const skyMat = track(new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 0.3, -1) }, uSunCol: { value: new THREE.Color() }, uSunI: { value: 0 },
      uMoonDir: { value: new THREE.Vector3(0.4, 0.55, -0.75).normalize() }, uMoonO: { value: 0 }, uStars: { value: 0 },
      uCloudC: { value: new THREE.Color() }, uCloudS: { value: new THREE.Color() }, uCover: { value: 0.5 }, uT: { value: 0 },
    },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: SKY_FRAG,
  }))
  const skyGeo = track(new THREE.SphereGeometry(1800, 48, 32))
  const sky = new THREE.Mesh(skyGeo, skyMat)
  sky.renderOrder = -10
  sky.frustumCulled = false
  scene.add(sky)

  /* lights. three r155+ lights are physical; the look was authored with the
     older scaling, which multiplied every intensity by pi. */
  const hemi = new THREE.HemisphereLight(0x9cc8ff, 0x4a6a3a, 1)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff1d6, 3)
  scene.add(sun)
  scene.add(sun.target)

  const ramp = track(paintRamp())

  /* terrain */
  const SEG = tier === 'high' ? 260 : 150
  const SIZE = 1500
  const tg = track(new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG))
  tg.rotateX(-Math.PI / 2)
  tg.translate(0, 0, -420)
  const tp = tg.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < tp.count; i++) tp.setY(i, heightAt(tp.getX(i), tp.getZ(i)))
  tg.computeVertexNormals()
  const tn = tg.attributes.normal as THREE.BufferAttribute
  const tc = new Float32Array(tp.count * 3)
  const cGrass = new THREE.Color('#467a38'), cMoss = new THREE.Color('#6f8c3c'), cRock = new THREE.Color('#77708c')
  const cHigh = new THREE.Color('#b9bccc'), cDirt = new THREE.Color('#b08954'), cShore = new THREE.Color('#c2a576')
  const tmpC = new THREE.Color()
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i), ny = tn.getY(i)
    tmpC.copy(cGrass).lerp(cMoss, fbm(x * 0.05, z * 0.05, 3))
    const rock = sstep(0.82, 0.62, ny) + sstep(40, 90, y) * 0.7
    tmpC.lerp(cRock, Math.min(1, rock))
    tmpC.lerp(cHigh, sstep(70, 120, y))
    const pd = Math.abs(x - pathX(z))
    tmpC.lerp(cDirt, (1 - sstep(1.8, 4.2, pd)) * 0.9 * (1 - sstep(0.7, 0.9, 1 - ny)))
    tmpC.lerp(cShore, 1 - sstep(-0.2, 1.4, y))
    tc[i * 3] = tmpC.r; tc[i * 3 + 1] = tmpC.g; tc[i * 3 + 2] = tmpC.b
  }
  tg.setAttribute('color', new THREE.BufferAttribute(tc, 3))
  const terrainMat = track(paintedMaterial(ramp, { vertexColors: true, brush: true }))
  const terrain = new THREE.Mesh(tg, terrainMat)
  scene.add(terrain)

  /* lake */
  const waterMat = track(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uT: { value: 0 }, uHor: { value: new THREE.Color() }, uTop: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 0.3, -1) }, uSunCol: { value: new THREE.Color() }, uSunI: { value: 1 },
      uFog: { value: new THREE.Color() }, uFogD: { value: 0.003 },
    },
    vertexShader: WORLD_VERT,
    fragmentShader: WATER_FRAG,
  }))
  const waterGeo = track(new THREE.PlaneGeometry(130, 130, 1, 1))
  const water = new THREE.Mesh(waterGeo, waterMat)
  water.rotation.x = -Math.PI / 2
  water.position.set(LAKE.x, -1.3, LAKE.z)
  scene.add(water)

  /* beacon sites */
  const BSPOT: Array<[number, number, number]> = [[-30, 1, 52], [-88, -1, 58], [-146, 1, 54], [-205, -1, 60]]
  const bpos = BSPOT.map(([z, side, off]) => {
    const x = pathX(z) + side * off
    return { x, z, y: heightAt(x, z) }
  })

  /* trees */
  const treeCount = tier === 'high' ? 3000 : 900
  // Breeze: a low-frequency sway keyed to world X/Z, so neighbouring trees move
  // together and a gust reads as travelling across the valley. Only the upper
  // vertices move; the base of each tree stays planted.
  const wind = { uWindT: { value: 0 }, uWindA: { value: reduce ? 0 : 1 } }
  const coneMat = track(paintedMaterial(ramp, { wind }))
  const cones = [
    track(new THREE.ConeGeometry(2.6, 5.5, 7).translate(0, 4.2, 0)),
    track(new THREE.ConeGeometry(2.0, 4.6, 7).translate(0, 7.0, 0)),
    track(new THREE.ConeGeometry(1.3, 3.6, 7).translate(0, 9.4, 0)),
  ]
  const trunkGeo = track(new THREE.CylinderGeometry(0.35, 0.5, 2.4, 6).translate(0, 1.2, 0))
  const trunkMat = track(paintedMaterial(ramp, { color: 0x3a2616 }))
  const inst = cones.map((g) => {
    const m = new THREE.InstancedMesh(g, coneMat, treeCount)
    scene.add(m)
    return m
  })
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount)
  scene.add(trunks)
  {
    let placed = 0, tries = 0
    const treeSpots: number[] = []
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3(), col = new THREE.Color()
    const yAxis = new THREE.Vector3(0, 1, 0)
    let seed = 12345
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
    while (placed < treeCount && tries < treeCount * 14) {
      tries++
      const tx = (rnd() - 0.5) * 760, tz = 90 - rnd() * 640
      const ty = heightAt(tx, tz)
      if (ty < 0.9 || ty > 70) continue
      const gx = (heightAt(tx + 2, tz) - heightAt(tx - 2, tz)) / 4
      const gz = (heightAt(tx, tz + 2) - heightAt(tx, tz - 2)) / 4
      if (Math.sqrt(gx * gx + gz * gz) > 0.75) continue
      if (fbm(tx * 0.018 + 9, tz * 0.018 + 4, 3) < 0.46) continue
      if (Math.abs(tx - pathX(tz)) < 16) continue
      if (tz > 40 && Math.abs(tx) < 60) continue
      if (bpos.some((b) => Math.hypot(tx - b.x, tz - b.z) < 20)) continue
      if (Math.hypot(tx - LAKE.x, tz - LAKE.z) < 33) continue
      const s = 0.55 + rnd() * 0.65
      pos.set(tx, ty - 0.2, tz)
      scl.set(s, s * (0.9 + rnd() * 0.5), s)
      q.setFromAxisAngle(yAxis, rnd() * 6.28)
      M.compose(pos, q, scl)
      col.setHSL(0.28 + rnd() * 0.07, 0.45 + rnd() * 0.15, 0.15 + rnd() * 0.08)
      for (let k = 0; k < 3; k++) { inst[k].setMatrixAt(placed, M); inst[k].setColorAt(placed, col) }
      trunks.setMatrixAt(placed, M)
      treeSpots.push(tx, tz)
      placed++
    }
    inst.forEach((m) => {
      m.count = placed
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    })
    trunks.count = placed
    trunks.instanceMatrix.needsUpdate = true
    // Forest floor: darken the ground vertex under each tree, the way a painter
    // shades the earth under a canopy instead of casting a shadow.
    const cell = SIZE / SEG
    const under = new Uint8Array(tp.count)
    for (let k = 0; k < treeSpots.length; k += 2) {
      const ix = Math.round((treeSpots[k] + SIZE / 2) / cell)
      const iz = Math.round((treeSpots[k + 1] + 420 + SIZE / 2) / cell)
      if (ix < 0 || iz < 0 || ix > SEG || iz > SEG) continue
      const vi = iz * (SEG + 1) + ix
      if (Math.abs(tp.getX(vi) - treeSpots[k]) > cell || Math.abs(tp.getZ(vi) - treeSpots[k + 1]) > cell) continue
      if (under[vi] < 255) under[vi]++
    }
    for (let vi = 0; vi < tp.count; vi++) {
      if (!under[vi]) continue
      const k = Math.max(0.62, Math.pow(0.84, under[vi]))
      tc[vi * 3] *= k; tc[vi * 3 + 1] *= k; tc[vi * 3 + 2] *= k
    }
    ;(tg.attributes.color as THREE.BufferAttribute).needsUpdate = true
  }
  const treeShown = trunks.count

  /* sprite textures */
  function radialTex(stops: Array<[number, string]>): THREE.CanvasTexture {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    stops.forEach(([at, color]) => r.addColorStop(at, color))
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
    const t = track(new THREE.CanvasTexture(c))
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  const fireTex = radialTex([[0, 'rgba(255,240,190,1)'], [0.25, 'rgba(255,170,60,.85)'], [0.6, 'rgba(255,110,30,.25)'], [1, 'rgba(255,90,20,0)']])
  const glowTex = radialTex([[0, 'rgba(255,190,90,.55)'], [0.4, 'rgba(255,140,50,.16)'], [1, 'rgba(255,120,40,0)']])
  const sparkTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(180,255,230,.7)'], [1, 'rgba(93,214,176,0)']])
  const blobTex = radialTex([[0, 'rgba(20,14,30,.6)'], [0.5, 'rgba(20,14,30,.32)'], [1, 'rgba(20,14,30,0)']])
  const blobGeo = track(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2))
  const blobMat = track(new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }))
  /** Soft contact shadow under a landmark, in place of a cast shadow. */
  const blob = (size: number, y = 0.25) => {
    const m = new THREE.Mesh(blobGeo, blobMat)
    m.scale.set(size, 1, size)
    m.position.y = y
    m.renderOrder = 1
    return m
  }

  function markerTex(score: number | null, fill: string): THREE.CanvasTexture {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    g.translate(64, 64)
    g.beginPath(); g.moveTo(0, -56); g.lineTo(50, 0); g.lineTo(0, 56); g.lineTo(-50, 0); g.closePath()
    g.fillStyle = fill; g.fill()
    g.lineWidth = 7; g.strokeStyle = '#0B0818'; g.stroke()
    g.fillStyle = '#0B0818'
    g.font = '700 46px "Helvetica Neue", Arial, sans-serif'
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(score === null ? '–' : String(score), 0, 4)
    const t = track(new THREE.CanvasTexture(c))
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }

  /* beacons */
  const stoneMat = track(paintedMaterial(ramp, { color: 0x6a5f80, rim: 0.55 }))
  const bowlMat = track(paintedMaterial(ramp, { color: 0x3d3450, rim: 0.4 }))
  const stoneGeo = track(new THREE.CylinderGeometry(2.2, 3.4, 15, 8))
  const beamGeo = track(new THREE.CylinderGeometry(1.1, 2.2, 340, 20, 1, true))
  const ringGeo = track(new THREE.RingGeometry(0.9, 1.25, 56))
  const bowlGeo = track(new THREE.CylinderGeometry(3.6, 2, 2, 8))
  const scores = opts.scores.slice(0, 4)
  while (scores.length < 4) scores.push(null)
  const beacons = scores.map((score, i) => {
    const { x, z, y } = bpos[i]
    const g = new THREE.Group()
    g.position.set(x, y, z)
    const stone = new THREE.Mesh(stoneGeo, stoneMat)
    stone.position.y = 7; g.add(stone)
    g.add(blob(13))
    const bowl = new THREE.Mesh(bowlGeo, bowlMat)
    bowl.position.y = 15.8; g.add(bowl)
    const fire = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })))
    fire.position.y = 19; fire.scale.set(8, 11, 1); g.add(fire)
    const halo = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })))
    halo.position.y = 19.5; halo.scale.set(52, 52, 1); g.add(halo)
    const light = new THREE.PointLight(0xffa040, 2, 60, 1.6)
    light.position.y = 19; g.add(light)
    const fill = tierColor(score).fill
    const mk = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: markerTex(score, fill), depthTest: false, transparent: true, sizeAttenuation: false, fog: false })))
    mk.position.y = 32; mk.scale.set(i === 0 ? 0.095 : 0.07, i === 0 ? 0.095 : 0.07, 1); mk.renderOrder = 20; g.add(mk)
    const ring = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(fill), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, sizeAttenuation: false, depthTest: false, fog: false })))
    ring.position.y = 32; ring.scale.set(0.16, 0.16, 1); ring.renderOrder = 19; ring.visible = i === 0; g.add(ring)
    const beam = new THREE.Mesh(beamGeo, track(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(0x5dd6b0) }, uT: { value: 0 } },
      vertexShader: 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec2 vU; uniform float uA,uT; uniform vec3 uC; void main(){ float a=pow(1.-vU.y,1.6)*uA*(.75+.25*sin(vU.y*60.-uT*5.)); gl_FragColor=vec4(uC*1.6,a); }',
    })))
    beam.position.y = 170; beam.frustumCulled = false; g.add(beam)
    const rg = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({ color: 0x5dd6b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })))
    rg.rotation.x = -Math.PI / 2; rg.position.y = 0.6; g.add(rg)
    scene.add(g)
    return { g, fire, halo, light, mk, ring, beam, rg, seed: i * 1.7, lit: true, claimed: false, burstT: -10, lastKey: '', view: null as BeaconView | null }
  })

  const markerCache = new Map<string, THREE.CanvasTexture>()
  const markerFor = (score: number | null, fill: string) => {
    const key = `${score}${fill}`
    let tex = markerCache.get(key)
    if (!tex) { tex = markerTex(score, fill); markerCache.set(key, tex) }
    return tex
  }
  function applyBeacon(i: number, view: BeaconView) {
    const b = beacons[i]
    if (!b) return
    const base = tierColor(scores[i]).fill
    const fill = view.state === 'claimed' ? '#5DD6B0' : view.state === 'dismissed' ? '#6E6590' : base
    const key = `${fill}${view.selected}${view.state}`
    b.view = view
    if (key === b.lastKey) return
    b.lastKey = key
    b.mk.material.map = markerFor(scores[i], fill)
    b.mk.material.needsUpdate = true
    const size = view.selected ? 0.095 : 0.07
    b.mk.scale.set(size, size, 1)
    b.ring.material.color.set(fill)
    b.ring.visible = view.selected
    b.lit = view.state === 'open'
    b.claimed = view.state === 'claimed'
  }

  /* keep landmark */
  {
    const kx = pathX(-250) + 55, kz = -250, ky = heightAt(kx, kz)
    const grp = new THREE.Group()
    grp.position.set(kx, ky - 1, kz)
    const keepMat = track(paintedMaterial(ramp, { color: 0x7a7090, rim: 0.45 }))
    const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), keepMat)
      m.position.set(x, y, z); grp.add(m)
    }
    box(22, 26, 18, 0, 13, 0); box(8, 40, 8, -12, 20, 4); box(8, 34, 8, 12, 17, -4); box(7, 52, 7, 0, 26, -10)
    for (let a = 0; a < 8; a++) box(2.4, 3, 2.4, -9 + a * 2.6, 27.5, 8)
    grp.add(blob(46, 1.3))
    const winMat = track(new THREE.MeshBasicMaterial({ color: 0xffb347 }))
    const winGeo = track(new THREE.PlaneGeometry(2, 3.4))
    ;([[0, 18, 9.2], [-12, 28, 8.1], [12, 24, 0.1], [0, 40, -6.4]] as const).forEach(([wx, wy, wz]) => {
      const win = new THREE.Mesh(winGeo, winMat)
      win.position.set(wx, wy, wz); grp.add(win)
    })
    grp.rotation.y = -0.3
    scene.add(grp)
  }

  /* hero figure */
  const fx = 8, fz = 40
  const fig = new THREE.Group()
  fig.position.set(fx, heightAt(fx, fz), fz)
  fig.rotation.y = -0.75
  const darkMat = track(paintedMaterial(ramp, { color: 0x1a1428, rim: 0.7, rimColor: 0xffc98a }))
  const cloak = new THREE.Mesh(track(new THREE.ConeGeometry(0.95, 3.3, 9)), darkMat)
  cloak.position.y = 1.65; fig.add(cloak)
  fig.add(blob(3.2, 0.12))
  const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.42, 12, 10)), darkMat)
  head.position.y = 3.45; fig.add(head)
  const hood = new THREE.Mesh(track(new THREE.ConeGeometry(0.62, 1.1, 9)), darkMat)
  hood.position.y = 3.75; fig.add(hood)
  const staff = new THREE.Mesh(track(new THREE.CylinderGeometry(0.06, 0.07, 4.6, 6)), track(paintedMaterial(ramp, { color: 0x4a3018 })))
  staff.position.set(1.0, 2.3, 0.2); fig.add(staff)
  const lamp = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: fireTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })))
  lamp.position.set(1.0, 4.9, 0.2); lamp.scale.set(1.6, 2.2, 1); fig.add(lamp)
  const lampHalo = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })))
  lampHalo.position.copy(lamp.position); lampHalo.scale.set(9, 9, 1); fig.add(lampHalo)
  const lampLight = new THREE.PointLight(0xffa850, 1.6, 30, 1.6)
  lampLight.position.copy(lamp.position); fig.add(lampLight)
  fig.scale.setScalar(1.5)
  scene.add(fig)

  /* embers */
  const EN = tier === 'high' ? 700 : 280
  const ep = new Float32Array(EN * 3), ev = new Float32Array(EN)
  for (let i = 0; i < EN; i++) {
    ep[i * 3] = (Math.random() - 0.5) * 220
    ep[i * 3 + 1] = Math.random() * 60
    ep[i * 3 + 2] = 90 - Math.random() * 260
    ev[i] = 1 + Math.random() * 2.2
  }
  const eg = track(new THREE.BufferGeometry())
  eg.setAttribute('position', new THREE.BufferAttribute(ep, 3))
  const emberMat = track(new THREE.PointsMaterial({ map: fireTex, size: 1.6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffb347, opacity: 0.85, sizeAttenuation: true }))
  const embers = new THREE.Points(eg, emberMat)
  embers.frustumCulled = false
  scene.add(embers)

  /* claim sparks */
  const SN = 160
  const sp = new Float32Array(SN * 3), svel = new Float32Array(SN * 3)
  const sg = track(new THREE.BufferGeometry())
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3))
  const sparkMat = track(new THREE.PointsMaterial({ map: sparkTex, size: 2.4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xbff7e6, sizeAttenuation: true }))
  const sparks = new THREE.Points(sg, sparkMat)
  sparks.frustumCulled = false
  sparks.visible = false
  scene.add(sparks)
  let sparkT = -10

  function doBurst(i: number) {
    const b = beacons[i]
    if (!b) return
    const now = performance.now() / 1000
    b.burstT = now
    sparkT = now
    const ox = b.g.position.x, oy = b.g.position.y + 19, oz = b.g.position.z
    for (let j = 0; j < SN; j++) {
      sp[j * 3] = ox; sp[j * 3 + 1] = oy; sp[j * 3 + 2] = oz
      const a = Math.random() * 6.28, up = Math.random() * 0.9 + 0.2, speed = 6 + Math.random() * 16
      svel[j * 3] = Math.cos(a) * speed * (1 - up * 0.4)
      svel[j * 3 + 1] = up * speed * 1.4
      svel[j * 3 + 2] = Math.sin(a) * speed * (1 - up * 0.4)
    }
    sparks.visible = true
  }

  /* mist */
  const mistMat = track(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color(0xaaaacc) }, uA: { value: 0.5 } },
    vertexShader: WORLD_VERT,
    fragmentShader: MIST_FRAG,
  }))
  const mistGeo = track(new THREE.PlaneGeometry(1800, 1800))
  ;[8, 26].forEach((y) => {
    const m = new THREE.Mesh(mistGeo, mistMat)
    m.rotation.x = -Math.PI / 2
    m.position.set(0, y, -350)
    m.renderOrder = 5
    scene.add(m)
  })

  /* drifting fog banks: soft billboards crossing the trench between the beacons */
  const BANKS = [
    { z: -62, lift: 7, w: 230, h: 34, speed: 2.6, phase: 0, alpha: 0.2 },
    { z: -118, lift: 12, w: 280, h: 44, speed: -1.7, phase: 90, alpha: 0.16 },
    { z: -176, lift: 9, w: 320, h: 50, speed: 1.2, phase: 170, alpha: 0.14 },
  ]
  const BANK_SPAN = 260
  const fogTex = radialTex([[0, 'rgba(255,255,255,.85)'], [0.45, 'rgba(255,255,255,.32)'], [1, 'rgba(255,255,255,0)']])
  const banks = BANKS.map((cfg) => {
    const sprite = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: 0 })))
    sprite.scale.set(cfg.w, cfg.h, 1)
    sprite.renderOrder = 6
    const cx = pathX(cfg.z)
    scene.add(sprite)
    return { sprite, cfg, cx, y: heightAt(cx, cfg.z) + cfg.lift }
  })
  const bankColor = new THREE.Color()
  let bankAlpha = 1
  function stepBanks(t: number) {
    banks.forEach(({ sprite, cfg, cx, y }) => {
      // Travel across a fixed span and wrap; fade out near the ends so the wrap never pops.
      const u = (((t * cfg.speed + cfg.phase) % BANK_SPAN) + BANK_SPAN) % BANK_SPAN / BANK_SPAN
      sprite.position.set(cx + (u - 0.5) * BANK_SPAN, y + Math.sin(t * 0.13 + cfg.phase) * 1.5, cfg.z)
      sprite.material.opacity = cfg.alpha * bankAlpha * Math.sin(Math.PI * u)
      sprite.material.color.copy(bankColor)
    })
  }

  /* post-processing (high tier only) */
  let composer: EffectComposer | null = null
  let bloom: UnrealBloomPass | null = null
  let grade: ShaderPass | null = null
  let width = 1, height = 1
  function buildComposer() {
    composer = new EffectComposer(renderer)
    composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap))
    composer.setSize(width, height)
    composer.addPass(new RenderPass(scene, camera))
    bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.6, 0.85, 0.9)
    composer.addPass(bloom)
    grade = new ShaderPass(GRADE_SHADER)
    composer.addPass(grade)
  }

  function resize() {
    width = Math.max(1, host.clientWidth)
    height = Math.max(1, host.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    if (composer) composer.setSize(width, height)
  }
  resize()
  if (tier === 'high') buildComposer()

  /* phase blending */
  let cur: Blend | null = null
  const sunDirC = new THREE.Vector3(0, 0.3, -1)
  const sunDirT = new THREE.Vector3()
  const lightDirV = new THREE.Vector3(0.4, 0.3, -0.8)
  function stepPhase(k: number) {
    const info = skyInfo(mode)
    const target = blendFor(PHASE_LOOKS[info.phase])
    sunDirT.set(...sunDirection(info))
    if (!cur) {
      cur = blendFor(PHASE_LOOKS[info.phase])
      sunDirC.copy(sunDirT)
    }
    for (const key of COLOR_KEYS) cur.colors[key].lerp(target.colors[key], k)
    for (const key of NUMBER_KEYS) cur.n[key] += (target.n[key] - cur.n[key]) * k
    sunDirC.lerp(sunDirT, k).normalize()
    const c = cur.colors, n = cur.n
    const u = skyMat.uniforms
    u.uTop.value.copy(c.top); u.uMid.value.copy(c.mid); u.uHor.value.copy(c.hor)
    u.uSunDir.value.copy(sunDirC); u.uSunCol.value.copy(c.sun)
    u.uSunI.value = n.sunI; u.uMoonO.value = n.moonO; u.uStars.value = n.stars
    u.uCloudC.value.copy(c.cloudC); u.uCloudS.value.copy(c.cloudS); u.uCover.value = n.cover
    const fog = scene.fog as THREE.FogExp2
    fog.color.copy(c.fog); fog.density = n.fogD * atmosphere
    // Less fill light than the realistic look had, so the painted bands keep their contrast.
    hemi.color.copy(c.hemiS); hemi.groundColor.copy(c.hemiG); hemi.intensity = n.hemiI * Math.PI * 0.8
    sun.color.copy(c.dirC); sun.intensity = n.dirI * Math.PI * (info.phase === 'night' ? 0.28 : 1)
    lightDirV.copy(info.phase === 'night' ? new THREE.Vector3(0.4, 0.55, -0.75) : sunDirC)
    lightDirV.y = Math.max(lightDirV.y, 0.1)
    lightDirV.normalize()
    const wu = waterMat.uniforms
    wu.uHor.value.copy(c.hor); wu.uTop.value.copy(c.top); wu.uSunDir.value.copy(sunDirC); wu.uSunCol.value.copy(c.sun)
    wu.uSunI.value = Math.max(n.sunI, n.moonO * 0.4); wu.uFog.value.copy(c.fog); wu.uFogD.value = n.fogD
    mistMat.uniforms.uC.value.copy(c.fog).lerp(c.hor, 0.35)
    const mistTarget = (info.phase === 'day' ? 0.18 : 0.5) * atmosphere
    mistMat.uniforms.uA.value += (mistTarget - mistMat.uniforms.uA.value) * k
    bankColor.copy(c.fog).lerp(c.hor, 0.5)
    bankAlpha += ((info.phase === 'day' ? 0.75 : 1) * atmosphere - bankAlpha) * k
    emberMat.opacity = info.phase === 'day' ? 0.35 : 0.85
    emberMat.color.set(info.phase === 'day' ? 0xfff2b0 : 0xffb347)
    if (bloom) bloom.strength = n.bloom
    if (grade) {
      grade.uniforms.uExp.value = n.exp
      grade.uniforms.uTint.value.copy(c.tint)
    } else {
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = n.exp
    }
  }

  /* camera rig */
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6, 44, 120), new THREE.Vector3(4, 26, 30), new THREE.Vector3(22, 30, -70), new THREE.Vector3(-30, 64, -40),
  ], false, 'catmullrom', 0.5)
  const look = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-58, 16, -150), new THREE.Vector3(-12, 12, -130), new THREE.Vector3(10, 24, -230), new THREE.Vector3(14, 20, -250),
  ], false, 'catmullrom', 0.5)
  const mouse = { x: 0, y: 0 }, mouseS = { x: 0, y: 0 }
  let prog = 0, progS = 0
  const onPointer = (e: PointerEvent) => {
    mouse.x = e.clientX / window.innerWidth - 0.5
    mouse.y = e.clientY / window.innerHeight - 0.5
  }
  window.addEventListener('pointermove', onPointer, { passive: true })
  const ro = new ResizeObserver(resize)
  ro.observe(host)

  /* loop */
  let raf = 0
  let paused = false
  let disposed = false
  let last = performance.now()
  let elapsed = 0, frames = 0, acc = 0, downgraded = false
  const tmpV = new THREE.Vector3(), lookV = new THREE.Vector3()

  function downgrade() {
    downgraded = true
    tier = 'low'
    renderer.setPixelRatio(1)
    composer?.dispose()
    composer = null
    bloom = null
    grade = null
    const cut = Math.floor(treeShown * 0.35)
    inst.forEach((m) => { m.count = cut })
    trunks.count = cut
    resize()
  }

  function renderFrame(dt: number) {
    elapsed += dt
    const t = elapsed
    stepPhase(reduce ? 1 : 0.035)
    const tt = reduce ? 4 : t
    skyMat.uniforms.uT.value = tt
    waterMat.uniforms.uT.value = tt
    mistMat.uniforms.uT.value = tt
    wind.uWindT.value = tt
    wind.uWindA.value = reduce ? 0 : 1
    stepBanks(tt)
    mouseS.x += (mouse.x - mouseS.x) * 0.04
    mouseS.y += (mouse.y - mouseS.y) * 0.04
    progS += (prog - progS) * (reduce ? 1 : 0.06)
    curve.getPoint(progS, tmpV)
    look.getPoint(progS, lookV)
    const sway = reduce ? 0 : 1
    const px = reduce ? 0 : mouseS.x
    const py = reduce ? 0 : mouseS.y
    camera.position.set(
      tmpV.x + px * 7 + Math.sin(tt * 0.11) * 3 * sway,
      tmpV.y - py * 3 + Math.sin(tt * 0.17) * 0.8 * sway,
      tmpV.z + Math.sin(tt * 0.07) * 2 * sway,
    )
    camera.lookAt(lookV.x + px * 5, lookV.y, lookV.z)
    // Pointer tilt: up to 1.5 degrees of yaw and pitch, damped by mouseS above.
    camera.rotateY(-px * 2 * TILT)
    camera.rotateX(-py * 2 * TILT)
    sky.position.copy(camera.position)
    const gh = heightAt(camera.position.x, camera.position.z) + 3
    if (camera.position.y < gh) camera.position.y = gh
    sun.target.position.set(camera.position.x, 0, camera.position.z - 70)
    sun.position.copy(sun.target.position).addScaledVector(lightDirV, 300)
    const lampK = cur ? cur.n.lamp : 1
    const now = performance.now() / 1000
    beacons.forEach((b) => {
      const fl = 0.85 + 0.15 * Math.sin(tt * 11 + b.seed) + 0.1 * Math.sin(tt * 23 + b.seed * 3)
      // A slow, rhythmic swell under the flicker, like a lamp keeper trimming the wick.
      const swell = reduce ? 1 : 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(tt * 1.25 + b.seed * 2.1))
      b.fire.visible = b.lit
      b.halo.visible = b.lit
      b.fire.scale.set(8 * fl, 11 * fl * (1 + 0.1 * Math.sin(tt * 7 + b.seed)), 1)
      b.halo.material.opacity = Math.min(1, 0.5 + lampK * 0.4) * swell
      b.halo.scale.setScalar(52 * (0.9 + 0.1 * swell))
      b.light.intensity = (b.lit ? 1 : 0) * (1.4 + lampK * 1.8) * fl * swell * Math.PI
      if (b.ring.visible) b.ring.scale.setScalar(0.16 + 0.015 * Math.sin(tt * 4))
      b.mk.position.y = 32 + Math.sin(tt * 2 + b.seed) * 0.7
      const bt = now - b.burstT
      const bu = (b.beam.material as THREE.ShaderMaterial).uniforms
      bu.uT.value = tt
      bu.uA.value = (b.claimed ? 0.26 : 0) + (bt < 3.2 ? 0.9 * Math.pow(1 - bt / 3.2, 1.5) : 0)
      const rgm = b.rg.material as THREE.MeshBasicMaterial
      if (bt < 1.6) {
        const k = 1 + bt * 42
        b.rg.scale.set(k, k, 1)
        rgm.opacity = 1 - bt / 1.6
      } else rgm.opacity = 0
    })
    lamp.scale.set(1.6 * (0.9 + 0.1 * Math.sin(tt * 13)), 2.2 * (0.9 + 0.12 * Math.sin(tt * 9)), 1)
    lampLight.intensity = (1.0 + lampK * 1.2) * (0.9 + 0.1 * Math.sin(tt * 12)) * Math.PI
    if (!reduce) {
      cloak.rotation.z = Math.sin(tt * 1.7) * 0.025
      cloak.scale.x = 1 + Math.sin(tt * 2.1) * 0.03
      const epos = eg.attributes.position as THREE.BufferAttribute
      for (let e = 0; e < EN; e++) {
        let yy = epos.getY(e) + ev[e] * dt * 3.2
        if (yy > 70) {
          yy = 0
          epos.setX(e, camera.position.x + (Math.random() - 0.5) * 220)
          epos.setZ(e, camera.position.z - Math.random() * 240)
        }
        epos.setY(e, yy)
        epos.setX(e, epos.getX(e) + Math.sin(tt * 0.6 + e) * dt * 0.8)
      }
      epos.needsUpdate = true
    }
    if (sparks.visible) {
      const st = now - sparkT
      for (let j = 0; j < SN; j++) {
        svel[j * 3 + 1] -= 22 * dt
        sp[j * 3] += svel[j * 3] * dt
        sp[j * 3 + 1] += svel[j * 3 + 1] * dt
        sp[j * 3 + 2] += svel[j * 3 + 2] * dt
      }
      ;(sg.attributes.position as THREE.BufferAttribute).needsUpdate = true
      sparkMat.opacity = Math.max(0, 1 - st / 2.2)
      if (st > 2.4) sparks.visible = false
    }
    if (grade) grade.uniforms.uTime.value = t
    if (composer) composer.render()
    else renderer.render(scene, camera)
  }

  function frame(now: number) {
    if (disposed) return
    raf = requestAnimationFrame(frame)
    if (paused) { last = now; return }
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    frames++
    acc += dt
    if (frames === 80 && acc / frames > 0.045 && !downgraded) downgrade()
    renderFrame(dt)
  }

  stepPhase(1)
  renderFrame(0.016)
  raf = requestAnimationFrame(frame)

  return {
    setMode(next) { mode = next },
    setProgress(p) { prog = Math.min(1, Math.max(0, p)) },
    setPaused(next) { paused = next; last = performance.now() },
    setReducedMotion(next) { reduce = next },
    setBeacons(views) { views.forEach((v, i) => applyBeacon(i, v)) },
    setScores(next) {
      beacons.forEach((b, i) => {
        const score = next[i] ?? null
        if (score === scores[i]) return
        scores[i] = score
        b.lastKey = ''
        applyBeacon(i, b.view ?? { state: 'open', selected: i === 0 })
      })
    },
    burst(index) { doBurst(index) },
    snap() { stepPhase(1); renderFrame(0.016) },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      ro.disconnect()
      composer?.dispose()
      disposables.forEach((d) => d.dispose())
      inst.forEach((m) => m.dispose())
      trunks.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
