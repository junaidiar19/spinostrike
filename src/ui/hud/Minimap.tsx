import React, { useEffect, useRef, useState } from 'react'
import { gameEngine } from '../../game/core/GameEngine'
import { realtimeManager } from '../../services/supabase/realtime'
import { radarManager } from '../../game/core/RadarManager'
import { useGameStore } from '../../stores/useGameStore'
import { useRoomStore } from '../../stores/useRoomStore'
import type { MapId } from '../../types/game.types'

// Bomb site world coordinates per map
const BOMB_SITES: Record<MapId, { a: { x: number; z: number; name: string }; b: { x: number; z: number; name: string } }> = {
  dust_arena: {
    a: { x: 32, z: -25, name: 'A' },
    b: { x: -34, z: -25, name: 'B' }
  },
  warehouse: {
    a: { x: 24, z: -18, name: 'A' },
    b: { x: -24, z: 18, name: 'B' }
  },
  arctic_outpost: {
    a: { x: 28, z: -20, name: 'A' },
    b: { x: -28, z: -20, name: 'B' }
  },
  italian_villa: {
    a: { x: 25, z: -22, name: 'A' },
    b: { x: -25, z: 22, name: 'B' }
  },
  cargo_harbor: {
    a: { x: 30, z: -20, name: 'A' },
    b: { x: -30, z: 20, name: 'B' }
  }
}

// Tactical Indonesian sector name calculation
function getSectorCallout(x: number, z: number, mapId: MapId): string {
  switch (mapId) {
    case 'dust_arena':
      if (z > 32) return 'MARKAS CT'
      if (z < -38) return 'MARKAS T'
      if (x > 18 && z < 5) return 'SITUS BOM A'
      if (x > 18 && z >= 5) return 'JALUR A-LONG'
      if (x < -18 && z < 0) return 'SITUS BOM B'
      if (x < -18 && z >= 0) return 'TEROWONGAN B'
      return 'MID BAZAAR'

    case 'warehouse':
      if (z > 35) return 'DERMAGA CT'
      if (z < -35) return 'HANGAR T'
      if (x > 14) return 'MEZZANINE A'
      if (x < -14) return 'SEKTOR B FORKLIFT'
      return 'GUDANG UTAMA'

    case 'arctic_outpost':
      if (z > 32) return 'HELIPAD CT'
      if (z < -32) return 'BUNKER T'
      if (x > 16) return 'MENARA RADAR A'
      if (x < -16) return 'DEPOT BBM B'
      return 'MID SALJU'

    case 'italian_villa':
      if (z > 32) return 'PIAZZA CT'
      if (z < -32) return 'HALAMAN VILLA T'
      if (x > 14) return 'CAMPANILE SITE A'
      if (x < -14) return 'BISTRO SITE B'
      return 'AIR MANCUR MID'

    case 'cargo_harbor':
      if (z > 32) return 'KANTOR PABEAN CT'
      if (z < -32) return 'GERBANG T'
      if (x > 16) return 'DEREK GANTRY A'
      if (x < -16) return 'LABIRIN KONTAINER B'
      return 'DERMAGA UTAMA'

    default:
      return 'ZONA TEMPUR'
  }
}

