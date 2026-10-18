import * as THREE from 'three'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../../stores/useGameStore'
import { useRoomStore } from '../../stores/useRoomStore'
import { realtimeManager } from '../../services/supabase/realtime'
import { WEAPON_DEFINITIONS } from './definitions/weapons'
import type { WeaponId } from '../../types/game.types'

interface ActiveTracer {
  line: THREE.Line
  createdAt: number
  duration: number
}

interface SparkParticle {
  mesh: THREE.Points
  velocities: Float32Array
  createdAt: number
  duration: number
}

export class BulletManager {
  private scene: THREE.Scene
  private tracers: ActiveTracer[] = []
  private sparks: SparkParticle[] = []
  private tracerMaterial = new THREE.LineBasicMaterial({
    color: 0xffea79,
    linewidth: 2,
    transparent: true,
    opacity: 0.95
  })

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  public fireBullet(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    weaponId: WeaponId,
    hitMeshes: THREE.Object3D[]
  ): { hit: boolean; isHeadshot: boolean; point: THREE.Vector3 | null; targetName?: string } {
    const config = WEAPON_DEFINITIONS[weaponId]

    // Play gunshot audio
    audioManager.playGunshot(weaponId)

    // Raycast for hit detection
    const raycaster = new THREE.Raycaster(origin, direction, 0.1, 250)
    const intersects = raycaster.intersectObjects(hitMeshes, true)

    let endPoint = origin.clone().add(direction.clone().multiplyScalar(100))
    let hitSomething = false
    let isHeadshot = false
    let targetName = ''

    if (intersects.length > 0) {
      const hit = intersects[0]
      endPoint = hit.point
      hitSomething = true

      // Check if target has hitbox data
      let currentObj: THREE.Object3D | null = hit.object
      while (currentObj && !currentObj.userData.hitboxType && currentObj.parent) {
        currentObj = currentObj.parent
      }

      if (currentObj && currentObj.userData.hitboxType) {
        const hitboxType = currentObj.userData.hitboxType
        isHeadshot = hitboxType === 'head'
        targetName = currentObj.userData.entityName || 'Enemy'
        const targetTeam = currentObj.userData.team
        const myTeam = useRoomStore.getState().myTeam

        // Friendly Fire Check: Is target on the same team?
        if (targetTeam && targetTeam === myTeam) {
          audioManager.playDryFire()
          useGameStore.getState().triggerAmmoNotice(`🛡️ REKAN SATU TIM (${targetName})! Tembakan ke kawan tidak berlaku.`)
          this.createTracer(origin, endPoint)
          return { hit: true, isHeadshot: false, point: endPoint, targetName: `${targetName} (Rekan)` }
        }

        // Enemy Hit: Calculate damage with weapon multipliers
        let damage = config.damage
        if (isHeadshot) damage *= config.headshotMultiplier
        else if (hitboxType === 'leg') damage *= config.legMultiplier

        // Notify bot or target entity
        if (typeof currentObj.userData.onHit === 'function') {
          currentObj.userData.onHit(damage, isHeadshot)
        }

        // Multiplayer Remote Player damage broadcast
        const remoteEntityId = currentObj.userData.entityId
        if (remoteEntityId && realtimeManager.currentRoomId) {
          const myName = useGameStore.getState().scoreboard.find((p) => p.id === 'player-1')?.name?.replace(' (You)', '') || 'Striker'
          realtimeManager.broadcastDamage(
            remoteEntityId,
            damage,
            isHeadshot,
            myName,
            myTeam,
            config.name
          )
        }

        // Trigger hitmarker for enemy
        audioManager.playHitmarker(isHeadshot)
        useGameStore.getState().triggerHitmarker(isHeadshot)
      } else {
        // Hit environment (wall, crate, floor) -> create sparks
        this.createImpactSparks(endPoint, hit.face?.normal || new THREE.Vector3(0, 1, 0))
      }
    }

    // Add visual tracer
    this.createTracer(origin, endPoint)

    return { hit: hitSomething, isHeadshot, point: endPoint, targetName }
  }

  private createTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const points = [start, end]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, this.tracerMaterial)
    this.scene.add(line)

    this.tracers.push({
      line,
      createdAt: performance.now(),
      duration: 50 // ms (fast snappy tracer)
    })
  }

  private createImpactSparks(position: THREE.Vector3, normal: THREE.Vector3) {
    const particleCount = 12
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x
      positions[i * 3 + 1] = position.y
      positions[i * 3 + 2] = position.z

      // Scatter outward along normal
      const speed = 2.0 + Math.random() * 4.0
      velocities[i * 3] = (normal.x + (Math.random() - 0.5) * 1.5) * speed
      velocities[i * 3 + 1] = (normal.y + Math.random() * 1.5) * speed
      velocities[i * 3 + 2] = (normal.z + (Math.random() - 0.5) * 1.5) * speed
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: 0xffaa33,
      size: 0.06,
      transparent: true,
      opacity: 0.95
    })

    const mesh = new THREE.Points(geometry, material)
    this.scene.add(mesh)

    this.sparks.push({
      mesh,
      velocities,
      createdAt: performance.now(),
      duration: 250 // ms
    })
  }

  public update(dt: number) {
    const now = performance.now()

    // Update & clean tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tracer = this.tracers[i]
      if (now - tracer.createdAt > tracer.duration) {
        this.scene.remove(tracer.line)
        tracer.line.geometry.dispose()
        this.tracers.splice(i, 1)
      }
    }

    // Update & clean sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i]
      const elapsed = now - spark.createdAt
      if (elapsed > spark.duration) {
        this.scene.remove(spark.mesh)
        spark.mesh.geometry.dispose()
        ;(spark.mesh.material as THREE.Material).dispose()
        this.sparks.splice(i, 1)
      } else {
        const positions = spark.mesh.geometry.attributes.position.array as Float32Array
        for (let p = 0; p < spark.velocities.length / 3; p++) {
          positions[p * 3] += spark.velocities[p * 3] * dt
          positions[p * 3 + 1] += (spark.velocities[p * 3 + 1] - 9.8 * dt) * dt // gravity
          positions[p * 3 + 2] += spark.velocities[p * 3 + 2] * dt
        }
        spark.mesh.geometry.attributes.position.needsUpdate = true
      }
    }
  }

  public cleanup() {
    this.tracers.forEach((t) => {
      this.scene.remove(t.line)
      t.line.geometry.dispose()
    })
    this.sparks.forEach((s) => {
      this.scene.remove(s.mesh)
      s.mesh.geometry.dispose()
      ;(s.mesh.material as THREE.Material).dispose()
    })
    this.tracers = []
    this.sparks = []
  }
}
