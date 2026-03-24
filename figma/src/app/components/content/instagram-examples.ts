/**
 * Instagram Content Examples — 6 Example Jobs
 * Based on instagram-content-examples.md spec
 */
import type { ContentItem } from "./types";

export const INSTAGRAM_EXAMPLES: ContentItem[] = [
  // ─── A) Feed Image (single) — IMAGE_SINGLE ─── CONCEPT (draft)
  {
    id: "ig1",
    stage: "concept",
    status: "draft",
    objectiveId: "obj-hive-2",
    title: "Quote card: 'Small habits, big changes' + brand mark",
    description: "Quote card featuring inspirational wellness message with brand mark overlay. Clean, readable design with strong contrast for accessibility.",
    pillarIds: ["p2"],
    segmentIds: ["s4"],
    createdAt: "2026-02-25T09:00:00",
    updatedAt: "2026-02-28T10:00:00",
    hook: "Small habits, big changes.",
    objective: "engagement",
    owner: "Brett Lewis",
    platform: "instagram",
    contentType: "feed-post",
  },
];