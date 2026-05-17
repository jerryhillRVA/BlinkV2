/**
 * Centralized icon registry. Add new icons here keyed by Lucide name.
 *
 * Source: paste the inner contents of the SVG from lucide.dev (or the
 * Lucide-provided source) directly into the `paths` array. DO NOT
 * hand-write or eyeball SVG path data — the wrong-icon bugs we have all
 * stem from inline paths that drifted from their Lucide source.
 *
 * Render via `<app-icon name="..." size="14" />`. The component sets
 * `currentColor` so the icon picks up the surrounding text color.
 */

export type IconPathPrimitive =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: string; cy: string; r: string }
  | { kind: 'line'; x1: string; y1: string; x2: string; y2: string }
  | { kind: 'polyline'; points: string }
  | { kind: 'rect'; x: string; y: string; width: string; height: string; rx?: string };

export interface IconDef {
  viewBox: string;
  primitives: ReadonlyArray<IconPathPrimitive>;
}

export const ICONS = {
  sparkles: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
      },
      { kind: 'path', d: 'M20 3v4' },
      { kind: 'path', d: 'M22 5h-4' },
      { kind: 'path', d: 'M4 17v2' },
      { kind: 'path', d: 'M5 18H3' },
    ],
  },
  // 'info' — info-circle, used in section labels
  info: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'circle', cx: '12', cy: '12', r: '10' },
      { kind: 'line', x1: '12', y1: '16', x2: '12', y2: '12' },
      { kind: 'line', x1: '12', y1: '8', x2: '12.01', y2: '8' },
    ],
  },
  // 'chevron-right' — used in collapsibles' caret (rotates 90° when open)
  'chevron-right': {
    viewBox: '0 0 24 24',
    primitives: [{ kind: 'polyline', points: '9 18 15 12 9 6' }],
  },
  // 'chevron-down' — used in some other collapsibles
  'chevron-down': {
    viewBox: '0 0 24 24',
    primitives: [{ kind: 'polyline', points: '6 9 12 15 18 9' }],
  },
  // 'chevron-up'
  'chevron-up': {
    viewBox: '0 0 24 24',
    primitives: [{ kind: 'polyline', points: '18 15 12 9 6 15' }],
  },
  // 'plus' — used on Add Shot, Add Block, Add Slide
  plus: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M12 5v14' },
      { kind: 'path', d: 'M5 12h14' },
    ],
  },
  // 'trash-2' — destructive remove
  'trash-2': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M3 6h18' },
      { kind: 'path', d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' },
      { kind: 'path', d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
      { kind: 'line', x1: '10', y1: '11', x2: '10', y2: '17' },
      { kind: 'line', x1: '14', y1: '11', x2: '14', y2: '17' },
    ],
  },
  // 'arrow-up' / 'arrow-down' — reorder
  'arrow-up': {
    viewBox: '0 0 24 24',
    primitives: [{ kind: 'path', d: 'm18 15-6-6-6 6' }],
  },
  'arrow-down': {
    viewBox: '0 0 24 24',
    primitives: [{ kind: 'path', d: 'm6 9 6 6 6-6' }],
  },
  // 'arrow-right' — used on Continue-to-Packaging
  'arrow-right': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M5 12h14' },
      { kind: 'path', d: 'm12 5 7 7-7 7' },
    ],
  },
  // 'arrow-left' — used on the back-button in the step-action-bar
  'arrow-left': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'm12 19-7-7 7-7' },
      { kind: 'path', d: 'M19 12H5' },
    ],
  },
  // 'alert-triangle' — required-field warnings + amber state
  'alert-triangle': {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z',
      },
      { kind: 'path', d: 'M12 9v4' },
      { kind: 'path', d: 'M12 17h.01' },
    ],
  },
  // 'x' — chip remove, close
  x: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M18 6 6 18' },
      { kind: 'path', d: 'm6 6 12 12' },
    ],
  },
  // 'clock' — timestamps
  clock: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'circle', cx: '12', cy: '12', r: '10' },
      { kind: 'polyline', points: '12 6 12 12 16 14' },
    ],
  },
  // 'paperclip' — attach
  paperclip: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'm21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.99 8.8L9.41 17.37a2 2 0 0 1-2.83-2.83l8.49-8.48',
      },
    ],
  },
  // 'upload-cloud'
  'upload-cloud': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
      { kind: 'polyline', points: '17 8 12 3 7 8' },
      { kind: 'line', x1: '12', y1: '3', x2: '12', y2: '15' },
    ],
  },
  // 'file-text'
  'file-text': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
      { kind: 'polyline', points: '14 2 14 8 20 8' },
    ],
  },
  // 'shield' — compliance flag
  shield: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      },
    ],
  },
  // 'users' — talent flag
  users: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
      { kind: 'circle', cx: '9', cy: '7', r: '4' },
      { kind: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87' },
      { kind: 'path', d: 'M16 3.13a4 4 0 0 1 0 7.75' },
    ],
  },
  // 'music' — licensed-music flag
  music: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M9 18V5l12-2v13' },
      { kind: 'circle', cx: '6', cy: '18', r: '3' },
      { kind: 'circle', cx: '18', cy: '16', r: '3' },
    ],
  },
  // 'check-circle' — accessibility flag
  'check-circle': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' },
      { kind: 'polyline', points: '22 4 12 14.01 9 11.01' },
    ],
  },
  // 'rotate-ccw' — used on Request Changes / Revoke approval actions
  'rotate-ccw': {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
      },
      { kind: 'path', d: 'M3 3v5h5' },
    ],
  },
  // 'layout-grid' — primitive placeholder/empty-state square grid
  'layout-grid': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'rect', x: '3', y: '3', width: '18', height: '18', rx: '3' },
      { kind: 'path', d: 'M9 3v18' },
      { kind: 'path', d: 'M15 3v18' },
      { kind: 'path', d: 'M3 9h18' },
      { kind: 'path', d: 'M3 15h18' },
    ],
  },
  // 'flame' — Trending/Platform Audio strategy (#147)
  flame: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
      },
    ],
  },
  // 'zap' — Energetic / Pumped mood (#147)
  zap: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
      },
    ],
  },
  // 'leaf' — Relaxing / Calm mood (#147)
  leaf: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.8.86C20.16 16.78 14.6 21 11 20Z',
      },
      { kind: 'path', d: 'M2 21c0-3 1.85-5.36 5.08-6' },
    ],
  },
  // 'sun' — Happy / Upbeat mood (#147)
  sun: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'circle', cx: '12', cy: '12', r: '4' },
      { kind: 'path', d: 'M12 2v2' },
      { kind: 'path', d: 'M12 20v2' },
      { kind: 'path', d: 'm4.93 4.93 1.41 1.41' },
      { kind: 'path', d: 'm17.66 17.66 1.41 1.41' },
      { kind: 'path', d: 'M2 12h2' },
      { kind: 'path', d: 'M20 12h2' },
      { kind: 'path', d: 'm6.34 17.66-1.41 1.41' },
      { kind: 'path', d: 'm19.07 4.93-1.41 1.41' },
    ],
  },
  // 'cloud-rain' — Sad / Melancholy mood (#147)
  'cloud-rain': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M16 14v6' },
      { kind: 'path', d: 'M8 14v6' },
      { kind: 'path', d: 'M12 16v6' },
      {
        kind: 'path',
        d: 'M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25',
      },
    ],
  },
  // 'heart' — Romantic / Sensual mood (#147)
  heart: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z',
      },
    ],
  },
  // 'moon' — Mysterious / Mystical mood (#147)
  moon: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
      },
    ],
  },
  // 'ghost' — Scary / Spooky / Suspense mood (#147). The two .01-length
  // dashes render as round dots (eyes) thanks to stroke-linecap="round".
  ghost: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M9 10h.01' },
      { kind: 'path', d: 'M15 10h.01' },
      {
        kind: 'path',
        d: 'M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z',
      },
    ],
  },
  // 'target' — Confident / Motivational mood (#147)
  target: {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'circle', cx: '12', cy: '12', r: '10' },
      { kind: 'circle', cx: '12', cy: '12', r: '6' },
      { kind: 'circle', cx: '12', cy: '12', r: '2' },
    ],
  },
  // 'external-link' — Live Post Link card affordance (#146)
  'external-link': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M15 3h6v6' },
      { kind: 'path', d: 'M10 14 21 3' },
      {
        kind: 'path',
        d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
      },
    ],
  },
  // 'refresh-cw' — Performance card refresh button (#146)
  'refresh-cw': {
    viewBox: '0 0 24 24',
    primitives: [
      { kind: 'path', d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' },
      { kind: 'path', d: 'M21 3v5h-5' },
      { kind: 'path', d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' },
      { kind: 'path', d: 'M8 16H3v5' },
    ],
  },
  // 'pencil' — Scheduled-date sidebar card edit affordance (#146)
  pencil: {
    viewBox: '0 0 24 24',
    primitives: [
      {
        kind: 'path',
        d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      },
      { kind: 'path', d: 'm15 5 4 4' },
    ],
  },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
