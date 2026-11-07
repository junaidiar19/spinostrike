import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class Warehouse {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (95m x 115m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 92)
  public tSpawn = new THREE.Vector3(0, 1.5, -92)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central hangar floor
    new THREE.Vector3(0, 3.5, 0),       // Central Skybridge Overlook
    new THREE.Vector3(40, 1, 32),       // East Freight Corridor
    new THREE.Vector3(-40, 1, 32),      // West Chemical Corridor
    new THREE.Vector3(40, 1, -32),      // East Rack Storage
    new THREE.Vector3(-40, 1, -32),     // West Container Bay
    new THREE.Vector3(64, 3.5, 30),     // East Catwalk Mezzanine South
    new THREE.Vector3(64, 3.5, -30),    // East Catwalk Mezzanine North
    new THREE.Vector3(-64, 3.5, 30),    // West Catwalk Mezzanine South
    new THREE.Vector3(-64, 3.5, -30),   // West Catwalk Mezzanine North
    new THREE.Vector3(0, 1, 68),        // CT Loading Bay Exit
    new THREE.Vector3(0, 1, -68),       // T Receiving Bay Exit
    new THREE.Vector3(24, 1, 0),        // Central Stacks Flank East
    new THREE.Vector3(-24, 1, 0),       // Central Stacks Flank West
    new THREE.Vector3(68, 1, 60),       // CT East Ramp Foot
    new THREE.Vector3(-68, 1, -60),     // T West Ramp Foot
    new THREE.Vector3(-72, 8.2, -10),   // Admin Office Mezzanine Deck
    new THREE.Vector3(72, 8.2, -10),    // Hazmat Lab Observation Roof
    new THREE.Vector3(-50, 7.2, 60),    // Heavy Maintenance Garage Roof
    new THREE.Vector3(50, 7.2, 60),     // Cold Chain Cargo Vault Roof
    new THREE.Vector3(-72, 1, -68),     // Server & Security Hub
    new THREE.Vector3(72, 1, -68)       // High-Voltage Electrical Substation
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

  private greenContainerMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createContainerTexture('#047857'),
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

  private barrelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Hazard Red Chemical
    roughness: 0.3,
    metalness: 0.65,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_warehouse'

    // 1. Expanded Industrial Concrete Ground (190m x 230m - 2x Larger Mega Hangar)
    const floorGeom = new THREE.BoxGeometry(190, 1, 230)
    const floor = new THREE.Mesh(floorGeom, this.floorMat)
    floor.position.set(0, -0.5, 0)
    floor.receiveShadow = true
    this.group.add(floor)
    this.collidableMeshes.push(floor)
    physics.createBox(0, -0.5, 0, 95, 0.5, 115, true)

    // 2. High Industrial Perimeter Walls (H: 10m, D: 3m)
    this.createWall(0, 5.0, -115, 190, 10, 3, physics) // North
    this.createWall(0, 5.0, 115, 190, 10, 3, physics)  // South
    this.createWall(-95, 5.0, 0, 3, 10, 230, physics) // West
    this.createWall(95, 5.0, 0, 3, 10, 230, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT & T LOADING BAY HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 92): Trailer container barrier & pallets at z = 76
    this.createContainer(-24, 1.5, 76, 12, 3, 4, this.blueContainerMat, physics)
    this.createContainer(24, 1.5, 76, 12, 3, 4, this.redContainerMat, physics)
    this.createCrate(0, 1, 82, 6, 2, 3, physics)
    this.createCrate(-9, 1, 86, 4, 2, 3, physics)
    this.createCrate(9, 1, 86, 4, 2, 3, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.5, 113.3, 12, 2.8, Math.PI, 'GUDANG LOGISTIK UTAMA - SEKTOR 04', 'DERMAGA BONGKAR MUAT SELATAN (CT) - 190M MEGA HANGAR', { theme: 'industrial', code: 'LOG-K3-04' })
    this.createSign(24, 3.8, 72.3, 6, 1.8, 0, 'JALUR CATWALK TIMUR ➔', 'AKSES TANGGA MEZZANINE', { theme: 'info', arrow: 'right' })
    this.createSign(-24, 3.8, 72.3, 6, 1.8, 0, '◀ JALUR CATWALK BARAT', 'ZONA PENYIMPANAN KIMIA', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -92): Trailer container barrier & crates at z = -76
    this.createContainer(-24, 1.5, -76, 12, 3, 4, this.redContainerMat, physics)
    this.createContainer(24, 1.5, -76, 12, 3, 4, this.greenContainerMat, physics)
    this.createCrate(0, 1, -82, 6, 2, 3, physics)
    this.createCrate(-9, 1, -86, 4, 2, 3, physics)
    this.createCrate(9, 1, -86, 4, 2, 3, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.5, -113.3, 12, 2.8, 0, 'TERMINAL PENERIMAAN FREIGHT (T)', 'DEPO DISTRIBUSI KARGO UTARA', { theme: 'industrial', code: 'LOG-T-02' })
    this.createSign(24, 3.8, -72.3, 6, 1.8, Math.PI, '◀ MENUJU HANGAR UTAMA', 'JALUR LOGISTIK UTARA', { theme: 'warning', arrow: 'left' })
    this.createSign(-24, 3.8, -72.3, 6, 1.8, Math.PI, 'MENUJU ZONA KIMIA ▶', 'AREA BERBAHAYA', { theme: 'danger', arrow: 'right' })

    // ==========================================================
    // 4. ELEVATED CATWALK MEZZANINE (EAST & WEST) + CENTRAL SKYBRIDGE
    // ==========================================================
    // East Catwalk at x = 64 (Length: 140m, y = 3.5m)
    this.createCatwalk(64, 3.5, 0, 7, 0.4, 140, physics)
    // West Catwalk at x = -64 (Length: 140m, y = 3.5m)
    this.createCatwalk(-64, 3.5, 0, 7, 0.4, 140, physics)

    // Central Connecting Skybridge (Span: 128m at z = 0, y = 3.5m)
    this.createCatwalk(0, 3.5, 0, 128, 0.4, 6.0, physics)

    // Catwalk Parapet Railings
    this.createWall(64, 4.4, 70, 7, 1.2, 0.3, physics)
    this.createWall(64, 4.4, -70, 7, 1.2, 0.3, physics)
    this.createWall(-64, 4.4, 70, 7, 1.2, 0.3, physics)
    this.createWall(-64, 4.4, -70, 7, 1.2, 0.3, physics)
    this.createCrate(0, 4.5, 0, 3, 1.6, 3, physics)

    // Supporting Pillars
    const pillarGeom = new THREE.BoxGeometry(1.2, 3.5, 1.2)
    const pillarCoords = [
      [-40, 0], [-20, 0], [20, 0], [40, 0],
      [64, -44], [64, 0], [64, 44],
      [-64, -44], [-64, 0], [-64, 44]
    ]
    pillarCoords.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeom, this.girderMat)
      pillar.position.set(px, 1.75, pz)
      pillar.castShadow = true
      this.group.add(pillar)
      this.collidableMeshes.push(pillar)
      physics.createBox(px, 1.75, pz, 0.6, 1.75, 0.6, true)
    })

    // Ramps to Catwalks
    this.createRamp(64, 1.75, 64, 5, 0.3, 16, 0.28, physics)
    this.createRamp(64, 1.75, -64, 5, 0.3, 16, -0.28, physics)
    this.createRamp(-64, 1.75, 64, 5, 0.3, 16, 0.28, physics)
    this.createRamp(-64, 1.75, -64, 5, 0.3, 16, -0.28, physics)

    // Signboards
    this.createSign(64, 5.2, 0, 6, 1.8, -Math.PI / 2, 'CATWALK LANTAI 2', 'AWAS! BAHAYA JATUH DARI KETINGGIAN', { theme: 'warning' })
    this.createSign(-64, 5.2, 0, 6, 1.8, Math.PI / 2, 'JEMBATAN GANTUNG TENGAH', 'ZONA ELEVASI OPERASIONAL', { theme: 'military' })

    // ==========================================================
    // 5. ORGANIZED LOGISTICS CONTAINERS & STORAGE BLOCKS
    // ==========================================================
    this.createContainer(0, 1.5, -28, 5, 3, 16, this.redContainerMat, physics)
    this.createContainer(0, 4.5, -28, 5, 3, 16, this.blueContainerMat, physics)
    this.createContainer(0, 1.5, 28, 5, 3, 16, this.blueContainerMat, physics)
    this.createContainer(0, 4.5, 28, 5, 3, 16, this.greenContainerMat, physics)

    this.createContainer(-32, 1.5, 0, 5, 3, 16, this.greenContainerMat, physics)
    this.createContainer(32, 1.5, 0, 5, 3, 16, this.redContainerMat, physics)

    this.createContainer(-30, 1.5, 40, 10, 3, 4, this.blueContainerMat, physics)
    this.createContainer(30, 1.5, 40, 10, 3, 4, this.redContainerMat, physics)
    this.createContainer(-30, 1.5, -40, 10, 3, 4, this.greenContainerMat, physics)
    this.createContainer(30, 1.5, -40, 10, 3, 4, this.blueContainerMat, physics)

    this.createSign(0, 2.8, 17.6, 6, 1.6, Math.PI, 'PINTU DARURAT EVAKUASI ▲', 'JANGAN HALANGI AKSES KELUAR', { theme: 'info', arrow: 'up' })
    this.createSign(0, 2.8, -17.6, 6, 1.6, 0, 'JALUR FORKLIFT & TANK AKTIF', 'AWAS KENDARAAN OPERASIONAL BERAT', { theme: 'warning' })

    // High Storage Racks
    for (const x of [-40, 40]) {
      for (const z of [-60, -30, 0, 30, 60]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 1.2), this.girderMat)
        pillar.position.set(x, 5.0, z)
        pillar.castShadow = true
        this.group.add(pillar)
        this.collidableMeshes.push(pillar)
        physics.createBox(x, 5.0, z, 0.6, 5.0, 0.6, true)
      }
    }

    this.createCrate(40, 1, 8, 4, 2, 3, physics)
    this.createCrate(40, 3, 8, 3.5, 2, 3, physics)
    this.createCrate(40, 1, -8, 4, 2, 3, physics)
    this.createCrate(40, 3, -8, 3.5, 2, 3, physics)

    this.createSign(93.5, 4.0, 30, 7, 2.0, -Math.PI / 2, 'UTAMAKAN KESELAMATAN KERJA (K3)', 'WAJIB GUNAKAN HELM & SEPATU SAFETY', { theme: 'industrial' })
    this.createSign(93.5, 4.0, -30, 7, 2.0, -Math.PI / 2, 'DILARANG MEROKOK!', 'MUATAN MUDAH TERBAKAR DI SEKTOR INI', { theme: 'danger' })

    this.createSign(-93.5, 4.0, 0, 8, 2.2, Math.PI / 2, 'BAHAYA BAHAN KIMIA BERACUN', 'HANYA PETUGAS BERSERTIFIKAT BERWENANG', { theme: 'danger', code: 'HAZMAT-B3' })

    const barrelLocations = [
      [-44, 0, 16], [-44, 0, 19], [-47, 0, 17],
      [-44, 0, -16], [-44, 0, -19], [-47, 0, -17],
      [20, 0, 40], [-20, 0, 40], [20, 0, -40]
    ]
    barrelLocations.forEach(([bx, by, bz]) => {
      this.createBarrel(bx, by, bz, physics)
    })

    // Roof Trusses across 188m span
    const trussInterval = 40
    for (let tz = -80; tz <= 80; tz += trussInterval) {
      const truss = new THREE.Mesh(new THREE.BoxGeometry(188, 0.6, 0.6), this.girderMat)
      truss.position.set(0, 9.8, tz)
      this.group.add(truss)
    }

    // ==========================================================
    // 6. MULTI-STORY WAREHOUSE INDUSTRIAL BUILDINGS & OFFICES
    // ==========================================================
    // Building 1: Administrative 2-Story Logistics Office (West Flank: x = -72, z = -10)
    this.createWall(-72, 4.0, -10, 18, 8, 24, physics)
    this.createWall(-72, 8.6, 2.5, 18, 1.2, 0.5, physics)
    this.createWall(-72, 8.6, -22.5, 18, 1.2, 0.5, physics)
    this.createWall(-81.5, 8.6, -10, 0.5, 1.2, 24, physics)
    this.createRamp(-60, 4.0, -10, 4, 0.3, 16, 0.28, physics)
    this.createSign(-72, 5.0, 2.8, 8, 2.0, 0, 'KANTOR ADMINISTRASI LOGISTIK', 'LANTAI 2 - PUSAT KONTROL CCTV', { theme: 'industrial', code: 'HQ-LOG-01' })

    // Building 2: Hazmat & Chemical Containment Lab (East Flank: x = 72, z = -10)
    this.createWall(72, 4.0, -10, 18, 8, 24, physics)
    this.createWall(72, 8.6, 2.5, 18, 1.2, 0.5, physics)
    this.createWall(72, 8.6, -22.5, 18, 1.2, 0.5, physics)
    this.createWall(81.5, 8.6, -10, 0.5, 1.2, 24, physics)
    this.createRamp(60, 4.0, -10, 4, 0.3, 16, 0.28, physics)
    this.createSign(72, 5.0, 2.8, 8, 2.0, 0, 'LABORATORIUM & DEPO KIMIA B3', 'RUANG DEKONTAMINASI RADIASI', { theme: 'danger', code: 'HAZMAT-LAB' })

    // Building 3: Heavy Maintenance Garage & Forklift Bay (SW: x = -50, z = 60)
    this.createWall(-50, 3.5, 60, 22, 7, 18, physics)
    this.createWall(-50, 7.6, 50.5, 22, 1.2, 0.5, physics)
    this.createRamp(-36, 3.5, 60, 4, 0.3, 14, 0.28, physics)
    this.createSign(-50, 4.5, 50.8, 8, 2.0, 0, 'BENGKEL PEMELIHARAAN ALAT BERAT', 'PERBAIKAN TANK TEMPUR & FORKLIFT', { theme: 'industrial' })

    // Building 4: Cold Chain Cargo Vault (SE: x = 50, z = 60)
    this.createWall(50, 3.5, 60, 22, 7, 18, physics)
    this.createWall(50, 7.6, 50.5, 22, 1.2, 0.5, physics)
    this.createRamp(36, 3.5, 60, 4, 0.3, 14, 0.28, physics)
    this.createSign(50, 4.5, 50.8, 8, 2.0, 0, 'GUDANG PENDINGIN BEKU (COLD VAULT)', 'SUHU KONSTAN -20°C', { theme: 'info', code: 'COLD-01' })

    // Building 5: Server & Security Hub (NW: x = -72, z = -68)
    this.createWall(-72, 3.0, -68, 14, 6, 14, physics)
    this.createSign(-72, 4.0, -60.8, 7, 1.8, 0, 'RUANG SERVER PUSAT', 'AKSES TERBATAS KEAMANAN', { theme: 'military' })

    // Building 6: High-Voltage Electrical Substation (NE: x = 72, z = -68)
    this.createWall(72, 3.0, -68, 14, 6, 14, physics)
    this.createSign(72, 4.0, -60.8, 7, 1.8, 0, 'GARDU INDUK TEGANGAN TINGGI', 'BAHAYA SENGATAN 20.000V', { theme: 'danger' })
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

  private createCatwalk(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    physics: PhysicsWorld
  ) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.catwalkMat)
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
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.catwalkMat)
    mesh.position.set(x, y, z)
    mesh.rotation.x = rotX
    mesh.castShadow = true
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
