import React, { useState } from "react";
import {
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Monitor,
  Smartphone,
  Film,
  Image as ImageIcon,
  LayoutGrid,
  FileText,
  Link,
  BookOpen,
  Layers,
  Radio,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Plus,
  Sparkles,
  Trash2,
  Shield,
  Users,
  Calendar,
  ExternalLink,
  Info,
  Zap,
  Target,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  ContentBrief,
  CanonicalContentType,
  Platform,
  ContentType,
  ContentPillar,
  AudienceSegment,
  ProductionSource,
  Objective,
} from "../types";
import { PLATFORM_CONFIG, PLATFORM_CONTENT_TYPES } from "../types";
import { getCurrentUserRole, hasPermission } from "./role-permissions";

// ─── Props ────────────────────────────────────────────────────────────────────

interface BriefBuilderProps {
  platform: Platform;
  contentType: ContentType;
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  brief: ContentBrief | undefined;
  sources: ProductionSource[];
  onUpdateBrief: (brief: ContentBrief) => void;
  onUpdateSources: (sources: ProductionSource[]) => void;
  onApproveBrief: () => void;
  onUnlockBrief?: () => void;
  onNext: () => void;
  onUpdatePlatform?: (platform: Platform) => void;
  onUpdateContentType?: (contentType: ContentType) => void;
}

// ─── Platform → Canonical Type map ───────────────────────────────────────────

const PLATFORM_CANONICAL_TYPES: Record<Platform, CanonicalContentType[]> = {
  instagram: ["VIDEO_SHORT_VERTICAL", "IMAGE_SINGLE", "IMAGE_CAROUSEL", "STORY_FRAME_SET", "LIVE_BROADCAST"],
  tiktok:    ["VIDEO_SHORT_VERTICAL", "IMAGE_CAROUSEL", "LIVE_BROADCAST"],
  youtube:   ["VIDEO_LONG_HORIZONTAL", "VIDEO_SHORT_VERTICAL", "LIVE_BROADCAST", "TEXT_POST"],
  facebook:  ["VIDEO_SHORT_VERTICAL", "VIDEO_LONG_HORIZONTAL", "IMAGE_SINGLE", "IMAGE_CAROUSEL", "STORY_FRAME_SET", "LINK_POST", "LIVE_BROADCAST"],
  linkedin:  ["VIDEO_SHORT_VERTICAL", "VIDEO_LONG_HORIZONTAL", "VIDEO_SHORT_HORIZONTAL", "IMAGE_SINGLE", "IMAGE_CAROUSEL", "TEXT_POST", "LINK_POST", "DOCUMENT_CAROUSEL_PDF"],
  tbd:       ["VIDEO_SHORT_VERTICAL", "IMAGE_SINGLE", "IMAGE_CAROUSEL"],
};

// Canonical → ContentType per platform (for backward compat with DraftStudio)
const CANONICAL_TO_CONTENT_TYPE: Record<Platform, Partial<Record<CanonicalContentType, ContentType>>> = {
  instagram: { VIDEO_SHORT_VERTICAL: "reel", IMAGE_SINGLE: "feed-post", IMAGE_CAROUSEL: "carousel", STORY_FRAME_SET: "story", LIVE_BROADCAST: "live" },
  tiktok:    { VIDEO_SHORT_VERTICAL: "short-video", IMAGE_CAROUSEL: "photo-carousel", LIVE_BROADCAST: "short-video" },
  youtube:   { VIDEO_LONG_HORIZONTAL: "long-form", VIDEO_SHORT_VERTICAL: "shorts", LIVE_BROADCAST: "live-stream", TEXT_POST: "community-post" },
  facebook:  { VIDEO_SHORT_VERTICAL: "fb-reel", VIDEO_LONG_HORIZONTAL: "fb-feed-post", IMAGE_SINGLE: "fb-feed-post", IMAGE_CAROUSEL: "fb-feed-post", STORY_FRAME_SET: "fb-story", LINK_POST: "fb-link-post", LIVE_BROADCAST: "fb-live" },
  linkedin:  { VIDEO_SHORT_VERTICAL: "ln-video", VIDEO_LONG_HORIZONTAL: "ln-video", VIDEO_SHORT_HORIZONTAL: "ln-video", IMAGE_SINGLE: "ln-text-post", IMAGE_CAROUSEL: "ln-document", TEXT_POST: "ln-text-post", LINK_POST: "ln-text-post", DOCUMENT_CAROUSEL_PDF: "ln-document" },
  tbd:       { VIDEO_SHORT_VERTICAL: "reel", IMAGE_SINGLE: "feed-post", IMAGE_CAROUSEL: "carousel" },
};

