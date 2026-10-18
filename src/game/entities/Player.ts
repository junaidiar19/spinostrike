import * as THREE from 'three'
import { audioManager } from '../core/AudioManager'
import { BulletManager } from '../weapons/BulletManager'
import { WeaponModelGenerator } from '../weapons/WeaponModelGenerator'
import { WEAPON_DEFINITIONS } from '../weapons/definitions/weapons'
import { useGameStore } from '../../stores/useGameStore'
import { realtimeManager } from '../../services/supabase/realtime'
import type { WeaponId } from '../../types/game.types'

export class Player {
  public camera: THREE.PerspectiveCamera
  public position = new THREE.Vector3(0, 1.65, 20)
  public velocity = new THREE.Vector3()

  // Rotations (in radians)
  public yaw: number = 0
  public pitch: number = 0

  // Movement parameters
  private walkSpeed = 6.0
  private sprintSpeed = 8.5
  private crouchSpeed = 3.0
  private jumpForce = 8.2
  private gravity = 24.0

  public isGrounded = true
  public isCrouching = false
  public isSprinting = false

  // Viewmodel & Weapon System
  private viewmodelContainer = new THREE.Group()
  private currentWeaponMeshGroup: THREE.Group | null = null
  private currentMuzzlePos = new THREE.Vector3()
  private currentMuzzleFlash: THREE.Mesh | null = null
  private bulletManager: BulletManager

  // Procedural weapon animation offsets
  private weaponOffset = new THREE.Vector3(0.22, -0.2, -0.45)
  private swayOffset = new THREE.Vector3()
  private recoilOffset = new THREE.Vector3()
  private recoilRotation = new THREE.Vector3()
  private bobTimer = 0
  private stepTimer = 0

  // Combat Timers
  private lastShootTime = 0
  private reloadStartTime = 0

  constructor(camera: THREE.PerspectiveCamera, bulletManager: BulletManager) {
    this.camera = camera
    this.bulletManager = bulletManager

    // Setup viewmodel container attached to camera
    this.camera.add(this.viewmodelContainer)
  }

  public initWeapon(id: WeaponId) {
    // Clear old weapon
    if (this.currentWeaponMeshGroup) {
      this.viewmodelContainer.remove(this.currentWeaponMeshGroup)
    }

    const { root, muzzlePos, flash } = WeaponModelGenerator.createWeapon(id)
    this.currentWeaponMeshGroup = root
    this.currentMuzzlePos.copy(muzzlePos)
    this.currentMuzzleFlash = flash

    // Apply baseline idle offset
    root.position.copy(this.weaponOffset)
    this.viewmodelContainer.add(root)
  }

