import * as THREE from 'three'
import { OperatorModelGenerator } from './OperatorModelGenerator'
import { useRoomStore } from '../../stores/useRoomStore'
import { useGameStore } from '../../stores/useGameStore'
import { realtimeManager } from '../../services/supabase/realtime'
import type { Team, WeaponId } from '../../types/game.types'

export class RemotePlayer {
  public id: string
  public name: string
  public team: Team
  public mesh = new THREE.Group()
  public hitboxes: THREE.Object3D[] = []

  // Smooth interpolation targets
  public targetPosition = new THREE.Vector3()
  public targetYaw = 0
  public targetPitch = 0
  public activeWeapon: WeaponId = 'ak47'

  // Combat status
  public health: number = 100
  public isDead: boolean = false
  public respawnTimer: number = 0

  private nameplateSprite: THREE.Sprite | null = null

  constructor(id: string, name: string, team: Team, initialPos: THREE.Vector3) {
    this.id = id
    this.name = name
    this.team = team

    // Place firmly at ground floor level (y = 0) - eliminate floating!
    this.targetPosition.copy(initialPos)
    this.targetPosition.y = 0
    this.mesh.position.copy(this.targetPosition)

    this.buildModel()
    this.createNameplate()
  }

  private buildModel() {
    this.mesh.name = `remote_player_${this.id}`

    const onHitCallback = (damage: number, isHeadshot: boolean) => {
      const myTeam = useRoomStore.getState().myTeam
      // Friendly fire check: Teammates take 0 damage!
      if (this.team === myTeam) {
        useGameStore.getState().triggerAmmoNotice('🛡️ REKAN TIM! Tembakan ke teman tidak menghasilkan luka.')
        return
      }

      const myPlayer = useGameStore.getState().scoreboard.find((p) => p.id === 'player-1')
      const myName = myPlayer?.name?.replace(' (You)', '') || 'Striker'
      this.onTakeDamage(damage, isHeadshot, myName)
    }

    const { root, hitboxes } = OperatorModelGenerator.buildOperator(
      this.team,
      this.name,
      onHitCallback,
      this.id
    )
    this.mesh.add(root)
    this.hitboxes = hitboxes
  }

  public updateName(newName: string) {
    if (this.name === newName) return
    this.name = newName
    this.createNameplate()
  }

  public createNameplate() {
    if (this.nameplateSprite) {
      this.nameplateSprite.material.dispose()
      this.mesh.remove(this.nameplateSprite)
      this.nameplateSprite = null
    }

    const myTeam = useRoomStore.getState().myTeam
    const isTeammate = this.team === myTeam

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Card background: centered precisely in the 256x64 canvas
    ctx.clearRect(0, 0, 256, 64)
    ctx.fillStyle = isTeammate ? 'rgba(15, 23, 42, 0.92)' : 'rgba(28, 10, 10, 0.92)'
    ctx.roundRect(4, 4, 248, 56, 8)
    ctx.fill()

    // Border highlight
    ctx.lineWidth = 2.5
    ctx.strokeStyle = isTeammate ? '#38bdf8' : '#ef4444'
    ctx.stroke()

    // Title / Tag
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillStyle = isTeammate ? '#38bdf8' : '#ef4444'
    const roleTag = isTeammate ? 'REKAN TIM' : 'MUSUH'
    ctx.fillText(roleTag, 128, 20)

    // Player Nickname - explicitly re-declaring textAlign & textBaseline
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(this.name, 128, 42)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(material)
    sprite.center.set(0.5, 0.5)
    sprite.position.set(0, 2.05, 0)
    sprite.scale.set(1.1, 0.28, 1)
    sprite.renderOrder = 999

    this.nameplateSprite = sprite
    this.mesh.add(sprite)
  }

  public onTakeDamage(damage: number, isHeadshot: boolean, killerName: string) {
    if (this.isDead) return
    this.health = Math.max(0, this.health - damage)

    // Flinch animation
    this.mesh.position.y += 0.06
    setTimeout(() => {
      if (!this.isDead) this.mesh.position.y = this.targetPosition.y
    }, 60)

    if (this.health <= 0) {
      this.die(isHeadshot, killerName)
    }
  }

  public die(isHeadshot: boolean, killerName: string) {
    this.isDead = true
    this.health = 0
    this.respawnTimer = 3.5

    // Fall backward animation
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.position.y = 0.2

    if (this.nameplateSprite) {
      this.nameplateSprite.visible = false
    }

    // Record kill to scoreboard
    const store = useGameStore.getState()
    store.recordPlayerKill(this.id, this.name, this.team, isHeadshot)

    // Broadcast kill to all room participants
    if (realtimeManager.currentRoomId) {
      const myTeam = useRoomStore.getState().myTeam
      realtimeManager.broadcastKill({
        killerId: 'player-1',
        killerName,
        killerTeam: myTeam,
        victimId: this.id,
        victimName: this.name,
        victimTeam: this.team,
        weaponName: store.activeWeaponId.toUpperCase(),
        isHeadshot
      })
    }
  }

  public respawn(spawnPoint: THREE.Vector3) {
    this.isDead = false
    this.health = 100
    this.targetPosition.copy(spawnPoint)
    this.targetPosition.y = 0
    this.mesh.position.copy(this.targetPosition)
    this.mesh.rotation.set(0, 0, 0)
    if (this.nameplateSprite) {
      this.nameplateSprite.visible = true
    }
  }

  public update(dt: number) {
    if (this.isDead) {
      this.respawnTimer -= dt
      if (this.respawnTimer <= 0) {
        const spawn = this.team === 'CT' ? new THREE.Vector3(0, 0, 30) : new THREE.Vector3(0, 0, -30)
        this.respawn(spawn)
      }
      return
    }

    // Smooth lerp to latest broadcast position (feet on ground)
    this.mesh.position.lerp(this.targetPosition, dt * 14)
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, this.targetYaw, dt * 12)
  }

  public destroy() {
    if (this.nameplateSprite) {
      this.nameplateSprite.material.dispose()
      this.mesh.remove(this.nameplateSprite)
    }
  }
}
