import RAPIER from '@dimforge/rapier3d-compat'

export class PhysicsWorld {
  public world: RAPIER.World | null = null
  public RAPIER = RAPIER
  public isReady: boolean = false

  public async init() {
    if (this.isReady) return
    await RAPIER.init()
    const gravity = new RAPIER.Vector3(0.0, -24.0, 0.0)
    this.world = new RAPIER.World(gravity)
    this.isReady = true
  }

  public step(dt: number) {
    if (!this.isReady || !this.world) return
    this.world.timestep = Math.min(dt, 0.033)
    this.world.step()
  }

  public createBox(
    x: number,
    y: number,
    z: number,
    hx: number,
    hy: number,
    hz: number,
    isStatic: boolean = true
  ) {
    if (!this.world) throw new Error('Physics world not initialized')
    const bodyDesc = isStatic
      ? RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z)
      : RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z)
    const body = this.world.createRigidBody(bodyDesc)
    const colliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz)
    const collider = this.world.createCollider(colliderDesc, body)
    return { body, collider }
  }

  public createCharacterController(offset: number = 0.01) {
    if (!this.world) throw new Error('Physics world not initialized')
    return this.world.createCharacterController(offset)
  }

  public destroy() {
    if (this.world) {
      this.world.free()
      this.world = null
      this.isReady = false
    }
  }
}
