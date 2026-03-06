import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Info,
  Music,
  Eye,
  Shield,
  Settings2,
  Video,
  Image,
  FileText,
  Radio,
  Type,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
import type {
  Platform,
  ContentType,
  ContentBrief,
  ProductionOutput,
  BlueprintData,
  CanonicalContentType,
} from "../types";
import { CONTENT_TYPE_CONFIG } from "./production-config";

// ─── Props ───

interface BlueprintStudioProps {
  platform: Platform;
  contentType: ContentType;
  title: string;
  brief: ContentBrief;
  outputs: ProductionOutput;
  onUpdateOutputs: (outputs: ProductionOutput) => void;
  onNext: () => void;
  onBack: () => void;
}

// ─── Canonical Type Mapping ───

const CONTENT_TYPE_TO_CANONICAL: Record<ContentType, CanonicalContentType> = {
  reel: "VIDEO_SHORT_VERTICAL",
  carousel: "IMAGE_CAROUSEL",
  "feed-post": "IMAGE_SINGLE",
  story: "STORY_FRAME_SET",
  guide: "TEXT_POST",
  live: "LIVE_BROADCAST",
  "short-video": "VIDEO_SHORT_VERTICAL",
  "photo-carousel": "IMAGE_CAROUSEL",
  "long-form": "VIDEO_LONG_HORIZONTAL",
  shorts: "VIDEO_SHORT_VERTICAL",
  "live-stream": "LIVE_BROADCAST",
  "community-post": "TEXT_POST",
  "fb-feed-post": "IMAGE_SINGLE",
  "fb-link-post": "LINK_POST",
  "fb-reel": "VIDEO_SHORT_VERTICAL",
  "fb-story": "STORY_FRAME_SET",
  "fb-live": "LIVE_BROADCAST",
  "ln-text-post": "TEXT_POST",
  "ln-document": "DOCUMENT_CAROUSEL_PDF",
  "ln-article": "TEXT_POST",
  "ln-video": "VIDEO_SHORT_HORIZONTAL",
};

// ─── Helpers ───

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tbd: "TBD",
};

const CANONICAL_LABELS: Record<CanonicalContentType, string> = {
  VIDEO_SHORT_VERTICAL: "Short-form Video (9:16)",
  VIDEO_LONG_HORIZONTAL: "Long-form Video (16:9)",
  VIDEO_SHORT_HORIZONTAL: "Short Video (16:9)",
  IMAGE_SINGLE: "Single Image",
  IMAGE_CAROUSEL: "Image Carousel",
  TEXT_POST: "Text Post",
  LINK_POST: "Link Post",
  DOCUMENT_CAROUSEL_PDF: "Document / PDF Carousel",
  STORY_FRAME_SET: "Story Frame Set",
  LIVE_BROADCAST: "Live Broadcast",
};

type CanonicalGroup = "video" | "carousel_pdf" | "story" | "live" | "image" | "text_link";

function getCanonicalGroup(ct: CanonicalContentType): CanonicalGroup {
  if (ct.startsWith("VIDEO_")) return "video";
  if (ct === "IMAGE_CAROUSEL" || ct === "DOCUMENT_CAROUSEL_PDF") return "carousel_pdf";
  if (ct === "STORY_FRAME_SET") return "story";
  if (ct === "LIVE_BROADCAST") return "live";
  if (ct === "IMAGE_SINGLE") return "image";
  return "text_link";
}

function isVideoType(ct: CanonicalContentType): boolean {
  return ct.startsWith("VIDEO_");
}

function isLongFormVideo(ct: CanonicalContentType): boolean {
  return ct === "VIDEO_LONG_HORIZONTAL";
}

function needsAudio(ct: CanonicalContentType): boolean {
  return isVideoType(ct) || ct === "STORY_FRAME_SET" || ct === "LIVE_BROADCAST";
}

// ─── Format Profile Derivation ───

interface FormatSpec {
  label: string;
  aspectRatio: string;
  resolution: string;
}

function deriveFormatProfile(platform: Platform, canonical: CanonicalContentType): FormatSpec {
  const p = PLATFORM_LABELS[platform];
  switch (canonical) {
    case "VIDEO_SHORT_VERTICAL":
      return { label: `${p} — 9:16 — 1080x1920`, aspectRatio: "9:16", resolution: "1080x1920" };
    case "VIDEO_LONG_HORIZONTAL":
      return { label: `${p} — 16:9 — 1920x1080`, aspectRatio: "16:9", resolution: "1920x1080" };
    case "VIDEO_SHORT_HORIZONTAL":
      return { label: `${p} — 16:9 — 1920x1080`, aspectRatio: "16:9", resolution: "1920x1080" };
    case "IMAGE_SINGLE":
      return { label: `${p} — 1:1 / 4:5 — 1080x1080`, aspectRatio: "1:1", resolution: "1080x1080" };
    case "IMAGE_CAROUSEL":
      return { label: `${p} — 1:1 / 4:5 — 1080x1350`, aspectRatio: "4:5", resolution: "1080x1350" };
    case "DOCUMENT_CAROUSEL_PDF":
      return { label: `${p} Document — 4:5 / Letter`, aspectRatio: "4:5", resolution: "1080x1350" };
    case "STORY_FRAME_SET":
      return { label: `${p} Stories — 9:16 — 1080x1920`, aspectRatio: "9:16", resolution: "1080x1920" };
    case "LIVE_BROADCAST":
      return { label: `${p} Live — 16:9 — 1920x1080`, aspectRatio: "16:9", resolution: "1920x1080" };
    case "TEXT_POST":
      return { label: `${p} Text Post`, aspectRatio: "N/A", resolution: "N/A" };
    case "LINK_POST":
      return { label: `${p} Link Post — 1200x630`, aspectRatio: "1.91:1", resolution: "1200x630" };
    default:
      return { label: p, aspectRatio: "N/A", resolution: "N/A" };
  }
}

