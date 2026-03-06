import React, { useState, useEffect } from "react";
import { StrategyResearch } from "./content/StrategyResearch";
import type { ContentPillar, AudienceSegment, ContentItem } from "./content/types";
import { DEFAULT_PILLARS, DEFAULT_SEGMENTS } from "./content/types";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function StrategyTab() {
  // Force update to Hive Collective pillars and segments
  const [pillars, setPillars] = useState<ContentPillar[]>(() => {
    // Clear old data and use Hive Collective defaults
    saveToStorage("blink_content_pillars", DEFAULT_PILLARS);
    return DEFAULT_PILLARS;
  });
  const [segments, setSegments] = useState<AudienceSegment[]>(() => {
    // Clear old data and use Hive Collective defaults
    saveToStorage("blink_content_segments", DEFAULT_SEGMENTS);
    return DEFAULT_SEGMENTS;
  });

  useEffect(() => {
    saveToStorage("blink_content_pillars", pillars);
  }, [pillars]);
  
  useEffect(() => {
    saveToStorage("blink_content_segments", segments);
  }, [segments]);

  return (
    <div className="animate-in fade-in duration-500">
      <StrategyResearch
        pillars={pillars}
        segments={segments}
        onUpdatePillars={setPillars}
        onUpdateSegments={setSegments}
        onNavigateToIdeation={() => {}}
        onNavigateToProduction={() => {}}
        onCreateIdeaFromSource={() => {}}
        onCreateProductionFromSource={() => {}}
      />
    </div>
  );
}