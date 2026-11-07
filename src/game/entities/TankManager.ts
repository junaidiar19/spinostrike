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
  private interactionCooldown: number = 0

  constructor(scene: THREE.Scene, bulletManager: BulletManager) {
    this.scene = scene
    this.bulletManager = bulletManager
  }

  public spawnTanksForMap(mapId: MapId) {
    this.cleanup()

    const spawnPoints: { pos: THREE.Vector3; yaw: number }[] = []

    switch (mapId) {
      case 'dust_arena':
        // Spawn CT Tank directly beside player spawn (0, 1.5, 96) for instant boarding
        spawnPoints.push({ pos: new THREE.Vector3(5, 0, 92), yaw: Math.PI }) // CT Base Tank (Immediate view!)
        spawnPoints.push({ pos: new THREE.Vector3(-5, 0, -92), yaw: 0 })     // T Base Tank
        spawnPoints.push({ pos: new THREE.Vector3(0, 0, 0), yaw: Math.PI / 2 }) // Mid Tank
        break
      case 'warehouse':
        spawnPoints.push({ pos: new THREE.Vector3(6, 0, 88), yaw: Math.PI }) // CT Dock Tank (Immediate view!)
        spawnPoints.push({ pos: new THREE.Vector3(-6, 0, -88), yaw: 0 })     // T Dock Tank
        spawnPoints.push({ pos: new THREE.Vector3(0, 0, 0), yaw: Math.PI / 2 }) // Main Floor Tank
        break
      case 'arctic_outpost':
        spawnPoints.push({ pos: new THREE.Vector3(6, 0, 92), yaw: Math.PI }) // CT Base Tank (Immediate view!)
        spawnPoints.push({ pos: new THREE.Vector3(-6, 0, -92), yaw: 0 })     // T Base Tank
        spawnPoints.push({ pos: new THREE.Vector3(64, 0, 36), yaw: 0 })      // Helipad Tank
        break
      case 'italian_villa':
        spawnPoints.push({ pos: new THREE.Vector3(6, 0, 92), yaw: Math.PI }) // CT Gate Tank (Immediate view!)
        spawnPoints.push({ pos: new THREE.Vector3(-6, 0, -92), yaw: 0 })     // T Gate Tank
        spawnPoints.push({ pos: new THREE.Vector3(18, 0, 0), yaw: 0 })       // Piazza Tank
        break
      case 'cargo_harbor':
        spawnPoints.push({ pos: new THREE.Vector3(6, 0, 92), yaw: Math.PI }) // CT Wharf Tank (Immediate view!)
        spawnPoints.push({ pos: new THREE.Vector3(-6, 0, -92), yaw: 0 })     // T Wharf Tank
        spawnPoints.push({ pos: new THREE.Vector3(0, 0, 0), yaw: -Math.PI / 2 }) // Crane Pier Tank
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

    // Decrement debounce timer
    if (this.interactionCooldown > 0) {
      this.interactionCooldown = Math.max(0, this.interactionCooldown - dt)
    }

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

    // Generous interaction range (9.5m radius covers all angles of the tank)
    const targetTank = nearestTank as Tank | null
    const isClose = nearestDist <= 9.5 && targetTank !== null

    // 1. Handle Keyboard [E] Boarding and Exiting safely with debounce
    if (store.isDrivingTank) {
      store.setIsNearTank(true, 'TEKAN [E] UNTUK KELUAR DARI TANK')
      if (input.interactTank && this.interactionCooldown <= 0) {
        const occupied = this.getOccupiedTank()
        if (occupied) {
          occupied.ejectDriver()
          this.interactionCooldown = 0.5 // 500ms debounce
        }
        return
      }
    } else if (isClose && targetTank) {
      store.setIsNearTank(true, 'TEKAN [E] UNTUK NAIK TANK TEMPUR')
      if (input.interactTank && this.interactionCooldown <= 0) {
        targetTank.boardTank(player)
        this.interactionCooldown = 0.5 // 500ms debounce
        // Return immediately so the newly-occupied tank is NOT processed for ejection in the same frame!
        return
      }
    } else {
      store.setIsNearTank(false, null)
    }

    // 2. Update all tanks
    this.tanks.forEach((tank) => {
      if (tank.isOccupied) {
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
