import * as THREE from 'three'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../../stores/useGameStore'
import { OperatorModelGenerator, type OperatorLimbs } from './OperatorModelGenerator'
import type { Team } from '../../types/game.types'
import { gameEngine } from '../core/GameEngine'
import type { BulletManager } from '../weapons/BulletManager'

export type BotState = 'PATROL' | 'COMBAT' | 'DEAD'

export class Bot {
  public id: string
  public name: string
  public team: Team
  public mesh = new THREE.Group()
  public position = new THREE.Vector3()
  public health = 100
  public isDead = false

  public state: BotState = 'PATROL'
  public hitboxes: THREE.Object3D[] = []
  public limbs: OperatorLimbs | null = null

  // AI navigation & Animation
  private waypoints: THREE.Vector3[] = []
  private currentWaypointIndex = 0
  private moveSpeed = 4.0
  private targetPlayer: { position: THREE.Vector3 } | null = null
  private bulletManager: BulletManager | null = null

  private walkTimer = Math.random() * 10
  private isMoving = false

  // Combat parameters
  private fireCooldown = 0
  private burstCount = 0
  private maxBurst = 2
  private burstInterval = 0.26
  private reactionDelay = 1.4
  private alertTimer = 0

  // Respawn
  private respawnTimer = 0
  private spawnPoint = new THREE.Vector3()

  constructor(
    id: string,
    name: string,
    team: Team,
    initialPos: THREE.Vector3,
    waypoints: THREE.Vector3[],
    bulletManager?: BulletManager
  ) {
    this.id = id
    this.name = name
    this.team = team
    this.spawnPoint.copy(initialPos)
    this.spawnPoint.y = 0 // Ground floor level - no floating!
    this.position.copy(this.spawnPoint)
    this.waypoints = waypoints
    this.bulletManager = bulletManager || null

    this.buildBotModel()
    this.mesh.position.copy(this.position)
  }

  private buildBotModel() {
    this.mesh.name = `bot_${this.id}`
    const { root, hitboxes, limbs } = OperatorModelGenerator.buildOperator(
      this.team,
      this.name,
      this.onTakeDamage.bind(this)
    )
    this.mesh.add(root)
    this.hitboxes = hitboxes
    this.limbs = limbs
  }

  public setTargetPlayer(player: { position: THREE.Vector3 }) {
    this.targetPlayer = player
  }

  public update(dt: number, collidableMeshes: THREE.Object3D[]) {
    if (this.isDead) {
      this.respawnTimer -= dt
      if (this.respawnTimer <= 0) {
        this.respawn()
      }
      return
    }

    if (!this.targetPlayer) return

    const distToPlayer = this.position.distanceTo(this.targetPlayer.position)

    // Check Line of Sight to player (only targetable if alive, past grace period, and no spawn shield)
    const gameStore = useGameStore.getState()
    const isPlayerTargetable = !gameStore.isPlayerDead && gameStore.spawnProtection <= 0 && gameStore.matchGraceTimer <= 0
    const hasLOS = isPlayerTargetable && this.checkLineOfSight(this.targetPlayer.position, collidableMeshes)

    if (hasLOS && distToPlayer < 35) {
      this.state = 'COMBAT'
      this.isMoving = false
      this.alertTimer += dt

      // Face the player smoothly
      const targetDir = new THREE.Vector3()
        .subVectors(this.targetPlayer.position, this.position)
        .setY(0)
        .normalize()

      const targetAngle = Math.atan2(targetDir.x, targetDir.z)
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, dt * 8)

      // Shoot in bursts after alert reaction delay
      if (this.alertTimer >= this.reactionDelay) {
        this.combatShooting(dt, distToPlayer, collidableMeshes)
      }
    } else {
      this.state = 'PATROL'
      this.alertTimer = 0
      this.patrol(dt)
    }

