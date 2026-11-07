import * as THREE from 'three'
import { audioManager } from '../core/AudioManager'
import { useGameStore } from '../../stores/useGameStore'
import type { BulletManager } from '../weapons/BulletManager'
import type { Player } from './Player'

export class Tank {
  public mesh: THREE.Group = new THREE.Group()
  public hullGroup: THREE.Group = new THREE.Group()
  public turretGroup: THREE.Group = new THREE.Group()
  public cannonGroup: THREE.Group = new THREE.Group()
  public barrelMesh!: THREE.Mesh
  public muzzleFlash!: THREE.Mesh

  public position: THREE.Vector3 = new THREE.Vector3()
  public velocity: THREE.Vector3 = new THREE.Vector3()
  public hullYaw: number = 0
  public turretYaw: number = 0
  public cannonPitch: number = 0

  public speed: number = 0
  public maxSpeed: number = 13.5 // m/s (~50 km/h)
  public reverseSpeed: number = -5.5 // m/s
  public acceleration: number = 9.0
  public turnSpeed: number = 1.35 // rad/s

  public isOccupied: boolean = false
  public driver: Player | null = null

  public health: number = 500
  public maxHealth: number = 500
  public isDestroyed: boolean = false

  public reloadTimer: number = 0
  public reloadDuration: number = 2.4 // seconds between 120mm shells

  private recoilZ: number = 0
  private bulletManager: BulletManager
  private tracksAnimationTimer: number = 0
  private roadWheels: THREE.Mesh[] = []

  // Enhanced Military Main Battle Tank Materials
  private armorMat = new THREE.MeshStandardMaterial({
    color: 0x3d493a, // Tactical Olive Drab Composite Armor
    roughness: 0.62,
    metalness: 0.45,
    flatShading: true
  })

  private armorAccentMat = new THREE.MeshStandardMaterial({
    color: 0x2e382b, // Dark Forest Composite ERA Tiles
    roughness: 0.70,
    metalness: 0.35,
    flatShading: true
  })

  private steelMat = new THREE.MeshStandardMaterial({
    color: 0x22262a, // Dark Gunmetal Machined Steel
    roughness: 0.38,
    metalness: 0.85
  })

  private rubberMat = new THREE.MeshStandardMaterial({
    color: 0x181818, // Heavy Vulcanized Rubber Tires & Flaps
    roughness: 0.9,
    metalness: 0.1
  })

  private trackTreadMat = new THREE.MeshStandardMaterial({
    color: 0x141618, // Heavy Caterpillar Steel Treads
    roughness: 0.85,
    metalness: 0.65
  })

