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
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