    // Dynamic soldier limb animations (walking & combat stance)
    if (this.limbs) {
      if (this.isMoving) {
        this.walkTimer += dt * 9
        this.limbs.leftLegGroup.rotation.x = Math.sin(this.walkTimer) * 0.55
        this.limbs.rightLegGroup.rotation.x = -Math.sin(this.walkTimer) * 0.55
        this.limbs.leftArmGroup.rotation.x = -0.55 - Math.sin(this.walkTimer) * 0.25
        this.limbs.torsoGroup.position.y = 1.05 + Math.abs(Math.sin(this.walkTimer * 2)) * 0.03
      } else {
        // Combat ready stance (standing firmly)
        this.limbs.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.limbs.leftLegGroup.rotation.x, 0, dt * 8)
        this.limbs.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.limbs.rightLegGroup.rotation.x, 0, dt * 8)
        this.limbs.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.limbs.leftArmGroup.rotation.x, -0.55, dt * 8)
        this.limbs.torsoGroup.position.y = 1.05 + Math.sin(performance.now() * 0.003) * 0.01
      }

      // Recover gun recoil smoothly
      this.limbs.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.limbs.rightArmGroup.rotation.x, -0.5, dt * 10)
      this.limbs.gunGroup.position.z = THREE.MathUtils.lerp(this.limbs.gunGroup.position.z, 0.15, dt * 10)
    }

    this.position.y = 0 // Ground floor level clamp
    this.mesh.position.copy(this.position)
  }

  private checkLineOfSight(targetPos: THREE.Vector3, collidableMeshes: THREE.Object3D[]): boolean {
    const origin = this.position.clone().add(new THREE.Vector3(0, 1.45, 0))
    const eyeTarget = targetPos.clone().add(new THREE.Vector3(0, 1.2, 0))
    const dir = new THREE.Vector3().subVectors(eyeTarget, origin).normalize()
    const dist = origin.distanceTo(eyeTarget)

    const raycaster = new THREE.Raycaster(origin, dir, 0.1, dist)
    const hits = raycaster.intersectObjects(collidableMeshes, true)
    return hits.length === 0
  }

  private combatShooting(dt: number, distToPlayer: number, collidableMeshes: THREE.Object3D[]) {
    this.fireCooldown -= dt
    if (this.fireCooldown <= 0 && this.targetPlayer) {
      // 1. Bot Gunshot Audio
      audioManager.playGunshot('ak47')

      // 2. Muzzle Flash on Bot
      if (this.limbs) {
        this.limbs.muzzleFlash.visible = true
        this.limbs.rightArmGroup.rotation.x = -0.68
        this.limbs.gunGroup.position.z = 0.11
        setTimeout(() => {
          if (this.limbs) this.limbs.muzzleFlash.visible = false
        }, 50)
      }

      // 3. Fire real visible bullet tracer from bot to player
      const botMuzzle = this.position.clone().add(new THREE.Vector3(0, 1.2, 0))
      const rightVec = new THREE.Vector3(0.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y)
      botMuzzle.add(rightVec)

      const targetChest = this.targetPlayer.position.clone().add(new THREE.Vector3(0, 1.1, 0))
      const spread = (Math.random() - 0.5) * 0.035
      const shootDir = new THREE.Vector3().subVectors(targetChest, botMuzzle).normalize()
      shootDir.x += spread
      shootDir.y += (Math.random() - 0.5) * 0.025
      shootDir.normalize()

      // Check if bullet trajectory hits any solid obstacle before reaching the player!
      const distToChest = botMuzzle.distanceTo(targetChest)
      const raycaster = new THREE.Raycaster(botMuzzle, shootDir, 0.1, distToChest + 2)
      const obstacleHits = raycaster.intersectObjects(collidableMeshes, true)

      let hitObstacle = false
      if (obstacleHits.length > 0 && obstacleHits[0].distance < distToChest - 0.15) {
        // Bullet hit a solid obstacle (wall, crate, bunker) before reaching the player!
        hitObstacle = true
      }

      if (this.bulletManager) {
        // Pass collidableMeshes so tracer line and sparks stop ON the obstacle surface!
        this.bulletManager.fireBullet(botMuzzle, shootDir, 'ak47', collidableMeshes)
      }

      // If bullet hit an obstacle, DO NOT DAMAGE THE PLAYER!
      if (hitObstacle) {
        this.burstCount++
        if (this.burstCount >= this.maxBurst) {
          this.burstCount = 0
          this.fireCooldown = 2.2 + Math.random() * 0.8
        } else {
          this.fireCooldown = this.burstInterval
        }
        return
      }

      // 4. Damage player with realistic hit probability based on distance
      const gameStore = useGameStore.getState()
      if (gameStore.isPlayerDead || gameStore.spawnProtection > 0 || gameStore.matchGraceTimer > 0) {
        return
      }

      const hitChance = Math.max(0.12, 0.40 - distToPlayer / 50)
      if (Math.random() < hitChance) {
        const damage = 10 + Math.floor(Math.random() * 6)

        // Calculate Directional Hit Angle relative to Player Camera
        const toBot = new THREE.Vector3().subVectors(this.position, gameEngine.player.camera.position)
        const localDir = toBot.applyQuaternion(gameEngine.player.camera.quaternion.clone().invert())
        const screenAngle = Math.atan2(localDir.x, -localDir.z)

        // Apply damage absorbing through Kevlar armor
        gameStore.applyDamageToPlayer(damage, this.id, this.name, this.team, 'AK-47', screenAngle)
      }

      this.burstCount++
      if (this.burstCount >= this.maxBurst) {
        this.burstCount = 0
        this.fireCooldown = 2.2 + Math.random() * 0.8 // generous pause between bursts
      } else {
        this.fireCooldown = this.burstInterval
      }
    }
  }

  private patrol(dt: number) {
    if (this.waypoints.length === 0) {
      this.isMoving = false
      return
    }

    const targetWaypoint = this.waypoints[this.currentWaypointIndex]
    const dir = new THREE.Vector3().subVectors(targetWaypoint, this.position).setY(0)
    const dist = dir.length()

    if (dist < 1.2) {
      this.isMoving = false
      // Pick random next waypoint
      this.currentWaypointIndex = Math.floor(Math.random() * this.waypoints.length)
    } else {
      this.isMoving = true
      dir.normalize()
      this.position.addScaledVector(dir, this.moveSpeed * dt)

      // Face direction of travel
      const angle = Math.atan2(dir.x, dir.z)
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, angle, dt * 6)
    }
  }

  public onTakeDamage(damage: number, isHeadshot: boolean) {
    if (this.isDead) return

    this.health -= damage

    // Knockback
    this.mesh.position.y += 0.08
    setTimeout(() => {
      if (!this.isDead) this.mesh.position.y = this.position.y
    }, 60)

    if (this.health <= 0) {
      this.die(isHeadshot)
    }
  }

  private die(isHeadshot: boolean) {
    this.isDead = true
    this.health = 0
    this.state = 'DEAD'
    this.respawnTimer = 3.5

    // Fall backward animation
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = 0.2

    // Update Game Store: Killfeed & Scoreboard
    const store = useGameStore.getState()
    store.recordPlayerKill(this.id, this.name, this.team, isHeadshot)
  }

  private respawn() {
    this.isDead = false
    this.health = 100
    this.state = 'PATROL'
    this.position.copy(this.spawnPoint)
    this.position.y = 0
    this.mesh.position.copy(this.position)
    this.mesh.rotation.set(0, 0, 0)
    this.currentWaypointIndex = Math.floor(Math.random() * this.waypoints.length)
  }
}
