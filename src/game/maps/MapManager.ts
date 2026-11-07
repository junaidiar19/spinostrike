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
    subtitle: 'Inspired by de_dust2 (240m x 240m)',
    theme: 'Desert Tactical',
    description: 'Area gurun 240m x 240m yang diperluas dengan jalur A-Long berkolonade pilar, menara sniper 7m, B-Tunnels labirin bawah tanah, pasar bazaar Mid, dan manuver Tank tempur.',
    accentColor: '#d4b278',
    previewImage: '/maps/dust_arena.jpg'
  },
  warehouse: {
    id: 'warehouse',
    name: 'Tactical Warehouse',
    subtitle: 'Industrial Mega Hangar (190m x 230m)',
    theme: 'Industrial Hangar',
    description: 'Gudang mega 190m x 230m dengan mezzanine catwalk ganda, jembatan penyeberangan langit 128m, kontainer bertingkat 3, dermaga kargo truk, dan jalur manuver Tank.',
    accentColor: '#3a86ff',
    previewImage: '/maps/warehouse.jpg'
  },
  arctic_outpost: {
    id: 'arctic_outpost',
    name: 'Arctic Outpost',
    subtitle: 'Sub-Zero High Vantage Base (240m x 240m)',
    theme: 'Arctic Military',
    description: 'Pangkalan militer salju 240m x 240m dengan menara sniper 7.5m terhubung jembatan gantung skywalk, landasan helipad militer 36m, stasiun radar kubah, dan depo bahan bakar.',
    accentColor: '#38bdf8',
    previewImage: '/maps/arctic_outpost.jpg'
  },
  italian_villa: {
    id: 'italian_villa',
    name: 'Italian Villa',
    subtitle: 'Piazza & Cobblestone Streets (240m x 240m)',
    theme: 'European Mediterranean',
    description: 'Kota klasik Eropa 240m x 240m dengan alun-alun piazza marmer, menara lonceng campanile 8.5m, Bistro & Kedai Kopi Nusantara, lorong anggur, dan jalanan luas pertempuran Tank.',
    accentColor: '#ea580c',
    previewImage: '/maps/italian_villa.jpg'
  },
  cargo_harbor: {
    id: 'cargo_harbor',
    name: 'Cargo Harbor',
    subtitle: 'Maritime Gantry Crane & Docks (240m x 240m)',
    theme: 'Maritime Industrial',
    description: 'Dermaga pelabuhan samudra 240m x 240m dengan catwalk derek gantry 8.8m, terminal pabean & karantina bea cukai, labirin kontainer 3 tingkat, tepian dermaga kapal, dan rambu maritim.',
    accentColor: '#eab308',
    previewImage: '/maps/cargo_harbor.jpg'
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
  public ctSpawn = new THREE.Vector3(0, 1.5, 96)
  public tSpawn = new THREE.Vector3(0, 1.5, -96)
  public botWaypoints: THREE.Vector3[] = []
  public mapBounds = { x: 116, z: 116 }

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
      this.mapBounds = { x: 116, z: 116 }
    } else if (mapId === 'warehouse') {
      this.warehouse.build(this.physics)
      this.scene.add(this.warehouse.group)
      this.collidableMeshes = this.warehouse.collidableMeshes
      this.ctSpawn.copy(this.warehouse.ctSpawn)
      this.tSpawn.copy(this.warehouse.tSpawn)
      this.botWaypoints = this.warehouse.botWaypoints
      this.mapBounds = { x: 92, z: 112 }
    } else if (mapId === 'arctic_outpost') {
      this.arcticOutpost.build(this.physics)
      this.scene.add(this.arcticOutpost.group)
      this.collidableMeshes = this.arcticOutpost.collidableMeshes
      this.ctSpawn.copy(this.arcticOutpost.ctSpawn)
      this.tSpawn.copy(this.arcticOutpost.tSpawn)
      this.botWaypoints = this.arcticOutpost.botWaypoints
      this.mapBounds = { x: 116, z: 116 }
    } else if (mapId === 'italian_villa') {
      this.italianVilla.build(this.physics)
      this.scene.add(this.italianVilla.group)
      this.collidableMeshes = this.italianVilla.collidableMeshes
      this.ctSpawn.copy(this.italianVilla.ctSpawn)
      this.tSpawn.copy(this.italianVilla.tSpawn)
      this.botWaypoints = this.italianVilla.botWaypoints
      this.mapBounds = { x: 116, z: 116 }
    } else if (mapId === 'cargo_harbor') {
      this.cargoHarbor.build(this.physics)
      this.scene.add(this.cargoHarbor.group)
      this.collidableMeshes = this.cargoHarbor.collidableMeshes
      this.ctSpawn.copy(this.cargoHarbor.ctSpawn)
      this.tSpawn.copy(this.cargoHarbor.tSpawn)
      this.botWaypoints = this.cargoHarbor.botWaypoints
      this.mapBounds = { x: 116, z: 116 }
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
