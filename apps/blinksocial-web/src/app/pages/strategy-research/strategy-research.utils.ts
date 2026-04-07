import { DestroyRef } from '@angular/core';

export function safeTimeout(callback: () => void, ms: number, destroyRef: DestroyRef): void {
  const id = setTimeout(callback, ms);
  destroyRef.onDestroy(() => clearTimeout(id));
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) {
    next.delete(item);
  } else {
    next.add(item);
  }
  return next;
}
