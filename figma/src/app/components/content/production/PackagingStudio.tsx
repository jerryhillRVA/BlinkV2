import React, { useCallback, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Link2,
  Calendar,
  Globe,
  Eye,
  Package,
  Settings2,
  Tag,
  RotateCcw,
  Download,
  Send,
  ArrowUpDown,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
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
  PackagingData,
  AssetsData,
  CanonicalContentType,
} from "../types";

// ─── Props ───

interface PackagingStudioProps {
  platform: Platform;
  contentType: ContentType;
  title: string;
  brief: ContentBrief;
  outputs: ProductionOutput;
  onUpdateOutputs: (outputs: ProductionOutput) => void;
  onNext: () => void;
  onBack: () => void;
}

// ─── Canonical Mapping ───

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

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  facebook: "Facebook", linkedin: "LinkedIn", tbd: "TBD",
};

// ─── Platform-specific limits ───

const LIMITS: Record<Platform, { titleMax?: number; captionMax: number; descriptionMax?: number }> = {
  youtube:   { titleMax: 100, captionMax: 5000, descriptionMax: 5000 },
  instagram: { captionMax: 2200 },
  tiktok:    { captionMax: 2200 },
  facebook:  { captionMax: 63206 },
  linkedin:  { captionMax: 3000 },
  tbd:       { captionMax: 2200 },
};

const LINK_HINTS: Record<Platform, string> = {
  youtube:   "Link goes in video description",
  instagram: "Link in bio or link sticker (Stories)",
  tiktok:    "Link in bio (or pinned comment)",
  facebook:  "Link appears in post",
  linkedin:  "Link in post text",
  tbd:       "Add destination link",
};

const YOUTUBE_CATEGORIES = [
  "People & Blogs", "Health & Wellness", "Howto & Style", "Education",
  "Science & Technology", "Sports", "Entertainment", "Film & Animation",
  "Music", "News & Politics",
];

// ─── Default data ───

function defaultPackagingData(brief: ContentBrief, outputs: ProductionOutput): PackagingData {
  return {
    publishAction: "save-draft",
    visibility: "public",
    packagedCopy: outputs.postCopy || "",
    destinationUrl: brief.destinationUrl || "",
    allowComments: true,
    allowDuetStitch: true,
  };
}

// ─── Validation ───

interface ValItem {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  note?: string;
}

