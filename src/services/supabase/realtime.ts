import * as THREE from 'three'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './client'
import { audioManager } from '../../game/core/AudioManager'
import { useGameStore } from '../../stores/useGameStore'
import { useRoomStore } from '../../stores/useRoomStore'
import { gameEngine } from '../../game/core/GameEngine'
import { RemotePlayer } from '../../game/entities/RemotePlayer'
import type { Team, WeaponId } from '../../types/game.types'

export interface RoomPlayerPresence {
  id: string
  name: string
  team: Team
  kills: number
  deaths: number
  score: number
  isReady: boolean
  joinedAt: number
}

export interface PlayerMovePayload {
  id: string
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  weaponId: WeaponId
  isCrouching?: boolean
}

export interface PlayerKillPayload {
  killerId: string
  killerName: string
  killerTeam: Team
  victimId: string
  victimName: string
  victimTeam: Team
  weaponName: string
  isHeadshot: boolean
}

export interface PlayerShootPayload {
  id: string
  ox: number
  oy: number
  oz: number
  dx: number
  dy: number
  dz: number
  weaponId: WeaponId
}

export interface PlayerDamagePayload {
  targetId: string
  damage: number
  isHeadshot: boolean
  killerId: string
  killerName: string
  killerTeam: Team
  weaponName: string
}

export class RealtimeManager {
  private channel: RealtimeChannel | null = null
  public currentRoomId: string | null = null
  public remotePlayers: Map<string, RemotePlayer> = new Map()
  private localPlayerId: string = ''
  private broadcastIntervalId: number | null = null

