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

  // Shared Military Armor Materials
  private armorMat = new THREE.MeshStandardMaterial({
    color: 0x3e4a38, // Tactical Military Olive Drab
    roughness: 0.65,
    metalness: 0.55,
    flatShading: true
  })

  private armorAccentMat = new THREE.MeshStandardMaterial({
    color: 0x2d3728, // Dark Forest Camo Panels
    roughness: 0.7,
    metalness: 0.45,
    flatShading: true
  })

  private steelMat = new THREE.MeshStandardMaterial({
    color: 0x1e242b,
    roughness: 0.4,
    metalness: 0.85
  })

  private trackTreadMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d, // Heavy Caterpillar Steel Treads
    roughness: 0.8,
    metalness: 0.6
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
    // 1. TANK LOWER CHASSIS & HULL
    // ==========================================
    // Main Armored Hull Tub
    const mainHull = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.95, 5.6), this.armorMat)
    mainHull.position.set(0, 0.95, 0)
    mainHull.castShadow = true
    mainHull.receiveShadow = true
    this.hullGroup.add(mainHull)

    // Sloped Glacis Front Armor (Angled Deflection Plate)
    const glacisGeom = new THREE.BoxGeometry(2.9, 0.35, 1.6)
    const glacis = new THREE.Mesh(glacisGeom, this.armorAccentMat)
    glacis.position.set(0, 1.25, -2.1)
    glacis.rotation.x = 0.35
    this.hullGroup.add(glacis)

    // Rear Engine Radiator Deck & Vents
    const engineDeck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 1.8), this.steelMat)
    engineDeck.position.set(0, 1.48, 1.8)
    this.hullGroup.add(engineDeck)

    // Dual Rear Exhaust Stacks
    for (const sx of [-1.1, 1.1]) {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 8), this.steelMat)
      exhaust.rotation.x = -0.4
      exhaust.position.set(sx, 1.4, 2.7)
      this.hullGroup.add(exhaust)
    }

    // ==========================================
    // 2. CATERPILLAR TRACKS & WHEELS
    // ==========================================
    for (const side of [-1, 1]) {
      const trackX = side * 1.55

      // Continuous Track Belt Loop
      const trackBelt = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 5.8), this.trackTreadMat)
      trackBelt.position.set(trackX, 0.52, 0)
      trackBelt.castShadow = true
      this.hullGroup.add(trackBelt)

      // Armored Track Mudguard / Side Skirt
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 5.8), this.armorMat)
      skirt.position.set(side * 1.85, 0.75, 0)
      this.hullGroup.add(skirt)

      // 6 Road Wheels per side
      for (let w = 0; w < 6; w++) {
        const wheelZ = -2.2 + w * 0.88
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.42, 16), this.steelMat)
        wheel.rotation.z = Math.PI / 2
        wheel.position.set(trackX, 0.46, wheelZ)
        this.hullGroup.add(wheel)
        this.roadWheels.push(wheel)
      }
    }

    // Front Mudflaps
    for (const side of [-1, 1]) {
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.35), this.steelMat)
      flap.position.set(side * 1.55, 0.88, -2.95)
      flap.rotation.x = 0.3
      this.hullGroup.add(flap)
    }

    // ==========================================
    // 3. ROTATABLE ARMORED TURRET
    // ==========================================
    this.turretGroup.position.set(0, 1.55, -0.2)
    this.hullGroup.add(this.turretGroup)

    // Turret Base Ring
    const turretRing = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.22, 20), this.steelMat)
    turretRing.position.set(0, 0.1, 0)
    this.turretGroup.add(turretRing)

    // Angular Turret Main Body
    const turretBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.85, 3.2), this.armorMat)
    turretBody.position.set(0, 0.55, 0)
    turretBody.castShadow = true
    this.turretGroup.add(turretBody)

    // Reactive Armor Cheek Blocks on Turret Front
    for (const side of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.8), this.armorAccentMat)
      cheek.position.set(side * 0.85, 0.55, -1.4)
      cheek.rotation.y = side * 0.25
      this.turretGroup.add(cheek)
    }

    // Commander Cupola Hatch
    const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 16), this.steelMat)
    hatch.position.set(0.6, 1.05, 0.3)
    this.turretGroup.add(hatch)

    // Tactical Radio Whip Antenna
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.2, 6), this.steelMat)
    antenna.position.set(-0.9, 1.9, 1.2)
    antenna.rotation.z = -0.06
    this.turretGroup.add(antenna)

    // Rear Turret Stowage Bustle Basket
    const bustle = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.9), this.steelMat)
    bustle.position.set(0, 0.65, 1.85)
    this.turretGroup.add(bustle)

    // ==========================================
    // 4. ELEVATING 120mm TANK CANNON
    // ==========================================
    this.cannonGroup.position.set(0, 0.55, -1.5)
    this.turretGroup.add(this.cannonGroup)

    // Gun Mantlet Armor Shield
    const mantlet = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.6), this.armorAccentMat)
    mantlet.position.set(0, 0, -0.2)
    this.cannonGroup.add(mantlet)

    // Heavy 120mm Smoothbore Barrel
    const barrelLength = 4.2
    const barrelGeom = new THREE.CylinderGeometry(0.12, 0.14, barrelLength, 16)
    this.barrelMesh = new THREE.Mesh(barrelGeom, this.steelMat)
    this.barrelMesh.rotation.x = Math.PI / 2
    this.barrelMesh.position.set(0, 0, -barrelLength / 2 - 0.4)
    this.barrelMesh.castShadow = true
    this.cannonGroup.add(this.barrelMesh)

    // Slotted Muzzle Brake at tip
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16), this.armorAccentMat)
    brake.rotation.x = Math.PI / 2
    brake.position.set(0, 0, -barrelLength - 0.45)
    this.cannonGroup.add(brake)

    // Huge Cannon Muzzle Flash Octahedron
    const flashGeom = new THREE.OctahedronGeometry(0.45, 0)
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 })
    this.muzzleFlash = new THREE.Mesh(flashGeom, flashMat)
    this.muzzleFlash.position.set(0, 0, -barrelLength - 0.8)
    this.muzzleFlash.visible = false
    this.cannonGroup.add(this.muzzleFlash)

    // Hitbox for taking damage & interaction
    mainHull.userData = {
      isTank: true,
      tankRef: this,
      entityName: 'Tempur Tank',
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

      // Clamp within map bounds
      nextPos.x = Math.max(-54, Math.min(54, nextPos.x))
      nextPos.z = Math.max(-54, Math.min(54, nextPos.z))

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
    // 3rd Person Tactical Tank Chase Camera (positioned behind & above turret)
    const camOffset = new THREE.Vector3(0, 3.4, 6.8)
    camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.turretYaw)

    const camPos = this.position.clone().add(new THREE.Vector3(0, 1.8, 0)).add(camOffset)

    // Look at point 15m ahead in direction of turret/cannon aim
    const aimDir = new THREE.Vector3(0, 0, -1)
    aimDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.turretYaw)
    const lookAtPos = this.position.clone().add(new THREE.Vector3(0, 2.0, 0)).add(aimDir.multiplyScalar(20))

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
