import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class CargoHarbor {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (120m x 120m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 96)
  public tSpawn = new THREE.Vector3(0, 1.5, -96)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central Pier Plaza
    new THREE.Vector3(0, 8.8, 0),       // Gantry Crane High Catwalk (8.8m!)
    new THREE.Vector3(56, 5.5, 20),     // East Container Stack Roof Tier 2
    new THREE.Vector3(-32, 5.5, -32),   // West Container Stack Roof Tier 2
    new THREE.Vector3(84, 1, 0),        // Wharf Edge Sea Line (Sniper Lane)
    new THREE.Vector3(-68, 1, 16),      // Customs Clearance Terminal Entrance
    new THREE.Vector3(-68, 5.5, 16),    // Customs Terminal Roof Vantage
    new THREE.Vector3(52, 1, 48),       // East Pier Loading Bay South
    new THREE.Vector3(52, 1, -48),      // East Pier Freight Apron North
    new THREE.Vector3(-40, 1, 48),      // West Terminal Approach South
    new THREE.Vector3(-40, 1, -48),     // West Container Maze North
    new THREE.Vector3(0, 1, 76),        // CT Dock Spawn Exit
    new THREE.Vector3(0, 1, -76),       // T Freight Spawn Exit
    new THREE.Vector3(0, 4.4, 24),      // Crane South Access Ramp Mid
    new THREE.Vector3(0, 4.4, -24),     // Crane North Access Ramp Mid
    new THREE.Vector3(84, 1, 56),       // Wharf South Sniper Perch
    new THREE.Vector3(70, 8.2, -45),    // Passenger Terminal Deck
    new THREE.Vector3(-70, 7.2, -45),   // Bonded Cargo Hangar Roof
    new THREE.Vector3(70, 8.2, 55),     // Marine Workshop Roof Deck
    new THREE.Vector3(-70, 8.2, 60),    // Harbor Master VTS Tower Roof
    new THREE.Vector3(-35, 1, 85),      // Weighbridge Office
    new THREE.Vector3(35, 1, -85)       // Fuel Bunkering Station
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

    // 1. Expanded Pier Concrete Ground (240m x 240m - 2x Larger Maritime Arena)
    const groundGeom = new THREE.BoxGeometry(240, 1, 240)
    const ground = new THREE.Mesh(groundGeom, this.pierFloorMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 120, 0.5, 120, true)

    // 2. Perimeter Security Walls (Height 8m, Thickness 3m at ±120m)
    this.createWall(0, 4, -120, 240, 8, 3, physics) // North
    this.createWall(0, 4, 120, 240, 8, 3, physics)  // South
    this.createWall(-120, 4, 0, 3, 8, 240, physics) // West
    this.createWall(120, 4, 0, 3, 8, 240, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT & T DOCK HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 96): Marine gate blast wall at z = 80
    this.createWall(-20, 3.5, 80, 32, 7, 3, physics)
    this.createWall(20, 3.5, 80, 32, 7, 3, physics)
    this.createCrate(0, 1, 86, 6, 2, 3, physics)
    this.createCrate(-9, 1, 90, 4, 2, 3, physics)
    this.createCrate(9, 1, 90, 4, 2, 3, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.5, 118.5, 12, 2.6, Math.PI, 'PELABUHAN SAMUDERA NUSANTARA', 'POS PERTAHANAN DERMAGA SELATAN (CT) - 240M MARITIME ARENA', { theme: 'maritime', code: 'PELABUHAN-CT-01' })
    this.createSign(20, 3.8, 77.8, 6, 1.8, 0, 'MENUJU TEPIAN DERMAGA ➔', 'JALUR KAPAL KARGO', { theme: 'info', arrow: 'right' })
    this.createSign(-20, 3.8, 77.8, 6, 1.8, 0, '◀ POS PEMERIKSAAN BEA CUKAI', 'TERMINAL INSPEKSI PABEAN', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -96): Freight gate blast wall at z = -80
    this.createWall(-20, 3.5, -80, 32, 7, 3, physics)
    this.createWall(20, 3.5, -80, 32, 7, 3, physics)
    this.createCrate(0, 1, -86, 6, 2, 3, physics)
    this.createCrate(-9, 1, -90, 4, 2, 3, physics)
    this.createCrate(9, 1, -90, 4, 2, 3, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.5, -118.5, 12, 2.6, 0, 'DEPO PENUMPUKAN KONTAINER (T)', 'ZONA PENYUSUPAN FREIGHT UTARA', { theme: 'danger', code: 'PELABUHAN-T-02' })
    this.createSign(20, 3.8, -77.8, 6, 1.8, Math.PI, '◀ SERBU REL DEREK GANTRY', 'JALUR CRANE UTAMA', { theme: 'warning', arrow: 'left' })
    this.createSign(-20, 3.8, -77.8, 6, 1.8, Math.PI, 'SERBU TERMINAL KARANTINA ▶', 'ZONA LOGISTIK', { theme: 'warning', arrow: 'right' })

    // ==========================================================
    // 4. MASSIVE DUAL GANTRY CRANE SYSTEM (8.8M SNIPER CATWALK)
    // ==========================================================
    // 4 Heavy Steel Girder Legs at x = ±20, z = ±16 (Height: 8.8m)
    const legCoords = [[-20, -16], [20, -16], [-20, 16], [20, 16]]
    legCoords.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.8, 2.4), this.craneSteelMat)
      leg.position.set(lx, 4.4, lz)
      leg.castShadow = true
      this.group.add(leg)
      this.collidableMeshes.push(leg)
      physics.createBox(lx, 4.4, lz, 1.2, 4.4, 1.2, true)
    })

    // Overhead Crane Catwalk Runway at y = 8.8m (Span: 72m x 6.0m)
    const craneRunway = new THREE.Mesh(new THREE.BoxGeometry(72, 0.4, 6.0), this.metalCatwalkMat)
    craneRunway.position.set(0, 8.8, 0)
    craneRunway.receiveShadow = true
    this.group.add(craneRunway)
    this.collidableMeshes.push(craneRunway)
    physics.createBox(0, 8.8, 0, 36, 0.2, 3.0, true)

    // Crane Parapet Railings
    this.createWall(0, 9.6, -2.9, 72, 1.2, 0.3, physics)
    this.createWall(0, 9.6, 2.9, 72, 1.2, 0.3, physics)
    this.createWall(-35.8, 9.6, 0, 0.3, 1.2, 6.0, physics)
    this.createWall(35.8, 9.6, 0, 0.3, 1.2, 6.0, physics)

    // Center Crane Operator Control Cabin at (0, 10.2, 0)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.8, 5.0), this.wallMat)
    cab.position.set(0, 10.4, 0)
    cab.castShadow = true
    this.group.add(cab)
    this.collidableMeshes.push(cab)
    physics.createBox(0, 10.4, 0, 2.5, 1.4, 2.5, true)

    // Ramps to Crane Runway from South & North
    this.createRamp(0, 4.4, 24, 4.5, 0.3, 18.0, -Math.PI / 4.8, physics)
    this.createRamp(0, 4.4, -24, 4.5, 0.3, 18.0, Math.PI / 4.8, physics)

    // Gantry Crane Indonesian Signs
    this.createSign(0, 9.6, -2.7, 8, 1.8, 0, 'AWAS! DEREK CRANE BERGERAK', 'JALUR TEKNISI & OPERATOR ELEVASI 8.8M', { theme: 'warning', code: 'CRANE-GANTRY' })
    this.createSign(0, 9.6, 2.7, 8, 1.8, Math.PI, 'AWAS! DEREK CRANE BERGERAK', 'JALUR TEKNISI & OPERATOR ELEVASI 8.8M', { theme: 'warning', code: 'CRANE-GANTRY' })

    // ==========================================================
    // 5. GEDUNG PEMERIKSAAN BEA CUKAI & KARANTINA (WEST WING)
    // ==========================================================
    this.createWall(-68, 2.5, 16, 36, 5, 36, physics)
    const terminalRoof = new THREE.Mesh(new THREE.BoxGeometry(37, 0.4, 37), this.metalCatwalkMat)
    terminalRoof.position.set(-68, 5.2, 16)
    terminalRoof.receiveShadow = true
    this.group.add(terminalRoof)
    this.collidableMeshes.push(terminalRoof)
    physics.createBox(-68, 5.2, 16, 18.5, 0.2, 18.5, true)

    this.createWall(-68, 5.9, 34.2, 37, 1.1, 0.4, physics)
    this.createWall(-86.2, 5.9, 16, 0.4, 1.1, 37, physics)
    this.createRamp(-48, 2.6, 16, 4.5, 0.3, 14.0, 0.35, physics)

    this.createSign(-68, 4.0, 34.3, 9, 2.2, 0, 'KANTOR BEA CUKAI & KARANTINA', 'PEMERIKSAAN DOKUMEN & LOGISTIK MARITIM', { theme: 'maritime', code: 'BEA-CUKAI-08' })
    this.createSign(-49.5, 3.2, 16, 6, 1.6, Math.PI / 2, 'HANYA PETUGAS RESMI BERWENANG', 'AREA STERIL BARANG IMPORT & EXPORT', { theme: 'industrial' })

    // ==========================================================
    // 6. MULTI-TIER 3-STACK CONTAINER MAZE (EAST & WEST BLOCKS)
    // ==========================================================
    this.createContainer(56, 1.5, 20, 5, 3, 20, this.blueContainerMat, physics)
    this.createContainer(56, 1.5, -20, 5, 3, 20, this.redContainerMat, physics)
    this.createContainer(56, 1.5, 0, 5, 3, 14, this.orangeContainerMat, physics)

    this.createContainer(56, 4.5, 20, 5, 3, 20, this.greenContainerMat, physics)
    this.createContainer(56, 4.5, -20, 5, 3, 20, this.blueContainerMat, physics)

    this.createContainer(-32, 1.5, -32, 16, 3, 5, this.redContainerMat, physics)
    this.createContainer(-32, 4.5, -32, 16, 3, 5, this.blueContainerMat, physics)

    // Mooring bollards along X = 88
    for (let bz = -60; bz <= 60; bz += 25) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 1.2, 12), this.craneSteelMat)
      bollard.position.set(88, 0.6, bz)
      this.group.add(bollard)
      this.collidableMeshes.push(bollard)
      physics.createBox(88, 0.6, bz, 0.5, 0.6, 0.5, true)
    }

    this.createSign(88, 2.8, 0, 7, 1.8, -Math.PI / 2, 'SEKOCI & TITIK EVAKUASI LAUT', 'TITIK KUMPUL DARURAT PELABUHAN', { theme: 'info' })
    this.createSign(88, 2.8, 36, 7, 1.8, -Math.PI / 2, 'DILARANG MELINTASI TEPI DERMAGA', 'BAHAYA JATUH KE LAUT LEPAS', { theme: 'danger' })

    this.createBarrel(36, 0, 32, physics)
    this.createBarrel(36, 0, 35, physics)
    this.createBarrel(-20, 0, 40, physics)
    this.createBarrel(-20, 0, -40, physics)

    // ==========================================================
    // 7. PORT PASSENGER TERMINALS, WAREHOUSES & CONTROL TOWERS
    // ==========================================================
    // Building 1: Port Passenger Terminal & Customs Hall (NE: x = 70, z = -45)
    this.createWall(70, 4.0, -45, 22, 8, 20, physics)
    this.createWall(70, 8.6, -55.5, 22, 1.2, 0.5, physics)
    this.createWall(70, 8.6, -34.5, 22, 1.2, 0.5, physics)
    this.createWall(81.5, 8.6, -45, 0.5, 1.2, 20, physics)
    this.createRamp(56, 4.0, -45, 4, 0.3, 16, -0.28, physics)
    this.createSign(70, 5.0, -34.8, 8, 2.0, 0, 'TERMINAL PENUMPANG & IMIGRASI', 'LANTAI 2 - DECK OBSERVASI SAMUDERA', { theme: 'maritime', code: 'TERM-SEA-01' })

    // Building 2: Bonded Cargo Warehouse Hangar (NW: x = -70, z = -45)
    this.createWall(-70, 3.5, -45, 22, 7, 20, physics)
    this.createWall(-70, 7.6, -34.5, 22, 1.2, 0.5, physics)
    this.createWall(-81.5, 7.6, -45, 0.5, 1.2, 20, physics)
    this.createRamp(-56, 3.5, -45, 4, 0.3, 14, -0.28, physics)
    this.createSign(-70, 4.5, -34.8, 8, 2.0, Math.PI, 'GUDANG BERIKAT KARGO INTERNASIONAL', 'PENYIMPANAN LOGISTIK PELABUHAN', { theme: 'industrial' })

    // Building 3: Marine Freight Workshop & Spares Depot (SE: x = 70, z = 55)
    this.createWall(70, 4.0, 55, 22, 8, 20, physics)
    this.createWall(70, 8.6, 44.5, 22, 1.2, 0.5, physics)
    this.createWall(70, 8.6, 65.5, 22, 1.2, 0.5, physics)
    this.createWall(81.5, 8.6, 55, 0.5, 1.2, 20, physics)
    this.createRamp(56, 4.0, 55, 4, 0.3, 16, 0.28, physics)
    this.createSign(70, 5.0, 44.8, 8, 2.0, 0, 'BENGKEL MESIN KAPAL & ALAT DERMAGA', 'SPESIALISASI DIESEL & HYDRAULIC', { theme: 'industrial' })

    // Building 4: Harbor Master & Port Traffic Control Tower (SW: x = -70, z = 60)
    this.createWall(-70, 4.0, 60, 18, 8, 18, physics)
    this.createWall(-70, 8.6, 50.5, 18, 1.2, 0.5, physics)
    this.createWall(-81.5, 8.6, 60, 0.5, 1.2, 18, physics)
    this.createRamp(-58, 4.0, 60, 4, 0.3, 16, 0.28, physics)
    this.createSign(-70, 5.0, 50.8, 8, 2.0, 0, 'MENARA LALU LINTAS LAUT (VTS)', 'LANTAI 2 - RADAR NAVIGASI KAPAL', { theme: 'maritime', code: 'VTS-RADAR' })

    // Building 5: Security Gate & Weighbridge Office (SW Base: x = -35, z = 85)
    this.createWall(-35, 3.0, 85, 14, 6, 14, physics)
    this.createSign(-35, 4.0, 77.8, 7, 1.8, 0, 'POS TIMBANG TRUK & PEMERIKSAAN', 'BEBAN MAKSIMUM 50 TON', { theme: 'maritime' })

    // Building 6: Fuel Bunkering & Maritime Oil Station (NE Base: x = 35, z = -85)
    this.createWall(35, 3.0, -85, 14, 6, 14, physics)
    this.createSign(35, 4.0, -77.8, 7, 1.8, Math.PI, 'STASIUN PENGISIAN BAHAN BAKAR KAPAL', 'BAHAYA MUATAN MUDAH TERBAKAR', { theme: 'danger' })
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
