/**
 * Offline queue and sync for Bullpen Tracker.
 * When offline: queue writes to IndexedDB.
 * When online: replay queue to Supabase.
 */

import { useEffect, useRef } from 'react'
import { openDB } from 'idb'
import { supabase } from './supabase'
import type { Player } from '../types/database'
import type { PitchType } from '../types/database'

const DB_NAME = 'bullpen-offline'
const DB_VERSION = 1

export type PendingOp =
  | { type: 'add_player'; tempId: string; data: { name: string } }
  | { type: 'start_session'; tempId: string; data: { player_id: string } }
  | {
      type: 'add_pitch'
      data: {
        session_id: string
        pitch_type: PitchType
        intended_cells: { row: number; col: number }[]
        actual_x: number
        actual_y: number
        velocity: number | null
        sequence_order: number
      }
    }
  | { type: 'complete_session'; data: { session_id: string } }

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache')
      }
    },
  })
}

export function isOnline(): boolean {
  return navigator.onLine
}

export async function addToQueue(op: PendingOp): Promise<string | null> {
  const db = await getDB()
  await db.add('pending', { ...op, createdAt: Date.now() })
  if ('tempId' in op) return op.tempId
  return null
}

export async function getQueue(): Promise<(PendingOp & { id: number })[]> {
  const db = await getDB()
  const all = await db.getAll('pending') as (PendingOp & { id: number; createdAt: number })[]
  return all.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
}

export async function removeFromQueue(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('pending', id)
}

export async function clearQueue(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('pending', 'readwrite')
  await tx.objectStore('pending').clear()
  await tx.done
}

export async function getCachedPlayers(): Promise<Player[]> {
  const db = await getDB()
  const cached = await db.get('cache', 'players')
  return cached ?? []
}

export async function setCachedPlayers(players: Player[]): Promise<void> {
  const db = await getDB()
  await db.put('cache', players, 'players')
}

export async function addPendingPlayerToCache(player: Player): Promise<void> {
  const players = await getCachedPlayers()
  players.push(player)
  await setCachedPlayers(players)
}

export async function syncQueue(onProgress?: (message: string) => void): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not configured' }
  if (!isOnline()) return { ok: false, error: 'Offline' }

  const queue = await getQueue()
  if (queue.length === 0) return { ok: true }

  const idMap = new Map<string, string>()

  for (const op of queue) {
    try {
      if (op.type === 'add_player') {
        onProgress?.('Syncing player…')
        const { data, error } = await supabase
          .from('players')
          .insert({ name: op.data.name })
          .select('id')
          .single()
        if (error) throw error
        idMap.set(op.tempId, data.id)
      } else if (op.type === 'start_session') {
        onProgress?.('Syncing session…')
        const realPlayerId = idMap.get(op.data.player_id) ?? op.data.player_id
        const { data, error } = await supabase
          .from('sessions')
          .insert({ player_id: realPlayerId })
          .select('id')
          .single()
        if (error) throw error
        idMap.set(op.tempId, data.id)
      } else if (op.type === 'add_pitch') {
        onProgress?.('Syncing pitches…')
        const realSessionId = idMap.get(op.data.session_id) ?? op.data.session_id
        await supabase.from('pitches').insert({
          session_id: realSessionId,
          pitch_type: op.data.pitch_type,
          intended_cells: op.data.intended_cells,
          actual_x: op.data.actual_x,
          actual_y: op.data.actual_y,
          velocity: op.data.velocity,
          sequence_order: op.data.sequence_order,
        })
      } else if (op.type === 'complete_session') {
        onProgress?.('Completing session…')
        const realSessionId = idMap.get(op.data.session_id) ?? op.data.session_id
        const { error } = await supabase
          .from('sessions')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', realSessionId)
        if (error) throw error
      }
      await removeFromQueue(op.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, error: msg }
    }
  }

  await clearQueue()
  onProgress?.('Sync complete')
  return { ok: true }
}

export function useOnlineStatus(callback: (online: boolean) => void): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const handle = () => callbackRef.current(navigator.onLine)
    handle()
    window.addEventListener('online', handle)
    window.addEventListener('offline', handle)
    return () => {
      window.removeEventListener('online', handle)
      window.removeEventListener('offline', handle)
    }
  }, [])
}
