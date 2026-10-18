import * as THREE from 'three'
import { DustArena } from './DustArena'
import { Warehouse } from './Warehouse'
import type { PhysicsWorld } from '../core/Physics'
import type { MapId, MapMetadata } from '../../types/game.types'

export const MAP_METADATA: Record<MapId, MapMetadata> = {
  dust_arena: {
    id: 'dust_arena',
    name: 'Sandstone Arena',
    subtitle: 'Inspired by de_dust2',
    theme: 'Desert Tactical',
    description: 'Area gurun terbuka dengan jalur Mid yang intens, titik sniper A-Long, dan lorong sempit B-Tunnels.',
    accentColor: '#d4b278'
  },
  warehouse: {
    id: 'warehouse',
    name: 'Tactical Warehouse',
    subtitle: 'Industrial Close-Quarters',
    theme: 'Industrial Hangar',
    description: 'Gudang logistik tertutup dengan tumpukan kontainer kargo dan catwalk lantai dua untuk baku tembak cepat.',
    accentColor: '#3a86ff'
  }
}

export class MapManager {
  private scene: THREE.Scene
  private physics: PhysicsWorld
  private currentMapId: MapId = 'dust_arena'
  private dustArena = new DustArena()
  private warehouse = new Warehouse()

  public collidableMeshes: THREE.Object3D[] = []
  public ctSpawn = new THREE.Vector3(0, 1.5, 25)
  public tSpawn = new THREE.Vector3(0, 1.5, -25)
  public botWaypoints: THREE.Vector3[] = []

  constructor(scene: THREE.Scene, physics: PhysicsWorld) {
    this.scene = scene
    this.physics = physics
  }

  public loadMap(mapId: MapId) {
    this.cleanup()
    this.currentMapId = mapId

    if (mapId === 'dust_arena') {
      this.dustArena.build(this.physics)
      this.scene.add(this.dustArena.group)
      this.collidableMeshes = this.dustArena.collidableMeshes
      this.ctSpawn.copy(this.dustArena.ctSpawn)
      this.tSpawn.copy(this.dustArena.tSpawn)
      this.botWaypoints = this.dustArena.botWaypoints
    } else {
      this.warehouse.build(this.physics)
      this.scene.add(this.warehouse.group)
      this.collidableMeshes = this.warehouse.collidableMeshes
      this.ctSpawn.copy(this.warehouse.ctSpawn)
      this.tSpawn.copy(this.warehouse.tSpawn)
      this.botWaypoints = this.warehouse.botWaypoints
    }
  }

  public getCurrentMapId(): MapId {
    return this.currentMapId
  }

  public cleanup() {
    this.scene.remove(this.dustArena.group)
    this.scene.remove(this.warehouse.group)
    this.dustArena.cleanup()
    this.warehouse.cleanup()
    this.collidableMeshes = []
  }
}