function validate(
  pkg: PackagingData,
  platform: Platform,
  canonical: CanonicalContentType,
  brief: ContentBrief,
  assets: AssetsData | undefined,
  outputs: ProductionOutput
): ValItem[] {
  const items: ValItem[] = [];
  const lim = LIMITS[platform];
  const isYT = platform === "youtube";
  const objective = brief.strategy.objective;
  const needsUrl = ["traffic", "leads", "sales"].includes(objective) ||
    canonical === "LINK_POST" || brief.publishingMode === "PAID_BOOSTED";

  // Required metadata
  const needsTitle = isYT && canonical === "VIDEO_LONG_HORIZONTAL";
  items.push({
    id: "v-meta",
    label: "Required metadata present",
    status: needsTitle && !pkg.title?.trim() ? "fail"
      : !pkg.packagedCopy?.trim() && canonical !== "LIVE_BROADCAST" ? "warn"
      : "pass",
  });

  // Title length
  if (pkg.title && lim.titleMax) {
    const pct = pkg.title.length / lim.titleMax;
    items.push({
      id: "v-title",
      label: `Title length (${pkg.title.length}/${lim.titleMax})`,
      status: pkg.title.length > lim.titleMax ? "fail" : pct > 0.9 ? "warn" : "pass",
    });
  }

  // Caption length
  if (pkg.packagedCopy) {
    const len = pkg.packagedCopy.length;
    const max = lim.captionMax;
    const pct = len / max;
    items.push({
      id: "v-caption",
      label: `Caption length (${len}/${max})`,
      status: len > max ? "fail" : pct > 0.9 ? "warn" : "pass",
    });
  }

  // Cover / thumbnail
  const hasCover = !!(assets?.coverUpload || pkg.coverAsset);
  if (canonical === "VIDEO_LONG_HORIZONTAL") {
    items.push({ id: "v-cover", label: "Thumbnail present", status: hasCover ? "pass" : "fail" });
  } else if (canonical.startsWith("VIDEO")) {
    items.push({ id: "v-cover", label: "Cover image", status: hasCover ? "pass" : "warn", note: "Recommended" });
  }

  // Primary media
  const hasMaster = !!(assets?.masterUploads?.length) || !!pkg.primaryMediaAsset;
  if (
    canonical !== "TEXT_POST" && canonical !== "LINK_POST" && canonical !== "LIVE_BROADCAST"
  ) {
    items.push({ id: "v-media", label: "Primary media selected", status: hasMaster ? "pass" : "fail" });
  }

  // Schedule
  if (pkg.publishAction === "schedule") {
    const valid = !!pkg.scheduleAt && new Date(pkg.scheduleAt) > new Date();
    items.push({ id: "v-schedule", label: "Schedule valid (future)", status: valid ? "pass" : "fail" });
  }

  // Destination URL
  if (needsUrl) {
    const hasUrl = !!pkg.destinationUrl?.trim();
    const isValidUrl = hasUrl && (
      pkg.destinationUrl!.startsWith("http://") ||
      pkg.destinationUrl!.startsWith("https://")
    );
    items.push({
      id: "v-url",
      label: "Destination URL valid",
      status: !hasUrl ? "fail" : !isValidUrl ? "warn" : "pass",
    });
  }

  // Optional: hashtags
  const hasHashtags = !!(outputs?.hashtags?.length);
  if (platform === "instagram" || platform === "tiktok") {
    if (!hasHashtags) {
      items.push({ id: "v-hashtags", label: "Hashtags (from Draft)", status: "warn", note: "No hashtags detected" });
    }
  }

  // UTM for paid / traffic
  if (brief.publishingMode === "PAID_BOOSTED" && !pkg.utmSource?.trim()) {
    items.push({ id: "v-utm", label: "UTM parameters", status: "warn", note: "Recommended for paid" });
  }

  return items;
}

// Trick to pass outputs into the pure validate fn without restructuring too much
let outputs_ref: ProductionOutput;

// ─── Character Counter ───

function CharCounter({ value, max, warnAt = 0.85 }: { value: string; max: number; warnAt?: number }) {
  const len = value.length;
  const pct = len / max;
  return (
    <span className={cn(
      "text-[9px]",
      len > max ? "text-red-500" : pct > warnAt ? "text-amber-500" : "text-gray-400"
    )}>
      {len}/{max}
    </span>
  );
}

// ─── Main Component ───

