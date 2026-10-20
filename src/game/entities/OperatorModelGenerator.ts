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
  // Shared Canvas Camo Textures Cache
  private static ctCamoTexture: THREE.CanvasTexture | null = null
  private static tCamoTexture: THREE.CanvasTexture | null = null

  // 1. Procedural Digital Camo Generator
  private static getCamoTexture(team: Team): THREE.CanvasTexture {
    if (team === 'CT' && this.ctCamoTexture) return this.ctCamoTexture
    if (team === 'T' && this.tCamoTexture) return this.tCamoTexture

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    // Base tone
    const baseColor = team === 'CT' ? '#1e293b' : '#78350f'
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 256, 256)

    // Digital pixelated camo blotches
    const colors =
      team === 'CT'
        ? ['#0f172a', '#334155', '#1e3a8a', '#0284c7']
        : ['#451a03', '#92400e', '#b45309', '#d97706']

    const pxSize = 8
    for (let x = 0; x < 256; x += pxSize) {
      for (let y = 0; y < 256; y += pxSize) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
          ctx.fillRect(x, y, pxSize, pxSize)
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)

    if (team === 'CT') this.ctCamoTexture = texture
    else this.tCamoTexture = texture

    return texture
  }

  // Smooth Realistic Materials
  private static getMaterials(team: Team) {
    const camoTex = this.getCamoTexture(team)

    // Combat Uniform
    const uniformMat = new THREE.MeshStandardMaterial({
      map: camoTex,
      roughness: 0.72,
      metalness: 0.1,
      bumpScale: 0.05
    })

    // Tactical Kevlar Plate Carrier
    const vestMat = new THREE.MeshStandardMaterial({
      color: team === 'CT' ? 0x0f172a : 0x7f1d1d,
      roughness: 0.65,
      metalness: 0.2
    })

    // FAST Ballistic Helmet
    const helmetMat = new THREE.MeshStandardMaterial({
      color: team === 'CT' ? 0x1e293b : 0x451a03,
      roughness: 0.45,
      metalness: 0.35
    })

    // Polarized Ballistic Goggles (Specular Glass)
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: team === 'CT' ? 0x38bdf8 : 0xf97316,
      roughness: 0.1,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    })

    // Balaclava / Face mask
    const balaclavaMat = new THREE.MeshStandardMaterial({
      color: team === 'CT' ? 0x18181b : 0x451a03,
      roughness: 0.9
    })

    // Realistic warm skin tone
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.55,
      metalness: 0.05
    })

    // Matte nylon tactical gear (pouches, straps, boots, holster)
    const gearMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.15
    })

    // Gunmetal hardware & accessories (NVG mount, picatinny rails)
    const hardwareMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.85
    })

    // Weapon metal & polymer
    const rifleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8
    })

    // Team identification patch
    const teamPatchMat = new THREE.MeshStandardMaterial({
      color: team === 'CT' ? 0x0284c7 : 0xdc2626,
      emissive: team === 'CT' ? 0x0369a1 : 0x991b1b,
      emissiveIntensity: 0.4,
      roughness: 0.4
    })

    return {
      uniformMat,
      vestMat,
      helmetMat,
      visorMat,
      balaclavaMat,
      skinMat,
      gearMat,
      hardwareMat,
      rifleMat,
      teamPatchMat
    }
  }

  public static buildOperator(
    team: Team,
    entityName: string,
    onHitCallback?: (damage: number, isHeadshot: boolean) => void,
    remoteEntityId?: string
  ): OperatorModelResult {
    const root = new THREE.Group()
    const hitboxes: THREE.Object3D[] = []

    const mats = this.getMaterials(team)

    const attachHitbox = (mesh: THREE.Object3D, type: 'head' | 'body' | 'leg') => {
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
    // 1. HEAD & TACTICAL BALLISTIC HELMET
    // ==========================================
    const headGroup = new THREE.Group()
    headGroup.position.set(0, 1.55, 0)
    root.add(headGroup)

    // Neck (Anatomical connection from torso)
    const neckGeom = new THREE.CylinderGeometry(0.075, 0.085, 0.14, 12)
    const neck = new THREE.Mesh(neckGeom, mats.skinMat)
    neck.position.set(0, -0.07, 0)
    headGroup.add(neck)
    attachHitbox(neck, 'head')

    // Rounded Organic Head Base (Capsule Geometry)
    const headGeom = new THREE.CapsuleGeometry(0.12, 0.12, 8, 14)
    const headMesh = new THREE.Mesh(headGeom, mats.balaclavaMat)
    headMesh.position.set(0, 0.04, 0)
    headMesh.castShadow = true
    headGroup.add(headMesh)
    attachHitbox(headMesh, 'head')

    // Exposed Eye Skin Area
    const eyeArea = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.05, 0.03),
      mats.skinMat
    )
    eyeArea.position.set(0, 0.05, 0.12)
    headGroup.add(eyeArea)

    // Polarized Curved Ballistic Visor Goggles
    const visorGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.07, 16, 1, false, -Math.PI / 3, (Math.PI * 2) / 3)
    const goggles = new THREE.Mesh(visorGeom, mats.visorMat)
    goggles.rotation.y = Math.PI / 2
    goggles.position.set(0, 0.05, 0.03)
    headGroup.add(goggles)
    attachHitbox(goggles, 'head')

    // Goggle Strap around head
    const strap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.132, 0.132, 0.02, 16, 1, true),
      mats.gearMat
    )
    strap.position.set(0, 0.05, 0)
    headGroup.add(strap)

    // FAST Tactical Ballistic Helmet (Smoothed Hemisphere Dome)
    const helmetGeom = new THREE.SphereGeometry(0.148, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58)
    const helmet = new THREE.Mesh(helmetGeom, mats.helmetMat)
    helmet.position.set(0, 0.05, -0.01)
    helmet.castShadow = true
    headGroup.add(helmet)
    attachHitbox(helmet, 'head')

    // Helmet NVG Mount Shroud (Front)
    const nvgMount = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.03),
      mats.hardwareMat
    )
    nvgMount.position.set(0, 0.14, 0.135)
    headGroup.add(nvgMount)

    // Helmet Team Identity Band (High contrast with subtle glow)
    const bandGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.025, 16, 1, true)
    const helmetBand = new THREE.Mesh(bandGeom, mats.teamPatchMat)
    helmetBand.position.set(0, 0.08, -0.01)
    headGroup.add(helmetBand)

    // Tactical Headset Comms Ear Cups (Left & Right)
    const earGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.025, 12)
    const earLeft = new THREE.Mesh(earGeom, mats.gearMat)
    earLeft.rotation.z = Math.PI / 2
    earLeft.position.set(-0.135, 0.03, 0)
    headGroup.add(earLeft)

    const earRight = new THREE.Mesh(earGeom, mats.gearMat)
    earRight.rotation.z = -Math.PI / 2
    earRight.position.set(0.135, 0.03, 0)
    headGroup.add(earRight)

    // Headset Microphone Boom
    const micGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6)
    const mic = new THREE.Mesh(micGeom, mats.hardwareMat)
    mic.rotation.x = Math.PI / 2.8
    mic.rotation.z = -Math.PI / 4
    mic.position.set(-0.09, -0.04, 0.09)
    headGroup.add(mic)

    // ==========================================
    // 2. TORSO & TACTICAL PLATE CARRIER VEST
    // ==========================================
    const torsoGroup = new THREE.Group()
    torsoGroup.position.set(0, 1.05, 0)
    root.add(torsoGroup)

    // Anatomical V-Taper Combat Shirt Torso
    const torsoGeom = new THREE.CylinderGeometry(0.22, 0.18, 0.6, 14)
    const torso = new THREE.Mesh(torsoGeom, mats.uniformMat)
    torso.scale.set(1.05, 1.0, 0.72) // Flatten depth for human chest ratio
    torso.castShadow = true
    torsoGroup.add(torso)
    attachHitbox(torso, 'body')

    // Contoured Tactical Plate Carrier Vest (Chest & Back Armor)
    const vestGeom = new THREE.CylinderGeometry(0.24, 0.2, 0.44, 14)
    const vest = new THREE.Mesh(vestGeom, mats.vestMat)
    vest.position.set(0, 0.06, 0)
    vest.scale.set(1.08, 1.0, 0.8)
    vest.castShadow = true
    torsoGroup.add(vest)
    attachHitbox(vest, 'body')

    // Shoulder Armor Strap Pads
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.16), mats.vestMat)
    strapL.position.set(-0.15, 0.28, 0)
    torsoGroup.add(strapL)

    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.16), mats.vestMat)
    strapR.position.set(0.15, 0.28, 0)
    torsoGroup.add(strapR)

    // 3x 5.56mm NATO Rifle Mag Pouches on Front
    for (let i = -1; i <= 1; i++) {
      const magPouch = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.15, 0.06),
        mats.gearMat
      )
      magPouch.position.set(i * 0.09, -0.04, 0.18)
      torsoGroup.add(magPouch)
    }

    // Tactical Radio / PTT on Upper Left Chest
    const radio = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.11, 0.05),
      mats.gearMat
    )
    radio.position.set(-0.13, 0.16, 0.16)
    torsoGroup.add(radio)

    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.22, 6),
      mats.gearMat
    )
    antenna.position.set(-0.15, 0.29, 0.16)
    torsoGroup.add(antenna)

    // Tactical Assault Hydration / Back Panel
    const backPack = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.38, 0.1),
      mats.vestMat
    )
    backPack.position.set(0, 0.06, -0.18)
    torsoGroup.add(backPack)

    // Duty Rig Belt at Waist
    const beltGeom = new THREE.CylinderGeometry(0.19, 0.19, 0.07, 14)
    const belt = new THREE.Mesh(beltGeom, mats.gearMat)
    belt.position.set(0, -0.27, 0)
    belt.scale.set(1.05, 1.0, 0.74)
    torsoGroup.add(belt)

    // ==========================================
    // 3. ARMS & TACTICAL GLOVES
    // ==========================================
    // Left Arm (Holding Handguard)
    const leftArmGroup = new THREE.Group()
    leftArmGroup.position.set(-0.25, 1.25, 0)
    leftArmGroup.rotation.x = -0.55
    leftArmGroup.rotation.y = 0.32
    root.add(leftArmGroup)

    // Left Shoulder Epaulette
    const leftDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mats.uniformMat)
    leftDeltoid.position.set(0, 0, 0)
    leftArmGroup.add(leftDeltoid)

    // Left Upper Arm (Smooth Cylinder)
    const upperArmGeom = new THREE.CylinderGeometry(0.065, 0.055, 0.26, 12)
    const leftUpperArm = new THREE.Mesh(upperArmGeom, mats.uniformMat)
    leftUpperArm.position.set(0, -0.13, 0)
    leftArmGroup.add(leftUpperArm)

    // Team Armband Patch on Left Bicep
    const patchL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.07), mats.teamPatchMat)
    patchL.position.set(-0.065, -0.09, 0)
    leftArmGroup.add(patchL)

    // Left Molded Elbow Pad
    const elbowL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.04), mats.gearMat)
    elbowL.position.set(0, -0.26, -0.04)
    leftArmGroup.add(elbowL)

    // Left Forearm & Glove reaching to rifle handguard
    const forearmGeom = new THREE.CylinderGeometry(0.055, 0.045, 0.24, 12)
    const leftForearm = new THREE.Mesh(forearmGeom, mats.uniformMat)
    leftForearm.position.set(0.05, -0.32, 0.08)
    leftForearm.rotation.x = -0.3
    leftArmGroup.add(leftForearm)

    const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.09), mats.gearMat)
    leftGlove.position.set(0.08, -0.42, 0.12)
    leftArmGroup.add(leftGlove)

    // Right Arm (Aiming Weapon)
    const rightArmGroup = new THREE.Group()
    rightArmGroup.position.set(0.25, 1.25, 0)
    rightArmGroup.rotation.x = -0.5
    rightArmGroup.rotation.y = -0.08
    root.add(rightArmGroup)

    const rightDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mats.uniformMat)
    rightDeltoid.position.set(0, 0, 0)
    rightArmGroup.add(rightDeltoid)

    const rightUpperArm = new THREE.Mesh(upperArmGeom, mats.uniformMat)
    rightUpperArm.position.set(0, -0.13, 0)
    rightArmGroup.add(rightUpperArm)

    const patchR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.08, 0.07), mats.teamPatchMat)
    patchR.position.set(0.065, -0.09, 0)
    rightArmGroup.add(patchR)

    const elbowR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.04), mats.gearMat)
    elbowR.position.set(0, -0.26, -0.04)
    rightArmGroup.add(elbowR)

    const rightForearm = new THREE.Mesh(forearmGeom, mats.uniformMat)
    rightForearm.position.set(0, -0.32, 0.08)
    rightForearm.rotation.x = -0.3
    rightArmGroup.add(rightForearm)

    const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.09), mats.gearMat)
    rightGlove.position.set(0, -0.42, 0.12)
    rightArmGroup.add(rightGlove)

    // ==========================================
    // TACTICAL ASSAULT RIFLE
    // ==========================================
    const gunGroup = new THREE.Group()
    gunGroup.position.set(-0.06, -0.36, 0.16)
    rightArmGroup.add(gunGroup)

    // Receiver & Upper Housing
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.09, 0.44),
      mats.rifleMat
    )
    gunBody.position.set(0, 0, 0.12)
    gunGroup.add(gunBody)

    // Tactical Barrel with Muzzle Brake
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.35, 10),
      mats.rifleMat
    )
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(0, 0.02, 0.46)
    gunGroup.add(barrel)

    // Curved Magazine
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.16, 0.08),
      mats.gearMat
    )
    mag.position.set(0, -0.11, 0.15)
    mag.rotation.x = 0.22
    gunGroup.add(mag)

    // Optical Holographic Red Dot Sight
    const sightBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.045, 0.11),
      mats.hardwareMat
    )
    sightBase.position.set(0, 0.075, 0.11)
    gunGroup.add(sightBase)

    // Glowing Red Reticle Glass
    const reticleGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 0.005),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    )
    reticleGlass.position.set(0, 0.08, 0.16)
    gunGroup.add(reticleGlass)

    // Muzzle Flash Effect
    const muzzleFlashGeom = new THREE.OctahedronGeometry(0.12, 0)
    const muzzleFlashMat = new THREE.MeshBasicMaterial({ color: 0xffd166 })
    const muzzleFlash = new THREE.Mesh(muzzleFlashGeom, muzzleFlashMat)
    muzzleFlash.position.set(0, 0.02, 0.68)
    muzzleFlash.visible = false
    gunGroup.add(muzzleFlash)

    // ==========================================
    // 4. LEGS, KNEE PADS & COMBAT BOOTS
    // ==========================================
    const legGeom = new THREE.CylinderGeometry(0.095, 0.08, 0.38, 12)
    const shinGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.34, 12)

    // Left Leg
    const leftLegGroup = new THREE.Group()
    leftLegGroup.position.set(-0.13, 0.72, 0)
    root.add(leftLegGroup)

    const leftThigh = new THREE.Mesh(legGeom, mats.uniformMat)
    leftThigh.position.set(0, -0.18, 0)
    leftLegGroup.add(leftThigh)
    attachHitbox(leftThigh, 'leg')

    // Left Molded Tactical Knee Pad
    const leftKneePad = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.13, 0.06),
      mats.gearMat
    )
    leftKneePad.position.set(0, -0.38, 0.08)
    leftLegGroup.add(leftKneePad)

    // Left Shin
    const leftShin = new THREE.Mesh(shinGeom, mats.uniformMat)
    leftShin.position.set(0, -0.52, 0)
    leftLegGroup.add(leftShin)
    attachHitbox(leftShin, 'leg')

    // Left Combat Assault Boot with Sole Tread
    const leftBoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.24),
      mats.gearMat
    )
    leftBoot.position.set(0, -0.66, 0.04)
    leftBoot.castShadow = true
    leftLegGroup.add(leftBoot)
    attachHitbox(leftBoot, 'leg')

    // Right Leg
    const rightLegGroup = new THREE.Group()
    rightLegGroup.position.set(0.13, 0.72, 0)
    root.add(rightLegGroup)

    const rightThigh = new THREE.Mesh(legGeom, mats.uniformMat)
    rightThigh.position.set(0, -0.18, 0)
    rightLegGroup.add(rightThigh)
    attachHitbox(rightThigh, 'leg')

    // Drop-Leg Kydex Tactical Pistol Holster on Right Thigh
    const holster = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.16, 0.09),
      mats.gearMat
    )
    holster.position.set(0.11, -0.18, 0)
    rightLegGroup.add(holster)

    // Sidearm Grip protruding from holster
    const sidearmGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.07, 0.05),
      mats.hardwareMat
    )
    sidearmGrip.position.set(0.11, -0.09, 0.02)
    rightLegGroup.add(sidearmGrip)

    // Right Knee Pad
    const rightKneePad = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.13, 0.06),
      mats.gearMat
    )
    rightKneePad.position.set(0, -0.38, 0.08)
    rightLegGroup.add(rightKneePad)

    // Right Shin
    const rightShin = new THREE.Mesh(shinGeom, mats.uniformMat)
    rightShin.position.set(0, -0.52, 0)
    rightLegGroup.add(rightShin)
    attachHitbox(rightShin, 'leg')

    // Right Combat Assault Boot
    const rightBoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.18, 0.24),
      mats.gearMat
    )
    rightBoot.position.set(0, -0.66, 0.04)
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
