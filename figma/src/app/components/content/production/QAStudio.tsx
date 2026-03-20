import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  Send,
  ClipboardList,
  Shield,
  Eye,
  Link2,
  Radio,
  Tag,
  UserCheck,
  History,
  RefreshCw,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  User,
  Megaphone,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Textarea } from "@/app/components/ui/textarea";
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
  QAData,
  QACheckItem,
  ApprovalEntry,
  AuditEntry,
  CanonicalContentType,
  AmplificationData,
} from "../types";

// ─── Props ───

interface QAStudioProps {
  platform: Platform;
  contentType: ContentType;
  title: string;
  brief: ContentBrief;
  outputs: ProductionOutput;
  onUpdateOutputs: (outputs: ProductionOutput) => void;
  onNext: () => void;
  onBack: () => void;
}

// ─── Canonical mapping ───

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

const CAPTION_LIMITS: Record<Platform, number> = {
  youtube: 5000, instagram: 2200, tiktok: 2200,
  facebook: 63206, linkedin: 3000, tbd: 2200,
};

const TEAM_MEMBERS = ["Sarah K.", "Maya R.", "Jordan L.", "Alex T.", "Chris B.", "Dana W."];

// ─── AI Validation derivation ───

interface AICheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  note?: string;
}

function deriveAIChecks(
  brief: ContentBrief,
  outputs: ProductionOutput,
  platform: Platform,
  canonical: CanonicalContentType
): AICheck[] {
  const checks: AICheck[] = [];
  const pkg = outputs.packagingData;
  const assets = outputs.assetsData;
  const bp = outputs.blueprintData;
  const isVideo = canonical.startsWith("VIDEO");
  const isImage = canonical === "IMAGE_SINGLE" || canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF";
  const isLive = canonical === "LIVE_BROADCAST";
  const isPaid = brief.publishingMode === "PAID_BOOSTED";
  const hasClaims = brief.compliance.containsClaims || brief.compliance.disclosureNeeded;
  const objective = brief.strategy.objective;
  const needsUrl = ["traffic", "leads", "sales"].includes(objective) || canonical === "LINK_POST" || isPaid;

  // ── General: Prior stages complete ──
  checks.push({
    id: "brief-approved",
    label: "Brief approved",
    status: brief.approved ? "pass" : "fail",
    note: brief.approved ? undefined : "Brief must be approved before QA",
  });

  checks.push({
    id: "draft-copy",
    label: "Draft copy present",
    status: outputs.postCopy?.trim() ? "pass" : (canonical === "LIVE_BROADCAST" ? "warn" : "fail"),
    note: outputs.postCopy?.trim() ? undefined : "No caption/post copy found in Draft",
  });

  if (bp) {
    checks.push({ id: "blueprint-complete", label: "Blueprint complete", status: "pass" });
  } else {
    checks.push({ id: "blueprint-complete", label: "Blueprint complete", status: "warn", note: "Blueprint not started" });
  }

  // ── Assets: required media ──
  if (canonical !== "TEXT_POST" && canonical !== "LINK_POST" && !isLive) {
    const hasMaster = (assets?.masterUploads?.length ?? 0) > 0;
    checks.push({
      id: "primary-media",
      label: "Primary media present",
      status: hasMaster ? "pass" : "fail",
      note: hasMaster ? undefined : "No master media uploaded in Assets",
    });
  }

  if (canonical === "VIDEO_LONG_HORIZONTAL") {
    const hasThumbnail = !!(assets?.coverUpload || pkg?.coverAsset);
    checks.push({
      id: "thumbnail",
      label: "Thumbnail present",
      status: hasThumbnail ? "pass" : "fail",
      note: hasThumbnail ? undefined : "YouTube long-form requires a thumbnail",
    });
  }

  // ── Packaging metadata ──
  if (pkg) {
    const hasTitle = !!(pkg.title?.trim());
    if (platform === "youtube" && canonical === "VIDEO_LONG_HORIZONTAL") {
      checks.push({
        id: "title",
        label: `Title (${(pkg.title || "").length}/100)`,
        status: !hasTitle ? "fail" : (pkg.title!.length > 100 ? "fail" : pkg.title!.length > 90 ? "warn" : "pass"),
      });
    }

    const captionLen = (pkg.packagedCopy || "").length;
    const captionMax = CAPTION_LIMITS[platform];
    if (captionLen > 0) {
      checks.push({
        id: "caption-limit",
        label: `Caption length (${captionLen}/${captionMax})`,
        status: captionLen > captionMax ? "fail" : captionLen > captionMax * 0.9 ? "warn" : "pass",
        note: captionLen > captionMax * 0.9 ? "Near character limit" : undefined,
      });
    }

    if (pkg.publishAction === "schedule") {
      const valid = !!pkg.scheduleAt && new Date(pkg.scheduleAt) > new Date();
      checks.push({
        id: "schedule",
        label: "Schedule valid (future date)",
        status: valid ? "pass" : "fail",
        note: valid ? undefined : "Schedule must be in the future",
      });
    }
  } else {
    checks.push({ id: "packaging", label: "Packaging complete", status: "warn", note: "Packaging not started" });
  }

  // ── Links ──
  if (needsUrl) {
    const url = pkg?.destinationUrl || "";
    const hasUrl = !!url.trim();
    const validUrl = hasUrl && url.startsWith("http");
    checks.push({
      id: "url-valid",
      label: "Destination URL valid",
      status: !hasUrl ? "fail" : !validUrl ? "warn" : "pass",
      note: !hasUrl ? "Required for this objective/mode" : !validUrl ? "URL should start with https://" : undefined,
    });
  }

  // ── Rights ──
  if (brief.hasTalent) {
    const hasRelease = !!(assets?.talentReleaseUrl?.trim());
    checks.push({
      id: "talent-release",
      label: "Talent release present",
      status: hasRelease ? "pass" : "fail",
      note: hasRelease ? undefined : "Talent release required (hasTalent=true)",
    });
  }

  if (brief.hasMusic || bp?.audioPlan === "licensed-track") {
    const hasLicense = !!(assets?.musicLicenseUrl?.trim());
    const isOptional = bp?.audioPlan === "platform-library";
    checks.push({
      id: "music-license",
      label: "Music license / source proof",
      status: hasLicense ? "pass" : isOptional ? "warn" : "fail",
      note: hasLicense ? undefined : isOptional ? "Platform library — confirm license" : "Music license required",
    });
  }

  // ── Accessibility ──
  if (brief.needsAccessibility) {
    if (isVideo || isLive) {
      const hasCaptions = !!(assets?.captionsFile) || assets?.checklistOverrides?.["captions_burned"] === true;
      checks.push({
        id: "captions",
        label: "Captions strategy satisfied",
        status: hasCaptions ? "pass" : "fail",
        note: hasCaptions ? undefined : "Upload SRT/VTT or confirm captions burned in",
      });
    }
    if (isImage) {
      const hasAlt = !!(assets?.altText?.trim()) || (assets?.altTextItems?.length ?? 0) > 0;
      checks.push({
        id: "alt-text",
        label: "Alt text present",
        status: hasAlt ? "pass" : "fail",
        note: hasAlt ? undefined : "Alt text required for image content",
      });
    }
  }

  // ── Compliance ──
  if (hasClaims || isPaid || brief.paidPartnership) {
    const hasDisclosure = !!(outputs.disclosures?.trim());
    checks.push({
      id: "disclosure",
      label: "Disclosure / #ad copy in Draft",
      status: hasDisclosure ? "pass" : "warn",
      note: hasDisclosure ? undefined : "Add #ad or partnership disclosure to Draft",
    });
  }

  // ── Carousel count ──
  if ((canonical === "IMAGE_CAROUSEL" || canonical === "STORY_FRAME_SET") && bp?.unitCountTarget) {
    const count = assets?.masterUploads?.length ?? 0;
    if (count > 0 && count < bp.unitCountTarget) {
      checks.push({
        id: "carousel-count",
        label: `Carousel count (${count}/${bp.unitCountTarget})`,
        status: "warn",
        note: `${bp.unitCountTarget - count} more file${bp.unitCountTarget - count !== 1 ? "s" : ""} expected`,
      });
    }
  }

  return checks;
}

