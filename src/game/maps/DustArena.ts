import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class DustArena {
  public group = new THREE.Group()
  public colliderBodies: unknown[] = []
  public collidableMeshes: THREE.Object3D[] = []

  // Tactical spawn locations
  public ctSpawn = new THREE.Vector3(0, 1.5, 30)
  public tSpawn = new THREE.Vector3(0, 1.5, -30)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),      // Mid
    new THREE.Vector3(18, 1, 10),    // A Long
    new THREE.Vector3(18, 2.5, -12), // A Site Platform
    new THREE.Vector3(-18, 1, 12),   // B Tunnels Entry
    new THREE.Vector3(-18, 1, -15),  // B Site
    new THREE.Vector3(0, 1, 24),     // CT Spawn exit
    new THREE.Vector3(0, 1, -24),    // T Spawn exit
    new THREE.Vector3(-6, 1, 0),     // Mid Doors Left
    new THREE.Vector3(6, 1, 0)       // Mid Doors Right
  ]

  // Realistic Procedural Materials
  private sandMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createSandstonePavement(),
    roughness: 0.82,
    metalness: 0.05
  })

  private wallMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createSandstoneWall(),
    roughness: 0.85,
    metalness: 0.05
  })

  private crateMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createTacticalCrate(),
    roughness: 0.65,
    metalness: 0.1
  })

  private metalMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createContainerTexture('#1d4ed8'),
    roughness: 0.45,
    metalness: 0.55
  })

  private barrelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Hazard Red
    roughness: 0.3,
    metalness: 0.65
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_dust_arena'

    // 1. Main Ground (80m x 80m)
    const groundGeom = new THREE.BoxGeometry(80, 1, 80)
    const ground = new THREE.Mesh(groundGeom, this.sandMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 40, 0.5, 40, true)

    // 2. Perimeter Walls (Height 6m, Thickness 2m)
    this.createWall(0, 3, -40, 80, 6, 2, physics) // North
    this.createWall(0, 3, 40, 80, 6, 2, physics)  // South
    this.createWall(-40, 3, 0, 2, 6, 80, physics) // West
    this.createWall(40, 3, 0, 2, 6, 80, physics)  // East

    // 2.5 Fortified Spawn Shelters / Hideouts (Tempat Persembunyian Awal)
    // CT Spawn Hideout: Solid blast wall & supply crates at z = 24 in front of ctSpawn (z = 30)
    this.createWall(-7, 2.5, 24, 12, 5, 1.5, physics) // Left bunker blast wall
    this.createWall(7, 2.5, 24, 12, 5, 1.5, physics)  // Right bunker blast wall
    // High sandbags and supply crates right in front of spawn point (z = 26)
    this.createCrate(0, 1, 26, 3.5, 2, 1.5, physics)
    this.createCrate(-3.5, 1, 28, 2, 2, 2, physics)
    this.createCrate(3.5, 1, 28, 2, 2, 2, physics)

    // T Spawn Hideout: Solid blast wall & crates at z = -24 in front of tSpawn (z = -30)
    this.createWall(-7, 2.5, -24, 12, 5, 1.5, physics)
    this.createWall(7, 2.5, -24, 12, 5, 1.5, physics)
    this.createCrate(0, 1, -26, 3.5, 2, 1.5, physics)
    this.createCrate(-3.5, 1, -28, 2, 2, 2, physics)
    this.createCrate(3.5, 1, -28, 2, 2, 2, physics)

    // 3. Central Courtyard / Mid Walls
    this.createWall(-12, 3, 0, 16, 6, 2, physics)
    this.createWall(12, 3, 0, 16, 6, 2, physics)
    // Arch over mid gap
    this.createWall(0, 5, 0, 8, 2, 2, physics)

    // 4. A-Site Elevated Platform & Ramp (East Side)
    const platGeom = new THREE.BoxGeometry(18, 1.5, 18)
    const plat = new THREE.Mesh(platGeom, this.wallMat)
    plat.position.set(22, 0.75, -15)
    plat.receiveShadow = true
    this.group.add(plat)
    this.collidableMeshes.push(plat)
    physics.createBox(22, 0.75, -15, 9, 0.75, 9, true)

    // Ramp to A-Site
    const rampGeom = new THREE.BoxGeometry(6, 1.5, 8)
    const ramp = new THREE.Mesh(rampGeom, this.wallMat)
    ramp.position.set(22, 0.4, -4)
    ramp.rotation.x = 0.2
    this.group.add(ramp)
    this.collidableMeshes.push(ramp)
    physics.createBox(22, 0.4, -4, 3, 0.75, 4, true)

    // 5. B-Site Cover & Enclosures (West Side)
    this.createWall(-22, 2.5, -20, 14, 5, 1.5, physics)
    this.createWall(-28, 2.5, -10, 1.5, 5, 18, physics)

    // 6. Tactical Wooden Shipping Crates (Cover)
    const crateLayout: [number, number, number, number, number, number][] = [
      // x, y, z, sx, sy, sz
      [0, 1, 8, 2, 2, 2],
      [-2, 1, 8, 2, 2, 2],
      [-1, 3, 8, 2, 2, 2], // Stacked crate
      [8, 1, -8, 2.5, 2, 2],
      [10, 1, -8, 2, 2, 2],
      [20, 2.5, -15, 2, 2, 2], // Crate on A platform
      [24, 2.5, -18, 2, 2, 2],
      [-16, 1, -12, 3, 2, 2],
      [-16, 1, 14, 2, 2, 2],
      [14, 1, 20, 2.5, 2, 2.5],
      [-10, 1, 22, 2, 2, 2],
      [0, 1, -15, 2, 2, 2],
      [-8, 1, -22, 2.5, 2, 2]
    ]

    crateLayout.forEach(([x, y, z, sx, sy, sz]) => {
      this.createCrate(x, y, z, sx, sy, sz, physics)
    })

    // 7. Metal Cargo Containers
    this.createMetalContainer(-18, 1.5, 4, 3, 3, 7, physics)
    this.createMetalContainer(18, 1.5, 12, 3, 3, 7, physics)

    // 8. Tactical Hazard Barrels
    this.createBarrel(25, 0, -12, physics)
    this.createBarrel(25, 0, -13.5, physics)
    this.createBarrel(-15, 0, 16, physics)
    this.createBarrel(6, 0, -8, physics)

    // 9. Tactical Team Banners & Site Decal Markers
    this.createTeamBanner(0, 4, 38.8, 0x1d3557) // CT Spawn South
    this.createTeamBanner(0, 4, -38.8, 0x588157) // T Spawn North

    // Bomb Site A & B 3D Letter Markers
    this.createSiteMarker(22, 2.5, -15, 0xf59e0b) // A Site
    this.createSiteMarker(-22, 2.5, -15, 0xf59e0b) // B Site
  }

  private createTeamBanner(x: number, y: number, z: number, color: number) {
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 0.2),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2 })
    )
    banner.position.set(x, y, z)
    this.group.add(banner)
  }

  private createSiteMarker(x: number, y: number, z: number, color: number) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 0.2),
      new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 })
    )
    marker.position.set(x, y + 1.2, z)
    this.group.add(marker)
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
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.wallMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createCrate(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    physics: PhysicsWorld
  ) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.crateMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createMetalContainer(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    physics: PhysicsWorld
  ) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.metalMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createBarrel(x: number, y: number, z: number, physics: PhysicsWorld) {
    const geom = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16)
    const mesh = new THREE.Mesh(geom, this.barrelMat)
    mesh.position.set(x, y + 0.7, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y + 0.7, z, 0.5, 0.7, 0.5, true)
  }

  public cleanup() {
    this.group.clear()
    this.collidableMeshes = []
  }
}
