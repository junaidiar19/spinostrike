import * as THREE from 'three'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../../stores/useGameStore'
import { OperatorModelGenerator } from './OperatorModelGenerator'
import type { Team } from '../../types/game.types'

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

  // AI navigation
  private waypoints: THREE.Vector3[] = []
  private currentWaypointIndex = 0
  private moveSpeed = 4.2
  private targetPlayer: { position: THREE.Vector3 } | null = null

  // Combat parameters
  private fireCooldown = 0
  private burstCount = 0
  private maxBurst = 3
  private burstInterval = 0.12
  private reactionDelay = 0.3
  private alertTimer = 0

  // Respawn
  private respawnTimer = 0
  private spawnPoint = new THREE.Vector3()

  constructor(id: string, name: string, team: Team, initialPos: THREE.Vector3, waypoints: THREE.Vector3[]) {
    this.id = id
    this.name = name
    this.team = team
    this.spawnPoint.copy(initialPos)
    this.position.copy(initialPos)
    this.waypoints = waypoints

    this.buildBotModel()
    this.mesh.position.copy(this.position)
  }

  private buildBotModel() {
    this.mesh.name = `bot_${this.id}`
    const { root, hitboxes } = OperatorModelGenerator.buildOperator(
      this.team,
      this.name,
      this.onTakeDamage.bind(this)
    )
    this.mesh.add(root)
    this.hitboxes = hitboxes
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

    // Check Line of Sight to player
    const hasLOS = this.checkLineOfSight(this.targetPlayer.position, collidableMeshes)

    if (hasLOS && distToPlayer < 35) {
      this.state = 'COMBAT'
      this.alertTimer += dt

      // Face the player smoothly
      const targetDir = new THREE.Vector3()
        .subVectors(this.targetPlayer.position, this.position)
        .setY(0)
        .normalize()

      const targetAngle = Math.atan2(targetDir.x, targetDir.z)
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, dt * 8)

      // Shoot in bursts
      if (this.alertTimer >= this.reactionDelay) {
        this.combatShooting(dt, distToPlayer)
      }
    } else {
      this.state = 'PATROL'
      this.alertTimer = 0
      this.patrol(dt)
    }

    this.mesh.position.copy(this.position)
  }

  private checkLineOfSight(targetPos: THREE.Vector3, collidableMeshes: THREE.Object3D[]): boolean {
    const origin = this.position.clone().add(new THREE.Vector3(0, 1.5, 0))
    const eyeTarget = targetPos.clone().add(new THREE.Vector3(0, 1.2, 0))
    const dir = new THREE.Vector3().subVectors(eyeTarget, origin).normalize()
    const dist = origin.distanceTo(eyeTarget)

    const raycaster = new THREE.Raycaster(origin, dir, 0.1, dist)
    const hits = raycaster.intersectObjects(collidableMeshes, true)
    return hits.length === 0
  }

  private combatShooting(dt: number, distToPlayer: number) {
    this.fireCooldown -= dt
    if (this.fireCooldown <= 0) {
      // Bot shoots!
      audioManager.playGunshot('ak47')

      // Damage player if in range (accuracy drops with distance)
      const hitChance = Math.max(0.2, 1.0 - distToPlayer / 40)
      if (Math.random() < hitChance) {
        const gameStore = useGameStore.getState()
        const currentHp = gameStore.health
        const newHp = currentHp - (12 + Math.floor(Math.random() * 8))
        gameStore.setHealth(newHp)
        gameStore.triggerDamageFlash()

        if (newHp <= 0) {
          gameStore.addKillFeed({
            killerName: this.name,
            killerTeam: this.team,
            victimName: 'Striker (You)',
            victimTeam: 'CT',
            weaponName: 'AK-47',
            isHeadshot: Math.random() < 0.25
          })
          // Respawn player
          setTimeout(() => {
            gameStore.setHealth(100)
            gameStore.setArmor(100)
          }, 3000)
        }
      }

      this.burstCount++
      if (this.burstCount >= this.maxBurst) {
        this.burstCount = 0
        this.fireCooldown = 1.2 + Math.random() * 0.8 // pause between bursts
      } else {
        this.fireCooldown = this.burstInterval
      }
    }
  }

  private patrol(dt: number) {
    if (this.waypoints.length === 0) return

    const targetWaypoint = this.waypoints[this.currentWaypointIndex]
    const dir = new THREE.Vector3().subVectors(targetWaypoint, this.position).setY(0)
    const dist = dir.length()

    if (dist < 1.2) {
      // Pick random next waypoint
      this.currentWaypointIndex = Math.floor(Math.random() * this.waypoints.length)
    } else {
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
    store.addKillFeed({
      killerName: 'Striker (You)',
      killerTeam: 'CT',
      victimName: this.name,
      victimTeam: this.team,
      weaponName: store.activeWeaponId.toUpperCase(),
      isHeadshot
    })

    // Update scoreboard
    const updatedScores = store.scoreboard.map((p) => {
      if (p.id === 'player-1') {
        return { ...p, kills: p.kills + 1, score: p.score + (isHeadshot ? 150 : 100) }
      }
      if (p.id === this.id) {
        return { ...p, deaths: p.deaths + 1 }
      }
      return p
    })
    store.setScoreboard(updatedScores)
  }

  private respawn() {
    this.isDead = false
    this.health = 100
    this.state = 'PATROL'
    this.position.copy(this.spawnPoint)
    this.mesh.position.copy(this.position)
    this.mesh.rotation.set(0, 0, 0)
    this.currentWaypointIndex = Math.floor(Math.random() * this.waypoints.length)
  }
}
