import * as THREE from 'three'
import { DustArena } from './DustArena'
import { Warehouse } from './Warehouse'
import { ArcticOutpost } from './ArcticOutpost'
import { ItalianVilla } from './ItalianVilla'
import { CargoHarbor } from './CargoHarbor'
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
  },
  arctic_outpost: {
    id: 'arctic_outpost',
    name: 'Arctic Outpost',
    subtitle: 'Sub-Zero High Vantage Base',
    theme: 'Arctic Military',
    description: 'Pangkalan militer salju terbuka dengan menara observasi sniper 7m, atap bunker riset es, dan jembatan catwalk layang.',
    accentColor: '#38bdf8'
  },
  italian_villa: {
    id: 'italian_villa',
    name: 'Italian Villa',
    subtitle: 'Piazza & Cobblestone Streets',
    theme: 'European Mediterranean',
    description: 'Kawasan kota klasik Eropa dengan alun-alun piazza marmer, balkon villa 2 lantai untuk duel sniper, dan gang batu bersejarah.',
    accentColor: '#ea580c'
  },
  cargo_harbor: {
    id: 'cargo_harbor',
    name: 'Cargo Harbor',
    subtitle: 'Maritime Gantry Crane & Docks',
    theme: 'Maritime Industrial',
    description: 'Dermaga pelabuhan kargo terbuka dengan catwalk derek gantry raksasa 8m, tumpukan kontainer multi-tier, dan garis tembak panjang.',
    accentColor: '#eab308'
  }
}

export class MapManager {
  private scene: THREE.Scene
  private physics: PhysicsWorld
  private currentMapId: MapId = 'dust_arena'
  private dustArena = new DustArena()
  private warehouse = new Warehouse()
  private arcticOutpost = new ArcticOutpost()
  private italianVilla = new ItalianVilla()
  private cargoHarbor = new CargoHarbor()

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
    } else if (mapId === 'warehouse') {
      this.warehouse.build(this.physics)
      this.scene.add(this.warehouse.group)
      this.collidableMeshes = this.warehouse.collidableMeshes
      this.ctSpawn.copy(this.warehouse.ctSpawn)
      this.tSpawn.copy(this.warehouse.tSpawn)
      this.botWaypoints = this.warehouse.botWaypoints
    } else if (mapId === 'arctic_outpost') {
      this.arcticOutpost.build(this.physics)
      this.scene.add(this.arcticOutpost.group)
      this.collidableMeshes = this.arcticOutpost.collidableMeshes
      this.ctSpawn.copy(this.arcticOutpost.ctSpawn)
      this.tSpawn.copy(this.arcticOutpost.tSpawn)
      this.botWaypoints = this.arcticOutpost.botWaypoints
    } else if (mapId === 'italian_villa') {
      this.italianVilla.build(this.physics)
      this.scene.add(this.italianVilla.group)
      this.collidableMeshes = this.italianVilla.collidableMeshes
      this.ctSpawn.copy(this.italianVilla.ctSpawn)
      this.tSpawn.copy(this.italianVilla.tSpawn)
      this.botWaypoints = this.italianVilla.botWaypoints
    } else if (mapId === 'cargo_harbor') {
      this.cargoHarbor.build(this.physics)
      this.scene.add(this.cargoHarbor.group)
      this.collidableMeshes = this.cargoHarbor.collidableMeshes
      this.ctSpawn.copy(this.cargoHarbor.ctSpawn)
      this.tSpawn.copy(this.cargoHarbor.tSpawn)
      this.botWaypoints = this.cargoHarbor.botWaypoints
    }
  }

  public getCurrentMapId(): MapId {
    return this.currentMapId
  }

  public cleanup() {
    this.scene.remove(this.dustArena.group)
    this.scene.remove(this.warehouse.group)
    this.scene.remove(this.arcticOutpost.group)
    this.scene.remove(this.italianVilla.group)
    this.scene.remove(this.cargoHarbor.group)

    this.dustArena.cleanup()
    this.warehouse.cleanup()
    this.arcticOutpost.cleanup()
    this.italianVilla.cleanup()
    this.cargoHarbor.cleanup()

    this.collidableMeshes = []
  }
}
