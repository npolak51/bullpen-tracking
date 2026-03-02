import { useRef, useState, useEffect } from 'react'
import {
  GRID_SIZE,
  STRIKE_SIZE,
  STRIKE_OFFSET,
  CELL_WIDTH,
  CELL_HEIGHT,
  GAP,
} from '../lib/strikeZoneConstants'

const CIRCLE_SIZE_RATIO = 0.48
const CIRCLE_DIAMETER = Math.min(CELL_WIDTH, CELL_HEIGHT) * CIRCLE_SIZE_RATIO

interface StrikeZoneProps {
  intendedCells: { row: number; col: number }[]
  actualPosition: { x: number; y: number } | null
  onIntendedSet: (cells: { row: number; col: number }[]) => void
  onActualPlace: (x: number, y: number) => void
  onActualCommit?: (x: number, y: number) => void
  selecting: 'intended' | 'actual'
  pitchColor: string
}

function isStrikeZone(row: number, col: number): boolean {
  return (
    row >= STRIKE_OFFSET &&
    row < STRIKE_OFFSET + STRIKE_SIZE &&
    col >= STRIKE_OFFSET &&
    col < STRIKE_OFFSET + STRIKE_SIZE
  )
}

function getCellFromPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect
): { row: number; col: number } | null {
  const x = ((clientX - rect.left) / rect.width) * GRID_SIZE
  const y = ((clientY - rect.top) / rect.height) * GRID_SIZE
  const col = Math.floor(x)
  const row = Math.floor(y)
  if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
    return { row, col }
  }
  return null
}

function getGridCoords(
  clientX: number,
  clientY: number,
  rect: DOMRect
): { x: number; y: number } {
  const x = ((clientX - rect.left) / rect.width) * GRID_SIZE
  const y = ((clientY - rect.top) / rect.height) * GRID_SIZE
  return {
    x: Math.max(0, Math.min(GRID_SIZE, x)),
    y: Math.max(0, Math.min(GRID_SIZE, y)),
  }
}

function getCellsInRect(
  start: { row: number; col: number },
  end: { row: number; col: number }
): { row: number; col: number }[] {
  const minRow = Math.min(start.row, end.row)
  const maxRow = Math.max(start.row, end.row)
  const minCol = Math.min(start.col, end.col)
  const maxCol = Math.max(start.col, end.col)
  const cells: { row: number; col: number }[] = []
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        cells.push({ row: r, col: c })
      }
    }
  }
  return cells
}