// ─── Human checklist seed ───

function seedChecklist(
  canonical: CanonicalContentType,
  brief: ContentBrief,
): QACheckItem[] {
  const items: QACheckItem[] = [];
  const isVideo = canonical.startsWith("VIDEO");
  const isImage = canonical === "IMAGE_SINGLE" || canonical === "IMAGE_CAROUSEL" || canonical === "DOCUMENT_CAROUSEL_PDF";
  const isLive = canonical === "LIVE_BROADCAST";
  const isMedia = isVideo || isImage || canonical === "STORY_FRAME_SET" || isLive;
  const isPaid = brief.publishingMode === "PAID_BOOSTED";
  const hasClaims = brief.compliance.containsClaims || brief.compliance.disclosureNeeded;
  const isPaidPartner = brief.paidPartnership;
  const objective = brief.strategy.objective;
  const needsUrl = ["traffic", "leads", "sales"].includes(objective) || canonical === "LINK_POST" || isPaid;

  // ── A: Brand & Editorial ──
  const brand: QACheckItem[] = [
    { id: "brand-spelling", label: "Spelling & grammar pass", group: "brand", groupLabel: "Brand & Editorial", required: true, checked: false },
    { id: "brand-voice", label: "Brand voice & tone pass (Hive Collective)", group: "brand", groupLabel: "Brand & Editorial", required: true, checked: false },
    { id: "brand-cta", label: "CTA is clear and actionable", group: "brand", groupLabel: "Brand & Editorial", required: true, checked: false },
    { id: "brand-terms", label: "No prohibited terms used", group: "brand", groupLabel: "Brand & Editorial", required: false, checked: false },
  ];
  items.push(...brand);

  // ── B: Visual / Audio ──
  if (isMedia) {
    const visual: QACheckItem[] = [
      { id: "vis-legibility", label: "Text readable on mobile (safe zones respected)", group: "visual", groupLabel: "Visual & Audio Quality", required: true, checked: false },
      { id: "vis-crop", label: "Cropping & composition correct in preview", group: "visual", groupLabel: "Visual & Audio Quality", required: true, checked: false },
    ];
    if (isVideo || isLive) {
      visual.push({ id: "vis-audio", label: "Audio clarity acceptable (no clipping/hum)", group: "visual", groupLabel: "Visual & Audio Quality", required: true, checked: false });
    }
    if (canonical === "VIDEO_LONG_HORIZONTAL") {
      visual.push({ id: "vis-thumbnail", label: "Thumbnail communicates topic clearly", group: "visual", groupLabel: "Visual & Audio Quality", required: true, checked: false });
    }
    if (canonical === "IMAGE_CAROUSEL" || canonical === "STORY_FRAME_SET") {
      visual.push({ id: "vis-slide1", label: "Slide 1 / Frame 1 hook is compelling", group: "visual", groupLabel: "Visual & Audio Quality", required: false, checked: false });
      visual.push({ id: "vis-cta-slide", label: "CTA slide present and visually distinct", group: "visual", groupLabel: "Visual & Audio Quality", required: false, checked: false });
    }
    items.push(...visual);
  }

  // ── C: Accessibility ──
  if (brief.needsAccessibility) {
    const a11y: QACheckItem[] = [];
    if (isVideo || isLive) {
      a11y.push({ id: "a11y-captions", label: "Captions accurate / burned-in verified", group: "accessibility", groupLabel: "Accessibility", required: true, checked: false });
    }
    if (isImage) {
      a11y.push({ id: "a11y-alt", label: "Alt text quality check (descriptive, not keyword-stuffed)", group: "accessibility", groupLabel: "Accessibility", required: true, checked: false });
    }
    a11y.push(
      { id: "a11y-contrast", label: "Contrast & readability acceptable", group: "accessibility", groupLabel: "Accessibility", required: false, checked: false },
      { id: "a11y-motion", label: "No flashing / risky motion present", group: "accessibility", groupLabel: "Accessibility", required: false, checked: false },
    );
    items.push(...a11y);
  }

  // ── D: Compliance & Disclosures ──
  if (isPaid || isPaidPartner || hasClaims) {
    const comp: QACheckItem[] = [
      { id: "comp-disclosure", label: "Disclosure present and correctly placed (#ad / partner)", group: "compliance", groupLabel: "Compliance & Disclosures", required: true, checked: false },
      { id: "comp-privacy", label: "No personal data exposed", group: "compliance", groupLabel: "Compliance & Disclosures", required: true, checked: false },
    ];
    if (hasClaims) {
      comp.push(
        { id: "comp-claims", label: "Claims match substantiation provided", group: "compliance", groupLabel: "Compliance & Disclosures", required: true, checked: false },
        { id: "comp-medical", label: "No medical/guarantee language beyond policy (wellness)", group: "compliance", groupLabel: "Compliance & Disclosures", required: true, checked: false },
      );
    }
    items.push(...comp);
  }

  // ── E: Links & Tracking ──
  if (needsUrl) {
    items.push(
      { id: "link-url", label: "Destination URL correct and landing page loads", group: "links", groupLabel: "Links & Tracking", required: true, checked: false },
      { id: "link-placement", label: "Link placement matches platform behavior (bio / description / sticker)", group: "links", groupLabel: "Links & Tracking", required: true, checked: false },
      { id: "link-utms", label: "UTMs present and correct (if paid/required by policy)", group: "links", groupLabel: "Links & Tracking", required: false, checked: false },
    );
  }

  // ── F: Live readiness ──
  if (isLive) {
    items.push(
      { id: "live-mod", label: "Moderator assigned and available", group: "live", groupLabel: "Live Readiness", required: true, checked: false },
      { id: "live-ros", label: "Run-of-show complete", group: "live", groupLabel: "Live Readiness", required: true, checked: false },
      { id: "live-tech", label: "Tech rehearsal complete (internet / audio / lighting)", group: "live", groupLabel: "Live Readiness", required: true, checked: false },
      { id: "live-safety", label: "Safety escalation plan known", group: "live", groupLabel: "Live Readiness", required: false, checked: false },
    );
  }

  return items;
}

