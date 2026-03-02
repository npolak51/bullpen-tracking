/**
 * Pitch type helpers: colors, labels, and custom type management.
 */

import {
  PITCH_TYPE_COLORS,
  PITCH_LABELS,
  type BuiltInPitchType,
  type CustomPitchType,
} from '../types/database'

export const BUILT_IN_TYPES: BuiltInPitchType[] = [
  'four_seam',
  'two_seam',
  'curveball',
  'slider',
  'splitter',
  'changeup',
]

// Colors for custom pitch types (distinct from built-in)
export const CUSTOM_COLOR_POOL = [
  '#f97316', // orange
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#84cc16', // lime
  '#0ea5e9', // sky
  '#d946ef', // fuchsia
]

function isBuiltIn(type: string): type is BuiltInPitchType {
  return BUILT_IN_TYPES.includes(type as BuiltInPitchType)
}

export function getPitchTypeColor(
  type: string,
  customTypes: CustomPitchType[] = []
): string {
  if (isBuiltIn(type)) return PITCH_TYPE_COLORS[type]
  const custom = customTypes.find((c) => c.name === type)
  return custom?.color ?? assignColorForNewType(type, customTypes)
}

/** Assign a color for a type not yet in customTypes (e.g. when offline or before sync) */
function assignColorForNewType(
  _type: string,
  customTypes: CustomPitchType[]
): string {
  const used = new Set([
    ...Object.values(PITCH_TYPE_COLORS),
    ...customTypes.map((c) => c.color),
  ])
  for (const c of CUSTOM_COLOR_POOL) {
    if (!used.has(c)) return c
  }
  return CUSTOM_COLOR_POOL[0]
}

export function getPitchTypeLabel(
  type: string,
  customTypes: CustomPitchType[] = []
): string {
  if (isBuiltIn(type)) return PITCH_LABELS[type]
  const custom = customTypes.find((c) => c.name === type)
  if (custom) return formatCustomPitchName(custom.name)
  return formatCustomPitchName(type)
}

/** "sweeping_slider" -> "Sweeping Slider" */
export function formatCustomPitchName(slug: string): string {
  return slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** "Sweeping Slider" -> "sweeping_slider" */
export function toPitchTypeSlug(displayName: string): string {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}
