import { useGameStore } from '../../stores/useGameStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import type { WeaponSlot } from '../../types/game.types'

export class InputManager {
  // Movement vector (-1 to 1)
  public moveForward: number = 0
  public moveRight: number = 0
  public isJumping: boolean = false
  public isCrouching: boolean = false
  public isSprinting: boolean = false

  // Aiming / Look delta
  public lookDeltaX: number = 0
  public lookDeltaY: number = 0

  // Actions
  public isShooting: boolean = false
  public isAiming: boolean = false
  public reloadRequested: boolean = false
  public requestedSlot: WeaponSlot | null = null

  // Pointer lock state
  public isPointerLocked: boolean = false

  // Mobile specific overrides
  private mobileMoveX: number = 0
  private mobileMoveY: number = 0

  private domElement: HTMLElement | null = null

  // Bound listeners
  private onKeyDownBound = this.onKeyDown.bind(this)
  private onKeyUpBound = this.onKeyUp.bind(this)
  private onMouseMoveBound = this.onMouseMove.bind(this)
  private onMouseDownBound = this.onMouseDown.bind(this)
  private onMouseUpBound = this.onMouseUp.bind(this)
  private onPointerLockChangeBound = this.onPointerLockChange.bind(this)
  // Gyroscope & Haptic state
  private onDeviceOrientationBound = this.onDeviceOrientation.bind(this)
  private lastGamma: number | null = null
  private lastBeta: number | null = null

