import React, { useState } from "react";
import { StepPerformance } from "./steps/StepPerformance";
import type { ContentItem, ContentPillar, BusinessObjective } from "./content/types";
import { MOCK_CONTENT, DEFAULT_PILLARS } from "./content/types";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

interface PerformanceTabProps {
  objectives?: BusinessObjective[];
}

export function PerformanceTab({ objectives = [] }: PerformanceTabProps) {
  const [items] = useState<ContentItem[]>(() => {
    const stored = loadFromStorage("blink_content_items", MOCK_CONTENT);
    // Filter out old unrelated content items (c1-c12)
    const oldContentIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12"];
    const filtered = stored.filter((i) => !oldContentIds.includes(i.id));
    // Merge in performanceMetrics from MOCK_CONTENT by ID in case localStorage
    // pre-dates when performanceMetrics were added to the mock data.
    const mockById = Object.fromEntries(MOCK_CONTENT.map((m) => [m.id, m]));
    return filtered.map((item) => ({
      ...item,
      performanceMetrics: item.performanceMetrics ?? mockById[item.id]?.performanceMetrics,
    }));
  });
  const [pillars] = useState<ContentPillar[]>(() =>
    loadFromStorage("blink_content_pillars", DEFAULT_PILLARS)
  );

  return (
    <div className="animate-in fade-in duration-500">
      <StepPerformance
        objectives={objectives}
        contentItems={items}
      />
    </div>
  );
}
