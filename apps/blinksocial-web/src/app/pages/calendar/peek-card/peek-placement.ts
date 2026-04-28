export interface PeekAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacementSize {
  width: number;
  height: number;
}

export interface PlacementResult {
  left: number;
  top: number;
  flipped: boolean;
}

export const PEEK_PLACEMENT_GAP = 8;
export const PEEK_PLACEMENT_GUTTER = 8;

export function computePlacement(
  anchor: PeekAnchor,
  card: PlacementSize,
  viewport: PlacementSize,
): PlacementResult {
  const GAP = PEEK_PLACEMENT_GAP;
  const GUTTER = PEEK_PLACEMENT_GUTTER;

  const rightCandidate = anchor.x + anchor.width + GAP;
  let left: number;
  let flipped = false;

  if (rightCandidate + card.width <= viewport.width - GUTTER) {
    left = rightCandidate;
  } else {
    const leftCandidate = anchor.x - card.width - GAP;
    if (leftCandidate >= GUTTER) {
      left = leftCandidate;
      flipped = true;
    } else {
      left = Math.max(GUTTER, viewport.width - card.width - GUTTER);
    }
  }

  let top = anchor.y;
  if (top + card.height > viewport.height - GUTTER) {
    top = viewport.height - card.height - GUTTER;
  }
  top = Math.max(GUTTER, top);

  return { left, top, flipped };
}
