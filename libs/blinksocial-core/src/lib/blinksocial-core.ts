export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export { generateTenantId } from './generate-tenant-id.js';
export { formatSize } from './format-size.js';
export { renderBlueprintMarkdown } from './blueprint/render-blueprint-markdown.js';
export { buildSampleBlueprint } from './blueprint/sample-blueprint.js';