// ─── Canonical Type Meta ──────────────────────────────────────────────────────

interface CanonicalMeta {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const CANONICAL_META: Record<CanonicalContentType, CanonicalMeta> = {
  VIDEO_SHORT_VERTICAL:  { label: "Short Video (Vertical)", shortLabel: "Short Video (Vertical)",  icon: <Smartphone className="size-3.5" /> },
  VIDEO_LONG_HORIZONTAL: { label: "Long-form Video",         shortLabel: "Long Video",   icon: <Monitor className="size-3.5" /> },
  VIDEO_SHORT_HORIZONTAL:{ label: "Horizontal Short Video",  shortLabel: "Horiz. Video", icon: <Film className="size-3.5" /> },
  IMAGE_SINGLE:          { label: "Single Image Post",        shortLabel: "Image Post",   icon: <ImageIcon className="size-3.5" /> },
  IMAGE_CAROUSEL:        { label: "Image Carousel",           shortLabel: "Carousel",     icon: <LayoutGrid className="size-3.5" /> },
  TEXT_POST:             { label: "Text Post",                shortLabel: "Text Post",    icon: <FileText className="size-3.5" /> },
  LINK_POST:             { label: "Link Post",                shortLabel: "Link Post",    icon: <Link className="size-3.5" /> },
  DOCUMENT_CAROUSEL_PDF: { label: "Document / PDF Carousel",  shortLabel: "Document",     icon: <BookOpen className="size-3.5" /> },
  STORY_FRAME_SET:       { label: "Stories",                  shortLabel: "Stories",      icon: <Layers className="size-3.5" /> },
  LIVE_BROADCAST:        { label: "Live Stream",              shortLabel: "Live",         icon: <Radio className="size-3.5" /> },
};

// ─── Objective options ────────────────────────────────────────────────────────

const OBJECTIVE_OPTIONS: { value: Objective; label: string; emoji: string }[] = [
  { value: "awareness",   label: "Awareness",   emoji: "📣" },
  { value: "engagement",  label: "Engagement",  emoji: "💬" },
  { value: "traffic",     label: "Traffic",     emoji: "🔗" },
  { value: "leads",       label: "Leads",       emoji: "🎯" },
  { value: "sales",       label: "Sales",       emoji: "💰" },
  { value: "community",   label: "Community",   emoji: "🤝" },
  { value: "recruiting",  label: "Recruiting",  emoji: "🌟" },
];

const TRAFFIC_OBJECTIVES: Objective[] = ["traffic", "leads", "sales"];

const objectiveLookup: Record<string, { label: string; category: string }> = {
  "pillar-1": { label: "Grow Instagram to 10,000 followers", category: "Growth" },
  "pillar-2": { label: "Generate 200 qualified leads via content", category: "Revenue" },
  "pillar-3": { label: "Reach 50,000 monthly impressions", category: "Awareness" },
};

const PRIMARY_CTA_OPTIONS = [
  "Learn more", "Sign up", "Download", "Shop now", "Book now", "Contact us", "Watch more",
];

const HOOK_ANGLE_OPTIONS = [
  "Pain relief", "Beginner-friendly", "Time-saver", "No equipment",
  "Stress relief", "Mobility", "Strength", "Nutrition tip", "Myth-bust", "Common mistakes",
];

const VIDEO_CANONICAL_TYPES: CanonicalContentType[] = [
  "VIDEO_SHORT_VERTICAL", "VIDEO_LONG_HORIZONTAL", "VIDEO_SHORT_HORIZONTAL", "LIVE_BROADCAST",
];
const COVER_REQUIRED_TYPES: CanonicalContentType[] = [
  "VIDEO_SHORT_VERTICAL", "VIDEO_LONG_HORIZONTAL", "VIDEO_SHORT_HORIZONTAL",
];

// ─── Mock team members ────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  { id: "brett-lewis",  name: "Brett Lewis",  role: "Strategist" },
  { id: "sarah-chen",   name: "Sarah Chen",   role: "Writer" },
  { id: "maya-johnson", name: "Maya Johnson", role: "Editor" },
  { id: "david-kim",    name: "David Kim",    role: "Designer" },
  { id: "lisa-torres",  name: "Lisa Torres",  role: "Legal / Compliance" },
  { id: "alex-rivera",  name: "Alex Rivera",  role: "Brand Reviewer" },
];