  private headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffe082,
    emissiveIntensity: 1.8,
    roughness: 0.2
  })

  private taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff1111,
    emissiveIntensity: 1.5,
    roughness: 0.3
  })

  private opticGlassMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x0099cc,
    emissiveIntensity: 1.5,
    roughness: 0.1,
    metalness: 0.8
  })

  private canvasMat = new THREE.MeshStandardMaterial({
    color: 0x484637, // Tactical Rolled Tarpaulin / Canvas
    roughness: 0.95,
    metalness: 0.05
  })

  private brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // .50 Cal Cartridge Brass
    roughness: 0.25,
    metalness: 0.95
  })

  constructor(initialPosition: THREE.Vector3, initialYaw = 0, bulletManager: BulletManager) {
    this.bulletManager = bulletManager
    this.position.copy(initialPosition)
    this.hullYaw = initialYaw
    this.turretYaw = initialYaw

    this.buildModel()
    this.mesh.position.copy(this.position)
    this.hullGroup.rotation.y = this.hullYaw
  }

  private buildModel() {
    this.mesh.name = 'BattleTank'
    this.mesh.add(this.hullGroup)

    // ==========================================
    // 1. TANK LOWER CHASSIS & ARMORED HULL
    // ==========================================
    // Main Armored Hull Tub (Length 6.2m, Width 3.3m, Height 1.0m)
    const mainHull = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.0, 6.2), this.armorMat)
    mainHull.position.set(0, 0.98, 0)
    mainHull.castShadow = true
    mainHull.receiveShadow = true
    this.hullGroup.add(mainHull)

    // Sloped Lower Front Glacis Plate
    const lowerGlacis = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.45, 1.2), this.steelMat)
    lowerGlacis.position.set(0, 0.55, -3.1)
    lowerGlacis.rotation.x = -0.6
    this.hullGroup.add(lowerGlacis)

    // Sloped Upper Front Glacis Plate (High Deflection Angle)
    const upperGlacis = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.38, 1.9), this.armorAccentMat)
    upperGlacis.position.set(0, 1.32, -2.25)
    upperGlacis.rotation.x = 0.38
    this.hullGroup.add(upperGlacis)

    // Explosive Reactive Armor (ERA) Modular Brick Tiles on Upper Glacis
    for (let row = 0; row < 2; row++) {
      for (let col = -3; col <= 3; col++) {
        const eraTile = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.45), this.armorAccentMat)
        eraTile.position.set(col * 0.42, 1.36 + row * 0.14, -2.4 + row * 0.45)
        eraTile.rotation.x = 0.38
        this.hullGroup.add(eraTile)
      }
    }

    // Heavy Tow Shackles / D-Rings on Front Bumper
    for (const sx of [-1.2, 1.2]) {
      const shackleBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.16), this.steelMat)
      shackleBase.position.set(sx, 0.65, -3.2)
      this.hullGroup.add(shackleBase)

      const shackleRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 16), this.steelMat)
      shackleRing.position.set(sx, 0.52, -3.28)
      shackleRing.rotation.y = Math.PI / 2
      this.hullGroup.add(shackleRing)
    }

    // Dual Front Armored Headlight Assemblies with Protective Grilles
    for (const sx of [-1.25, 1.25]) {
      // Armored Housing Box
      const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.3), this.steelMat)
      lightBox.position.set(sx, 1.35, -3.0)
      this.hullGroup.add(lightBox)

      // Glowing Headlight Lens
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), this.headlightMat)
      lens.rotation.x = Math.PI / 2
      lens.position.set(sx, 1.35, -3.16)
      this.hullGroup.add(lens)

      // Protective Brush Guard Bars
      const guardBar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.04), this.steelMat)
      guardBar.position.set(sx, 1.35, -3.2)
      this.hullGroup.add(guardBar)
    }

    // Front Illuminating Headlamp Beam (PointLight)
    const headlampLight = new THREE.PointLight(0xfffae0, 1.4, 38)
    headlampLight.position.set(0, 1.4, -3.4)
    this.hullGroup.add(headlampLight)

    // Rear Red Taillight Markers
    for (const sx of [-1.3, 1.3]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.08), this.taillightMat)
      tail.position.set(sx, 1.25, 3.14)
      this.hullGroup.add(tail)
    }

    // Rear Engine Radiator Deck & Louvered Ventilation Vents
    const engineDeck = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.24, 2.3), this.steelMat)
    engineDeck.position.set(0, 1.54, 1.85)
    this.hullGroup.add(engineDeck)

    // Twin Circular Engine Cooling Fan Grilles
    for (const sx of [-0.65, 0.65]) {
      const fanGrille = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 20), this.armorAccentMat)
      fanGrille.position.set(sx, 1.68, 1.7)
      this.hullGroup.add(fanGrille)

      // Center Fan Hub
      const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 12), this.steelMat)
      fanHub.position.set(sx, 1.7, 1.7)
      this.hullGroup.add(fanHub)
    }

    // Dual Heavy Armored Exhaust Stacks & Mufflers
    for (const sx of [-1.18, 1.18]) {
      const muffler = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.9), this.steelMat)
      muffler.position.set(sx, 1.45, 2.65)
      this.hullGroup.add(muffler)

      const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 12), this.steelMat)
      exhaustPipe.rotation.x = -0.55
      exhaustPipe.position.set(sx, 1.62, 3.05)
      this.hullGroup.add(exhaustPipe)
    }

    // Rear Auxiliary Long-Range Fuel Drum Tanks
    for (const sx of [-0.85, 0.85]) {
      const fuelDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.1, 16), this.armorAccentMat)
      fuelDrum.rotation.z = Math.PI / 2
      fuelDrum.position.set(sx, 1.0, 3.4)
      fuelDrum.castShadow = true
      this.hullGroup.add(fuelDrum)

      // Fuel Drum Mounting Straps
      for (const stx of [-0.35, 0.35]) {
        const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 16), this.steelMat)
        strap.rotation.z = Math.PI / 2
        strap.position.set(sx + stx, 1.0, 3.4)
        this.hullGroup.add(strap)
      }
    }

    // ==========================================
    // 2. CATERPILLAR TRACKS, ROAD WHEELS & SKIRTS
    // ==========================================
    for (const side of [-1, 1]) {
      const trackX = side * 1.68

      // Continuous Track Belt Upper and Lower Runs
      const trackBelt = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.92, 6.3), this.trackTreadMat)
      trackBelt.position.set(trackX, 0.54, 0)
      trackBelt.castShadow = true
      this.hullGroup.add(trackBelt)

      // Segmented Heavy Armored Side Skirts (Modular composite plates along side)
      for (let s = 0; s < 5; s++) {
        const skirtZ = -2.1 + s * 1.05
        const skirtPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.98), this.armorMat)
        skirtPanel.position.set(side * 2.02, 0.76, skirtZ)
        this.hullGroup.add(skirtPanel)

        // Skirt Hinge / Bolt Plate
        const skirtBolt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.22), this.armorAccentMat)
        skirtBolt.position.set(side * 2.03, 1.05, skirtZ)
        this.hullGroup.add(skirtBolt)
      }

      // Front Mudflap with Rubber Trim
      const frontMudflap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.45), this.rubberMat)
      frontMudflap.position.set(trackX, 0.92, -3.25)
      frontMudflap.rotation.x = 0.35
      this.hullGroup.add(frontMudflap)

      // Rear Mudflap with Rubber Trim
      const rearMudflap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.4), this.rubberMat)
      rearMudflap.position.set(trackX, 0.88, 3.25)
      rearMudflap.rotation.x = -0.3
      this.hullGroup.add(rearMudflap)

      // 7 Dual Road Wheels per side with center hub caps & rubber rims
      for (let w = 0; w < 7; w++) {
        const wheelZ = -2.35 + w * 0.78

        // Outer Rubber Wheel Rim
        const outerWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.2, 18), this.rubberMat)
        outerWheel.rotation.z = Math.PI / 2
        outerWheel.position.set(trackX + side * 0.12, 0.46, wheelZ)
        this.hullGroup.add(outerWheel)
        this.roadWheels.push(outerWheel)

        // Inner Rubber Wheel Rim
        const innerWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.2, 18), this.rubberMat)
        innerWheel.rotation.z = Math.PI / 2
        innerWheel.position.set(trackX - side * 0.12, 0.46, wheelZ)
        this.hullGroup.add(innerWheel)
        this.roadWheels.push(innerWheel)

        // Center Steel Hub Cap
        const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.46, 12), this.steelMat)
        hubCap.rotation.z = Math.PI / 2
        hubCap.position.set(trackX, 0.46, wheelZ)
        this.hullGroup.add(hubCap)
      }

      // Front Idler Tension Wheel (Slightly elevated)
      const idler = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.42, 16), this.steelMat)
      idler.rotation.z = Math.PI / 2
      idler.position.set(trackX, 0.65, -3.0)
      this.hullGroup.add(idler)
      this.roadWheels.push(idler)

      // Rear Toothed Drive Sprocket Wheel
      const sprocket = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.44, 20), this.steelMat)
      sprocket.rotation.z = Math.PI / 2
      sprocket.position.set(trackX, 0.68, 3.0)
      this.hullGroup.add(sprocket)
      this.roadWheels.push(sprocket)

      // 3 Upper Track Return Rollers
      for (let r = 0; r < 3; r++) {
        const rollerZ = -1.2 + r * 1.2
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.38, 12), this.steelMat)
        roller.rotation.z = Math.PI / 2
        roller.position.set(trackX, 0.96, rollerZ)
        this.hullGroup.add(roller)
      }
    }

    // ==========================================
    // 3. ROTATABLE ARMORED MBT TURRET
    // ==========================================
    this.turretGroup.position.set(0, 1.62, -0.2)
    this.hullGroup.add(this.turretGroup)

    // Turret Bearing Ring (Diameter 2.9m)
    const turretRing = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.24, 24), this.steelMat)
    turretRing.position.set(0, 0.12, 0)
    this.turretGroup.add(turretRing)

    // Angular Turret Main Body (M1A2 / Leopard 2 Composite Geometry)
    const turretBody = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.92, 3.5), this.armorMat)
    turretBody.position.set(0, 0.62, 0.1)
    turretBody.castShadow = true
    this.turretGroup.add(turretBody)

    // Sloped Arrowhead Turret Cheek Armor Wedges (Leopard 2 / Abrams Arrowhead profile)
    for (const side of [-1, 1]) {
      // Main Cheek Wedge Armor
      const cheekGeom = new THREE.BoxGeometry(0.78, 0.85, 1.55)
      const cheek = new THREE.Mesh(cheekGeom, this.armorAccentMat)
      cheek.position.set(side * 1.05, 0.62, -1.25)
      cheek.rotation.y = side * 0.28
      cheek.castShadow = true
      this.turretGroup.add(cheek)

      // Additional Beveled Outer Armor Spacing
      const cheekSpaced = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 1.3), this.armorMat)
      cheekSpaced.position.set(side * 1.48, 0.62, -1.1)
      cheekSpaced.rotation.y = side * 0.18
      this.turretGroup.add(cheekSpaced)
    }

    // Gunner's Primary Sight (GPS) Armored Housing "Doghouse" (Right front turret roof)
    const gpsHouse = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.55), this.steelMat)
    gpsHouse.position.set(0.82, 1.25, -0.6)
    this.turretGroup.add(gpsHouse)

    // Glowing Anti-Reflective Optical Glass Sight Window
    const gpsLens = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.04), this.opticGlassMat)
    gpsLens.position.set(0.82, 1.26, -0.88)
    this.turretGroup.add(gpsLens)

    // Commander's Independent Thermal Viewer (CITV) Panoramic Optic (Left rear roof)
    const citvBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.42, 16), this.steelMat)
    citvBase.position.set(-0.85, 1.25, 0.35)
    this.turretGroup.add(citvBase)

    const citvHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), this.armorAccentMat)
    citvHead.position.set(-0.85, 1.52, 0.35)
    this.turretGroup.add(citvHead)

    const citvLens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), this.opticGlassMat)
    citvLens.rotation.x = Math.PI / 2
    citvLens.position.set(-0.85, 1.52, 0.16)
    this.turretGroup.add(citvLens)

    // Commander's Cupola with Faceted Vision Periscopes & Hatch
    const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 0.28, 16), this.steelMat)
    cupola.position.set(0.68, 1.15, 0.4)
    this.turretGroup.add(cupola)

    // Periscope Vision Prisms around Cupola Ring
    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2
      const prism = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), this.opticGlassMat)
      prism.position.set(0.68 + Math.cos(ang) * 0.48, 1.22, 0.4 + Math.sin(ang) * 0.48)
      prism.rotation.y = -ang + Math.PI / 2
      this.turretGroup.add(prism)
    }

    // Hinged Commander Hatch Lid
    const hatchLid = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.08, 16), this.armorAccentMat)
    hatchLid.position.set(0.68, 1.32, 0.4)
    this.turretGroup.add(hatchLid)

    // ==========================================
    // PINTLE-MOUNTED M2 BROWNING .50 CAL MACHINE GUN
    // ==========================================
    const gunPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.42, 8), this.steelMat)
    gunPedestal.position.set(0.68, 1.55, 0.1)
    this.turretGroup.add(gunPedestal)

    // .50 Cal Receiver & Top Cover
    const m2Receiver = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.55), this.steelMat)
    m2Receiver.position.set(0.68, 1.76, 0.1)
    this.turretGroup.add(m2Receiver)

    // Spade Grips & Trigger
    const m2Grips = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.06), this.steelMat)
    m2Grips.position.set(0.68, 1.76, 0.4)
    this.turretGroup.add(m2Grips)

    // Heavy Finned Barrel with Perforated Cooling Jacket
    const m2Barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.75, 10), this.steelMat)
    m2Barrel.rotation.x = Math.PI / 2
    m2Barrel.position.set(0.68, 1.76, -0.52)
    this.turretGroup.add(m2Barrel)

    // Slotted Flash Hider at M2 Tip
    const m2FlashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 8), this.steelMat)
    m2FlashHider.rotation.x = Math.PI / 2
    m2FlashHider.position.set(0.68, 1.76, -0.92)
    this.turretGroup.add(m2FlashHider)

    // Metal Ammo Canister Box (Green Army Box on Left Side)
    const m2AmmoBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.28), this.armorAccentMat)
    m2AmmoBox.position.set(0.85, 1.72, 0.12)
    this.turretGroup.add(m2AmmoBox)

    // Linked Cartridge Feed Chute (Brass)
    const m2Feed = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.12), this.brassMat)
    m2Feed.position.set(0.75, 1.76, 0.12)
    this.turretGroup.add(m2Feed)

    // Coaxial 7.62mm Machine Gun Barrel beside Main Gun Mantlet
    const coaxGun = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), this.steelMat)
    coaxGun.rotation.x = Math.PI / 2
    coaxGun.position.set(-0.55, 0.65, -1.75)
    this.turretGroup.add(coaxGun)

    // Smoke Grenade Dischargers (Banks of 4 Angled Tubes on Left & Right Cheeks)
    for (const side of [-1, 1]) {
      const bankBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.48), this.steelMat)
      bankBase.position.set(side * 1.5, 0.95, -0.5)
      bankBase.rotation.y = side * 0.4
      this.turretGroup.add(bankBase)

      for (let t = 0; t < 4; t++) {
        const tubeZ = -0.16 + t * 0.11
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.26, 8), this.steelMat)
        tube.rotation.x = -0.35
        tube.rotation.z = -side * 0.38
        tube.position.set(side * 1.52, 1.05, -0.5 + tubeZ)
        this.turretGroup.add(tube)
      }
    }

    // Rear Turret Bustle Stowage Basket (Open Tubular Cage Frame)
    const bustleFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.55, 1.2), this.steelMat)
    bustleFrame.position.set(0, 0.72, 2.1)
    this.turretGroup.add(bustleFrame)

    // Stowage Inside Bustle: Ammo Boxes & Rolled Camouflage Tarpaulin
    const rolledTarp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.1, 12), this.canvasMat)
    rolledTarp.rotation.z = Math.PI / 2
    rolledTarp.position.set(0, 0.98, 2.05)
    this.turretGroup.add(rolledTarp)

    const gearBox1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.38, 0.45), this.armorAccentMat)
    gearBox1.position.set(-0.65, 0.82, 2.3)
    this.turretGroup.add(gearBox1)

    const gearBox2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.4), this.armorMat)
    gearBox2.position.set(0.6, 0.82, 2.3)
    this.turretGroup.add(gearBox2)

    // Dual Flexible Tactical Radio Whip Antennas
    for (const sx of [-1.15, 1.15]) {
      // Antenna Spring Base
      const antSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.15, 8), this.steelMat)
      antSpring.position.set(sx, 1.16, 1.4)
      this.turretGroup.add(antSpring)

      // Slender Tapered Whip Antenna
      const antWhip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 2.6, 6), this.steelMat)
      antWhip.position.set(sx, 2.45, 1.4)
      antWhip.rotation.x = -0.09
      antWhip.rotation.z = sx * 0.04
      this.turretGroup.add(antWhip)
    }

    // Crosswind Meteorological Sensor Mast (Center Rear Turret Roof)
    const sensorMast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.85, 8), this.steelMat)
    sensorMast.position.set(0, 1.55, 1.2)
    this.turretGroup.add(sensorMast)

    const sensorHead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), this.steelMat)
    sensorHead.position.set(0, 1.98, 1.2)
    this.turretGroup.add(sensorHead)

    // ==========================================
    // 4. ELEVATING 120mm SMOOTHBORE TANK CANNON
    // ==========================================
    this.cannonGroup.position.set(0, 0.62, -1.55)
    this.turretGroup.add(this.cannonGroup)

    // Gun Mantlet Armored Shield with Protective Canvas Skirt
    const mantletShield = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.65), this.armorAccentMat)
    mantletShield.position.set(0, 0, -0.25)
    this.cannonGroup.add(mantletShield)

    const canvasCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.45, 16), this.canvasMat)
    canvasCollar.rotation.x = Math.PI / 2
    canvasCollar.position.set(0, 0, -0.55)
    this.cannonGroup.add(canvasCollar)

    // Heavy 120mm Smoothbore Barrel (Length 4.8m)
    const barrelLength = 4.8
    const barrelGeom = new THREE.CylinderGeometry(0.12, 0.15, barrelLength, 20)
    this.barrelMesh = new THREE.Mesh(barrelGeom, this.steelMat)
    this.barrelMesh.rotation.x = Math.PI / 2
    this.barrelMesh.position.set(0, 0, -barrelLength / 2 - 0.55)
    this.barrelMesh.castShadow = true
    this.cannonGroup.add(this.barrelMesh)

    // Thermal Sleeve Band Segments along Barrel
    for (const segZ of [-1.5, -2.4, -3.4]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.142, 0.08, 16), this.armorAccentMat)
      band.rotation.x = Math.PI / 2
      band.position.set(0, 0, segZ)
      this.cannonGroup.add(band)
    }

    // Bore Evacuator / Fume Extractor Cylinder (Characteristic MBT Feature)
    const evacuator = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.95, 20), this.armorMat)
    evacuator.rotation.x = Math.PI / 2
    evacuator.position.set(0, 0, -2.85)
    evacuator.castShadow = true
    this.cannonGroup.add(evacuator)

    // Evacuator Collar Retaining Rings
    for (const rz of [-2.4, -3.3]) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.06, 20), this.steelMat)
      ring.rotation.x = Math.PI / 2
      ring.position.set(0, 0, rz)
      this.cannonGroup.add(ring)
    }

    // Muzzle Reference Sensor Collimator at Barrel Tip
    const mrsCollimator = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.16), this.steelMat)
    mrsCollimator.position.set(0.16, 0.12, -barrelLength - 0.35)
    this.cannonGroup.add(mrsCollimator)

    // Slotted Tactical Muzzle Brake at Barrel Tip
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.48, 16), this.steelMat)
    brake.rotation.x = Math.PI / 2
    brake.position.set(0, 0, -barrelLength - 0.52)
    this.cannonGroup.add(brake)

    // High Energy 120mm Muzzle Flash
    const flashGeom = new THREE.OctahedronGeometry(0.55, 0)
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffbb00, transparent: true, opacity: 0.95 })
    this.muzzleFlash = new THREE.Mesh(flashGeom, flashMat)
    this.muzzleFlash.position.set(0, 0, -barrelLength - 0.9)
    this.muzzleFlash.visible = false
    this.cannonGroup.add(this.muzzleFlash)

    // Primary Hitbox on Tank Body
    mainHull.userData = {
      isTank: true,
      tankRef: this,
      entityName: 'Tempur Tank MBT',
      team: 'NEUTRAL',
      onHit: (damage: number) => this.takeDamage(damage)
    }
  }

  public update(
    dt: number,
    input: { fwd: number; rgt: number; shoot: boolean; aim: boolean; dx: number; dy: number },
    _collidableMeshes: THREE.Object3D[],
    allTargets: THREE.Object3D[]
  ) {
    if (this.isDestroyed) return

    // 1. Reload Timer
    if (this.reloadTimer > 0) {
      this.reloadTimer = Math.max(0, this.reloadTimer - dt)
      useGameStore.getState().setTankCannonReady(this.reloadTimer <= 0, this.reloadTimer)
    }

    // 2. Smooth Recoil Recovery
    this.recoilZ = THREE.MathUtils.lerp(this.recoilZ, 0, dt * 8)
    this.barrelMesh.position.z = -2.5 - this.recoilZ

    // 3. Driver Controls (when player is inside)
    if (this.isOccupied) {
      // Acceleration & Braking
      if (input.fwd > 0.1) {
        this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * dt)
      } else if (input.fwd < -0.1) {
        this.speed = Math.max(this.reverseSpeed, this.speed - this.acceleration * dt)
      } else {
        // Natural friction deceleration
        this.speed = THREE.MathUtils.lerp(this.speed, 0, dt * 3.5)
      }

      // Steering / Turning Hull (A/D)
      if (Math.abs(input.rgt) > 0.1) {
        // Pivot turn or turning while rolling
        const turnDir = -input.rgt
        this.hullYaw += turnDir * this.turnSpeed * dt
      }

      // Turret & Cannon Aiming via Mouse Look
      this.turretYaw -= input.dx * 1.1
      this.cannonPitch -= input.dy * 0.9
      this.cannonPitch = Math.max(-0.15, Math.min(0.4, this.cannonPitch)) // -8 deg to +22 deg

      // Apply rotations
      this.hullGroup.rotation.y = this.hullYaw
      this.turretGroup.rotation.y = this.turretYaw - this.hullYaw
      this.cannonGroup.rotation.x = this.cannonPitch

      // Cannon Firing (Left click / shoot button)
      if (input.shoot && this.reloadTimer <= 0) {
        this.fireCannon(allTargets)
      }

      // Track Wheels Animation
      this.tracksAnimationTimer += this.speed * dt * 4
      this.roadWheels.forEach((wheel) => {
        wheel.rotation.x = this.tracksAnimationTimer
      })
    } else {
      // Unoccupied: bring to gentle halt
      this.speed = THREE.MathUtils.lerp(this.speed, 0, dt * 5)
    }

    // 4. Movement & Collision
    if (Math.abs(this.speed) > 0.05) {
      // Compute forward displacement along hull heading
      const forwardVec = new THREE.Vector3(-Math.sin(this.hullYaw), 0, -Math.cos(this.hullYaw))
      const displacement = forwardVec.multiplyScalar(this.speed * dt)

      const nextPos = this.position.clone().add(displacement)

      // Clamp within map bounds (expanded 240m arena)
      nextPos.x = Math.max(-114, Math.min(114, nextPos.x))
      nextPos.z = Math.max(-114, Math.min(114, nextPos.z))

      this.position.copy(nextPos)
      this.mesh.position.copy(this.position)

      // Sound: Periodic diesel tank rumble when moving
      if (this.isOccupied && Math.random() < 0.08) {
        audioManager.playTankEngineSound()
      }
    }
  }

  public fireCannon(allTargets: THREE.Object3D[]) {
    if (this.reloadTimer > 0) return

    this.reloadTimer = this.reloadDuration
    this.recoilZ = 0.35 // Recoil kickback on 120mm barrel

    // Flash
    this.muzzleFlash.visible = true
    this.muzzleFlash.rotation.z = Math.random() * Math.PI
    setTimeout(() => {
      this.muzzleFlash.visible = false
    }, 80)

    // Compute exact muzzle position in World space
    const muzzleWorldPos = new THREE.Vector3()
    this.muzzleFlash.getWorldPosition(muzzleWorldPos)

    // Compute firing direction based on cannon orientation
    const shootDir = new THREE.Vector3(0, 0, -1)
    const cannonWorldQuat = new THREE.Quaternion()
    this.cannonGroup.getWorldQuaternion(cannonWorldQuat)
    shootDir.applyQuaternion(cannonWorldQuat).normalize()

    // Fire explosive tank shell
    this.bulletManager.fireTankShell(muzzleWorldPos, shootDir, allTargets)

    // Crosshair flash / ammo store trigger
    useGameStore.getState().triggerHitmarker(false)
  }

  public takeDamage(rawDamage: number) {
    if (this.isDestroyed) return

    // Heavy tank armor absorbs 75% of small-arms damage!
    const effectiveDamage = Math.max(3, Math.round(rawDamage * 0.25))
    this.health = Math.max(0, this.health - effectiveDamage)

    useGameStore.getState().damageTank(effectiveDamage)
    audioManager.playHitmarker(false)

    if (this.health <= 0) {
      this.destroyTank()
    }
  }

  private destroyTank() {
    this.isDestroyed = true
    this.health = 0

    // Detonate tank
    this.bulletManager.createExplosion(this.position, 250, 10, [], true)

    // Charred hull material
    const burntMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
    this.hullGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        ;(child as THREE.Mesh).material = burntMat
      }
    })

    if (this.isOccupied && this.driver) {
      this.ejectDriver()
    }
  }

  public boardTank(player: Player) {
    if (this.isOccupied || this.isDestroyed) return
    this.isOccupied = true
    this.driver = player

    audioManager.playHatchSound()
    audioManager.playTankEngineSound()

    useGameStore.getState().enterTank()
    useGameStore.getState().triggerAmmoNotice('🛡️ ANDA MENGEMUDIKAN TANK TEMPUR! Tekan [E] untuk keluar.')
  }

  public ejectDriver() {
    if (!this.isOccupied) return
    this.isOccupied = false

    // Place driver on foot safely next to left track
    if (this.driver) {
      const exitOffset = new THREE.Vector3(-2.8, 0.5, 0)
      exitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.hullYaw)
      this.driver.position.copy(this.position).add(exitOffset)
      this.driver.position.y = 1.5
    }

    this.driver = null
    audioManager.playHatchSound()
    useGameStore.getState().exitTank()
    useGameStore.getState().triggerAmmoNotice('🚶 KELUAR DARI TANK TEMPUR.')
  }

  public getCameraPosition(): { pos: THREE.Vector3; lookAt: THREE.Vector3 } {
    // 3rd Person Tactical Tank Chase Camera (positioned comfortably behind & above turret)
    const camOffset = new THREE.Vector3(0, 3.8, 8.2)
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.turretYaw)

    const camPos = this.position.clone().add(new THREE.Vector3(0, 1.8, 0)).add(camOffset)

    // Look at point 22m ahead in direction of turret/cannon aim
    const aimDir = new THREE.Vector3(0, 0, -1)
    aimDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.turretYaw)
    const lookAtPos = this.position.clone().add(new THREE.Vector3(0, 2.0, 0)).add(aimDir.multiplyScalar(22))

    return { pos: camPos, lookAt: lookAtPos }
  }

  public respawn(pos: THREE.Vector3, yaw = 0) {
    this.position.copy(pos)
    this.hullYaw = yaw
    this.turretYaw = yaw
    this.cannonPitch = 0
    this.speed = 0
    this.health = this.maxHealth
    this.isDestroyed = false
    this.isOccupied = false
    this.driver = null
    this.reloadTimer = 0

    this.mesh.position.copy(this.position)
    this.hullGroup.rotation.y = this.hullYaw
    this.turretGroup.rotation.y = 0
    this.cannonGroup.rotation.x = 0
  }
}
