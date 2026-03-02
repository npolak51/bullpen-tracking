/**
 * API for custom pitch types.
 */

import { supabase } from './supabase'
import { PITCH_TYPE_COLORS } from '../types/database'
import { CUSTOM_COLOR_POOL, toPitchTypeSlug } from './pitchTypes'
import type { CustomPitchType } from '../types/database'

const BUILT_IN_COLORS = Object.values(PITCH_TYPE_COLORS)

export async function fetchCustomPitchTypes(): Promise<CustomPitchType[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('custom_pitch_types')
    .select('id, name, color, created_at')
    .order('created_at')
  if (error) return []
  return data ?? []
}

function getNextAvailableColor(existing: CustomPitchType[]): string {
  const used = new Set([
    ...BUILT_IN_COLORS,
    ...existing.map((c) => c.color),
  ])
  for (const c of CUSTOM_COLOR_POOL) {
    if (!used.has(c)) return c
  }
  return CUSTOM_COLOR_POOL[0]
}

export async function addCustomPitchType(
  displayName: string
): Promise<{ name: string; color: string } | { error: string }> {
  if (!supabase) return { error: 'Supabase not configured' }
  const name = toPitchTypeSlug(displayName)
  if (!name) return { error: 'Please enter a pitch type name' }
  if (name.length > 40) return { error: 'Name too long' }

  const existing = await fetchCustomPitchTypes()
  if (existing.some((c) => c.name === name)) {
    return { error: 'This pitch type already exists' }
  }

  const color = getNextAvailableColor(existing)
  const { error } = await supabase.from('custom_pitch_types').insert({
    name,
    color,
  })
  if (error) return { error: error.message }
  return { name, color }
}