// ─── Platform icons ───────────────────────────────────────────────────────────

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  instagram: <Instagram className="size-4" />,
  tiktok:    <TikTokIcon />,
  youtube:   <Youtube className="size-4" />,
  facebook:  <Facebook className="size-4" />,
  linkedin:  <Linkedin className="size-4" />,
  tbd:       <div className="size-4 rounded-full bg-gray-300" />,
};

// ─── Requirements Preview chip computation ────────────────────────────────────

interface RequirementChip {
  label: string;
  variant: "red" | "amber" | "blue";
}

function computeRequirements(
  platform: Platform,
  canonical: CanonicalContentType | undefined,
  brief: ContentBrief,
): RequirementChip[] {
  if (!canonical) return [];
  const chips: RequirementChip[] = [];
  const isVideo = VIDEO_CANONICAL_TYPES.includes(canonical);
  const isImage = canonical === "IMAGE_SINGLE" || canonical === "IMAGE_CAROUSEL";
  const needsA11y = brief.needsAccessibility !== false; // default true

  if (isVideo && needsA11y) chips.push({ label: "Captions required", variant: "red" });
  if (isImage && needsA11y) chips.push({ label: "Alt text required", variant: "red" });
  if (COVER_REQUIRED_TYPES.includes(canonical)) chips.push({ label: "Cover image required", variant: "red" });
  if (canonical === "DOCUMENT_CAROUSEL_PDF") chips.push({ label: "PDF upload required", variant: "red" });
  if (canonical === "STORY_FRAME_SET") chips.push({ label: "Frame-by-frame plan required", variant: "red" });
  if (canonical === "LINK_POST" || brief.destinationUrl) chips.push({ label: "Destination URL required", variant: "red" });
  if (platform === "youtube" && (canonical === "VIDEO_LONG_HORIZONTAL" || canonical === "VIDEO_SHORT_VERTICAL"))
    chips.push({ label: "Title + SEO metadata required", variant: "red" });
  if (brief.compliance?.containsClaims || brief.publishingMode === "PAID_BOOSTED")
    chips.push({ label: "Legal approval required", variant: "amber" });
  if (brief.hasMusic) chips.push({ label: "Music license required", variant: "amber" });
  if (brief.hasTalent) chips.push({ label: "Talent release required", variant: "amber" });
  if (brief.publishingMode === "PAID_BOOSTED") chips.push({ label: "Campaign metadata required", variant: "blue" });
  if (brief.paidPartnership) chips.push({ label: "Paid partnership disclosure required", variant: "amber" });
  return chips;
}