  public async joinRoom(
    roomId: string,
    playerInfo: { id: string; name: string; team: Team }
  ): Promise<boolean> {
    this.leaveRoom()
    this.currentRoomId = roomId
    this.localPlayerId = playerInfo.id

    const channelName = `spinostrike_room_${roomId}`
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: playerInfo.id }
      }
    })

    // 1. Presence Listeners
    this.channel
      .on('presence', { event: 'sync' }, () => {
        if (!this.channel) return
        const state = this.channel.presenceState<RoomPlayerPresence>()
        this.handlePresenceSync(state)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p) => {
          const player = p as unknown as RoomPlayerPresence
          if (player.id !== this.localPlayerId) {
            let cleanName = player.name || 'Striker'
            if (cleanName.toLowerCase().startsWith('operative_')) {
              cleanName = 'Striker_' + player.id.slice(-4)
            }
            this.getOrCreateRemotePlayer(player.id, cleanName, player.team)
            useGameStore.getState().addOrUpdatePlayerScore({
              id: player.id,
              name: cleanName,
              team: player.team,
              kills: player.kills || 0,
              deaths: player.deaths || 0,
              score: player.score || 0,
              ping: Math.floor(15 + Math.random() * 15),
              isBot: false
            })
          }
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p) => {
          const player = p as unknown as RoomPlayerPresence
          this.removeRemotePlayer(player.id)
          useGameStore.getState().removePlayerScore(player.id)
        })
      })

    // 2. Broadcast Listeners
    this.channel
      .on('broadcast', { event: 'player_move' }, ({ payload }) => {
        this.handleRemoteMove(payload as PlayerMovePayload)
      })
      .on('broadcast', { event: 'player_shoot' }, ({ payload }) => {
        this.handleRemoteShoot(payload as PlayerShootPayload)
      })
      .on('broadcast', { event: 'player_damaged' }, ({ payload }) => {
        this.handleRemoteDamage(payload as PlayerDamagePayload)
      })
      .on('broadcast', { event: 'player_killed' }, ({ payload }) => {
        this.handleRemoteKill(payload as PlayerKillPayload)
      })

    // 3. Subscribe & Track
    return new Promise((resolve) => {
      this.channel?.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel?.track({
            id: playerInfo.id,
            name: playerInfo.name,
            team: playerInfo.team,
            kills: 0,
            deaths: 0,
            score: 0,
            isReady: true,
            joinedAt: Date.now()
          })

          this.startPositionBroadcast()
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  private startPositionBroadcast() {
    if (this.broadcastIntervalId) clearInterval(this.broadcastIntervalId)

    // Broadcast at ~25 Hz (every 40ms)
    this.broadcastIntervalId = window.setInterval(() => {
      if (!this.channel || !gameEngine.player) return
      const store = useGameStore.getState()
      if (store.gameStatus !== 'PLAYING') return

      const pos = gameEngine.player.position
      const payload: PlayerMovePayload = {
        id: this.localPlayerId,
        x: Number(pos.x.toFixed(3)),
        y: Number(pos.y.toFixed(3)),
        z: Number(pos.z.toFixed(3)),
        yaw: Number(gameEngine.player.yaw.toFixed(3)),
        pitch: Number(gameEngine.player.pitch.toFixed(3)),
        weaponId: store.activeWeaponId,
        isCrouching: gameEngine.player.isCrouching
      }

      this.channel.send({
        type: 'broadcast',
        event: 'player_move',
        payload
      })
    }, 40)
  }

  public broadcastShoot(
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number },
    weaponId: WeaponId
  ) {
    if (!this.channel) return
    const payload: PlayerShootPayload = {
      id: this.localPlayerId,
      ox: Number(origin.x.toFixed(3)),
      oy: Number(origin.y.toFixed(3)),
      oz: Number(origin.z.toFixed(3)),
      dx: Number(direction.x.toFixed(3)),
      dy: Number(direction.y.toFixed(3)),
      dz: Number(direction.z.toFixed(3)),
      weaponId
    }

    this.channel.send({
      type: 'broadcast',
      event: 'player_shoot',
      payload
    })
  }

  public broadcastDamage(
    targetId: string,
    damage: number,
    isHeadshot: boolean,
    killerName: string,
    killerTeam: Team,
    weaponName: string
  ) {
    if (!this.channel) return
    const payload: PlayerDamagePayload = {
      targetId,
      damage,
      isHeadshot,
      killerId: this.localPlayerId,
      killerName,
      killerTeam,
      weaponName
    }

    this.channel.send({
      type: 'broadcast',
      event: 'player_damaged',
      payload
    })
  }

  private handleRemoteMove(data: PlayerMovePayload) {
    if (data.id === this.localPlayerId) return
    const remote = this.remotePlayers.get(data.id)
    if (remote) {
      // Offset eye height (1.65 standing / 1.0 crouching) so boots are firmly planted on the ground (y = 0)
      const eyeHeight = data.isCrouching ? 1.0 : 1.65
      const groundY = Math.max(0, data.y - eyeHeight)
      remote.targetPosition.set(data.x, groundY, data.z)
      remote.targetYaw = data.yaw
      remote.targetPitch = data.pitch
      remote.activeWeapon = data.weaponId
    }
  }

  private handleRemoteShoot(data: PlayerShootPayload) {
    if (data.id === this.localPlayerId) return
    // Play gunshot sound for remote player
    audioManager.playGunshot(data.weaponId)

    // Render tracer in scene
    if (gameEngine.bulletManager) {
      const orig = new THREE.Vector3(data.ox, data.oy, data.oz)
      const dir = new THREE.Vector3(data.dx, data.dy, data.dz)
      gameEngine.bulletManager.fireBullet(orig, dir, data.weaponId, [])
    }
  }

  private handleRemoteDamage(data: PlayerDamagePayload) {
    // If local player is the target of damage
    if (data.targetId === this.localPlayerId) {
      const myTeam = useRoomStore.getState().myTeam
      // Friendly fire protection: No damage from teammates!
      if (data.killerTeam === myTeam) return

      const store = useGameStore.getState()
      if (store.isPlayerDead || store.spawnProtection > 0 || store.matchGraceTimer > 0) return

      const newHp = Math.max(0, store.health - data.damage)
      store.setHealth(newHp)
      store.triggerDamageFlash()

      if (newHp <= 0 && !store.isPlayerDead) {
        store.recordPlayerDeath(
          data.killerId,
          data.killerName,
          data.killerTeam,
          data.weaponName
        )
        const myName = store.scoreboard.find((p) => p.id === 'player-1')?.name?.replace(' (You)', '') || 'Striker'
        this.broadcastKill({
          killerId: data.killerId,
          killerName: data.killerName,
          killerTeam: data.killerTeam,
          victimId: this.localPlayerId,
          victimName: myName,
          victimTeam: myTeam,
          weaponName: data.weaponName,
          isHeadshot: data.isHeadshot
        })
      }
    }
  }

  public broadcastKill(payload: PlayerKillPayload) {
    if (!this.channel) return
    this.channel.send({
      type: 'broadcast',
      event: 'player_killed',
      payload
    })
  }

  private handleRemoteKill(data: PlayerKillPayload) {
    const store = useGameStore.getState()
    // If neither killer nor victim is the local player (local player already recorded their own event)
    if (data.killerId !== this.localPlayerId && data.victimId !== this.localPlayerId) {
      store.addKillFeed({
        killerName: data.killerName,
        killerTeam: data.killerTeam,
        victimName: data.victimName,
        victimTeam: data.victimTeam,
        weaponName: data.weaponName,
        isHeadshot: data.isHeadshot
      })

      const updated = store.scoreboard.map((p) => {
        if (p.id === data.killerId) {
          return { ...p, kills: p.kills + 1, score: p.score + (data.isHeadshot ? 150 : 100) }
        }
        if (p.id === data.victimId) {
          return { ...p, deaths: p.deaths + 1 }
        }
        return p
      })
      store.setScoreboard(updated)
    }
  }

  private handlePresenceSync(state: Record<string, RoomPlayerPresence[]>) {
    const activeIds = new Set<string>()
    const store = useGameStore.getState()

    Object.values(state).forEach((presences) => {
      presences.forEach((p) => {
        activeIds.add(p.id)
        if (p.id !== this.localPlayerId) {
          let cleanName = p.name || 'Striker'
          if (cleanName.toLowerCase().startsWith('operative_')) {
            cleanName = 'Striker_' + p.id.slice(-4)
          }
          this.getOrCreateRemotePlayer(p.id, cleanName, p.team)
          store.addOrUpdatePlayerScore({
            id: p.id,
            name: cleanName,
            team: p.team,
            kills: p.kills || 0,
            deaths: p.deaths || 0,
            score: p.score || 0,
            ping: Math.floor(15 + Math.random() * 15),
            isBot: false
          })
        }
      })
    })

    // Remove disconnected players
    this.remotePlayers.forEach((_, id) => {
      if (!activeIds.has(id)) {
        this.removeRemotePlayer(id)
        store.removePlayerScore(id)
      }
    })
  }

  private getOrCreateRemotePlayer(id: string, name: string, team: Team): RemotePlayer {
    let remote = this.remotePlayers.get(id)
    if (!remote) {
      const spawn = team === 'CT' ? gameEngine.mapManager.ctSpawn : gameEngine.mapManager.tSpawn
      remote = new RemotePlayer(id, name, team, spawn)
      this.remotePlayers.set(id, remote)
      gameEngine.scene.add(remote.mesh)
    }
    return remote
  }

  private removeRemotePlayer(id: string) {
    const remote = this.remotePlayers.get(id)
    if (remote) {
      gameEngine.scene.remove(remote.mesh)
      remote.destroy()
      this.remotePlayers.delete(id)
    }
  }

  public update(dt: number) {
    this.remotePlayers.forEach((remote) => {
      remote.update(dt)
    })
  }

  public leaveRoom() {
    if (this.broadcastIntervalId) {
      clearInterval(this.broadcastIntervalId)
      this.broadcastIntervalId = null
    }

    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }

    this.remotePlayers.forEach((remote, id) => {
      gameEngine.scene.remove(remote.mesh)
      remote.destroy()
      useGameStore.getState().removePlayerScore(id)
    })
    this.remotePlayers.clear()
    this.currentRoomId = null
  }
}

export const realtimeManager = new RealtimeManager()
