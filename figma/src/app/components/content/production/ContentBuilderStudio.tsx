import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  FileText,
  Video,
  Layers,
  CalendarDays,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Info,
  Zap,
  Lock,
  Shield,
  Users,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Paperclip,
  X,
  AlertCircle,
  Link2,
  Tag,
  UserCheck,
  Megaphone,
  Image as ImageIcon,
  GalleryHorizontal,
  Star,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/app/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { ABAnalyzer } from "../ABAnalyzer";

import type {
  Platform,
  ContentType,
  ContentBrief,
  ProductionOutput,
  ContentItem,
  ProductionData,
  AssetChecklistItem
} from "../types";
import { PLATFORM_CONFIG, PLATFORM_CONTENT_TYPES, STATUS_CONFIG } from "../types";

// ─── Content type display labels (with orientation annotations) ───────────────
const CONTENT_TYPE_LABELS: Partial<Record<ContentType, string>> = {
  "reel": "Reel (Vertical)",
  "carousel": "Carousel",
  "feed-post": "Feed Post",
  "story": "Stories",
  "guide": "Guide",
  "live": "Live",
  "short-video": "Short Video (Vertical)",
  "photo-carousel": "Photo Carousel",
  "long-form": "Long-form Video",
  "shorts": "Shorts (Vertical)",
  "live-stream": "Live Stream",
  "community-post": "Community Post",
  "fb-feed-post": "Feed Post",
  "fb-link-post": "Link Post",
  "fb-reel": "Reel (Vertical)",
  "fb-story": "Story",
  "fb-live": "Live",
  "ln-text-post": "Text Post",
  "ln-document": "Document / Carousel",
  "ln-article": "Article",
  "ln-video": "Video",
};

function getContentTypeLabel(ct: ContentType): string {
  return CONTENT_TYPE_LABELS[ct] || ct;
}

// ─── Platform icons ──────────────────────────────────────────────────────────

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: <Instagram className="size-4" />,
  tiktok: <TikTokIcon />,
  youtube: <Youtube className="size-4" />,
  facebook: <Facebook className="size-4" />,
  linkedin: <Linkedin className="size-4" />,
  tbd: <div className="size-4" />,
};

