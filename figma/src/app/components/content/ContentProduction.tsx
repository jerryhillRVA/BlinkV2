import React, { useState, useEffect } from "react";
import {
  PenTool,
  Send,
  Plus,
  Sparkles,
  Loader2,
  Instagram,
  Youtube,
  FileText,
  Clock,
  Video,
  BookOpen,
  Radio,
  Clapperboard,
  Monitor,
  MessageSquare,
  Check,
  ChevronLeft,
  ArrowRight,
  RefreshCcw,
  Copy,
  X,
  CheckCircle2,
  Package,
  Layers,
  Circle,
  Image as ImageIcon,
  LayoutGrid,
  Zap,
  Download,
  Users,
  ClipboardList,
  AlertTriangle,
  Facebook,
  Linkedin,
  Undo2,
  Trash2,
  LinkIcon,
  ShieldAlert,
  Unlock,
  History,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import type {
  ContentItem,
  ContentPillar,
  AudienceSegment,
  Platform,
  ContentType,
  ContentStage,
  ProductionStep,
  ProductionData,
  ContentBrief,
  ProductionOutput,
  ProductionSource,
  AssetChecklistItem,
  ProductionTask,
} from "./types";
import { PLATFORM_CONTENT_TYPES, PLATFORM_CONFIG, STAGE_CONFIG, STATUS_CONFIG } from "./types";
import { CONTENT_TYPE_CONFIG, PRODUCTION_STEPS, TEAM_ROLES } from "./production/production-config";
import { BriefBuilder } from "./production/BriefBuilder";
import { DraftStudio } from "./production/DraftStudio";
import { ExecutionStudio } from "./production/ExecutionStudio";
import { BlueprintStudio } from "./production/BlueprintStudio";
import { AssetsStudio } from "./production/AssetsStudio";
import { PackagingStudio } from "./production/PackagingStudio";
import { QAStudio } from "./production/QAStudio";
import { ActivityStudio } from "./production/ActivityStudio";

interface ContentProductionProps {
  items: ContentItem[];
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onSaveItem: (item: ContentItem) => void;
  onDeleteItem: (id: string) => void;
  onSelectItem: (id: string) => void;
  onMoveToReview: (id: string) => void;
  onDemoteToConcept?: (id: string) => void;
  initialEditItem?: ContentItem | null;
  onClearEdit?: () => void;
  onBackToPipeline?: () => void;
}

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-5", className)} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  reel: <Clapperboard className="size-4" />,
  carousel: <BookOpen className="size-4" />,
  "feed-post": <ImageIcon className="size-4" />,
  story: <Circle className="size-4" />,
  guide: <FileText className="size-4" />,
  live: <Radio className="size-4" />,
  "short-video": <Video className="size-4" />,
  "photo-carousel": <BookOpen className="size-4" />,
  "long-form": <Monitor className="size-4" />,
  shorts: <Zap className="size-4" />,
  "live-stream": <Radio className="size-4" />,
  "community-post": <MessageSquare className="size-4" />,
  "fb-feed-post": <ImageIcon className="size-4" />,
  "fb-link-post": <LinkIcon className="size-4" />,
  "fb-reel": <Clapperboard className="size-4" />,
  "fb-story": <Circle className="size-4" />,
  "fb-live": <Radio className="size-4" />,
  "ln-text-post": <FileText className="size-4" />,
  "ln-document": <BookOpen className="size-4" />,
  "ln-article": <FileText className="size-4" />,
  "ln-video": <Video className="size-4" />,
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: <Instagram className="size-5" />,
  tiktok: <TikTokIcon />,
  youtube: <Youtube className="size-5" />,
  facebook: <Facebook className="size-5" />,
  linkedin: <Linkedin className="size-5" />,
  tbd: <div className="size-5" />,
};

function createDefaultProductionData(): ProductionData {
  return {
    productionStep: "brief",
    sources: [],
    outputs: {},
    assets: [],
    tasks: [],
    versions: [],
  };
}

// Remap any production steps that have been removed from the workflow
// so stored items don't silently show a blank panel.
const VALID_PRODUCTION_STEPS: ProductionStep[] = [
  "select", "brief", "draft", "blueprint", "assets", "packaging", "qa", "handoff",
];
function normalizeStep(step: string | undefined): ProductionStep {
  if (!step) return "brief";
  if ((VALID_PRODUCTION_STEPS as string[]).includes(step)) return step as ProductionStep;
  // "activity" was removed — send users back to QA (the last step before it)
  if (step === "activity") return "qa";
  return "brief";
}

