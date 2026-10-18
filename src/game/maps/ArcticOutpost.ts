import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class ArcticOutpost {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Tactical spawn locations
  public ctSpawn = new THREE.Vector3(0, 1.5, 34)
  public tSpawn = new THREE.Vector3(0, 1.5, -34)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Center Courtyard
    new THREE.Vector3(0, 6.5, 0),       // Central Sniper Tower Top
    new THREE.Vector3(18, 1, 10),       // East Ice Path
    new THREE.Vector3(18, 4.5, -8),     // Sector-A Bunker Roof
    new THREE.Vector3(-18, 1, 12),      // West Cryo Pass
    new THREE.Vector3(-18, 4.0, -12),   // Sector-B Radar Platform
    new THREE.Vector3(0, 1, 26),        // CT Spawn Yard
    new THREE.Vector3(0, 1, -26),       // T Spawn Yard
    new THREE.Vector3(10, 4.5, 0),      // Skywalk Bridge East
    new THREE.Vector3(-10, 4.5, 0)      // Skywalk Bridge West
  ]

  // Realistic Procedural Materials with DoubleSide for raycast & collision reliability
  private snowMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createSnowGround(),
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide
  })

  private bunkerWallMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createIceBunkerWall(),
    roughness: 0.5,
    metalness: 0.45,
    side: THREE.DoubleSide
  })

  private crateMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createTacticalCrate(),
    roughness: 0.65,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  private metalCatwalkMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createMetalCatwalk(),
    roughness: 0.35,
    metalness: 0.75,
    side: THREE.DoubleSide
  })

  private iceMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide
  })

  private hazardMat = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Hazard Red Cryo
    roughness: 0.3,
    metalness: 0.6,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_arctic_outpost'

    // 1. Main Snow Ground (85m x 85m)
    const groundGeom = new THREE.BoxGeometry(85, 1, 85)
    const ground = new THREE.Mesh(groundGeom, this.snowMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 42.5, 0.5, 42.5, true)

    // 2. Perimeter Frost Walls (Height 7m, Thickness 2m)
    this.createWall(0, 3.5, -42.5, 85, 7, 2, physics) // North
    this.createWall(0, 3.5, 42.5, 85, 7, 2, physics)  // South
    this.createWall(-42.5, 3.5, 0, 2, 7, 85, physics) // West
    this.createWall(42.5, 3.5, 0, 2, 7, 85, physics)  // East

    // 3. Fortified Spawn Shelters / Hideouts
    // CT Spawn Hideout (z = 34): Solid blast wall at z = 28
    this.createWall(-8, 3, 28, 14, 6, 1.5, physics)
    this.createWall(8, 3, 28, 14, 6, 1.5, physics)
    this.createCrate(0, 1, 30, 4, 2, 2, physics)
    this.createCrate(-4, 1, 32, 2, 2, 2, physics)
    this.createCrate(4, 1, 32, 2, 2, 2, physics)

    // T Spawn Hideout (z = -34): Solid blast wall at z = -28
    this.createWall(-8, 3, -28, 14, 6, 1.5, physics)
    this.createWall(8, 3, -28, 14, 6, 1.5, physics)
    this.createCrate(0, 1, -30, 4, 2, 2, physics)
    this.createCrate(-4, 1, -32, 2, 2, 2, physics)
    this.createCrate(4, 1, -32, 2, 2, 2, physics)

    // ==========================================================
    // 4. CENTRAL HIGH WATCHTOWER / SNIPER VANTAGE POINT (7m tall)
    // ==========================================================
    // 4 Steel Pillar legs
    const pillarGeom = new THREE.BoxGeometry(0.8, 6.5, 0.8)
    const pMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    const coords = [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]]
    coords.forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeom, pMat)
      p.position.set(px, 3.25, pz)
      this.group.add(p)
      this.collidableMeshes.push(p)
      physics.createBox(px, 3.25, pz, 0.4, 3.25, 0.4, true)
    })

    // Tower Observation Platform floor (6m x 6m at y = 6.0)
    const towerFloor = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 6.5), this.metalCatwalkMat)
    towerFloor.position.set(0, 6.0, 0)
    this.group.add(towerFloor)
    this.collidableMeshes.push(towerFloor)
    physics.createBox(0, 6.0, 0, 3.25, 0.2, 3.25, true)

    // Tower parapet railing cover for snipers (1m high)
    this.createCoverWall(0, 6.7, -3.2, 6.5, 1.2, 0.2, physics)
    this.createCoverWall(0, 6.7, 3.2, 6.5, 1.2, 0.2, physics)
    this.createCoverWall(-3.2, 6.7, 0, 0.2, 1.2, 6.5, physics)
    this.createCoverWall(3.2, 6.7, 0, 0.2, 1.2, 6.5, physics)

    // Ramp stairs up to Tower platform from South & North
    this.createRamp(0, 3.0, 6.5, 2.2, 0.3, 7.5, -Math.PI / 6, physics)
    this.createRamp(0, 3.0, -6.5, 2.2, 0.3, 7.5, Math.PI / 6, physics)

    // ==========================================================
    // 5. SECTOR-A SUB-ZERO RESEARCH BUNKER (East Wing, y = 4.2m roof)
    // ==========================================================
    // Bunker Building Body
    this.createWall(22, 2.2, -6, 16, 4.4, 18, physics)
    // Bunker accessible roof platform
    const bunkerRoof = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.3, 18.5), this.metalCatwalkMat)
    bunkerRoof.position.set(22, 4.4, -6)
    this.group.add(bunkerRoof)
    this.collidableMeshes.push(bunkerRoof)
    physics.createBox(22, 4.4, -6, 8.25, 0.15, 9.25, true)

    // Roof sniper parapet cover
    this.createCoverWall(22, 5.1, 3.2, 16.5, 1.2, 0.3, physics)
    this.createCoverWall(22, 5.1, -15.2, 16.5, 1.2, 0.3, physics)
    this.createCoverWall(13.8, 5.1, -6, 0.3, 1.2, 18.5, physics)
    // Access Ramp from Ground to Bunker Roof
    this.createRamp(22, 2.2, 7.5, 3.0, 0.3, 9.0, Math.PI / 7, physics)

    // ==========================================================
    // 6. SECTOR-B RADAR STATION & CRYO COMPLEX (West Wing, y = 4.0m)
    // ==========================================================
    this.createWall(-22, 2.0, -6, 16, 4.0, 18, physics)
    const radarRoof = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.3, 18.5), this.metalCatwalkMat)
    radarRoof.position.set(-22, 4.0, -6)
    this.group.add(radarRoof)
    this.collidableMeshes.push(radarRoof)
    physics.createBox(-22, 4.0, -6, 8.25, 0.15, 9.25, true)

    // Radar Dome on West Roof
    const domeGeom = new THREE.SphereGeometry(3.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.5 })
    const dome = new THREE.Mesh(domeGeom, domeMat)
    dome.position.set(-22, 4.15, -6)
    this.group.add(dome)
    this.collidableMeshes.push(dome)
    physics.createBox(-22, 5.5, -6, 2.5, 1.5, 2.5, true)

    // Access Ramp to Radar Roof
    this.createRamp(-22, 2.0, 7.5, 3.0, 0.3, 8.5, Math.PI / 7, physics)

    // ==========================================================
    // 7. HIGH ELEVATED SKYWALK CATWALK BRIDGES (Connecting Wings)
    // ==========================================================
    // East Skywalk (From Bunker Roof toward Tower)
    const eastBridge = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 2.5), this.metalCatwalkMat)
    eastBridge.position.set(9, 4.4, -6)
    this.group.add(eastBridge)
    this.collidableMeshes.push(eastBridge)
    physics.createBox(9, 4.4, -6, 5, 0.15, 1.25, true)
    // Bridge safety rails
    this.createCoverWall(9, 5.0, -4.8, 10, 1.0, 0.15, physics)
    this.createCoverWall(9, 5.0, -7.2, 10, 1.0, 0.15, physics)

    // West Skywalk (From Radar Roof toward Tower)
    const westBridge = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 2.5), this.metalCatwalkMat)
    westBridge.position.set(-9, 4.0, -6)
    this.group.add(westBridge)
    this.collidableMeshes.push(westBridge)
    physics.createBox(-9, 4.0, -6, 5, 0.15, 1.25, true)
    this.createCoverWall(-9, 4.6, -4.8, 10, 1.0, 0.15, physics)
    this.createCoverWall(-9, 4.6, -7.2, 10, 1.0, 0.15, physics)

    // ==========================================================
    // 8. TACTICAL ICE BLOCKS, CRYO TANKS & HIGH COVER BOXES
    // ==========================================================
    // Cryo fuel tanks (Hazard red cylinders)
    this.createCryoTank(11, 2, 16, physics)
    this.createCryoTank(13.5, 2, 16, physics)
    this.createCryoTank(-11, 2, 16, physics)
    this.createCryoTank(-13.5, 2, 16, physics)

    // Large Ice Monoliths in Open Courtyard (Sniper sightline breaks)
    this.createIceBlock(-8, 2.0, 12, 3.5, 4.0, 2.5, physics)
    this.createIceBlock(8, 2.0, -12, 3.5, 4.0, 2.5, physics)
    this.createIceBlock(12, 1.5, 0, 3.0, 3.0, 2.0, physics)
    this.createIceBlock(-12, 1.5, 0, 3.0, 3.0, 2.0, physics)

    // Stacked Crates in Mid Lane
    this.createCrate(-4, 1.0, -16, 2, 2, 2, physics)
    this.createCrate(-4, 2.5, -16, 1.6, 1.6, 1.6, physics)
    this.createCrate(4, 1.0, 16, 2, 2, 2, physics)
    this.createCrate(4, 2.5, 16, 1.6, 1.6, 1.6, physics)
  }

  private createWall(x: number, y: number, z: number, w: number, h: number, d: number, physics: PhysicsWorld) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.bunkerWallMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createCoverWall(x: number, y: number, z: number, w: number, h: number, d: number, physics: PhysicsWorld) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.bunkerWallMat)
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

  private createIceBlock(x: number, y: number, z: number, w: number, h: number, d: number, physics: PhysicsWorld) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.iceMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createCryoTank(x: number, y: number, z: number, physics: PhysicsWorld) {
    const geom = new THREE.CylinderGeometry(1.0, 1.0, 3.8, 16)
    const mesh = new THREE.Mesh(geom, this.hazardMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, 1.0, 1.9, 1.0, true)
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
