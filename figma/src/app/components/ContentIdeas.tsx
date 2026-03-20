import React, { useState, useCallback, useEffect } from "react";
import {
  Sparkles,
  Search,
  Target,
  Lightbulb,
  PenTool,
  ShieldCheck,
  BarChart3,
  ChevronRight,
  Layers,
  LayoutGrid,
  Plus,
  ListFilter,
  Kanban,
  List,
  Clock,
  CheckCircle,
  Send,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

import { StrategyResearch } from "./content/StrategyResearch";
import { IdeationPlanning } from "./content/IdeationPlanning";
import { ContentProduction } from "./content/ContentProduction";
import { ReviewScheduling } from "./content/ReviewScheduling";
import { PerformanceTracking } from "./content/PerformanceTracking";
import { ContentDetail } from "./content/ContentDetail";
import { ConceptEditor } from "./content/ConceptEditor";
import { PillarsSegments } from "./content/PillarsSegments";
import { ContentStudioOverview } from "./content/ContentStudioOverview";
import { PipelineView } from "./content/PipelineView";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/app/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

import type {
  ContentItem,
  ContentPillar,
  AudienceSegment,
  ContentStatus,
  ContentStage,
  WorkflowStep,
  ResearchSource,
  InvestmentPlan,
} from "./content/types";
import {
  DEFAULT_PILLARS,
  DEFAULT_SEGMENTS,
  MOCK_CONTENT,
  STAGE_CONFIG,
  WORKFLOW_STEPS,
} from "./content/types";

// localStorage helpers
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

const WORKFLOW_ICONS: Record<WorkflowStep, typeof Search> = {
  overview: LayoutGrid,
  strategy: Target,
  ideation: Lightbulb,
  production: PenTool,
  review: ShieldCheck,
  performance: BarChart3,
};

interface ContentIdeasProps {
  initialOpenItem?: { itemId: string; tab: string } | null;
  onClearOpenItem?: () => void;
}

export function ContentIdeas({ initialOpenItem, onClearOpenItem }: ContentIdeasProps = {}) {
  // Core data with localStorage persistence
  // Merge strategy: load stored items, then append any MOCK_CONTENT items
  // whose IDs don't already exist (so new mock data always appears).
  const [items, setItems] = useState<ContentItem[]>(() => {
    const stored = loadFromStorage<ContentItem[]>("blink_content_items", []);
    
    // Filter out old unrelated content items (c1-c12)
    const oldContentIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12"];
    let filtered = stored.filter((i) => !oldContentIds.includes(i.id));

    // Deduplicate production items (stage === "post") per concept per content type.
    // If duplicates exist (legacy data), keep the most recently updated one.
    const deduped: ContentItem[] = [];
    const seenProductionKeys = new Set<string>();
    // Sort newest-first so we always keep the most recent duplicate
    const sorted = [...filtered].sort((a, b) =>
      (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
    );
    for (const item of sorted) {
      if (item.stage === "post" && item.conceptId && item.contentType) {
        const key = `${item.conceptId}|${item.contentType}`;
        if (seenProductionKeys.has(key)) continue; // skip older duplicate
        seenProductionKeys.add(key);
      }
      deduped.push(item);
    }
    // Restore original order (by createdAt descending)
    filtered = deduped.sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
    
    if (filtered.length === 0) return MOCK_CONTENT;
    const storedIds = new Set(filtered.map((i) => i.id));
    const newMockItems = MOCK_CONTENT.filter((m) => !storedIds.has(m.id));
    return newMockItems.length > 0 ? [...filtered, ...newMockItems] : filtered;
  });
  
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
  const [investmentPlan, setInvestmentPlan] = useState<InvestmentPlan | null>(null);

  // Persist to localStorage
  useEffect(() => { saveToStorage("blink_content_items", items); }, [items]);
  useEffect(() => { saveToStorage("blink_content_pillars", pillars); }, [pillars]);
  useEffect(() => { saveToStorage("blink_content_segments", segments); }, [segments]);

  // Navigation
  const [activeStep, setActiveStep] = useState<WorkflowStep>("overview");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [showPillarsManager, setShowPillarsManager] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  // ─── Handle deep-link from Calendar ───
  useEffect(() => {
    if (initialOpenItem) {
      const item = items.find(i => i.id === initialOpenItem.itemId);
      if (item) {
        if (item.platform && item.contentType) {
          // Item has full production data — open in production view
          const updatedItem = {
            ...item,
            production: {
              ...(item.production || {
                productionStep: initialOpenItem.tab,
                sources: [],
                outputs: {},
                assets: [],
                tasks: [],
                versions: [],
              }),
              productionStep: initialOpenItem.tab,
            },
          } as ContentItem;
          setEditingItem(updatedItem);
          setActiveStep("production");
          setSelectedItemId(null);
        } else {
          // Item is still a concept without platform/type — show detail view
          setSelectedItemId(item.id);
          setActiveStep("overview");
          setEditingItem(null);
        }
      }
      onClearOpenItem?.();
    }
  }, [initialOpenItem]);

  // CRUD operations
  const handleSaveItem = useCallback((item: ContentItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.map((i) => (i.id === item.id ? item : i));
      return [item, ...prev];
    });
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItemId(null);
    toast.success("Content deleted");
  }, []);

  const handleUpdateStatus = useCallback((id: string, status: ContentStatus) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i
      )
    );
    toast.success(`Status updated to ${status.replace("-", " ")}`);
  }, []);

  const handleUpdateItem = useCallback((item: ContentItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  }, []);

  const handleAdvanceStage = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const nextStage: ContentStage | null =
        item.stage === "idea" ? "concept" : item.stage === "concept" ? "post" : null;
      if (!nextStage) return;

      setEditingItem({ ...item, stage: nextStage });
      setSelectedItemId(null);
      setActiveStep("production");
    },
    [items]
  );

  const handleEditItem = useCallback(() => {
    if (selectedItem) {
      setEditingItem(selectedItem);
      setSelectedItemId(null);
      setActiveStep("production");
    }
  }, [selectedItem]);

  const handleMoveToProduction = (item: ContentItem) => {
    setEditingItem(item);
    setActiveStep("production");
  };

  const handleSelectItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    // If item is in production (has status "in-progress"), go directly to production workflow
    if (item.status === "in-progress") {
      setEditingItem(item);
      setActiveStep("production");
    } else {
      // Otherwise show the detail view
      setSelectedItemId(id);
    }
  };

  const handleMoveToReview = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "review" as ContentStatus, updatedAt: new Date().toISOString() } : i
      )
    );
    setActiveStep("review");
    toast.success("Sent to Review & Scheduling");
  }, []);

  const handleCreateIdeaFromSource = useCallback((source: ResearchSource) => {
    const now = new Date().toISOString();
    const idea: ContentItem = {
      id: `c-${Date.now()}`,
      stage: "idea",
      status: "draft",
      title: source.title,
      description: source.summary,
      pillarIds: source.pillarIds,
      segmentIds: [],
      sourceUrl: source.url,
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [idea, ...prev]);
    setActiveStep("ideation");
  }, []);

  const handleCreateProductionFromSource = useCallback((source: ResearchSource) => {
    const now = new Date().toISOString();
    const item: ContentItem = {
      id: `c-${Date.now()}`,
      stage: "concept",
      status: "in-progress",
      title: source.title,
      description: source.summary,
      pillarIds: source.pillarIds,
      segmentIds: [],
      sourceUrl: source.url,
      createdAt: now,
      updatedAt: now,
      production: {
        productionStep: "brief",
        sources: [{
          id: `src-${Date.now()}`,
          url: source.url,
          title: source.title,
          keyTakeaways: source.summary,
          type: source.type,
        }],
        outputs: {},
        assets: [],
        tasks: [],
        versions: [],
      },
    };
    setItems((prev) => [item, ...prev]);
    setEditingItem(item);
    setActiveStep("production");
  }, []);

  // Count items per workflow step
  const stepCounts: Record<WorkflowStep, number> = {
    overview: items.length,
    strategy: 0,
    ideation: items.filter((i) => i.stage === "idea").length,
    production: items.filter((i) => i.stage === "concept" || (i.stage === "post" && i.status === "in-progress") || (i.stage === "idea" && i.status === "in-progress")).length,
    review: items.filter((i) => i.status === "review").length + items.filter((i) => i.status === "scheduled").length,
    performance: items.filter((i) => i.status === "published").length,
  };

  // If viewing detail
  if (selectedItem) {
    // If it's a Concept, show the ConceptEditor
    if (selectedItem.stage === "concept") {
      // Find any items already in production for this concept (to enforce 1 per content type)
      const existingProductionItems = items.filter(
        (i) => i.conceptId === selectedItem.id && i.stage === "post"
      );
      return (
        <div className="animate-in fade-in duration-300">
          <ConceptEditor
            item={selectedItem}
            pillars={pillars}
            segments={segments}
            existingProductionItems={existingProductionItems}
            onBack={() => setSelectedItemId(null)}
            onSave={(item) => {
              handleSaveItem(item);
            }}
            onDelete={() => {
              handleDeleteItem(selectedItem.id);
              setSelectedItemId(null);
            }}
            onCreateBrief={(itemsToProduce, keepConcept, workOnIndex = 0) => {
              // Deduplicate: skip any item whose contentType already has a production item for this concept
              const alreadyProductionTypes = new Set(
                existingProductionItems.map((i) => i.contentType)
              );
              const filtered = itemsToProduce.filter(
                (i) => !alreadyProductionTypes.has(i.contentType)
              );
              if (filtered.length === 0) {
                return;
              }
              filtered.forEach((updatedItem, index) => {
                const briefItem: ContentItem = {
                  ...updatedItem,
                  stage: "post" as ContentStage,
                  status: "in-progress" as ContentStatus,
                };
                handleSaveItem(briefItem);

                if (index === workOnIndex) {
                  handleMoveToProduction(briefItem);
                }
              });

              if (!keepConcept && itemsToProduce.some(i => i.id !== selectedItem.id)) {
                // If we didn't keep the concept and we generated NEW items, we should delete the original concept item
                setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
              }

              if (keepConcept || workOnIndex === -1) {
                setSelectedItemId(null);
                setActiveStep("overview");
              } else {
                setSelectedItemId(null);
              }
            }}
          />
        </div>
      );
    }
    
    // Otherwise show the regular detail view (for Ideas, etc.)
    return (
      <div className="animate-in fade-in duration-300">
        <ContentDetail
          item={selectedItem}
          pillars={pillars}
          segments={segments}
          onBack={() => setSelectedItemId(null)}
          onEdit={handleEditItem}
          onDelete={() => handleDeleteItem(selectedItem.id)}
          onUpdateStatus={(s) => handleUpdateStatus(selectedItem.id, s)}
          onAdvanceStage={() => handleAdvanceStage(selectedItem.id)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Workflow Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeStep === "overview" && (
            <PipelineView
              items={items}
              pillars={pillars}
              onSelectItem={handleSelectItem}
              onSaveItem={handleSaveItem}
              onNavigateToStrategy={() => setActiveStep("strategy")}
              onNavigateToPerformance={() => setActiveStep("performance")}
              onMoveToProduction={handleMoveToProduction}
            />
          )}

          {activeStep === "strategy" && (
            <StrategyResearch
              pillars={pillars}
              segments={segments}
              onUpdatePillars={setPillars}
              onUpdateSegments={setSegments}
              onNavigateToIdeation={() => setActiveStep("ideation")}
              onNavigateToProduction={() => setActiveStep("production")}
              onCreateIdeaFromSource={handleCreateIdeaFromSource}
              onCreateProductionFromSource={handleCreateProductionFromSource}
              onSaveInvestmentPlan={setInvestmentPlan}
            />
          )}

          {activeStep === "ideation" && (
            <IdeationPlanning
              items={items}
              pillars={pillars}
              segments={segments}
              onSaveItem={handleSaveItem}
              onDeleteItem={handleDeleteItem}
              onSelectItem={setSelectedItemId}
              onMoveToProduction={handleMoveToProduction}
            />
          )}

          {activeStep === "production" && (
            <ContentProduction
              items={items}
              pillars={pillars}
              segments={segments}
              onSaveItem={handleSaveItem}
              onDeleteItem={handleDeleteItem}
              onSelectItem={setSelectedItemId}
              onMoveToReview={handleMoveToReview}
              onDemoteToConcept={(id) => {
                setEditingItem(null);
                setActiveStep("overview");
              }}
              initialEditItem={editingItem}
              onClearEdit={() => setEditingItem(null)}
              onBackToPipeline={() => setActiveStep("overview")}
            />
          )}

          {activeStep === "review" && (
            <ReviewScheduling
              items={items}
              pillars={pillars}
              segments={segments}
              onUpdateItem={handleUpdateItem}
              onSelectItem={setSelectedItemId}
            />
          )}

          {activeStep === "performance" && (
            <PerformanceTracking
              items={items}
              pillars={pillars}
              onSelectItem={setSelectedItemId}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}