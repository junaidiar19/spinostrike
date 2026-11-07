import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class ItalianVilla {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (120m x 120m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 96)
  public tSpawn = new THREE.Vector3(0, 1.5, -96)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central Piazza Marble Fountain
    new THREE.Vector3(0, 5.2, 56),      // South Villa Balcony Vantage
    new THREE.Vector3(0, 5.2, -56),     // North Villa Sniper Terrace
    new THREE.Vector3(72, 1, 0),        // Campanile Belltower Foot
    new THREE.Vector3(72, 7.8, 0),      // Campanile Belltower Apex (8.5m!)
    new THREE.Vector3(-68, 1, 16),      // Bistro Cafe Terrace West
    new THREE.Vector3(-68, 1, -36),     // Wine Cellar Corridor West
    new THREE.Vector3(44, 1, 40),       // East Cobblestone Avenue South
    new THREE.Vector3(44, 1, -40),      // East Cobblestone Avenue North
    new THREE.Vector3(-40, 1, 40),      // West Alley Avenue South
    new THREE.Vector3(-40, 1, -40),     // West Alley Avenue North
    new THREE.Vector3(0, 1, 76),        // CT Courtyard Spawn Exit
    new THREE.Vector3(0, 1, -76),       // T Courtyard Spawn Exit
    new THREE.Vector3(28, 4.5, 0),      // Overhead Stone Arch Bridge East
    new THREE.Vector3(-28, 4.5, 0),     // Overhead Stone Arch Bridge West
    new THREE.Vector3(0, 1, 28)         // Piazza South Approach
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

    // 1. Expanded Cobblestone Street Ground (240m x 240m - 2x Larger Italian City Arena)
    const groundGeom = new THREE.BoxGeometry(240, 1, 240)
    const ground = new THREE.Mesh(groundGeom, this.streetMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 120, 0.5, 120, true)

    // 2. Perimeter Tuscan Stone Walls (Height 8m, Thickness 3m at ±120m)
    this.createWall(0, 4, -120, 240, 8, 3, physics) // North
    this.createWall(0, 4, 120, 240, 8, 3, physics)  // South
    this.createWall(-120, 4, 0, 3, 8, 240, physics) // West
    this.createWall(120, 4, 0, 3, 8, 240, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT & T SPAWN HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 96): Tuscan villa entrance courtyard with blast walls at z = 80
    this.createWall(-20, 3.5, 80, 32, 7, 3, physics)
    this.createWall(20, 3.5, 80, 32, 7, 3, physics)
    this.createCrate(0, 1, 86, 6, 2, 3, physics)
    this.createCrate(-9, 1, 90, 4, 2, 3, physics)
    this.createCrate(9, 1, 90, 4, 2, 3, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.5, 118.5, 12, 2.6, Math.PI, 'VILLA MEDITERANIA - GERBANG SELATAN', 'POS PERTAHANAN KOTA KUNO (CT) - 240M PIAZZA ARENA', { theme: 'vintage', code: 'VILLA-CT-01' })
    this.createSign(20, 3.8, 77.8, 6, 1.8, 0, 'MENUJU ALUN-ALUN PIAZZA ➔', 'JALUR JALAN UTAMA', { theme: 'info', arrow: 'right' })
    this.createSign(-20, 3.8, 77.8, 6, 1.8, 0, '◀ GANG PENYIMPANAN ANGGUR', 'JALUR SAYAP BARAT', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -96): North villa estate with blast walls at z = -80
    this.createWall(-20, 3.5, -80, 32, 7, 3, physics)
    this.createWall(20, 3.5, -80, 32, 7, 3, physics)
    this.createCrate(0, 1, -86, 6, 2, 3, physics)
    this.createCrate(-9, 1, -90, 4, 2, 3, physics)
    this.createCrate(9, 1, -90, 4, 2, 3, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.5, -118.5, 12, 2.6, 0, 'KOMPLEKS VILLA UTARA (T)', 'MARKAS PENYUSUPAN KOTA TUA', { theme: 'danger', code: 'VILLA-T-02' })
    this.createSign(20, 3.8, -77.8, 6, 1.8, Math.PI, '◀ SERBU MENARA LONCENG', 'JALUR PENGINTAI TIMUR', { theme: 'warning', arrow: 'left' })
    this.createSign(-20, 3.8, -77.8, 6, 1.8, Math.PI, 'SERBU BISTRO NUSANTARA ▶', 'PASAR TRADISIONAL', { theme: 'warning', arrow: 'right' })

    // ==========================================================
    // 4. CENTRAL PIAZZA & GRAND MARBLE FOUNTAIN
    // ==========================================================
    // Fountain Marble Outer Basin (Radius 10m, Height 1.2m)
    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(9.0, 10.0, 1.2, 24), this.marbleMat)
    fountainBase.position.set(0, 0.6, 0)
    fountainBase.castShadow = true
    fountainBase.receiveShadow = true
    this.group.add(fountainBase)
    this.collidableMeshes.push(fountainBase)
    physics.createBox(0, 0.6, 0, 9.0, 0.6, 9.0, true)

    // Second Tier Basin
    const fountainTier2 = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 5.8, 1.0, 16), this.marbleMat)
    fountainTier2.position.set(0, 1.7, 0)
    fountainTier2.castShadow = true
    this.group.add(fountainTier2)
    this.collidableMeshes.push(fountainTier2)
    physics.createBox(0, 1.7, 0, 5.0, 0.5, 5.0, true)

    // Center Marble Obelisk Spire (Height 6.5m)
    const obelisk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 6.5, 1.8), this.marbleMat)
    obelisk.position.set(0, 5.0, 0)
    obelisk.castShadow = true
    this.group.add(obelisk)
    this.collidableMeshes.push(obelisk)
    physics.createBox(0, 5.0, 0, 0.9, 3.25, 0.9, true)

    // Piazza Signs
    this.createSign(0, 3.0, -24, 9.0, 2.2, 0, 'ALUN-ALUN KOTA TUA (PIAZZA)', 'ZONA EVAKUASI & PERLINDUNGAN WARGA SIPIL', { theme: 'vintage' })
    this.createSign(0, 3.0, 24, 9.0, 2.2, Math.PI, 'ALUN-ALUN KOTA TUA (PIAZZA)', 'ZONA EVAKUASI & PERLINDUNGAN WARGA SIPIL', { theme: 'vintage' })

    // ==========================================================
    // 5. CAMPANILE BELLTOWER (MENARA LONCENG 8.5M SNIPER APEX)
    // ==========================================================
    this.createWall(72, 4.25, 0, 14, 8.5, 14, physics)

    const bellDeck = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 15), this.roofTileMat)
    bellDeck.position.set(72, 8.5, 0)
    bellDeck.receiveShadow = true
    this.group.add(bellDeck)
    this.collidableMeshes.push(bellDeck)
    physics.createBox(72, 8.5, 0, 7.5, 0.2, 7.5, true)

    this.createCoverWall(72, 9.3, -7.2, 15, 1.2, 0.4, physics)
    this.createCoverWall(72, 9.3, 7.2, 15, 1.2, 0.4, physics)
    this.createCoverWall(64.8, 9.3, 0, 0.4, 1.2, 15, physics)
    this.createCoverWall(79.2, 9.3, 0, 0.4, 1.2, 15, physics)

    this.createRamp(72, 4.25, 16.0, 4.5, 0.4, 16.0, -Math.PI / 5.2, physics)
    this.createRamp(72, 4.25, -16.0, 4.5, 0.4, 16.0, Math.PI / 5.2, physics)

    this.createSign(72, 5.2, -7.3, 8.0, 1.8, 0, 'MENARA LONCENG KOTA', 'POS PENGINTAI PENEMBAK JITU KETINGGIAN 8.5M', { theme: 'military', code: 'BELLTOWER' })
    this.createSign(64.5, 3.5, 0, 6.0, 1.6, Math.PI / 2, 'TANGGA NAIK MENARA ▲', 'PENGINTAIAN ELEVASI TINGGI', { theme: 'info', arrow: 'up' })

    // Overhead Stone Arch Bridge
    this.createSkybridge(44, 4.5, 0, 32, 0.4, 6, physics)
    this.createWall(30, 2.25, 0, 1.6, 4.5, 6.2, physics)

    // ==========================================================
    // 6. KEDAI KOPI & BISTRO NUSANTARA + WINE CELLAR (WEST WING)
    // ==========================================================
    this.createWall(-68, 2.5, 16, 32, 5, 28, physics)
    this.createWall(-68, 2.5, -32, 32, 5, 28, physics)

    this.createSkybridge(-68, 4.5, -8, 6, 0.4, 16, physics)

    this.createCrate(-44, 1, 12, 5, 2, 3, physics)
    this.createCrate(-44, 1, 20, 4, 2, 3, physics)
    this.createBarrel(-44, 0, -24, physics)
    this.createBarrel(-44, 0, -28, physics)

    this.createSign(-68, 3.8, 30.5, 9.0, 2.2, 0, 'KEDAI KOPI & BISTRO NUSANTARA', 'KULINER & TEMPAT PERTEMUAN KOTA TUA', { theme: 'vintage' })
    this.createSign(-68, 3.8, -17.5, 9.0, 2.2, 0, 'GUDANG PENYIMPANAN MINYAK & ANGGUR', 'AWAS! TONG ANGGUR MUDAH PECAH', { theme: 'vintage' })

    // ==========================================================
    // 7. DUAL VILLA BALCONY DUEL (SOUTH & NORTH TERRACES)
    // ==========================================================
    this.createWall(0, 2.5, 68, 48, 5, 18, physics)
    const southBalcony = new THREE.Mesh(new THREE.BoxGeometry(49, 0.4, 18.5), this.terracottaWallMat)
    southBalcony.position.set(0, 5.0, 68)
    southBalcony.receiveShadow = true
    this.group.add(southBalcony)
    this.collidableMeshes.push(southBalcony)
    physics.createBox(0, 5.0, 68, 24.5, 0.2, 9.25, true)
    this.createCoverWall(0, 5.8, 58.5, 49, 1.2, 0.4, physics)
    this.createRamp(24, 2.5, 68, 4.5, 0.4, 14.0, 0.35, physics)

    this.createWall(0, 2.5, -68, 48, 5, 18, physics)
    const northBalcony = new THREE.Mesh(new THREE.BoxGeometry(49, 0.4, 18.5), this.terracottaWallMat)
    northBalcony.position.set(0, 5.0, -68)
    northBalcony.receiveShadow = true
    this.group.add(northBalcony)
    this.collidableMeshes.push(northBalcony)
    physics.createBox(0, 5.0, -68, 24.5, 0.2, 9.25, true)
    this.createCoverWall(0, 5.8, -58.5, 49, 1.2, 0.4, physics)
    this.createRamp(-24, 2.5, -68, 4.5, 0.4, 14.0, -0.35, physics)

    this.createSign(0, 5.8, 58.2, 8.0, 1.8, 0, 'VILLA SELATAN - TERAS ATAP', 'POS TEMBAK GARIS BELAKANG', { theme: 'vintage' })
    this.createSign(0, 5.8, -58.2, 8.0, 1.8, Math.PI, 'VILLA UTARA - TERAS ATAP', 'POS TEMBAK GARIS DEPAN', { theme: 'vintage' })
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
