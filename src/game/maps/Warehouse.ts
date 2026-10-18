import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class Warehouse {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  public ctSpawn = new THREE.Vector3(0, 1.5, 26)
  public tSpawn = new THREE.Vector3(0, 1.5, -26)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),     // Central floor
    new THREE.Vector3(12, 1, 8),    // East corridor
    new THREE.Vector3(-12, 1, 8),   // West corridor
    new THREE.Vector3(12, 1, -8),   // East T side
    new THREE.Vector3(-12, 1, -8),  // West T side
    new THREE.Vector3(0, 1, 18),    // CT Main
    new THREE.Vector3(0, 1, -18),   // T Main
    new THREE.Vector3(14, 2.5, 0),  // East Catwalk
    new THREE.Vector3(-14, 2.5, 0)  // West Catwalk
  ]

  // Realistic Procedural Materials
  private floorMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createWarehouseFloor(),
    roughness: 0.4,
    metalness: 0.25,
    side: THREE.DoubleSide
  })

  private wallMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createWarehouseWall(),
    roughness: 0.5,
    metalness: 0.45,
    side: THREE.DoubleSide
  })

  private redContainerMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createContainerTexture('#b91c1c'),
    roughness: 0.55,
    metalness: 0.35,
    side: THREE.DoubleSide
  })

  private blueContainerMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createContainerTexture('#1d4ed8'),
    roughness: 0.55,
    metalness: 0.35,
    side: THREE.DoubleSide
  })

  private catwalkMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createMetalCatwalk(),
    roughness: 0.5,
    metalness: 0.6,
    side: THREE.DoubleSide
  })

  private crateMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createTacticalCrate(),
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  private girderMat = new THREE.MeshStandardMaterial({
    color: 0xeab308, // Hazard yellow
    roughness: 0.3,
    metalness: 0.7,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_warehouse'

    // 1. Concrete Ground (60m x 70m)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 70), this.floorMat)
    floor.position.set(0, -0.5, 0)
    floor.receiveShadow = true
    this.group.add(floor)
    this.collidableMeshes.push(floor)
    physics.createBox(0, -0.5, 0, 30, 0.5, 35, true)

    // 2. High Industrial Walls (H: 8m)
    this.createWall(0, 4, -35, 60, 8, 2, physics) // North
    this.createWall(0, 4, 35, 60, 8, 2, physics)  // South
    this.createWall(-30, 4, 0, 2, 8, 70, physics) // West
    this.createWall(30, 4, 0, 2, 8, 70, physics)  // East

    // 2.5 Fortified Warehouse Loading Bay Hideouts (Tempat Persembunyian Awal)
    // CT Spawn Hideout: Container barrier in front of ctSpawn (z = 26)
    this.createContainer(-8, 1.5, 21, 6, 3, 2.5, this.blueContainerMat, physics)
    this.createContainer(8, 1.5, 21, 6, 3, 2.5, this.redContainerMat, physics)
    this.createCrate(0, 0.75, 23, 1.5, physics)
    this.createCrate(-2, 0.75, 24, 1.5, physics)
    this.createCrate(2, 0.75, 24, 1.5, physics)

    // T Spawn Hideout: Container barrier in front of tSpawn (z = -26)
    this.createContainer(-8, 1.5, -21, 6, 3, 2.5, this.redContainerMat, physics)
    this.createContainer(8, 1.5, -21, 6, 3, 2.5, this.blueContainerMat, physics)
    this.createCrate(0, 0.75, -23, 1.5, physics)
    this.createCrate(-2, 0.75, -24, 1.5, physics)
    this.createCrate(2, 0.75, -24, 1.5, physics)

    // 3. Central Stacked Containers (Red & Blue)
    this.createContainer(0, 1.5, 0, 3, 3, 8, this.redContainerMat, physics)
    this.createContainer(0, 4.5, 0, 3, 3, 8, this.blueContainerMat, physics) // Stacked!

    // Side Container Blocks
    this.createContainer(-10, 1.5, 12, 6, 3, 3, this.blueContainerMat, physics)
    this.createContainer(10, 1.5, 12, 6, 3, 3, this.redContainerMat, physics)
    this.createContainer(-10, 1.5, -12, 6, 3, 3, this.redContainerMat, physics)
    this.createContainer(10, 1.5, -12, 6, 3, 3, this.blueContainerMat, physics)

    // 4. Catwalk Scaffolding (East & West)
    this.createCatwalk(-20, 2.5, 0, 4, 0.4, 35, physics)
    this.createCatwalk(20, 2.5, 0, 4, 0.4, 35, physics)

    // Ramps to catwalks
    this.createRamp(-20, 1.25, 20, 4, 0.3, 8, 0.3, physics)
    this.createRamp(20, 1.25, 20, 4, 0.3, 8, 0.3, physics)
    this.createRamp(-20, 1.25, -20, 4, 0.3, 8, -0.3, physics)
    this.createRamp(20, 1.25, -20, 4, 0.3, 8, -0.3, physics)

    // Industrial Yellow Pillars
    for (const x of [-10, 10]) {
      for (const z of [-18, 0, 18]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8, 0.8), this.girderMat)
        pillar.position.set(x, 4, z)
        pillar.castShadow = true
        this.group.add(pillar)
        this.collidableMeshes.push(pillar)
        physics.createBox(x, 4, z, 0.4, 4, 0.4, true)
      }
    }

    // 5. Tactical Supply Crates for Cover
    this.createCrate(-4, 0.75, 8, 1.5, physics)
    this.createCrate(-4, 0.75, 9.8, 1.5, physics)
    this.createCrate(-4, 2.25, 8.8, 1.5, physics) // Stacked crate

    this.createCrate(4, 0.75, -8, 1.5, physics)
    this.createCrate(4, 0.75, -9.8, 1.5, physics)
    this.createCrate(4, 2.25, -8.8, 1.5, physics) // Stacked crate

    this.createCrate(15, 0.75, 4, 1.5, physics)
    this.createCrate(-15, 0.75, -4, 1.5, physics)
  }

  private createCrate(x: number, y: number, z: number, s: number, physics: PhysicsWorld) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), this.crateMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, s / 2, s / 2, s / 2, true)
  }

  private createWall(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    physics: PhysicsWorld
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.wallMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createContainer(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    physics: PhysicsWorld
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createCatwalk(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    physics: PhysicsWorld
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.catwalkMat)
    mesh.position.set(x, y, z)
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createRamp(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rotX: number,
    physics: PhysicsWorld
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.catwalkMat)
    mesh.position.set(x, y, z)
    mesh.rotation.x = rotX
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  public cleanup() {
    this.group.clear()
    this.collidableMeshes = []
  }
}