export const Minimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentMap = useGameStore((state) => state.currentMap)
  const myTeam = useRoomStore((state) => state.myTeam)
  const [zoomRange, setZoomRange] = useState<number>(45) // 45m default tactical radius
  const [sectorName, setSectorName] = useState<string>('MEMUAT...')

  useEffect(() => {
    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let sweepAngle = 0

    const render = () => {
      animId = requestAnimationFrame(render)

      if (!gameEngine || !gameEngine.player) return

      const player = gameEngine.player
      const px = player.position.x
      const pz = player.position.z
      const yaw = player.yaw // Radians

      // Update sector name every frame or smooth
      const currentSector = getSectorCallout(px, pz, currentMap)
      setSectorName(currentSector)

      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2
      const radius = cx - 8 // Circular radar boundary

      ctx.clearRect(0, 0, w, h)

      // 1. Radar Circular Mask & Base Background
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()

      // Radial dark glass tactical background
      const bgGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius)
      bgGrad.addColorStop(0, '#0a101d')
      bgGrad.addColorStop(0.7, '#070c16')
      bgGrad.addColorStop(1, '#04070d')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // 2. Concentric Distance Grid Rings (15m, 30m, 45m)
      ctx.lineWidth = 1.2
      const ringSteps = [0.33, 0.66, 1.0]
      ringSteps.forEach((step, idx) => {
        ctx.beginPath()
        ctx.arc(cx, cy, radius * step, 0, Math.PI * 2)
        ctx.strokeStyle = idx === 2 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.15)'
        ctx.stroke()
      })

      // Crosshair Grid Axes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(cx, cy - radius)
      ctx.lineTo(cx, cy + radius)
      ctx.moveTo(cx - radius, cy)
      ctx.lineTo(cx + radius, cy)
      ctx.stroke()
      ctx.setLineDash([])

      // 3. Rotating Radar Sweep Scan Beam
      sweepAngle = (sweepAngle + 0.035) % (Math.PI * 2)
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0)')
      sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.15)')

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, sweepAngle - 0.45, sweepAngle)
      ctx.closePath()
      ctx.fillStyle = sweepGrad
      ctx.fill()

      // Bright sweep leading edge
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius)
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // Helper function: Convert world coordinate to radar canvas coordinate
      // Centered at player, rotated by player's yaw so forward is ALWAYS UP (-Y)!
      const worldToRadar = (wx: number, wz: number) => {
        const dx = wx - px
        const dz = wz - pz

        // In Three.js: 0 yaw points to -Z (North).
        // To rotate by yaw:
        const cosY = Math.cos(yaw)
        const sinY = Math.sin(yaw)

        // Rotate delta
        const rx = dx * cosY - dz * sinY
        const rz = dx * sinY + dz * cosY

        const pixelsPerMeter = radius / zoomRange
        return {
          x: cx + rx * pixelsPerMeter,
          y: cy + rz * pixelsPerMeter
        }
      }

      // 4. Render Bomb Sites [ A ] and [ B ]
      const sites = BOMB_SITES[currentMap] || BOMB_SITES.dust_arena
      const siteTargets = [sites.a, sites.b]

      siteTargets.forEach((site) => {
        const pt = worldToRadar(site.x, site.z)
        const distFromCenter = Math.hypot(pt.x - cx, pt.y - cy)

        // If off radar edge, clamp to radar perimeter
        let drawX = pt.x
        let drawY = pt.y
        if (distFromCenter > radius - 14) {
          const angle = Math.atan2(pt.y - cy, pt.x - cx)
          drawX = cx + Math.cos(angle) * (radius - 14)
          drawY = cy + Math.sin(angle) * (radius - 14)
        }

        // Bomb Site Badge
        ctx.beginPath()
        ctx.arc(drawX, drawY, 8.5, 0, Math.PI * 2)
        ctx.fillStyle = '#f59e0b'
        ctx.fill()
        ctx.lineWidth = 1.8
        ctx.strokeStyle = '#fff'
        ctx.stroke()

        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 9px Rajdhani, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(site.name, drawX, drawY + 0.5)
      })

      // 5. Render Active Gunfire Pings (Expanding Red Ripple Waves)
      const now = performance.now()
      const activePings = radarManager.getActivePings()

      activePings.forEach((ping) => {
        const pt = worldToRadar(ping.x, ping.z)
        const elapsed = now - ping.timestamp
        const progress = Math.min(1, elapsed / ping.duration)
        const pingRadius = 6 + progress * 24
        const pingAlpha = (1 - progress) * 0.85

        const isTeammatePing = ping.team === myTeam

        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pingRadius, 0, Math.PI * 2)
        ctx.strokeStyle = isTeammatePing
          ? `rgba(56, 189, 248, ${pingAlpha})`
          : `rgba(239, 68, 68, ${pingAlpha})`
        ctx.lineWidth = 2.2
        ctx.stroke()

        // Center dot
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = isTeammatePing
          ? `rgba(56, 189, 248, ${1 - progress})`
          : `rgba(239, 68, 68, ${1 - progress})`
        ctx.fill()
      })

      // 6. Render Bots (Teammates & Enemies)
      if (gameEngine.botManager && gameEngine.botManager.bots) {
        gameEngine.botManager.bots.forEach((bot) => {
          if (bot.isDead) return
          const pt = worldToRadar(bot.position.x, bot.position.z)
          const dist = Math.hypot(pt.x - cx, pt.y - cy)
          if (dist > radius - 6) return // Outside radar scope

          const isTeammate = bot.team === myTeam

          // Dot
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2)
          ctx.fillStyle = isTeammate ? '#38bdf8' : '#ef4444'
          ctx.fill()
          ctx.lineWidth = 1.2
          ctx.strokeStyle = '#ffffff'
          ctx.stroke()

          // Teammate direction tick
          if (isTeammate) {
            const botRelativeAngle = bot.mesh.rotation.y - yaw - Math.PI / 2
            ctx.beginPath()
            ctx.moveTo(pt.x, pt.y)
            ctx.lineTo(
              pt.x + Math.cos(botRelativeAngle) * 8,
              pt.y + Math.sin(botRelativeAngle) * 8
            )
            ctx.strokeStyle = '#38bdf8'
            ctx.lineWidth = 2
            ctx.stroke()
          }
        })
      }

      // 7. Render Remote Players (Multiplayer)
      if (realtimeManager.remotePlayers) {
        realtimeManager.remotePlayers.forEach((rp) => {
          if (rp.isDead) return
          const pt = worldToRadar(rp.targetPosition.x, rp.targetPosition.z)
          const dist = Math.hypot(pt.x - cx, pt.y - cy)
          if (dist > radius - 6) return

          const isTeammate = rp.team === myTeam

          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2)
          ctx.fillStyle = isTeammate ? '#0284c7' : '#dc2626'
          ctx.fill()
          ctx.lineWidth = 1.5
          ctx.strokeStyle = '#fff'
          ctx.stroke()

          // Name label for teammates
          if (isTeammate) {
            ctx.fillStyle = '#bae6fd'
            ctx.font = '700 8px Rajdhani, monospace'
            ctx.textAlign = 'center'
            ctx.fillText(rp.name.slice(0, 8), pt.x, pt.y - 7)
          }
        })
      }

      // 8. Player Vision Cone (Field of View Light Beam projecting forward)
      const coneGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius * 0.75)
      coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)')
      coneGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.08)')
      coneGrad.addColorStop(1, 'rgba(56, 189, 248, 0)')

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      // Vision cone FOV ~70 deg projecting UP (-Math.PI/2)
      ctx.arc(cx, cy, radius * 0.75, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6)
      ctx.closePath()
      ctx.fillStyle = coneGrad
      ctx.fill()
      ctx.restore()

      // 9. Local Player Marker (Center Arrow pointing UP)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.beginPath()
      ctx.moveTo(0, -9) // Tip
      ctx.lineTo(6, 6)  // Right base
      ctx.lineTo(0, 3)  // Inward notch
      ctx.lineTo(-6, 6) // Left base
      ctx.closePath()
      ctx.fillStyle = '#38bdf8'
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
      ctx.restore()

      ctx.restore() // End of circular mask

      // 10. Outer Compass Ticks & Cardinal Markings (Rotates with yaw)
      const compassLetters = [
        { label: 'U', angle: 0 },              // North (Utara)
        { label: 'T', angle: Math.PI / 2 },    // East (Timur)
        { label: 'S', angle: Math.PI },        // South (Selatan)
        { label: 'B', angle: (3 * Math.PI) / 2 } // West (Barat)
      ]

      compassLetters.forEach((cardinal) => {
        // Rotating compass: offset by yaw - Math.PI/2 so North aligns to world -Z
        const screenAngle = cardinal.angle - yaw - Math.PI / 2
        const letterX = cx + Math.cos(screenAngle) * (radius - 8)
        const letterY = cy + Math.sin(screenAngle) * (radius - 8)

        ctx.fillStyle = cardinal.label === 'U' ? '#ef4444' : 'rgba(255, 255, 255, 0.75)'
        ctx.font = 'bold 9px Rajdhani, monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cardinal.label, letterX, letterY)
      })

      // 11. High-Tech Outer Bezel Rim
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.lineWidth = 2.5
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)'
      ctx.stroke()

      // Outer bezel tick marks (every 30 degrees)
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const x1 = cx + Math.cos(a) * (radius - 2)
        const y1 = cy + Math.sin(a) * (radius - 2)
        const x2 = cx + Math.cos(a) * (radius + 3)
        const y2 = cy + Math.sin(a) * (radius + 3)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [currentMap, myTeam, zoomRange])

  const toggleZoom = () => {
    setZoomRange((prev) => (prev === 45 ? 75 : 45))
  }

  return (
    <div className="tactical-minimap-container">
      {/* Sector Callout Header Tag */}
      <div className="radar-sector-badge">
        <span className="radar-status-dot" />
        <span className="radar-sector-text">{sectorName}</span>
      </div>

      {/* Circular Radar Canvas */}
      <div className="radar-canvas-wrapper" onClick={toggleZoom} title="Klik untuk ubah zoom radar (45m / 75m)">
        <canvas
          ref={canvasRef}
          width={180}
          height={180}
          className="radar-canvas"
        />

        {/* Zoom scale indicator overlay */}
        <div className="radar-zoom-badge">
          {zoomRange}m
        </div>
      </div>
    </div>
  )
}
