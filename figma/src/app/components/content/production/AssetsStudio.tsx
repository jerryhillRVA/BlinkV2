import React, { useState, useCallback, useRef } from "react";
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
  Upload,
  Link2,
  FileText,
  Image,
  Film,
  Eye,
  Shield,
  Users,
  Music,
  Settings2,
  X,
  Paperclip,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import type {
  Platform,
  ContentType,
  ContentBrief,
  ProductionOutput,
  AssetsData,
  AssetFileEntry,
  BlueprintData,
  CanonicalContentType,
} from "../types";

// ─── Props ───

interface AssetsStudioProps {
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

// ─── Checklist Generator ───

export interface ChecklistItem {
  id: string;
  label: string;
  key: string;
  required: boolean;
  ownerRole?: string;
  hint?: string;
  section: "primary" | "cover" | "variants" | "accessibility" | "rights" | "source";
}

function generateChecklist(
  canonical: CanonicalContentType,
  brief: ContentBrief,
  bp: BlueprintData | undefined
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const needsA11y = brief.needsAccessibility !== false;
  const hasTalent = brief.hasTalent;
  const hasMusic = brief.hasMusic || bp?.audioPlan === "licensed-track";
  const isPaid = brief.publishingMode === "PAID_BOOSTED";
  const captionsStrategy = bp?.captionsStrategy;

  // ─ Primary deliverables ─
  switch (canonical) {
    case "VIDEO_SHORT_VERTICAL":
    case "VIDEO_SHORT_HORIZONTAL":
      items.push({ id: "master-video", label: "Master video file", key: "master_video", required: true, ownerRole: "Editor", hint: "MP4/MOV, 9:16", section: "primary" });
      break;
    case "VIDEO_LONG_HORIZONTAL":
      items.push({ id: "master-video", label: "Master video file", key: "master_video", required: true, ownerRole: "Editor", hint: "MP4/MOV, 16:9", section: "primary" });
      break;
    case "IMAGE_SINGLE":
      items.push({ id: "master-image", label: "Master image", key: "master_image", required: true, ownerRole: "Designer", hint: "JPG/PNG, min 1080px", section: "primary" });
      break;
    case "IMAGE_CAROUSEL":
      items.push({
        id: "master-images",
        label: `Carousel images${bp?.unitCountTarget ? ` (${bp.unitCountTarget} slides)` : ""}`,
        key: "master_images",
        required: true,
        ownerRole: "Designer",
        hint: "JPG/PNG per slide",
        section: "primary",
      });
      break;
    case "DOCUMENT_CAROUSEL_PDF":
      items.push({ id: "pdf-doc", label: "PDF document", key: "pdf_document", required: true, ownerRole: "Designer", hint: ".pdf", section: "primary" });
      break;
    case "STORY_FRAME_SET":
      items.push({
        id: "story-assets",
        label: `Story frames${bp?.unitCountTarget ? ` (${bp.unitCountTarget} frames)` : ""}`,
        key: "story_assets",
        required: true,
        ownerRole: "Designer",
        hint: "Images or video, 9:16",
        section: "primary",
      });
      break;
    case "LIVE_BROADCAST":
      items.push({ id: "run-of-show-doc", label: "Run of show document", key: "run_of_show_doc", required: false, ownerRole: "Producer", hint: "Optional if stored in Blueprint", section: "primary" });
      items.push({ id: "lower-thirds", label: "Lower-thirds graphic", key: "lower_thirds", required: false, ownerRole: "Designer", section: "primary" });
      break;
    case "TEXT_POST":
    case "LINK_POST":
      // No required uploads
      break;
  }

  // ─ Cover / Thumbnail ─
  if (canonical === "VIDEO_LONG_HORIZONTAL") {
    items.push({ id: "thumbnail", label: "Thumbnail image", key: "thumbnail_image", required: true, ownerRole: "Designer", hint: "JPG/PNG, 1280×720", section: "cover" });
  } else if (
    canonical === "VIDEO_SHORT_VERTICAL" ||
    canonical === "VIDEO_SHORT_HORIZONTAL" ||
    canonical === "STORY_FRAME_SET" ||
    canonical === "LIVE_BROADCAST"
  ) {
    items.push({ id: "cover-image", label: "Cover image", key: "cover_image", required: false, ownerRole: "Designer", hint: "Recommended", section: "cover" });
  } else if (canonical === "LINK_POST") {
    items.push({ id: "preview-image", label: "Preview image", key: "preview_image", required: false, ownerRole: "Designer", hint: "1200×630", section: "cover" });
  }

  // ─ Creative Variants (paid) ─
  if (isPaid) {
    items.push({ id: "creative-variants", label: "Creative variants (paid sizes)", key: "creative_variants", required: false, ownerRole: "Designer", hint: "Multiple ad sizes", section: "variants" });
  }

  // ─ Accessibility ─
  if (needsA11y) {
    if (
      canonical === "VIDEO_SHORT_VERTICAL" ||
      canonical === "VIDEO_SHORT_HORIZONTAL" ||
      canonical === "VIDEO_LONG_HORIZONTAL" ||
      canonical === "LIVE_BROADCAST"
    ) {
      if (captionsStrategy === "upload-srt") {
        items.push({ id: "captions-file", label: "Captions file (SRT/VTT)", key: "captions_file", required: true, ownerRole: "Editor", hint: ".srt or .vtt", section: "accessibility" });
      } else if (captionsStrategy === "burned-in") {
        items.push({ id: "captions-burned", label: "Captions burned into video", key: "captions_burned", required: false, hint: "Confirm at QA", section: "accessibility" });
      } else {
        items.push({ id: "captions-file", label: "Captions / accessibility plan", key: "captions_file", required: false, ownerRole: "Editor", hint: "Strategy TBD", section: "accessibility" });
      }
    }
    if (
      canonical === "IMAGE_SINGLE" ||
      canonical === "IMAGE_CAROUSEL" ||
      canonical === "DOCUMENT_CAROUSEL_PDF"
    ) {
      items.push({ id: "alt-text", label: "Alt text", key: "alt_text", required: true, ownerRole: "Copywriter", hint: bp?.altTextStrategy === "per-slide" ? "Per slide" : "Per post", section: "accessibility" });
    }
  }

  // ─ Rights & Releases ─
  if (hasTalent) {
    items.push({ id: "talent-release", label: "Talent release / consent", key: "talent_release", required: true, ownerRole: "Producer", section: "rights" });
  }
  if (hasMusic) {
    const musicOptional = bp?.audioPlan === "platform-library";
    items.push({ id: "music-license", label: "Music license / source proof", key: "music_license", required: !musicOptional, ownerRole: "Producer", hint: musicOptional ? "Optional (platform library)" : undefined, section: "rights" });
  }

  return items;
}

// ─── Validation ───

interface ValidationItem {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  suggestion?: string;
}

function runAssetsValidation(
  data: AssetsData,
  checklist: ChecklistItem[],
  canonical: CanonicalContentType,
  brief: ContentBrief,
  bp: BlueprintData | undefined
): ValidationItem[] {
  const items: ValidationItem[] = [];
  const requiredItems = checklist.filter((c) => c.required);

  // Check required checklist items
  for (const item of requiredItems) {
    const fulfilled = isItemFulfilled(item, data);
    if (item.key === "master_video" || item.key === "master_image" || item.key === "master_images" || item.key === "story_assets" || item.key === "pdf_document") {
      items.push({ id: `val-${item.key}`, label: item.label + " present", status: fulfilled ? "pass" : "fail" });
    } else if (item.key === "thumbnail_image") {
      items.push({ id: "val-thumbnail", label: "Thumbnail present", status: fulfilled ? "pass" : "warn" });
    } else if (item.key === "captions_file") {
      items.push({ id: "val-captions", label: "Captions present", status: fulfilled ? "pass" : "fail" });
    } else if (item.key === "alt_text") {
      items.push({ id: "val-alt", label: "Alt text present", status: fulfilled ? "pass" : "fail" });
    } else if (item.key === "talent_release") {
      items.push({ id: "val-talent", label: "Talent release present", status: fulfilled ? "pass" : "fail" });
    } else if (item.key === "music_license") {
      items.push({ id: "val-music", label: "Music license present", status: fulfilled ? "pass" : "warn" });
    }
  }

  // Optional: cover for short-form
  const hasCover = !!data.coverUpload;
  if (
    (canonical === "VIDEO_SHORT_VERTICAL" || canonical === "VIDEO_SHORT_HORIZONTAL") &&
    !hasCover
  ) {
    items.push({ id: "val-cover", label: "Cover image", status: "warn", suggestion: "Recommended for discoverability" });
  }

  // Carousel count vs target
  if ((canonical === "IMAGE_CAROUSEL" || canonical === "STORY_FRAME_SET") && bp?.unitCountTarget) {
    const count = data.masterUploads.length;
    if (count > 0 && count < bp.unitCountTarget) {
      items.push({
        id: "val-count",
        label: `File count (${count}/${bp.unitCountTarget})`,
        status: "warn",
        suggestion: `Upload ${bp.unitCountTarget - count} more file${bp.unitCountTarget - count !== 1 ? "s" : ""}`,
      });
    }
  }

  return items;
}

function isItemFulfilled(item: ChecklistItem, data: AssetsData): boolean {
  const overridden = data.checklistOverrides[item.key];
  if (overridden !== undefined) return overridden;

  switch (item.key) {
    case "master_video":
    case "master_image":
    case "master_images":
    case "story_assets":
      return data.masterUploads.length > 0;
    case "pdf_document":
      return data.masterUploads.length > 0;
    case "thumbnail_image":
    case "cover_image":
    case "preview_image":
      return !!data.coverUpload;
    case "creative_variants":
      return data.creativeVariants.length > 0;
    case "captions_file":
      return !!data.captionsFile;
    case "captions_burned":
      return data.checklistOverrides["captions_burned"] === true;
    case "alt_text":
      return !!(data.altText?.trim());
    case "talent_release":
      return !!(data.talentReleaseUrl?.trim());
    case "music_license":
      return !!(data.musicLicenseUrl?.trim());
    case "third_party_rights":
      return !!(data.thirdPartyRightsUrl?.trim());
    case "run_of_show_doc":
    case "lower_thirds":
      return data.checklistOverrides[item.key] === true;
    default:
      return data.checklistOverrides[item.key] === true;
  }
}

function isAssetsComplete(checklist: ChecklistItem[], data: AssetsData): boolean {
  return checklist.filter((i) => i.required).every((i) => isItemFulfilled(i, data));
}

// ─── Empty AssetsData ───

function emptyAssetsData(): AssetsData {
  return {
    masterUploads: [],
    creativeVariants: [],
    sourceFiles: [],
    checklistOverrides: {},
  };
}

// ─── Upload Zone (hoisted — must live outside AssetsStudio to preserve state) ───

interface UploadZoneProps {
  files: AssetFileEntry[];
  onAdd: (file: AssetFileEntry) => void;
  onRemove: (id: string) => void;
  hint?: string;
  multi?: boolean;
}

function UploadZone({ files, onAdd, onRemove, hint, multi = true }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = multi || files.length === 0;

  const addFiles = (fileList: FileList) => {
    const arr = multi ? Array.from(fileList) : [fileList[0]];
    arr.forEach((file) => {
      const entry: AssetFileEntry = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size:
          file.size >= 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`,
        addedAt: new Date().toISOString(),
      };
      onAdd(entry);
    });
    toast.success(`${arr.length} file${arr.length !== 1 ? "s" : ""} added`);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleBrowse = () => inputRef.current?.click();

  const handleLinkAdd = () => {
    const val = linkValue.trim();
    if (!val) return;
    const entry: AssetFileEntry = {
      id: `link-${Date.now()}`,
      name: val,
      url: val.startsWith("http") ? val : undefined,
      addedAt: new Date().toISOString(),
    };
    onAdd(entry);
    setLinkValue("");
    setShowLink(false);
    toast.success("Link added");
  };

  return (
    <div className="space-y-1">
      {/* Hidden file picker */}
      <input
        ref={inputRef}
        type="file"
        multiple={multi}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            addFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Existing file rows */}
      {files.length > 0 && (
        <div className="space-y-0.5">
          {files.map((f) => {
            const isUrl = !!f.url || f.name.startsWith("http");
            return (
              <div key={f.id} className="flex items-center gap-2 px-2 py-1 rounded border border-gray-100 bg-white group">
                {isUrl
                  ? <Link2 className="size-3 text-blue-400 shrink-0" />
                  : <Paperclip className="size-3 text-gray-400 shrink-0" />}
                <span className="text-xs text-gray-700 truncate flex-1">{f.name}</span>
                {f.size && <span className="text-[9px] text-gray-400 shrink-0">{f.size}</span>}
                <button
                  onClick={() => onRemove(f.id)}
                  className="text-gray-300 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg transition-colors",
            isDragging
              ? "border-[#d94e33] bg-[#d94e33]/5"
              : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
          )}
        >
          {!showLink ? (
            <div className="flex flex-col items-center gap-1.5 py-3 px-3 text-center">
              <Upload className={cn("size-4 transition-colors", isDragging ? "text-[#d94e33]" : "text-gray-300")} />
              <span className="text-[10px] text-gray-400">
                Drop files here,{" "}
                <button onClick={handleBrowse} className="text-[#d94e33] hover:underline">browse</button>
                {" or "}
                <button onClick={() => setShowLink(true)} className="text-[#d94e33] hover:underline">paste link</button>
              </span>
              {hint && <span className="text-[9px] text-gray-300">{hint}</span>}
            </div>
          ) : (
            <div className="p-2 space-y-1" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1">
                <Input
                  autoFocus
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLinkAdd();
                    if (e.key === "Escape") { setShowLink(false); setLinkValue(""); }
                  }}
                  placeholder="https://drive.google.com/... or Dropbox link"
                  className="h-7 text-xs flex-1"
                />
                <Button size="sm" className="h-7 text-xs bg-[#d94e33] hover:bg-[#c4452d] px-2" onClick={handleLinkAdd}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setShowLink(false); setLinkValue(""); }}>
                  <X className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Single File Zone ───

interface SingleFileZoneProps {
  file?: AssetFileEntry;
  onSet: (f: AssetFileEntry) => void;
  onClear: () => void;
  hint?: string;
}

function SingleFileZone({ file, onSet, onClear, hint }: SingleFileZoneProps) {
  return (
    <UploadZone
      files={file ? [file] : []}
      onAdd={onSet}
      onRemove={onClear}
      hint={hint}
      multi={false}
    />
  );
}

// ─── URL Evidence Field ───

// ─── Shared field label (module-level so EvidenceField can use it) ───

function FieldLabel({ label, required, helper }: { label: string; required?: boolean; helper?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-xs text-gray-600">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {helper && <span className="text-[10px] text-gray-400 italic">{helper}</span>}
    </div>
  );
}

// ─── URL Evidence Field ───

interface EvidenceFieldProps {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}

function EvidenceField({ label, value, onChange, required, hint }: EvidenceFieldProps) {
  return (
    <div>
      <FieldLabel label={label} required={required} helper={hint} />
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://drive.google.com/... or file name"
        className="h-7 text-xs"
      />
    </div>
  );
}

// ─── Component ───

export function AssetsStudio({
  platform,
  contentType,
  title,
  brief,
  outputs,
  onUpdateOutputs,
  onNext,
  onBack,
}: AssetsStudioProps) {
  const canonical: CanonicalContentType =
    brief.canonicalType || CONTENT_TYPE_TO_CANONICAL[contentType] || "TEXT_POST";
  const bp = outputs.blueprintData;

  const data: AssetsData = outputs.assetsData || emptyAssetsData();
  const updateData = useCallback(
    (updates: Partial<AssetsData>) => {
      onUpdateOutputs({ ...outputs, assetsData: { ...data, ...updates } });
    },
    [outputs, data, onUpdateOutputs]
  );

  const checklist = generateChecklist(canonical, brief, bp);
  const validationItems = runAssetsValidation(data, checklist, canonical, brief, bp);
  const blockers = validationItems.filter((v) => v.status === "fail");
  const warnings = validationItems.filter((v) => v.status === "warn");
  const isComplete = isAssetsComplete(checklist, data);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [showThirdParty, setShowThirdParty] = useState(false);

  // ─── Inline UI Helpers ───

  const ReadOnlyPill = ({ label, value }: { label: string; value: string }) => (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] text-gray-600">
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );

  const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );

  const StatusIcon = ({ status }: { status: "pass" | "warn" | "fail" }) => {
    if (status === "pass") return <CheckCircle2 className="size-3 text-green-600 shrink-0" />;
    if (status === "warn") return <AlertTriangle className="size-3 text-amber-500 shrink-0" />;
    return <XCircle className="size-3 text-red-500 shrink-0" />;
  };

  // ─── Checklist section grouping ─
  const requiredItems = checklist.filter((c) => c.required);
  const optionalItems = checklist.filter((c) => !c.required);
  const noUploadsNeeded = canonical === "TEXT_POST" || (canonical === "LINK_POST" && checklist.filter(c => c.required).length === 0);

  // Conditional section visibility
  const showPrimary = !noUploadsNeeded && checklist.some((c) => c.section === "primary");
  const showCover = checklist.some((c) => c.section === "cover");
  const showVariantsSection = brief.publishingMode === "PAID_BOOSTED";
  const showAccessibility = checklist.some((c) => c.section === "accessibility");
  const showRights = checklist.some((c) => c.section === "rights");
  const captionsBurnedIn = bp?.captionsStrategy === "burned-in";
  const needsCaptionsFile = bp?.captionsStrategy === "upload-srt" && brief.needsAccessibility;
  const needsAltText =
    brief.needsAccessibility &&
    (canonical === "IMAGE_SINGLE" || canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF");

  return (
    <div className="space-y-1.5">
      {/* ─── HEADER BAR ─── */}
      <div className="flex items-center gap-2 px-0.5 flex-wrap">
        <div className="flex flex-wrap items-center gap-1 flex-1">
          <ReadOnlyPill label="Platform" value={PLATFORM_LABELS[platform]} />
          <ReadOnlyPill label="Type" value={CANONICAL_LABELS[canonical]} />
          {brief.publishingMode && (
            <ReadOnlyPill label="Mode" value={brief.publishingMode === "PAID_BOOSTED" ? "Paid" : "Organic"} />
          )}
          {brief.needsAccessibility && <ReadOnlyPill label="A11y" value="Required" />}
          {brief.hasMusic && <ReadOnlyPill label="Music" value="Yes" />}
          {brief.hasTalent && <ReadOnlyPill label="Talent" value="Yes" />}
          {brief.compliance.containsClaims && <ReadOnlyPill label="Claims" value="Yes" />}
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

          {/* ─── ASSET CHECKLIST ─── */}
          <Card className="border-gray-100">
            <CardContent className="px-3 pt-2 pb-2">
              <div className="space-y-1">
                <SectionLabel icon={<ClipboardList className="size-3" />} label="Required Asset Checklist" />
                <p className="text-[9px] text-gray-400 -mt-0.5 mb-2">
                  Auto-generated from platform, content type, and Brief flags. Required items must be fulfilled to proceed.
                </p>
              </div>

              {noUploadsNeeded ? (
                <div className="flex items-center gap-2 px-2 py-2 rounded bg-gray-50 border border-gray-100">
                  <Info className="size-3 text-gray-400" />
                  <span className="text-xs text-gray-500">No media uploads required for this content type.</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {requiredItems.length > 0 && (
                    <div className="space-y-0.5">
                      {requiredItems.map((item) => {
                        const fulfilled = isItemFulfilled(item, data);
                        return (
                          <div key={item.id} className="flex items-center gap-2 px-2 py-1 rounded border border-gray-100 bg-white">
                            <div className={cn("size-2 rounded-full shrink-0", fulfilled ? "bg-green-500" : "bg-gray-200")} />
                            <span className={cn("text-xs flex-1", fulfilled ? "text-gray-500" : "text-gray-700")}>{item.label}</span>
                            {item.hint && <span className="text-[9px] text-gray-400">{item.hint}</span>}
                            {item.ownerRole && (
                              <span className="text-[9px] text-gray-400 shrink-0">{item.ownerRole}</span>
                            )}
                            <Badge variant="outline" className="text-[8px] px-1 py-0 border-red-200 text-red-500 shrink-0">Required</Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {optionalItems.length > 0 && (
                    <div className="space-y-0.5 mt-1">
                      <p className="text-[9px] text-gray-400 px-0.5">Optional / Recommended</p>
                      {optionalItems.map((item) => {
                        const fulfilled = isItemFulfilled(item, data);
                        return (
                          <div key={item.id} className="flex items-center gap-2 px-2 py-1 rounded border border-gray-100 bg-gray-50/50">
                            <div className={cn("size-2 rounded-full shrink-0", fulfilled ? "bg-green-400" : "bg-gray-150 border border-gray-200")} />
                            <span className={cn("text-xs flex-1", fulfilled ? "text-gray-400" : "text-gray-500")}>{item.label}</span>
                            {item.hint && <span className="text-[9px] text-gray-300">{item.hint}</span>}
                            {item.ownerRole && <span className="text-[9px] text-gray-400 shrink-0">{item.ownerRole}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── PRIMARY DELIVERABLES ─── */}
          {showPrimary && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-2">
                <div className="space-y-1">
                  <SectionLabel
                    icon={
                      canonical.startsWith("VIDEO") ? <Film className="size-3" /> :
                      canonical === "DOCUMENT_CAROUSEL_PDF" ? <FileText className="size-3" /> :
                      <Image className="size-3" />
                    }
                    label="Primary Deliverables"
                  />
                  <p className="text-[9px] text-gray-400 -mt-0.5 mb-1.5">
                    {canonical === "IMAGE_CAROUSEL" || canonical === "STORY_FRAME_SET"
                      ? `Upload all ${bp?.unitCountTarget || "required"} files. Link to Google Drive, Dropbox, or paste file names.`
                      : canonical === "LIVE_BROADCAST"
                      ? "Pre-live assets for the broadcast team. Recordings and captions may be added post-live."
                      : "Upload or link the master production file for this content."}
                  </p>
                </div>
                <UploadZone
                  files={data.masterUploads}
                  onAdd={(f) => updateData({ masterUploads: [...data.masterUploads, f] })}
                  onRemove={(id) => updateData({ masterUploads: data.masterUploads.filter((f) => f.id !== id) })}
                  hint={
                    canonical === "VIDEO_SHORT_VERTICAL" ? "MP4 · MOV · 9:16" :
                    canonical === "VIDEO_LONG_HORIZONTAL" ? "MP4 · MOV · 16:9" :
                    canonical === "IMAGE_CAROUSEL" ? "JPG · PNG per slide" :
                    canonical === "DOCUMENT_CAROUSEL_PDF" ? ".pdf" :
                    canonical === "STORY_FRAME_SET" ? "JPG · PNG · MP4 per frame" :
                    "JPG · PNG · MP4"
                  }
                  multi={canonical !== "IMAGE_SINGLE" && canonical !== "LINK_POST"}
                />
                {/* Slide count warning */}
                {(canonical === "IMAGE_CAROUSEL" || canonical === "STORY_FRAME_SET") &&
                  bp?.unitCountTarget &&
                  data.masterUploads.length > 0 &&
                  data.masterUploads.length < bp.unitCountTarget && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      {data.masterUploads.length}/{bp.unitCountTarget} files — {bp.unitCountTarget - data.masterUploads.length} more needed
                    </p>
                  )}
              </CardContent>
            </Card>
          )}

          {/* ─── COVER / THUMBNAIL ─── */}
          {showCover && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-2">
                <div className="space-y-1">
                  <SectionLabel icon={<Image className="size-3" />} label={canonical === "VIDEO_LONG_HORIZONTAL" ? "Thumbnail" : "Cover Image"} />
                  <p className="text-[9px] text-gray-400 -mt-0.5 mb-1.5">
                    {canonical === "VIDEO_LONG_HORIZONTAL"
                      ? "YouTube thumbnail is required. 1280×720 JPG/PNG. Strong text + face performs best."
                      : "Cover image improves discoverability. Recommended but not blocking."}
                  </p>
                </div>
                <SingleFileZone
                  file={data.coverUpload}
                  onSet={(f) => updateData({ coverUpload: f })}
                  onClear={() => updateData({ coverUpload: undefined })}
                  hint={canonical === "VIDEO_LONG_HORIZONTAL" ? "1280×720 JPG/PNG" : "Recommended"}
                />
              </CardContent>
            </Card>
          )}

          {/* ─── CREATIVE VARIANTS (Paid) ─── */}
          {showVariantsSection && (
            <Card className="border-gray-100 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 pt-2 pb-1.5 hover:bg-gray-50/50 transition-colors"
                onClick={() => setShowVariants(!showVariants)}
              >
                <div className="flex items-center gap-1.5">
                  <Film className="size-3.5 text-gray-400" />
                  <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Creative Variants</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-amber-200 text-amber-600">Paid</Badge>
                </div>
                <ChevronDown className={cn("size-3 text-gray-400 transition-transform", showVariants && "rotate-180")} />
              </button>
              {showVariants && (
                <CardContent className="px-3 pb-2 pt-0 border-t border-gray-50">
                  <p className="text-[9px] text-gray-400 mt-1 mb-1.5">Additional creative sizes for paid boosting. Required only if your ads workflow needs multiple dimensions.</p>
                  <UploadZone
                    files={data.creativeVariants}
                    onAdd={(f) => updateData({ creativeVariants: [...data.creativeVariants, f] })}
                    onRemove={(id) => updateData({ creativeVariants: data.creativeVariants.filter((f) => f.id !== id) })}
                    hint="Multiple ad sizes"
                  />
                </CardContent>
              )}
            </Card>
          )}

          {/* ─── ACCESSIBILITY ASSETS ─── */}
          {showAccessibility && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-2">
                <div className="space-y-1">
                  <SectionLabel icon={<Eye className="size-3" />} label="Accessibility Assets" />
                  <p className="text-[9px] text-gray-400 -mt-0.5 mb-1.5">
                    Captions, alt text, and accessibility evidence required per Brief accessibility flag.
                  </p>
                </div>
                <div className="space-y-2">
                  {/* Captions */}
                  {(needsCaptionsFile || captionsBurnedIn || bp?.captionsStrategy) && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FieldLabel
                          label={captionsBurnedIn ? "Captions" : "Captions (SRT/VTT)"}
                          required={needsCaptionsFile}
                        />
                        {bp?.captionsStrategy && (
                          <span className="text-[9px] text-gray-400 italic ml-auto">Strategy: {bp.captionsStrategy}</span>
                        )}
                      </div>
                      {captionsBurnedIn ? (
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-gray-100 bg-gray-50">
                          <Checkbox
                            checked={data.checklistOverrides["captions_burned"] === true}
                            onCheckedChange={(v) =>
                              updateData({ checklistOverrides: { ...data.checklistOverrides, captions_burned: !!v } })
                            }
                          />
                          <span className="text-xs text-gray-600">Captions burned into video (confirm at QA)</span>
                        </div>
                      ) : (
                        <SingleFileZone
                          file={data.captionsFile}
                          onSet={(f) => updateData({ captionsFile: f })}
                          onClear={() => updateData({ captionsFile: undefined })}
                          hint=".srt or .vtt"
                        />
                      )}
                    </div>
                  )}

                  {/* Alt text */}
                  {needsAltText && (
                    <div>
                      <FieldLabel
                        label="Alt text"
                        required
                        helper={bp?.altTextStrategy === "per-slide" ? "Per slide" : "Per post"}
                      />
                      {bp?.altTextStrategy === "per-slide" && (canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF") ? (
                        <div className="space-y-1">
                          {Array.from({ length: bp?.unitCountTarget || 3 }, (_, i) => i + 1).map((idx) => {
                            const item = data.altTextItems?.find((a) => a.slideIndex === idx);
                            return (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="text-[9px] text-gray-400 w-10 shrink-0 pt-1.5">Slide {idx}</span>
                                <Input
                                  value={item?.text || ""}
                                  onChange={(e) => {
                                    const items = [...(data.altTextItems || [])];
                                    const existing = items.findIndex((a) => a.slideIndex === idx);
                                    if (existing >= 0) {
                                      items[existing] = { ...items[existing], text: e.target.value };
                                    } else {
                                      items.push({ id: `alt-${idx}`, slideIndex: idx, text: e.target.value });
                                    }
                                    updateData({ altTextItems: items });
                                  }}
                                  placeholder={`Alt text for slide ${idx}...`}
                                  className="h-7 text-xs"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Textarea
                          value={data.altText || ""}
                          onChange={(e) => updateData({ altText: e.target.value })}
                          placeholder="Describe the image for screen reader users..."
                          className="min-h-[52px] resize-none text-xs"
                        />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── RIGHTS & RELEASES ─── */}
          {showRights && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-2">
                <div className="space-y-1">
                  <SectionLabel icon={<Shield className="size-3" />} label="Rights & Releases" />
                  <p className="text-[9px] text-gray-400 -mt-0.5 mb-1.5">
                    Evidence required when talent, licensed music, or third-party assets are present. Paste Drive/Dropbox links or file names.
                  </p>
                </div>
                <div className="space-y-2">
                  {brief.hasTalent && (
                    <EvidenceField
                      label="Talent release / consent"
                      required
                      value={data.talentReleaseUrl}
                      onChange={(v) => updateData({ talentReleaseUrl: v })}
                      hint="Link or file name"
                    />
                  )}
                  {(brief.hasMusic || bp?.audioPlan === "licensed-track" || bp?.audioPlan === "platform-library") && (
                    <EvidenceField
                      label="Music license / source proof"
                      required={bp?.audioPlan === "licensed-track"}
                      hint={bp?.audioPlan === "platform-library" ? "Optional (platform library)" : undefined}
                      value={data.musicLicenseUrl}
                      onChange={(v) => updateData({ musicLicenseUrl: v })}
                    />
                  )}
                  {/* Third-party rights (expandable) */}
                  <div>
                    <button
                      onClick={() => setShowThirdParty(!showThirdParty)}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown className={cn("size-3 transition-transform", showThirdParty && "rotate-180")} />
                      Third-party asset rights
                    </button>
                    {showThirdParty && (
                      <div className="mt-1">
                        <EvidenceField
                          label="Third-party rights (images/fonts/footage)"
                          value={data.thirdPartyRightsUrl}
                          onChange={(v) => updateData({ thirdPartyRightsUrl: v })}
                          hint="Optional unless used"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── SOURCE FILES (Advanced) ─── */}
          <Card className="border-gray-100 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 pt-2 pb-1.5 hover:bg-gray-50/50 transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <div className="flex items-center gap-1.5">
                <Settings2 className="size-3.5 text-gray-400" />
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Source Files</span>
                <span className="text-[9px] text-gray-400">Advanced</span>
              </div>
              <ChevronDown className={cn("size-3 text-gray-400 transition-transform", showAdvanced && "rotate-180")} />
            </button>
            {showAdvanced && (
              <CardContent className="px-3 pb-2 pt-0 border-t border-gray-50">
                <p className="text-[9px] text-gray-400 mt-1 mb-2">
                  Editable project files for editors and designers. Examples: .aep, .prproj, .psd, .ai, .fig. Optional for handoff.
                </p>
                <div className="space-y-2">
                  <div>
                    <FieldLabel label="Source files (project)" helper="Optional" />
                    <UploadZone
                      files={data.sourceFiles}
                      onAdd={(f) => updateData({ sourceFiles: [...data.sourceFiles, f] })}
                      onRemove={(id) => updateData({ sourceFiles: data.sourceFiles.filter((f) => f.id !== id) })}
                      hint=".aep · .prproj · .psd · .fig"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Export notes" helper="Optional" />
                    <Textarea
                      value={data.exportNotes || ""}
                      onChange={(e) => updateData({ exportNotes: e.target.value })}
                      placeholder="Codec, resolution, naming conventions, handoff notes..."
                      className="min-h-[48px] resize-none text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* ─── RIGHT COLUMN: Status + AI ─── */}
        <div className="space-y-1.5 lg:sticky lg:top-4">

          {/* Status */}
          <Card className={cn("border overflow-hidden", isComplete ? "border-green-200 bg-green-50/30" : "border-gray-100")}>
            <CardContent className="px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                {isComplete ? <CheckCircle2 className="size-3 text-green-600" /> : <Info className="size-3 text-gray-400" />}
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{isComplete ? "Ready" : "Status"}</span>
              </div>
              {blockers.length > 0 && (
                <div className="space-y-0.5 mb-1">
                  {blockers.map((b) => (
                    <div key={b.id} className="flex items-start gap-1 text-[9px] text-red-600">
                      <XCircle className="size-2.5 shrink-0 mt-px" /><span>{b.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {warnings.length > 0 && (
                <div className="space-y-0.5">
                  {warnings.map((w) => (
                    <div key={w.id} className="flex items-start gap-1 text-[9px] text-amber-600">
                      <AlertTriangle className="size-2.5 shrink-0 mt-px" />
                      <div>
                        <span>{w.label}</span>
                        {w.suggestion && <p className="text-[8px] text-gray-400">{w.suggestion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isComplete && blockers.length === 0 && warnings.length === 0 && (
                <p className="text-[9px] text-green-600">All required assets present.</p>
              )}
            </CardContent>
          </Card>

          {/* AI Checks */}
          <Card className="border-gray-100 overflow-hidden">
            <CardContent className="px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="size-3 text-[#d94e33]" />
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>AI Checks</span>
                <Badge variant="outline" className="text-[7px] px-1 py-0 border-gray-200 text-gray-400 ml-auto">Preview</Badge>
              </div>
              <div className="space-y-0.5">
                {validationItems.map((v) => (
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
                      {v.suggestion && <p className="text-[8px] text-gray-400">{v.suggestion}</p>}
                    </div>
                  </div>
                ))}
                {validationItems.length === 0 && (
                  <p className="text-[9px] text-gray-400">No assets yet to validate.</p>
                )}
              </div>
              <p className="text-[7px] text-gray-400 mt-1 italic">Advisory. Hard blocks at QA.</p>
            </CardContent>
          </Card>

          {/* Missing Items Summary */}
          {checklist.filter((c) => c.required && !isItemFulfilled(c, data)).length > 0 && (
            <Card className="border-red-100 bg-red-50/30">
              <CardContent className="px-2.5 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="size-3 text-red-500" />
                  <span className="text-xs text-red-700" style={{ fontWeight: 600 }}>Missing Required</span>
                </div>
                <div className="space-y-0.5">
                  {checklist
                    .filter((c) => c.required && !isItemFulfilled(c, data))
                    .map((c) => (
                      <div key={c.id} className="flex items-center gap-1 text-[9px] text-red-600">
                        <XCircle className="size-2.5 shrink-0" />
                        <span>{c.label}</span>
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
          <ChevronLeft className="size-3 mr-1" /> Blueprint
        </Button>
        <div className="flex items-center gap-2">
          {!isComplete && (
            <span className="text-[9px] text-amber-600">
              {blockers.length} blocker{blockers.length !== 1 ? "s" : ""}
            </span>
          )}
          <Button className="bg-[#d94e33] hover:bg-[#c4452d] gap-1 h-7 text-xs" onClick={onNext}>
            Continue to Packaging <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}