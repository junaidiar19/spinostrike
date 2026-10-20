import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class ArcticOutpost {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (120m x 120m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 48)
  public tSpawn = new THREE.Vector3(0, 1.5, -48)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central Snow Courtyard
    new THREE.Vector3(0, 7.5, 0),       // Central Sniper Watchtower Apex (7.5m!)
    new THREE.Vector3(16, 5.5, 0),      // Skywalk East Bridge
    new THREE.Vector3(-16, 5.5, 0),     // Skywalk West Bridge
    new THREE.Vector3(32, 1, 18),       // Helipad Landing Zone
    new THREE.Vector3(34, 1, -16),      // Sub-Zero Fuel Depot Ground
    new THREE.Vector3(34, 5.5, -16),    // Fuel Depot Roof Vantage
    new THREE.Vector3(-34, 1, -16),     // Radar Station Entrance
    new THREE.Vector3(-34, 5.5, -16),   // Radar Station Roof Vantage
    new THREE.Vector3(-32, 1, 18),      // Cryo Pipeline Pass West
    new THREE.Vector3(0, 1, 36),        // CT Spawn Yard Exit
    new THREE.Vector3(0, 1, -36),       // T Spawn Yard Exit
    new THREE.Vector3(18, 1, 30),       // Helipad Access Path
    new THREE.Vector3(-18, 1, -30),     // Radar Flank Path North
    new THREE.Vector3(0, 3.8, 10),      // Tower South Ramp Midpoint
    new THREE.Vector3(0, 3.8, -10)      // Tower North Ramp Midpoint
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

  private helipadMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.2,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_arctic_outpost'

    // 1. Expanded Snow Ground (120m x 120m)
    const groundGeom = new THREE.BoxGeometry(120, 1, 120)
    const ground = new THREE.Mesh(groundGeom, this.snowMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 60, 0.5, 60, true)

    // 2. Perimeter Frost Walls (Height 8m, Thickness 2m at ±60m)
    this.createWall(0, 4, -60, 120, 8, 2, physics) // North
    this.createWall(0, 4, 60, 120, 8, 2, physics)  // South
    this.createWall(-60, 4, 0, 2, 8, 120, physics) // West
    this.createWall(60, 4, 0, 2, 8, 120, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT & T SPAWN HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 48): Frost bunker with blast walls at z = 40
    this.createWall(-10, 3.5, 40, 16, 7, 2, physics)
    this.createWall(10, 3.5, 40, 16, 7, 2, physics)
    this.createCrate(0, 1, 43, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, 45, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, 45, 2.5, 2, 2, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.5, 58.8, 8, 2.2, Math.PI, 'PANGKALAN RISET & MILITER ARKTIK', 'POS PERTAHANAN SELATAN (CT) - STATUS SIAGA 1', { theme: 'military', code: 'ARKTIK-CT-01' })
    this.createSign(10, 3.2, 38.8, 4.5, 1.5, 0, 'MENUJU HELIPAD ➔', 'LANDASAN UDARA SEKTOR 01', { theme: 'info', arrow: 'right' })
    this.createSign(-10, 3.2, 38.8, 4.5, 1.5, 0, '◀ MENUJU STASIUN RADAR', 'FASILITAS RISET & KOMUNIKASI', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -48): Infiltration base with blast walls at z = -40
    this.createWall(-10, 3.5, -40, 16, 7, 2, physics)
    this.createWall(10, 3.5, -40, 16, 7, 2, physics)
    this.createCrate(0, 1, -43, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, -45, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, -45, 2.5, 2, 2, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.5, -58.8, 8, 2.2, 0, 'STASIUN INFILTRASI KUTUB (T)', 'DEPO PENYUSUPAN UTARA - BADAI SALJU', { theme: 'danger', code: 'ARKTIK-T-02' })
    this.createSign(10, 3.2, -38.8, 4.5, 1.5, Math.PI, '◀ SERBU DEPO BAHAN BAKAR', 'JALUR SAYAP TIMUR', { theme: 'warning', arrow: 'left' })
    this.createSign(-10, 3.2, -38.8, 4.5, 1.5, Math.PI, 'SERBU STASIUN RADAR ▶', 'JALUR SAYAP BARAT', { theme: 'warning', arrow: 'right' })

    // ==========================================================
    // 4. LANDASAN HELIKOPTER MILITER (HELIPAD SECTOR 01)
    // ==========================================================
    // Helipad Concrete Pad at (32, 0.1, 18) (20m x 20m)
    const helipadMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), this.helipadMat)
    helipadMesh.position.set(32, 0.1, 18)
    helipadMesh.receiveShadow = true
    this.group.add(helipadMesh)
    this.collidableMeshes.push(helipadMesh)
    physics.createBox(32, 0.1, 18, 10, 0.1, 10, true)

    // Helipad Yellow 'H' Marking in 3D
    const hBarMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
    // Left vertical bar
    const hLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 8), hBarMat)
    hLeft.position.set(29, 0.23, 18)
    this.group.add(hLeft)
    // Right vertical bar
    const hRight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 8), hBarMat)
    hRight.position.set(35, 0.23, 18)
    this.group.add(hRight)
    // Crossbar
    const hMid = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 1.2), hBarMat)
    hMid.position.set(32, 0.23, 18)
    this.group.add(hMid)

    // Helipad Supply Crates & Blast Barriers
    this.createCrate(32, 1, 26, 4, 2, 2, physics)
    this.createCrate(40, 1, 18, 2, 2, 3, physics)

    // Helipad Indonesian Signs
    this.createSign(32, 2.4, 7.8, 5.5, 1.8, 0, 'LANDASAN HELIKOPTER SEKTOR 01', 'KHUSUS EVAKUASI MEDIS & PENERBANGAN MILITER', { theme: 'military', code: 'HELI-BASE' })
    this.createSign(42.2, 2.4, 18, 5, 1.6, -Math.PI / 2, 'AWAS ARUS ANGIN HELIKOPTER', 'DILARANG MENDEKAT SAAT BALING-BALING BERPUTAR', { theme: 'warning' })

    // ==========================================================
    // 5. CENTRAL HIGH WATCHTOWER (7.5M SNIPER APEX) & SKYBRIDGES
    // ==========================================================
    // 4 Steel Pillar Legs (Height 7.5m)
    const pillarGeom = new THREE.BoxGeometry(1.0, 7.2, 1.0)
    const pMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    const coords = [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]]
    coords.forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeom, pMat)
      p.position.set(px, 3.6, pz)
      p.castShadow = true
      this.group.add(p)
      this.collidableMeshes.push(p)
      physics.createBox(px, 3.6, pz, 0.5, 3.6, 0.5, true)
    })

    // Tower Observation Platform floor (8m x 8m at y = 7.2m)
    const towerFloor = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.4, 8.5), this.metalCatwalkMat)
    towerFloor.position.set(0, 7.2, 0)
    towerFloor.receiveShadow = true
    this.group.add(towerFloor)
    this.collidableMeshes.push(towerFloor)
    physics.createBox(0, 7.2, 0, 4.25, 0.2, 4.25, true)

    // Tower parapet railing cover for snipers (1.2m high)
    this.createCoverWall(0, 8.0, -4.2, 8.5, 1.2, 0.3, physics)
    this.createCoverWall(0, 8.0, 4.2, 8.5, 1.2, 0.3, physics)
    this.createCoverWall(-4.2, 8.0, 0, 0.3, 1.2, 8.5, physics)
    this.createCoverWall(4.2, 8.0, 0, 0.3, 1.2, 8.5, physics)

    // Ramps to Tower from South & North
    this.createRamp(0, 3.6, 8.5, 3.0, 0.3, 9.5, -Math.PI / 5.5, physics)
    this.createRamp(0, 3.6, -8.5, 3.0, 0.3, 9.5, Math.PI / 5.5, physics)

    // Skywalk Bridges connecting Tower (y = 5.5m level) to East and West bunkers
    // Skywalk East: span from x = 4.2 to 24 (Length 20m at y = 5.2m)
    this.createSkywalk(14, 5.2, 0, 20, 0.3, 3.5, physics)
    // Skywalk West: span from x = -4.2 to -24 (Length 20m at y = 5.2m)
    this.createSkywalk(-14, 5.2, 0, 20, 0.3, 3.5, physics)

    // Tower Indonesian Signs
    this.createSign(0, 8.0, -4.0, 5, 1.4, 0, 'MENARA OBSERVASI UTAMA', 'POS PENEMBAK JITU KETINGGIAN 7.5M', { theme: 'military', code: 'SNIPER-TOWER' })
    this.createSign(0, 8.0, 4.0, 5, 1.4, Math.PI, 'MENARA OBSERVASI UTAMA', 'POS PENEMBAK JITU KETINGGIAN 7.5M', { theme: 'military', code: 'SNIPER-TOWER' })

    // ==========================================================
    // 6. STASIUN RADAR & RISET ES (SECTOR B - WEST WING)
    // ==========================================================
    // Bunker Building Body at (-34, 2.5, -16) (w = 20, h = 5, d = 22)
    this.createWall(-34, 2.5, -16, 20, 5, 22, physics)
    // Accessible Bunker Roof at y = 5.2m
    const radarRoof = new THREE.Mesh(new THREE.BoxGeometry(20.5, 0.4, 22.5), this.metalCatwalkMat)
    radarRoof.position.set(-34, 5.2, -16)
    radarRoof.receiveShadow = true
    this.group.add(radarRoof)
    this.collidableMeshes.push(radarRoof)
    physics.createBox(-34, 5.2, -16, 10.25, 0.2, 11.25, true)

    // Radar Roof Parapets for Sniper Protection
    this.createCoverWall(-34, 5.9, -4.8, 20.5, 1.1, 0.3, physics)
    this.createCoverWall(-44.2, 5.9, -16, 0.3, 1.1, 22.5, physics)
    // Ramp to Radar Roof
    this.createRamp(-23, 2.6, -16, 3.0, 0.3, 8.0, 0.35, physics)

    // Radar Dish Base
    const dishBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 2.5, 16), this.hazardMat)
    dishBase.position.set(-34, 6.6, -16)
    dishBase.castShadow = true
    this.group.add(dishBase)
    this.collidableMeshes.push(dishBase)
    physics.createBox(-34, 6.6, -16, 1.8, 1.25, 1.8, true)

    // Radar Station Indonesian Signs
    this.createSign(-34, 4.0, -4.8, 7, 2.0, 0, 'STASIUN RADAR & PERTAHANAN UDARA', 'SEKTOR B - SISTEM DETEKSI AWAL DINI', { theme: 'military', code: 'RADAR-BRAVO' })
    this.createSign(-23.8, 2.8, -16, 5, 1.5, Math.PI / 2, 'LABORATORIUM KRIOGENIK - AREA TERBATAS', 'KENAKAN PAKAIAN KHUSUS TAHAN DINGIN', { theme: 'danger' })
    this.createSign(-34, 5.9, -4.6, 4.5, 1.2, 0, 'ATAP PENGAWASAN RADAR ▲', 'POS TEMBAK SUDUT BARAT', { theme: 'info', arrow: 'up' })

    // ==========================================================
    // 7. DEPO BAHAN BAKAR SUB-ZERO & TANGKI CRYO (EAST WING)
    // ==========================================================
    // Fuel Depot Building Body at (34, 2.5, -16) (w = 20, h = 5, d = 22)
    this.createWall(34, 2.5, -16, 20, 5, 22, physics)
    // Roof at y = 5.2m
    const fuelRoof = new THREE.Mesh(new THREE.BoxGeometry(20.5, 0.4, 22.5), this.metalCatwalkMat)
    fuelRoof.position.set(34, 5.2, -16)
    fuelRoof.receiveShadow = true
    this.group.add(fuelRoof)
    this.collidableMeshes.push(fuelRoof)
    physics.createBox(34, 5.2, -16, 10.25, 0.2, 11.25, true)
    // Fuel Roof Parapets
    this.createCoverWall(34, 5.9, -4.8, 20.5, 1.1, 0.3, physics)
    this.createCoverWall(44.2, 5.9, -16, 0.3, 1.1, 22.5, physics)
    this.createRamp(23, 2.6, -16, 3.0, 0.3, 8.0, 0.35, physics)

    // 3 Large Cryogenic Fuel Tanks
    this.createCryoTank(30, 0, -22, physics)
    this.createCryoTank(34, 0, -22, physics)
    this.createCryoTank(38, 0, -22, physics)

    // Fuel Depot Indonesian Signs
    this.createSign(34, 4.0, -4.8, 7, 2.0, 0, 'DEPO BAHAN BAKAR SUB-ZERO', 'BAHAN BAKAR TANK & GENERATOR LISTRIK', { theme: 'warning', code: 'FUEL-DEPOT' })
    this.createSign(23.8, 2.8, -16, 5, 1.5, -Math.PI / 2, 'DILARANG MENYALAKAN API!', 'BAHAN PELEDAK MUDAH TERBAKAR PADA SUHU DINGIN', { theme: 'danger' })

    // 8. Tactical Cryo Barrels & Ice Boulders
    this.createBarrel(14, 0, 18, physics)
    this.createBarrel(14, 0, 19.5, physics)
    this.createBarrel(-14, 0, 18, physics)
    this.createBarrel(-14, 0, -18, physics)
  }

  private createCryoTank(x: number, y: number, z: number, physics: PhysicsWorld) {
    const geom = new THREE.CylinderGeometry(1.6, 1.6, 4.5, 16)
    const mesh = new THREE.Mesh(geom, this.iceMat)
    mesh.position.set(x, y + 2.25, z)
    mesh.castShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y + 2.25, z, 1.6, 2.25, 1.6, true)
  }

  private createSkywalk(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    physics: PhysicsWorld
  ) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.metalCatwalkMat)
    mesh.position.set(x, y, z)
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createSign(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    rotY: number,
    title: string,
    subtitle: string = '',
    options: {
      theme?: 'warning' | 'danger' | 'military' | 'industrial' | 'maritime' | 'vintage' | 'info'
      arrow?: 'left' | 'right' | 'up' | 'none'
      code?: string
    } = {}
  ) {
    const texture = TextureGenerator.createSignTexture(title, subtitle, options)
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.2,
      side: THREE.DoubleSide
    })
    const geom = new THREE.BoxGeometry(w, h, 0.12)
    const mesh = new THREE.Mesh(geom, mat)
    mesh.position.set(x, y, z)
    mesh.rotation.y = rotY
    mesh.castShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
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
    const mesh = new THREE.Mesh(geom, this.bunkerWallMat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createCoverWall(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    physics: PhysicsWorld
  ) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.bunkerWallMat)
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
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.metalCatwalkMat)
    mesh.position.set(x, y, z)
    mesh.rotation.x = rotX
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)
    this.collidableMeshes.push(mesh)
    physics.createBox(x, y, z, w / 2, h / 2, d / 2, true)
  }

  private createBarrel(x: number, y: number, z: number, physics: PhysicsWorld) {
    const geom = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16)
    const mesh = new THREE.Mesh(geom, this.hazardMat)
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