// ─── Carousel slide ──────────────────────────────────────────────────────────
interface CarouselSlide {
  id: string;
  caption: string;
  imageName?: string;
  imageUrl?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContentBuilderStudioProps {
  item: ContentItem;
  allItems?: ContentItem[];
  onUpdateItem: (itemUpdates: Partial<ContentItem>, productionUpdates: Partial<ProductionData>) => void;
  onNext: () => void;
  onBack: () => void;
  onNavigateToItem?: (itemId: string) => void;
  onNavigateToConcept?: (conceptId: string) => void;
}

export function ContentBuilderStudio({
  item,
  onUpdateItem,
  onNext,
  onBack,
}: ContentBuilderStudioProps) {
  const [flagsOpen, setFlagsOpen] = useState(false);
  const [abOpen, setAbOpen] = useState(false);
  const [creativeOpen, setCreativeOpen] = useState(false);
  const [hookBankOpen, setHookBankOpen] = useState(false);
  const [aiGeneratingHook, setAiGeneratingHook] = useState(false);
  const [aiGeneratingScript, setAiGeneratingScript] = useState(false);
  const [aiGeneratingShotList, setAiGeneratingShotList] = useState(false);
  const [targetDuration, setTargetDuration] = useState("30s");
  const [hookBank, setHookBank] = useState<string[]>([]);
  const [sequenceBlocks, setSequenceBlocks] = useState<Array<{
    id: string; type: string; description: string; duration: string; aiGenerating: boolean;
  }>>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Photo Carousel state
  const isPhotoCarousel = item.contentType === "photo-carousel";
  const [slideCount, setSlideCount] = useState(5);
  const [slides, setSlides] = useState<CarouselSlide[]>(() =>
    Array.from({ length: 5 }, (_, i) => ({ id: `slide-${i}`, caption: "" }))
  );
  const slideImageRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Sync slides array when slideCount changes
  useEffect(() => {
    setSlides(prev => {
      if (prev.length === slideCount) return prev;
      if (slideCount > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: slideCount - prev.length }, (_, i) => ({
            id: `slide-${Date.now()}-${i}`,
            caption: "",
          })),
        ];
      }
      return prev.slice(0, slideCount);
    });
  }, [slideCount]);

  const production = item.production || { productionStep: "builder" as const, sources: [], outputs: {}, assets: [], tasks: [], versions: [] };
  const outputs = production.outputs || {};
  const brief = production.brief || {} as any;
  const assets = production.assets || [];

  // Flags from brief
  const hasClaims = brief?.compliance?.containsClaims || false;
  const hasTalent = brief?.hasTalent || false;
  const hasMusic = brief?.hasMusic || false;
  const needsA11y = brief?.needsAccessibility !== false;

  // Publishing mode
  const publishingMode = brief?.publishingMode || "ORGANIC";
  const isPaid = publishingMode === "PAID_BOOSTED";

  // Paid-specific fields from brief
  const campaignName = brief?.campaignName || "";
  const destinationUrl = brief?.destinationUrl || "";

  // Pre-fill scheduled date from brief.dueDate if not set
  const scheduledDate = item.scheduledDate || brief?.dueDate || "";

  const handleOutputChange = (key: keyof ProductionOutput, value: any) => {
    onUpdateItem({}, { outputs: { ...outputs, [key]: value } });
  };

  const handleAssetToggle = (assetId: string) => {
    const updated = assets.map(a =>
      a.id === assetId ? { ...a, completed: !a.completed } : a
    );
    onUpdateItem({}, { assets: updated });
  };

  const addAsset = () => {
    const newAsset: AssetChecklistItem = {
      id: `asset-${Date.now()}`,
      label: "New File / Asset",
      required: false,
      completed: false,
    };
    onUpdateItem({}, { assets: [...assets, newAsset] });
  };

  const removeAsset = (assetId: string) => {
    onUpdateItem({}, { assets: assets.filter(a => a.id !== assetId) });
  };

  const handleFileAttach = (assetId: string, file: File) => {
    const url = URL.createObjectURL(file);
    const updated = assets.map(a =>
      a.id === assetId
        ? { ...a, fileUrl: url, fileName: file.name, fileType: file.type, completed: true }
        : a
    );
    onUpdateItem({}, { assets: updated });
  };

  const handleAiCreate = (assetId: string) => {
    // Simulate AI file generation
    const updated = assets.map(a =>
      a.id === assetId
        ? { ...a, fileName: `AI Generated — ${a.label}.pdf`, aiGenerated: true, completed: true }
        : a
    );
    onUpdateItem({}, { assets: updated });
  };

  const removeFileFromAsset = (assetId: string) => {
    const updated = assets.map(a =>
      a.id === assetId
        ? { ...a, fileUrl: undefined, fileName: undefined, fileType: undefined, aiGenerated: undefined }
        : a
    );
    onUpdateItem({}, { assets: updated });
  };

  const handleFlagChange = (key: string, value: boolean) => {
    if (!brief) return;
    if (key === "hasClaims") {
      onUpdateItem({}, { brief: { ...brief, compliance: { ...brief.compliance, containsClaims: value } } });
    } else if (key === "hasTalent") {
      onUpdateItem({}, { brief: { ...brief, hasTalent: value } });
    } else if (key === "hasMusic") {
      onUpdateItem({}, { brief: { ...brief, hasMusic: value } });
    } else if (key === "needsA11y") {
      onUpdateItem({}, { brief: { ...brief, needsAccessibility: value } });
    }
  };

  // Safe defaults
  const scriptContent = outputs.scriptVersions?.[0]?.content || "";
  const hookContent = outputs.hookVariants?.[0] || "";

  // Active flags count for badge
  const activeFlagsCount = [hasClaims, hasTalent, hasMusic, needsA11y].filter(Boolean).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-20">
      <TooltipProvider>

        {/* FORMAT — full-width locked bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
            <Lock className="size-3 text-gray-400 shrink-0" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider shrink-0" style={{ fontWeight: 700 }}>Format</span>
            <div className="h-3 w-px bg-gray-200 shrink-0" />
            <span className="flex items-center gap-1.5 text-[11px] text-gray-600 shrink-0" style={{ fontWeight: 600 }}>
              {PLATFORM_ICONS[item.platform || "tbd"]}
              {PLATFORM_CONFIG[item.platform || "tbd"]?.label}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-600 truncate" style={{ fontWeight: 600 }}>
              {item.contentType ? getContentTypeLabel(item.contentType) : "Not set"}
            </span>
            <Badge variant="outline" className="ml-auto text-[9px] border-gray-200 bg-gray-100 text-gray-400 gap-1 px-1.5 py-0 shrink-0">
              <Lock className="size-2" /> Locked
            </Badge>
          </div>

        {/* TWO-COLUMN BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

          {/* ── LEFT: Core Details + Creative Draft & Blueprint ── */}
          <div className="space-y-4">

          {/* CORE DETAILS — Publishing Mode + Scheduled Date */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Publishing mode */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontWeight: 700 }}>Publishing Mode</span>
                <div className="flex gap-1 p-0.5 bg-gray-100/80 rounded-lg">
                  {(["ORGANIC", "PAID_BOOSTED"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onUpdateItem({}, { brief: { ...brief, publishingMode: mode } })}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                        (brief?.publishingMode || "ORGANIC") === mode
                          ? mode === "PAID_BOOSTED"
                            ? "bg-amber-500 shadow-sm text-white"
                            : "bg-white shadow-sm text-gray-900"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {mode === "ORGANIC" ? "Organic" : (
                        <span className="flex items-center justify-center gap-1">
                          <Zap className="size-3" /> Paid / Boosted
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduled date */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontWeight: 700 }}>
                  Scheduled Date <span className="text-red-400 normal-case tracking-normal">*</span>
                </span>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative flex-1">
                        <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => onUpdateItem({ scheduledDate: e.target.value }, {})}
                          className={cn(
                            "pl-8 h-8 text-[11px] bg-gray-50/50",
                            !scheduledDate && "border-amber-300 bg-amber-50/30"
                          )}
                          required
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">Scheduled publish date{brief?.dueDate ? " · pre-filled from brief" : ""}</p></TooltipContent>
                  </Tooltip>
                  {!scheduledDate && (
                    <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Paid/Boosted — contextual requirements panel */}
            {isPaid && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden animate-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 border-b border-amber-200">
                  <Megaphone className="size-3.5 text-amber-700 shrink-0" />
                  <span className="text-[10px] text-amber-800" style={{ fontWeight: 700 }}>Paid / Boosted — required fields</span>
                </div>
                <div className="p-3 space-y-2.5">
                  {/* Campaign Name */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-amber-800 flex items-center gap-1" style={{ fontWeight: 700 }}>
                      <Tag className="size-3 text-amber-600" /> Campaign Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={campaignName}
                      onChange={(e) => onUpdateItem({}, { brief: { ...brief, campaignName: e.target.value } })}
                      placeholder="e.g. Spring Launch 2026"
                      className={cn(
                        "h-8 text-sm bg-white border-amber-300 focus:border-amber-400",
                        !campaignName && "border-red-300 bg-red-50/30"
                      )}
                    />
                    {!campaignName && (
                      <p className="text-[9px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-2.5" /> Required
                      </p>
                    )}
                  </div>

                  {/* Destination URL */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-amber-800 flex items-center gap-1" style={{ fontWeight: 700 }}>
                      <Link2 className="size-3 text-amber-600" /> Destination URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={destinationUrl}
                      onChange={(e) => onUpdateItem({}, { brief: { ...brief, destinationUrl: e.target.value } })}
                      placeholder="https://..."
                      type="url"
                      className={cn(
                        "h-8 text-sm bg-white border-amber-300 focus:border-amber-400",
                        !destinationUrl && "border-red-300 bg-red-50/30"
                      )}
                    />
                    {!destinationUrl && (
                      <p className="text-[9px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-2.5" /> Required
                      </p>
                    )}
                  </div>

                  {/* Legal / Compliance Approver */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-amber-800 flex items-center gap-1" style={{ fontWeight: 700 }}>
                      <UserCheck className="size-3 text-amber-600" /> Legal / Compliance Approver <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={brief?.legalApprover || ""}
                      onChange={(e) => onUpdateItem({}, { brief: { ...brief, legalApprover: e.target.value } })}
                      placeholder="Name or email"
                      className={cn(
                        "h-8 text-sm bg-white border-amber-300 focus:border-amber-400",
                        !brief?.legalApprover && "border-red-300 bg-red-50/30"
                      )}
                    />
                    {!brief?.legalApprover && (
                      <p className="text-[9px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="size-2.5" /> Required
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SLIDE COUNT — Photo Carousel only */}
          {isPhotoCarousel && (
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <GalleryHorizontal className="size-3.5 text-[#d94e33]" />
                <span className="text-[10px] text-gray-700 uppercase tracking-wider" style={{ fontWeight: 700 }}>Number of Slides</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 text-gray-400 hover:text-gray-600 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">TikTok Photo Carousel supports 2–35 slides. Each slide gets its own image and caption below.</p></TooltipContent>
                </Tooltip>
                <span className="ml-auto text-[11px] text-[#d94e33]" style={{ fontWeight: 700 }}>{slideCount} slides</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setSlideCount(n)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg border text-[11px] transition-all",
                      slideCount === n
                        ? "bg-[#d94e33] border-[#d94e33] text-white shadow-sm"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white"
                    )}
                    style={{ fontWeight: 600 }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <Star className="size-3 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-snug">
                  <span style={{ fontWeight: 700 }}>Cover image required.</span> TikTok shows this as the carousel thumbnail in the FYP feed before users swipe. Must be 9:16 or 1:1. Attach it in Assets →
                </p>
              </div>
            </div>
          )}

          {/* CREATIVE DRAFT / SLIDE EDITOR — Accordion */}
          <div className="rounded-xl border border-gray-100 shadow-sm bg-white overflow-hidden">
            <button
              onClick={() => setCreativeOpen(!creativeOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isPhotoCarousel
                  ? <GalleryHorizontal className="size-4 text-[#d94e33]" />
                  : <Sparkles className="size-4 text-[#d94e33]" />
                }
                <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                  {isPhotoCarousel ? "Slide Editor" : "Creative Draft & Blueprint"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">
                  {isPhotoCarousel ? `${slideCount} slides · Captions` : "Hook · Script · Shot list"}
                </span>
                {creativeOpen
                  ? <ChevronUp className="size-4 text-gray-400" />
                  : <ChevronDown className="size-4 text-gray-400" />
                }
              </div>
            </button>
            {creativeOpen && (
              <div className="animate-in slide-in-from-top-1 duration-200">

              {/* ══ PHOTO CAROUSEL SLIDE EDITOR ══ */}
              {isPhotoCarousel ? (
                <div className="divide-y divide-gray-100">
                  {/* Post caption */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontWeight: 700 }}>Post Caption</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3 text-gray-400 hover:text-gray-600 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">The caption below the carousel on TikTok — separate from per-slide text overlays.</p></TooltipContent>
                        </Tooltip>
                      </div>
                      <button
                        onClick={async () => {
                          setAiGeneratingScript(true);
                          await new Promise(r => setTimeout(r, 1400));
                          const generated = `Swipe through all ${slideCount} slides 👆 Save this for later! #tips #carousel`;
                          const nv = [...(outputs.scriptVersions || [])];
                          if (nv.length === 0) nv.push({ id: "sv-1", content: generated, version: 1, approved: false });
                          else nv[0] = { ...nv[0], content: generated };
                          handleOutputChange("scriptVersions", nv);
                          setAiGeneratingScript(false);
                        }}
                        disabled={aiGeneratingScript}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-purple-200 bg-purple-50 text-[10px] text-purple-700 hover:bg-purple-100 disabled:opacity-60 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        {aiGeneratingScript ? <><Sparkles className="size-3 animate-pulse" /> Writing…</> : <><Sparkles className="size-3" /> AI Generate</>}
                      </button>
                    </div>
                    <Textarea
                      placeholder="Write your post caption (appears below the carousel)…"
                      value={scriptContent}
                      onChange={(e) => {
                        const nv = [...(outputs.scriptVersions || [])];
                        if (nv.length === 0) nv.push({ id: "sv-1", content: e.target.value, version: 1, approved: false });
                        else nv[0] = { ...nv[0], content: e.target.value };
                        handleOutputChange("scriptVersions", nv);
                      }}
                      className="min-h-[72px] resize-none text-sm leading-relaxed bg-gray-50/50"
                    />
                  </div>

                  {/* Per-slide panels */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontWeight: 700 }}>
                        Slides <span className="ml-1 text-gray-300 font-normal normal-case">{slideCount} total</span>
                      </span>
                      <button
                        onClick={async () => {
                          setAiGeneratingScript(true);
                          await new Promise(r => setTimeout(r, 1800));
                          const captions = [
                            "🔥 Here's what nobody tells you…",
                            "✅ Step 1: Start with the basics",
                            "💡 The secret most people skip",
                            "📊 The data doesn't lie",
                            "🚀 Here's how to apply it today",
                            "⚡ Quick win you can do right now",
                            "🎯 The result? Game-changing",
                            "📌 Save this — you'll need it",
                            "🙌 Share with someone who needs this",
                            "💬 Comment your biggest takeaway",
                          ];
                          setSlides(prev => prev.map((s, i) => ({ ...s, caption: captions[i % captions.length] })));
                          setAiGeneratingScript(false);
                        }}
                        disabled={aiGeneratingScript}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-purple-200 bg-purple-50 text-[10px] text-purple-700 hover:bg-purple-100 disabled:opacity-60 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        {aiGeneratingScript ? <><Sparkles className="size-3 animate-pulse" /> Filling…</> : <><Sparkles className="size-3" /> AI Fill All</>}
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {slides.map((slide, idx) => (
                        <div
                          key={slide.id}
                          className={cn(
                            "rounded-xl border p-3 space-y-2.5 transition-colors",
                            idx === 0 ? "border-amber-200 bg-amber-50/40" : "border-gray-200 bg-white"
                          )}
                        >
                          {/* Slide header row */}
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex items-center justify-center size-6 rounded-full text-[10px] shrink-0",
                                idx === 0 ? "bg-amber-400 text-white" : "bg-gray-200 text-gray-600"
                              )}
                              style={{ fontWeight: 700 }}
                            >
                              {idx + 1}
                            </div>
                            <span className="text-[11px] text-gray-700" style={{ fontWeight: 700 }}>Slide {idx + 1}</span>
                            {idx === 0 && (
                              <Badge className="text-[8px] px-1.5 py-0 bg-amber-100 text-amber-700 border border-amber-300 gap-1">
                                <Star className="size-2" /> First shown
                              </Badge>
                            )}
                            {/* Per-slide AI caption */}
                            <button
                              onClick={async () => {
                                await new Promise(r => setTimeout(r, 700));
                                const caps = ["🔥 Here's what nobody tells you…", "✅ Apply this every day", "💡 This changes everything", "📌 Swipe to see the next step →"];
                                setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, caption: caps[idx % caps.length] } : s));
                              }}
                              className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-200 bg-purple-50 text-[9px] text-purple-700 hover:bg-purple-100 transition-colors"
                              style={{ fontWeight: 600 }}
                            >
                              <Sparkles className="size-2.5" /> AI
                            </button>
                          </div>

                          {/* Image attach */}
                          {slide.imageName ? (
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[11px] text-blue-700">
                              <ImageIcon className="size-3 shrink-0" />
                              <span className="truncate flex-1" style={{ fontWeight: 600 }}>{slide.imageName}</span>
                              <button
                                onClick={() => setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, imageName: undefined, imageUrl: undefined } : s))}
                                className="opacity-50 hover:opacity-100 shrink-0"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                ref={(el) => { slideImageRefs.current[slide.id] = el; }}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setSlides(prev => prev.map(s =>
                                      s.id === slide.id
                                        ? { ...s, imageName: file.name, imageUrl: URL.createObjectURL(file) }
                                        : s
                                    ));
                                  }
                                }}
                              />
                              <button
                                onClick={() => slideImageRefs.current[slide.id]?.click()}
                                className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors w-full justify-center",
                                  idx === 0
                                    ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white"
                                )}
                                style={{ fontWeight: 600 }}
                              >
                                <ImageIcon className="size-3" />
                                {idx === 0 ? "Attach image · 9:16 or 1:1" : "Attach image · 9:16 or 1:1"}
                              </button>
                            </>
                          )}

                          {/* Caption */}
                          <Textarea
                            value={slide.caption}
                            onChange={(e) => setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, caption: e.target.value } : s))}
                            placeholder={idx === 0 ? "Text overlay for slide 1 (your hook)…" : `Text overlay for slide ${idx + 1}…`}
                            className="min-h-[52px] resize-none text-[11px] leading-relaxed bg-white border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              ) : (
                /* ══ DEFAULT: Hook / Script / Shot List ══ */
                <div className="divide-y divide-gray-100">

                {/* ── HOOK ── */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontWeight: 700 }}>Hook</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3 text-gray-400 hover:text-gray-600 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Opening line that grabs attention in the first 1–3 seconds.</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <button
                      onClick={async () => {
                        setAiGeneratingHook(true);
                        setHookBankOpen(false);
                        await new Promise(r => setTimeout(r, 1400));
                        setHookBank([
                          "You've been doing this wrong your entire life — here's why.",
                          "Nobody talks about this, but it changes everything.",
                          "I tried this for 30 days. The results shocked me.",
                          "Stop scrolling. This one tip saves you hours every week.",
                          "The secret the experts don't want you to know about.",
                        ]);
                        setAiGeneratingHook(false);
                        setHookBankOpen(true);
                      }}
                      disabled={aiGeneratingHook}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-purple-200 bg-purple-50 text-[10px] text-purple-700 hover:bg-purple-100 disabled:opacity-60 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      {aiGeneratingHook
                        ? <><Sparkles className="size-3 animate-pulse" /> Generating…</>
                        : <><Sparkles className="size-3" /> Generate Hook Bank</>
                      }
                    </button>
                  </div>

                  <Textarea
                    placeholder="Write your hook here, or generate options below…"
                    value={hookContent}
                    onChange={(e) => handleOutputChange("hookVariants", [e.target.value])}
                    className="min-h-[64px] resize-none text-sm leading-relaxed bg-gray-50/50"
                  />

                  {/* Hook Bank */}
                  {hookBankOpen && hookBank.length > 0 && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-purple-700 uppercase tracking-wider" style={{ fontWeight: 700 }}>AI Hook Bank — click to use</span>
                        <button onClick={() => setHookBankOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="size-3" />
                        </button>
                      </div>
                      {hookBank.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            handleOutputChange("hookVariants", [h]);
                            setHookBankOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg border border-purple-100 bg-purple-50/60 text-[11px] text-gray-700 hover:border-purple-300 hover:bg-purple-50 transition-colors leading-relaxed"
                        >
                          "{h}"
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── SCRIPT / CAPTION ── */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontWeight: 700 }}>Script / Caption</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3 text-gray-400 hover:text-gray-600 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">The full spoken script or written caption body.</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <button
                      onClick={async () => {
                        setAiGeneratingScript(true);
                        await new Promise(r => setTimeout(r, 1800));
                        const generated = `${hookContent ? hookContent + "\n\n" : ""}Here's what most people get wrong about this topic — and it's costing them time, money, and energy.\n\nStep 1: Start by understanding the core principle. It's simpler than you think.\n\nStep 2: Apply it consistently for at least 14 days before judging results.\n\nStep 3: Track your progress and adjust as needed.\n\nThe truth is, the people who succeed aren't smarter — they just know the right framework.\n\nSave this for later and share it with someone who needs it. 👇`;
                        const newVersions = [...(outputs.scriptVersions || [])];
                        if (newVersions.length === 0) {
                          newVersions.push({ id: "sv-1", content: generated, version: 1, approved: false });
                        } else {
                          newVersions[0] = { ...newVersions[0], content: generated };
                        }
                        handleOutputChange("scriptVersions", newVersions);
                        setAiGeneratingScript(false);
                      }}
                      disabled={aiGeneratingScript}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-purple-200 bg-purple-50 text-[10px] text-purple-700 hover:bg-purple-100 disabled:opacity-60 transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      {aiGeneratingScript
                        ? <><Sparkles className="size-3 animate-pulse" /> Writing…</>
                        : <><Sparkles className="size-3" /> AI Generate</>
                      }
                    </button>
                  </div>
                  <Textarea
                    placeholder="Write your full script or caption here…"
                    value={scriptContent}
                    onChange={(e) => {
                      const newVersions = [...(outputs.scriptVersions || [])];
                      if (newVersions.length === 0) {
                        newVersions.push({ id: "sv-1", content: e.target.value, version: 1, approved: false });
                      } else {
                        newVersions[0] = { ...newVersions[0], content: e.target.value };
                      }
                      handleOutputChange("scriptVersions", newVersions);
                    }}
                    className="min-h-[200px] text-sm leading-relaxed bg-gray-50/50"
                  />
                </div>

                {/* ── A/B TEST YOUR COPY ── */}
                <Collapsible open={abOpen} onOpenChange={setAbOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 border-t border-gray-100 hover:bg-gray-50/70 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <FlaskConical className="size-3.5 text-[#d94e33]" />
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider" style={{ fontWeight: 700 }}>
                          A/B Test Your Copy
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "size-3.5 text-gray-400 transition-transform duration-200",
                          abOpen && "rotate-180"
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                    <div className="px-4 pb-4 pt-2">
                      <ABAnalyzer
                        pillars={[]}
                        segments={[]}
                        context="builder"
                        variantA={
                          outputs.hookVariants?.[0] ||
                          outputs.hook ||
                          outputs.postCopy ||
                          ""
                        }
                        onApplyCopy={(copy) => {
                          if (outputs.hookVariants?.[0] !== undefined || outputs.hook !== undefined) {
                            handleOutputChange("hook", copy);
                            handleOutputChange("hookVariants", [copy]);
                          } else {
                            handleOutputChange("postCopy", copy);
                          }
                        }}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* ── SEQUENCE / SHOT LIST ── */}
                <div className="p-4 space-y-3">

                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider" style={{ fontWeight: 700 }}>Shot List / Sequence</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3 text-gray-400 hover:text-gray-600 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">Each block is a discrete visual or audio moment. AI references your assets by name and distributes timing across the target duration.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => {
                          setAiGeneratingShotList(true);
                          await new Promise(r => setTimeout(r, 2000));
                          const durationStr = targetDuration.replace(/[^0-9]/g, "");
                          const totalSecs = targetDuration.includes("m")
                            ? parseInt(durationStr) * 60
                            : parseInt(durationStr) || 30;
                          const assetLabels = assets.map(a => a.label).filter(Boolean);
                          const ts = Date.now();
                          const generated: typeof sequenceBlocks = [];
                          generated.push({
                            id: `seq-${ts}-1`, type: "Shot", duration: "3s", aiGenerating: false,
                            description: hookContent
                              ? `Subject speaks hook to camera: "${hookContent.slice(0, 70)}${hookContent.length > 70 ? "…" : ""}". Tight frame, high energy, natural light.`
                              : "Opening hook — subject speaks directly to camera. Tight frame, confident eye contact, natural light.",
                          });
                          assetLabels.forEach((label, i) => {
                            const lc = label.toLowerCase();
                            if (lc.includes("logo") || lc.includes("brand")) {
                              generated.push({ id: `seq-${ts}-a${i}`, type: "Motion Graphic", duration: "2s", aiGenerating: false, description: `Animate "${label}" into frame. Lower-right corner lockup, 0.5s fade-in, hold for remainder. Transparent layer composited over B-roll.` });
                            } else if (lc.includes("voice") || lc.includes("audio") || lc.includes("narr")) {
                              generated.push({ id: `seq-${ts}-a${i}`, type: "Voiceover", duration: `${Math.round(totalSecs * 0.4)}s`, aiGenerating: false, description: `Play "${label}" over B-roll montage. Sync audio start to cut after hook. Volume 100%, no background music during this segment.` });
                            } else if (lc.includes(".mp4") || lc.includes(".mov") || lc.includes("video")) {
                              generated.push({ id: `seq-${ts}-a${i}`, type: "B-Roll", duration: "5s", aiGenerating: false, description: `Cut "${label}" into mid-section. Trim to most dynamic 5s. Speed-ramp if needed to match music BPM. Colour-matched to overall grade.` });
                            } else {
                              generated.push({ id: `seq-${ts}-a${i}`, type: "B-Roll", duration: "4s", aiGenerating: false, description: `Display "${label}" — slow 5% zoom in, warm grade. AI centres subject/product with lower-third composition rule.` });
                            }
                          });
                          generated.push({ id: `seq-${ts}-3`, type: "Voiceover", duration: `${Math.max(4, totalSecs - 12)}s`, aiGenerating: false, description: "Core message delivery over B-roll montage. AI syncs cuts to sentence boundaries in the script and selects best asset frames per key point." });
                          generated.push({ id: `seq-${ts}-4`, type: "Transition", duration: "0.5s", aiGenerating: false, description: "Whip-pan or match cut to CTA scene. Synced to audio beat if music track is present." });
                          generated.push({ id: `seq-${ts}-5`, type: "CTA", duration: "3s", aiGenerating: false, description: isPaid ? `End card: "${campaignName || "Campaign"}" branding + destination URL overlay. Bold text, logo lockup, 3s hold.` : "End card: follow/save/comment prompt. Animated lower-third text, 3s hold with fade out." });
                          setSequenceBlocks(generated);
                          setAiGeneratingShotList(false);
                        }}
                        disabled={aiGeneratingShotList}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-purple-200 bg-purple-50 text-[10px] text-purple-700 hover:bg-purple-100 disabled:opacity-60 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        {aiGeneratingShotList
                          ? <><Sparkles className="size-3 animate-pulse" /> Generating…</>
                          : <><Sparkles className="size-3" /> Generate All</>
                        }
                      </button>
                      <button
                        onClick={() => setSequenceBlocks(prev => [...prev, { id: `seq-${Date.now()}`, type: "Shot", description: "", duration: "5s", aiGenerating: false }])}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 bg-white text-[10px] text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <Plus className="size-3" /> Add Block
                      </button>
                    </div>
                  </div>

                  {/* Target Duration selector */}
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider shrink-0" style={{ fontWeight: 700 }}>Target</span>
                    <div className="flex gap-1 flex-wrap">
                      {["15s", "30s", "60s", "90s", "2m", "3m"].map(d => (
                        <button
                          key={d}
                          onClick={() => setTargetDuration(d)}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] border transition-all",
                            targetDuration === d
                              ? "bg-[#d94e33] border-[#d94e33] text-white"
                              : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                          )}
                          style={{ fontWeight: 600 }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    {sequenceBlocks.length > 0 && (
                      <span className="ml-auto text-[10px] text-gray-400 shrink-0">
                        {sequenceBlocks.length} block{sequenceBlocks.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Asset reference hint */}
                  {assets.length > 0 && (
                    <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                      <Paperclip className="size-3 text-blue-400 shrink-0 mt-0.5" />
                      <span className="text-[10px] text-blue-600 leading-relaxed">
                        <span style={{ fontWeight: 700 }}>Generate All</span> will assign each asset to a shot block: <span className="italic">{assets.map(a => a.label).join(", ")}</span>
                      </span>
                    </div>
                  )}

                  {/* Blocks */}
                  {sequenceBlocks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                      <Layers className="size-5 text-gray-300" />
                      <p className="text-[11px] text-gray-400">No blocks yet — <span className="font-semibold">Generate All</span> or <span className="font-semibold">Add Block</span> to start.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sequenceBlocks.map((block, idx) => (
                        <div key={block.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-2 group">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center size-5 rounded-full bg-gray-200 text-[9px] text-gray-600 shrink-0" style={{ fontWeight: 700 }}>
                              {idx + 1}
                            </span>
                            <Select
                              value={block.type}
                              onValueChange={(v) => setSequenceBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type: v } : b))}
                            >
                              <SelectTrigger className="h-6 text-[10px] w-36 border-gray-200 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["Shot", "B-Roll", "Voiceover", "Motion Graphic", "Transition", "CTA"].map(t => (
                                  <SelectItem key={t} value={t} className="text-[11px]">{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={block.duration}
                              onChange={(e) => setSequenceBlocks(prev => prev.map(b => b.id === block.id ? { ...b, duration: e.target.value } : b))}
                              placeholder="5s"
                              className="h-6 w-14 text-[10px] text-center border-gray-200 bg-white"
                            />
                            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={async () => {
                                  setSequenceBlocks(prev => prev.map(b => b.id === block.id ? { ...b, aiGenerating: true } : b));
                                  await new Promise(r => setTimeout(r, 1100));
                                  const descriptions: Record<string, string> = {
                                    "Shot": "Close-up on subject, natural light, direct eye contact. AI auto-crops to 9:16 safe zone.",
                                    "B-Roll": "Supporting visual — slow zoom in, warm colour grade. AI composites from available assets.",
                                    "Voiceover": "Audio over B-roll. AI syncs cuts to sentence boundaries in the script.",
                                    "Motion Graphic": "Animated graphic — brand colour palette, smooth ease-in, composited as overlay layer.",
                                    "Transition": "Match cut or whip-pan to next scene, synced to audio beat.",
                                    "CTA": isPaid ? `Paid end card: "${campaignName || "Campaign"}" branding + destination URL. 3s hold.` : "Organic end card: follow/save/comment prompt, animated lower-third, 3s hold.",
                                  };
                                  setSequenceBlocks(prev => prev.map(b => b.id === block.id ? { ...b, description: descriptions[b.type] || "AI-generated shot description.", aiGenerating: false } : b));
                                }}
                                disabled={block.aiGenerating}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-purple-200 bg-purple-50 text-[9px] text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
                                style={{ fontWeight: 600 }}
                              >
                                {block.aiGenerating ? <Sparkles className="size-2.5 animate-pulse" /> : <Sparkles className="size-2.5" />}
                                {block.aiGenerating ? "…" : "AI"}
                              </button>
                              <button
                                onClick={() => setSequenceBlocks(prev => prev.filter(b => b.id !== block.id))}
                                className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          </div>
                          <Textarea
                            value={block.description}
                            onChange={(e) => setSequenceBlocks(prev => prev.map(b => b.id === block.id ? { ...b, description: e.target.value } : b))}
                            placeholder={`Describe this ${block.type.toLowerCase()}…`}
                            className="min-h-[52px] resize-none text-[11px] leading-relaxed bg-white border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              )} {/* end isPhotoCarousel ternary */}

              </div>
            )}
          </div>

          </div>{/* end LEFT column */}

          {/* ── RIGHT: Assets + Flags ── */}
          <div className="space-y-4">

          {/* ASSETS */}
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="size-4 text-gray-500" />
                  <CardTitle className="text-base">Assets</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={addAsset} className="h-7 text-xs text-[#d94e33] hover:text-white hover:bg-[#d94e33] transition-colors">
                  <Plus className="size-3 mr-1" /> Add
                </Button>
              </div>
              <CardDescription>
                {isPhotoCarousel
                  ? "Attach your Cover image (required) and any additional source files."
                  : "Track and attach the source files for this post. The shot list references these directly."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {assets.map((asset) => {
                  const isCoverImage = isPhotoCarousel && asset.label.toLowerCase().includes("cover");
                  return (
                  <div key={asset.id} className={cn("p-3 hover:bg-gray-50 transition-colors group", isCoverImage && "bg-amber-50/30 border-b border-amber-100")}>
                    {isCoverImage && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="size-2.5 text-amber-500" />
                        <span className="text-[9px] text-amber-700 uppercase tracking-wider" style={{ fontWeight: 700 }}>Cover Image — Required · 9:16 or 1:1</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleAssetToggle(asset.id)}
                        className={cn(
                          "flex items-center justify-center size-5 rounded-full border transition-colors shrink-0",
                          asset.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 text-transparent hover:border-gray-400"
                        )}
                      >
                        <CheckCircle2 className="size-3.5" />
                      </button>
                      <div className="flex-1">
                        <Input
                          value={asset.label}
                          onChange={(e) => {
                            const updated = assets.map(a => a.id === asset.id ? { ...a, label: e.target.value } : a);
                            onUpdateItem({}, { assets: updated });
                          }}
                          className="h-7 text-sm bg-transparent border-transparent hover:border-gray-200 focus:bg-white"
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeAsset(asset.id)} className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="mt-2 ml-8">
                      {asset.fileName ? (
                        <div className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px]",
                          asset.aiGenerated
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        )}>
                          {asset.aiGenerated ? (
                            <Sparkles className="size-3 shrink-0" />
                          ) : (
                            <Paperclip className="size-3 shrink-0" />
                          )}
                          <span className="truncate flex-1" style={{ fontWeight: 600 }}>{asset.fileName}</span>
                          {asset.aiGenerated && (
                            <Badge variant="outline" className="text-[8px] border-purple-300 text-purple-600 px-1 py-0 shrink-0">AI</Badge>
                          )}
                          <button
                            onClick={() => removeFileFromAsset(asset.id)}
                            className="ml-auto text-current opacity-50 hover:opacity-100 shrink-0"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={(el) => { fileInputRefs.current[asset.id] = el; }}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileAttach(asset.id, file);
                            }}
                          />
                          <button
                            onClick={() => fileInputRefs.current[asset.id]?.click()}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-[11px] text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                            <Paperclip className="size-3" />
                            Attach file
                          </button>
                          <button
                            onClick={() => handleAiCreate(asset.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 text-[11px] text-purple-700 hover:bg-purple-100 transition-colors"
                            style={{ fontWeight: 600 }}
                          >
                            <Sparkles className="size-3" />
                            AI Create
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ); })}
                {assets.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No assets tracked yet. Click Add to create one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FLAGS — Collapsible */}
          <div className="rounded-xl border border-gray-100 shadow-sm bg-white overflow-hidden">
            <button
              onClick={() => setFlagsOpen(!flagsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-gray-500" />
                <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Flags</span>
                {activeFlagsCount > 0 && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 border">
                    {activeFlagsCount} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Compliance, talent, music &amp; accessibility</span>
                {flagsOpen
                  ? <ChevronUp className="size-4 text-gray-400" />
                  : <ChevronDown className="size-4 text-gray-400" />
                }
              </div>
            </button>

            {flagsOpen && (
              <div className="p-4 animate-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      key: "hasClaims", label: "Contains claims", icon: <Shield className="size-3 text-amber-500" />,
                      value: hasClaims,
                      hint: "Requires legal review",
                    },
                    {
                      key: "hasTalent", label: "Has talent/faces", icon: <Users className="size-3 text-blue-500" />,
                      value: hasTalent,
                      hint: "Talent release needed",
                    },
                    {
                      key: "hasMusic", label: "Uses music", icon: <Info className="size-3 text-purple-500" />,
                      value: hasMusic,
                      hint: "License required",
                    },
                    {
                      key: "needsA11y", label: "Accessibility", icon: <CheckCircle2 className="size-3 text-green-500" />,
                      value: needsA11y,
                      hint: needsA11y ? "Captions / alt text required" : "Not required",
                    },
                  ].map((flag) => (
                    <div
                      key={flag.key}
                      className={cn(
                        "flex flex-col gap-1 p-2.5 rounded-lg border transition-colors",
                        flag.value ? "border-gray-300 bg-gray-50" : "border-gray-100 bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {flag.icon}
                          <span className="text-[9px] font-bold text-gray-700">{flag.label}</span>
                        </div>
                        <Switch
                          checked={flag.value}
                          onCheckedChange={(v) => handleFlagChange(flag.key, v)}
                        />
                      </div>
                      <p className="text-[8px] text-gray-400 leading-tight">{flag.hint}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          </div>{/* end RIGHT column */}

        </div>{/* end TWO-COLUMN BODY */}

      </TooltipProvider>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 flex justify-between items-center px-4 md:px-8">
        <Button variant="ghost" onClick={onBack} className="text-gray-600">
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="gap-2">
            Close
          </Button>
          <Button onClick={onNext} className="bg-[#d94e33] hover:bg-[#c2462e] text-white shadow-md shadow-[#d94e33]/20 gap-2">
            Continue to Packaging
          </Button>
        </div>
      </div>
    </div>
  );
}