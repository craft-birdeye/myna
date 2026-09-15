import { useMemo } from 'react'

// A deterministic stand-in QR code — ported from the prototype's own `QrMock`
// (public/super-agent-prototype.html): same seeded PRNG so it renders identically
// every time, with the three finder squares that make it read as a real QR code.
export function QrMock({ size = 168, cells = 25 }: { size?: number; cells?: number }) {
  const mods = useMemo(() => {
    const out: [number, number][] = []
    let seed = 20260909
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    const finder = (r: number, c: number) =>
      (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (finder(r, c)) continue
        if (rnd() > 0.55) out.push([r, c])
      }
    }
    return out
  }, [cells])

  const u = size / cells
  const Finder = ({ r, c }: { r: number; c: number }) => (
    <g>
      <rect x={c * u} y={r * u} width={u * 7} height={u * 7} rx={u} fill="#111" />
      <rect x={(c + 1) * u} y={(r + 1) * u} width={u * 5} height={u * 5} rx={u * 0.7} fill="#fff" />
      <rect x={(c + 2) * u} y={(r + 2) * u} width={u * 3} height={u * 3} rx={u * 0.5} fill="#111" />
    </g>
  )

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Pairing code" role="img" className="block rounded-sm bg-white">
      {mods.map(([r, c], i) => (
        <rect key={i} x={c * u} y={r * u} width={u} height={u} fill="#111" />
      ))}
      <Finder r={0} c={0} />
      <Finder r={0} c={cells - 7} />
      <Finder r={cells - 7} c={0} />
    </svg>
  )
}
