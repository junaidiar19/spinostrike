import * as THREE from 'three'
import { PhysicsWorld } from './Physics'
import { InputManager } from './InputManager'
import { audioManager } from './AudioManager'
import { BulletManager } from '../weapons/BulletManager'
import { MapManager } from '../maps/MapManager'
import { Player } from '../entities/Player'
import { BotManager } from '../ai/BotManager'
import { useGameStore } from '../../stores/useGameStore'
import { realtimeManager } from '../../services/supabase/realtime'
import type { MapId } from '../../types/game.types'

export class GameEngine {
  private container: HTMLElement | null = null
  private renderer!: THREE.WebGLRenderer
  public scene!: THREE.Scene
  public camera!: THREE.PerspectiveCamera

  // Core Subsystems
  public physics = new PhysicsWorld()
  public inputManager = new InputManager()
  public bulletManager!: BulletManager
  public mapManager!: MapManager
  public player!: Player
  public botManager!: BotManager

  // Lighting
  private dirLight!: THREE.DirectionalLight
  private ambientLight!: THREE.AmbientLight

  // Loop control
  private animationFrameId: number | null = null
  private lastTime = 0
  private isRunning = false

  public async init(container: HTMLElement) {
    this.container = container

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#87b5d8') // Sandstone sky
    this.scene.fog = new THREE.FogExp2('#87b5d8', 0.012)

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.05,
      500
    )

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05

    container.appendChild(this.renderer.domElement)

    // 3. Audio & Input
    audioManager.init()
    this.inputManager.init(container)

    // 4. Physics World (Rapier WASM)
    await this.physics.init()

    // 5. Lighting
    this.setupLighting()

    // 6. Subsystems
    this.bulletManager = new BulletManager(this.scene)
    this.mapManager = new MapManager(this.scene, this.physics)
    this.botManager = new BotManager(this.scene)
    this.player = new Player(this.camera, this.bulletManager)
    this.scene.add(this.camera)

    // 7. Load default map
    const defaultMap = useGameStore.getState().currentMap
    this.loadMap(defaultMap)

    // 8. Resize listener
    window.addEventListener('resize', this.onResizeBound)
  }

  private setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xd4e2f5, 0.75)
    this.scene.add(this.ambientLight)

    this.dirLight = new THREE.DirectionalLight(0xfffae8, 1.4)
    this.dirLight.position.set(25, 45, 20)
    this.dirLight.castShadow = true
    this.dirLight.shadow.mapSize.width = 2048
    this.dirLight.shadow.mapSize.height = 2048
    this.dirLight.shadow.camera.near = 0.5
    this.dirLight.shadow.camera.far = 120

    const d = 45
    this.dirLight.shadow.camera.left = -d
    this.dirLight.shadow.camera.right = d
    this.dirLight.shadow.camera.top = d
    this.dirLight.shadow.camera.bottom = -d
    this.dirLight.shadow.bias = -0.0005

    this.scene.add(this.dirLight)
  }

  public loadMap(mapId: MapId) {
    this.mapManager.loadMap(mapId)

    // Adjust sky / fog based on map theme
    if (mapId === 'warehouse') {
      this.scene.background = new THREE.Color('#161a22')
      this.scene.fog = new THREE.FogExp2('#161a22', 0.018)
      this.dirLight.intensity = 0.9
      this.ambientLight.intensity = 0.6
    } else {
      this.scene.background = new THREE.Color('#87b5d8')
      this.scene.fog = new THREE.FogExp2('#87b5d8', 0.012)
      this.dirLight.intensity = 1.4
      this.ambientLight.intensity = 0.75
    }

    // Place Player at CT Spawn
    this.player.respawn(this.mapManager.ctSpawn)
    const activeWeapon = useGameStore.getState().activeWeaponId
    this.player.initWeapon(activeWeapon)

    // Spawn Bots
    this.botManager.spawnBots(
      this.mapManager.botWaypoints,
      this.mapManager.tSpawn,
      this.mapManager.ctSpawn
    )
  }

  public start() {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop(this.lastTime)
  }

  public stop() {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05)
    this.lastTime = currentTime

    // 1. Step Physics
    this.physics.step(dt)

    // 2. Poll Input
    const frameInput = this.inputManager.consumeFrameDeltas()

    // Collect all hitboxes (Bots + Online Remote Players)
    const remoteHitboxes: THREE.Object3D[] = []
    realtimeManager.remotePlayers.forEach((p) => {
      remoteHitboxes.push(...p.hitboxes)
    })
    const allTargets = [...this.botManager.allHitboxes, ...remoteHitboxes]

    // 3. Update Player
    this.player.update(
      dt,
      frameInput,
      this.mapManager.collidableMeshes,
      allTargets
    )

    // 4. Update Bullet Tracers & Sparks
    this.bulletManager.update(dt)

    // 5. Update Bot AI
    this.botManager.update(dt, this.player, this.mapManager.collidableMeshes)

    // 6. Update Multiplayer Remote Players
    realtimeManager.update(dt)

    // 7. Render Frame
    this.renderer.render(this.scene, this.camera)

    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  private onResizeBound = () => {
    if (!this.container || !this.renderer || !this.camera) return
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  public destroy() {
    this.stop()
    window.removeEventListener('resize', this.onResizeBound)
    this.inputManager.destroy()
    this.physics.destroy()
    this.bulletManager.cleanup()
    this.mapManager.cleanup()
    this.botManager.cleanup()

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
    }
    this.renderer.dispose()
  }
}

export const gameEngine = new GameEngine()
