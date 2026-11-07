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

interface ActiveRocket {
  mesh: THREE.Group
  velocity: THREE.Vector3
  distanceTraveled: number
  maxDistance: number
  damage: number
  blastRadius: number
  hitMeshes: THREE.Object3D[]
  isTankShell?: boolean
}

interface ActiveExplosion {
  sphereMesh: THREE.Mesh
  ringMesh: THREE.Mesh
  light: THREE.PointLight
  createdAt: number
  duration: number
  maxRadius: number
}

export class BulletManager {
  private scene: THREE.Scene
  private tracers: ActiveTracer[] = []
  private sparks: SparkParticle[] = []
  private rockets: ActiveRocket[] = []
  private explosions: ActiveExplosion[] = []
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

    // BAZOOKA: Launch high-explosive rocket projectile instead of instant hitscan!
    if (weaponId === 'bazooka') {
      this.fireRocket(origin, direction, hitMeshes, config.damage, 6.5, false)
      return { hit: true, isHeadshot: false, point: null, targetName: 'Rocket' }
    }

    // Raycast for standard hitscan bullets (AK47, M4A1, AWP, SSG08, Deagle, Knife, Minigun)
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

  public fireRocket(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    hitMeshes: THREE.Object3D[],
    damage = 180,
    blastRadius = 6.5,
    isTankShell = false
  ) {
    const rocketGroup = new THREE.Group()
    rocketGroup.position.copy(origin)

    // Align rocket orientation along flight vector
    const dirNorm = direction.clone().normalize()
    rocketGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dirNorm)

    if (isTankShell) {
      // 120mm Heavy Armored Tank AP/HE Shell
      const shellBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
      )
      shellBody.rotation.x = Math.PI / 2
      rocketGroup.add(shellBody)