// ─── Default approvals seed ───

function seedApprovals(brief: ContentBrief, canonical: CanonicalContentType): ApprovalEntry[] {
  const pkg_action = undefined; // we'll check from packagingData at runtime
  const isPaid = brief.publishingMode === "PAID_BOOSTED";
  const hasClaims = brief.compliance.containsClaims || brief.compliance.disclosureNeeded;
  const isPaidPartner = brief.paidPartnership;
  const needsLegal = hasClaims || isPaid || isPaidPartner;

  const entries: ApprovalEntry[] = [
    { role: "brand-reviewer", label: "Brand Reviewer", required: true, status: "pending" },
  ];
  if (needsLegal) {
    entries.push({ role: "legal-compliance", label: "Legal / Compliance", required: true, status: "pending" });
  }
  entries.push({ role: "publisher", label: "Publisher", required: false, status: "pending" });

  return entries;
}

// ─── Audit helper ───

function makeAuditEntry(action: string, userName?: string): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    action,
    userName,
    timestamp: new Date().toISOString(),
  };
}

// ─── Time formatter ───

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// ─── Group icon ───

function GroupIcon({ group }: { group: QACheckItem["group"] }) {
  const cls = "size-3 shrink-0";
  if (group === "brand") return <Tag className={cls} />;
  if (group === "visual") return <Eye className={cls} />;
  if (group === "accessibility") return <Eye className={cls} />;
  if (group === "compliance") return <Shield className={cls} />;
  if (group === "links") return <Link2 className={cls} />;
  if (group === "live") return <Radio className={cls} />;
  return <ClipboardList className={cls} />;
}

// ─── Status chip ───

function StatusChip({ status }: { status: "pass" | "warn" | "fail" }) {
  if (status === "pass") return <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-green-50 border border-green-100 text-[8px] text-green-700"><CheckCircle2 className="size-2" />Pass</span>;
  if (status === "warn") return <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-amber-50 border border-amber-100 text-[8px] text-amber-700"><AlertTriangle className="size-2" />Warn</span>;
  return <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-red-50 border border-red-100 text-[8px] text-red-700"><XCircle className="size-2" />Fail</span>;
}

