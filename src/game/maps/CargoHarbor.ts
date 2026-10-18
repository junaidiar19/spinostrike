import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class CargoHarbor {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Tactical spawn locations
  public ctSpawn = new THREE.Vector3(0, 1.5, 34)
  public tSpawn = new THREE.Vector3(0, 1.5, -34)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central Pier Plaza
    new THREE.Vector3(0, 8.2, 0),       // Gantry Crane High Catwalk (8m!)
    new THREE.Vector3(18, 5.3, 8),      // East 2-Stack Container Roof
    new THREE.Vector3(-18, 5.3, -8),    // West 2-Stack Container Roof
    new THREE.Vector3(22, 1, 0),        // East Harbor Water Edge (Sniper Lane)
    new THREE.Vector3(-22, 1, 0),       // West Warehouse Loading Dock
    new THREE.Vector3(0, 1, 28),        // CT Dock Spawn
    new THREE.Vector3(0, 1, -28)        // T Freight Spawn
  ]

  // Realistic Procedural Materials with DoubleSide for raycast & collision reliability
  private pierFloorMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createHarborPierFloor(),
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  private craneSteelMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createCraneGirderTexture(),
    roughness: 0.4,
    metalness: 0.7,
    side: THREE.DoubleSide
  })

  private metalCatwalkMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createMetalCatwalk(),
    roughness: 0.35,
    metalness: 0.75,
    side: THREE.DoubleSide
  })

  // Container Color Varieties
  private blueContainerMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createContainerTexture('#1d4ed8'),
    roughness: 0.45,
    metalness: 0.55,
    side: THREE.DoubleSide
  })

  private redContainerMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createContainerTexture('#b91c1c'),
    roughness: 0.45,
    metalness: 0.55,
    side: THREE.DoubleSide
  })

  private greenContainerMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createContainerTexture('#047857'),
    roughness: 0.45,
    metalness: 0.55,
    side: THREE.DoubleSide
  })

  private orangeContainerMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createContainerTexture('#c2410c'),
    roughness: 0.45,
    metalness: 0.55,
    side: THREE.DoubleSide
  })

  private crateMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createTacticalCrate(),
    roughness: 0.65,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  private wallMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createWarehouseWall(),
    roughness: 0.6,
    metalness: 0.4,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_cargo_harbor'

    // 1. Maritime Dock Pier Concrete Ground (85m x 85m)
    const groundGeom = new THREE.BoxGeometry(85, 1, 85)
    const ground = new THREE.Mesh(groundGeom, this.pierFloorMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 42.5, 0.5, 42.5, true)

    // 2. Perimeter Harbor Security Walls (Height 7m, Thickness 2m)
    this.createWall(0, 3.5, -42.5, 85, 7, 2, physics) // North
    this.createWall(0, 3.5, 42.5, 85, 7, 2, physics)  // South
    this.createWall(-42.5, 3.5, 0, 2, 7, 85, physics) // West
    this.createWall(42.5, 3.5, 0, 2, 7, 85, physics)  // East

    // 3. Fortified Spawn Shelters / Hideouts
    // CT Spawn Hideout (z = 34): Solid maritime terminal wall & container cover
    this.createWall(-8, 3, 28, 14, 6, 1.5, physics)
    this.createWall(8, 3, 28, 14, 6, 1.5, physics)
    this.createContainer(0, 1.3, 30, 6, 2.6, 2.6, this.blueContainerMat, physics)
    this.createCrate(-4, 1, 32, 2, 2, 2, physics)
    this.createCrate(4, 1, 32, 2, 2, 2, physics)

    // T Spawn Hideout (z = -34): Solid cargo terminal wall & container cover
    this.createWall(-8, 3, -28, 14, 6, 1.5, physics)
    this.createWall(8, 3, -28, 14, 6, 1.5, physics)
    this.createContainer(0, 1.3, -30, 6, 2.6, 2.6, this.redContainerMat, physics)
    this.createCrate(-4, 1, -32, 2, 2, 2, physics)
    this.createCrate(4, 1, -32, 2, 2, 2, physics)

    // ==========================================================
    // 4. GIANT HARBOR GANTRY CRANE (High Vantage Point at y = 8.0m!)
    // ==========================================================
    // 4 Massive Steel Lattice Legs
    const legGeom = new THREE.BoxGeometry(1.2, 8.0, 1.2)
    const cranePositions = [[-14, -14], [-14, 14], [14, -14], [14, 14]]
    cranePositions.forEach(([cx, cz]) => {
      const leg = new THREE.Mesh(legGeom, this.craneSteelMat)
      leg.position.set(cx, 4.0, cz)
      this.group.add(leg)
      this.collidableMeshes.push(leg)
      physics.createBox(cx, 4.0, cz, 0.6, 4.0, 0.6, true)
    })

    // High Overhead Girder Catwalk spanning across center (30m x 3.5m at y = 8.0m)
    const craneCatwalk = new THREE.Mesh(new THREE.BoxGeometry(30, 0.4, 3.5), this.metalCatwalkMat)
    craneCatwalk.position.set(0, 8.0, 0)
    this.group.add(craneCatwalk)
    this.collidableMeshes.push(craneCatwalk)
    physics.createBox(0, 8.0, 0, 15, 0.2, 1.75, true)

    // Crane Catwalk Sniper Railings (1.2m high)
    this.createCoverWall(0, 8.7, 1.6, 30, 1.2, 0.2, physics)
    this.createCoverWall(0, 8.7, -1.6, 30, 1.2, 0.2, physics)

    // Crane Trolley / Operator Cabin at Center (Sniper fort)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.0, 4.0), this.craneSteelMat)
    cabin.position.set(0, 9.6, 0)
    this.group.add(cabin)
    this.collidableMeshes.push(cabin)
    physics.createBox(0, 9.6, 0, 2.0, 1.5, 2.0, true)

    // Ramps ascending up to the Crane Catwalk from both sides
    this.createRamp(-14, 4.0, 7.0, 2.4, 0.3, 10.5, Math.PI / 6, physics)
    this.createRamp(14, 4.0, -7.0, 2.4, 0.3, 10.5, -Math.PI / 6, physics)

    // ==========================================================
    // 5. MULTI-TIER CONTAINER STACKS (Accessible Sniper Platforms)
    // ==========================================================
    // East 2-Stack Container Ridge (y = 2.6m and y = 5.2m roofs)
    this.createContainer(18, 1.3, 8, 12, 2.6, 2.8, this.blueContainerMat, physics)
    this.createContainer(18, 3.9, 8, 12, 2.6, 2.8, this.orangeContainerMat, physics)
    // Access Ramp to East Container Stack
    this.createRamp(18, 2.6, 17, 2.6, 0.3, 8.5, Math.PI / 7, physics)

    // West 2-Stack Container Ridge
    this.createContainer(-18, 1.3, -8, 12, 2.6, 2.8, this.redContainerMat, physics)
    this.createContainer(-18, 3.9, -8, 12, 2.6, 2.8, this.greenContainerMat, physics)
    // Access Ramp to West Container Stack
    this.createRamp(-18, 2.6, -17, 2.6, 0.3, 8.5, -Math.PI / 7, physics)

    // Center Maze of Shipping Containers (Sightline blockers & CQB cover)
    this.createContainer(-8, 1.3, 0, 6, 2.6, 2.6, this.greenContainerMat, physics)
    this.createContainer(8, 1.3, 0, 6, 2.6, 2.6, this.blueContainerMat, physics)

    this.createContainer(-8, 1.3, 14, 6, 2.6, 2.6, this.orangeContainerMat, physics)
    this.createContainer(8, 1.3, -14, 6, 2.6, 2.6, this.redContainerMat, physics)

    // Level 2 Stacks for Flanking
    this.createContainer(-8, 3.9, 0, 6, 2.6, 2.6, this.redContainerMat, physics)
    this.createContainer(8, 3.9, 0, 6, 2.6, 2.6, this.greenContainerMat, physics)

    // ==========================================================
    // 6. HARBOR WATERLINE SNIPER LANE (Long sightline along East pier)
    // ==========================================================
    // Bollards & Pallets along Pier Edge
    for (let pz = -24; pz <= 24; pz += 12) {
      this.createBollard(28, pz, physics)
    }

    // Supply Crates in Harbor
    this.createCrate(24, 1, 6, 2, 2, 2, physics)
    this.createCrate(24, 1, -6, 2, 2, 2, physics)
    this.createCrate(-24, 1, 6, 2, 2, 2, physics)
    this.createCrate(-24, 1, -6, 2, 2, 2, physics)
  }

  private createWall(x: number, y: number, z: number, w: number, h: number, d: number, physics: PhysicsWorld) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.wallMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createCoverWall(x: number, y: number, z: number, w: number, h: number, d: number, physics: PhysicsWorld) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.wallMat)
    mesh.position.set(x, y, z)
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
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, mat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createCrate(x: number, y: number, z: number, w: number, h: number, d: number, physics: PhysicsWorld) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.crateMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createBollard(x: number, z: number, physics: PhysicsWorld) {
    const geom = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 12)
    const mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    const mesh = new THREE.Mesh(geom, mat)
    mesh.position.set(x, 0.6, z)
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, 0.6, z, 0.4, 0.6, 0.4, true)
  }

  private createRamp(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    l: number,
    rotX: number,
    physics: PhysicsWorld
  ) {
    const geom = new THREE.BoxGeometry(w, h, l)
    const mesh = new THREE.Mesh(geom, this.metalCatwalkMat)
    mesh.position.set(x, y, z)
    mesh.rotation.x = rotX
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, Math.max(0.5, (l * Math.sin(Math.abs(rotX))) / 2), l / 2, true)
  }

  public cleanup() {
    this.collidableMeshes = []
    while (this.group.children.length > 0) {
      const obj = this.group.children[0]
      this.group.remove(obj)
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
      }
    }
  }
}
