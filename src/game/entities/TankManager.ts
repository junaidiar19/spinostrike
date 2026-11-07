import * as THREE from 'three'
import { Tank } from './Tank'
import { useGameStore } from '../../stores/useGameStore'
import type { BulletManager } from '../weapons/BulletManager'
import type { Player } from './Player'
import type { MapId } from '../../types/game.types'

export class TankManager {
  private scene: THREE.Scene
  private bulletManager: BulletManager
  public tanks: Tank[] = []
  public collidableMeshes: THREE.Object3D[] = []

  constructor(scene: THREE.Scene, bulletManager: BulletManager) {
    this.scene = scene
    this.bulletManager = bulletManager
  }

  public spawnTanksForMap(mapId: MapId) {
    this.cleanup()

    const spawnPoints: { pos: THREE.Vector3; yaw: number }[] = []

    switch (mapId) {
      case 'dust_arena':
        spawnPoints.push({ pos: new THREE.Vector3(0, 0, 0), yaw: 0 })
        break
      case 'warehouse':
        spawnPoints.push({ pos: new THREE.Vector3(0, 0, -4), yaw: Math.PI / 2 })
        break
      case 'arctic_outpost':
        spawnPoints.push({ pos: new THREE.Vector3(0, 0, 8), yaw: 0 })
        break
      case 'italian_villa':
        spawnPoints.push({ pos: new THREE.Vector3(0, 0, 0), yaw: 0 })
        break
      case 'cargo_harbor':
        spawnPoints.push({ pos: new THREE.Vector3(0, 0, 0), yaw: -Math.PI / 2 })
        break
    }

    spawnPoints.forEach((sp) => {
      const tank = new Tank(sp.pos, sp.yaw, this.bulletManager)
      this.tanks.push(tank)
      this.scene.add(tank.mesh)
      this.collidableMeshes.push(tank.mesh)
    })
  }

  public update(
    dt: number,
    player: Player,
    camera: THREE.Camera,
    input: {
      fwd: number
      rgt: number
      shoot: boolean
      aim: boolean
      dx: number
      dy: number
      interactTank: boolean
    },
    collidableMeshes: THREE.Object3D[],
    allTargets: THREE.Object3D[]
  ) {
    const store = useGameStore.getState()
    let nearestTank: Tank | null = null
    let nearestDist = Infinity

    // Find nearest unoccupied tank
    this.tanks.forEach((tank) => {
      if (!tank.isDestroyed && !tank.isOccupied) {
        const dist = tank.position.distanceTo(player.position)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestTank = tank
        }
      }
    })

    // Check interaction range (< 4.5m)
    const targetTank = nearestTank as Tank | null
    const isClose = nearestDist <= 4.5 && targetTank !== null

    if (isClose && targetTank && !store.isDrivingTank) {
      store.setIsNearTank(true, 'TEKAN [E] UNTUK NAIK TANK TEMPUR')
      if (input.interactTank) {
        targetTank.boardTank(player)
      }
    } else if (!store.isDrivingTank) {
      store.setIsNearTank(false, null)
    }

    // Update all tanks
    this.tanks.forEach((tank) => {
      if (tank.isOccupied) {
        // Handle exit tank key
        if (input.interactTank) {
          tank.ejectDriver()
          return
        }

        // Update tank driving & weapons
        tank.update(dt, input, collidableMeshes, allTargets)

        // Lock player position to tank
        player.position.copy(tank.position)
        player.position.y = 1.6

        // Position camera in 3rd person chase view
        const { pos, lookAt } = tank.getCameraPosition()
        camera.position.lerp(pos, Math.min(1.0, dt * 16))
        camera.lookAt(lookAt)
      } else {
        tank.update(dt, { fwd: 0, rgt: 0, shoot: false, aim: false, dx: 0, dy: 0 }, collidableMeshes, allTargets)
      }
    })
  }

  public getOccupiedTank(): Tank | null {
    return this.tanks.find((t) => t.isOccupied) || null
  }

  public cleanup() {
    this.tanks.forEach((tank) => {
      this.scene.remove(tank.mesh)
    })
    this.tanks = []
    this.collidableMeshes = []
  }
}
