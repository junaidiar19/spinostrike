import * as THREE from 'three'
import type { Team } from '../../types/game.types'

export interface OperatorLimbs {
  headGroup: THREE.Group
  torsoGroup: THREE.Group
  leftArmGroup: THREE.Group
  rightArmGroup: THREE.Group
  leftLegGroup: THREE.Group
  rightLegGroup: THREE.Group
  gunGroup: THREE.Group
  muzzleFlash: THREE.Mesh
}

export interface OperatorModelResult {
  root: THREE.Group
  hitboxes: THREE.Object3D[]
  limbs: OperatorLimbs
}

export class OperatorModelGenerator {
  // Team CT (Counter-Terrorist / Rekan) Materials - High-vis Blue & Cyan SWAT
  private static ctUniformMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // High-contrast Royal SWAT Blue
    roughness: 0.75,
    metalness: 0.15,
    flatShading: true
  })

  private static ctVestMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Dark Navy Kevlar plate carrier
    roughness: 0.7,
    metalness: 0.2,
    flatShading: true
  })

  private static ctHelmetMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Deep Navy SWAT Ballistic Helmet
    roughness: 0.5,
    metalness: 0.35,
    flatShading: true
  })

  private static ctVisorMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8, // Vibrant Cyan Polarized Goggles
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1.0,
    flatShading: true
  })

  // Team T (Terrorist / Musuh) Materials - Desert Tan & Crimson Red Rebel
  private static tUniformMat = new THREE.MeshStandardMaterial({
    color: 0x92400e, // Desert Khaki Tan Camouflage
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true
  })

  private static tVestMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Crimson Red Rebel Plate Carrier
    roughness: 0.75,
    metalness: 0.15,
    flatShading: true
  })

  private static tHelmetMat = new THREE.MeshStandardMaterial({
    color: 0x451a03, // Desert Brown Camo Helmet
    roughness: 0.6,
    metalness: 0.2,
    flatShading: true
  })

  private static tVisorMat = new THREE.MeshPhysicalMaterial({
    color: 0xf97316, // Amber-Orange Polarized Goggles
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1.0,
    flatShading: true
  })

  private static tBalaclavaMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d, // Red Rebel Bandana / Balaclava
    roughness: 0.9,
    flatShading: true
  })

  private static skinMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373,
    roughness: 0.6,
    metalness: 0.05,
    flatShading: true
  })

  private static balaclavaMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Tactical Black Balaclava
    roughness: 0.9,
    flatShading: true
  })

  private static gearDarkMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0c, // Matte nylon pouches, straps, boots
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true
  })

  private static metalHardwareMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // NVG mounts, buckles, carabiners
    roughness: 0.3,
    metalness: 0.85,
    flatShading: true
  })

  public static buildOperator(
    team: Team,
    entityName: string,
    onHitCallback?: (damage: number, isHeadshot: boolean) => void,
    remoteEntityId?: string
  ): OperatorModelResult {
    const root = new THREE.Group()
    const hitboxes: THREE.Object3D[] = []

    const uniformMat = team === 'CT' ? this.ctUniformMat : this.tUniformMat
    const vestMat = team === 'CT' ? this.ctVestMat : this.tVestMat
    const helmetMat = team === 'CT' ? this.ctHelmetMat : this.tHelmetMat
    const visorMat = team === 'CT' ? this.ctVisorMat : this.tVisorMat
    const balaclavaMat = team === 'CT' ? this.balaclavaMat : this.tBalaclavaMat

    const attachHitbox = (
      mesh: THREE.Object3D,
      type: 'head' | 'body' | 'leg'
    ) => {
      mesh.userData = {
        hitboxType: type,
        entityName,
        entityId: remoteEntityId,
        team,
        onHit: onHitCallback
      }
      hitboxes.push(mesh)
    }

    // ==========================================
    // 1. HEAD & TACTICAL HELMET SYSTEM
    // ==========================================
    const headGroup = new THREE.Group()
    headGroup.position.set(0, 1.55, 0)
    root.add(headGroup)

    // Balaclava Head Base
    const headGeom = new THREE.BoxGeometry(0.24, 0.28, 0.25)
    const headMesh = new THREE.Mesh(headGeom, balaclavaMat)
    headMesh.position.set(0, 0, 0)
    headMesh.castShadow = true
    headGroup.add(headMesh)
    attachHitbox(headMesh, 'head')

    // Exposed Eye Area (Skin)
    const eyeArea = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.02), this.skinMat)
    eyeArea.position.set(0, 0.02, 0.13)
    headGroup.add(eyeArea)

    // Tactical Polarized Ballistic Goggles
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.06), visorMat)
    goggles.position.set(0, 0.02, 0.14)
    headGroup.add(goggles)
    attachHitbox(goggles, 'head')

    // High-Cut Ballistic Helmet
    const helmetGeom = new THREE.BoxGeometry(0.28, 0.16, 0.28)
    const helmet = new THREE.Mesh(helmetGeom, helmetMat)
    helmet.position.set(0, 0.12, -0.01)
    helmet.castShadow = true
    headGroup.add(helmet)
    attachHitbox(helmet, 'head')

    // Team Helmet Band (High Visibility Identification)
    const helmetBandMat = new THREE.MeshStandardMaterial({
      color: team === 'CT' ? 0x38bdf8 : 0xef4444,
      emissive: team === 'CT' ? 0x0369a1 : 0x991b1b,
      emissiveIntensity: 0.5,
      roughness: 0.4
    })
    const helmetBand = new THREE.Mesh(new THREE.BoxGeometry(0.285, 0.04, 0.285), helmetBandMat)
    helmetBand.position.set(0, 0.08, -0.01)
    headGroup.add(helmetBand)

    // Night Vision Device (NVG) Shroud Mount on Helmet Front
    const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), this.metalHardwareMat)
    nvgMount.position.set(0, 0.14, 0.14)
    headGroup.add(nvgMount)

    // Tactical Headset Ear Cups (Left & Right)
    const earLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.07), this.gearDarkMat)
    earLeft.position.set(-0.14, 0.01, 0)
    headGroup.add(earLeft)

    const earRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.07), this.gearDarkMat)
    earRight.position.set(0.14, 0.01, 0)
    headGroup.add(earRight)

    // Headset Boom Microphone
    const mic = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), this.gearDarkMat)
    mic.position.set(-0.1, -0.06, 0.09)
    headGroup.add(mic)

    // ==========================================
    // 2. TORSO & TACTICAL PLATE CARRIER VEST
    // ==========================================
    const torsoGroup = new THREE.Group()
    torsoGroup.position.set(0, 1.05, 0)
    root.add(torsoGroup)

    // Combat Shirt Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.62, 0.26), uniformMat)
    torso.castShadow = true
    torsoGroup.add(torso)
    attachHitbox(torso, 'body')

    // Tactical Plate Carrier (Front & Back Armor Plates)
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.32), vestMat)
    vest.position.set(0, 0.04, 0)
    vest.castShadow = true
    torsoGroup.add(vest)
    attachHitbox(vest, 'body')

    // 3x Ammo Mag Pouches on Front of Vest
    for (let i = -1; i <= 1; i++) {
      const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.07), this.gearDarkMat)
      magPouch.position.set(i * 0.12, -0.08, 0.19)
      torsoGroup.add(magPouch)
    }

    // Tactical Radio / PTT unit on Upper Left Chest
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.06), this.gearDarkMat)
    radio.position.set(-0.15, 0.16, 0.18)
    torsoGroup.add(radio)

    // Radio Antenna
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), this.gearDarkMat)
    antenna.position.set(-0.17, 0.28, 0.18)
    torsoGroup.add(antenna)

    // Tactical Hydration / Assault Pack on Back
    const backPack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.12), vestMat)
    backPack.position.set(0, 0.02, -0.2)
    torsoGroup.add(backPack)

    // ==========================================
    // 3. ARMS & TACTICAL GLOVES
    // ==========================================
    // Left Arm (Holding Front Handguard)
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.28, 1.25, 0)
    leftArmGroup.rotation.x = -0.55
    leftArmGroup.rotation.y = 0.35
    root.add(leftArmGroup)

    const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.14), uniformMat)
    leftUpperArm.position.set(0, -0.12, 0)
    leftArmGroup.add(leftUpperArm)

    // Team Patch on Shoulder
    const leftPatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: team === 'CT' ? 0x0284c7 : 0xdc2626 })
    )
    leftPatch.position.set(-0.065, -0.08, 0)
    leftArmGroup.add(leftPatch)

    // Left Forearm & Glove reaching to gun
    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.24, 0.12), this.gearDarkMat)
    leftGlove.position.set(0.06, -0.3, 0.08)
    leftGlove.rotation.x = -0.3
    leftArmGroup.add(leftGlove)

    // Right Arm (Aiming & Holding Weapon Grip)
    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.28, 1.25, 0)
    rightArmGroup.rotation.x = -0.5
    rightArmGroup.rotation.y = -0.1
    root.add(rightArmGroup)

    const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.14), uniformMat)
    rightUpperArm.position.set(0, -0.12, 0)
    rightArmGroup.add(rightUpperArm)

    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.24, 0.12), this.gearDarkMat)
    rightGlove.position.set(0, -0.3, 0.1)
    rightGlove.rotation.x = -0.3
    rightArmGroup.add(rightGlove)

    // Tactical Assault Rifle attached to right hand
    const gunGroup = new THREE.Group()
    gunGroup.position.set(-0.08, -0.3, 0.15)
    rightArmGroup.add(gunGroup)

    // Rifle Receiver & Stock
    const rifleMat = new THREE.MeshStandardMaterial({ color: 0x181a20, metalness: 0.8, roughness: 0.3 })
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.42), rifleMat)
    gunBody.position.set(0, 0, 0.1)
    gunGroup.add(gunBody)

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8), rifleMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.02, 0.42)
    gunGroup.add(barrel)

    // Curved Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.09), this.gearDarkMat)
    mag.position.set(0, -0.1, 0.14)
    mag.rotation.x = 0.2
    gunGroup.add(mag)

    // Optical Sight / Scope
    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.14), this.metalHardwareMat)
    scope.position.set(0, 0.08, 0.1)
    gunGroup.add(scope)

    // Muzzle Flash
    const muzzleFlashGeom = new THREE.OctahedronGeometry(0.09, 0)
    const muzzleFlashMat = new THREE.MeshBasicMaterial({ color: 0xffe066 })
    const muzzleFlash = new THREE.Mesh(muzzleFlashGeom, muzzleFlashMat)
    muzzleFlash.position.set(0, 0.02, 0.6)
    muzzleFlash.visible = false
    gunGroup.add(muzzleFlash)

    // ==========================================
    // 4. LEGS, KNEE PADS & COMBAT BOOTS
    // ==========================================
    // Left Leg
    const leftLegGroup = new THREE.Group()
    leftLegGroup.position.set(-0.13, 0.72, 0)
    root.add(leftLegGroup)

    const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.2), uniformMat)
    leftThigh.position.set(0, -0.16, 0)
    leftLegGroup.add(leftThigh)
    attachHitbox(leftThigh, 'leg')

    // Molded Hard-shell Knee Pad
    const leftKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), this.gearDarkMat)
    leftKneePad.position.set(0, -0.34, 0.1)
    leftLegGroup.add(leftKneePad)

    // Shin & Combat Boot
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.32, 0.24), this.gearDarkMat)
    leftBoot.position.set(0, -0.54, 0.03)
    leftBoot.castShadow = true
    leftLegGroup.add(leftBoot)
    attachHitbox(leftBoot, 'leg')

    // Right Leg
    const rightLegGroup = new THREE.Group()
    rightLegGroup.position.set(0.13, 0.72, 0)
    root.add(rightLegGroup)

    const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.2), uniformMat)
    rightThigh.position.set(0, -0.16, 0)
    rightLegGroup.add(rightThigh)
    attachHitbox(rightThigh, 'leg')

    const rightKneePad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), this.gearDarkMat)
    rightKneePad.position.set(0, -0.34, 0.1)
    rightLegGroup.add(rightKneePad)

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.32, 0.24), this.gearDarkMat)
    rightBoot.position.set(0, -0.54, 0.03)
    rightBoot.castShadow = true
    rightLegGroup.add(rightBoot)
    attachHitbox(rightBoot, 'leg')

    const limbs: OperatorLimbs = {
      headGroup,
      torsoGroup,
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
      gunGroup,
      muzzleFlash
    }

    return { root, hitboxes, limbs }
  }
}
