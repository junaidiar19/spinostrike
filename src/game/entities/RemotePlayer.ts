import * as THREE from 'three'
import { OperatorModelGenerator } from './OperatorModelGenerator'
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

  private nameplateSprite: THREE.Sprite | null = null

  constructor(id: string, name: string, team: Team, initialPos: THREE.Vector3) {
    this.id = id
    this.name = name
    this.team = team
    this.targetPosition.copy(initialPos)
    this.mesh.position.copy(initialPos)

    this.buildModel()
    this.createNameplate()
  }

  private buildModel() {
    this.mesh.name = `remote_player_${this.id}`
    const { root, hitboxes } = OperatorModelGenerator.buildOperator(
      this.team,
      this.name,
      undefined,
      this.id
    )
    this.mesh.add(root)
    this.hitboxes = hitboxes
  }

  private createNameplate() {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.roundRect(10, 10, 236, 44, 8)
    ctx.fill()

    ctx.font = 'bold 24px Rajdhani, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = this.team === 'CT' ? '#38bdf8' : '#f87171'
    ctx.fillText(this.name, 128, 40)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(0, 2.1, 0)
    sprite.scale.set(1.4, 0.35, 1)

    this.nameplateSprite = sprite
    this.mesh.add(sprite)
  }

  public update(dt: number) {
    // Smooth lerp to latest broadcast position
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
