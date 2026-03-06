import React, { useState } from "react";
import { PerformanceTracking } from "./content/PerformanceTracking";
import type { ContentItem, ContentPillar } from "./content/types";
import { MOCK_CONTENT, DEFAULT_PILLARS } from "./content/types";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

export function PerformanceTab() {
  const [items] = useState<ContentItem[]>(() => {
    const stored = loadFromStorage("blink_content_items", MOCK_CONTENT);
    // Filter out old unrelated content items (c1-c12)
    const oldContentIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12"];
    return stored.filter((i) => !oldContentIds.includes(i.id));
  });
  const [pillars] = useState<ContentPillar[]>(() =>
    loadFromStorage("blink_content_pillars", DEFAULT_PILLARS)
  );

  return (
    <div className="animate-in fade-in duration-500">
      <PerformanceTracking
        items={items}
        pillars={pillars}
        onSelectItem={() => {}}
      />
    </div>
  );
}