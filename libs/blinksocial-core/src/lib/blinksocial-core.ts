export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export { generateTenantId } from './generate-tenant-id.js';