export function StrikeZone({
  intendedCells,
  actualPosition,
  onIntendedSet,
  onActualPlace,
  onActualCommit,
  selecting,
  pitchColor,
}: StrikeZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null)
  const [isDraggingActual, setIsDraggingActual] = useState(false)
  const lastActualRef = useRef<{ x: number; y: number } | null>(null)

  function getRect() {
    return containerRef.current?.getBoundingClientRect()
  }

  function getClientCoords(e: React.MouseEvent | React.TouchEvent) {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    }
    return { clientX: e.clientX, clientY: e.clientY }
  }

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    const rect = getRect()
    if (!rect) return

    const { clientX, clientY } = getClientCoords(e)

    if (selecting === 'actual') {
      const { x, y } = getGridCoords(clientX, clientY, rect)
      setIsDraggingActual(true)
      lastActualRef.current = { x, y }
      onActualPlace(x, y)
      return
    }

    const cell = getCellFromPoint(clientX, clientY, rect)
    if (cell) {
      setDragStart(cell)
      setDragEnd(cell)
    }
  }

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (selecting === 'actual' && isDraggingActual) {
      const rect = getRect()
      if (!rect) return
      const { clientX, clientY } = getClientCoords(e)
      const { x, y } = getGridCoords(clientX, clientY, rect)
      lastActualRef.current = { x, y }
      onActualPlace(x, y)
      return
    }

    if (selecting !== 'intended' || !dragStart) return

    const rect = getRect()
    if (!rect) return

    const { clientX, clientY } = getClientCoords(e)
    const cell = getCellFromPoint(clientX, clientY, rect)
    if (cell) setDragEnd(cell)
  }

  function handlePointerUp() {
    if (selecting === 'actual' && isDraggingActual) {
      const pos = lastActualRef.current
      setIsDraggingActual(false)
      if (pos) onActualCommit?.(pos.x, pos.y)
      lastActualRef.current = null
      return
    }

    if (selecting === 'intended' && dragStart && dragEnd) {
      const cells = getCellsInRect(dragStart, dragEnd)
      if (cells.length > 0) onIntendedSet(cells)
    }
    setDragStart(null)
    setDragEnd(null)
  }

  // Cells to show as selected: either from props or drag preview
  const displayCells =
    dragStart && dragEnd ? getCellsInRect(dragStart, dragEnd) : intendedCells

  const isIntended = (row: number, col: number) =>
    displayCells.some((c) => c.row === row && c.col === col)

  const strikeZoneWidth = STRIKE_SIZE * CELL_WIDTH + (STRIKE_SIZE - 1) * GAP
  const strikeZoneHeight = STRIKE_SIZE * CELL_HEIGHT + (STRIKE_SIZE - 1) * GAP
  const strikeZoneLeft = STRIKE_OFFSET * CELL_WIDTH + STRIKE_OFFSET * GAP + 2
  const strikeZoneTop = STRIKE_OFFSET * CELL_HEIGHT + STRIKE_OFFSET * GAP + 2

  // Prevent scroll when dragging on touch devices
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: TouchEvent) => {
      if (dragStart || isDraggingActual) e.preventDefault()
    }
    el.addEventListener('touchmove', handler, { passive: false })
    return () => el.removeEventListener('touchmove', handler)
  }, [dragStart, isDraggingActual])

  return (
    <div
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: GRID_SIZE * CELL_WIDTH + (GRID_SIZE - 1) * GAP + 4,
        height: GRID_SIZE * CELL_HEIGHT + (GRID_SIZE - 1) * GAP + 4,
        marginTop: 28,
        marginLeft: 7,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* 5x5 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_WIDTH}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_HEIGHT}px)`,
          gap: GAP,
          backgroundColor: '#1e293b',
          borderRadius: 8,
          padding: 2,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          const row = Math.floor(i / GRID_SIZE)
          const col = i % GRID_SIZE
          const isStrike = isStrikeZone(row, col)
          const selected = isIntended(row, col)

          return (
            <div
              key={`${row}-${col}`}
              style={{
                width: CELL_WIDTH - 2,
                height: CELL_HEIGHT - 2,
                border: '1px solid #475569',
                borderRadius: 4,
                backgroundColor: selected ? pitchColor : isStrike ? '#334155' : '#475569',
                opacity: 1,
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>

      {/* White border around center 3x3 strike zone */}
      <div
        style={{
          position: 'absolute',
          left: strikeZoneLeft,
          top: strikeZoneTop,
          width: strikeZoneWidth,
          height: strikeZoneHeight,
          border: '3px solid white',
          borderRadius: 2,
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Actual pitch circle (offset up when dragging so finger doesn't obscure it) */}
      {actualPosition && (
        <div
          style={{
            position: 'absolute',
            left: `calc(${(actualPosition.x / GRID_SIZE) * 100}% - ${CIRCLE_DIAMETER / 2}px)`,
            top: `calc(${(actualPosition.y / GRID_SIZE) * 100}% - ${CIRCLE_DIAMETER / 2}px)`,
            width: CIRCLE_DIAMETER,
            height: CIRCLE_DIAMETER,
            borderRadius: '50%',
            backgroundColor: pitchColor,
            border: '2px solid white',
            pointerEvents: 'none',
            transform: isDraggingActual ? 'translateY(-18px)' : undefined,
          }}
        />
      )}
    </div>
  )
}
