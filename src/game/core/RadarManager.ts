import type { Team } from '../../types/game.types'

export interface RadarPing {
  id: string
  x: number
  z: number
  team: Team
  timestamp: number
  duration: number
}

class RadarManager {
  private pings: RadarPing[] = []
  private pingCounter = 0

  public addGunfirePing(x: number, z: number, team: Team) {
    this.pingCounter++
    this.pings.push({
      id: `ping_${this.pingCounter}_${Date.now()}`,
      x,
      z,
      team,
      timestamp: performance.now(),
      duration: 2500 // 2.5 seconds pulse duration
    })

    // Cap maximum pings
    if (this.pings.length > 30) {
      this.pings.shift()
    }
  }

  public getActivePings(): RadarPing[] {
    const now = performance.now()
    this.pings = this.pings.filter((p) => now - p.timestamp < p.duration)
    return this.pings
  }

  public clear() {
    this.pings = []
  }
}

export const radarManager = new RadarManager()