// ─── Runtime recommendations ───

function getRuntimeRange(canonical: CanonicalContentType, platform: Platform): { min: number; max: number; recommended: string } | null {
  if (!isVideoType(canonical)) return null;
  if (canonical === "VIDEO_LONG_HORIZONTAL") {
    return platform === "youtube"
      ? { min: 480, max: 3600, recommended: "8-20 min" }
      : { min: 120, max: 1800, recommended: "2-30 min" };
  }
  // Short-form
  switch (platform) {
    case "tiktok": return { min: 15, max: 180, recommended: "30-90 sec" };
    case "instagram": return { min: 15, max: 90, recommended: "15-60 sec" };
    case "youtube": return { min: 15, max: 60, recommended: "15-60 sec" };
    case "linkedin": return { min: 30, max: 600, recommended: "30 sec - 10 min" };
    default: return { min: 15, max: 180, recommended: "15-90 sec" };
  }
}

// ─── Default beat plans ───

function getDefaultBeats(canonical: CanonicalContentType): { id: string; label: string; checked: boolean }[] {
  const base = [
    { id: "beat-hook", label: "Hook", checked: true },
    { id: "beat-value", label: "Value / demonstration", checked: true },
  ];
  if (isLongFormVideo(canonical)) {
    return [
      ...base,
      { id: "beat-expand", label: "Deep dive / expansion", checked: true },
      { id: "beat-proof", label: "Proof / credibility", checked: false },
      { id: "beat-cta", label: "CTA", checked: true },
    ];
  }
  return [
    ...base,
    { id: "beat-proof", label: "Proof / credibility (optional)", checked: false },
    { id: "beat-cta", label: "CTA", checked: true },
  ];
}

function getDefaultRunOfShow(): { id: string; label: string; notes: string; checked: boolean }[] {
  return [
    { id: "ros-intro", label: "Intro", notes: "", checked: true },
    { id: "ros-main", label: "Main segment", notes: "", checked: true },
    { id: "ros-demo", label: "Demo / flow", notes: "", checked: true },
    { id: "ros-qa", label: "Q&A", notes: "", checked: true },
    { id: "ros-close", label: "CTA / close", notes: "", checked: true },
  ];
}

function getDefaultLiveRoles(): { id: string; role: string; assignee: string }[] {
  return [
    { id: "role-host", role: "Host", assignee: "" },
    { id: "role-mod", role: "Moderator", assignee: "" },
    { id: "role-tech", role: "Producer / Tech", assignee: "" },
  ];
}

// ─── Validation / Gating ───

interface ValidationItem {
  id: string;
  label: string;
  severity: "block" | "warn";
  suggestion?: string;
}

