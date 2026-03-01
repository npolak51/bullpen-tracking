/**
 * 5x5 grid with center 3x3 strike zone.
 * Strike zone: rows 1-3, cols 1-3 (0-indexed)
 * In coordinate space 0-5: strike zone is x in [1, 4], y in [1, 4]
 * "Touching" = within small margin of the box (ball radius ~0.15 of cell)
 */

const STRIKE_ZONE_MIN = 1
const STRIKE_ZONE_MAX = 3
const TOUCH_MARGIN = 0.2 // margin for "touching" the zone

export function isStrike(actual_x: number, actual_y: number): boolean {
  // Inside or touching the strike zone box
  const min = STRIKE_ZONE_MIN - TOUCH_MARGIN
  const max = STRIKE_ZONE_MAX + 1 + TOUCH_MARGIN // cell 3 extends to 4
  return (
    actual_x >= min &&
    actual_x <= max &&
    actual_y >= min &&
    actual_y <= max
  )
}

const INTENDED_MARGIN = 0.15 // pitches within this many cells of intended zone still count as 100%
const DISTANCE_PENALTY = 21 // per cell of distance

export function getAccuracy(
  intendedCells: { row: number; col: number }[],
  actual_x: number,
  actual_y: number
): number {
  if (intendedCells.length === 0) return 0

  // 100% if actual pitch lands within any intended cell (with small margin for "just barely outside")
  const inIntendedZone = intendedCells.some((c) => {
    const inCol =
      actual_x >= c.col - INTENDED_MARGIN && actual_x <= c.col + 1 + INTENDED_MARGIN
    const inRow =
      actual_y >= c.row - INTENDED_MARGIN && actual_y <= c.row + 1 + INTENDED_MARGIN
    return inCol && inRow
  })
  if (inIntendedZone) return 100

  // Otherwise, distance-based: center of intended area
  const centerX =
    intendedCells.reduce((sum, c) => sum + c.col, 0) / intendedCells.length + 0.5
  const centerY =
    intendedCells.reduce((sum, c) => sum + c.row, 0) / intendedCells.length + 0.5

  const distance = Math.sqrt(
    Math.pow(actual_x - centerX, 2) + Math.pow(actual_y - centerY, 2)
  )

  const accuracy = Math.round(Math.max(0, 100 - distance * DISTANCE_PENALTY))
  return Math.min(100, accuracy)
}
