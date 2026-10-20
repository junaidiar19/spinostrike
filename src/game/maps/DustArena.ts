import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class DustArena {
  public group = new THREE.Group()
  public colliderBodies: unknown[] = []
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (120m x 120m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 48)
  public tSpawn = new THREE.Vector3(0, 1.5, -48)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Mid Central Archway
    new THREE.Vector3(12, 1, 14),       // Mid to A-Short Ramp
    new THREE.Vector3(26, 1, 28),       // A-Long Colonnade Entry
    new THREE.Vector3(38, 1, 10),       // A-Long Midpoint
    new THREE.Vector3(34, 2.0, -25),    // Zona Bom A Platform
    new THREE.Vector3(45, 6.2, -32),    // A Sniper Watchtower Top
    new THREE.Vector3(14, 1, -18),      // CT Spawn to A Connector
    new THREE.Vector3(-14, 1, 18),      // Mid to B Underpass Entry
    new THREE.Vector3(-32, 1, 20),      // B-Tunnels Underground Chamber
    new THREE.Vector3(-32, 1, -24),     // Zona Bom B Compound
    new THREE.Vector3(-42, 2.5, -34),   // B Site Defense Vantage
    new THREE.Vector3(0, 1, 38),        // CT Spawn Yard Exit
    new THREE.Vector3(0, 1, -38),       // T Spawn Yard Exit
    new THREE.Vector3(-12, 1, 0),       // Mid Bazaar Market Left
    new THREE.Vector3(12, 1, 0),        // Mid Bazaar Market Right
    new THREE.Vector3(0, 1, -18)        // T Underpass to Mid
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

    // 1. Expanded Main Ground (120m x 120m)
    const groundGeom = new THREE.BoxGeometry(120, 1, 120)
    const ground = new THREE.Mesh(groundGeom, this.sandMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 60, 0.5, 60, true)

    // 2. Perimeter Sandstone Walls (Height 7m, Thickness 2m at ±60m)
    this.createWall(0, 3.5, -60, 120, 7, 2, physics) // North
    this.createWall(0, 3.5, 60, 120, 7, 2, physics)  // South
    this.createWall(-60, 3.5, 0, 2, 7, 120, physics) // West
    this.createWall(60, 3.5, 0, 2, 7, 120, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT SPAWN & T SPAWN HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 48): Sandstone bunker with tactical blast walls at z = 40
    this.createWall(-10, 3, 40, 16, 6, 2, physics)
    this.createWall(10, 3, 40, 16, 6, 2, physics)
    this.createCrate(0, 1, 43, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, 45, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, 45, 2.5, 2, 2, physics)
    this.createCrate(0, 2.75, 43, 2, 1.5, 2, physics) // Stacked crate cover resting flush on base crate

    // CT Spawn Indonesian Signage
    this.createSign(0, 4.5, 58.8, 8, 2.2, Math.PI, 'POS KOMANDO OPERASI (CT)', 'SEKTOR PERTAHANAN SELATAN - SIAP TEMPUR', { theme: 'military', code: 'SPINO-CT-01' })
    this.createSign(-10, 3.2, 38.8, 4.5, 1.6, 0, 'MENUJU ZONA BOM A ➔', 'JALUR A-LONG', { theme: 'info', arrow: 'right' })
    this.createSign(10, 3.2, 38.8, 4.5, 1.6, 0, '◀ MENUJU ZONA BOM B', 'LORONG B-TUNNEL', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -48): Fortified guerrilla camp with blast walls at z = -40
    this.createWall(-10, 3, -40, 16, 6, 2, physics)
    this.createWall(10, 3, -40, 16, 6, 2, physics)
    this.createCrate(0, 1, -43, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, -45, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, -45, 2.5, 2, 2, physics)
    this.createCrate(0, 2.75, -43, 2, 1.5, 2, physics) // Stacked crate cover resting flush on base crate

    // T Spawn Indonesian Signage
    this.createSign(0, 4.5, -58.8, 8, 2.2, 0, 'MARKAS GERILYA GURUN (T)', 'OPERASI SERANGAN FAJAR - SEKTOR UTARA', { theme: 'danger', code: 'SPINO-T-01' })
    this.createSign(10, 3.2, -38.8, 4.5, 1.6, Math.PI, '◀ SERBU ZONA BOM A', 'JALUR A-LONG TIMUR', { theme: 'warning', arrow: 'left' })
    this.createSign(-10, 3.2, -38.8, 4.5, 1.6, Math.PI, 'SERBU ZONA BOM B ▶', 'LORONG BAWAH TANAH BARAT', { theme: 'warning', arrow: 'right' })

    // ==========================================================
    // 4. ZONA BOM A (East Wing - Colonnade A-Long & Sniper Tower)
    // ==========================================================
    // A-Site Elevated Platform (24m x 24m at y = 1.0)
    const aPlat = new THREE.Mesh(new THREE.BoxGeometry(24, 1.6, 24), this.wallMat)
    aPlat.position.set(34, 0.8, -25)
    aPlat.receiveShadow = true
    this.group.add(aPlat)
    this.collidableMeshes.push(aPlat)
    physics.createBox(34, 0.8, -25, 12, 0.8, 12, true)

    // Ramp from Mid to A-Site
    this.createRamp(20, 0.6, -15, 6, 0.4, 10, 0.22, physics)
    // Ramp from A-Long to A-Site
    this.createRamp(34, 0.6, -10, 6, 0.4, 8, -0.25, physics)

    // A-Long Defensive Colonnade Pillars & Blast Walls along X = 44
    for (let pz = 30; pz >= -10; pz -= 10) {
      this.createWall(44, 3, pz, 2, 6, 4, physics)
    }
    // High Corner Sniper Watchtower at A (Height 6.5m)
    this.createWall(48, 3.25, -36, 8, 6.5, 8, physics)
    // Sniper Tower Parapet Railing
    this.createWall(48, 7.0, -32.2, 8, 1.2, 0.4, physics)
    this.createWall(44.2, 7.0, -36, 0.4, 1.2, 8, physics)
    // Ramp to Sniper Tower
    this.createRamp(48, 3.25, -28, 3, 0.4, 8, -0.4, physics)

    // Metal Containers & Supply Crates flush on A Platform (top y = 1.6)
    this.createMetalContainer(32, 3.1, -24, 3, 3, 7, physics)
    this.createCrate(28, 2.85, -30, 3, 2.5, 3, physics)
    this.createCrate(40, 2.85, -20, 2.5, 2.5, 2.5, physics)
    this.createBarrel(38, 1.6, -24, physics)
    this.createBarrel(38, 1.6, -26, physics)

    // Zona Bom A Indonesian Signs
    this.createSign(34, 3.5, -36.8, 7, 2.2, 0, 'ZONA BOM A', 'TITIK PELEDAKAN STRATEGIS - DAERAH STERIL', { theme: 'warning', code: 'TARGET-ALPHA' })
    this.createSign(44.2, 4.0, 10, 5, 1.6, -Math.PI / 2, 'JALUR A-LONG', 'AWAS! AREA TERBUKA PENEMBAK JITU', { theme: 'danger' })
    this.createSign(48, 5.0, -31.8, 4.5, 1.4, 0, 'MENARA SNIPER A', 'PENGINTAIAN GARIS DEPAN', { theme: 'military' })

    // ==========================================================
    // 5. ZONA BOM B (West Wing - Labyrinth Tunnels & Fortress Site)
    // ==========================================================
    // Fortified B-Site Compound Walls (x = -34, z = -25)
    this.createWall(-34, 3, -37, 26, 6, 2, physics) // North B Wall
    this.createWall(-46, 3, -25, 2, 6, 24, physics) // West B Wall
    this.createWall(-22, 3, -28, 2, 6, 16, physics) // East B Wall
    // Center defense bunker inside B
    this.createWall(-34, 2, -22, 8, 4, 3, physics)

    // B-Tunnels Underground / Covered Passageway
    // Wall and archway enclosure from z = 25 to z = -10 at x = -36
    this.createWall(-36, 3, 8, 2, 6, 26, physics)
    this.createWall(-24, 3, 8, 2, 6, 20, physics)
    // Tunnel Ceiling slab
    const tunnelRoof = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 24), this.wallMat)
    tunnelRoof.position.set(-30, 5.8, 8)
    this.group.add(tunnelRoof)
    this.collidableMeshes.push(tunnelRoof)

    // Containers & Cover inside B
    this.createMetalContainer(-34, 1.5, -28, 3, 3, 7, physics)
    this.createContainer(-40, 1.5, -18, 6, 3, 3, this.redContainerMat, physics)
    this.createCrate(-28, 1, -20, 2.5, 2, 2.5, physics)
    this.createCrate(-38, 1, -30, 3, 2, 3, physics)
    this.createBarrel(-32, 0, -18, physics)
    this.createBarrel(-33.5, 0, -18, physics)

    // Zona Bom B Indonesian Signs
    this.createSign(-34, 3.8, -35.8, 7, 2.2, 0, 'ZONA BOM B', 'GUDANG SENJATA & AMUNISI UTAMA', { theme: 'warning', code: 'TARGET-BRAVO' })
    this.createSign(-24, 3.2, 18, 5, 1.6, -Math.PI / 2, 'LORONG B-TUNNEL ➔', 'AWAS! PERTEMPURAN JARAK DEKAT', { theme: 'military', arrow: 'right' })
    this.createSign(-34, 2.8, -20.3, 4.5, 1.4, 0, 'BAHAYA AMUNISI AKTIF', 'DILARANG MEMBAWA API ATAU MEROKOK', { theme: 'danger' })

    // ==========================================================
    // 6. CENTRAL MID & PASAR GURUN TRADISIONAL (Mid Bazaar)
    // ==========================================================
    // Massive Double Mid Arch Walls with gateway
    this.createWall(-18, 3.5, 0, 16, 7, 2, physics)
    this.createWall(18, 3.5, 0, 16, 7, 2, physics)
    // High Arch over Mid Gap (Span = 12m at y = 6.2)
    this.createWall(0, 6.2, 0, 12, 1.6, 2, physics)

    // Mid Bazaar Market Stalls (Kios Pasar Berkanopi)
    this.createMarketStall(8, 0, 10, physics)
    this.createMarketStall(-8, 0, 10, physics)
    this.createMarketStall(8, 0, -10, physics)
    this.createMarketStall(-8, 0, -10, physics)

    // Central Mid Wooden Crate barricades
    this.createCrate(0, 1, 6, 3, 2, 2, physics)
    this.createCrate(0, 1, -6, 3, 2, 2, physics)
    this.createCrate(-3.5, 1, 0, 2, 2, 2, physics)
    this.createCrate(3.5, 1, 0, 2, 2, 2, physics)

    // Mid Indonesian Signage
    this.createSign(0, 6.2, 1.1, 8, 2.0, 0, 'PINTU GERBANG UTAMA', 'POS PEMERIKSAAN MILITER GURUN', { theme: 'military', code: 'GERBANG-MID' })
    this.createSign(0, 6.2, -1.1, 8, 2.0, Math.PI, 'PINTU GERBANG UTAMA', 'POS PEMERIKSAAN MILITER GURUN', { theme: 'military', code: 'GERBANG-MID' })
    this.createSign(16, 3.0, 1.2, 5, 1.5, 0, 'AWAS! JALUR PENEMBAK JITU', 'GARIS TEMBAK TERBUKA DARI DUA ARAH', { theme: 'danger' })
    this.createSign(-16, 3.0, 1.2, 5, 1.5, 0, 'PASAR TRADISIONAL GURUN', 'AREA DISTRIBUSI LOGISTIK LOKAL', { theme: 'vintage' })

    // Underpass link from Mid to A-Short
    this.createWall(16, 2.5, 18, 14, 5, 1.5, physics)
    this.createSign(16, 2.8, 17.1, 4.5, 1.4, Math.PI, 'JALUR A-SHORT ➔', 'MENUJU ELEVASI A-SITE', { theme: 'info', arrow: 'right' })

    // 7. Tactical Hazard Barrels
    this.createBarrel(6, 0, 4, physics)
    this.createBarrel(-6, 0, -4, physics)
    this.createBarrel(22, 0, 12, physics)
    this.createBarrel(-22, 0, -14, physics)

    // ==========================================================
    // 8. ARCHITECTURAL DETAILS: STONE COPINGS & BOMB ZONE MARKINGS
    // ==========================================================
    const copingMat = new THREE.MeshStandardMaterial({
      color: 0x8a6635,
      roughness: 0.85
    })

    // Fortress wall stone coping trims along perimeter
    const copingNS = new THREE.BoxGeometry(118, 0.4, 2.4)
    const capN = new THREE.Mesh(copingNS, copingMat)
    capN.position.set(0, 9.2, -59)
    this.group.add(capN)

    const capS = new THREE.Mesh(copingNS, copingMat)
    capS.position.set(0, 9.2, 59)
    this.group.add(capS)

    const copingEW = new THREE.BoxGeometry(2.4, 0.4, 118)
    const capW = new THREE.Mesh(copingEW, copingMat)
    capW.position.set(-59, 9.2, 0)
    this.group.add(capW)

    const capE = new THREE.Mesh(copingEW, copingMat)
    capE.position.set(59, 9.2, 0)
    this.group.add(capE)

    // Tactical Bomb Zone Blast Circle Decals on A & B Sites
    const blastGeom = new THREE.RingGeometry(2.8, 3.4, 24)
    const blastMatA = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    })
    const blastA = new THREE.Mesh(blastGeom, blastMatA)
    blastA.rotation.x = -Math.PI / 2
    blastA.position.set(34, 1.62, -25) // Flush on A-site platform
    this.group.add(blastA)

    const blastB = new THREE.Mesh(blastGeom, blastMatA)
    blastB.rotation.x = -Math.PI / 2
    blastB.position.set(-34, 0.02, -25) // Flush on B-site floor
    this.group.add(blastB)
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