// ─── Tiny section header ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">{children}</p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BriefBuilder({
  platform,
  contentType,
  pillars,
  segments: _segments,
  brief,
  sources: _sources,
  onUpdateBrief,
  onUpdateSources: _onUpdateSources,
  onApproveBrief: _onApproveBrief,
  onUnlockBrief,
  onNext,
  onUpdatePlatform,
  onUpdateContentType,
}: BriefBuilderProps) {
  const userRole = getCurrentUserRole();
  const canUnlock = hasPermission(userRole, "canUnlockLockedFields");

  const [showMore, setShowMore] = useState(false);
  const [approvalNote, setApprovalNote] = useState(brief?.approvalNote || "");
  const [newRefLink, setNewRefLink] = useState("");
  const [selectedPillarId, setSelectedPillarId] = useState<string>("");

  // ── Initialise brief with sensible defaults ────────────────────────────────
  const currentBrief: ContentBrief = brief || {
    strategy: { objective: "engagement", audienceSegmentIds: [], pillarIds: [], keyMessage: "", ctaType: "none", tonePreset: "casual" },
    platformRules: {},
    creativePlan: {},
    compliance: { containsClaims: false, disclosureNeeded: false },
    approved: false,
    needsAccessibility: true,
    publishingMode: "ORGANIC",
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const update = (patch: Partial<ContentBrief>) => {
    onUpdateBrief({ ...currentBrief, ...patch });
  };

  const updateObjective = (v: Objective) => {
    update({ strategy: { ...currentBrief.strategy, objective: v } });
  };

  const updateKeyMessage = (v: string) => {
    update({ strategy: { ...currentBrief.strategy, keyMessage: v } });
  };

  const handlePlatformChange = (p: Platform) => {
    if (currentBrief.approved) return;
    const availableTypes = PLATFORM_CANONICAL_TYPES[p];
    const newCanonical = availableTypes[0];
    const newContentType = CANONICAL_TO_CONTENT_TYPE[p][newCanonical] || PLATFORM_CONTENT_TYPES[p][0].value;
    update({ canonicalType: newCanonical });
    onUpdatePlatform?.(p);
    onUpdateContentType?.(newContentType);
  };

  const handleCanonicalChange = (ct: CanonicalContentType) => {
    if (currentBrief.approved) return;
    const mapped = CANONICAL_TO_CONTENT_TYPE[platform][ct];
    update({ canonicalType: ct });
    if (mapped) onUpdateContentType?.(mapped);
  };

  const handleApproveToggle = (checked: boolean) => {
    if (checked && !canApprove) {
      toast.error("Complete all required fields before approving");
      return;
    }
    if (checked) {
      onUpdateBrief({
        ...currentBrief,
        approved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: "Brett Lewis",
        approvalNote: approvalNote || undefined,
      });
      toast.success("Brief approved! You can now continue to Builder.");
    } else {
      onUpdateBrief({ ...currentBrief, approved: false, approvedAt: undefined, approvedBy: undefined });
    }
  };

  // Auto-derive canonical type from the old contentType if not yet set
  const canonicalType: CanonicalContentType | undefined =
    currentBrief.canonicalType ||
    (() => {
      // reverse-map contentType → canonical
      const entries = Object.entries(CANONICAL_TO_CONTENT_TYPE[platform]) as [CanonicalContentType, ContentType][];
      return entries.find(([, ct]) => ct === contentType)?.[0];
    })();

  const objective = currentBrief.strategy.objective as Objective;
  const keyMessage = currentBrief.strategy.keyMessage || "";
  const publishingMode = currentBrief.publishingMode || "ORGANIC";
  const hasClaims = currentBrief.compliance.containsClaims;
  const hasTalent = currentBrief.hasTalent || false;
  const hasMusic = currentBrief.hasMusic || false;
  const needsA11y = currentBrief.needsAccessibility !== false;
  const owner = currentBrief.owner || "";
  const dueDate = currentBrief.dueDate || "";
  const primaryCta = currentBrief.primaryCta || "";
  const destinationUrl = currentBrief.destinationUrl || "";
  const campaignName = currentBrief.campaignName || "";
  const paidPartnership = currentBrief.paidPartnership || false;
  const approvers = currentBrief.approvers || [];
  const referenceLinks = currentBrief.referenceLinks || [];
  const hookAngle = currentBrief.hookAngle || "";
  const audienceNotes = currentBrief.audienceNotes || "";
  const constraintsNotes = currentBrief.constraintsNotes || "";

  const isVideoCanonical = canonicalType ? VIDEO_CANONICAL_TYPES.includes(canonicalType) : false;
  const needsDestUrl = canonicalType === "LINK_POST" || publishingMode === "PAID_BOOSTED" || (!!primaryCta && TRAFFIC_OBJECTIVES.includes(objective));

  // ── Validation ─────────────────────────────────────────────────────────────
  const errors: string[] = [];
  if (!canonicalType)                                errors.push("Content type is required");
  if (!objective)                                    errors.push("Objective is required");
  if (!keyMessage.trim())                            errors.push("Key message is required");
  if (!owner)                                        errors.push("Owner is required");
  if (TRAFFIC_OBJECTIVES.includes(objective) && !primaryCta) errors.push("Primary CTA is required for this objective");
  if (needsDestUrl && !destinationUrl.trim())        errors.push("Destination URL is required");
  if (publishingMode === "PAID_BOOSTED") {
    if (!campaignName.trim())                        errors.push("Campaign name is required for paid content");
    if (!approvers.includes("lisa-torres"))          errors.push("Legal / Compliance approver required for paid content");
  }

  // Non-blocking warnings
  const warnings: string[] = [];
  if (keyMessage.length > 0 && (keyMessage.length < 10 || keyMessage.length > 160))
    warnings.push(`Key message: ${keyMessage.length < 10 ? "too short" : "over 160 chars recommended"}`);
  if (dueDate && new Date(dueDate) < new Date())
    warnings.push("Due date is in the past");
  if (destinationUrl && !destinationUrl.includes("utm_"))
    warnings.push("Destination URL missing UTM parameters");

  const canApprove = errors.length === 0;

  // Progress
  const requiredFields = ["canonicalType", "objective", "keyMessage", "owner"];
  if (TRAFFIC_OBJECTIVES.includes(objective)) requiredFields.push("primaryCta");
  if (needsDestUrl) requiredFields.push("destinationUrl");
  if (publishingMode === "PAID_BOOSTED") requiredFields.push("campaignName");
  const filledCount = requiredFields.filter((f) => {
    if (f === "canonicalType") return !!canonicalType;
    if (f === "objective") return !!objective;
    if (f === "keyMessage") return !!keyMessage.trim();
    if (f === "owner") return !!owner;
    if (f === "primaryCta") return !!primaryCta;
    if (f === "destinationUrl") return !!destinationUrl.trim();
    if (f === "campaignName") return !!campaignName.trim();
    return false;
  }).length;
  const progressPct = Math.round((filledCount / requiredFields.length) * 100);

  const requirementChips = computeRequirements(platform, canonicalType, currentBrief);

  // ── Auto-manage approvers ─────────────────────────────────────────────────
  const ensureLegalApprover = () => {
    if (!approvers.includes("lisa-torres")) {
      update({ approvers: [...approvers, "lisa-torres"] });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      {/* ── Main Form (2/3) ────────────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-3">

        {/* SECTION 1 — Format (Locked) */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-6 rounded-md bg-gray-200/80">
                <Lock className="size-3 text-gray-500" />
              </div>
              <span className="text-sm text-gray-700" style={{ fontWeight: 700 }}>Format</span>
            </div>
            <Badge variant="outline" className="text-[9px] border-gray-300 bg-gray-200/50 text-gray-500 gap-1 px-2 py-0.5">
              <Lock className="size-2.5" /> Locked
            </Badge>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider" style={{ fontWeight: 700 }}>Platform</span>
                <div className="flex items-center gap-2.5 h-10 px-3 bg-gray-100 border border-gray-200 rounded-lg">
                  <span className="text-gray-500">{PLATFORM_ICONS[platform]}</span>
                  <span className="text-[11px] text-gray-600" style={{ fontWeight: 600 }}>
                    {PLATFORM_CONFIG[platform].label}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider" style={{ fontWeight: 700 }}>Content Type</span>
                <div className="flex items-center gap-2.5 h-10 px-3 bg-gray-100 border border-gray-200 rounded-lg">
                  <span className="text-gray-500">
                    {canonicalType && CANONICAL_META[canonicalType]?.icon}
                  </span>
                  <span className="text-[11px] text-gray-600" style={{ fontWeight: 600 }}>
                    {canonicalType ? CANONICAL_META[canonicalType]?.shortLabel : "Unknown"}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-2.5 leading-relaxed">
              Platform and content type are locked from the concept stage and cannot be changed during production.
            </p>
          </div>
        </div>

        {/* SECTION 2 — Goal & Message */}
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-4">
            <SectionLabel>Goal &amp; Message</SectionLabel>

            {/* Content Pillar */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-700">Content Pillar</Label>
              <select
                value={selectedPillarId}
                onChange={(e) => setSelectedPillarId(e.target.value)}
                disabled={currentBrief.approved}
                className={cn(
                  "w-full h-9 px-3 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#d94e33] focus:border-[#d94e33]",
                  !selectedPillarId && "text-gray-400",
                  currentBrief.approved && "opacity-60 cursor-not-allowed"
                )}
              >
                <option value="">Select a pillar…</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {/* Objective Context — only when pillar has a linked objective */}
              {selectedPillarId && objectiveLookup[selectedPillarId] && (() => {
                const linked = objectiveLookup[selectedPillarId];
                return (
                  <div className="rounded-lg border border-[#d94e33]/15 bg-[#d94e33]/5 p-3 space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#d94e33] flex items-center gap-1">
                      <Target className="size-3" /> Linked Objective
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">{linked.category}</span>
                      <span className="text-xs font-semibold text-gray-800">{linked.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">This brief contributes to your Q2 objective.</p>
                  </div>
                );
              })()}
            </div>

            {/* Objective */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-700">
                Objective <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {OBJECTIVE_OPTIONS.map((opt) => {
                  const sel = objective === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={currentBrief.approved}
                      onClick={() => updateObjective(opt.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all",
                        sel
                          ? "border-[#d94e33] bg-[#d94e33] text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-300",
                        currentBrief.approved && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <span>{opt.emoji}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key Message */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-gray-700">
                  Key Message <span className="text-red-500">*</span>
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[9px] gap-1 text-[#d94e33] hover:text-[#d94e33] hover:bg-[#d94e33]/10"
                  onClick={() => {
                    updateKeyMessage("This campaign focuses on empowering users to take control of their workflows with seamless, intuitive tools.");
                  }}
                  disabled={currentBrief.approved}
                >
                  <Sparkles className="size-2.5" />
                  AI Assist
                </Button>
              </div>
              <Textarea
                value={keyMessage}
                onChange={(e) => updateKeyMessage(e.target.value)}
                placeholder="The one thing the audience should remember."
                className="min-h-[64px] resize-none text-xs"
                disabled={currentBrief.approved}
              />
              <div className="flex items-center justify-between">
                <div>
                  {(keyMessage.length > 0 && keyMessage.length < 10) && (
                    <p className="text-[9px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="size-2.5" /> Too short — aim for at least 10 characters
                    </p>
                  )}
                </div>
                <span className={cn(
                  "text-[9px]",
                  keyMessage.length > 160 ? "text-red-500" : keyMessage.length < 10 && keyMessage.length > 0 ? "text-amber-500" : "text-gray-400"
                )}>
                  {keyMessage.length}/160
                </span>
              </div>
            </div>

            {/* Primary CTA — conditional */}
            {TRAFFIC_OBJECTIVES.includes(objective) && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-700">
                  Primary CTA <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIMARY_CTA_OPTIONS.map((cta) => {
                    const sel = primaryCta === cta;
                    return (
                      <button
                        key={cta}
                        disabled={currentBrief.approved}
                        onClick={() => update({ primaryCta: sel ? "" : cta })}
                        className={cn(
                          "px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all",
                          sel
                            ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300",
                          currentBrief.approved && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {cta}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3 — Flags — moved to Content Builder */}

        {/* SECTION 3 — Ownership & Timeline */}
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-4">
            <SectionLabel>Ownership &amp; Timeline</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {/* Owner */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-700">
                  Owner <span className="text-red-500">*</span>
                </Label>
                <select
                  value={owner}
                  onChange={(e) => update({ owner: e.target.value })}
                  disabled={currentBrief.approved}
                  className={cn(
                    "w-full h-9 px-3 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#d94e33] focus:border-[#d94e33]",
                    !owner && "text-gray-400",
                    currentBrief.approved && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <option value="">Select owner…</option>
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] font-bold text-gray-700">Due Date</Label>
                  <Calendar className="size-3 text-gray-400" />
                </div>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => update({ dueDate: e.target.value })}
                  className={cn("h-9 text-xs", currentBrief.approved && "opacity-60 cursor-not-allowed")}
                  disabled={currentBrief.approved}
                />
                {dueDate && new Date(dueDate) < new Date() && (
                  <p className="text-[9px] text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="size-2.5" /> Due date is in the past
                  </p>
                )}
              </div>
            </div>

            {/* Campaign Name — auto-show when PAID_BOOSTED */}
            {publishingMode === "PAID_BOOSTED" && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-700">
                  Campaign Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={campaignName}
                  onChange={(e) => update({ campaignName: e.target.value })}
                  placeholder={`${PLATFORM_CONFIG[platform].label}_${canonicalType || "content"}_${new Date().toISOString().slice(0, 10)}`}
                  className="h-9 text-xs"
                  disabled={currentBrief.approved}
                />
                <p className="text-[9px] text-gray-400">Auto-suggested from platform + type + date — editable</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 5 — Requirements Preview */}
        {requirementChips.length > 0 && (
          <Card className="border-gray-100">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <SectionLabel>Auto Requirements</SectionLabel>
                <p className="text-[9px] text-gray-400 -mt-2 ml-1">— updates with your selections</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {requirementChips.map((chip, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={cn(
                      "text-[9px] font-bold gap-1",
                      chip.variant === "red"   && "border-red-200 bg-red-50 text-red-700",
                      chip.variant === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
                      chip.variant === "blue"  && "border-blue-200 bg-blue-50 text-blue-700",
                    )}
                  >
                    {chip.variant === "red" && <AlertTriangle className="size-2.5" />}
                    {chip.variant === "amber" && <Shield className="size-2.5" />}
                    {chip.variant === "blue" && <Info className="size-2.5" />}
                    {chip.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION 6 — More (collapsed) */}
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-0">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <SectionLabel>More</SectionLabel>
                {!showMore && (
                  <div className="flex flex-wrap gap-1 -mt-2 mb-2">
                    {destinationUrl && <Badge variant="secondary" className="text-[8px]">URL set</Badge>}
                    {hookAngle && <Badge variant="secondary" className="text-[8px]">Angle: {hookAngle}</Badge>}
                    {referenceLinks.length > 0 && <Badge variant="secondary" className="text-[8px]">{referenceLinks.length} ref links</Badge>}
                    {audienceNotes && <Badge variant="secondary" className="text-[8px]">Audience notes</Badge>}
                  </div>
                )}
              </div>
              {showMore
                ? <ChevronUp className="size-3.5 text-gray-400 shrink-0" />
                : <ChevronDown className="size-3.5 text-gray-400 shrink-0" />}
            </button>

            {showMore && (
              <div className="space-y-4 pt-2 border-t border-gray-100">

                {/* Destination URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] font-bold text-gray-700">
                      Destination URL
                      {needsDestUrl && <span className="text-red-500 ml-0.5">*</span>}
                    </Label>
                    <ExternalLink className="size-3 text-gray-400" />
                  </div>
                  <Input
                    value={destinationUrl}
                    onChange={(e) => update({ destinationUrl: e.target.value })}
                    placeholder="https://..."
                    className="h-9 text-xs"
                    disabled={currentBrief.approved}
                  />
                  {destinationUrl && !destinationUrl.includes("utm_") && (
                    <p className="text-[9px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="size-2.5" /> No UTM parameters detected — add for tracking
                    </p>
                  )}
                </div>

                {/* Approvers */}
                {(publishingMode === "PAID_BOOSTED" || hasClaims || paidPartnership) && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-700">
                      Approvers
                      {publishingMode === "PAID_BOOSTED" && <span className="text-red-500 ml-0.5">*</span>}
                    </Label>
                    <div className="space-y-1">
                      {TEAM_MEMBERS.map((m) => {
                        const isSelected = approvers.includes(m.id);
                        const isLegalRequired = (publishingMode === "PAID_BOOSTED" || hasClaims) && m.id === "lisa-torres";
                        return (
                          <label
                            key={m.id}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors",
                              isSelected ? "border-[#d94e33]/30 bg-[#d94e33]/5" : "border-gray-100 hover:border-gray-200",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isLegalRequired || currentBrief.approved}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...approvers, m.id]
                                  : approvers.filter((a) => a !== m.id);
                                update({ approvers: updated });
                              }}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-gray-800">{m.name}</p>
                              <p className="text-[9px] text-gray-400">{m.role}</p>
                            </div>
                            {isLegalRequired && (
                              <Badge variant="outline" className="text-[8px] border-amber-200 text-amber-700">Required</Badge>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Paid Partnership */}
                {publishingMode === "PAID_BOOSTED" && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold text-gray-700">Paid Partnership / Collab</p>
                      <p className="text-[9px] text-gray-400">Requires disclosure fields + partner tagging</p>
                    </div>
                    <Switch
                      checked={paidPartnership}
                      onCheckedChange={(v) => update({ paidPartnership: v })}
                      disabled={currentBrief.approved}
                    />
                  </div>
                )}

                {/* Hook Angle — video types only */}
                {isVideoCanonical && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label className="text-[10px] font-bold text-gray-700">Hook Angle (strategy hint)</Label>
                    </div>
                    <p className="text-[9px] text-gray-400">The angle/approach — not the hook line itself (write that in Draft)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {HOOK_ANGLE_OPTIONS.map((a) => (
                        <button
                          key={a}
                          disabled={currentBrief.approved}
                          onClick={() => update({ hookAngle: hookAngle === a ? "" : a })}
                          className={cn(
                            "px-2.5 py-1 rounded-full border text-[9px] font-bold transition-all",
                            hookAngle === a
                              ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33]"
                              : "border-gray-200 text-gray-500 hover:border-gray-300",
                            currentBrief.approved && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audience Notes */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-700">Audience Notes</Label>
                  <Textarea
                    value={audienceNotes}
                    onChange={(e) => update({ audienceNotes: e.target.value })}
                    placeholder="Who specifically is this for? Any demographic or psychographic nuances…"
                    className="min-h-[60px] resize-none text-xs"
                    disabled={currentBrief.approved}
                  />
                </div>

                {/* Must Include / Avoid */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-700">Must Include / Avoid</Label>
                  <Textarea
                    value={constraintsNotes}
                    onChange={(e) => update({ constraintsNotes: e.target.value })}
                    placeholder="e.g. Must mention free trial; avoid competitor comparisons; no before/after imagery…"
                    className="min-h-[60px] resize-none text-xs"
                    disabled={currentBrief.approved}
                  />
                </div>

                {/* Reference Links */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-700">Reference / Inspiration Links</Label>
                  <div className="space-y-1.5">
                    {referenceLinks.map((url, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input
                          value={url}
                          onChange={(e) => {
                            const updated = [...referenceLinks];
                            updated[i] = e.target.value;
                            update({ referenceLinks: updated });
                          }}
                          placeholder="https://..."
                          className="h-8 text-xs flex-1"
                          disabled={currentBrief.approved}
                        />
                        <button
                          onClick={() => update({ referenceLinks: referenceLinks.filter((_, idx) => idx !== i) })}
                          className="text-gray-400 hover:text-red-500"
                          disabled={currentBrief.approved}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {!currentBrief.approved && (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={newRefLink}
                          onChange={(e) => setNewRefLink(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newRefLink.trim()) {
                              update({ referenceLinks: [...referenceLinks, newRefLink.trim()] });
                              setNewRefLink("");
                            }
                          }}
                          placeholder="Paste URL + Enter to add…"
                          className="h-8 text-xs flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            if (newRefLink.trim()) {
                              update({ referenceLinks: [...referenceLinks, newRefLink.trim()] });
                              setNewRefLink("");
                            }
                          }}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Sidebar — Brief Status (1/3) ───────────────────────────────────── */}
      <div className="space-y-3">
        <Card className={cn("border", currentBrief.approved ? "border-green-200 bg-green-50/30" : "border-gray-100")}>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Brief Status</p>
              {currentBrief.approved && (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-[9px]">
                  <CheckCircle2 className="size-2.5" /> Approved
                </Badge>
              )}
            </div>

            {currentBrief.approved ? (
              /* Approved state */
              <div className="text-center py-2 space-y-2">
                <CheckCircle2 className="size-10 text-green-500 mx-auto" />
                <p className="text-[10px] font-bold text-green-700">Brief Approved</p>
                {currentBrief.approvedAt && (
                  <p className="text-[9px] text-green-600">
                    {new Date(currentBrief.approvedAt).toLocaleDateString()} · {currentBrief.approvedBy || "User"}
                  </p>
                )}
                {canUnlock && onUnlockBrief && (
                  <div className="pt-2 border-t border-green-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-[10px] gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={onUnlockBrief}
                    >
                      <Unlock className="size-3" /> Unlock Brief
                    </Button>
                    <p className="text-[9px] text-amber-600 mt-1 text-center leading-tight">
                      Unlocking resets the workflow
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Unlocked warning */}
                {currentBrief.unlockedAt && (
                  <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2">
                    <RefreshCcw className="size-3 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[9px] text-amber-700 leading-tight">Brief unlocked — changes require re-approval</p>
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] text-gray-600">Required fields</p>
                    <p className="text-[9px] font-bold text-gray-700">{filledCount} / {requiredFields.length}</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        progressPct === 100 ? "bg-green-500" : "bg-[#d94e33]"
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <ul className="space-y-1">
                    {errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[9px] text-red-600">
                        <X className="size-2.5 shrink-0 mt-0.5" /> {err}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <ul className="space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[9px] text-amber-600">
                        <AlertTriangle className="size-2.5 shrink-0 mt-0.5" /> {w}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Approve */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-gray-700">Approve Brief</Label>
                    <Switch
                      checked={currentBrief.approved}
                      onCheckedChange={handleApproveToggle}
                      disabled={!canApprove}
                    />
                  </div>
                  {!canApprove && (
                    <p className="text-[9px] text-gray-400">Complete all required fields to enable</p>
                  )}
                  <Textarea
                    value={approvalNote}
                    onChange={(e) => {
                      setApprovalNote(e.target.value);
                      if (currentBrief.approved) onUpdateBrief({ ...currentBrief, approvalNote: e.target.value });
                    }}
                    placeholder="Approval note (optional)…"
                    className="text-[10px] min-h-[48px] resize-none"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Continue to Draft button */}
        {!currentBrief.approved ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-amber-500 shrink-0" />
              <p className="text-[10px] font-bold text-amber-700">Approve brief to continue</p>
            </div>
            {errors.length > 0 ? (
              <ul className="space-y-0.5 pl-5">
                {errors.slice(0, 3).map((err, i) => (
                  <li key={i} className="flex items-start gap-1 text-[9px] text-amber-700">
                    <span className="size-1 rounded-full bg-amber-400 shrink-0 mt-1" />
                    {err}
                  </li>
                ))}
                {errors.length > 3 && (
                  <li className="text-[9px] text-amber-600 pl-2">+{errors.length - 3} more</li>
                )}
              </ul>
            ) : (
              <p className="text-[9px] text-amber-600 pl-5">All fields complete — toggle Approve above</p>
            )}
            <Button className="w-full bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200 gap-1.5" disabled>
              <Lock className="size-3.5" /> Continue to Builder
            </Button>
          </div>
        ) : (
          <Button className="w-full bg-[#d94e33] hover:bg-[#c4452d] gap-1.5" onClick={onNext}>
            <CheckCircle2 className="size-3.5" /> Continue to Builder
          </Button>
        )}
      </div>
    </div>
  );
}