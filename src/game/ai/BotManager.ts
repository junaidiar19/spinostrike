import * as THREE from 'three'
import { Bot } from '../entities/Bot'
import type { Team } from '../../types/game.types'

export class BotManager {
  private scene: THREE.Scene
  public bots: Bot[] = []
  public allHitboxes: THREE.Object3D[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  public spawnBots(
    waypoints: THREE.Vector3[],
    tSpawn: THREE.Vector3,
    ctSpawn: THREE.Vector3
  ) {
    this.cleanup()

    const botProfiles: { id: string; name: string; team: Team; spawn: THREE.Vector3 }[] = [
      { id: 'bot-1', name: 'Bot Bravo', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(-4, 0, 0)) },
      { id: 'bot-2', name: 'Bot Viper', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(4, 0, 0)) },
      { id: 'bot-3', name: 'Bot Ghost', team: 'CT', spawn: ctSpawn.clone().add(new THREE.Vector3(-4, 0, 0)) },
      { id: 'bot-4', name: 'Bot Rex', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(0, 0, 3)) }
    ]

    botProfiles.forEach((profile) => {
      const bot = new Bot(profile.id, profile.name, profile.team, profile.spawn, waypoints)
      this.bots.push(bot)
      this.scene.add(bot.mesh)
      this.allHitboxes.push(...bot.hitboxes)
    })
  }

  public update(dt: number, player: { position: THREE.Vector3 }, collidableMeshes: THREE.Object3D[]) {
    this.bots.forEach((bot) => {
      bot.setTargetPlayer(player)
      bot.update(dt, collidableMeshes)
    })
  }

  public cleanup() {
    this.bots.forEach((bot) => {
      this.scene.remove(bot.mesh)
    })
    this.bots = []
    this.allHitboxes = []
  }
}
