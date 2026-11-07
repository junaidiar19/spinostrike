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
    ctSpawn: THREE.Vector3,
    bulletManager?: any
  ) {
    this.cleanup()

    const botProfiles: { id: string; name: string; team: Team; spawn: THREE.Vector3 }[] = [
      // CT Team (Allies)
      { id: 'bot-3', name: 'Bot Ghost', team: 'CT', spawn: ctSpawn.clone().add(new THREE.Vector3(-4, 0, 2)) },
      { id: 'bot-5', name: 'Bot Falcon', team: 'CT', spawn: ctSpawn.clone().add(new THREE.Vector3(4, 0, 2)) },
      { id: 'bot-6', name: 'Bot Hawk', team: 'CT', spawn: ctSpawn.clone().add(new THREE.Vector3(-8, 0, -3)) },

      // T Team (Enemies)
      { id: 'bot-1', name: 'Bot Bravo', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(-5, 0, -2)) },
      { id: 'bot-2', name: 'Bot Viper', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(5, 0, -2)) },
      { id: 'bot-4', name: 'Bot Rex', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(0, 0, 4)) },
      { id: 'bot-7', name: 'Bot Shadow', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(-10, 0, 2)) },
      { id: 'bot-8', name: 'Bot Titan', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(10, 0, 2)) },
      { id: 'bot-9', name: 'Bot Cobra', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(-7, 0, -7)) },
      { id: 'bot-10', name: 'Bot Hunter', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(7, 0, -7)) },
      { id: 'bot-11', name: 'Bot Reaper', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(-3, 0, 8)) },
      { id: 'bot-12', name: 'Bot Wolf', team: 'T', spawn: tSpawn.clone().add(new THREE.Vector3(3, 0, 8)) }
    ]

    botProfiles.forEach((profile) => {
      profile.spawn.y = 0 // Ground floor level - no more floating!
      const bot = new Bot(profile.id, profile.name, profile.team, profile.spawn, waypoints, bulletManager)
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