      const shellTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.25, 12),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 })
      )
      shellTip.rotation.x = -Math.PI / 2
      shellTip.position.set(0, 0, -0.42)
      rocketGroup.add(shellTip)

      // Shell tracer glow
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      )
      glow.position.set(0, 0, 0.3)
      rocketGroup.add(glow)
    } else {
      // RPG-7 Rocket Warhead & Motor
      const warhead = new THREE.Mesh(
        new THREE.ConeGeometry(0.07, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: 0x4d5b40, metalness: 0.3, roughness: 0.6 })
      )
      warhead.rotation.x = -Math.PI / 2
      warhead.position.set(0, 0, -0.15)
      rocketGroup.add(warhead)

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.45, 12),
        new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.4 })
      )
      body.rotation.x = Math.PI / 2
      body.position.set(0, 0, 0.12)
      rocketGroup.add(body)

      // Stabilizer Fins
      const finGeom = new THREE.BoxGeometry(0.18, 0.01, 0.1)
      const finMat = new THREE.MeshStandardMaterial({ color: 0x0f172a })
      const fin1 = new THREE.Mesh(finGeom, finMat)
      fin1.position.set(0, 0, 0.3)
      rocketGroup.add(fin1)
      const fin2 = new THREE.Mesh(finGeom, finMat)
      fin2.position.set(0, 0, 0.3)
      fin2.rotation.z = Math.PI / 2
      rocketGroup.add(fin2)

      // Fiery rocket motor exhaust light
      const exhaustLight = new THREE.PointLight(0xff5500, 3, 4)
      exhaustLight.position.set(0, 0, 0.35)
      rocketGroup.add(exhaustLight)
    }

    this.scene.add(rocketGroup)

    const speed = isTankShell ? 82 : 55 // m/s
    this.rockets.push({
      mesh: rocketGroup,
      velocity: dirNorm.multiplyScalar(speed),
      distanceTraveled: 0,
      maxDistance: 250,
      damage,
      blastRadius,
      hitMeshes,
      isTankShell
    })
  }

  public fireTankShell(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    allTargets: THREE.Object3D[]
  ) {
    audioManager.playTankCannonSound()
    this.fireRocket(origin, direction, allTargets, 240, 8.5, true)
  }

  public createExplosion(
    position: THREE.Vector3,
    damage: number,
    blastRadius: number,
    allTargets: THREE.Object3D[],
    isTankShell = false
  ) {
    audioManager.playExplosionSound()

    // 1. Fiery expanding explosion fireball sphere
    const sphereGeom = new THREE.SphereGeometry(0.4, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: isTankShell ? 0xff5500 : 0xff7700,
      transparent: true,
      opacity: 0.95
    })
    const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat)
    sphereMesh.position.copy(position)
    this.scene.add(sphereMesh)

    // 2. Shockwave expanding ground ring
    const ringGeom = new THREE.RingGeometry(0.3, 0.6, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffdd66,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    })
    const ringMesh = new THREE.Mesh(ringGeom, ringMat)
    ringMesh.rotation.x = -Math.PI / 2
    ringMesh.position.copy(position)
    ringMesh.position.y += 0.08
    this.scene.add(ringMesh)

    // 3. Bright flash light
    const light = new THREE.PointLight(0xff7722, isTankShell ? 12 : 8, isTankShell ? 28 : 20)
    light.position.copy(position)
    this.scene.add(light)

    // 4. Explosion sparks & debris burst
    this.createImpactSparks(position, new THREE.Vector3(0, 1, 0))

    this.explosions.push({
      sphereMesh,
      ringMesh,
      light,
      createdAt: performance.now(),
      duration: isTankShell ? 480 : 400,
      maxRadius: blastRadius * 0.75
    })

    // 5. Calculate Radial AoE Damage for bots and targets within blast radius
    const uniqueEntitiesHit = new Set<string>()
    const myTeam = useRoomStore.getState().myTeam

    allTargets.forEach((obj) => {
      let targetObj: THREE.Object3D | null = obj
      while (targetObj && !targetObj.userData.hitboxType && !targetObj.userData.isTank && targetObj.parent) {
        targetObj = targetObj.parent
      }

      if (targetObj && targetObj.userData) {
        const entityKey = targetObj.userData.entityId || targetObj.userData.entityName || targetObj.id.toString()
        if (uniqueEntitiesHit.has(entityKey)) return

        const targetPos = new THREE.Vector3()
        targetObj.getWorldPosition(targetPos)

        const dist = position.distanceTo(targetPos)
        if (dist <= blastRadius) {
          uniqueEntitiesHit.add(entityKey)

          // Friendly fire check
          const targetTeam = targetObj.userData.team
          if (targetTeam && targetTeam === myTeam) {
            return
          }

          // Damage falloff: Max at center, reduced towards blast edge
          const falloff = 1 - dist / blastRadius
          const actualDamage = Math.max(25, Math.round(damage * falloff))

          if (typeof targetObj.userData.onHit === 'function') {
            targetObj.userData.onHit(actualDamage, false)
          }

          // Trigger hitmarker for enemy
          audioManager.playHitmarker(false)
          useGameStore.getState().triggerHitmarker(false)
        }
      }
    })
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

    // 1. Update active rockets / tank shells
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i]
      const stepDist = rocket.velocity.length() * dt
      const stepVec = rocket.velocity.clone().multiplyScalar(dt)
      const prevPos = rocket.mesh.position.clone()
      const nextPos = prevPos.clone().add(stepVec)

      // Raycast along step vector for precise obstacle & entity collision
      const rayDir = stepVec.clone().normalize()
      const raycaster = new THREE.Raycaster(prevPos, rayDir, 0.05, stepDist + 0.15)
      const hits = raycaster.intersectObjects(rocket.hitMeshes, true)

      let collided = false
      let hitPoint = nextPos

      if (hits.length > 0) {
        collided = true
        hitPoint = hits[0].point
      } else if (nextPos.y <= 0.1) {
        // Ground impact
        collided = true
        hitPoint = new THREE.Vector3(nextPos.x, 0.05, nextPos.z)
      } else {
        rocket.distanceTraveled += stepDist
        if (rocket.distanceTraveled >= rocket.maxDistance) {
          collided = true
          hitPoint = nextPos
        }
      }

      if (collided) {
        // Detonate rocket
        this.createExplosion(hitPoint, rocket.damage, rocket.blastRadius, rocket.hitMeshes, rocket.isTankShell)
        this.scene.remove(rocket.mesh)
        this.rockets.splice(i, 1)
      } else {
        rocket.mesh.position.copy(nextPos)
      }
    }

    // 2. Update active explosions (expanding fireball & shockwave)
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i]
      const elapsed = now - exp.createdAt
      const progress = Math.min(1.0, elapsed / exp.duration)

      if (progress >= 1.0) {
        this.scene.remove(exp.sphereMesh)
        this.scene.remove(exp.ringMesh)
        this.scene.remove(exp.light)
        exp.sphereMesh.geometry.dispose()
        ;(exp.sphereMesh.material as THREE.Material).dispose()
        exp.ringMesh.geometry.dispose()
        ;(exp.ringMesh.material as THREE.Material).dispose()
        this.explosions.splice(i, 1)
      } else {
        // Expand sphere and ring
        const currentScale = 1.0 + (exp.maxRadius - 1.0) * Math.sin((progress * Math.PI) / 2)
        exp.sphereMesh.scale.setScalar(currentScale)
        exp.ringMesh.scale.setScalar(currentScale * 1.3)

        // Fade opacity and light intensity
        const fade = 1.0 - progress
        ;(exp.sphereMesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.95
        ;(exp.ringMesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.9
        exp.light.intensity = fade * 8.0
      }
    }

    // 3. Update & clean tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tracer = this.tracers[i]
      if (now - tracer.createdAt > tracer.duration) {
        this.scene.remove(tracer.line)
        tracer.line.geometry.dispose()
        this.tracers.splice(i, 1)
      }
    }

    // 4. Update & clean sparks
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
    this.rockets.forEach((r) => this.scene.remove(r.mesh))
    this.rockets = []

    this.explosions.forEach((e) => {
      this.scene.remove(e.sphereMesh)
      this.scene.remove(e.ringMesh)
      this.scene.remove(e.light)
      e.sphereMesh.geometry.dispose()
      ;(e.sphereMesh.material as THREE.Material).dispose()
      e.ringMesh.geometry.dispose()
      ;(e.ringMesh.material as THREE.Material).dispose()
    })
    this.explosions = []

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