function getDefaultAssets(contentType: ContentType): AssetChecklistItem[] {
  const config = CONTENT_TYPE_CONFIG[contentType];
  return config.defaultAssets.map((a, i) => ({ ...a, id: `asset-${i}-${Date.now()}` }));
}

export function ContentProduction({
  items,
  pillars,
  segments,
  onSaveItem,
  onDeleteItem,
  onSelectItem,
  onMoveToReview,
  onDemoteToConcept,
  initialEditItem,
  onClearEdit,
  onBackToPipeline,
}: ContentProductionProps) {
  // Production flow state
  const [activeItemId, setActiveItemId] = useState<string | null>(initialEditItem?.id || null);
  const [productionStep, setProductionStep] = useState<ProductionStep>(
    normalizeStep(initialEditItem?.production?.productionStep) || (initialEditItem ? "brief" : "select")
  );

  // For new items being created
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    initialEditItem?.platform || null
  );
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(
    initialEditItem?.contentType || null
  );
  // Title for new items
  const [newTitle, setNewTitle] = useState(initialEditItem?.title || "");
  const [newDescription, setNewDescription] = useState(initialEditItem?.description || "");

  // Activity panel state
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);

  // Actions dialog state ("closed" | "choose" | "demote-confirm" | "delete-confirm")
  const [actionDialog, setActionDialog] = useState<"closed" | "choose" | "demote-confirm" | "delete-confirm">("closed");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Get current item
  const currentItem = activeItemId ? items.find((i) => i.id === activeItemId) || null : null;
  const production = currentItem?.production || createDefaultProductionData();

  // When initialEditItem changes (user clicked on item from "In Production"), set up the state
  useEffect(() => {
    if (initialEditItem) {
      setActiveItemId(initialEditItem.id);
      setSelectedPlatform(initialEditItem.platform || null);
      setSelectedContentType(initialEditItem.contentType || null);
      setNewTitle(initialEditItem.title || "");
      setNewDescription(initialEditItem.description || "");
      
      // Set the production step from the saved state, or default to "brief"
      if (initialEditItem.production?.productionStep) {
        setProductionStep(normalizeStep(initialEditItem.production.productionStep));
      } else {
        setProductionStep("brief");
        
        // If no production data exists yet, initialize it with Concept data
        if (!initialEditItem.production) {
          const initialBrief: ContentBrief = {
            strategy: {
              objective: initialEditItem.objective || "awareness",
              audienceSegmentIds: initialEditItem.segmentIds || [],
              pillarIds: initialEditItem.pillarIds || [],
              keyMessage: initialEditItem.description || "",
              ctaType: initialEditItem.cta?.type || "none",
              ctaText: initialEditItem.cta?.text || "",
              tonePreset: "professional",
            },
            platformRules: {},
            creativePlan: {
              hook: initialEditItem.hook || "",
            },
            compliance: {
              containsClaims: false,
              disclosureNeeded: false,
            },
            approved: false,
          };
          
          const initialProduction: ProductionData = {
            productionStep: "brief",
            brief: initialBrief,
            sources: [],
            outputs: {},
            assets: initialEditItem.contentType ? getDefaultAssets(initialEditItem.contentType) : [],
            tasks: [],
            versions: [],
          };
          
          const updatedItem: ContentItem = {
            ...initialEditItem,
            production: initialProduction,
            updatedAt: new Date().toISOString(),
          };
          onSaveItem(updatedItem);
        }
      }
    }
  }, [initialEditItem, onSaveItem]);

  // Save production data to item
  const saveProductionData = (updates: Partial<ProductionData>, itemUpdates?: Partial<ContentItem>) => {
    if (!currentItem) return;
    const updatedProduction: ProductionData = { ...production, ...updates };
    const updatedItem: ContentItem = {
      ...currentItem,
      ...itemUpdates,
      production: updatedProduction,
      updatedAt: new Date().toISOString(),
    };
    onSaveItem(updatedItem);
  };

  // Start new production
  const handleStartNew = () => {
    if (!selectedPlatform || !selectedContentType || !newTitle.trim()) {
      toast.error("Platform, content type, and title are required");
      return;
    }
    const now = new Date().toISOString();
    const newItem: ContentItem = {
      id: `c-${Date.now()}`,
      stage: "concept",
      status: "in-progress",
      title: newTitle,
      description: newDescription,
      pillarIds: [],
      segmentIds: [],
      platform: selectedPlatform,
      contentType: selectedContentType,
      createdAt: now,
      updatedAt: now,
      production: {
        productionStep: "brief",
        sources: [],
        outputs: {},
        assets: getDefaultAssets(selectedContentType),
        tasks: [],
        versions: [],
      },
    };
    onSaveItem(newItem);
    setActiveItemId(newItem.id);
    setProductionStep("brief");
    toast.success("Production started!");
  };

  // Open existing item in production
  const handleOpenItem = (item: ContentItem) => {
    if (!item.production) {
      // Upgrade legacy item
      const prod: ProductionData = {
        productionStep: "brief",
        sources: item.sourceUrl ? [{ id: "src-1", url: item.sourceUrl, title: "Original source", keyTakeaways: "", type: "article" }] : [],
        outputs: {
          ...(item.script ? { scriptVersions: [{ id: "sv-1", content: item.script, version: 1, approved: false }] } : {}),
          ...(item.caption ? { captionVariants: [item.caption] } : {}),
          ...(item.hashtags ? { hashtagSets: [item.hashtags] } : {}),
        },
        assets: item.contentType ? getDefaultAssets(item.contentType) : [],
        tasks: [],
        versions: [],
      };
      const updated: ContentItem = { ...item, production: prod, updatedAt: new Date().toISOString() };
      onSaveItem(updated);
      setActiveItemId(item.id);
      setProductionStep("brief");
      setSelectedPlatform(item.platform || null);
      setSelectedContentType(item.contentType || null);
    } else {
      setActiveItemId(item.id);
      setProductionStep(normalizeStep(item.production.productionStep));
      setSelectedPlatform(item.platform || null);
      setSelectedContentType(item.contentType || null);
    }
  };

  // Navigate production steps
  const goToStep = (step: ProductionStep) => {
    setProductionStep(step);
    if (currentItem) {
      saveProductionData({ productionStep: step });
    }
  };

  // Back to Pipeline
  const handleBackToPipeline = () => {
    setActiveItemId(null);
    setProductionStep("select");
    setSelectedPlatform(null);
    setSelectedContentType(null);
    setNewTitle("");
    setNewDescription("");
    onClearEdit?.();
    onBackToPipeline?.();
  };

  // Handoff to pipeline
  const handleHandoff = () => {
    if (!currentItem) return;
    // Sync production outputs back to the ContentItem fields
    const outputs = production.outputs;
    const script = outputs.scriptVersions?.[0]?.content;
    const caption = outputs.captionVariants?.[0];
    const hashtags = outputs.hashtagSets?.[0];
    const hook = outputs.hookVariants?.[0];

    const updated: ContentItem = {
      ...currentItem,
      stage: "post",
      status: "review",
      script: script || currentItem.script,
      caption: caption || currentItem.caption,
      hashtags: hashtags || currentItem.hashtags,
      hook: hook || currentItem.hook,
      production: { ...production, productionStep: "handoff" },
      updatedAt: new Date().toISOString(),
    };
    onSaveItem(updated);
    toast.success("Content handed off to Review & Scheduling!");
    handleBackToPipeline();
  };

  // Repurpose
  const handleRepurpose = (targetPlatform: Platform) => {
    if (!currentItem) return;
    const now = new Date().toISOString();
    const newItem: ContentItem = {
      id: `c-${Date.now()}`,
      stage: "concept",
      status: "draft",
      title: `[${PLATFORM_CONFIG[targetPlatform].label}] ${currentItem.title}`,
      description: currentItem.description,
      pillarIds: currentItem.pillarIds,
      segmentIds: currentItem.segmentIds,
      platform: targetPlatform,
      hook: currentItem.hook,
      sourceUrl: currentItem.sourceUrl,
      createdAt: now,
      updatedAt: now,
    };
    onSaveItem(newItem);
    toast.success(`Repurposed for ${PLATFORM_CONFIG[targetPlatform].label}!`);
  };

  // Demote to Concept — preserves brief, erases everything else
  const handleDemoteToConcept = () => {
    if (!currentItem) return;
    const demotedItem: ContentItem = {
      ...currentItem,
      stage: "concept",
      status: "draft",
      production: currentItem.production?.brief
        ? {
            productionStep: "brief",
            brief: currentItem.production.brief,
            sources: currentItem.production.sources || [],
            outputs: {},
            assets: [],
            tasks: [],
            versions: [
              ...currentItem.production.versions,
              { label: "Demoted to Concept", savedAt: new Date().toISOString() },
            ],
          }
        : undefined,
      updatedAt: new Date().toISOString(),
    };
    onSaveItem(demotedItem);
    if (onDemoteToConcept) {
      onDemoteToConcept(currentItem.id);
    }
    toast.success("Demoted to Concept. Brief data preserved.");
    setActionDialog("closed");
    handleBackToPipeline();
  };

  // Delete permanently
  const handleDeletePermanently = () => {
    if (!currentItem) return;
    onDeleteItem(currentItem.id);
    toast.success(`"${currentItem.title}" deleted permanently.`);
    setActionDialog("closed");
    setDeleteConfirmText("");
    handleBackToPipeline();
  };

  // Unlock Brief — resets approval, logs unlock, resets workflow to Brief step
  const handleUnlockBrief = () => {
    if (!currentItem || !production.brief) return;
    saveProductionData({
      brief: {
        ...production.brief,
        approved: false,
        approvedAt: undefined,
        approvedBy: undefined,
        unlockedAt: new Date().toISOString(),
        unlockedBy: "Current User",
      },
      versions: [
        ...production.versions,
        { label: "Brief Unlocked for Editing", savedAt: new Date().toISOString() },
      ],
    });
    setProductionStep("brief");
    toast.success("Brief unlocked. Changes will require re-approval and subsequent stages must be redone.", {
      duration: 5000,
    });
  };

  // ─── RENDER ───

  // If in production flow (not queue)
  if (activeItemId && currentItem && selectedPlatform && selectedContentType) {
    const config = CONTENT_TYPE_CONFIG[selectedContentType];
    const stepIndex = PRODUCTION_STEPS.findIndex((s) => s.id === productionStep);

    return (
      <div className="space-y-4">
        {/* ─── Orange Gradient Header ─── */}
        <div className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1 text-white/90 hover:text-white hover:bg-white/15 shrink-0"
                onClick={handleBackToPipeline}
              >
                <ChevronLeft className="size-3" /> Pipeline
              </Button>
              <div className="h-5 w-px bg-white/20 shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center justify-center size-7 rounded-lg bg-white/15 shrink-0">
                  {PLATFORM_ICONS[selectedPlatform]}
                </div>
                <div className="min-w-0">
                  <h2 className="text-white text-sm truncate" style={{ fontWeight: 700 }}>
                    {currentItem.title}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/70 text-[10px]">
                      {PLATFORM_CONFIG[selectedPlatform].label}
                    </span>
                    <span className="text-white/40 text-[10px]">·</span>
                    <span className="text-white/70 text-[10px]">
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Activity Log button — persistent across all steps */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1 text-white/70 hover:text-white hover:bg-white/15"
                onClick={() => setActivityPanelOpen(true)}
                title="Activity Log"
              >
                <History className="size-3" />
                <span className="hidden lg:inline">Activity</span>
              </Button>
              <div className="h-4 w-px bg-white/20" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1 text-white/70 hover:text-white hover:bg-white/15"
                onClick={() => setActionDialog("choose")}
                title="Item Actions"
              >
                <ShieldAlert className="size-3" />
                <span className="hidden lg:inline">Actions</span>
              </Button>
              <div className="h-4 w-px bg-white/20 hidden md:block" />
              <span className="text-white/50 text-[9px] hidden md:inline mr-1">Repurpose:</span>
              {(Object.keys(PLATFORM_CONFIG) as Platform[])
                .filter((p) => p !== selectedPlatform && p !== "tbd")
                .map((p) => (
                  <Button
                    key={p}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/15 rounded-lg"
                    onClick={() => handleRepurpose(p)}
                    title={`Repurpose for ${PLATFORM_CONFIG[p].label}`}
                  >
                    {PLATFORM_ICONS[p]}
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {/* Production Step Navigation */}
        <div className="bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {PRODUCTION_STEPS.map((step, idx) => {
              const isActive = productionStep === step.id;
              const isPast = stepIndex > idx;
              const isClickable = isPast || idx <= stepIndex + 1;
              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && goToStep(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap flex-1 justify-center",
                    isActive
                      ? "bg-gradient-to-r from-[#d94e33] to-[#f26b4d] text-white shadow-sm"
                      : isPast
                      ? "text-green-600 bg-green-50"
                      : isClickable
                      ? "text-muted-foreground hover:bg-gray-50"
                      : "text-gray-300 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center size-5 rounded-full text-[9px] font-bold shrink-0",
                      isActive ? "bg-white/20" : isPast ? "bg-green-100" : "bg-gray-100"
                    )}
                  >
                    {isPast ? <Check className="size-3" /> : step.step}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        {productionStep === "brief" && (
          <BriefBuilder
            platform={selectedPlatform}
            contentType={selectedContentType}
            pillars={pillars}
            segments={segments}
            brief={production.brief}
            sources={production.sources}
            onUpdateBrief={(brief) => saveProductionData({ brief })}
            onUpdateSources={(sources) => saveProductionData({ sources })}
            onUpdatePlatform={(newPlatform) => {
              setSelectedPlatform(newPlatform);
              saveProductionData({}, { platform: newPlatform });
            }}
            onUpdateContentType={(newContentType) => {
              setSelectedContentType(newContentType);
              saveProductionData({}, { contentType: newContentType });
            }}
            onApproveBrief={() => {
              saveProductionData({
                brief: {
                  ...production.brief!,
                  approved: true,
                  approvedAt: new Date().toISOString(),
                  approvedBy: "Current User",
                  unlockedAt: undefined,
                  unlockedBy: undefined,
                },
                versions: [
                  ...production.versions,
                  { label: "Brief Approved", savedAt: new Date().toISOString() },
                ],
              });
              toast.success("Brief approved!");
            }}
            onUnlockBrief={handleUnlockBrief}
            onNext={() => goToStep("draft")}
          />
        )}

        {productionStep === "draft" && production.brief && selectedPlatform && selectedContentType && (
          <DraftStudio
            platform={selectedPlatform}
            contentType={selectedContentType}
            title={currentItem.title}
            brief={production.brief}
            outputs={production.outputs}
            onUpdateOutputs={(outputs) => saveProductionData({ outputs })}
            onNext={() => goToStep("blueprint")}
          />
        )}

        {productionStep === "blueprint" && production.brief && selectedPlatform && selectedContentType && (
          <BlueprintStudio
            platform={selectedPlatform}
            contentType={selectedContentType}
            title={currentItem.title}
            brief={production.brief}
            outputs={production.outputs}
            onUpdateOutputs={(outputs) => saveProductionData({ outputs })}
            onNext={() => goToStep("assets")}
            onBack={() => goToStep("draft")}
          />
        )}

        {productionStep === "assets" && production.brief && selectedPlatform && selectedContentType && (
          <AssetsStudio
            platform={selectedPlatform}
            contentType={selectedContentType}
            title={currentItem.title}
            brief={production.brief}
            outputs={production.outputs}
            onUpdateOutputs={(outputs) => saveProductionData({ outputs })}
            onNext={() => goToStep("packaging")}
            onBack={() => goToStep("blueprint")}
          />
        )}

        {productionStep === "packaging" && production.brief && selectedPlatform && selectedContentType && (
          <PackagingStudio
            platform={selectedPlatform}
            contentType={selectedContentType}
            title={currentItem.title}
            brief={production.brief}
            outputs={production.outputs}
            onUpdateOutputs={(outputs) => saveProductionData({ outputs })}
            onNext={() => goToStep("qa")}
            onBack={() => goToStep("assets")}
          />
        )}

        {productionStep === "qa" && production.brief && selectedPlatform && selectedContentType && (
          <QAStudio
            platform={selectedPlatform}
            contentType={selectedContentType}
            title={currentItem.title}
            brief={production.brief}
            outputs={production.outputs}
            onUpdateOutputs={(outputs) => saveProductionData({ outputs })}
            onNext={() => goToStep("handoff")}
            onBack={() => goToStep("packaging")}
          />
        )}

        {productionStep === "handoff" && (
          <div className="space-y-4">
            <Card className="border-gray-100">
              <CardContent className="p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-[#d94e33] to-[#f26b4d]">
                  <Send className="size-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Ready to Hand Off</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  This will move "{currentItem.title}" to the Review & Scheduling step where it can be approved and scheduled for publishing.
                </p>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Brief</p>
                    <CheckCircle2 className="size-5 text-green-500 mx-auto mt-1" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Review</p>
                    {production.internalApproval?.approved ? (
                      <CheckCircle2 className="size-5 text-green-500 mx-auto mt-1" />
                    ) : (
                      <AlertTriangle className="size-5 text-amber-500 mx-auto mt-1" />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Assets</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {production.assets.filter((a) => a.completed).length}/{production.assets.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button variant="outline" onClick={() => goToStep("package")}>Back to Package</Button>
                  <Button
                    className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 px-8 shadow-lg shadow-[#d94e33]/20"
                    onClick={handleHandoff}
                  >
                    <Send className="size-3.5" /> Hand Off to Pipeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Multi-Step Actions Dialog ─── */}
        <Dialog open={actionDialog !== "closed"} onOpenChange={(open) => { if (!open) { setActionDialog("closed"); setDeleteConfirmText(""); } }}>
          <DialogContent className="max-w-md">

            {/* ── Step 1: Choose Action ── */}
            {actionDialog === "choose" && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded-full bg-gray-100">
                      <ShieldAlert className="size-4 text-gray-600" />
                    </div>
                    Item Actions
                  </DialogTitle>
                  <DialogDescription className="pt-1">
                    Choose what to do with <span className="font-semibold text-gray-900">"{currentItem.title}"</span>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  {/* Demote option */}
                  <button
                    onClick={() => setActionDialog("demote-confirm")}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-center size-9 rounded-lg bg-amber-100 group-hover:bg-amber-200 shrink-0 mt-0.5">
                      <Undo2 className="size-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-800">Demote to Concept</p>
                      <p className="text-[10px] text-amber-700 leading-snug mt-0.5">
                        Move back to Concepts. Brief data and sources are preserved; draft outputs and tasks are erased.
                      </p>
                    </div>
                  </button>
                  {/* Delete option */}
                  <button
                    onClick={() => { setActionDialog("delete-confirm"); setDeleteConfirmText(""); }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-center size-9 rounded-lg bg-red-100 group-hover:bg-red-200 shrink-0 mt-0.5">
                      <Trash2 className="size-4 text-red-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-800">Delete Permanently</p>
                      <p className="text-[10px] text-red-700 leading-snug mt-0.5">
                        Remove this item entirely from the system. All data — brief, drafts, assets, tasks — will be destroyed and cannot be recovered.
                      </p>
                    </div>
                  </button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setActionDialog("closed")}>Cancel</Button>
                </DialogFooter>
              </>
            )}

            {/* ── Step 2a: Demote Confirm ── */}
            {actionDialog === "demote-confirm" && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded-full bg-amber-100">
                      <AlertTriangle className="size-4 text-amber-600" />
                    </div>
                    Demote to Concept
                  </DialogTitle>
                  <DialogDescription className="pt-2">
                    This will move <span className="font-semibold text-gray-900">"{currentItem.title}"</span> back to the Concepts column.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-[10px] font-bold text-green-800 uppercase tracking-wider mb-1.5">Preserved</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2 text-xs text-green-700"><CheckCircle2 className="size-3 shrink-0" /> Brief data (strategy, platform rules, compliance)</li>
                      <li className="flex items-center gap-2 text-xs text-green-700"><CheckCircle2 className="size-3 shrink-0" /> Research sources</li>
                      <li className="flex items-center gap-2 text-xs text-green-700"><CheckCircle2 className="size-3 shrink-0" /> Version history (with demotion logged)</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1.5">Permanently Erased</p>
                    <ul className="space-y-1">
                      {(production.outputs.scriptVersions?.length ?? 0) > 0 && (
                        <li className="flex items-center gap-2 text-xs text-red-700"><X className="size-3 shrink-0" /> {production.outputs.scriptVersions!.length} script version(s)</li>
                      )}
                      {(production.outputs.hookVariants?.length ?? 0) > 0 && (
                        <li className="flex items-center gap-2 text-xs text-red-700"><X className="size-3 shrink-0" /> {production.outputs.hookVariants!.length} hook variant(s)</li>
                      )}
                      {(production.outputs.captionVariants?.length ?? 0) > 0 && (
                        <li className="flex items-center gap-2 text-xs text-red-700"><X className="size-3 shrink-0" /> Caption drafts</li>
                      )}
                      {production.outputs.blueprintData && (
                        <li className="flex items-center gap-2 text-xs text-red-700"><X className="size-3 shrink-0" /> Blueprint ({production.outputs.blueprintData.units.length} units)</li>
                      )}
                      {production.assets.length > 0 && (
                        <li className="flex items-center gap-2 text-xs text-red-700"><X className="size-3 shrink-0" /> {production.assets.length} asset checklist item(s)</li>
                      )}
                      {production.tasks.length > 0 && (
                        <li className="flex items-center gap-2 text-xs text-red-700"><X className="size-3 shrink-0" /> {production.tasks.length} task(s)</li>
                      )}
                      {(production.outputs.scriptVersions?.length ?? 0) === 0 && (production.outputs.hookVariants?.length ?? 0) === 0 && !production.outputs.blueprintData && production.assets.length === 0 && production.tasks.length === 0 && (
                        <li className="flex items-center gap-2 text-xs text-red-700"><X className="size-3 shrink-0" /> All draft outputs, assets, tasks, and approvals</li>
                      )}
                    </ul>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">This action cannot be undone. The item will return to the Concepts column and production can be restarted from the Brief step.</p>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setActionDialog("choose")}>← Back</Button>
                  <Button className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleDemoteToConcept}>
                    <Undo2 className="size-3.5" /> Demote to Concept
                  </Button>
                </DialogFooter>
              </>
            )}

            {/* ── Step 2b: Delete Confirm (type to confirm) ── */}
            {actionDialog === "delete-confirm" && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded-full bg-red-100">
                      <Trash2 className="size-4 text-red-600" />
                    </div>
                    Delete Permanently
                  </DialogTitle>
                  <DialogDescription className="pt-2">
                    You are about to permanently delete <span className="font-semibold text-gray-900">"{currentItem.title}"</span>. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
                    <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1">Everything destroyed</p>
                    <ul className="space-y-1 text-xs text-red-700">
                      <li className="flex items-center gap-1.5"><X className="size-3 shrink-0" /> Brief, strategy, platform rules & compliance</li>
                      <li className="flex items-center gap-1.5"><X className="size-3 shrink-0" /> All scripts, hooks, captions & drafts</li>
                      <li className="flex items-center gap-1.5"><X className="size-3 shrink-0" /> Asset checklist, tasks & version history</li>
                      <li className="flex items-center gap-1.5"><X className="size-3 shrink-0" /> All approvals and review comments</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">
                      Type <span className="font-mono bg-gray-100 px-1 rounded text-red-600">delete</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type delete here..."
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && deleteConfirmText.toLowerCase() === "delete") {
                          handleDeletePermanently();
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setActionDialog("choose")}>← Back</Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    disabled={deleteConfirmText.toLowerCase() !== "delete"}
                    onClick={handleDeletePermanently}
                  >
                    <Trash2 className="size-3.5" /> Delete Permanently
                  </Button>
                </DialogFooter>
              </>
            )}

          </DialogContent>
        </Dialog>

        {/* ── Activity Log Drawer ── */}
        {activityPanelOpen && currentItem && production.brief && selectedPlatform && selectedContentType && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]"
              onClick={() => setActivityPanelOpen(false)}
            />
            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] max-w-[95vw] bg-white shadow-2xl flex flex-col">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#d94e33] to-[#f26b4d] shrink-0">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-white/80" />
                  <div>
                    <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>Activity Log</h3>
                    <p className="text-white/60 text-[10px] truncate max-w-[300px]">{currentItem.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivityPanelOpen(false)}
                  className="flex items-center justify-center size-6 rounded-md text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-3">
                <ActivityStudio
                  platform={selectedPlatform}
                  contentType={selectedContentType}
                  title={currentItem.title}
                  createdAt={currentItem.createdAt}
                  brief={production.brief}
                  outputs={production.outputs}
                  onUpdateOutputs={(outputs) => saveProductionData({ outputs })}
                  isPanel
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── QUEUE VIEW (Production Home) ───
  // Queue view removed - items are accessed directly from Pipeline

  return null;
}