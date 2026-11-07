import * as THREE from 'three'
import type { WeaponId } from '../../types/game.types'

export class WeaponModelGenerator {
  // Shared materials for optimal performance
  private static steelMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.45,
    metalness: 0.75,
    flatShading: true
  })

  private static woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.7,
    metalness: 0.1,
    flatShading: true
  })

  private static darkPolymerMat = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    roughness: 0.6,
    metalness: 0.3,
    flatShading: true
  })

  private static sniperOliveMat = new THREE.MeshStandardMaterial({
    color: 0x3d4a36,
    roughness: 0.5,
    metalness: 0.4,
    flatShading: true
  })

  private static chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde3,
    roughness: 0.2,
    metalness: 0.9,
    flatShading: true
  })

  private static gloveMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Tactical dark slate nylon
    roughness: 0.65,
    metalness: 0.2
  })

  private static knuckleMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Carbon fiber / molded knuckle armor
    roughness: 0.3,
    metalness: 0.5
  })

  private static sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Combat uniform sleeve
    roughness: 0.85,
    metalness: 0.1
  })

  private static strapMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Tactical CT team accent trim
    roughness: 0.5,
    metalness: 0.3
  })

  private static muzzleFlashMat = new THREE.MeshBasicMaterial({
    color: 0xffdd44,
    transparent: true,
    opacity: 0.9
  })

  public static createWeapon(id: WeaponId): { root: THREE.Group; muzzlePos: THREE.Vector3; flash: THREE.Mesh } {
    const root = new THREE.Group()
    root.name = `weapon_${id}`

    let muzzlePos = new THREE.Vector3(0, 0, -0.6)

    switch (id) {
      case 'ak47':
        muzzlePos = this.buildAK47(root)
        break
      case 'm4a1':
        muzzlePos = this.buildM4A1(root)
        break
      case 'awp':
        muzzlePos = this.buildAWP(root)
        break
      case 'ssg08':
        muzzlePos = this.buildSSG08(root)
        break
      case 'deagle':
        muzzlePos = this.buildDeagle(root)
        break
      case 'knife':
        muzzlePos = this.buildKnife(root)
        break
      case 'minigun':
        muzzlePos = this.buildMinigun(root)
        break
      case 'bazooka':
        muzzlePos = this.buildBazooka(root)
        break
    }

    // Add Muzzle Flash
    const flashGeom = new THREE.OctahedronGeometry(0.08, 0)
    const flash = new THREE.Mesh(flashGeom, this.muzzleFlashMat)
    flash.position.copy(muzzlePos)
    flash.visible = false
    root.add(flash)

    // Add Player CT Hand
    this.addPlayerHands(root, id)

    return { root, muzzlePos, flash }
  }

  private static buildAK47(root: THREE.Group): THREE.Vector3 {
    // Receiver (metal)
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.45), this.steelMat)
    receiver.position.set(0, 0, 0)
    root.add(receiver)

    // Wooden Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.35), this.woodMat)
    stock.position.set(0, -0.03, 0.35)
    stock.rotation.x = -0.08
    root.add(stock)

    // Wooden Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.3), this.woodMat)
    handguard.position.set(0, 0.01, -0.32)
    root.add(handguard)

    // Steel Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.45, 8), this.steelMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.035, -0.48)
    root.add(barrel)

    // Gas tube above barrel
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), this.steelMat)
    gasTube.rotation.x = Math.PI / 2
    gasTube.position.set(0, 0.06, -0.35)
    root.add(gasTube)

    // Front Sight
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.045, 0.02), this.steelMat)
    frontSight.position.set(0, 0.07, -0.65)
    root.add(frontSight)

    // Curved Banana Magazine (wood/orange-brown)
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.1), this.woodMat)
    mag.position.set(0, -0.13, -0.08)
    mag.rotation.x = 0.35
    root.add(mag)

    // Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), this.woodMat)
    grip.position.set(0, -0.1, 0.12)
    grip.rotation.x = -0.3
    root.add(grip)

    return new THREE.Vector3(0, 0.035, -0.72)
  }

  private static buildM4A1(root: THREE.Group): THREE.Vector3 {
    // Upper & Lower Receiver (dark polymer)
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.095, 0.4), this.darkPolymerMat)
    root.add(receiver)

    // Tactical Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.32), this.darkPolymerMat)
    stock.position.set(0, -0.02, 0.32)
    root.add(stock)

    // Ribbed Quad Rail Handguard
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.075, 0.28), this.steelMat)
    rail.position.set(0, 0.01, -0.3)
    root.add(rail)

    // Barrel + Suppressor/Compensator
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), this.steelMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.02, -0.45)
    root.add(barrel)

    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 8), this.darkPolymerMat)
    muzzleBrake.rotation.x = Math.PI / 2
    muzzleBrake.position.set(0, 0.02, -0.65)
    root.add(muzzleBrake)

    // Carry Handle / Top Rail Sight
    const carryHandle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.22), this.darkPolymerMat)
    carryHandle.position.set(0, 0.07, -0.05)
    root.add(carryHandle)

    // Straight STANAG Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.08), this.steelMat)
    mag.position.set(0, -0.12, -0.08)
    mag.rotation.x = 0.15
    root.add(mag)

    // Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.055), this.darkPolymerMat)
    grip.position.set(0, -0.09, 0.12)
    grip.rotation.x = -0.28
    root.add(grip)

    return new THREE.Vector3(0, 0.02, -0.72)
  }

  private static buildAWP(root: THREE.Group): THREE.Vector3 {
    // Heavy Olive Green Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.65), this.sniperOliveMat)
    chassis.position.set(0, 0, 0.05)
    root.add(chassis)

    // Thumbhole Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.13, 0.38), this.sniperOliveMat)
    stock.position.set(0, -0.01, 0.45)
    root.add(stock)

    // Long Free-Floating Steel Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 8), this.steelMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.035, -0.55)
    root.add(barrel)

    // Massive Rectangular Muzzle Brake
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.12), this.steelMat)
    brake.position.set(0, 0.035, -0.88)
    root.add(brake)

    // High Powered Optical Scope
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.36, 12), this.darkPolymerMat)
    scopeTube.rotation.x = Math.PI / 2
    scopeTube.position.set(0, 0.11, -0.05)
    root.add(scopeTube)

    const scopeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.024, 0.08, 12), this.darkPolymerMat)
    scopeLens.rotation.x = Math.PI / 2
    scopeLens.position.set(0, 0.11, -0.24)
    root.add(scopeLens)

    // Scope Mount Rings
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.22), this.steelMat)
    mount.position.set(0, 0.07, -0.05)
    root.add(mount)

    // Bolt Handle (sticking out on the right side)
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.025), this.steelMat)
    bolt.position.set(0.05, 0.05, 0.1)
    root.add(bolt)

    // Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.12), this.darkPolymerMat)
    mag.position.set(0, -0.09, -0.08)
    root.add(mag)

    return new THREE.Vector3(0, 0.035, -0.96)
  }

  private static buildSSG08(root: THREE.Group): THREE.Vector3 {
    // Lightweight Matte Black Tactical Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.58), this.darkPolymerMat)
    chassis.position.set(0, 0, 0.05)
    root.add(chassis)

    // Skeletal Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.32), this.darkPolymerMat)
    stock.position.set(0, -0.01, 0.42)
    root.add(stock)

    // Fluted Chrome/Steel Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.58, 8), this.steelMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.03, -0.48)
    root.add(barrel)

    // Compact Muzzle Brake
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.08), this.steelMat)
    brake.position.set(0, 0.03, -0.8)
    root.add(brake)

    // Tactical Scout Scope
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.32, 12), this.darkPolymerMat)
    scopeTube.rotation.x = Math.PI / 2
    scopeTube.position.set(0, 0.095, -0.06)
    root.add(scopeTube)

    const scopeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.07, 12), this.steelMat)
    scopeLens.rotation.x = Math.PI / 2
    scopeLens.position.set(0, 0.095, -0.23)
    root.add(scopeLens)

    // Scope Mount Rings
    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.045, 0.2), this.steelMat)
    mount.position.set(0, 0.06, -0.06)
    root.add(mount)

    // Compact 10-round Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.09), this.steelMat)
    mag.position.set(0, -0.08, -0.06)
    root.add(mag)

    return new THREE.Vector3(0, 0.03, -0.86)
  }

  private static buildDeagle(root: THREE.Group): THREE.Vector3 {
    // Massive Chrome Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.32), this.chromeMat)
    slide.position.set(0, 0.03, -0.05)
    root.add(slide)

    // Barrel opening
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.08, 8), this.steelMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.04, -0.22)
    root.add(barrel)

    // Front & Rear Sights
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.015), this.steelMat)
    frontSight.position.set(0, 0.075, -0.19)
    root.add(frontSight)

    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.02), this.steelMat)
    rearSight.position.set(0, 0.075, 0.09)
    root.add(rearSight)

    // Black Ergonomic Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.08), this.darkPolymerMat)
    grip.position.set(0, -0.07, 0.02)
    grip.rotation.x = -0.22
    root.add(grip)

    return new THREE.Vector3(0, 0.04, -0.28)
  }

  private static buildKnife(root: THREE.Group): THREE.Vector3 {
    // Handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.18), this.darkPolymerMat)
    handle.position.set(0, 0, 0.08)
    root.add(handle)

    // Crossguard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.065, 0.02), this.steelMat)
    guard.position.set(0, 0, -0.02)
    root.add(guard)

    // Drop-Point Combat Blade
    const bladeGeom = new THREE.BoxGeometry(0.012, 0.055, 0.22)
    const blade = new THREE.Mesh(bladeGeom, this.chromeMat)
    blade.position.set(0, 0.01, -0.13)
    blade.rotation.x = 0.05
    root.add(blade)

    return new THREE.Vector3(0, 0, -0.25)
  }

  private static buildMinigun(root: THREE.Group): THREE.Vector3 {
    // 1. Central Motor Housing & Drive Motor (dark polymer / heavy metal)
    const motorGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.32, 16)
    const motor = new THREE.Mesh(motorGeom, this.darkPolymerMat)
    motor.rotation.x = Math.PI / 2
    motor.position.set(0, 0, 0.12)
    root.add(motor)

    // Drive Motor battery / capacitor pack on side
    const drivePack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.22), this.steelMat)
    drivePack.position.set(-0.11, -0.02, 0.12)
    root.add(drivePack)

    // Top Heavy Carrying Handle & Recoil Spades
    const handleTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.28), this.steelMat)
    handleTop.position.set(0, 0.14, 0.10)
    root.add(handleTop)

    const handlePostF = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.035), this.steelMat)
    handlePostF.position.set(0, 0.09, -0.02)
    root.add(handlePostF)

    const handlePostR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.035), this.steelMat)
    handlePostR.position.set(0, 0.09, 0.22)
    root.add(handlePostR)

    // Ammo feeder guide & metallic belt link chute
    const feeder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.12), this.chromeMat)
    feeder.position.set(0.10, -0.01, 0.06)
    root.add(feeder)

    // 2. Rotary 6-Barrel Assembly (Group that spins when shooting)
    const barrelAssembly = new THREE.Group()
    barrelAssembly.name = 'minigun_barrels'
    barrelAssembly.position.set(0, 0, -0.04)
    root.add(barrelAssembly)

    // Front & Center rotor disks
    const diskGeom = new THREE.CylinderGeometry(0.075, 0.075, 0.025, 16)
    const diskR = new THREE.Mesh(diskGeom, this.steelMat)
    diskR.rotation.x = Math.PI / 2
    diskR.position.set(0, 0, 0)
    barrelAssembly.add(diskR)

    const diskM = new THREE.Mesh(diskGeom, this.steelMat)
    diskM.rotation.x = Math.PI / 2
    diskM.position.set(0, 0, -0.28)
    barrelAssembly.add(diskM)

    const diskF = new THREE.Mesh(diskGeom, this.steelMat)
    diskF.rotation.x = Math.PI / 2
    diskF.position.set(0, 0, -0.52)
    barrelAssembly.add(diskF)

    // 6 Rotary Barrels arranged symmetrically in circle
    const barrelRadius = 0.045
    const barrelLength = 0.58
    const barrelGeom = new THREE.CylinderGeometry(0.012, 0.012, barrelLength, 8)

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6
      const bx = Math.cos(angle) * barrelRadius
      const by = Math.sin(angle) * barrelRadius
      const barrel = new THREE.Mesh(barrelGeom, this.steelMat)
      barrel.rotation.x = Math.PI / 2
      barrel.position.set(bx, by, -barrelLength / 2)
      barrelAssembly.add(barrel)

      // Muzzle flash suppressors at tip of each barrel
      const tipGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.035, 8)
      const tip = new THREE.Mesh(tipGeom, this.darkPolymerMat)
      tip.rotation.x = Math.PI / 2
      tip.position.set(bx, by, -barrelLength - 0.01)
      barrelAssembly.add(tip)
    }

    return new THREE.Vector3(0, 0, -0.66)
  }

  private static buildBazooka(root: THREE.Group): THREE.Vector3 {
    // 1. Main Launch Tube (OD Olive green)
    const tubeGeom = new THREE.CylinderGeometry(0.046, 0.046, 0.88, 16)
    const tube = new THREE.Mesh(tubeGeom, this.sniperOliveMat)
    tube.rotation.x = Math.PI / 2
    tube.position.set(0, 0, -0.06)
    root.add(tube)

    // 2. Rear Venturi Exhaust Cone (Backblast Nozzle)
    const venturiGeom = new THREE.CylinderGeometry(0.07, 0.046, 0.16, 16)
    const venturi = new THREE.Mesh(venturiGeom, this.steelMat)
    venturi.rotation.x = Math.PI / 2
    venturi.position.set(0, 0, 0.44)
    root.add(venturi)

    // 3. Middle Wooden Heat Shield (Ergonomic shoulder rest & grip)
    const shieldGeom = new THREE.CylinderGeometry(0.054, 0.054, 0.32, 16)
    const shield = new THREE.Mesh(shieldGeom, this.woodMat)
    shield.rotation.x = Math.PI / 2
    shield.position.set(0, 0, 0.12)
    root.add(shield)

    // 4. Front Pistol Grip & Trigger
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.045), this.darkPolymerMat)
    grip.position.set(0, -0.10, -0.14)
    grip.rotation.x = -0.15
    root.add(grip)

    // Trigger guard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.06), this.steelMat)
    guard.position.set(0, -0.06, -0.11)
    root.add(guard)

    // Rear Support Handle
    const rearHandle = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 0.038), this.darkPolymerMat)
    rearHandle.position.set(0, -0.09, 0.04)
    root.add(rearHandle)

    // 5. Optical Rangefinder Scope on Left Bracket (PGO-7 Sight)
    const sightBracket = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.025, 0.08), this.steelMat)
    sightBracket.position.set(-0.06, 0.04, -0.12)
    root.add(sightBracket)

    const scopeBody = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.055, 0.14), this.steelMat)
    scopeBody.position.set(-0.08, 0.07, -0.12)
    root.add(scopeBody)

    const eyePiece = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 12), this.darkPolymerMat)
    eyePiece.rotation.x = Math.PI / 2
    eyePiece.position.set(-0.08, 0.07, -0.04)
    root.add(eyePiece)

    // 6. Loaded PG-7V Rocket Warhead (Protruding from front tube)
    const warheadGroup = new THREE.Group()
    warheadGroup.name = 'bazooka_warhead'
    warheadGroup.position.set(0, 0, -0.50)
    root.add(warheadGroup)

    // Warhead Body Cone (Olive)
    const coneGeom = new THREE.ConeGeometry(0.068, 0.16, 16)
    const cone = new THREE.Mesh(coneGeom, this.sniperOliveMat)
    cone.rotation.x = -Math.PI / 2
    cone.position.set(0, 0, -0.08)
    warheadGroup.add(cone)

    // Pointed Nose Fuze (Chrome tip)
    const fuzeGeom = new THREE.ConeGeometry(0.02, 0.08, 12)
    const fuze = new THREE.Mesh(fuzeGeom, this.chromeMat)
    fuze.rotation.x = -Math.PI / 2
    fuze.position.set(0, 0, -0.19)
    warheadGroup.add(fuze)

    // Rocket stem collar
    const collarGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.10, 12)
    const collar = new THREE.Mesh(collarGeom, this.steelMat)
    collar.rotation.x = Math.PI / 2
    collar.position.set(0, 0, 0.02)
    warheadGroup.add(collar)

    return new THREE.Vector3(0, 0, -0.72)
  }

  // Helper to build a detailed tactical operator arm & glove
  private static createArmSegment(isRight: boolean): THREE.Group {
    const arm = new THREE.Group()

    // 1. Forearm Sleeve (Anatomical taper)
    const sleeveGeom = new THREE.CylinderGeometry(0.048, 0.056, 0.28, 12)
    const sleeve = new THREE.Mesh(sleeveGeom, this.sleeveMat)
    sleeve.rotation.x = Math.PI / 2
    sleeve.position.set(0, 0, 0.14)
    arm.add(sleeve)

    // 2. Sleeve Cuff Trim
    const cuffGeom = new THREE.CylinderGeometry(0.052, 0.052, 0.03, 12)
    const cuff = new THREE.Mesh(cuffGeom, this.gloveMat)
    cuff.rotation.x = Math.PI / 2
    cuff.position.set(0, 0, 0.02)
    arm.add(cuff)

    // 3. Tactical Glove Wrist Cinch Strap
    const strapGeom = new THREE.BoxGeometry(0.088, 0.018, 0.038)
    const strap = new THREE.Mesh(strapGeom, this.strapMat)
    strap.position.set(0, 0.042, 0.02)
    arm.add(strap)

    // 4. Palm / Hand Main Body
    const handGeom = new THREE.BoxGeometry(0.08, 0.06, 0.11)
    const hand = new THREE.Mesh(handGeom, this.gloveMat)
    hand.position.set(0, 0, -0.05)
    arm.add(hand)

    // 5. Molded Carbon-Fiber Knuckle Armor Plate
    const knuckleGeom = new THREE.BoxGeometry(0.075, 0.022, 0.042)
    const knuckle = new THREE.Mesh(knuckleGeom, this.knuckleMat)
    knuckle.position.set(0, 0.03, -0.06)
    arm.add(knuckle)

    // 6. Fingers gripping weapon
    const fingerGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8)
    for (let f = -1; f <= 1; f++) {
      const finger = new THREE.Mesh(fingerGeom, this.gloveMat)
      finger.rotation.z = Math.PI / 2
      finger.position.set(isRight ? -0.035 : 0.035, -0.015, -0.08 + f * 0.022)
      arm.add(finger)
    }

    return arm
  }

  private static addPlayerHands(root: THREE.Group, id: WeaponId) {
    if (id === 'knife') {
      const rightArm = this.createArmSegment(true)
      rightArm.position.set(0.08, -0.07, 0.20)
      rightArm.rotation.set(-0.25, 0.1, 0)
      root.add(rightArm)
      return
    }

    if (id === 'deagle') {
      const rightArm = this.createArmSegment(true)
      rightArm.position.set(0.05, -0.12, 0.22)
      rightArm.rotation.set(-0.22, -0.08, 0)
      root.add(rightArm)

      const leftArm = this.createArmSegment(false)
      leftArm.position.set(-0.05, -0.12, 0.22)
      leftArm.rotation.set(-0.22, 0.12, 0)
      root.add(leftArm)
      return
    }

    if (id === 'minigun') {
      const rightArm = this.createArmSegment(true)
      rightArm.position.set(0.04, 0.08, 0.20)
      rightArm.rotation.set(-0.35, -0.1, 0)
      root.add(rightArm)

      const leftArm = this.createArmSegment(false)
      leftArm.position.set(-0.11, -0.01, 0.08)
      leftArm.rotation.set(-0.15, 0.35, -0.1)
      root.add(leftArm)
      return
    }

    if (id === 'bazooka') {
      const rightArm = this.createArmSegment(true)
      rightArm.position.set(0.04, -0.11, -0.12)
      rightArm.rotation.set(-0.18, -0.05, 0)
      root.add(rightArm)

      const leftArm = this.createArmSegment(false)
      leftArm.position.set(-0.05, -0.09, 0.06)
      leftArm.rotation.set(-0.12, 0.28, -0.08)
      root.add(leftArm)
      return
    }

    // Rifles / Snipers (AK-47, M4A1, AWP, SSG-08)
    // Right hand on trigger grip
    const rightArm = this.createArmSegment(true)
    rightArm.position.set(0.08, -0.10, 0.26)
    rightArm.rotation.set(-0.18, -0.05, 0)
    root.add(rightArm)

    // Left hand supporting front handguard
    const leftArm = this.createArmSegment(false)
    leftArm.position.set(-0.09, -0.09, -0.12)
    leftArm.rotation.set(-0.12, 0.32, -0.1)
    root.add(leftArm)
  }
}
