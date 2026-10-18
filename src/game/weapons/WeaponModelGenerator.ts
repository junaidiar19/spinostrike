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

  private static handMat = new THREE.MeshStandardMaterial({
    color: 0x243242, // CT tactical glove dark blue
    roughness: 0.7,
    metalness: 0.2,
    flatShading: true
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

  private static addPlayerHands(root: THREE.Group, id: WeaponId) {
    if (id === 'knife') {
      // Right hand holding knife
      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.35), this.handMat)
      rightArm.position.set(0.08, -0.08, 0.18)
      rightArm.rotation.x = -0.3
      root.add(rightArm)
      return
    }

    if (id === 'deagle') {
      // Two hands holding pistol
      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.35), this.handMat)
      rightArm.position.set(0.06, -0.14, 0.18)
      rightArm.rotation.x = -0.3
      root.add(rightArm)

      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.35), this.handMat)
      leftArm.position.set(-0.06, -0.14, 0.18)
      leftArm.rotation.x = -0.3
      root.add(leftArm)
      return
    }

    // Rifle / Sniper (AK-47, M4A1, AWP)
    // Right hand on trigger grip
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.38), this.handMat)
    rightArm.position.set(0.08, -0.12, 0.25)
    rightArm.rotation.x = -0.2
    root.add(rightArm)

    // Left hand supporting front handguard
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.35), this.handMat)
    leftArm.position.set(-0.09, -0.12, -0.18)
    leftArm.rotation.set(-0.15, 0.3, 0)
    root.add(leftArm)
  }
}
