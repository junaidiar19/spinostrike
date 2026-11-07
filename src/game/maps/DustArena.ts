import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class DustArena {
  public group = new THREE.Group()
  public colliderBodies: unknown[] = []
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (240m x 240m map - 2x broader combat arena)
  public ctSpawn = new THREE.Vector3(0, 1.5, 96)
  public tSpawn = new THREE.Vector3(0, 1.5, -96)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Mid Central Archway
    new THREE.Vector3(24, 1, 28),       // Mid to A-Short Ramp
    new THREE.Vector3(52, 1, 56),       // A-Long Colonnade Entry
    new THREE.Vector3(76, 1, 20),       // A-Long Midpoint
    new THREE.Vector3(68, 2.0, -50),    // Zona Bom A Platform
    new THREE.Vector3(92, 6.2, -64),    // A Sniper Watchtower Top
    new THREE.Vector3(28, 1, -36),      // CT Spawn to A Connector
    new THREE.Vector3(-28, 1, 36),      // Mid to B Underpass Entry
    new THREE.Vector3(-64, 1, 40),      // B-Tunnels Underground Chamber
    new THREE.Vector3(-68, 1, -48),     // Zona Bom B Compound
    new THREE.Vector3(-84, 2.5, -68),   // B Site Defense Vantage
    new THREE.Vector3(0, 1, 76),        // CT Spawn Yard Exit
    new THREE.Vector3(0, 1, -76),       // T Spawn Yard Exit
    new THREE.Vector3(-24, 1, 0),       // Mid Bazaar Market Left
    new THREE.Vector3(24, 1, 0),        // Mid Bazaar Market Right
    new THREE.Vector3(0, 1, -36),       // T Underpass to Mid
    new THREE.Vector3(-48, 8.2, 52),    // SW Shophouse Rooftop Balcony
    new THREE.Vector3(50, 8.2, 62),     // SE Citadel Garrison Roof
    new THREE.Vector3(-48, 7.2, -48),   // NW Desert Caravanserai Roof
    new THREE.Vector3(86, 8.2, 36),     // NE A-Long Gatehouse Roof
    new THREE.Vector3(-38, 1, 96),      // SW Logistics Depot
    new THREE.Vector3(38, 1, -96)       // NE Guerrilla Barracks
  ]

  // Realistic Procedural Materials with DoubleSide for 100% raycast hit reliability
  private sandMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createSandstonePavement(),
    roughness: 0.82,
    metalness: 0.05,
    side: THREE.DoubleSide
  })

  private wallMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createSandstoneWall(),
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide
  })

  private crateMat = new THREE.MeshStandardMaterial({
    map: TextureGenerator.createTacticalCrate(),
    roughness: 0.65,
    metalness: 0.1,
    side: THREE.DoubleSide
  })

  private metalMat = new THREE.MeshStandardMaterial({
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

  private barrelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Hazard Red
    roughness: 0.3,
    metalness: 0.65,
    side: THREE.DoubleSide
  })

  private clothMat = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Market stall fabric
    roughness: 0.9,
    metalness: 0.02,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_dust_arena'

    // 1. Expanded Main Ground (240m x 240m - 2x Larger Battlefield)
    const groundGeom = new THREE.BoxGeometry(240, 1, 240)
    const ground = new THREE.Mesh(groundGeom, this.sandMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 120, 0.5, 120, true)

    // 2. Perimeter Sandstone Walls (Height 8m, Thickness 3m at ±120m)
    this.createWall(0, 4.0, -120, 240, 8, 3, physics) // North
    this.createWall(0, 4.0, 120, 240, 8, 3, physics)  // South
    this.createWall(-120, 4.0, 0, 3, 8, 240, physics) // West
    this.createWall(120, 4.0, 0, 3, 8, 240, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT SPAWN & T SPAWN HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 96): Sandstone bunker with tactical blast walls at z = 80
    this.createWall(-20, 3.5, 80, 32, 7, 3, physics)
    this.createWall(20, 3.5, 80, 32, 7, 3, physics)
    this.createCrate(0, 1, 86, 6, 2, 3, physics)
    this.createCrate(-9, 1, 90, 4, 2, 3, physics)
    this.createCrate(9, 1, 90, 4, 2, 3, physics)
    this.createCrate(0, 2.75, 86, 3, 1.5, 3, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.0, 118.5, 12, 2.8, Math.PI, 'POS KOMANDO OPERASI (CT)', 'SEKTOR PERTAHANAN SELATAN - 240M SUPER ARENA', { theme: 'military', code: 'SPINO-CT-01' })
    this.createSign(-20, 3.8, 77.8, 6, 1.8, 0, 'MENUJU ZONA BOM A ➔', 'JALUR A-LONG', { theme: 'info', arrow: 'right' })
    this.createSign(20, 3.8, 77.8, 6, 1.8, 0, '◀ MENUJU ZONA BOM B', 'LORONG B-TUNNEL', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -96): Fortified guerrilla camp with blast walls at z = -80
    this.createWall(-20, 3.5, -80, 32, 7, 3, physics)
    this.createWall(20, 3.5, -80, 32, 7, 3, physics)
    this.createCrate(0, 1, -86, 6, 2, 3, physics)
    this.createCrate(-9, 1, -90, 4, 2, 3, physics)
    this.createCrate(9, 1, -90, 4, 2, 3, physics)
    this.createCrate(0, 2.75, -86, 3, 1.5, 3, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.0, -118.5, 12, 2.8, 0, 'MARKAS GERILYA GURUN (T)', 'OPERASI SERANGAN FAJAR - SEKTOR UTARA', { theme: 'danger', code: 'SPINO-T-01' })
    this.createSign(20, 3.8, -77.8, 6, 1.8, Math.PI, '◀ SERBU ZONA BOM A', 'JALUR A-LONG TIMUR', { theme: 'warning', arrow: 'left' })
    this.createSign(-20, 3.8, -77.8, 6, 1.8, Math.PI, 'SERBU ZONA BOM B ▶', 'LORONG BAWAH TANAH BARAT', { theme: 'warning', arrow: 'right' })

    // ==========================================================
    // 4. ZONA BOM A (East Wing - Colonnade A-Long & Sniper Tower)
    // ==========================================================
    // A-Site Elevated Platform (48m x 48m at y = 1.0)
    const aPlat = new THREE.Mesh(new THREE.BoxGeometry(48, 1.6, 48), this.wallMat)
    aPlat.position.set(68, 0.8, -50)
    aPlat.receiveShadow = true
    this.group.add(aPlat)
    this.collidableMeshes.push(aPlat)
    physics.createBox(68, 0.8, -50, 24, 0.8, 24, true)

    // Ramp from Mid to A-Site
    this.createRamp(40, 0.6, -30, 10, 0.4, 18, 0.22, physics)
    // Ramp from A-Long to A-Site
    this.createRamp(68, 0.6, -20, 10, 0.4, 16, -0.25, physics)

    // A-Long Defensive Colonnade Pillars & Blast Walls along X = 88
    for (let pz = 60; pz >= -20; pz -= 18) {
      this.createWall(88, 3.5, pz, 3, 7, 6, physics)
    }
    // High Corner Sniper Watchtower at A (Height 7m)
    this.createWall(96, 3.5, -72, 12, 7, 12, physics)
    // Sniper Tower Parapet Railing
    this.createWall(96, 7.6, -65.5, 12, 1.2, 0.6, physics)
    this.createWall(89.5, 7.6, -72, 0.6, 1.2, 12, physics)
    // Ramp to Sniper Tower
    this.createRamp(96, 3.5, -56, 5, 0.4, 14, -0.35, physics)

    // Metal Containers & Supply Crates flush on A Platform
    this.createMetalContainer(64, 3.1, -48, 4, 3, 10, physics)
    this.createCrate(56, 2.85, -60, 4, 2.5, 4, physics)
    this.createCrate(80, 2.85, -40, 4, 2.5, 4, physics)
    this.createBarrel(76, 1.6, -48, physics)
    this.createBarrel(76, 1.6, -52, physics)

    // Zona Bom A Indonesian Signs
    this.createSign(68, 4.0, -73.5, 9, 2.4, 0, 'ZONA BOM A', 'TITIK PELEDAKAN STRATEGIS - DAERAH STERIL', { theme: 'warning', code: 'TARGET-ALPHA' })
    this.createSign(88.4, 4.5, 20, 7, 1.8, -Math.PI / 2, 'JALUR A-LONG', 'AWAS! AREA TERBUKA TANK & PENEMBAK JITU', { theme: 'danger' })
    this.createSign(96, 5.5, -64.8, 6, 1.6, 0, 'MENARA SNIPER A', 'PENGINTAIAN GARIS DEPAN', { theme: 'military' })

    // ==========================================================
    // 5. ZONA BOM B (West Wing - Labyrinth Tunnels & Fortress Site)
    // ==========================================================
    // Fortified B-Site Compound Walls (x = -68, z = -50)
    this.createWall(-68, 3.5, -74, 52, 7, 3, physics) // North B Wall
    this.createWall(-92, 3.5, -50, 3, 7, 48, physics) // West B Wall
    this.createWall(-44, 3.5, -56, 3, 7, 32, physics) // East B Wall
    // Center defense bunker inside B
    this.createWall(-68, 2.5, -44, 14, 5, 5, physics)

    // B-Tunnels Underground / Covered Passageway
    this.createWall(-72, 3.5, 16, 3, 7, 52, physics)
    this.createWall(-48, 3.5, 16, 3, 7, 40, physics)
    // Tunnel Ceiling slab
    const tunnelRoof = new THREE.Mesh(new THREE.BoxGeometry(26, 0.6, 48), this.wallMat)
    tunnelRoof.position.set(-60, 6.8, 16)
    this.group.add(tunnelRoof)
    this.collidableMeshes.push(tunnelRoof)

    // Containers & Cover inside B
    this.createMetalContainer(-68, 1.5, -56, 4, 3, 10, physics)
    this.createContainer(-80, 1.5, -36, 8, 3, 4, this.redContainerMat, physics)
    this.createCrate(-56, 1, -40, 4, 2, 4, physics)
    this.createCrate(-76, 1, -60, 4, 2, 4, physics)
    this.createBarrel(-64, 0, -36, physics)
    this.createBarrel(-66, 0, -36, physics)

    // Zona Bom B Indonesian Signs
    this.createSign(-68, 4.2, -71.8, 9, 2.4, 0, 'ZONA BOM B', 'GUDANG SENJATA & AMUNISI UTAMA', { theme: 'warning', code: 'TARGET-BRAVO' })
    this.createSign(-48, 3.8, 36, 7, 1.8, -Math.PI / 2, 'LORONG B-TUNNEL ➔', 'AWAS! PERTEMPURAN JARAK DEKAT', { theme: 'military', arrow: 'right' })
    this.createSign(-68, 3.2, -40.8, 6, 1.6, 0, 'BAHAYA AMUNISI AKTIF', 'DILARANG MEMBAWA API ATAU MEROKOK', { theme: 'danger' })

    // ==========================================================
    // 6. CENTRAL MID & PASAR GURUN TRADISIONAL (Mid Bazaar)
    // ==========================================================
    // Massive Double Mid Arch Walls with wide gateway for Tanks to pass!
    this.createWall(-36, 4.0, 0, 32, 8, 3, physics)
    this.createWall(36, 4.0, 0, 32, 8, 3, physics)
    // High Arch over Mid Gap (Wide Tank Clearance Span = 20m at y = 7.2)
    this.createWall(0, 7.2, 0, 24, 2.0, 3, physics)

    // Mid Bazaar Market Stalls
    this.createMarketStall(16, 0, 20, physics)
    this.createMarketStall(-16, 0, 20, physics)
    this.createMarketStall(16, 0, -20, physics)
    this.createMarketStall(-16, 0, -20, physics)

    // Central Mid Wooden Crate barricades
    this.createCrate(0, 1, 12, 5, 2, 3, physics)
    this.createCrate(0, 1, -12, 5, 2, 3, physics)
    this.createCrate(-7, 1, 0, 3, 2, 3, physics)
    this.createCrate(7, 1, 0, 3, 2, 3, physics)

    // Mid Indonesian Signage
    this.createSign(0, 7.2, 1.8, 10, 2.2, 0, 'PINTU GERBANG UTAMA', 'POS PEMERIKSAAN MILITER GURUN', { theme: 'military', code: 'GERBANG-MID' })
    this.createSign(0, 7.2, -1.8, 10, 2.2, Math.PI, 'PINTU GERBANG UTAMA', 'POS PEMERIKSAAN MILITER GURUN', { theme: 'military', code: 'GERBANG-MID' })
    this.createSign(32, 3.5, 2.0, 7, 1.8, 0, 'AWAS! JALUR PENEMBAK JITU', 'GARIS TEMBAK TERBUKA DARI DUA ARAH', { theme: 'danger' })
    this.createSign(-32, 3.5, 2.0, 7, 1.8, 0, 'PASAR TRADISIONAL GURUN', 'AREA DISTRIBUSI LOGISTIK LOKAL', { theme: 'vintage' })

    // Underpass link from Mid to A-Short
    this.createWall(32, 3.0, 36, 24, 6, 2, physics)
    this.createSign(32, 3.2, 34.6, 6, 1.6, Math.PI, 'JALUR A-SHORT ➔', 'MENUJU ELEVASI A-SITE', { theme: 'info', arrow: 'right' })

    // Tactical Hazard Barrels
    this.createBarrel(12, 0, 8, physics)
    this.createBarrel(-12, 0, -8, physics)
    this.createBarrel(44, 0, 24, physics)
    this.createBarrel(-44, 0, -28, physics)

    // ==========================================================
    // 8. ARCHITECTURAL DETAILS: STONE COPINGS & BOMB ZONE MARKINGS
    // ==========================================================
    const copingMat = new THREE.MeshStandardMaterial({
      color: 0x8a6635,
      roughness: 0.85
    })

    // Fortress wall stone coping trims along perimeter
    const copingNS = new THREE.BoxGeometry(238, 0.4, 3.6)
    const capN = new THREE.Mesh(copingNS, copingMat)
    capN.position.set(0, 10.2, -119)
    this.group.add(capN)

    const capS = new THREE.Mesh(copingNS, copingMat)
    capS.position.set(0, 10.2, 119)
    this.group.add(capS)

    const copingEW = new THREE.BoxGeometry(3.6, 0.4, 238)
    const capW = new THREE.Mesh(copingEW, copingMat)
    capW.position.set(-119, 10.2, 0)
    this.group.add(capW)

    const capE = new THREE.Mesh(copingEW, copingMat)
    capE.position.set(119, 10.2, 0)
    this.group.add(capE)

    // Tactical Bomb Zone Blast Circle Decals on A & B Sites
    const blastGeom = new THREE.RingGeometry(3.8, 4.8, 24)
    const blastMatA = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    })
    const blastA = new THREE.Mesh(blastGeom, blastMatA)
    blastA.rotation.x = -Math.PI / 2
    blastA.position.set(68, 1.62, -50)
    this.group.add(blastA)

    const blastB = new THREE.Mesh(blastGeom, blastMatA)
    blastB.rotation.x = -Math.PI / 2
    blastB.position.set(-68, 0.02, -50)
    this.group.add(blastB)

    // ==========================================================
    // 9. DENSE URBAN BUILDINGS & RESIDENTIAL BAZAAR DISTRICTS
    // ==========================================================
    // Building 1: 2-Story Sandstone Shophouse Complex (SW Quarter: x = -48, z = 52)
    this.createWall(-48, 4.0, 52, 18, 8, 20, physics)
    this.createWall(-48, 8.6, 42.5, 18, 1.2, 0.5, physics)
    this.createWall(-48, 8.6, 61.5, 18, 1.2, 0.5, physics)
    this.createWall(-56.5, 8.6, 52, 0.5, 1.2, 18, physics)
    this.createRamp(-36, 4.0, 52, 4, 0.3, 16, 0.28, physics)
    this.createCrate(-48, 9.2, 52, 3, 1.5, 3, physics)
    this.createSign(-48, 5.0, 41.8, 8, 2.0, 0, 'KOMPLEKS PERTOKOAN GURUN', 'LANTAI 2 - BALKONI PENGAWASAN', { theme: 'vintage' })

    // Building 2: Fortified Citadel Garrison (SE Quarter: x = 50, z = 62)
    this.createWall(50, 4.0, 62, 22, 8, 18, physics)
    this.createWall(50, 8.6, 53.5, 22, 1.2, 0.5, physics)
    this.createWall(60.5, 8.6, 62, 0.5, 1.2, 18, physics)
    this.createRamp(36, 4.0, 62, 4, 0.3, 16, 0.28, physics)
    this.createSign(50, 5.0, 52.8, 8, 2.0, 0, 'BENTENG GARRISON SELATAN', 'POS PERTAHANAN KAVALERI & TANK', { theme: 'military', code: 'GARRISON-02' })

    // Building 3: North Desert Caravanserai (NW Quarter: x = -48, z = -48)
    this.createWall(-48, 3.5, -48, 20, 7, 18, physics)
    this.createWall(-48, 7.6, -39.5, 20, 1.2, 0.5, physics)
    this.createRamp(-35, 3.5, -48, 4, 0.3, 14, -0.28, physics)
    this.createSign(-48, 4.5, -38.8, 8, 2.0, Math.PI, 'KARAVANSERAI KOTA KUNO', 'DEPO LOGISTIK JALUR SUTRA', { theme: 'vintage' })

    // Building 4: A-Long Flank Shophouse & Gatehouse (NE Quarter: x = 86, z = 36)
    this.createWall(86, 4.0, 36, 14, 8, 16, physics)
    this.createWall(86, 8.6, 28.5, 14, 1.2, 0.5, physics)
    this.createRamp(76, 4.0, 36, 4, 0.3, 16, 0.28, physics)
    this.createSign(86, 5.0, 27.8, 7, 1.8, 0, 'GERBANG TIMUR A-LONG', 'POS PEMERIKSAAN KENDARAAN BERAT', { theme: 'military' })

    // Building 5: South Logistics Storage Depot (SW Base: x = -38, z = 96)
    this.createWall(-38, 3.0, 96, 16, 6, 14, physics)
    this.createSign(-38, 4.0, 88.8, 7, 1.8, 0, 'DEPO PERBEKALAN CT', 'AMUNISI & SUKU CADANG TANK', { theme: 'industrial' })

    // Building 6: North Guerrilla Barracks (NE Base: x = 38, z = -96)
    this.createWall(38, 3.0, -96, 16, 6, 14, physics)
    this.createSign(38, 4.0, -88.8, 7, 1.8, Math.PI, 'BARAK GERILYA UTARA', 'POS PERAKITAN ROKET & MORTIR', { theme: 'danger' })
  }

  private createMarketStall(x: number, y: number, z: number, physics: PhysicsWorld) {
    // 4 Wooden legs
    const legGeom = new THREE.BoxGeometry(0.2, 2.4, 0.2)
    const legMat = this.crateMat
    const offsets = [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]
    offsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeom, legMat)
      leg.position.set(x + ox, y + 1.2, z + oz)
      this.group.add(leg)
    })

    // Cloth Canopy Roof
    const roofGeom = new THREE.BoxGeometry(3.2, 0.15, 3.2)
    const roof = new THREE.Mesh(roofGeom, this.clothMat)
    roof.position.set(x, y + 2.45, z)
    this.group.add(roof)

    // Table counter
    const tableGeom = new THREE.BoxGeometry(3.0, 0.9, 1.4)
    const table = new THREE.Mesh(tableGeom, this.crateMat)
    table.position.set(x, y + 0.45, z)
    table.castShadow = true
    this.group.add(table)
    this.collidableMeshes.push(table)
    physics.createBox(x, y + 0.45, z, 1.5, 0.45, 0.7, true)
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
    const mesh = new THREE.Mesh(geom, this.wallMat)
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
