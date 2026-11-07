import * as THREE from 'three'
import type { PhysicsWorld } from '../core/Physics'
import { TextureGenerator } from './TextureGenerator'

export class ArcticOutpost {
  public group = new THREE.Group()
  public collidableMeshes: THREE.Object3D[] = []

  // Expanded tactical spawn locations (120m x 120m map)
  public ctSpawn = new THREE.Vector3(0, 1.5, 96)
  public tSpawn = new THREE.Vector3(0, 1.5, -96)
  public botWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, 0),         // Central Snow Courtyard
    new THREE.Vector3(0, 7.5, 0),       // Central Sniper Watchtower Apex
    new THREE.Vector3(32, 5.5, 0),      // Skywalk East Bridge
    new THREE.Vector3(-32, 5.5, 0),     // Skywalk West Bridge
    new THREE.Vector3(64, 1, 36),       // Helipad Landing Zone
    new THREE.Vector3(68, 1, -32),      // Sub-Zero Fuel Depot Ground
    new THREE.Vector3(68, 5.5, -32),    // Fuel Depot Roof Vantage
    new THREE.Vector3(-68, 1, -32),     // Radar Station Entrance
    new THREE.Vector3(-68, 5.5, -32),   // Radar Station Roof Vantage
    new THREE.Vector3(-64, 1, 36),      // Cryo Pipeline Pass West
    new THREE.Vector3(0, 1, 72),        // CT Spawn Yard Exit
    new THREE.Vector3(0, 1, -72),       // T Spawn Yard Exit
    new THREE.Vector3(36, 1, 60),       // Helipad Access Path
    new THREE.Vector3(-36, 1, -60),     // Radar Flank Path North
    new THREE.Vector3(0, 3.8, 20),      // Tower South Ramp Midpoint
    new THREE.Vector3(0, 3.8, -20)      // Tower North Ramp Midpoint
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

    // 1. Expanded Snow Ground (240m x 240m - 2x Larger Combat Area)
    const groundGeom = new THREE.BoxGeometry(240, 1, 240)
    const ground = new THREE.Mesh(groundGeom, this.snowMat)
    ground.position.set(0, -0.5, 0)
    ground.receiveShadow = true
    this.group.add(ground)
    this.collidableMeshes.push(ground)
    physics.createBox(0, -0.5, 0, 120, 0.5, 120, true)

    // 2. Perimeter Frost Walls (Height 8m, Thickness 3m at ±120m)
    this.createWall(0, 4, -120, 240, 8, 3, physics) // North
    this.createWall(0, 4, 120, 240, 8, 3, physics)  // South
    this.createWall(-120, 4, 0, 3, 8, 240, physics) // West
    this.createWall(120, 4, 0, 3, 8, 240, physics)  // East

    // ==========================================================
    // 3. FORTIFIED CT & T SPAWN HIDEOUTS (Tempat Persembunyian Awal)
    // ==========================================================
    // CT Spawn Hideout (z = 96): Frost bunker with blast walls at z = 80
    this.createWall(-20, 3.5, 80, 32, 7, 3, physics)
    this.createWall(20, 3.5, 80, 32, 7, 3, physics)
    this.createCrate(0, 1, 86, 6, 2, 3, physics)
    this.createCrate(-9, 1, 90, 4, 2, 3, physics)
    this.createCrate(9, 1, 90, 4, 2, 3, physics)

    // CT Spawn Indonesian Signage
    this.createSign(0, 5.5, 118.5, 12, 2.6, Math.PI, 'PANGKALAN RISET & MILITER ARKTIK', 'POS PERTAHANAN SELATAN (CT) - STATUS SIAGA 1 (240M)', { theme: 'military', code: 'ARKTIK-CT-01' })
    this.createSign(20, 3.8, 77.8, 6, 1.8, 0, 'MENUJU HELIPAD ➔', 'LANDASAN UDARA SEKTOR 01', { theme: 'info', arrow: 'right' })
    this.createSign(-20, 3.8, 77.8, 6, 1.8, 0, '◀ MENUJU STASIUN RADAR', 'FASILITAS RISET & KOMUNIKASI', { theme: 'info', arrow: 'left' })

    // T Spawn Hideout (z = -96): Infiltration base with blast walls at z = -80
    this.createWall(-20, 3.5, -80, 32, 7, 3, physics)
    this.createWall(20, 3.5, -80, 32, 7, 3, physics)
    this.createCrate(0, 1, -86, 6, 2, 3, physics)
    this.createCrate(-9, 1, -90, 4, 2, 3, physics)
    this.createCrate(9, 1, -90, 4, 2, 3, physics)

    // T Spawn Indonesian Signage
    this.createSign(0, 5.5, -118.5, 12, 2.6, 0, 'STASIUN INFILTRASI KUTUB (T)', 'DEPO PENYUSUPAN UTARA - BADAI SALJU', { theme: 'danger', code: 'ARKTIK-T-02' })
    this.createSign(20, 3.8, -77.8, 6, 1.8, Math.PI, '◀ SERBU DEPO BAHAN BAKAR', 'JALUR SAYAP TIMUR', { theme: 'warning', arrow: 'left' })
    this.createSign(-20, 3.8, -77.8, 6, 1.8, Math.PI, 'SERBU STASIUN RADAR ▶', 'JALUR SAYAP BARAT', { theme: 'warning', arrow: 'right' })

    // ==========================================================
    // 4. LANDASAN HELIKOPTER MILITER (HELIPAD SECTOR 01)
    // ==========================================================
    const helipadMesh = new THREE.Mesh(new THREE.BoxGeometry(36, 0.2, 36), this.helipadMat)
    helipadMesh.position.set(64, 0.1, 36)
    helipadMesh.receiveShadow = true
    this.group.add(helipadMesh)
    this.collidableMeshes.push(helipadMesh)
    physics.createBox(64, 0.1, 36, 18, 0.1, 18, true)

    // Helipad Yellow 'H' Marking in 3D
    const hBarMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
    const hLeft = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 14), hBarMat)
    hLeft.position.set(58, 0.23, 36)
    this.group.add(hLeft)
    const hRight = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 14), hBarMat)
    hRight.position.set(70, 0.23, 36)
    this.group.add(hRight)
    const hMid = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 2.0), hBarMat)
    hMid.position.set(64, 0.23, 36)
    this.group.add(hMid)

    this.createCrate(64, 1, 52, 6, 2, 3, physics)
    this.createCrate(80, 1, 36, 4, 2, 4, physics)

    this.createSign(64, 3.0, 16.5, 8, 2.0, 0, 'LANDASAN HELIKOPTER SEKTOR 01', 'KHUSUS EVAKUASI MEDIS & PENERBANGAN MILITER', { theme: 'military', code: 'HELI-BASE' })
    this.createSign(84.4, 3.0, 36, 7, 1.8, -Math.PI / 2, 'AWAS ARUS ANGIN HELIKOPTER', 'DILARANG MENDEKAT SAAT BALING-BALING BERPUTAR', { theme: 'warning' })

    // ==========================================================
    // 5. CENTRAL HIGH WATCHTOWER (7.5M SNIPER APEX) & SKYBRIDGES
    // ==========================================================
    const pillarGeom = new THREE.BoxGeometry(1.4, 7.2, 1.4)
    const pMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    const coords = [[-6, -6], [6, -6], [-6, 6], [6, 6]]
    coords.forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeom, pMat)
      p.position.set(px, 3.6, pz)
      p.castShadow = true
      this.group.add(p)
      this.collidableMeshes.push(p)
      physics.createBox(px, 3.6, pz, 0.7, 3.6, 0.7, true)
    })

    const towerFloor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 14), this.metalCatwalkMat)
    towerFloor.position.set(0, 7.2, 0)
    towerFloor.receiveShadow = true
    this.group.add(towerFloor)
    this.collidableMeshes.push(towerFloor)
    physics.createBox(0, 7.2, 0, 7.0, 0.2, 7.0, true)

    const towerMidFloor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 14), this.metalCatwalkMat)
    towerMidFloor.position.set(0, 5.0, 0)
    towerMidFloor.receiveShadow = true
    this.group.add(towerMidFloor)
    this.collidableMeshes.push(towerMidFloor)
    physics.createBox(0, 5.0, 0, 7.0, 0.15, 7.0, true)

    this.createCoverWall(0, 8.0, -6.8, 14, 1.2, 0.4, physics)
    this.createCoverWall(0, 8.0, 6.8, 14, 1.2, 0.4, physics)
    this.createCoverWall(-6.8, 8.0, 0, 0.4, 1.2, 14, physics)
    this.createCoverWall(6.8, 8.0, 0, 0.4, 1.2, 14, physics)

    // Ramps to Tower Apex
    this.createRamp(0, 6.1, 8, 3.5, 0.25, 7.0, -Math.PI / 7, physics)
    this.createRamp(0, 6.1, -8, 3.5, 0.25, 7.0, Math.PI / 7, physics)

    // Ground Access Ramps to Mid-Level
    this.createRamp(0, 2.5, 20, 4.5, 0.3, 18, -Math.PI / 7.5, physics)
    this.createRamp(0, 2.5, -20, 4.5, 0.3, 18, Math.PI / 7.5, physics)

    // Skywalk Bridges
    this.createSkywalk(28, 5.0, 0, 42, 0.3, 4.5, physics)
    this.createSkywalk(48, 5.0, -10, 4.5, 0.3, 20, physics)

    this.createSkywalk(-28, 5.0, 0, 42, 0.3, 4.5, physics)
    this.createSkywalk(-48, 5.0, -10, 4.5, 0.3, 20, physics)

    this.createSign(0, 8.0, -6.5, 7, 1.6, 0, 'MENARA OBSERVASI UTAMA', 'POS PENEMBAK JITU KETINGGIAN 7.5M', { theme: 'military', code: 'SNIPER-TOWER' })
    this.createSign(0, 8.0, 6.5, 7, 1.6, Math.PI, 'MENARA OBSERVASI UTAMA', 'POS PENEMBAK JITU KETINGGIAN 7.5M', { theme: 'military', code: 'SNIPER-TOWER' })

    // ==========================================================
    // 6. STASIUN RADAR & RISET ES (SECTOR B - WEST WING)
    // ==========================================================
    this.createWall(-68, 2.5, -32, 36, 5, 36, physics)
    const radarRoof = new THREE.Mesh(new THREE.BoxGeometry(37, 0.4, 37), this.metalCatwalkMat)
    radarRoof.position.set(-68, 5.2, -32)
    radarRoof.receiveShadow = true
    this.group.add(radarRoof)
    this.collidableMeshes.push(radarRoof)
    physics.createBox(-68, 5.2, -32, 18.5, 0.2, 18.5, true)

    this.createCoverWall(-68, 5.9, -13.2, 37, 1.1, 0.4, physics)
    this.createCoverWall(-86.8, 5.9, -32, 0.4, 1.1, 37, physics)
    this.createRamp(-48, 2.6, -32, 4.5, 0.3, 14.0, 0.35, physics)

    const dishBase = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.4, 3.5, 16), this.hazardMat)
    dishBase.position.set(-68, 7.0, -32)
    dishBase.castShadow = true
    this.group.add(dishBase)
    this.collidableMeshes.push(dishBase)
    physics.createBox(-68, 7.0, -32, 2.8, 1.75, 2.8, true)

    this.createSign(-68, 4.0, -13.2, 9, 2.2, 0, 'STASIUN RADAR & PERTAHANAN UDARA', 'SEKTOR B - SISTEM DETEKSI AWAL DINI', { theme: 'military', code: 'RADAR-BRAVO' })

    // ==========================================================
    // 7. DEPO BAHAN BAKAR SUB-ZERO & TANGKI CRYO (EAST WING)
    // ==========================================================
    this.createWall(68, 2.5, -32, 36, 5, 36, physics)
    const fuelRoof = new THREE.Mesh(new THREE.BoxGeometry(37, 0.4, 37), this.metalCatwalkMat)
    fuelRoof.position.set(68, 5.2, -32)
    fuelRoof.receiveShadow = true
    this.group.add(fuelRoof)
    this.collidableMeshes.push(fuelRoof)
    physics.createBox(68, 5.2, -32, 18.5, 0.2, 18.5, true)
    this.createCoverWall(68, 5.9, -13.2, 37, 1.1, 0.4, physics)
    this.createCoverWall(86.8, 5.9, -32, 0.4, 1.1, 37, physics)
    this.createRamp(48, 2.6, -32, 4.5, 0.3, 14.0, 0.35, physics)

    this.createCryoTank(60, 0, -42, physics)
    this.createCryoTank(68, 0, -42, physics)
    this.createCryoTank(76, 0, -42, physics)

    this.createSign(68, 4.0, -13.2, 9, 2.2, 0, 'DEPO BAHAN BAKAR SUB-ZERO', 'BAHAN BAKAR TANK & GENERATOR LISTRIK', { theme: 'warning', code: 'FUEL-DEPOT' })

    this.createBarrel(28, 0, 36, physics)
    this.createBarrel(28, 0, 39, physics)
    this.createBarrel(-28, 0, 36, physics)
    this.createBarrel(-28, 0, -36, physics)

    // Floodlight Masts
    const mastLocations = [
      [96, 96], [-96, 96], [96, -96], [-96, -96]
    ]
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 })
    mastLocations.forEach(([mx, mz]) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.35, 10, 8), mastMat)
      mast.position.set(mx, 5.0, mz)
      this.group.add(mast)
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), mastMat)
      head.position.set(mx, 10.2, mz)
      this.group.add(head)
    })
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
