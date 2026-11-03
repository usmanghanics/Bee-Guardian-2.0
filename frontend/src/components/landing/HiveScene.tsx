import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const R = 0.5 // cell circumradius
const RINGS = 5

function hexShape(r: number, hole?: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6
    const x = Math.cos(a) * r, y = Math.sin(a) * r
    i ? s.lineTo(x, y) : s.moveTo(x, y)
  }
  s.closePath()
  if (hole) {
    const h = new THREE.Path()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6
      const x = Math.cos(a) * hole, y = Math.sin(a) * hole
      i ? h.lineTo(x, y) : h.moveTo(x, y)
    }
    h.closePath()
    s.holes.push(h)
  }
  return s
}

type Cell = { x: number; z: number; d: number; seed: number; capped: boolean; sensor: boolean }
function makeCells(): Cell[] {
  const out: Cell[] = []
  const w = Math.sqrt(3) * R
  for (let q = -RINGS; q <= RINGS; q++)
    for (let r = Math.max(-RINGS, -q - RINGS); r <= Math.min(RINGS, -q + RINGS); r++) {
      const x = w * (q + r / 2), z = 1.5 * R * r
      const d = Math.hypot(x, z)
      const seed = Math.abs(Math.sin(q * 12.9898 + r * 78.233) * 43758.5453) % 1
      out.push({ x, z, d, seed, capped: seed > 0.78, sensor: (q === 1 && r === -1) || (q === -2 && r === 1) || (q === 2 && r === 2) })
    }
  return out
}

function Comb({ reduced }: { reduced: boolean }) {
  const cells = useMemo(makeCells, [])
  const walls = useRef<THREE.InstancedMesh>(null)
  const honey = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  const wallGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(hexShape(R * 0.98, R * 0.8), { depth: 1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])
  const honeyGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(hexShape(R * 0.8), { depth: 1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  useEffect(() => {
    const c = new THREE.Color()
    cells.forEach((cell, i) => {
      c.set(cell.capped ? '#d9a441' : cell.sensor ? '#e6b450' : '#a8681a').offsetHSL(0, 0, (cell.seed - 0.5) * 0.08)
      walls.current?.setColorAt(i, c)
      c.set(cell.sensor ? '#ffb11a' : cell.capped ? '#e8b85a' : '#e08a0b').offsetHSL(0, 0, (cell.seed - 0.5) * 0.1)
      honey.current?.setColorAt(i, c)
    })
    if (walls.current?.instanceColor) walls.current.instanceColor.needsUpdate = true
    if (honey.current?.instanceColor) honey.current.instanceColor.needsUpdate = true
  }, [cells])

  const m = useMemo(() => new THREE.Matrix4(), [])
  const p = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const s = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    const t = reduced ? 0 : state.clock.elapsedTime
    cells.forEach((cell, i) => {
      const wave = Math.sin(cell.d * 1.1 - t * 1.3) * 0.5 + 0.5
      const h = 0.35 + wave * 0.55 + cell.seed * 0.25 + (cell.sensor ? 0.35 : 0) - cell.d * 0.04
      p.set(cell.x, 0, cell.z)
      s.set(1, Math.max(0.12, h), 1)
      m.compose(p, q, s)
      walls.current?.setMatrixAt(i, m)
      const fill = cell.capped ? 1.0 : 0.35 + (Math.sin(t * 0.9 + cell.seed * 6.28) * 0.5 + 0.5) * 0.55
      s.set(1, Math.max(0.08, h * fill), 1)
      m.compose(p, q, s)
      honey.current?.setMatrixAt(i, m)
    })
    if (walls.current) walls.current.instanceMatrix.needsUpdate = true
    if (honey.current) honey.current.instanceMatrix.needsUpdate = true
    if (group.current) {
      group.current.rotation.y += reduced ? 0 : dt * 0.06
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.08 + pointer.y * 0.12, 0.04)
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -pointer.x * 0.1, 0.04)
    }
  })

  return (
    <group ref={group} position={[0, -0.6, 0]}>
      <instancedMesh ref={walls} args={[wallGeo, undefined, cells.length]} castShadow receiveShadow>
        <meshPhysicalMaterial roughness={0.55} metalness={0} clearcoat={0.25} clearcoatRoughness={0.6} sheen={0.4} sheenColor="#ffd88a" />
      </instancedMesh>
      <instancedMesh ref={honey} args={[honeyGeo, undefined, cells.length]}>
        <meshPhysicalMaterial roughness={0.1} metalness={0} clearcoat={1} clearcoatRoughness={0.04} emissive="#b35a00" emissiveIntensity={0.45} />
      </instancedMesh>
    </group>
  )
}

export default function HiveScene() {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  useEffect(() => {
    if (!wrap.current) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(wrap.current)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.6]}
        camera={{ position: [0, 7.6, 8.6], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ camera }) => camera.lookAt(0, -0.4, 0)}
      >
        <ambientLight intensity={0.18} />
        <directionalLight position={[4, 8, 3]} intensity={1.5} color="#ffe6b8" />
        <directionalLight position={[-6, 3, -4]} intensity={1.1} color="#ff9d2e" />
        <pointLight position={[0, 2.2, 0]} intensity={9} distance={6} color="#ffa21a" />
        <Comb reduced={reduced} />
        {!reduced && <Sparkles count={60} scale={[9, 3, 9]} position={[0, 1.2, 0]} size={2.2} speed={0.35} color="#ffd27a" opacity={0.8} />}
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={1.1} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} color="#fff3d6" />
          <Lightformer form="rect" intensity={0.8} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#ffb84d" />
          <Lightformer form="ring" intensity={0.9} position={[4, 2, 4]} scale={3} color="#ffe2a0" />
        </Environment>
      </Canvas>
    </div>
  )
}
