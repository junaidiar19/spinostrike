import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class ItalianVilla {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (120m x 120m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 48)
  public tSpawn = new THREE.Vector3(0, 1.5, -48)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central Piazza Marble Fountain
    new THREE.Vector3(0, 5.2, 28),      // South Villa Balcony Vantage
    new THREE.Vector3(0, 5.2, -28),     // North Villa Sniper Terrace
    new THREE.Vector3(36, 1, 0),        // Campanile Belltower Foot
    new THREE.Vector3(36, 7.8, 0),      // Campanile Belltower Apex (8.5m!)
    new THREE.Vector3(-34, 1, 8),       // Bistro Cafe Terrace West
    new THREE.Vector3(-34, 1, -18),     // Wine Cellar Corridor West
    new THREE.Vector3(22, 1, 20),       // East Cobblestone Avenue South
    new THREE.Vector3(22, 1, -20),      // East Cobblestone Avenue North
    new THREE.Vector3(-20, 1, 20),      // West Alley Avenue South
    new THREE.Vector3(-20, 1, -20),     // West Alley Avenue North
    new THREE.Vector3(0, 1, 38),        // CT Courtyard Spawn Exit
    new THREE.Vector3(0, 1, -38),       // T Courtyard Spawn Exit
    new THREE.Vector3(14, 4.5, 0),      // Overhead Stone Arch Bridge East
    new THREE.Vector3(-14, 4.5, 0),     // Overhead Stone Arch Bridge West
    new THREE.Vector3(0, 1, 14)         // Piazza South Approach
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

  private barrelMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Wine Barrel Brown
    roughness: 0.7,
    metalness: 0.15,
    side: THREE.DoubleSide
  })

  public build(physics: PhysicsWorld) {
    this.group.name = 'map_italian_villa'

    // 1. Expanded Cobblestone Ground (120m x 120m)
    const groundGeom = new THREE.BoxGeometry(120, 1, 120)
    const ground = new THREE.Mesh(groundGeom, this.streetMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 60, 0.5, 60, true)

    // 2. Perimeter Tuscan Stone Walls (Height 8m, Thickness 2m at ±60m)
    this.createWall(0, 4, -60, 120, 8, 2, physics) // North
    this.createWall(0, 4, 60, 120, 8, 2, physics)  // South
    this.createWall(-60, 4, 0, 2, 8, 120, physics) // West
    this.createWall(60, 4, 0, 2, 8, 120, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT & T SPAWN HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 48): Tuscan villa entrance courtyard with blast walls at z = 40
    this.createWall(-10, 3.5, 40, 16, 7, 2, physics)
    this.createWall(10, 3.5, 40, 16, 7, 2, physics)
    this.createCrate(0, 1, 43, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, 45, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, 45, 2.5, 2, 2, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.5, 58.8, 8, 2.2, Math.PI, 'VILLA MEDITERANIA - GERBANG SELATAN', 'POS PERTAHANAN KOTA KUNO (CT)', { theme: 'vintage', code: 'VILLA-CT-01' })
    this.createSign(10, 3.2, 38.8, 4.5, 1.5, 0, 'MENUJU ALUN-ALUN PIAZZA ➔', 'JALUR JALAN UTAMA', { theme: 'info', arrow: 'right' })
    this.createSign(-10, 3.2, 38.8, 4.5, 1.5, 0, '◀ GANG PENYIMPANAN ANGGUR', 'JALUR SAYAP BARAT', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -48): North villa estate with blast walls at z = -40
    this.createWall(-10, 3.5, -40, 16, 7, 2, physics)
    this.createWall(10, 3.5, -40, 16, 7, 2, physics)
    this.createCrate(0, 1, -43, 4, 2, 2, physics)
    this.createCrate(-4.5, 1, -45, 2.5, 2, 2, physics)
    this.createCrate(4.5, 1, -45, 2.5, 2, 2, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.5, -58.8, 8, 2.2, 0, 'KOMPLEKS VILLA UTARA (T)', 'MARKAS PENYUSUPAN KOTA TUA', { theme: 'danger', code: 'VILLA-T-02' })
    this.createSign(10, 3.2, -38.8, 4.5, 1.5, Math.PI, '◀ SERBU MENARA LONCENG', 'JALUR PENGINTAI TIMUR', { theme: 'warning', arrow: 'left' })
    this.createSign(-10, 3.2, -38.8, 4.5, 1.5, Math.PI, 'SERBU BISTRO NUSANTARA ▶', 'PASAR TRADISIONAL', { theme: 'warning', arrow: 'right' })

    // ==========================================================
    // 4. CENTRAL PIAZZA & GRAND MARBLE FOUNTAIN
    // ==========================================================
    // Fountain Marble Outer Basin (Radius 6.5m, Height 1.2m)
    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 6.5, 1.2, 24), this.marbleMat)
    fountainBase.position.set(0, 0.6, 0)
    fountainBase.castShadow = true
    fountainBase.receiveShadow = true
    this.group.add(fountainBase)
    this.collidableMeshes.push(fountainBase)
    physics.createBox(0, 0.6, 0, 6.0, 0.6, 6.0, true)

    // Second Tier Basin (Radius 3.2m at y = 1.6m)
    const fountainTier2 = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.5, 1.0, 16), this.marbleMat)
    fountainTier2.position.set(0, 1.7, 0)
    fountainTier2.castShadow = true
    this.group.add(fountainTier2)
    this.collidableMeshes.push(fountainTier2)
    physics.createBox(0, 1.7, 0, 3.0, 0.5, 3.0, true)

    // Center Marble Obelisk Spire (Height 5m)
    const obelisk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.0, 1.2), this.marbleMat)
    obelisk.position.set(0, 4.2, 0)
    obelisk.castShadow = true
    this.group.add(obelisk)
    this.collidableMeshes.push(obelisk)
    physics.createBox(0, 4.2, 0, 0.6, 2.5, 0.6, true)

    // Piazza Signs
    this.createSign(0, 2.6, -14, 6.5, 1.8, 0, 'ALUN-ALUN KOTA TUA (PIAZZA)', 'ZONA EVAKUASI & PERLINDUNGAN WARGA SIPIL', { theme: 'vintage' })
    this.createSign(0, 2.6, 14, 6.5, 1.8, Math.PI, 'ALUN-ALUN KOTA TUA (PIAZZA)', 'ZONA EVAKUASI & PERLINDUNGAN WARGA SIPIL', { theme: 'vintage' })

    // ==========================================================
    // 5. CAMPANILE BELLTOWER (MENARA LONCENG 8.5M SNIPER APEX)
    // ==========================================================
    // Tower Structure at (36, 4.25, 0) (8m x 8m, Height 8.5m)
    this.createWall(36, 4.25, 0, 8, 8.5, 8, physics)

    // Belfry Sniper Observation Deck Roof at y = 8.5m
    const bellDeck = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.4, 8.8), this.roofTileMat)
    bellDeck.position.set(36, 8.5, 0)
    bellDeck.receiveShadow = true
    this.group.add(bellDeck)
    this.collidableMeshes.push(bellDeck)
    physics.createBox(36, 8.5, 0, 4.4, 0.2, 4.4, true)

    // Belltower Parapet Railings
    this.createCoverWall(36, 9.3, -4.2, 8.8, 1.2, 0.3, physics)
    this.createCoverWall(36, 9.3, 4.2, 8.8, 1.2, 0.3, physics)
    this.createCoverWall(31.8, 9.3, 0, 0.3, 1.2, 8.8, physics)
    this.createCoverWall(40.2, 9.3, 0, 0.3, 1.2, 8.8, physics)

    // Stairs up to Belltower from South & North
    this.createRamp(36, 4.25, 9.0, 3.0, 0.4, 10.0, -Math.PI / 5.2, physics)
    this.createRamp(36, 4.25, -9.0, 3.0, 0.4, 10.0, Math.PI / 5.2, physics)

    // Belltower Indonesian Signs
    this.createSign(36, 4.8, -4.3, 5.5, 1.6, 0, 'MENARA LONCENG KOTA', 'POS PENGINTAI PENEMBAK JITU KETINGGIAN 8.5M', { theme: 'military', code: 'BELLTOWER' })
    this.createSign(31.7, 3.0, 0, 4.5, 1.4, Math.PI / 2, 'TANGGA NAIK MENARA ▲', 'PENGINTAIAN ELEVASI TINGGI', { theme: 'info', arrow: 'up' })

    // Overhead Stone Arch Bridge connecting Campanile to Piazza East
    this.createSkybridge(24, 4.5, 0, 16, 0.4, 4, physics)
    // Stone Archway Support Pillars under Skybridge
    this.createWall(16.5, 2.25, 0, 1.2, 4.5, 4.2, physics)
    this.createWall(24, 2.25, -1.8, 14, 4.5, 0.6, physics)
    this.createWall(24, 2.25, 1.8, 14, 4.5, 0.6, physics)

    // ==========================================================
    // 6. KEDAI KOPI & BISTRO NUSANTARA + WINE CELLAR (WEST WING)
    // ==========================================================
    // Bistro Building Body at (-34, 2.5, 8) (w = 18, h = 5, d = 16)
    this.createWall(-34, 2.5, 8, 18, 5, 16, physics)
    // Wine Cellar Building Body at (-34, 2.5, -16) (w = 18, h = 5, d = 16)
    this.createWall(-34, 2.5, -16, 18, 5, 16, physics)

    // Overhead Arch Bridge connecting West buildings at y = 4.5m with arch supports
    this.createSkybridge(-34, 4.5, -4, 4, 0.4, 8, physics)
    this.createWall(-32.2, 2.25, -4, 0.6, 4.5, 8.0, physics)

    // Bistro Outdoor Pergola / Cafe Tables
    this.createCrate(-22, 1, 6, 3, 2, 2, physics)
    this.createCrate(-22, 1, 10, 2, 2, 2, physics)
    this.createBarrel(-22, 0, -12, physics)
    this.createBarrel(-22, 0, -14, physics)

    // Bistro Indonesian Signs
    this.createSign(-34, 3.6, 16.3, 6.5, 1.8, 0, 'KEDAI KOPI & BISTRO NUSANTARA', 'KULINER & TEMPAT PERTEMUAN KOTA TUA', { theme: 'vintage' })
    this.createSign(-34, 3.6, -7.7, 6.5, 1.8, 0, 'GUDANG PENYIMPANAN MINYAK & ANGGUR', 'AWAS! TONG ANGGUR MUDAH PECAH', { theme: 'vintage' })
    this.createSign(-24.7, 2.8, 0, 5, 1.5, Math.PI / 2, 'AWAS! ZONA RAWAN BAKU TEMBAK', 'DILARANG MELINTAS TANPA PENGAWAL', { theme: 'danger' })

    // ==========================================================
    // 7. DUAL VILLA BALCONY DUEL (SOUTH & NORTH TERRACES)
    // ==========================================================
    // South Villa Balcony Building at (0, 2.5, 34) (w = 26, h = 5, d = 10)
    this.createWall(0, 2.5, 34, 26, 5, 10, physics)
    // South Balcony Walkout Roof at y = 5.0m
    const southBalcony = new THREE.Mesh(new THREE.BoxGeometry(26.5, 0.4, 10.5), this.terracottaWallMat)
    southBalcony.position.set(0, 5.0, 34)
    southBalcony.receiveShadow = true
    this.group.add(southBalcony)
    this.collidableMeshes.push(southBalcony)
    physics.createBox(0, 5.0, 34, 13.25, 0.2, 5.25, true)
    // South Balcony Parapet Railing
    this.createCoverWall(0, 5.8, 28.8, 26.5, 1.2, 0.3, physics)
    this.createRamp(14, 2.5, 34, 3.0, 0.4, 8.0, 0.35, physics)

    // North Villa Balcony Building at (0, 2.5, -34) (w = 26, h = 5, d = 10)
    this.createWall(0, 2.5, -34, 26, 5, 10, physics)
    // North Balcony Roof at y = 5.0m
    const northBalcony = new THREE.Mesh(new THREE.BoxGeometry(26.5, 0.4, 10.5), this.terracottaWallMat)
    northBalcony.position.set(0, 5.0, -34)
    northBalcony.receiveShadow = true
    this.group.add(northBalcony)
    this.collidableMeshes.push(northBalcony)
    physics.createBox(0, 5.0, -34, 13.25, 0.2, 5.25, true)
    // North Balcony Parapet Railing
    this.createCoverWall(0, 5.8, -28.8, 26.5, 1.2, 0.3, physics)
    this.createRamp(-14, 2.5, -34, 3.0, 0.4, 8.0, -0.35, physics)

    // Balcony Indonesian Signs
    this.createSign(0, 5.8, 28.6, 5.5, 1.5, 0, 'VILLA SELATAN - TERAS ATAP', 'POS TEMBAK GARIS BELAKANG', { theme: 'vintage' })
    this.createSign(0, 5.8, -28.6, 5.5, 1.5, Math.PI, 'VILLA UTARA - TERAS ATAP', 'POS TEMBAK GARIS DEPAN', { theme: 'vintage' })
  }

  private createSkybridge(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    physics: PhysicsWorld
  ) {
    const geom = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geom, this.terracottaWallMat)
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
    const mesh = new THREE.Mesh(geom, this.terracottaWallMat)
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
    const mesh = new THREE.Mesh(geom, this.terracottaWallMat)
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
    const mesh = new THREE.Mesh(geom, this.terracottaWallMat)
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
