import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class Warehouse {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (95m x 115m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 46)
  public tSpawn = new THREE.Vector3(0, 1.5, -46)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central hangar floor
    new THREE.Vector3(0, 3.5, 0),       // Central Skybridge Overlook
    new THREE.Vector3(20, 1, 16),       // East Freight Corridor
    new THREE.Vector3(-20, 1, 16),      // West Chemical Corridor
    new THREE.Vector3(20, 1, -16),      // East Rack Storage
    new THREE.Vector3(-20, 1, -16),     // West Container Bay
    new THREE.Vector3(32, 3.5, 15),     // East Catwalk Mezzanine South
    new THREE.Vector3(32, 3.5, -15),    // East Catwalk Mezzanine North
    new THREE.Vector3(-32, 3.5, 15),    // West Catwalk Mezzanine South
    new THREE.Vector3(-32, 3.5, -15),   // West Catwalk Mezzanine North
    new THREE.Vector3(0, 1, 34),        // CT Loading Bay Exit
    new THREE.Vector3(0, 1, -34),       // T Receiving Bay Exit
    new THREE.Vector3(12, 1, 0),        // Central Stacks Flank East
    new THREE.Vector3(-12, 1, 0),       // Central Stacks Flank West
    new THREE.Vector3(34, 1, 30),       // CT East Ramp Foot
    new THREE.Vector3(-34, 1, -30)      // T West Ramp Foot
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

    // 1. Expanded Industrial Concrete Ground (95m x 115m)
    const floorGeom = new THREE.BoxGeometry(95, 1, 115)
    const floor = new THREE.Mesh(floorGeom, this.floorMat)
    floor.position.set(0, -0.5, 0)
    floor.receiveShadow = true
    this.group.add(floor)
    this.collidableMeshes.push(floor)
    physics.createBox(0, -0.5, 0, 47.5, 0.5, 57.5, true)

    // 2. High Industrial Perimeter Walls (H: 9m, D: 2m)
    this.createWall(0, 4.5, -57.5, 95, 9, 2, physics) // North
    this.createWall(0, 4.5, 57.5, 95, 9, 2, physics)  // South
    this.createWall(-47.5, 4.5, 0, 2, 9, 115, physics) // West
    this.createWall(47.5, 4.5, 0, 2, 9, 115, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT & T LOADING BAY HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 46): Trailer container barrier & pallets at z = 38
    this.createContainer(-12, 1.5, 38, 8, 3, 3, this.blueContainerMat, physics)
    this.createContainer(12, 1.5, 38, 8, 3, 3, this.redContainerMat, physics)
    this.createCrate(0, 1, 41, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, 43, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, 43, 2.5, 2, 2, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.5, 56.3, 8, 2.2, Math.PI, 'GUDANG LOGISTIK UTAMA - SEKTOR 04', 'DERMAGA BONGKAR MUAT SELATAN (CT)', { theme: 'industrial', code: 'LOG-K3-04' })
    this.createSign(12, 3.2, 36.3, 4.5, 1.5, 0, 'JALUR CATWALK TIMUR ➔', 'AKSES TANGGA MEZZANINE', { theme: 'info', arrow: 'right' })
    this.createSign(-12, 3.2, 36.3, 4.5, 1.5, 0, '◀ JALUR CATWALK BARAT', 'ZONA PENYIMPANAN KIMIA', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -46): Trailer container barrier & crates at z = -38
    this.createContainer(-12, 1.5, -38, 8, 3, 3, this.redContainerMat, physics)
    this.createContainer(12, 1.5, -38, 8, 3, 3, this.greenContainerMat, physics)
    this.createCrate(0, 1, -41, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, -43, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, -43, 2.5, 2, 2, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.5, -56.3, 8, 2.2, 0, 'TERMINAL PENERIMAAN FREIGHT (T)', 'DEPO DISTRIBUSI KARGO UTARA', { theme: 'industrial', code: 'LOG-T-02' })
    this.createSign(12, 3.2, -36.3, 4.5, 1.5, Math.PI, '◀ MENUJU HANGAR UTAMA', 'JALUR LOGISTIK UTARA', { theme: 'warning', arrow: 'left' })
    this.createSign(-12, 3.2, -36.3, 4.5, 1.5, Math.PI, 'MENUJU ZONA KIMIA ▶', 'AREA BERBAHAYA', { theme: 'danger', arrow: 'right' })

    // ==========================================================
    // 4. ELEVATED CATWALK MEZZANINE (EAST & WEST) + CENTRAL SKYBRIDGE
    // ==========================================================
    // East Catwalk at x = 32 (Length: 70m, y = 3.2m)
    this.createCatwalk(32, 3.2, 0, 5, 0.4, 70, physics)
    // West Catwalk at x = -32 (Length: 70m, y = 3.2m)
    this.createCatwalk(-32, 3.2, 0, 5, 0.4, 70, physics)

    // Central Connecting Skybridge spanning across the hangar (Span: 60m at z = 0, y = 3.2m)
    this.createCatwalk(0, 3.2, 0, 60, 0.4, 4.5, physics)

    // Catwalk Parapet Railings for Tactical Sniper Cover
    this.createWall(32, 4.0, 35, 5, 1.2, 0.2, physics)
    this.createWall(32, 4.0, -35, 5, 1.2, 0.2, physics)
    this.createWall(-32, 4.0, 35, 5, 1.2, 0.2, physics)
    this.createWall(-32, 4.0, -35, 5, 1.2, 0.2, physics)
    // Skybridge center cover box
    this.createCrate(0, 4.2, 0, 2, 1.6, 2, physics)

    // Ramps to Catwalks (4 Ramps)
    this.createRamp(32, 1.6, 32, 4, 0.3, 10, 0.32, physics)
    this.createRamp(32, 1.6, -32, 4, 0.3, 10, -0.32, physics)
    this.createRamp(-32, 1.6, 32, 4, 0.3, 10, 0.32, physics)
    this.createRamp(-32, 1.6, -32, 4, 0.3, 10, -0.32, physics)

    // Catwalk Indonesian Signboards
    this.createSign(32, 4.8, 0, 4.5, 1.5, -Math.PI / 2, 'CATWALK LANTAI 2', 'AWAS! BAHAYA JATUH DARI KETINGGIAN', { theme: 'warning' })
    this.createSign(-32, 4.8, 0, 4.5, 1.5, Math.PI / 2, 'JEMBATAN GANTUNG TENGAH', 'ZONA ELEVASI OPERASIONAL', { theme: 'military' })

    // ==========================================================
    // 5. ORGANIZED LOGISTICS CONTAINERS & STORAGE BLOCKS
    // ==========================================================
    // North Center Stack (Red & Blue at z = -14)
    this.createContainer(0, 1.5, -14, 3.2, 3, 10, this.redContainerMat, physics)
    this.createContainer(0, 4.5, -14, 3.2, 3, 10, this.blueContainerMat, physics)

    // South Center Stack (Blue & Green at z = 14)
    this.createContainer(0, 1.5, 14, 3.2, 3, 10, this.blueContainerMat, physics)
    this.createContainer(0, 4.5, 14, 3.2, 3, 10, this.greenContainerMat, physics)

    // Flank container blocks (West & East at z = 0)
    this.createContainer(-16, 1.5, 0, 3.2, 3, 10, this.greenContainerMat, physics)
    this.createContainer(16, 1.5, 0, 3.2, 3, 10, this.redContainerMat, physics)

    // Secondary perimeter containers
    this.createContainer(-15, 1.5, 20, 7, 3, 3, this.blueContainerMat, physics)
    this.createContainer(15, 1.5, 20, 7, 3, 3, this.redContainerMat, physics)
    this.createContainer(-15, 1.5, -20, 7, 3, 3, this.greenContainerMat, physics)
    this.createContainer(15, 1.5, -20, 7, 3, 3, this.blueContainerMat, physics)

    // Central Stacks Signboards
    this.createSign(0, 2.5, 8.8, 4.5, 1.4, Math.PI, 'PINTU DARURAT EVAKUASI ▲', 'JANGAN HALANGI AKSES KELUAR', { theme: 'info', arrow: 'up' })
    this.createSign(0, 2.5, -8.8, 4.5, 1.4, 0, 'JALUR FORKLIFT AKTIF', 'AWAS KENDARAAN OPERASIONAL', { theme: 'warning' })

    // ==========================================================
    // 6. INDUSTRIAL HIGH STEEL GIRDERS & STORAGE RACKS
    // ==========================================================
    // Supporting steel pillars (12 Pillars)
    for (const x of [-20, 20]) {
      for (const z of [-30, -15, 0, 15, 30]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 9, 1.0), this.girderMat)
        pillar.position.set(x, 4.5, z)
        pillar.castShadow = true
        this.group.add(pillar)
        this.collidableMeshes.push(pillar)
        physics.createBox(x, 4.5, z, 0.5, 4.5, 0.5, true)
      }
    }

    // High Storage Racks with pallet crates (at x = 20, z = -10 to 10)
    this.createCrate(20, 1, 4, 3, 2, 2, physics)
    this.createCrate(20, 3, 4, 2.5, 2, 2, physics)
    this.createCrate(20, 1, -4, 3, 2, 2, physics)
    this.createCrate(20, 3, -4, 2.5, 2, 2, physics)

    // Rambu K3 & Keselamatan Industri
    this.createSign(46.3, 3.5, 15, 5, 1.6, -Math.PI / 2, 'UTAMAKAN KESELAMATAN KERJA (K3)', 'WAJIB GUNAKAN HELM & SEPATU SAFETY', { theme: 'industrial' })
    this.createSign(46.3, 3.5, -15, 5, 1.6, -Math.PI / 2, 'DILARANG MEROKOK!', 'MUATAN MUDAH TERBAKAR DI SEKTOR INI', { theme: 'danger' })

    // ==========================================================
    // 7. CHEMICAL HAZARD ZONE (WEST SECTOR)
    // ==========================================================
    this.createSign(-46.3, 3.5, 0, 6, 2.0, Math.PI / 2, 'BAHAYA BAHAN KIMIA BERACUN', 'HANYA PETUGAS BERSERTIFIKAT BERWENANG', { theme: 'danger', code: 'HAZMAT-B3' })
    this.createSign(-46.3, 3.5, 20, 5, 1.6, Math.PI / 2, 'RUANG KONTROL & SERVER ➔', 'AKSES TERBATAS TINGKAT 1', { theme: 'military', arrow: 'right' })

    // Chemical Hazard Barrels & Supply Crates
    const barrelLocations = [
      [-22, 0, 8], [-22, 0, 9.5], [-23.5, 0, 8.5],
      [-22, 0, -8], [-22, 0, -9.5], [-23.5, 0, -8.5],
      [10, 0, 20], [-10, 0, 20], [10, 0, -20]
    ]
    barrelLocations.forEach(([bx, by, bz]) => {
      this.createBarrel(bx, by, bz, physics)
    })
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