  public update(
    dt: number,
    input: {
      dx: number
      dy: number
      fwd: number
      rgt: number
      jump: boolean
      crouch: boolean
      sprint: boolean
      shoot: boolean
      aim: boolean
      reload: boolean
      slot: number | null
    },
    collidableMeshes: THREE.Object3D[],
    targetMeshes: THREE.Object3D[]
  ) {
    const gameStore = useGameStore.getState()
    const activeId = gameStore.activeWeaponId
    const activeConfig = WEAPON_DEFINITIONS[activeId]
    const weaponState = gameStore.weaponStates[activeId]

    // 1. Check weapon slot change
    if (input.slot !== null && input.slot >= 1 && input.slot <= 3 && !gameStore.isPlayerDead) {
      gameStore.setCurrentSlot(input.slot as 1 | 2 | 3)
      const newActive = useGameStore.getState().activeWeaponId
      this.initWeapon(newActive)
    }

    // 2. Camera Rotations (Mouse / Touch Look)
    if (!gameStore.isPlayerDead) {
      this.yaw -= input.dx
      this.pitch -= input.dy
      // Limit pitch to avoid flipping (-88 deg to +88 deg)
      const maxPitch = (88 * Math.PI) / 180
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch))
    } else {
      // In elimination / death state: lower camera towards ground
      this.pitch = Math.min(0.5, this.pitch + dt * 1.5)
    }

    this.camera.up.set(0, 1, 0)
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.x = this.pitch
    this.camera.rotation.y = this.yaw
    this.camera.rotation.z = 0 // Prevent any roll or inverted orientation!

    if (gameStore.isPlayerDead) {
      this.velocity.set(0, 0, 0)
      if (this.currentWeaponMeshGroup) {
        this.currentWeaponMeshGroup.position.y = -1.0 // Lower weapon when dead
      }
      return
    }

    // 3. Movement Calculations
    this.isCrouching = input.crouch
    this.isSprinting = input.sprint && !this.isCrouching

    let speed = this.walkSpeed
    if (this.isCrouching) speed = this.crouchSpeed
    else if (this.isSprinting) speed = this.sprintSpeed

    // Direction vectors based on player yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize()
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize()

    const moveDir = new THREE.Vector3()
    moveDir.addScaledVector(forward, input.fwd)
    moveDir.addScaledVector(right, input.rgt)
    if (moveDir.lengthSq() > 0) moveDir.normalize()

    // Smooth horizontal velocity
    this.velocity.x = moveDir.x * speed
    this.velocity.z = moveDir.z * speed

    // Vertical physics (jump & gravity)
    if (this.isGrounded) {
      if (input.jump) {
        this.velocity.y = this.jumpForce
        this.isGrounded = false
      } else {
        this.velocity.y = 0
      }
    } else {
      this.velocity.y -= this.gravity * dt
    }

    // Collision parameters
    const playerRadius = 0.42
    const eyeHeight = this.isCrouching ? 1.15 : 1.65
    const playerFeetY = this.position.y - eyeHeight

    // 1. Vertical Physics & Elevated Surface Floor Detection
    const nextY = this.position.y + this.velocity.y * dt
    let floorY = 0

    // Check elevated obstacle floors (e.g. A-Site platform, catwalks, tops of crates)
    for (const mesh of collidableMeshes) {
      if (!(mesh instanceof THREE.Mesh) || !mesh.geometry) continue
      const box = new THREE.Box3().setFromObject(mesh)
      if (box.max.y <= 0.05) continue // skip ground

      // If player is horizontally within the bounds of this obstacle
      if (
        this.position.x + playerRadius * 0.5 > box.min.x &&
        this.position.x - playerRadius * 0.5 < box.max.x &&
        this.position.z + playerRadius * 0.5 > box.min.z &&
        this.position.z - playerRadius * 0.5 < box.max.z
      ) {
        // Can stand on top if feet are at or above obstacle top (with small step tolerance)
        if (box.max.y <= playerFeetY + 0.35 && box.max.y > floorY) {
          floorY = box.max.y
        }
      }
    }

    const currentEyeHeight = floorY + eyeHeight
    if (nextY <= currentEyeHeight) {
      this.position.y = currentEyeHeight
      this.isGrounded = true
      this.velocity.y = 0
    } else {
      this.position.y = nextY
      this.isGrounded = false
    }

    // 2. Horizontal Movement Collision & Wall Sliding (X Axis)
    const nextX = this.position.x + this.velocity.x * dt
    let blockedX = false
    const bodyBottom = this.position.y - eyeHeight + 0.2
    const bodyTop = this.position.y + 0.1

    for (const mesh of collidableMeshes) {
      if (!(mesh instanceof THREE.Mesh) || !mesh.geometry) continue
      const box = new THREE.Box3().setFromObject(mesh)
      if (box.max.y <= 0.05) continue // skip ground

      // Only collide if obstacle overlaps vertically with player's torso/legs
      if (box.max.y > bodyBottom && box.min.y < bodyTop) {
        if (
          nextX + playerRadius > box.min.x &&
          nextX - playerRadius < box.max.x &&
          this.position.z + playerRadius > box.min.z &&
          this.position.z - playerRadius < box.max.z
        ) {
          blockedX = true
          break
        }
      }
    }

    if (!blockedX) {
      this.position.x = nextX
    } else {
      this.velocity.x = 0 // slide along wall
    }

    // 3. Horizontal Movement Collision & Wall Sliding (Z Axis)
    const nextZ = this.position.z + this.velocity.z * dt
    let blockedZ = false

    for (const mesh of collidableMeshes) {
      if (!(mesh instanceof THREE.Mesh) || !mesh.geometry) continue
      const box = new THREE.Box3().setFromObject(mesh)
      if (box.max.y <= 0.05) continue

      if (box.max.y > bodyBottom && box.min.y < bodyTop) {
        if (
          this.position.x + playerRadius > box.min.x &&
          this.position.x - playerRadius < box.max.x &&
          nextZ + playerRadius > box.min.z &&
          nextZ - playerRadius < box.max.z
        ) {
          blockedZ = true
          break
        }
      }
    }

    if (!blockedZ) {
      this.position.z = nextZ
    } else {
      this.velocity.z = 0 // slide along wall
    }

    // Map outer perimeter boundary clamp
    this.position.x = Math.max(-38, Math.min(38, this.position.x))
    this.position.z = Math.max(-38, Math.min(38, this.position.z))

    // Update camera position
    this.camera.position.copy(this.position)

    // 4. Footsteps & Bobbing
    const isMoving = this.isGrounded && moveDir.lengthSq() > 0.01
    if (isMoving) {
      this.bobTimer += dt * (this.isSprinting ? 14 : 10)
      this.stepTimer += dt * (this.isSprinting ? 1.4 : 1.0)
      if (this.stepTimer >= 0.45) {
        audioManager.playFootstep()
        this.stepTimer = 0
      }
    } else {
      this.bobTimer += dt * 2 // subtle breathing idle
      this.stepTimer = 0.3
    }

    // 5. Reload Handling
    const now = performance.now() / 1000
    if (input.reload && !weaponState.isReloading && weaponState.clip < activeConfig.clipSize && weaponState.reserve > 0) {
      gameStore.updateWeaponState(activeId, { isReloading: true, reloadProgress: 0 })
      this.reloadStartTime = now
      audioManager.playReloadSound()
    }

    if (weaponState.isReloading) {
      const elapsed = now - this.reloadStartTime
      const progress = Math.min(1.0, elapsed / activeConfig.reloadTime)
      gameStore.updateWeaponState(activeId, { reloadProgress: progress })

      if (elapsed >= activeConfig.reloadTime) {
        const needed = activeConfig.clipSize - weaponState.clip
        const toAdd = Math.min(needed, weaponState.reserve)
        gameStore.updateWeaponState(activeId, {
          clip: weaponState.clip + toAdd,
          reserve: weaponState.reserve - toAdd,
          isReloading: false,
          reloadProgress: 0
        })
      }
    }

    // 6. Shooting Mechanics
    const fireInterval = 1.0 / activeConfig.fireRate
    if (input.shoot && !weaponState.isReloading) {
      if (now - this.lastShootTime >= fireInterval) {
        if (weaponState.clip > 0) {
          this.shootWeapon(activeId, activeConfig, collidableMeshes, targetMeshes)
          this.lastShootTime = now
        } else {
          audioManager.playDryFire()
          this.lastShootTime = now + 0.1
        }
      }
    }

    // 7. Dynamic Crosshair Spread
    let baseSpread = activeConfig.spread * 100
    if (isMoving) baseSpread *= 2.2
    if (!this.isGrounded) baseSpread *= 3.5
    if (input.aim) baseSpread *= 0.3
    gameStore.setCrosshairSpread(Math.max(1.0, baseSpread))

    // 8. FOV & ADS Zoom
    const targetFov = input.aim && activeConfig.zoomFov ? activeConfig.zoomFov : 75
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 16)
    this.camera.updateProjectionMatrix()

    // 9. Procedural Viewmodel Animation (Recoil, Sway, Bob)
    this.updateViewmodelAnimations(dt, input, isMoving, activeId)
  }

  private shootWeapon(
    activeId: WeaponId,
    config: typeof WEAPON_DEFINITIONS[WeaponId],
    collidableMeshes: THREE.Object3D[],
    targetMeshes: THREE.Object3D[]
  ) {
    const gameStore = useGameStore.getState()
    const weaponState = gameStore.weaponStates[activeId]

    // Decrement ammo
    if (activeId !== 'knife') {
      gameStore.updateWeaponState(activeId, { clip: weaponState.clip - 1 })
    }

    // Muzzle Flash
    if (this.currentMuzzleFlash) {
      this.currentMuzzleFlash.visible = true
      this.currentMuzzleFlash.rotation.z = Math.random() * Math.PI
      setTimeout(() => {
        if (this.currentMuzzleFlash) this.currentMuzzleFlash.visible = false
      }, 45)
    }

    // Recoil Kickback
    this.recoilOffset.z = 0.08
    this.recoilOffset.y = 0.02
    this.recoilRotation.x = config.recoilVertical * 1.5
    this.recoilRotation.y = (Math.random() - 0.5) * config.recoilHorizontal * 2.0

    // Add camera pitch recoil
    this.pitch += config.recoilVertical * 0.4
    this.yaw += (Math.random() - 0.5) * config.recoilHorizontal * 0.4

    // Calculate bullet trajectory with spread
    const spread = (Math.random() - 0.5) * config.spread
    const spreadY = (Math.random() - 0.5) * config.spread

    const shootDir = new THREE.Vector3(spread, spreadY, -1)
    shootDir.applyQuaternion(this.camera.quaternion).normalize()

    // Raycast hit detection
    const shootOrigin = this.camera.position.clone()
    const allHitTargets = [...targetMeshes, ...collidableMeshes]
    this.bulletManager.fireBullet(shootOrigin, shootDir, activeId, allHitTargets)

    // Broadcast shoot to Supabase Realtime room
    if (realtimeManager.currentRoomId) {
      realtimeManager.broadcastShoot(
        { x: shootOrigin.x, y: shootOrigin.y, z: shootOrigin.z },
        { x: shootDir.x, y: shootDir.y, z: shootDir.z },
        activeId
      )
    }
  }

  private updateViewmodelAnimations(
    dt: number,
    input: { dx: number; dy: number; aim: boolean },
    isMoving: boolean,
    activeId: WeaponId
  ) {
    if (!this.currentWeaponMeshGroup) return

    // Hide weapon model when zoomed in with sniper scope
    if ((activeId === 'awp' || activeId === 'ssg08') && input.aim) {
      this.currentWeaponMeshGroup.visible = false
      return
    } else {
      this.currentWeaponMeshGroup.visible = true
    }

    // Weapon Sway (lagging slightly behind mouse rotation)
    const targetSwayX = -input.dx * 0.04
    const targetSwayY = -input.dy * 0.04
    this.swayOffset.x = THREE.MathUtils.lerp(this.swayOffset.x, targetSwayX, dt * 10)
    this.swayOffset.y = THREE.MathUtils.lerp(this.swayOffset.y, targetSwayY, dt * 10)

    // Weapon Bobbing (walking oscillation)
    const bobAmount = isMoving ? 0.015 : 0.003
    const bobX = Math.cos(this.bobTimer) * bobAmount
    const bobY = Math.abs(Math.sin(this.bobTimer)) * bobAmount * 1.5

    // Smooth Recoil Recovery
    this.recoilOffset.z = THREE.MathUtils.lerp(this.recoilOffset.z, 0, dt * 14)
    this.recoilOffset.y = THREE.MathUtils.lerp(this.recoilOffset.y, 0, dt * 14)
    this.recoilRotation.x = THREE.MathUtils.lerp(this.recoilRotation.x, 0, dt * 16)
    this.recoilRotation.y = THREE.MathUtils.lerp(this.recoilRotation.y, 0, dt * 16)

    // Position composition
    this.currentWeaponMeshGroup.position.set(
      this.weaponOffset.x + this.swayOffset.x + bobX,
      this.weaponOffset.y + this.swayOffset.y + bobY + this.recoilOffset.y,
      this.weaponOffset.z + this.recoilOffset.z
    )

    // Rotation composition
    this.currentWeaponMeshGroup.rotation.set(
      this.recoilRotation.x,
      this.recoilRotation.y + this.swayOffset.x * 0.8,
      -this.swayOffset.x * 1.2
    )
  }

  public respawn(spawnPoint: THREE.Vector3) {
    this.position.copy(spawnPoint)
    this.camera.position.copy(this.position)
    this.velocity.set(0, 0, 0)
    this.yaw = 0
    this.pitch = 0
    this.camera.up.set(0, 1, 0)
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.set(0, 0, 0)
    this.camera.quaternion.identity()
    if (this.currentWeaponMeshGroup) {
      this.currentWeaponMeshGroup.position.copy(this.weaponOffset)
    }
    useGameStore.getState().respawnPlayer()
  }
}
