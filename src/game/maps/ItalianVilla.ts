import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class ItalianVilla {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Tactical spawn locations
  public ctSpawn = new THREE.Vector3(0, 1.5, 34)
  public tSpawn = new THREE.Vector3(0, 1.5, -34)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central Piazza Fountain
    new THREE.Vector3(0, 5.0, 18),      // South Villa Balcony
    new THREE.Vector3(0, 5.0, -18),     // North Villa Sniper Terrace
    new THREE.Vector3(18, 1, 10),       // East Cobblestone Arch
    new THREE.Vector3(18, 4.2, 0),      // East Overhead Arch Bridge
    new THREE.Vector3(-18, 1, -10),     // West Wine Alley
    new THREE.Vector3(-18, 4.0, 0),     // West Terrace Flank
    new THREE.Vector3(0, 1, 28),        // CT Courtyard Spawn
    new THREE.Vector3(0, 1, -28)        // T Courtyard Spawn
  ]

  // Realistic Procedural Materials with DoubleSide for raycast & collision reliability
  private streetMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createCobblestoneStreet(),
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide
  })

  private terracottaWallMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createTerracottaWall(),
    roughness: 0.8,
    metalness: 0.05,
    side: THREE.DoubleSide
  })

  private roofTileMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createRoofTileTexture(),
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  private marbleMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createMarbleTexture(),
    roughness: 0.35,
    metalness: 0.15,
    side: THREE.DoubleSide
  })

  private crateMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createTacticalCrate(),
    roughness: 0.65,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_italian_villa'

    // 1. Cobblestone Ground (85m x 85m)
    const groundGeom = new THREE.BoxGeometry(85, 1, 85)
    const ground = new THREE.Mesh(groundGeom, this.streetMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 42.5, 0.5, 42.5, true)

    // 2. Perimeter Stone Walls (Height 7m, Thickness 2m)
    this.createWall(0, 3.5, -42.5, 85, 7, 2, physics) // North
    this.createWall(0, 3.5, 42.5, 85, 7, 2, physics)  // South
    this.createWall(-42.5, 3.5, 0, 2, 7, 85, physics) // West
    this.createWall(42.5, 3.5, 0, 2, 7, 85, physics)  // East

    // 3. Fortified Spawn Shelters / Hideouts
    // CT Spawn Hideout (z = 34): Solid Tuscan villa entrance wall & wine crates
    this.createWall(-8, 3, 28, 14, 6, 1.5, physics)
    this.createWall(8, 3, 28, 14, 6, 1.5, physics)
    this.createCrate(0, 1, 30, 4, 2, 2, physics)
    this.createCrate(-4, 1, 32, 2, 2, 2, physics)
    this.createCrate(4, 1, 32, 2, 2, 2, physics)

    // T Spawn Hideout (z = -34): Solid estate wall & supply boxes
    this.createWall(-8, 3, -28, 14, 6, 1.5, physics)
    this.createWall(8, 3, -28, 14, 6, 1.5, physics)
    this.createCrate(0, 1, -30, 4, 2, 2, physics)
    this.createCrate(-4, 1, -32, 2, 2, 2, physics)
    this.createCrate(4, 1, -32, 2, 2, 2, physics)

    // ==========================================================
    // 4. CENTRAL PIAZZA (Courtyard & Grand Marble Fountain)
    // ==========================================================
    // Fountain Marble Basin
    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.0, 1.2, 16), this.marbleMat)
    fountainBase.position.set(0, 0.6, 0)
    this.group.add(fountainBase)
    this.collidableMeshes.push(fountainBase)
    physics.createBox(0, 0.6, 0, 4.5, 0.6, 4.5, true)

    // Fountain Center Pillar / Obelisk (Sniper cover point)
    const obelisk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.5, 1.4), this.marbleMat)
    obelisk.position.set(0, 2.85, 0)
    this.group.add(obelisk)
    this.collidableMeshes.push(obelisk)
    physics.createBox(0, 2.85, 0, 0.7, 2.25, 0.7, true)

    // ==========================================================
    // 5. NORTH VILLA & BALCONY (T Vantage Point, y = 4.8m balcony)
    // ==========================================================
    // Villa Main Facade (Width 26m, Height 6m)
    this.createWall(0, 3.0, -18, 26, 6, 3, physics)
    // Accessible Balcony Platform jutting into Piazza at y = 4.5
    const northBalcony = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 5.0), this.roofTileMat)
    northBalcony.position.set(0, 4.5, -14.5)
    this.group.add(northBalcony)
    this.collidableMeshes.push(northBalcony)
    physics.createBox(0, 4.5, -14.5, 9.0, 0.2, 2.5, true)
    // Balcony Parapet Wall for sniper cover
    this.createCoverWall(0, 5.3, -12.1, 18, 1.2, 0.3, physics)
    this.createCoverWall(-8.85, 5.3, -14.5, 0.3, 1.2, 5.0, physics)
    this.createCoverWall(8.85, 5.3, -14.5, 0.3, 1.2, 5.0, physics)

    // Stone Steps up to North Balcony
    this.createStairs(11, 2.25, -14.5, 2.5, 0.3, 8.0, -Math.PI / 6, physics)

    // ==========================================================
    // 6. SOUTH VILLA & BALCONY (CT Vantage Point, y = 4.8m balcony)
    // ==========================================================
    this.createWall(0, 3.0, 18, 26, 6, 3, physics)
    const southBalcony = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 5.0), this.roofTileMat)
    southBalcony.position.set(0, 4.5, 14.5)
    this.group.add(southBalcony)
    this.collidableMeshes.push(southBalcony)
    physics.createBox(0, 4.5, 14.5, 9.0, 0.2, 2.5, true)
    this.createCoverWall(0, 5.3, 12.1, 18, 1.2, 0.3, physics)
    this.createCoverWall(-8.85, 5.3, 14.5, 0.3, 1.2, 5.0, physics)
    this.createCoverWall(8.85, 5.3, 14.5, 0.3, 1.2, 5.0, physics)

    // Stone Steps up to South Balcony
    this.createStairs(-11, 2.25, 14.5, 2.5, 0.3, 8.0, Math.PI / 6, physics)

    // ==========================================================
    // 7. EAST ALLEYWAY & OVERHEAD ARCH BRIDGE (y = 4.2m)
    // ==========================================================
    // East Corridor Buildings
    this.createWall(22, 3.5, 0, 14, 7, 36, physics)
    // Arch Bridge crossing the East lane at y = 4.2m
    const archBridge = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 3.5), this.streetMat)
    archBridge.position.set(10, 4.2, 0)
    this.group.add(archBridge)
    this.collidableMeshes.push(archBridge)
    physics.createBox(10, 4.2, 0, 5, 0.2, 1.75, true)
    // Bridge side walls
    this.createCoverWall(10, 4.9, 1.6, 10, 1.0, 0.2, physics)
    this.createCoverWall(10, 4.9, -1.6, 10, 1.0, 0.2, physics)

    // Stairs up to Arch Bridge from South
    this.createStairs(10, 2.1, 5.5, 2.5, 0.3, 7.5, Math.PI / 6, physics)

    // ==========================================================
    // 8. WEST TERRACE & WINE VAULT ALLEY (Flank Route)
    // ==========================================================
    this.createWall(-22, 3.0, 0, 14, 6, 36, physics)
    // Elevated stone terrace along West wall at y = 3.6m
    const westTerrace = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.4, 20), this.streetMat)
    westTerrace.position.set(-13, 3.6, 0)
    this.group.add(westTerrace)
    this.collidableMeshes.push(westTerrace)
    physics.createBox(-13, 3.6, 0, 2.25, 0.2, 10, true)
    this.createCoverWall(-11, 4.3, 0, 0.2, 1.0, 20, physics)

    // Ramp up to West Terrace from North
    this.createStairs(-13, 1.8, -14, 2.5, 0.3, 7.5, -Math.PI / 6, physics)

    // ==========================================================
    // 9. TACTICAL VILLA ACCENTS, STATUES & COVER PILLARS
    // ==========================================================
    // Classical Marble Columns flanking the Piazza entrance
    this.createMarblePillar(-6, 2.5, -8, physics)
    this.createMarblePillar(6, 2.5, -8, physics)
    this.createMarblePillar(-6, 2.5, 8, physics)
    this.createMarblePillar(6, 2.5, 8, physics)

    // Wine Barrels and Crates
    this.createCrate(-3.5, 1, 0, 2, 2, 2, physics)
    this.createCrate(3.5, 1, 0, 2, 2, 2, physics)
    this.createCrate(10, 1, -8, 2, 2, 2, physics)
    this.createCrate(-10, 1, 8, 2, 2, 2, physics)
  }

  private createWall(x: number, y: number, z: number, w: number, h: number, d: number, physics: PhysicsWorld) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.terracottaWallMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createCoverWall(x: number, y: number, z: number, w: number, h: number, d: number, physics: PhysicsWorld) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.terracottaWallMat)
    mesh.position.set(x, y, z)
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

  private createMarblePillar(x: number, y: number, z: number, physics: PhysicsWorld) {
    const geom = new THREE.CylinderGeometry(0.6, 0.7, 5.0, 16)
    const mesh = new THREE.Mesh(geom, this.marbleMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, 0.6, 2.5, 0.6, true)
  }

  private createStairs(
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
    const mesh = new THREE.Mesh(geom, this.streetMat)
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
