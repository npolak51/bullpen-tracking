/**
 * Right-handed batter silhouette from catcher's perspective.
 * Uses mix-blend-mode to remove black background; scaled larger than grid.
 */

const SILHOUETTE_SCALE = 1.54

interface BatterSilhouetteProps {
  height: number
}

export function BatterSilhouette({ height }: BatterSilhouetteProps) {
  return (
    <img
      src="/batter-silhouette.png"
      alt="Right-handed batter"
      style={{
        height: height * SILHOUETTE_SCALE,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        filter: 'brightness(1.2)',
        mixBlendMode: 'screen',
        transform: 'translateY(-5px)',
      }}
    />
  )
}