export function PackagingStudio({
  platform,
  contentType,
  title,
  brief,
  outputs,
  onUpdateOutputs,
  onNext,
  onBack,
}: PackagingStudioProps) {

  const canonical: CanonicalContentType =
    brief.canonicalType || CONTENT_TYPE_TO_CANONICAL[contentType] || "TEXT_POST";
  const assets = outputs.assetsData;
  const lim = LIMITS[platform];
  const isYT = platform === "youtube";
  const isIG = platform === "instagram";
  const isTT = platform === "tiktok";
  const isFB = platform === "facebook";
  const isLI = platform === "linkedin";

  const pkg: PackagingData = outputs.packagingData || defaultPackagingData(brief, outputs);
  const updatePkg = useCallback(
    (updates: Partial<PackagingData>) => {
      onUpdateOutputs({ ...outputs, packagingData: { ...pkg, ...updates } });
    },
    [outputs, pkg, onUpdateOutputs]
  );

  const [showPlatformControls, setShowPlatformControls] = useState(false);
  const [showUtm, setShowUtm] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const validations = validate(pkg, platform, canonical, brief, assets, outputs);
  const blockers = validations.filter((v) => v.status === "fail");
  const warnings = validations.filter((v) => v.status === "warn");
  const isComplete = blockers.length === 0;

  const objective = brief.strategy.objective;
  const needsUrl = ["traffic", "leads", "sales"].includes(objective) ||
    canonical === "LINK_POST" || brief.publishingMode === "PAID_BOOSTED";
  const showCaption =
    canonical !== "LIVE_BROADCAST";
  const showDescription =
    isYT && (canonical === "VIDEO_LONG_HORIZONTAL" || canonical === "VIDEO_SHORT_VERTICAL");
  const showTitle = isYT || isLI;
  const masterFiles = assets?.masterUploads || [];
  const showPrimarySelect = masterFiles.length > 1;
  const showCoverSelect = canonical !== "TEXT_POST" && canonical !== "LINK_POST";
  const showCarouselOrder = (canonical === "IMAGE_CAROUSEL" || canonical === "STORY_FRAME_SET") && masterFiles.length > 1;
  const showVisibility = isYT || isFB;
  const showLinksSection = needsUrl || canonical === "LINK_POST" || brief.publishingMode === "PAID_BOOSTED";

  // ─── Reusable primitives ───

  const ReadOnlyPill = ({ label, value }: { label: string; value: string }) => (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] text-gray-600">
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );

  const SectionLabel = ({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) => (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{label}</span>
      {badge && (
        <span className="text-[9px] text-gray-400 ml-0.5">{badge}</span>
      )}
    </div>
  );

  const FieldLabel = ({ label, required, helper }: { label: string; required?: boolean; helper?: string }) => (
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-xs text-gray-600">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {helper && <span className="text-[10px] text-gray-400 italic">{helper}</span>}
    </div>
  );

  const StatusIcon = ({ status }: { status: "pass" | "warn" | "fail" }) => {
    if (status === "pass") return <CheckCircle2 className="size-3 text-green-600 shrink-0" />;
    if (status === "warn") return <AlertTriangle className="size-3 text-amber-500 shrink-0" />;
    return <XCircle className="size-3 text-red-500 shrink-0" />;
  };

  // Carousel order helpers
  const carouselFiles = masterFiles.map((f) => f.name);
  const orderedFiles = pkg.carouselOrder || carouselFiles;
  const moveItem = (idx: number, dir: -1 | 1) => {
    const arr = [...orderedFiles];
    const next = idx + dir;
    if (next < 0 || next >= arr.length) return;
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    updatePkg({ carouselOrder: arr });
  };

  return (
    <div className="space-y-1.5">
      {/* ─── HEADER BAR ─── */}
      <div className="flex items-center gap-2 px-0.5 flex-wrap">
        <div className="flex flex-wrap items-center gap-1 flex-1">
          <ReadOnlyPill label="Platform" value={PLATFORM_LABELS[platform]} />
          <ReadOnlyPill label="Objective" value={objective} />
          <ReadOnlyPill label="Mode" value={brief.publishingMode === "PAID_BOOSTED" ? "Paid" : "Organic"} />
          {assets?.masterUploads?.length ? (
            <ReadOnlyPill label="Assets" value={`${assets.masterUploads.length} file${assets.masterUploads.length !== 1 ? "s" : ""}`} />
          ) : (
            <ReadOnlyPill label="Assets" value="None" />
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] px-1.5 py-0 shrink-0",
            isComplete ? "border-green-300 text-green-700 bg-green-50" : "border-amber-200 text-amber-600"
          )}
        >
          {isComplete ? "Ready for QA" : `${blockers.length} blocker${blockers.length !== 1 ? "s" : ""}`}
        </Badge>
      </div>

      {/* ─── 2-COLUMN ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-1.5 items-start">

        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-1.5 min-w-0">

          {/* ─── SECTION 2: PUBLISH SETTINGS ─── */}
          <Card className="border-gray-100">
            <CardContent className="px-3 pt-2 pb-2">
              <SectionLabel icon={<Calendar className="size-3" />} label="Publish Settings" />
              <div className="grid grid-cols-2 gap-2">
                {/* Publish action */}
                <div>
                  <FieldLabel label="Publish action" required />
                  <Select
                    value={pkg.publishAction}
                    onValueChange={(v) => updatePkg({ publishAction: v as PackagingData["publishAction"] })}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="save-draft">Save as draft</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="publish-now">Publish now</SelectItem>
                      <SelectItem value="export-packet">Export packet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Visibility */}
                {showVisibility && (
                  <div>
                    <FieldLabel label="Visibility" />
                    <Select
                      value={pkg.visibility}
                      onValueChange={(v) => updatePkg({ visibility: v as PackagingData["visibility"] })}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Schedule datetime */}
              {pkg.publishAction === "schedule" && (
                <div className="mt-2">
                  <FieldLabel label="Scheduled date & time" required />
                  <input
                    type="datetime-local"
                    value={pkg.scheduleAt || ""}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => updatePkg({ scheduleAt: e.target.value })}
                    className="h-7 text-xs border border-gray-200 rounded px-2 w-full focus:outline-none focus:ring-1 focus:ring-[#d94e33]/30"
                  />
                  {pkg.scheduleAt && new Date(pkg.scheduleAt) <= new Date() && (
                    <p className="text-[9px] text-red-500 mt-0.5">Must be a future date/time</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── SECTION 3: PLATFORM METADATA ─── */}
          <Card className="border-gray-100">
            <CardContent className="px-3 pt-2 pb-2">
              <SectionLabel icon={<Tag className="size-3" />} label="Platform Metadata" />
              <div className="space-y-2">

                {/* Title */}
                {showTitle && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <FieldLabel
                        label={isYT ? "Video title" : "Post headline"}
                        required={isYT && canonical === "VIDEO_LONG_HORIZONTAL"}
                      />
                      {lim.titleMax && pkg.title !== undefined && (
                        <CharCounter value={pkg.title || ""} max={lim.titleMax} />
                      )}
                    </div>
                    <Input
                      value={pkg.title || ""}
                      onChange={(e) => updatePkg({ title: e.target.value })}
                      placeholder={isYT ? "5 Yoga Poses That Changed My 40s..." : "Post headline..."}
                      className="h-7 text-xs"
                      maxLength={lim.titleMax}
                    />
                    {pkg.title && lim.titleMax && pkg.title.length > lim.titleMax * 0.9 && (
                      <p className="text-[9px] text-amber-500 mt-0.5">Near character limit</p>
                    )}
                  </div>
                )}

                {/* Caption / Post text */}
                {showCaption && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <FieldLabel label={isYT ? "Caption (optional)" : "Caption / post text"} />
                      <div className="flex items-center gap-2">
                        {outputs.postCopy && pkg.packagedCopy !== outputs.postCopy && (
                          <button
                            onClick={() => updatePkg({ packagedCopy: outputs.postCopy })}
                            className="text-[9px] text-[#d94e33] hover:underline flex items-center gap-0.5"
                          >
                            <RotateCcw className="size-2" /> Revert to Draft
                          </button>
                        )}
                        {outputs.postCopy && pkg.packagedCopy === outputs.postCopy && (
                          <span className="text-[9px] text-gray-400 italic">from Draft</span>
                        )}
                        <CharCounter value={pkg.packagedCopy || ""} max={lim.captionMax} />
                      </div>
                    </div>
                    <Textarea
                      value={pkg.packagedCopy || ""}
                      onChange={(e) => updatePkg({ packagedCopy: e.target.value })}
                      placeholder="Finalize your caption here..."
                      className="min-h-[80px] resize-none text-xs"
                    />
                  </div>
                )}

                {/* Description (YouTube) */}
                {showDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <FieldLabel label="Description" />
                      {lim.descriptionMax && (
                        <CharCounter value={pkg.description || ""} max={lim.descriptionMax} />
                      )}
                    </div>
                    <Textarea
                      value={pkg.description || ""}
                      onChange={(e) => updatePkg({ description: e.target.value })}
                      placeholder="Full video description, chapter links, CTAs..."
                      className="min-h-[64px] resize-none text-xs"
                    />
                  </div>
                )}

                {/* Keywords / tags (YouTube advanced) */}
                {isYT && (
                  <div>
                    <FieldLabel label="Tags / keywords" helper="Optional" />
                    <div className="flex flex-wrap gap-0.5 mb-1">
                      {(pkg.keywords || []).map((kw) => (
                        <div key={kw} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 text-[9px] text-gray-600">
                          {kw}
                          <button onClick={() => updatePkg({ keywords: (pkg.keywords || []).filter((k) => k !== kw) })}>
                            <X className="size-2" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === ",") && keywordInput.trim()) {
                            e.preventDefault();
                            updatePkg({ keywords: [...(pkg.keywords || []), keywordInput.trim()] });
                            setKeywordInput("");
                          }
                        }}
                        placeholder="yoga, women 40+, wellness..."
                        className="h-6 text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[9px] px-1.5"
                        onClick={() => {
                          if (keywordInput.trim()) {
                            updatePkg({ keywords: [...(pkg.keywords || []), keywordInput.trim()] });
                            setKeywordInput("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ─── SECTION 4: MEDIA SELECTIONS ─── */}
          {(showPrimarySelect || showCoverSelect || showCarouselOrder) && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-2">
                <SectionLabel icon={<Eye className="size-3" />} label="Media Selections" />
                <div className="space-y-2">

                  {/* Primary media */}
                  {showPrimarySelect && (
                    <div>
                      <FieldLabel label="Primary asset" />
                      <Select
                        value={pkg.primaryMediaAsset || ""}
                        onValueChange={(v) => updatePkg({ primaryMediaAsset: v })}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Select primary file…" />
                        </SelectTrigger>
                        <SelectContent>
                          {masterFiles.map((f) => (
                            <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Cover / Thumbnail */}
                  {showCoverSelect && (
                    <div>
                      <FieldLabel
                        label={canonical === "VIDEO_LONG_HORIZONTAL" ? "Thumbnail" : "Cover image"}
                        required={canonical === "VIDEO_LONG_HORIZONTAL"}
                        helper={canonical !== "VIDEO_LONG_HORIZONTAL" ? "Recommended" : undefined}
                      />
                      {assets?.coverUpload ? (
                        <div className="flex items-center gap-2 px-2 py-1 rounded border border-green-100 bg-green-50 text-xs">
                          <CheckCircle2 className="size-3 text-green-500 shrink-0" />
                          <span className="text-green-700 truncate flex-1">{assets.coverUpload.name}</span>
                          <span className="text-[9px] text-gray-400 shrink-0">from Assets</span>
                        </div>
                      ) : (
                        <div>
                          <Input
                            value={pkg.coverAsset || ""}
                            onChange={(e) => updatePkg({ coverAsset: e.target.value })}
                            placeholder="File name or link to cover image…"
                            className="h-7 text-xs"
                          />
                          {canonical === "VIDEO_LONG_HORIZONTAL" && !pkg.coverAsset && (
                            <p className="text-[9px] text-red-500 mt-0.5">Thumbnail required for YouTube long-form</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Carousel order */}
                  {showCarouselOrder && (
                    <div>
                      <FieldLabel label="Carousel order" helper="Drag to reorder" />
                      <div className="space-y-0.5 border border-gray-100 rounded p-1 bg-gray-50/50">
                        {orderedFiles.map((name, idx) => (
                          <div key={name} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-gray-100 text-xs">
                            <span className="text-[9px] text-gray-400 w-4 shrink-0">{idx + 1}</span>
                            <span className="flex-1 truncate text-gray-700">{name}</span>
                            <div className="flex flex-col shrink-0">
                              <button disabled={idx === 0} onClick={() => moveItem(idx, -1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-30">
                                <ChevronUp className="size-2.5" />
                              </button>
                              <button disabled={idx === orderedFiles.length - 1} onClick={() => moveItem(idx, 1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-30">
                                <ChevronDown className="size-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── SECTION 5: LINKS & TRACKING ─── */}
          {showLinksSection && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-2">
                <SectionLabel icon={<Link2 className="size-3" />} label="Links & Tracking" />
                <div className="space-y-2">
                  {/* Destination URL */}
                  <div>
                    <FieldLabel
                      label="Destination URL"
                      required={needsUrl}
                    />
                    <Input
                      value={pkg.destinationUrl || ""}
                      onChange={(e) => updatePkg({ destinationUrl: e.target.value })}
                      placeholder="https://hivecollective.com/..."
                      className="h-7 text-xs"
                    />
                    {pkg.destinationUrl && !pkg.destinationUrl.startsWith("http") && (
                      <p className="text-[9px] text-amber-500 mt-0.5">URL should start with https://</p>
                    )}
                  </div>

                  {/* Platform link hint */}
                  <div className="flex items-start gap-1.5 px-2 py-1 rounded bg-blue-50 border border-blue-100">
                    <Info className="size-3 text-blue-400 shrink-0 mt-0.5" />
                    <span className="text-[9px] text-blue-600">{LINK_HINTS[platform]}</span>
                  </div>

                  {/* UTM (collapsible) */}
                  <div>
                    <button
                      onClick={() => setShowUtm(!showUtm)}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown className={cn("size-3 transition-transform", showUtm && "rotate-180")} />
                      UTM parameters
                      {brief.publishingMode === "PAID_BOOSTED" && (
                        <span className="text-amber-500 text-[9px] ml-1">recommended for paid</span>
                      )}
                    </button>
                    {showUtm && (
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        {(["utmSource", "utmMedium", "utmCampaign"] as const).map((key) => (
                          <div key={key}>
                            <span className="text-[9px] text-gray-400 block mb-0.5">
                              {key === "utmSource" ? "utm_source" : key === "utmMedium" ? "utm_medium" : "utm_campaign"}
                            </span>
                            <Input
                              value={pkg[key] || ""}
                              onChange={(e) => updatePkg({ [key]: e.target.value })}
                              placeholder={key === "utmSource" ? "instagram" : key === "utmMedium" ? "social" : "hive-q1"}
                              className="h-6 text-[9px]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── SECTION 6: PLATFORM CONTROLS ─── */}
          <Card className="border-gray-100 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 pt-2 pb-1.5 hover:bg-gray-50/50 transition-colors"
              onClick={() => setShowPlatformControls(!showPlatformControls)}
            >
              <div className="flex items-center gap-1.5">
                <Settings2 className="size-3.5 text-gray-400" />
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Platform Controls</span>
                <span className="text-[9px] text-gray-400">Advanced</span>
              </div>
              <ChevronDown className={cn("size-3 text-gray-400 transition-transform", showPlatformControls && "rotate-180")} />
            </button>
            {showPlatformControls && (
              <CardContent className="px-3 pb-2 pt-0 border-t border-gray-50">
                <div className="space-y-2 mt-1">

                  {/* YouTube */}
                  {isYT && (
                    <>
                      <div>
                        <FieldLabel label="Category" helper="Optional" />
                        <Select value={pkg.category || ""} onValueChange={(v) => updatePkg({ category: v })}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Select category…" />
                          </SelectTrigger>
                          <SelectContent>
                            {YOUTUBE_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel label="Playlist" helper="Optional" />
                        <Input
                          value={pkg.playlist || ""}
                          onChange={(e) => updatePkg({ playlist: e.target.value })}
                          placeholder="Yoga for Women 40+..."
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between py-1 border-t border-gray-50">
                        <div>
                          <p className="text-xs text-gray-700">Made for kids</p>
                          <p className="text-[9px] text-gray-400">COPPA requirement</p>
                        </div>
                        <Switch
                          checked={!!pkg.madeForKids}
                          onCheckedChange={(v) => updatePkg({ madeForKids: v })}
                        />
                      </div>
                    </>
                  )}

                  {/* Instagram */}
                  {isIG && (
                    <>
                      <div>
                        <FieldLabel
                          label="Collaborator tag"
                          required={brief.paidPartnership}
                          helper={brief.paidPartnership ? "Paid partnership" : "Optional"}
                        />
                        <div className="flex flex-wrap gap-0.5 mb-1">
                          {(pkg.collaboratorTags || []).map((t) => (
                            <div key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-pink-50 border border-pink-100 text-[9px] text-pink-700">
                              @{t}
                              <button onClick={() => updatePkg({ collaboratorTags: (pkg.collaboratorTags || []).filter((c) => c !== t) })}>
                                <X className="size-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && tagInput.trim()) {
                                updatePkg({ collaboratorTags: [...(pkg.collaboratorTags || []), tagInput.trim().replace("@", "")] });
                                setTagInput("");
                              }
                            }}
                            placeholder="@brandpartner"
                            className="h-6 text-xs flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[9px] px-1.5"
                            onClick={() => {
                              if (tagInput.trim()) {
                                updatePkg({ collaboratorTags: [...(pkg.collaboratorTags || []), tagInput.trim().replace("@", "")] });
                                setTagInput("");
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      <div>
                        <FieldLabel label="Location tag" helper="Optional" />
                        <Input
                          value={pkg.igLocation || ""}
                          onChange={(e) => updatePkg({ igLocation: e.target.value })}
                          placeholder="Los Angeles, CA"
                          className="h-7 text-xs"
                        />
                      </div>
                    </>
                  )}

                  {/* TikTok */}
                  {isTT && (
                    <>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-xs text-gray-700">Allow comments</span>
                        <Switch checked={pkg.allowComments !== false} onCheckedChange={(v) => updatePkg({ allowComments: v })} />
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-t border-gray-50">
                        <span className="text-xs text-gray-700">Allow duet / stitch</span>
                        <Switch checked={pkg.allowDuetStitch !== false} onCheckedChange={(v) => updatePkg({ allowDuetStitch: v })} />
                      </div>
                    </>
                  )}

                  {/* Facebook */}
                  {isFB && (
                    <>
                      <div>
                        <FieldLabel label="Facebook Page" helper="Optional" />
                        <Input
                          value={pkg.fbPage || ""}
                          onChange={(e) => updatePkg({ fbPage: e.target.value })}
                          placeholder="Hive Collective"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between py-0.5 border-t border-gray-50">
                        <span className="text-xs text-gray-700">Crosspost to Instagram</span>
                        <Switch checked={!!pkg.crosspostToIg} onCheckedChange={(v) => updatePkg({ crosspostToIg: v })} />
                      </div>
                    </>
                  )}

                  {/* LinkedIn */}
                  {isLI && (
                    <>
                      <div>
                        <FieldLabel label="Publisher identity" helper="Optional" />
                        <Select value={pkg.liPublisherIdentity || ""} onValueChange={(v) => updatePkg({ liPublisherIdentity: v })}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Personal profile or Company page…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal profile</SelectItem>
                            <SelectItem value="company">Hive Collective (Company)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel label="Pinned comment (draft)" helper="Optional" />
                        <Textarea
                          value={pkg.pinnedComment || outputs.pinnedComment || ""}
                          onChange={(e) => updatePkg({ pinnedComment: e.target.value })}
                          placeholder="First comment to pin after posting..."
                          className="min-h-[48px] resize-none text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="space-y-1.5 lg:sticky lg:top-4">

          {/* Final Technical Checks */}
          <Card className="border-gray-100">
            <CardContent className="px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="size-3 text-gray-400" />
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Technical Checks</span>
              </div>
              <div className="space-y-0.5">
                {validations.map((v) => (
                  <div
                    key={v.id}
                    className={cn(
                      "flex items-start gap-1 px-1.5 py-0.5 rounded border text-[9px]",
                      v.status === "pass" && "border-green-100 bg-green-50/50",
                      v.status === "warn" && "border-amber-100 bg-amber-50/50",
                      v.status === "fail" && "border-red-100 bg-red-50/50"
                    )}
                  >
                    <StatusIcon status={v.status} />
                    <div className="min-w-0">
                      <span className={cn(
                        v.status === "pass" && "text-green-700",
                        v.status === "warn" && "text-amber-700",
                        v.status === "fail" && "text-red-700"
                      )}>{v.label}</span>
                      {v.note && <p className="text-[8px] text-gray-400">{v.note}</p>}
                    </div>
                  </div>
                ))}
                {validations.length === 0 && (
                  <p className="text-[9px] text-gray-400">Fill in fields to see checks.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Publish packet summary */}
          <Card className={cn("border overflow-hidden", isComplete ? "border-green-200 bg-green-50/30" : "border-gray-100")}>
            <CardContent className="px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="size-3 text-gray-400" />
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Publish Packet</span>
              </div>
              <div className="space-y-0.5 text-[9px] text-gray-600">
                <div className="flex justify-between">
                  <span>Action</span>
                  <span className="text-gray-800">
                    {pkg.publishAction === "save-draft" ? "Save as draft" :
                     pkg.publishAction === "schedule" ? `Schedule${pkg.scheduleAt ? " · " + new Date(pkg.scheduleAt).toLocaleDateString() : ""}` :
                     pkg.publishAction === "publish-now" ? "Publish now" : "Export packet"}
                  </span>
                </div>
                {showVisibility && (
                  <div className="flex justify-between">
                    <span>Visibility</span>
                    <span className="text-gray-800 capitalize">{pkg.visibility}</span>
                  </div>
                )}
                {pkg.title && (
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0">Title</span>
                    <span className="text-gray-800 truncate text-right">{pkg.title}</span>
                  </div>
                )}
                {pkg.packagedCopy && (
                  <div className="flex justify-between">
                    <span className="shrink-0">Caption</span>
                    <span className="text-gray-800">{pkg.packagedCopy.length} chars</span>
                  </div>
                )}
                {assets?.masterUploads?.length ? (
                  <div className="flex justify-between">
                    <span>Media</span>
                    <span className="text-gray-800">{assets.masterUploads.length} file{assets.masterUploads.length !== 1 ? "s" : ""}</span>
                  </div>
                ) : null}
                {pkg.destinationUrl && (
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0">URL</span>
                    <span className="text-gray-800 truncate text-right">{pkg.destinationUrl}</span>
                  </div>
                )}
              </div>

              {blockers.length > 0 && (
                <div className="mt-1.5 pt-1 border-t border-gray-100 space-y-0.5">
                  {blockers.map((b) => (
                    <div key={b.id} className="flex items-start gap-1 text-[9px] text-red-600">
                      <XCircle className="size-2.5 shrink-0 mt-px" /><span>{b.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 space-y-1">
                <Button
                  size="sm"
                  className="w-full h-7 text-xs bg-[#d94e33] hover:bg-[#c4452d] gap-1"
                  onClick={() => {
                    if (isComplete) {
                      toast.success("Marked ready for QA!");
                      onNext();
                    } else {
                      toast.error(`Resolve ${blockers.length} blocker${blockers.length !== 1 ? "s" : ""} first`);
                    }
                  }}
                >
                  <Send className="size-3" /> Mark Ready for QA
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs gap-1"
                  onClick={() => toast.success("Export packet coming soon")}
                >
                  <Download className="size-3" /> Export Packet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Missing blockers card */}
          {blockers.length > 0 && (
            <Card className="border-red-100 bg-red-50/30">
              <CardContent className="px-2.5 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="size-3 text-red-500" />
                  <span className="text-xs text-red-700" style={{ fontWeight: 600 }}>Blockers</span>
                </div>
                <div className="space-y-0.5">
                  {blockers.map((b) => (
                    <div key={b.id} className="flex items-center gap-1 text-[9px] text-red-600">
                      <XCircle className="size-2.5 shrink-0" /><span>{b.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onBack}>
          <ChevronLeft className="size-3 mr-1" /> Assets
        </Button>
        <div className="flex items-center gap-2">
          {!isComplete && (
            <span className="text-[9px] text-amber-600">
              {blockers.length} blocker{blockers.length !== 1 ? "s" : ""}
            </span>
          )}
          <Button
            className="bg-[#d94e33] hover:bg-[#c4452d] gap-1 h-7 text-xs"
            onClick={onNext}
          >
            Continue to QA <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}