function runBlueprintValidation(
  bp: BlueprintData,
  canonical: CanonicalContentType,
  brief: ContentBrief,
  outputs: ProductionOutput,
): ValidationItem[] {
  const items: ValidationItem[] = [];
  const group = getCanonicalGroup(canonical);

  // Always: format_profile (auto-derived, always present)

  // VIDEO_*: runtime_seconds required
  if (isVideoType(canonical) && !bp.runtimeSeconds) {
    items.push({ id: "no-runtime", label: "Runtime target required", severity: "block" });
  }

  // STORY_FRAME_SET: unit_count_target required
  if (canonical === "STORY_FRAME_SET" && !bp.unitCountTarget) {
    items.push({ id: "no-frame-count", label: "Frame count required", severity: "block" });
  }

  // CAROUSEL / PDF: unit_count_target required
  if ((canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF") && !bp.unitCountTarget) {
    items.push({ id: "no-slide-count", label: "Slide/page count required", severity: "block" });
  }

  // LIVE: run_of_show + live_roles required
  if (canonical === "LIVE_BROADCAST") {
    if (!bp.runOfShow || bp.runOfShow.length === 0) {
      items.push({ id: "no-ros", label: "Run of show required", severity: "block" });
    }
    if (!bp.liveRoles || bp.liveRoles.length === 0) {
      items.push({ id: "no-roles", label: "Roles required", severity: "block" });
    }
  }

  // Accessibility decisions when needsAccessibility=true
  if (brief.needsAccessibility) {
    if ((isVideoType(canonical) || canonical === "LIVE_BROADCAST") && !bp.captionsStrategy) {
      items.push({ id: "no-captions", label: "Captions strategy required (accessibility)", severity: "block" });
    }
    if ((canonical === "IMAGE_SINGLE" || canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF") && !bp.altTextStrategy) {
      items.push({ id: "no-alt-text", label: "Alt text strategy required (accessibility)", severity: "block" });
    }
  }

  // ─── Warnings (non-blocking) ───
  const runtimeRange = getRuntimeRange(canonical, "instagram"); // generic check
  if (isVideoType(canonical) && bp.runtimeSeconds && runtimeRange) {
    if (bp.runtimeSeconds < runtimeRange.min || bp.runtimeSeconds > runtimeRange.max) {
      items.push({ id: "runtime-range", label: "Runtime outside recommended range", severity: "warn", suggestion: `Recommended: ${runtimeRange.recommended}` });
    }
  }

  if (brief.hasMusic && !bp.musicSource) {
    items.push({ id: "no-music-source", label: "Music flagged but no source noted", severity: "warn" });
  }

  if (brief.compliance.containsClaims && !bp.claimsRisk) {
    items.push({ id: "no-claims-risk", label: "Claims present but risk level not set", severity: "warn" });
  }

  if ((canonical === "STORY_FRAME_SET" || canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF") && bp.unitCountTarget && bp.unitCountTarget > 20) {
    items.push({ id: "high-count", label: "Unusually high frame/slide count", severity: "warn" });
  }

  return items;
}

// ─── AI Check Chips ───

interface AICheck {
  label: string;
  status: "pass" | "warn" | "fail";
  suggestion?: string;
}

function deriveAIChecks(
  bp: BlueprintData,
  canonical: CanonicalContentType,
  outputs: ProductionOutput,
): AICheck[] {
  const checks: AICheck[] = [];
  const group = getCanonicalGroup(canonical);

  if (isVideoType(canonical)) {
    // Hook timing
    const hasHookBeat = bp.beats?.some(b => b.label.toLowerCase().includes("hook") && b.checked);
    checks.push({
      label: "Hook timing",
      status: hasHookBeat ? "pass" : "warn",
      suggestion: hasHookBeat ? undefined : "Ensure hook is in first 3 seconds",
    });

    // Segment balance
    const checkedBeats = bp.beats?.filter(b => b.checked).length || 0;
    checks.push({
      label: "Segment balance",
      status: checkedBeats >= 3 ? "pass" : checkedBeats >= 2 ? "warn" : "fail",
      suggestion: checkedBeats < 3 ? "Add more segments for better pacing" : undefined,
    });

    // Safe-zone risk (if OST present)
    if (outputs.onScreenText) {
      checks.push({
        label: "Safe-zone risk",
        status: "warn",
        suggestion: "Verify OST doesn't overlap platform UI elements",
      });
    }

    // Accessibility
    checks.push({
      label: "Accessibility plan",
      status: bp.captionsStrategy ? "pass" : "warn",
      suggestion: bp.captionsStrategy ? undefined : "Set captions strategy",
    });
  }

  if (group === "carousel_pdf") {
    // Slide 1 hook
    const firstSlide = outputs.slideOutlines?.[0];
    const hasHook = firstSlide?.slideRole === "hook" || firstSlide?.headline?.toLowerCase().includes("hook");
    checks.push({
      label: "Slide 1 hook present",
      status: hasHook || (outputs.slideOutlines && outputs.slideOutlines.length > 0) ? "pass" : "warn",
      suggestion: hasHook ? undefined : "Ensure first slide grabs attention",
    });

    // CTA slide
    const hasCTA = outputs.slideOutlines?.some(s => s.isCTA || s.slideRole === "cta");
    checks.push({
      label: "CTA slide present",
      status: hasCTA ? "pass" : "warn",
      suggestion: hasCTA ? undefined : "Add a clear CTA to final slide",
    });
  }

  if (group === "story") {
    const hasFrames = outputs.storyFrames && outputs.storyFrames.length > 0;
    checks.push({
      label: "Frame 1 hook present",
      status: hasFrames ? "pass" : "warn",
      suggestion: hasFrames ? undefined : "Ensure first story frame hooks viewer",
    });
  }

  if (group === "live") {
    const rolesAssigned = bp.liveRoles?.every(r => r.assignee.trim().length > 0);
    checks.push({
      label: "Roles assigned",
      status: rolesAssigned ? "pass" : bp.liveRoles && bp.liveRoles.length > 0 ? "warn" : "fail",
      suggestion: rolesAssigned ? undefined : "Assign team members to all roles",
    });

    const rosComplete = bp.runOfShow?.every(r => r.checked);
    checks.push({
      label: "Run of show complete",
      status: rosComplete ? "pass" : "warn",
      suggestion: rosComplete ? undefined : "Confirm all run of show segments",
    });
  }

  return checks;
}

// ─── Component ───

export function BlueprintStudio({
  platform,
  contentType,
  title,
  brief,
  outputs,
  onUpdateOutputs,
  onNext,
  onBack,
}: BlueprintStudioProps) {
  const canonical: CanonicalContentType =
    brief.canonicalType || CONTENT_TYPE_TO_CANONICAL[contentType] || "TEXT_POST";
  const group = getCanonicalGroup(canonical);
  const formatSpec = deriveFormatProfile(platform, canonical);
  const runtimeRange = getRuntimeRange(canonical, platform);

  const hasCTA = !!(brief.primaryCta || (brief.strategy.ctaType && brief.strategy.ctaType !== "none"));
  const hasClaims = brief.compliance.containsClaims;
  const showAudio = needsAudio(canonical);
  const showAccessibility = brief.needsAccessibility !== false; // show by default unless explicitly false
  const showCompliance = hasClaims || brief.publishingMode === "PAID_BOOSTED";

  const [showAdvanced, setShowAdvanced] = useState(false);

  // ─── Initialize blueprint data ───

  useEffect(() => {
    if (!outputs.blueprintData || !outputs.blueprintData.formatProfile) {
      const bp = outputs.blueprintData || {
        structurePattern: "",
        units: [],
        engagementDrivers: [],
        formatCoherenceConfirmed: false,
        logicalProgressionConfirmed: false,
        accessibilityPlanConfirmed: false,
      };

      const newBp: BlueprintData = {
        ...bp,
        formatProfile: formatSpec.label,
        aspectRatio: formatSpec.aspectRatio,
        // Initialize beats for video types
        ...(isVideoType(canonical) && !bp.beats ? { beats: getDefaultBeats(canonical) } : {}),
        // Initialize run of show for live
        ...(canonical === "LIVE_BROADCAST" && !bp.runOfShow ? {
          runOfShow: getDefaultRunOfShow(),
          liveRoles: getDefaultLiveRoles(),
        } : {}),
        // Auto-fill audio plan defaults
        ...(showAudio && !bp.audioPlan ? {
          audioPlan: isLongFormVideo(canonical) ? "voiceover" : "original",
        } : {}),
        // Auto-fill captions default
        ...(isVideoType(canonical) && !bp.captionsStrategy ? {
          captionsStrategy: isLongFormVideo(canonical) ? "upload-srt" : "burned-in",
        } : {}),
        // Auto-fill CTA placement default
        ...(isVideoType(canonical) && hasCTA && !bp.ctaPlacement ? {
          ctaPlacement: isLongFormVideo(canonical) ? "repeated" : "end",
        } : {}),
        // Slide pattern default for carousels
        ...((canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF") && !bp.slidePattern ? {
          slidePattern: "steps-how-to",
        } : {}),
        // Story arc default
        ...(canonical === "STORY_FRAME_SET" && !bp.storyArc ? {
          storyArc: "tease-tip-cta",
        } : {}),
        // Unit count from draft data
        ...(!bp.unitCountTarget && outputs.slideOutlines ? {
          unitCountTarget: outputs.slideOutlines.length,
        } : {}),
        ...(!bp.unitCountTarget && outputs.storyFrames ? {
          unitCountTarget: outputs.storyFrames.length,
        } : {}),
      };

      onUpdateOutputs({ ...outputs, blueprintData: newBp });
      toast.success("Blueprint initialized from Brief + Draft");
    }
  }, []);

  const bp: BlueprintData = outputs.blueprintData || {
    structurePattern: "",
    units: [],
    engagementDrivers: [],
    formatCoherenceConfirmed: false,
    logicalProgressionConfirmed: false,
    accessibilityPlanConfirmed: false,
  };

  const updateBp = useCallback(
    (updates: Partial<BlueprintData>) => {
      onUpdateOutputs({
        ...outputs,
        blueprintData: { ...bp, ...updates },
      });
    },
    [outputs, bp, onUpdateOutputs]
  );

  // ─── Validation ───

  const validationItems = runBlueprintValidation(bp, canonical, brief, outputs);
  const blockers = validationItems.filter((v) => v.severity === "block");
  const warnings = validationItems.filter((v) => v.severity === "warn");
  const isComplete = blockers.length === 0;

  // ─── AI Checks ───
  const aiChecks = deriveAIChecks(bp, canonical, outputs);

  // ─── Status chip helper ───

  const StatusIcon = ({ status }: { status: "pass" | "warn" | "fail" }) => {
    if (status === "pass") return <CheckCircle2 className="size-3 text-green-600" />;
    if (status === "warn") return <AlertTriangle className="size-3 text-amber-500" />;
    return <XCircle className="size-3 text-red-500" />;
  };

  // ─── Field Label ───

  const FieldLabel = ({ label, required, helper }: { label: string; required?: boolean; helper?: string }) => (
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-xs text-gray-600">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {helper && (
        <span className="text-[10px] text-gray-400 italic">{helper}</span>
      )}
    </div>
  );

  // ─── Read-only pill ───

  const ReadOnlyPill = ({ label, value }: { label: string; value: string }) => (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] text-gray-600">
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );

  // ─── Inline section label ───
  const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );

  return (
    <div className="space-y-1.5">
      {/* ─── COMPACT HEADER BAR ─── */}
      <div className="flex items-center gap-2 px-0.5 flex-wrap">
        <div className="flex flex-wrap items-center gap-1 flex-1">
          <ReadOnlyPill label="Platform" value={PLATFORM_LABELS[platform]} />
          <ReadOnlyPill label="Type" value={CANONICAL_LABELS[canonical]} />
          <ReadOnlyPill label="Objective" value={brief.strategy.objective} />
          {brief.publishingMode && (
            <ReadOnlyPill label="Mode" value={brief.publishingMode === "PAID_BOOSTED" ? "Paid" : "Organic"} />
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] px-1.5 py-0 shrink-0",
            isComplete ? "border-green-300 text-green-700 bg-green-50" : "border-gray-200 text-gray-500"
          )}
        >
          {isComplete ? "Complete" : `${blockers.length} blocker${blockers.length !== 1 ? "s" : ""}`}
        </Badge>
      </div>

      {/* ─── 2-COLUMN LAYOUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-1.5 items-start">

        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-1.5 min-w-0">

          {/* ─── FORMAT ─── */}
          <Card className="border-gray-100">
            <CardContent className="px-3 pt-2 pb-1">
              <div className="space-y-1">
                <SectionLabel icon={<Video className="size-3" />} label="Format" />
                <p className="text-[9px] text-gray-400 -mt-0.5 mb-1">Auto-derived from platform and content type. Enter runtime or unit count to pass format validation.</p>
                <div className="px-2 py-1 rounded bg-gray-50 border border-gray-100 text-xs text-gray-700 truncate h-7 flex items-center">
                  {formatSpec.label}
                </div>
                {isVideoType(canonical) && (
                  <div>
                    <FieldLabel
                      label={isLongFormVideo(canonical) ? "Runtime (min)" : "Runtime (sec)"}
                      required
                      helper={runtimeRange?.recommended}
                    />
                    <Input
                      type="number"
                      value={
                        isLongFormVideo(canonical)
                          ? bp.runtimeSeconds ? Math.round(bp.runtimeSeconds / 60) : ""
                          : bp.runtimeSeconds || ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value ? Number(e.target.value) : undefined;
                        updateBp({ runtimeSeconds: raw !== undefined && isLongFormVideo(canonical) ? raw * 60 : raw });
                      }}
                      placeholder={isLongFormVideo(canonical) ? "10" : "60"}
                      className="h-7 text-xs w-24"
                      min={1}
                    />
                    {bp.runtimeSeconds && runtimeRange && (bp.runtimeSeconds < runtimeRange.min || bp.runtimeSeconds > runtimeRange.max) && (
                      <p className="text-[9px] text-amber-600 mt-0.5">Outside range</p>
                    )}
                  </div>
                )}
                {(canonical === "STORY_FRAME_SET" || canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF") && (
                  <div>
                    <FieldLabel label={canonical === "STORY_FRAME_SET" ? "Frames" : "Slides"} required />
                    <Input type="number" value={bp.unitCountTarget || ""} onChange={(e) => updateBp({ unitCountTarget: e.target.value ? Number(e.target.value) : undefined })} placeholder="8" className="h-7 text-xs w-24" min={1} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── AUDIO ─── */}
          {showAudio && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-1">
                <div className="space-y-1">
                  <SectionLabel icon={<Music className="size-3" />} label="Audio" />
                  <p className="text-[9px] text-gray-400 -mt-0.5 mb-1">Specify how audio will be handled in production. Flag licensed tracks so the assets team can source or clear them.</p>
                  <Select value={bp.audioPlan || "original"} onValueChange={(v) => updateBp({ audioPlan: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original" className="text-xs">Original audio</SelectItem>
                      <SelectItem value="voiceover" className="text-xs">Voiceover</SelectItem>
                      <SelectItem value="licensed-track" className="text-xs">Licensed track</SelectItem>
                      <SelectItem value="platform-library" className="text-xs">Platform library</SelectItem>
                      <SelectItem value="none" className="text-xs">None</SelectItem>
                    </SelectContent>
                  </Select>
                  {(bp.audioPlan === "licensed-track" || bp.audioPlan === "platform-library" || brief.hasMusic) && (
                    <div>
                      <FieldLabel label="Source" helper="Details in Assets" />
                      <Input value={bp.musicSource || ""} onChange={(e) => updateBp({ musicSource: e.target.value })} placeholder="Track, artist..." className="h-7 text-xs" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── ACCESSIBILITY ─── */}
          {showAccessibility && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-1">
                <div className="space-y-1">
                  <SectionLabel icon={<Eye className="size-3" />} label="Accessibility" />
                  <p className="text-[9px] text-gray-400 -mt-0.5 mb-1">Define captions, alt text, and motion safety decisions to meet platform and audience standards.</p>
                  {(isVideoType(canonical) || canonical === "LIVE_BROADCAST") && (
                    <div>
                      <FieldLabel label="Captions" required={brief.needsAccessibility === true} />
                      <div className="flex flex-wrap gap-0.5">
                        {[
                          { value: "burned-in", label: "Burned-in" },
                          { value: "upload-srt", label: "Upload SRT/VTT" },
                          { value: "platform-auto", label: "Platform auto" },
                        ].map(({ value, label }) => {
                          const sel = bp.captionsStrategy === value;
                          return (
                            <button
                              key={value}
                              onClick={() => updateBp({ captionsStrategy: sel ? "" : value })}
                              className={cn("px-2 py-1 rounded text-xs border transition-colors", sel ? "bg-[#d94e33]/10 text-[#d94e33] border-[#d94e33]/30" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {bp.captionsStrategy === "platform-auto" && <p className="text-[10px] text-amber-600 mt-0.5">May miss wellness terms</p>}
                    </div>
                  )}
                  {(canonical === "IMAGE_SINGLE" || canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF") && (
                    <div>
                      <FieldLabel label="Alt text" required={brief.needsAccessibility === true} />
                      <Select value={bp.altTextStrategy || ""} onValueChange={(v) => updateBp({ altTextStrategy: v })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per-post" className="text-xs">Per post</SelectItem>
                          <SelectItem value="per-slide" className="text-xs">Per slide</SelectItem>
                          <SelectItem value="not-needed" className="text-xs">Not needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <FieldLabel label="Safety" helper="Optional" />
                    <div className="flex flex-wrap gap-0.5">
                      {["Flashing", "Rapid cuts", "Contrast", "Font size"].map((item, idx) => {
                        const full = ["Avoid flashing", "Avoid rapid cuts", "Text contrast check", "Readable font size"];
                        const sel = bp.motionSafety?.includes(full[idx]);
                        return (
                          <button key={item} onClick={() => { const c = bp.motionSafety || []; updateBp({ motionSafety: sel ? c.filter(i => i !== full[idx]) : [...c, full[idx]] }); }}
                            className={cn("px-2 py-1 rounded text-xs border", sel ? "bg-[#d94e33]/10 text-[#d94e33] border-[#d94e33]/30" : "bg-white text-gray-500 border-gray-200")}>{item}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── COMPLIANCE ─── */}
          {showCompliance && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-1">
                <SectionLabel icon={<Shield className="size-3" />} label="Compliance" />
                <p className="text-[9px] text-gray-400 -mt-0.5 mb-1">Set claims risk and required disclaimers for wellness content or paid promotion to protect the brand.</p>
                <div className="flex gap-3 mt-0.5">
                  {hasClaims && (
                    <div>
                      <FieldLabel label="Claims risk" />
                      <Select value={bp.claimsRisk || "medium"} onValueChange={(v) => updateBp({ claimsRisk: v })}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low" className="text-xs">Low</SelectItem>
                          <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                          <SelectItem value="high" className="text-xs">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {(hasClaims || brief.publishingMode === "PAID_BOOSTED") && (
                    <div>
                      <FieldLabel label="Disclaimer" />
                      <Select value={bp.disclaimerPattern || ""} onValueChange={(v) => updateBp({ disclaimerPattern: v })}>
                        <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="results-vary" className="text-xs">Results vary</SelectItem>
                          <SelectItem value="not-medical" className="text-xs">Not medical advice</SelectItem>
                          <SelectItem value="consult-pro" className="text-xs">Consult a professional</SelectItem>
                          <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── STRUCTURE PLAN ─── */}
          {group !== "text_link" && group !== "image" && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-2.5">
                <div className="space-y-1">
                  <SectionLabel icon={<FileText className="size-3" />} label="Structure Plan" />
                  <p className="text-[9px] text-gray-400 -mt-0.5 mb-1.5">
                    {group === "video"
                      ? "Maps the beat sequence and CTA placement for this video. Each active beat becomes a timed segment handed to the editor."
                      : group === "carousel_pdf"
                      ? "Defines the narrative pattern across slides and confirms a CTA slide is present before handoff to design."
                      : group === "story"
                      ? "Sets the story arc and interactive sticker plan across frames to drive engagement, saves, and replies."
                      : "Outlines the run of show, role assignments, and engagement prompts for the live broadcast team."}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {isVideoType(canonical) && (
                    <>
                      <div>
                        <FieldLabel label="Beat plan" helper="Edit as needed" />
                        <div className="space-y-0.5">
                          {(bp.beats || getDefaultBeats(canonical)).map((beat, i) => (
                            <div key={beat.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-gray-100 bg-white">
                              <Checkbox checked={beat.checked} onCheckedChange={(v) => { const u = [...(bp.beats || getDefaultBeats(canonical))]; u[i] = { ...u[i], checked: !!v }; updateBp({ beats: u }); }} />
                              <Input value={beat.label} onChange={(e) => { const u = [...(bp.beats || getDefaultBeats(canonical))]; u[i] = { ...u[i], label: e.target.value }; updateBp({ beats: u }); }} className="h-7 text-xs border-none shadow-none px-1 flex-1" />
                              <button onClick={() => updateBp({ beats: (bp.beats || []).filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-400 p-0.5"><Trash2 className="size-2.5" /></button>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1 text-gray-500" onClick={() => updateBp({ beats: [...(bp.beats || getDefaultBeats(canonical)), { id: `beat-${Date.now()}`, label: "New beat", checked: false }] })}>
                            <Plus className="size-2.5" /> Add beat
                          </Button>
                        </div>
                      </div>
                      {hasCTA && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-600">CTA placement</span>
                          <Select value={bp.ctaPlacement || "end"} onValueChange={(v) => updateBp({ ctaPlacement: v as any })}>
                            <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="early" className="text-xs">Early</SelectItem>
                              <SelectItem value="middle" className="text-xs">Middle</SelectItem>
                              <SelectItem value="end" className="text-xs">End</SelectItem>
                              <SelectItem value="repeated" className="text-xs">Repeated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  {(canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF") && (
                    <div className="flex items-end gap-3 flex-wrap">
                      <div>
                        <FieldLabel label="Slide pattern" />
                        <Select value={bp.slidePattern || "steps-how-to"} onValueChange={(v) => updateBp({ slidePattern: v })}>
                          <SelectTrigger className="h-7 text-xs w-44"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="problem-solution" className="text-xs">Problem → Solution</SelectItem>
                            <SelectItem value="steps-how-to" className="text-xs">Steps / How-to</SelectItem>
                            <SelectItem value="myth-bust" className="text-xs">Myth-bust</SelectItem>
                            <SelectItem value="checklist" className="text-xs">Checklist</SelectItem>
                            <SelectItem value="before-after" className="text-xs">Before / After</SelectItem>
                            <SelectItem value="faq" className="text-xs">FAQ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(() => {
                        const has = outputs.slideOutlines?.some(s => s.isCTA || s.slideRole === "cta");
                        return <Badge variant="outline" className={cn("text-[9px] gap-1 mb-1", has ? "border-green-200 text-green-700 bg-green-50" : "border-amber-200 text-amber-700 bg-amber-50")}>
                          {has ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                          {has ? "CTA slide" : "No CTA slide"}
                        </Badge>;
                      })()}
                    </div>
                  )}

                  {canonical === "STORY_FRAME_SET" && (
                    <>
                      <div>
                        <FieldLabel label="Story arc" />
                        <Select value={bp.storyArc || "tease-tip-cta"} onValueChange={(v) => updateBp({ storyArc: v })}>
                          <SelectTrigger className="h-7 text-xs w-48"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tease-tip-cta" className="text-xs">Tease → Tip → CTA</SelectItem>
                            <SelectItem value="poll-reveal-cta" className="text-xs">Poll → Reveal → CTA</SelectItem>
                            <SelectItem value="challenge-responses-cta" className="text-xs">Challenge → Responses → CTA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel label="Stickers" helper="Optional" />
                        <div className="flex flex-wrap gap-0.5">
                          {["Poll", "Questions", "Quiz", "Link sticker", "Countdown"].map((item) => {
                            const sel = bp.interactiveElements?.includes(item);
                            return <button key={item} onClick={() => { const c = bp.interactiveElements || []; updateBp({ interactiveElements: sel ? c.filter(i => i !== item) : [...c, item] }); }}
                              className={cn("px-1.5 py-0.5 rounded text-[8px] border", sel ? "bg-[#d94e33] text-white border-[#d94e33]" : "bg-white text-gray-600 border-gray-200")}>{item}</button>;
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {canonical === "LIVE_BROADCAST" && (
                    <>
                      <div>
                        <FieldLabel label="Run of show" required />
                        <div className="space-y-0.5">
                          {(bp.runOfShow || getDefaultRunOfShow()).map((item, i) => (
                            <div key={item.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-gray-100 bg-white">
                              <Checkbox checked={item.checked} onCheckedChange={(v) => { const u = [...(bp.runOfShow || getDefaultRunOfShow())]; u[i] = { ...u[i], checked: !!v }; updateBp({ runOfShow: u }); }} />
                              <Input value={item.label} onChange={(e) => { const u = [...(bp.runOfShow || getDefaultRunOfShow())]; u[i] = { ...u[i], label: e.target.value }; updateBp({ runOfShow: u }); }} className="h-7 text-xs border-none shadow-none px-0 flex-1" />
                              <Input value={item.notes} onChange={(e) => { const u = [...(bp.runOfShow || getDefaultRunOfShow())]; u[i] = { ...u[i], notes: e.target.value }; updateBp({ runOfShow: u }); }} placeholder="notes..." className="h-7 text-xs border-none shadow-none px-0 text-gray-400 w-20" />
                              <button onClick={() => updateBp({ runOfShow: (bp.runOfShow || []).filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-400 p-0.5"><Trash2 className="size-2.5" /></button>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1 text-gray-500" onClick={() => updateBp({ runOfShow: [...(bp.runOfShow || getDefaultRunOfShow()), { id: `ros-${Date.now()}`, label: "New segment", notes: "", checked: false }] })}>
                            <Plus className="size-2.5" /> Add segment
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {(bp.liveRoles || getDefaultLiveRoles()).map((role, i) => (
                          <div key={role.id}>
                            <FieldLabel label={role.role} required />
                            <Input value={role.assignee} onChange={(e) => { const u = [...(bp.liveRoles || getDefaultLiveRoles())]; u[i] = { ...u[i], assignee: e.target.value }; updateBp({ liveRoles: u }); }} placeholder="Assign..." className="h-7 text-xs" />
                          </div>
                        ))}
                      </div>
                      <div>
                        <FieldLabel label="Engagement plan" helper="Recommended" />
                        <Textarea value={bp.liveEngagementPlan || ""} onChange={(e) => updateBp({ liveEngagementPlan: e.target.value })} placeholder="Polls, Q&A prompts, giveaways..." className="min-h-[36px] resize-none text-xs" />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── ADVANCED ─── */}
          <Card className="border-gray-100 overflow-hidden">
            <button className="w-full flex items-center justify-between px-3 pt-2 pb-1.5 hover:bg-gray-50/50 transition-colors" onClick={() => setShowAdvanced(!showAdvanced)}>
              <div className="flex items-center gap-1.5">
                <Settings2 className="size-3.5 text-gray-400" />
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Advanced</span>
              </div>
              <ChevronDown className={cn("size-3 text-gray-400 transition-transform", showAdvanced && "rotate-180")} />
            </button>
            {showAdvanced && (
              <CardContent className="px-3 pb-2 pt-0 border-t border-gray-50">
                <p className="text-[9px] text-gray-400 mt-1 mb-1.5">Production-only fields for the shoot or edit team: notes, shot list, chapter markers, and brand style constraints.</p>
                <div className="space-y-1.5">
                  <div>
                    <FieldLabel label="Notes to production" />
                    <Textarea value={bp.productionNotes || ""} onChange={(e) => updateBp({ productionNotes: e.target.value })} placeholder="Additional notes..." className="min-h-[36px] resize-none text-xs" />
                  </div>
                  {isLongFormVideo(canonical) && (
                    <div>
                      <FieldLabel label="Shot list" />
                      <div className="space-y-0.5">
                        {(bp.shotList || []).map((shot, i) => (
                          <div key={shot.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-gray-100 bg-white">
                            <Checkbox checked={shot.checked} onCheckedChange={(v) => { const u = [...(bp.shotList || [])]; u[i] = { ...u[i], checked: !!v }; updateBp({ shotList: u }); }} />
                            <Input value={shot.label} onChange={(e) => { const u = [...(bp.shotList || [])]; u[i] = { ...u[i], label: e.target.value }; updateBp({ shotList: u }); }} className="h-7 text-xs border-none shadow-none px-1 flex-1" />
                            <button onClick={() => updateBp({ shotList: (bp.shotList || []).filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-400 p-0.5"><Trash2 className="size-2.5" /></button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1 text-gray-500" onClick={() => updateBp({ shotList: [...(bp.shotList || []), { id: `shot-${Date.now()}`, label: "New shot", checked: false }] })}>
                          <Plus className="size-2.5" /> Add shot
                        </Button>
                      </div>
                    </div>
                  )}
                  {isLongFormVideo(canonical) && platform === "youtube" && (
                    <div>
                      <FieldLabel label="Chapter plan" />
                      <Textarea value={bp.chaptersPlan || ""} onChange={(e) => updateBp({ chaptersPlan: e.target.value })} placeholder="00:00 Intro&#10;02:30 Main topic" className="min-h-[36px] resize-none text-xs font-mono" />
                    </div>
                  )}
                  <div>
                    <FieldLabel label="Brand style constraints" />
                    <Textarea value={bp.brandStyleConstraints || ""} onChange={(e) => updateBp({ brandStyleConstraints: e.target.value })} placeholder="Fonts, colors, logo rules..." className="min-h-[36px] resize-none text-xs" />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* ─── RIGHT COLUMN: Status + AI ─── */}
        <div className="space-y-1.5 lg:sticky lg:top-4">
          <Card className={cn("border overflow-hidden", isComplete ? "border-green-200 bg-green-50/30" : "border-gray-100")}>
            <CardContent className="px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                {isComplete ? <CheckCircle2 className="size-3 text-green-600" /> : <Info className="size-3 text-gray-400" />}
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{isComplete ? "Ready" : "Status"}</span>
              </div>
              {blockers.length > 0 && (
                <div className="space-y-0.5 mb-1">
                  {blockers.map((b) => (
                    <div key={b.id} className="flex items-start gap-1 text-[8px] text-red-600">
                      <XCircle className="size-2 shrink-0 mt-px" /><span>{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {warnings.length > 0 && (
                <div className="space-y-0.5">
                  {warnings.map((w) => (
                    <div key={w.id} className="flex items-start gap-1 text-[8px] text-amber-600">
                      <AlertTriangle className="size-2 shrink-0 mt-px" /><span>{w.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {isComplete && blockers.length === 0 && warnings.length === 0 && (
                <p className="text-[8px] text-green-600">All set. Ready to proceed.</p>
              )}
            </CardContent>
          </Card>

          {aiChecks.length > 0 && (
            <Card className="border-gray-100 overflow-hidden">
              <CardContent className="px-2.5 py-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="size-3 text-[#d94e33]" />
                  <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>AI Checks</span>
                  <Badge variant="outline" className="text-[7px] px-1 py-0 border-gray-200 text-gray-400 ml-auto">Preview</Badge>
                </div>
                <div className="space-y-0.5">
                  {aiChecks.map((check, i) => (
                    <div key={i} className={cn("flex items-start gap-1 px-1.5 py-0.5 rounded border text-[9px]",
                      check.status === "pass" && "border-green-100 bg-green-50/50",
                      check.status === "warn" && "border-amber-100 bg-amber-50/50",
                      check.status === "fail" && "border-red-100 bg-red-50/50")}>
                      <StatusIcon status={check.status} />
                      <div className="min-w-0">
                        <span className={cn(check.status === "pass" && "text-green-700", check.status === "warn" && "text-amber-700", check.status === "fail" && "text-red-700")}>{check.label}</span>
                        {check.suggestion && <p className="text-[8px] text-gray-400">{check.suggestion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[7px] text-gray-400 mt-1 italic">Advisory. Hard blocks at QA.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onBack}>
          <ChevronLeft className="size-3 mr-1" /> Draft
        </Button>
        <div className="flex items-center gap-2">
          {!isComplete && <span className="text-[9px] text-amber-600">{blockers.length} blocker{blockers.length !== 1 ? "s" : ""}</span>}
          <Button className="bg-[#d94e33] hover:bg-[#c4452d] gap-1 h-7 text-xs" onClick={onNext}>
            Continue to Assets <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}