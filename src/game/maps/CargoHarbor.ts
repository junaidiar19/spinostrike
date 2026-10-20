import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class CargoHarbor {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (120m x 120m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 48)
  public tSpawn = new THREE.Vector3(0, 1.5, -48)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central Pier Plaza
    new THREE.Vector3(0, 8.8, 0),       // Gantry Crane High Catwalk (8.8m!)
    new THREE.Vector3(28, 5.5, 10),     // East Container Stack Roof Tier 2
    new THREE.Vector3(-16, 5.5, -16),   // West Container Stack Roof Tier 2
    new THREE.Vector3(42, 1, 0),        // Wharf Edge Sea Line (Sniper Lane)
    new THREE.Vector3(-36, 1, 8),       // Customs Clearance Terminal Entrance
    new THREE.Vector3(-36, 5.5, 8),     // Customs Terminal Roof Vantage
    new THREE.Vector3(26, 1, 24),       // East Pier Loading Bay South
    new THREE.Vector3(26, 1, -24),      // East Pier Freight Apron North
    new THREE.Vector3(-20, 1, 24),      // West Terminal Approach South
    new THREE.Vector3(-20, 1, -24),     // West Container Maze North
    new THREE.Vector3(0, 1, 38),        // CT Dock Spawn Exit
    new THREE.Vector3(0, 1, -38),       // T Freight Spawn Exit
    new THREE.Vector3(0, 4.4, 12),      // Crane South Access Ramp Mid
    new THREE.Vector3(0, 4.4, -12),     // Crane North Access Ramp Mid
    new THREE.Vector3(42, 1, 28)        // Wharf South Sniper Perch
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

  private barrelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Fuel barrel red
    roughness: 0.3,
    metalness: 0.6,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_cargo_harbor'

    // 1. Expanded Pier Concrete Ground (120m x 120m)
    const groundGeom = new THREE.BoxGeometry(120, 1, 120)
    const ground = new THREE.Mesh(groundGeom, this.pierFloorMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 60, 0.5, 60, true)

    // 2. Perimeter Security Walls (Height 8m, Thickness 2m at ±60m)
    this.createWall(0, 4, -60, 120, 8, 2, physics) // North
    this.createWall(0, 4, 60, 120, 8, 2, physics)  // South
    this.createWall(-60, 4, 0, 2, 8, 120, physics) // West
    this.createWall(60, 4, 0, 2, 8, 120, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT & T DOCK HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 48): Marine gate blast wall at z = 40
    this.createWall(-10, 3.5, 40, 16, 7, 2, physics)
    this.createWall(10, 3.5, 40, 16, 7, 2, physics)
    this.createCrate(0, 1, 43, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, 45, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, 45, 2.5, 2, 2, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.5, 58.8, 8, 2.2, Math.PI, 'PELABUHAN SAMUDERA NUSANTARA', 'POS PERTAHANAN DERMAGA SELATAN (CT)', { theme: 'maritime', code: 'PELABUHAN-CT-01' })
    this.createSign(10, 3.2, 38.8, 4.5, 1.5, 0, 'MENUJU TEPIAN DERMAGA ➔', 'JALUR KAPAL KARGO', { theme: 'info', arrow: 'right' })
    this.createSign(-10, 3.2, 38.8, 4.5, 1.5, 0, '◀ POS PEMERIKSAAN BEA CUKAI', 'TERMINAL INSPEKSI PABEAN', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -48): Freight gate blast wall at z = -40
    this.createWall(-10, 3.5, -40, 16, 7, 2, physics)
    this.createWall(10, 3.5, -40, 16, 7, 2, physics)
    this.createCrate(0, 1, -43, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, -45, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, -45, 2.5, 2, 2, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.5, -58.8, 8, 2.2, 0, 'DEPO PENUMPUKAN KONTAINER (T)', 'ZONA PENYUSUPAN FREIGHT UTARA', { theme: 'danger', code: 'PELABUHAN-T-02' })
    this.createSign(10, 3.2, -38.8, 4.5, 1.6, Math.PI, '◀ SERBU REL DEREK GANTRY', 'JALUR CRANE UTAMA', { theme: 'warning', arrow: 'left' })
    this.createSign(-10, 3.2, -38.8, 4.5, 1.6, Math.PI, 'SERBU TERMINAL KARANTINA ▶', 'ZONA LOGISTIK', { theme: 'warning', arrow: 'right' })

    // ==========================================================
    // 4. MASSIVE DUAL GANTRY CRANE SYSTEM (8.8M SNIPER CATWALK)
    // ==========================================================
    // 4 Heavy Steel Girder Legs at x = ±10, z = ±8 (Height: 8.8m)
    const legCoords = [[-10, -8], [10, -8], [-10, 8], [10, 8]]
    legCoords.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 8.8, 1.6), this.craneSteelMat)
      leg.position.set(lx, 4.4, lz)
      leg.castShadow = true
      this.group.add(leg)
      this.collidableMeshes.push(leg)
      physics.createBox(lx, 4.4, lz, 0.8, 4.4, 0.8, true)
    })

    // Overhead Crane Catwalk Runway at y = 8.8m (Span: 36m x 4.5m)
    const craneRunway = new THREE.Mesh(new THREE.BoxGeometry(36, 0.4, 5.0), this.metalCatwalkMat)
    craneRunway.position.set(0, 8.8, 0)
    craneRunway.receiveShadow = true
    this.group.add(craneRunway)
    this.collidableMeshes.push(craneRunway)
    physics.createBox(0, 8.8, 0, 18, 0.2, 2.5, true)

    // Crane Parapet Railings for Tactical Sniper Protection
    this.createWall(0, 9.6, -2.4, 36, 1.2, 0.2, physics)
    this.createWall(0, 9.6, 2.4, 36, 1.2, 0.2, physics)
    this.createWall(-17.9, 9.6, 0, 0.2, 1.2, 5.0, physics)
    this.createWall(17.9, 9.6, 0, 0.2, 1.2, 5.0, physics)

    // Center Crane Operator Control Cabin at (0, 10.2, 0)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.4, 3.5), this.wallMat)
    cab.position.set(0, 10.2, 0)
    cab.castShadow = true
    this.group.add(cab)
    this.collidableMeshes.push(cab)
    physics.createBox(0, 10.2, 0, 1.75, 1.2, 1.75, true)

    // Ramps to Crane Runway from South & North
    this.createRamp(0, 4.4, 12, 3.0, 0.3, 11.5, -Math.PI / 4.8, physics)
    this.createRamp(0, 4.4, -12, 3.0, 0.3, 11.5, Math.PI / 4.8, physics)

    // Gantry Crane Indonesian Signs
    this.createSign(0, 9.6, -2.2, 6, 1.6, 0, 'AWAS! DEREK CRANE BERGERAK', 'JALUR TEKNISI & OPERATOR ELEVASI 8.8M', { theme: 'warning', code: 'CRANE-GANTRY' })
    this.createSign(0, 9.6, 2.2, 6, 1.6, Math.PI, 'AWAS! DEREK CRANE BERGERAK', 'JALUR TEKNISI & OPERATOR ELEVASI 8.8M', { theme: 'warning', code: 'CRANE-GANTRY' })

    // ==========================================================
    // 5. GEDUNG PEMERIKSAAN BEA CUKAI & KARANTINA (WEST WING)
    // ==========================================================
    // Terminal Building Body at (-36, 2.5, 8) (w = 20, h = 5, d = 22)
    this.createWall(-36, 2.5, 8, 20, 5, 22, physics)
    // Terminal Roof at y = 5.2m
    const terminalRoof = new THREE.Mesh(new THREE.BoxGeometry(20.5, 0.4, 22.5), this.metalCatwalkMat)
    terminalRoof.position.set(-36, 5.2, 8)
    terminalRoof.receiveShadow = true
    this.group.add(terminalRoof)
    this.collidableMeshes.push(terminalRoof)
    physics.createBox(-36, 5.2, 8, 10.25, 0.2, 11.25, true)
    // Terminal Parapet Railing
    this.createWall(-36, 5.9, 19.2, 20.5, 1.1, 0.3, physics)
    this.createWall(-46.2, 5.9, 8, 0.3, 1.1, 22.5, physics)
    this.createRamp(-25, 2.6, 8, 3.0, 0.3, 8.0, 0.35, physics)

    // Customs Indonesian Signs
    this.createSign(-36, 4.0, 19.3, 7, 2.0, 0, 'KANTOR BEA CUKAI & KARANTINA', 'PEMERIKSAAN DOKUMEN & LOGISTIK MARITIM', { theme: 'maritime', code: 'BEA-CUKAI-08' })
    this.createSign(-25.8, 2.8, 8, 5, 1.5, Math.PI / 2, 'HANYA PETUGAS RESMI BERWENANG', 'AREA STERIL BARANG IMPORT & EXPORT', { theme: 'industrial' })
    this.createSign(-36, 6.0, 19.1, 4.5, 1.4, 0, 'ATAP PEMERIKSAAN PABEAN ▲', 'POS TEMBAK SUDUT BARAT', { theme: 'info', arrow: 'up' })

    // ==========================================================
    // 6. MULTI-TIER 3-STACK CONTAINER MAZE (EAST & WEST BLOCKS)
    // ==========================================================
    // East Block (x = 28): Stacks of Blue, Red, Green, Orange containers
    // Tier 1
    this.createContainer(28, 1.5, 10, 3.2, 3, 12, this.blueContainerMat, physics)
    this.createContainer(28, 1.5, -10, 3.2, 3, 12, this.redContainerMat, physics)
    this.createContainer(33, 1.5, 0, 3.2, 3, 10, this.orangeContainerMat, physics)
    // Tier 2 (y = 4.5m)
    this.createContainer(28, 4.5, 10, 3.2, 3, 12, this.greenContainerMat, physics)
    this.createContainer(28, 4.5, -10, 3.2, 3, 12, this.blueContainerMat, physics)
    // Tier 3 (y = 7.5m)
    this.createContainer(28, 7.5, 0, 3.2, 3, 10, this.redContainerMat, physics)

    // West Block Containers (x = -16, z = -18)
    this.createContainer(-16, 1.5, -18, 3.2, 3, 12, this.orangeContainerMat, physics)
    this.createContainer(-16, 4.5, -18, 3.2, 3, 12, this.blueContainerMat, physics)
    this.createContainer(-21, 1.5, -18, 3.2, 3, 10, this.greenContainerMat, physics)

    // Container Yard Indonesian Signs
    this.createSign(28, 4.0, 16.2, 5.5, 1.6, 0, 'DEPO KONTAINER SEKTOR A', 'DERMAGA 08 - KAPAL KARGO INTERNASIONAL', { theme: 'maritime' })
    this.createSign(-16, 4.0, -11.8, 5.5, 1.6, 0, 'DEPO KONTAINER SEKTOR B', 'AREA MUATAN MUDAH PECAH', { theme: 'warning' })
    this.createSign(33, 2.2, 5.2, 4.5, 1.4, 0, 'BAHAN PELEDAK MILITER', 'JAUHKAN DARI PERCIKAN API', { theme: 'danger' })

    // ==========================================================
    // 7. WATERFRONT WHARF EDGE & MOORING BOLLARDS (EAST WATER EDGE)
    // ==========================================================
    // Mooring bollards along X = 46
    for (let bz = -30; bz <= 30; bz += 15) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.0, 12), this.craneSteelMat)
      bollard.position.set(46, 0.5, bz)
      this.group.add(bollard)
      this.collidableMeshes.push(bollard)
      physics.createBox(46, 0.5, bz, 0.4, 0.5, 0.4, true)
    }

    // Wharf Edge Indonesian Signs
    this.createSign(46, 2.5, 0, 5, 1.5, -Math.PI / 2, 'SEKOCI & TITIK EVAKUASI LAUT', 'TITIK KUMPUL DARURAT PELABUHAN', { theme: 'info' })
    this.createSign(46, 2.5, 20, 5, 1.5, -Math.PI / 2, 'DILARANG MELINTASI TEPI DERMAGA', 'BAHAYA JATUH KE LAUT LEPAS', { theme: 'danger' })

    // 8. Tactical Barrels & Crates
    this.createBarrel(18, 0, 16, physics)
    this.createBarrel(18, 0, 17.5, physics)
    this.createBarrel(-10, 0, 20, physics)
    this.createBarrel(-10, 0, -20, physics)
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