// ─── Main Component ───

export function QAStudio({
  platform,
  contentType,
  title,
  brief,
  outputs,
  onUpdateOutputs,
  onNext,
  onBack,
}: QAStudioProps) {
  const canonical: CanonicalContentType =
    brief.canonicalType || CONTENT_TYPE_TO_CANONICAL[contentType] || "TEXT_POST";

  // Initialize QA data on first render
  const qa: QAData = outputs.qaData ?? {
    humanChecklist: seedChecklist(canonical, brief),
    approvals: seedApprovals(brief, canonical),
    qaNotes: "",
    fixAssignee: "",
    auditTrail: [makeAuditEntry("QA started")],
    approved: false,
  };

  const updateQA = useCallback(
    (updates: Partial<QAData>) => {
      onUpdateOutputs({ ...outputs, qaData: { ...qa, ...updates } });
    },
    [outputs, qa, onUpdateOutputs]
  );

  // Seed QA data if not yet stored
  useEffect(() => {
    if (!outputs.qaData) {
      onUpdateOutputs({ ...outputs, qaData: qa });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // AI checks (re-derived every render)
  const aiChecks = deriveAIChecks(brief, outputs, platform, canonical);
  const aiBlockers = aiChecks.filter((c) => c.status === "fail");
  const aiWarnings = aiChecks.filter((c) => c.status === "warn");

  // Human checklist aggregation
  const groups = Array.from(new Set(qa.humanChecklist.map((i) => i.group)));
  const requiredUnchecked = qa.humanChecklist.filter((i) => i.required && !i.checked);
  const requiredApprovals = qa.approvals.filter((a) => a.required);
  const pendingApprovals = requiredApprovals.filter((a) => a.status !== "approved");
  const changesRequested = qa.approvals.some((a) => a.status === "changes-requested");

  const isApproved =
    aiBlockers.length === 0 &&
    requiredUnchecked.length === 0 &&
    pendingApprovals.length === 0;

  // Notes section ref for auto-focus
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const [currentUser, setCurrentUser] = useState("Sarah K.");
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);

  // Amplification state
  const amp: AmplificationData = outputs.amplification ?? {};
  const updateAmp = useCallback(
    (updates: Partial<AmplificationData>) => {
      onUpdateOutputs({ ...outputs, amplification: { ...amp, ...updates } });
    },
    [outputs, amp, onUpdateOutputs]
  );
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingRepurpose, setIsGeneratingRepurpose] = useState(false);
  const [isSuggestingAdaptations, setIsSuggestingAdaptations] = useState(false);

  const OTHER_PLATFORMS: Platform[] = (["instagram", "tiktok", "youtube", "facebook", "linkedin"] as Platform[]).filter((p) => p !== platform);

  // Overall status label
  const overallStatus = isApproved
    ? "Approved"
    : aiBlockers.length > 0 || requiredUnchecked.length > 0 || changesRequested
    ? "Blocked"
    : "Needs Review";

  const statusColor =
    overallStatus === "Approved"
      ? "text-green-700 bg-green-50 border-green-200"
      : overallStatus === "Blocked"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-amber-700 bg-amber-50 border-amber-200";

  // ─── Approval action handler ───
  const doApproval = (role: ApprovalEntry["role"], action: "approved" | "changes-requested" | "pending") => {
    const note = approvalNotes[role] || "";
    if (action === "changes-requested" && !note.trim()) {
      toast.error("Add a note describing the required changes first.");
      setShowNoteInput(role);
      setTimeout(() => notesRef.current?.focus(), 100);
      return;
    }

    const newApprovals = qa.approvals.map((a) =>
      a.role === role
        ? { ...a, status: action, userName: currentUser, timestamp: new Date().toISOString(), note }
        : a
    );

    const actionLabel =
      action === "approved" ? `✓ Approved by ${currentUser}`
      : action === "changes-requested" ? `↩ Changes requested by ${currentUser}`
      : `⟳ Approval revoked by ${currentUser}`;

    const newTrail = [
      ...qa.auditTrail,
      makeAuditEntry(actionLabel + (note ? ` — "${note}"` : ""), currentUser),
    ];

    const newApproved = action === "approved"
      ? qa.approvals.filter((a) => a.role !== role || a.required).every((a) =>
          a.role === role ? true : a.status === "approved" || !a.required
        )
      : false;

    updateQA({ approvals: newApprovals, auditTrail: newTrail });
    setApprovalNotes((prev) => ({ ...prev, [role]: "" }));
    setShowNoteInput(null);

    if (action === "approved") toast.success(`${roleLabel(role)} approved`);
    else if (action === "changes-requested") toast.error("Changes requested — notifying assignee");
    else toast.info("Approval revoked");
  };

  const roleLabel = (role: ApprovalEntry["role"]) =>
    role === "brand-reviewer" ? "Brand Reviewer"
    : role === "legal-compliance" ? "Legal / Compliance"
    : "Publisher";

  // ─── Toggle checklist item ───
  const toggleItem = (id: string) => {
    const newList = qa.humanChecklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    const item = qa.humanChecklist.find((i) => i.id === id);
    const newTrail = [
      ...qa.auditTrail,
      makeAuditEntry(
        `${item?.checked ? "☐ Unchecked" : "☑ Checked"}: ${item?.label}`,
        currentUser
      ),
    ];
    updateQA({ humanChecklist: newList, auditTrail: newTrail });
  };

  // ─── Render ───
  return (
    <div className="space-y-1.5">

      {/* ─── HEADER BAR ─── */}
      <div className="flex items-center gap-2 px-0.5 flex-wrap">
        <div className="flex flex-wrap items-center gap-1 flex-1">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] text-gray-600">
            <span className="text-gray-400">Platform:</span><span>{PLATFORM_LABELS[platform]}</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] text-gray-600">
            <span className="text-gray-400">AI checks:</span>
            <span className="text-red-600">{aiBlockers.length} blocker{aiBlockers.length !== 1 ? "s" : ""}</span>
            {aiWarnings.length > 0 && <span className="text-amber-600 ml-0.5">{aiWarnings.length} warn</span>}
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] text-gray-600">
            <span className="text-gray-400">Checklist:</span>
            <span>{qa.humanChecklist.filter((i) => i.checked).length}/{qa.humanChecklist.length}</span>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 shrink-0 border", statusColor)}>
          {overallStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-1.5 items-start">

        {/* ─── LEFT COLUMN ─── */}
        <div className="space-y-1.5 min-w-0">

          {/* ── SECTION 2: AI VALIDATIONS ── */}
          <Card className="border-gray-100">
            <CardContent className="px-3 pt-2 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-[#d94e33]" />
                  <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>AI Validations</span>
                  <span className="text-[9px] text-gray-400">read-only · re-derived from all stages</span>
                </div>
                <button
                  onClick={() => toast.info("AI validations re-run automatically")}
                  className="flex items-center gap-0.5 text-[9px] text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className="size-2.5" /> Re-run
                </button>
              </div>

              <div className="space-y-0.5">
                {aiChecks.map((check) => (
                  <div
                    key={check.id}
                    className={cn(
                      "flex items-start justify-between gap-2 px-2 py-1 rounded border text-xs",
                      check.status === "pass" && "border-green-100 bg-green-50/50",
                      check.status === "warn" && "border-amber-100 bg-amber-50/50",
                      check.status === "fail" && "border-red-100 bg-red-50/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        check.status === "pass" ? "text-green-700" :
                        check.status === "warn" ? "text-amber-700" : "text-red-700"
                      )}>{check.label}</span>
                      {check.note && (
                        <p className="text-[9px] text-gray-400 mt-0">{check.note}</p>
                      )}
                    </div>
                    <StatusChip status={check.status} />
                  </div>
                ))}
              </div>

              {aiBlockers.length === 0 && aiWarnings.length === 0 && (
                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-green-600">
                  <CheckCircle2 className="size-3" /> All AI checks pass
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── SECTION 3: HUMAN REVIEW CHECKLIST ── */}
          {groups.map((group) => {
            const groupItems = qa.humanChecklist.filter((i) => i.group === group);
            if (groupItems.length === 0) return null;
            const groupLabel = groupItems[0].groupLabel;
            const checked = groupItems.filter((i) => i.checked).length;
            const requiredMissing = groupItems.filter((i) => i.required && !i.checked).length;

            return (
              <Card key={group} className="border-gray-100">
                <CardContent className="px-3 pt-2 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400"><GroupIcon group={group} /></span>
                      <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{groupLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {requiredMissing > 0 && (
                        <span className="text-[9px] text-red-500">{requiredMissing} required missing</span>
                      )}
                      <span className="text-[9px] text-gray-400">{checked}/{groupItems.length}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    {groupItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-2 px-2 py-1.5 rounded border transition-colors cursor-pointer",
                          item.checked
                            ? "border-green-100 bg-green-50/30"
                            : item.required
                            ? "border-gray-100 bg-white hover:border-gray-200"
                            : "border-gray-50 bg-gray-50/50 hover:border-gray-100"
                        )}
                        onClick={() => toggleItem(item.id)}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="mt-px shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-xs",
                            item.checked ? "line-through text-gray-400" : "text-gray-700"
                          )}>
                            {item.label}
                          </span>
                        </div>
                        {item.required && !item.checked && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-red-100 text-red-500 shrink-0">req</Badge>
                        )}
                        {item.checked && (
                          <CheckCircle2 className="size-3 text-green-500 shrink-0 mt-px" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* ── SECTION 5: FIX NOTES ── */}
          <Card className={cn("border", changesRequested ? "border-amber-200 bg-amber-50/30" : "border-gray-100")}>
            <CardContent className="px-3 pt-2 pb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ClipboardList className="size-3 text-gray-400" />
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Fix Notes / Required Changes</span>
                {changesRequested && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 border-amber-200 text-amber-700 bg-amber-50 ml-1">
                    Changes requested
                  </Badge>
                )}
              </div>
              <Textarea
                ref={notesRef}
                value={qa.qaNotes}
                onChange={(e) => updateQA({ qaNotes: e.target.value })}
                placeholder={changesRequested
                  ? "Describe the required changes in detail..."
                  : "Optional QA notes, observations, or change requests..."}
                className="min-h-[72px] resize-none text-xs"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-gray-500 shrink-0">Assign fixes to</span>
                <Select value={qa.fixAssignee} onValueChange={(v) => updateQA({ fixAssignee: v })}>
                  <SelectTrigger className="h-6 text-xs flex-1">
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_MEMBERS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ── SECTION 6: AUDIT TRAIL ── */}
          {qa.auditTrail.length > 0 && (
            <Card className="border-gray-100">
              <CardContent className="px-3 pt-2 pb-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <History className="size-3 text-gray-400" />
                  <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Approval History</span>
                  <span className="text-[9px] text-gray-400">read-only audit trail</span>
                </div>
                <div className="space-y-0.5 max-h-36 overflow-y-auto pr-1">
                  {[...qa.auditTrail].reverse().map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 py-0.5 border-b border-gray-50 last:border-0">
                      <div className="size-1 rounded-full bg-gray-300 shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-gray-600">{entry.action}</p>
                        <p className="text-[8px] text-gray-400">{fmtTime(entry.timestamp)}{entry.userName ? ` · ${entry.userName}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="space-y-1.5 lg:sticky lg:top-4">

          {/* ── QA READINESS BANNER ── */}
          <Card className={cn("border overflow-hidden", isApproved ? "border-green-200 bg-green-50/30" : overallStatus === "Blocked" ? "border-red-200 bg-red-50/20" : "border-amber-100 bg-amber-50/20")}>
            <CardContent className="px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                {isApproved
                  ? <CheckCircle2 className="size-3.5 text-green-600" />
                  : overallStatus === "Blocked"
                  ? <XCircle className="size-3.5 text-red-500" />
                  : <AlertTriangle className="size-3.5 text-amber-500" />
                }
                <span className={cn("text-xs", isApproved ? "text-green-700" : overallStatus === "Blocked" ? "text-red-700" : "text-amber-700")} style={{ fontWeight: 600 }}>
                  {overallStatus}
                </span>
              </div>

              <div className="space-y-0.5 mb-1.5">
                {aiBlockers.length > 0 && (
                  <p className="text-[9px] text-red-600">
                    <XCircle className="size-2 inline mr-0.5" />
                    {aiBlockers.length} AI blocker{aiBlockers.length !== 1 ? "s" : ""}
                  </p>
                )}
                {requiredUnchecked.length > 0 && (
                  <p className="text-[9px] text-red-600">
                    <XCircle className="size-2 inline mr-0.5" />
                    {requiredUnchecked.length} required check{requiredUnchecked.length !== 1 ? "s" : ""} incomplete
                  </p>
                )}
                {pendingApprovals.length > 0 && (
                  <p className="text-[9px] text-amber-600">
                    <AlertTriangle className="size-2 inline mr-0.5" />
                    {pendingApprovals.length} required approval{pendingApprovals.length !== 1 ? "s" : ""} pending
                  </p>
                )}
                {aiWarnings.length > 0 && (
                  <p className="text-[9px] text-amber-600">
                    <AlertTriangle className="size-2 inline mr-0.5" />
                    {aiWarnings.length} AI warning{aiWarnings.length !== 1 ? "s" : ""} (non-blocking)
                  </p>
                )}
                {isApproved && (
                  <p className="text-[9px] text-green-600">All checks pass · All approvals collected</p>
                )}
              </div>

              {/* Quick links */}
              <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
                <button onClick={onBack} className="text-[9px] text-[#d94e33] hover:underline">← Packaging</button>
                {aiBlockers.some((b) => b.id === "primary-media" || b.id === "thumbnail") && (
                  <button onClick={() => toast.info("Go to Assets tab to upload")} className="text-[9px] text-blue-500 hover:underline">View Assets →</button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── CURRENT USER ── */}
          <Card className="border-gray-100">
            <CardContent className="px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <User className="size-3 text-gray-400" />
                <span className="text-[10px] text-gray-600" style={{ fontWeight: 600 }}>Reviewing as</span>
              </div>
              <Select value={currentUser} onValueChange={setCurrentUser}>
                <SelectTrigger className="h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_MEMBERS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* ── SECTION 4: APPROVALS ── */}
          <Card className="border-gray-100">
            <CardContent className="px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <UserCheck className="size-3 text-gray-400" />
                <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Approvals</span>
              </div>

              <div className="space-y-1.5">
                {qa.approvals.map((approval) => (
                  <div key={approval.role} className={cn(
                    "rounded border p-1.5",
                    approval.status === "approved" ? "border-green-100 bg-green-50/30" :
                    approval.status === "changes-requested" ? "border-amber-100 bg-amber-50/30" :
                    "border-gray-100 bg-white"
                  )}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-700" style={{ fontWeight: 600 }}>{approval.label}</span>
                        {approval.required
                          ? <span className="text-[8px] text-red-500">req</span>
                          : <span className="text-[8px] text-gray-400">opt</span>
                        }
                      </div>
                      {approval.status === "approved" && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-green-700 bg-green-50 border border-green-100 rounded-full px-1.5 py-0">
                          <CheckCircle2 className="size-2" /> Approved
                        </span>
                      )}
                      {approval.status === "changes-requested" && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-1.5 py-0">
                          <RotateCcw className="size-2" /> Changes
                        </span>
                      )}
                      {approval.status === "pending" && (
                        <span className="text-[8px] text-gray-400">Pending</span>
                      )}
                    </div>

                    {approval.userName && (
                      <p className="text-[8px] text-gray-400 mb-0.5">
                        {approval.userName} · {approval.timestamp ? fmtTime(approval.timestamp) : ""}
                      </p>
                    )}

                    {approval.note && (
                      <p className="text-[9px] text-amber-600 italic mb-0.5">"{approval.note}"</p>
                    )}

                    {/* Note input (shows when requesting changes) */}
                    {showNoteInput === approval.role && (
                      <Textarea
                        autoFocus
                        value={approvalNotes[approval.role] || ""}
                        onChange={(e) => setApprovalNotes((prev) => ({ ...prev, [approval.role]: e.target.value }))}
                        placeholder="Describe required changes..."
                        className="min-h-[48px] resize-none text-[10px] mt-1 mb-1"
                      />
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-1 mt-1">
                      {approval.status !== "approved" && (
                        <Button
                          size="sm"
                          className="h-5 text-[9px] px-2 bg-[#d94e33] hover:bg-[#c4452d] gap-0.5"
                          onClick={() => doApproval(approval.role, "approved")}
                          disabled={aiBlockers.length > 0}
                        >
                          <CheckCircle2 className="size-2.5" /> Approve
                        </Button>
                      )}
                      {approval.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 text-[9px] px-2 gap-0.5"
                          onClick={() => {
                            if (showNoteInput === approval.role) {
                              doApproval(approval.role, "changes-requested");
                            } else {
                              setShowNoteInput(approval.role);
                            }
                          }}
                        >
                          <RotateCcw className="size-2.5" />
                          {showNoteInput === approval.role ? "Submit" : "Request Changes"}
                        </Button>
                      )}
                      {approval.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 text-[9px] px-2 text-gray-400 gap-0.5"
                          onClick={() => doApproval(approval.role, "pending")}
                        >
                          <RotateCcw className="size-2.5" /> Revoke
                        </Button>
                      )}
                      {showNoteInput === approval.role && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 text-[9px] px-2 text-gray-400"
                          onClick={() => setShowNoteInput(null)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Final Approve CTA */}
              <Button
                size="sm"
                className={cn(
                  "w-full mt-2 h-7 text-xs gap-1",
                  isApproved
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#d94e33] hover:bg-[#c4452d]"
                )}
                onClick={() => {
                  if (isApproved) {
                    updateQA({ approved: true, auditTrail: [...qa.auditTrail, makeAuditEntry("✅ QA fully approved — ready to publish", currentUser)] });
                    toast.success("QA approved! Moving to Handoff.");
                    onNext();
                  } else {
                    const issues: string[] = [];
                    if (aiBlockers.length > 0) issues.push(`${aiBlockers.length} AI blocker${aiBlockers.length !== 1 ? "s" : ""}`);
                    if (requiredUnchecked.length > 0) issues.push(`${requiredUnchecked.length} unchecked item${requiredUnchecked.length !== 1 ? "s" : ""}`);
                    if (pendingApprovals.length > 0) issues.push(`${pendingApprovals.length} pending approval${pendingApprovals.length !== 1 ? "s" : ""}`);
                    toast.error(`Resolve: ${issues.join(" · ")}`);
                  }
                }}
              >
                {isApproved
                  ? <><CheckCircle2 className="size-3" /> Approve &amp; Move to Handoff</>
                  : <><Send className="size-3" /> Approve &amp; Move to Handoff</>
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── POST-PUBLISH AMPLIFICATION ─── */}
      {qa.approved && (
        <Card className="border-green-200 bg-green-50/20">
          <CardContent className="px-4 pt-3 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="size-4 text-[#d94e33]" />
              <div>
                <p className="text-sm font-bold text-gray-900">Post-Publish Amplification</p>
                <p className="text-[10px] text-muted-foreground">Content is approved — now plan how to maximize its reach</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 1. Paid Boost */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paid Boost</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Boost this post?</span>
                  <div className="flex gap-1">
                    {(["yes", "no", "later"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateAmp({ boostEnabled: opt })}
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-bold border transition-colors capitalize",
                          amp.boostEnabled === opt
                            ? "bg-[#d94e33] text-white border-[#d94e33]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {opt === "later" ? "Decide Later" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {amp.boostEnabled === "yes" && (
                  <div className="grid grid-cols-2 gap-2 pl-4 border-l-2 border-[#d94e33]/30 ml-1">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-0.5 block">Budget</label>
                      <input
                        value={amp.boostBudget ?? ""}
                        onChange={(e) => updateAmp({ boostBudget: e.target.value })}
                        placeholder="e.g. $50"
                        className="w-full h-7 text-xs px-2 border border-gray-200 rounded outline-none focus:border-[#d94e33]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-0.5 block">Duration</label>
                      <input
                        value={amp.boostDuration ?? ""}
                        onChange={(e) => updateAmp({ boostDuration: e.target.value })}
                        placeholder="e.g. 7 days"
                        className="w-full h-7 text-xs px-2 border border-gray-200 rounded outline-none focus:border-[#d94e33]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500 mb-0.5 block">Target Audience</label>
                      <input
                        value={amp.boostAudience ?? ""}
                        onChange={(e) => updateAmp({ boostAudience: e.target.value })}
                        placeholder="e.g. Women 40–60 interested in yoga and wellness"
                        className="w-full h-7 text-xs px-2 border border-gray-200 rounded outline-none focus:border-[#d94e33]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Cross-Post Plan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cross-Post Plan</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[9px] gap-1"
                    disabled={isSuggestingAdaptations}
                    onClick={() => {
                      setIsSuggestingAdaptations(true);
                      setTimeout(() => {
                        setIsSuggestingAdaptations(false);
                        const suggestions: Record<Platform, string> = {
                          instagram: "Trim to 30s, add captions, use trending audio",
                          tiktok: "Use hook-first cut, add on-screen text, tag trending sound",
                          youtube: "Publish as Shorts with keyword-rich title",
                          facebook: "Add text overlay, post to group with context",
                          linkedin: "Add professional framing, remove casual language",
                          tbd: "",
                        };
                        const existing = amp.crossPostPlans ?? OTHER_PLATFORMS.map((p) => ({ platform: p, enabled: false, adaptationNote: "" }));
                        updateAmp({ crossPostPlans: existing.map((cp) => ({ ...cp, adaptationNote: suggestions[cp.platform] || cp.adaptationNote })) });
                        toast.success("Adaptation notes generated");
                      }, 1500);
                    }}
                  >
                    {isSuggestingAdaptations ? <Loader2 className="size-2.5 animate-spin" /> : <Sparkles className="size-2.5" />}
                    AI Suggest Adaptations
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {OTHER_PLATFORMS.map((p) => {
                    const existing = (amp.crossPostPlans ?? []).find((cp) => cp.platform === p);
                    const enabled = existing?.enabled ?? false;
                    const note = existing?.adaptationNote ?? "";
                    const updatePlan = (updates: Partial<{ enabled: boolean; adaptationNote: string }>) => {
                      const plans = OTHER_PLATFORMS.map((op) => {
                        const cur = (amp.crossPostPlans ?? []).find((cp) => cp.platform === op) ?? { platform: op, enabled: false, adaptationNote: "" };
                        return op === p ? { ...cur, ...updates } : cur;
                      });
                      updateAmp({ crossPostPlans: plans });
                    };
                    return (
                      <div key={p} className="flex items-center gap-2">
                        <Checkbox checked={enabled} onCheckedChange={(v) => updatePlan({ enabled: !!v })} />
                        <span className="text-xs text-gray-700 w-20 shrink-0 capitalize">{p}</span>
                        <input
                          value={note}
                          onChange={(e) => updatePlan({ adaptationNote: e.target.value })}
                          placeholder="Adaptation note…"
                          className="flex-1 h-6 text-[10px] px-2 border border-gray-100 rounded outline-none focus:border-[#d94e33] bg-white"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Repurpose Plan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Repurpose Plan</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[9px] gap-1"
                    disabled={isGeneratingRepurpose}
                    onClick={() => {
                      setIsGeneratingRepurpose(true);
                      setTimeout(() => {
                        setIsGeneratingRepurpose(false);
                        updateAmp({ repurposePlan: "1. Extract 3 key quotes for LinkedIn text posts\n2. Turn into a 15-second TikTok highlight clip\n3. Create a carousel summarizing the top takeaways\n4. Use b-roll for Instagram Reels intro" });
                        toast.success("Repurpose plan generated");
                      }, 2500);
                    }}
                  >
                    {isGeneratingRepurpose ? <Loader2 className="size-2.5 animate-spin" /> : <Sparkles className="size-2.5" />}
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  value={amp.repurposePlan ?? ""}
                  onChange={(e) => updateAmp({ repurposePlan: e.target.value })}
                  placeholder="How will this content be repurposed? e.g. Turn YouTube video into 3 TikTok clips, extract quotes for LinkedIn…"
                  className="min-h-[72px] resize-none text-xs"
                />
              </div>

              {/* 4. Employee Advocacy */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee Advocacy</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={amp.teamShare ?? false}
                    onCheckedChange={(v) => updateAmp({ teamShare: !!v })}
                  />
                  <span className="text-xs text-gray-700">Share with team for organic amplification</span>
                </label>
                {amp.teamShare && (
                  <div className="pl-6 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-gray-500">Suggested caption for team to share</label>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 text-[9px] gap-1"
                        disabled={isGeneratingCaption}
                        onClick={() => {
                          setIsGeneratingCaption(true);
                          setTimeout(() => {
                            setIsGeneratingCaption(false);
                            updateAmp({ teamCaption: "Just published: [post title] 🎉 Check it out and share with anyone who'd find this valuable! [link]" });
                            toast.success("Team caption drafted");
                          }, 1500);
                        }}
                      >
                        {isGeneratingCaption ? <Loader2 className="size-2 animate-spin" /> : <Sparkles className="size-2" />}
                        AI Draft
                      </Button>
                    </div>
                    <Textarea
                      value={amp.teamCaption ?? ""}
                      onChange={(e) => updateAmp({ teamCaption: e.target.value })}
                      placeholder="e.g. Just published our latest piece — share with your network! [link]"
                      className="min-h-[56px] resize-none text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onBack}>
          <ChevronLeft className="size-3 mr-1" /> Packaging
        </Button>
        <div className="flex items-center gap-2">
          {!isApproved && (
            <span className="text-[9px] text-gray-400">
              {[
                aiBlockers.length > 0 && `${aiBlockers.length} AI blocker${aiBlockers.length !== 1 ? "s" : ""}`,
                requiredUnchecked.length > 0 && `${requiredUnchecked.length} checklist item${requiredUnchecked.length !== 1 ? "s" : ""}`,
                pendingApprovals.length > 0 && `${pendingApprovals.length} approval${pendingApprovals.length !== 1 ? "s" : ""}`,
              ].filter(Boolean).join(" · ")}
            </span>
          )}
          <Button
            className="bg-[#d94e33] hover:bg-[#c4452d] gap-1 h-7 text-xs"
            onClick={onNext}
          >
            Handoff <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