  public init(element: HTMLElement) {
    this.domElement = element

    // Detect mobile
    const isMobileDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 840
    useGameStore.getState().setIsMobile(isMobileDevice)

    // Listeners
    window.addEventListener('keydown', this.onKeyDownBound)
    window.addEventListener('keyup', this.onKeyUpBound)
    window.addEventListener('mousemove', this.onMouseMoveBound)
    window.addEventListener('mousedown', this.onMouseDownBound)
    window.addEventListener('mouseup', this.onMouseUpBound)
    document.addEventListener('pointerlockchange', this.onPointerLockChangeBound)

    // Gyroscope listener for mobile aim
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.onDeviceOrientationBound)
    }

    // Prevent context menu (right click zoom)
    element.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  private onDeviceOrientation(e: DeviceOrientationEvent) {
    if (e.gamma === null || e.beta === null) return
    if (this.lastGamma !== null && this.lastBeta !== null) {
      const dg = e.gamma - this.lastGamma
      const db = e.beta - this.lastBeta
      // Only apply if small tilt
      if (Math.abs(dg) < 15 && Math.abs(db) < 15) {
        this.lookDeltaX += dg * 0.003
        this.lookDeltaY += db * 0.003
      }
    }
    this.lastGamma = e.gamma
    this.lastBeta = e.beta
  }

  public triggerHaptic(ms: number = 20) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms)
      }
    } catch {
      // ignore
    }
  }

  public requestPointerLock() {
    if (!this.domElement || this.isPointerLocked) return
    try {
      const p = this.domElement.requestPointerLock() as unknown as Promise<void> | undefined
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Browser pointer lock cooldown, ignore
        })
      }
    } catch {
      // ignore
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }

  private onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.domElement
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isPointerLocked) return
    const { mouseSensitivity, invertY } = useSettingsStore.getState()
    const factor = 0.0014 * mouseSensitivity

    this.lookDeltaX += e.movementX * factor
    this.lookDeltaY += (invertY ? -1 : 1) * e.movementY * factor
  }

  private onMouseDown(e: MouseEvent) {
    if (!this.isPointerLocked) return
    if (e.button === 0) {
      this.isShooting = true
    } else if (e.button === 2) {
      this.isAiming = !this.isAiming
      useGameStore.getState().setIsAiming(this.isAiming)
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      this.isShooting = false
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    // Scoreboard tab
    if (e.code === 'Tab') {
      e.preventDefault()
      useGameStore.getState().setIsScoreboardOpen(true)
      return
    }

    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.moveForward = 1
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.moveForward = -1
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.moveRight = 1
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.moveRight = -1

    if (e.code === 'Space') this.isJumping = true
    if (e.code === 'ControlLeft' || e.code === 'KeyC') this.isCrouching = true
    if (e.code === 'ShiftLeft') this.isSprinting = true

    if (e.code === 'KeyR') this.reloadRequested = true

    if (e.code === 'Digit1') this.requestedSlot = 1
    if (e.code === 'Digit2') this.requestedSlot = 2
    if (e.code === 'Digit3') this.requestedSlot = 3
  }

  private onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Tab') {
      e.preventDefault()
      useGameStore.getState().setIsScoreboardOpen(false)
      return
    }

    if ((e.code === 'KeyW' || e.code === 'ArrowUp') && this.moveForward === 1) this.moveForward = 0
    if ((e.code === 'KeyS' || e.code === 'ArrowDown') && this.moveForward === -1) this.moveForward = 0
    if ((e.code === 'KeyD' || e.code === 'ArrowRight') && this.moveRight === 1) this.moveRight = 0
    if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && this.moveRight === -1) this.moveRight = 0

    if (e.code === 'Space') this.isJumping = false
    if (e.code === 'ControlLeft' || e.code === 'KeyC') this.isCrouching = false
    if (e.code === 'ShiftLeft') this.isSprinting = false
  }

  // --- Mobile Touch API Methods ---
  public setMobileMove(x: number, y: number) {
    this.mobileMoveX = x
    this.mobileMoveY = -y // Joystick up is negative Y in screen space, positive forward in world
  }

  public addMobileLook(dx: number, dy: number) {
    const { touchSensitivity, invertY } = useSettingsStore.getState()
    const factor = 0.0035 * touchSensitivity
    this.lookDeltaX += dx * factor
    this.lookDeltaY += (invertY ? -1 : 1) * dy * factor
  }

  public setMobileAction(action: 'shoot' | 'jump' | 'crouch' | 'reload' | 'aim', active: boolean) {
    switch (action) {
      case 'shoot':
        this.isShooting = active
        break
      case 'jump':
        this.isJumping = active
        break
      case 'crouch':
        this.isCrouching = active
        break
      case 'reload':
        if (active) this.reloadRequested = true
        break
      case 'aim':
        if (active) {
          this.isAiming = !this.isAiming
          useGameStore.getState().setIsAiming(this.isAiming)
        }
        break
    }
  }

  public setRequestedSlot(slot: WeaponSlot) {
    this.requestedSlot = slot
  }

  // Called at the end of each frame to reset per-frame deltas
  public consumeFrameDeltas() {
    const dx = this.lookDeltaX
    const dy = this.lookDeltaY
    this.lookDeltaX = 0
    this.lookDeltaY = 0

    const reload = this.reloadRequested
    this.reloadRequested = false

    const slot = this.requestedSlot
    this.requestedSlot = null

    // Combined movement
    let fwd = this.moveForward
    let rgt = this.moveRight

    if (Math.abs(this.mobileMoveY) > 0.1) fwd = this.mobileMoveY
    if (Math.abs(this.mobileMoveX) > 0.1) rgt = this.mobileMoveX

    return {
      dx,
      dy,
      fwd,
      rgt,
      jump: this.isJumping,
      crouch: this.isCrouching,
      sprint: this.isSprinting,
      shoot: this.isShooting,
      aim: this.isAiming,
      reload,
      slot
    }
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDownBound)
    window.removeEventListener('keyup', this.onKeyUpBound)
    window.removeEventListener('mousemove', this.onMouseMoveBound)
    window.removeEventListener('mousedown', this.onMouseDownBound)
    window.removeEventListener('mouseup', this.onMouseUpBound)
    document.removeEventListener('pointerlockchange', this.onPointerLockChangeBound)
  }
}
