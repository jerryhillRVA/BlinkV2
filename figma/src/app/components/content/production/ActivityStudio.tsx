import React, { useCallback, useEffect, useState } from "react";
import {
  Upload,
  Package,
  CheckSquare,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
  PenLine,
  LayoutGrid,
  Sparkles,
  Download,
  Settings2,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Send,
  Clock,
  Search,
  SlidersHorizontal,
  Calendar,
  Flag,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
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
  ActivityData,
  ActivityEvent,
  ActivityEventType,
  DecisionLogEntry,
  DecisionScope,
  CanonicalContentType,
} from "../types";

// ─── Props ───

interface ActivityStudioProps {
  platform: Platform;
  contentType: ContentType;
  title: string;
  createdAt: string;
  brief: ContentBrief;
  outputs: ProductionOutput;
  onUpdateOutputs: (outputs: ProductionOutput) => void;
  onNext?: () => void;
  onBack?: () => void;
  isPanel?: boolean;
}

// ─── Constants ───

const TEAM_MEMBERS = ["Sarah K.", "Maya R.", "Jordan L.", "Alex T.", "Chris B.", "Dana W.", "System"];

const CURRENT_USER = "Sarah K.";

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  facebook: "Facebook", linkedin: "LinkedIn", tbd: "TBD",
};

const CANONICAL_LABELS: Record<CanonicalContentType, string> = {
  VIDEO_SHORT_VERTICAL: "Short Video (Vertical)",
  VIDEO_LONG_HORIZONTAL: "Long-form Video",
  VIDEO_SHORT_HORIZONTAL: "Short Video (Horizontal)",
  IMAGE_SINGLE: "Single Image",
  IMAGE_CAROUSEL: "Carousel",
  TEXT_POST: "Text Post",
  LINK_POST: "Link Post",
  DOCUMENT_CAROUSEL_PDF: "Document / PDF",
  STORY_FRAME_SET: "Story Set",
  LIVE_BROADCAST: "Live Broadcast",
};

const CONTENT_TYPE_TO_CANONICAL: Record<ContentType, CanonicalContentType> = {
  reel: "VIDEO_SHORT_VERTICAL", carousel: "IMAGE_CAROUSEL", "feed-post": "IMAGE_SINGLE",
  story: "STORY_FRAME_SET", guide: "TEXT_POST", live: "LIVE_BROADCAST",
  "short-video": "VIDEO_SHORT_VERTICAL", "photo-carousel": "IMAGE_CAROUSEL",
  "long-form": "VIDEO_LONG_HORIZONTAL", shorts: "VIDEO_SHORT_VERTICAL",
  "live-stream": "LIVE_BROADCAST", "community-post": "TEXT_POST",
  "fb-feed-post": "IMAGE_SINGLE", "fb-link-post": "LINK_POST",
  "fb-reel": "VIDEO_SHORT_VERTICAL", "fb-story": "STORY_FRAME_SET",
  "fb-live": "LIVE_BROADCAST", "ln-text-post": "TEXT_POST",
  "ln-document": "DOCUMENT_CAROUSEL_PDF", "ln-article": "TEXT_POST",
  "ln-video": "VIDEO_SHORT_HORIZONTAL",
};

const EVENT_TYPE_LABELS: Record<ActivityEventType, string> = {
  status: "Status change",
  assignment: "Assignment",
  "draft-edit": "Draft edit",
  blueprint: "Blueprint",
  asset: "Asset upload",
  packaging: "Packaging",
  "ai-validation": "AI check",
  qa: "QA action",
  approval: "Approval",
  export: "Export/Publish",
  system: "System",
};

const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as ActivityEventType[];

const DECISION_SCOPE_LABELS: Record<DecisionScope, string> = {
  brief: "Brief", draft: "Draft", blueprint: "Blueprint",
  assets: "Assets", packaging: "Packaging", qa: "QA",
};

// ─── Event icon & colour ───

function getEventIcon(type: ActivityEventType) {
  const cls = "size-3 shrink-0";
  switch (type) {
    case "status":        return <ArrowRight className={cls} />;
    case "assignment":    return <User className={cls} />;
    case "draft-edit":    return <PenLine className={cls} />;
    case "blueprint":     return <LayoutGrid className={cls} />;
    case "asset":         return <Upload className={cls} />;
    case "packaging":     return <Package className={cls} />;
    case "ai-validation": return <Sparkles className={cls} />;
    case "qa":            return <CheckSquare className={cls} />;
    case "approval":      return <CheckCircle2 className={cls} />;
    case "export":        return <Download className={cls} />;
    default:              return <Settings2 className={cls} />;
  }
}

function getEventDotColor(type: ActivityEventType): string {
  switch (type) {
    case "status":        return "bg-blue-400";
    case "assignment":    return "bg-purple-400";
    case "draft-edit":    return "bg-amber-400";
    case "blueprint":     return "bg-indigo-400";
    case "asset":         return "bg-green-400";
    case "packaging":     return "bg-orange-400";
    case "ai-validation": return "bg-cyan-400";
    case "qa":            return "bg-violet-400";
    case "approval":      return "bg-emerald-500";
    case "export":        return "bg-blue-500";
    default:              return "bg-gray-300";
  }
}

function getEventIconBg(type: ActivityEventType): string {
  switch (type) {
    case "status":        return "bg-blue-50 text-blue-600";
    case "assignment":    return "bg-purple-50 text-purple-600";
    case "draft-edit":    return "bg-amber-50 text-amber-600";
    case "blueprint":     return "bg-indigo-50 text-indigo-600";
    case "asset":         return "bg-green-50 text-green-600";
    case "packaging":     return "bg-orange-50 text-orange-600";
    case "ai-validation": return "bg-cyan-50 text-cyan-600";
    case "qa":            return "bg-violet-50 text-violet-600";
    case "approval":      return "bg-emerald-50 text-emerald-600";
    case "export":        return "bg-blue-50 text-blue-600";
    default:              return "bg-gray-50 text-gray-500";
  }
}

// ─── Time helpers ───

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  } catch { return iso; }
}

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function isSameDay(iso: string, d: Date) {
  const ev = new Date(iso);
  return ev.getFullYear() === d.getFullYear()
    && ev.getMonth() === d.getMonth()
    && ev.getDate() === d.getDate();
}

// ─── Event seeding from production data ───

function seedEvents(
  title: string,
  createdAt: string,
  brief: ContentBrief,
  outputs: ProductionOutput,
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const owner = brief.owner || CURRENT_USER;
  const pkg = outputs.packagingData;
  const assets = outputs.assetsData;
  const qa = outputs.qaData;

  const mk = (
    id: string,
    type: ActivityEventType,
    actor: string,
    message: string,
    timestamp: string,
    important: boolean,
    detail?: string,
    tab?: string,
  ): ActivityEvent => ({ id, type, actor, message, timestamp, important, detail, tab });

  // Production started
  events.push(mk("seed-start", "system", "System",
    `Production started: "${title}"`,
    createdAt || daysAgo(7), true, undefined, "brief"));

  // Brief saved
  events.push(mk("seed-brief-save", "draft-edit", owner,
    "Brief created and fields populated",
    daysAgo(6), false, undefined, "brief"));

  // Brief approved
  if (brief.approved) {
    events.push(mk("seed-brief-approved", "approval", brief.approvedBy || owner,
      `Brief approved by ${brief.approvedBy || owner}`,
      brief.approvedAt || daysAgo(5), true, undefined, "brief"));
  }

  // Draft
  if (outputs.hook) {
    events.push(mk("seed-hook", "draft-edit", owner,
      `Hook selected: "${outputs.hook.slice(0, 60)}${outputs.hook.length > 60 ? "…" : ""}"`,
      daysAgo(4.5), false, undefined, "draft"));
  }
  if (outputs.postCopy) {
    events.push(mk("seed-copy", "draft-edit", owner,
      "Caption / post copy saved in Draft",
      daysAgo(4), false, `${outputs.postCopy.length} characters`, "draft"));
  }
  if (outputs.script) {
    events.push(mk("seed-script", "draft-edit", owner,
      "Script saved in Draft",
      daysAgo(3.8), false, undefined, "draft"));
  }

  // Blueprint
  if (outputs.blueprintData) {
    const bp = outputs.blueprintData;
    events.push(mk("seed-blueprint", "blueprint", owner,
      `Blueprint created — ${bp.units.length} unit${bp.units.length !== 1 ? "s" : ""}${bp.runtimeSeconds ? `, ${bp.runtimeSeconds}s runtime` : ""}`,
      daysAgo(3.5), false, undefined, "blueprint"));
  }

  // Assets
  if (assets) {
    if (assets.masterUploads.length > 0) {
      const fileNames = assets.masterUploads.slice(0, 2).map((f) => f.name).join(", ");
      const more = assets.masterUploads.length > 2 ? ` +${assets.masterUploads.length - 2} more` : "";
      events.push(mk("seed-master", "asset", owner,
        `Master media uploaded: ${fileNames}${more}`,
        daysAgo(3), false, `${assets.masterUploads.length} file(s)`, "assets"));
    }
    if (assets.coverUpload) {
      events.push(mk("seed-cover", "asset", owner,
        `Cover / thumbnail uploaded: ${assets.coverUpload.name}`,
        daysAgo(2.8), false, undefined, "assets"));
    }
    if (assets.captionsFile) {
      events.push(mk("seed-captions", "asset", owner,
        `Captions file uploaded: ${assets.captionsFile.name}`,
        daysAgo(2.6), false, undefined, "assets"));
    }
    if (assets.talentReleaseUrl) {
      events.push(mk("seed-talent", "asset", owner,
        "Talent release URL provided",
        daysAgo(2.5), false, undefined, "assets"));
    }
  }

  // Packaging
  if (pkg) {
    const actionLabel = pkg.publishAction === "schedule"
      ? `Scheduled for ${pkg.scheduleAt ? fmtDateTime(pkg.scheduleAt) : "TBD"}`
      : pkg.publishAction === "publish-now" ? "Set to Publish Now"
      : pkg.publishAction === "export-packet" ? "Export packet configured"
      : "Saved as draft";
    events.push(mk("seed-pkg", "packaging", owner,
      `Packaging configured — ${actionLabel}`,
      daysAgo(2), pkg.publishAction === "schedule" || pkg.publishAction === "publish-now",
      pkg.title ? `Title: ${pkg.title}` : undefined, "packaging"));
  }

  // QA audit trail → activity events
  if (qa?.auditTrail) {
    qa.auditTrail.forEach((entry, i) => {
      const isApproval = entry.action.includes("Approved") || entry.action.includes("Changes requested") || entry.action.includes("QA fully approved");
      const type: ActivityEventType = entry.action.includes("Checked") || entry.action.includes("Unchecked") ? "qa"
        : isApproval ? "approval"
        : entry.action.includes("QA started") ? "system"
        : "qa";
      events.push(mk(
        `seed-qa-${i}`,
        type,
        entry.userName || "System",
        entry.action.replace(/^[✓☐☑↩⟳✅]/u, "").trim(),
        entry.timestamp,
        isApproval,
        undefined,
        "qa",
      ));
    });
  }

  // QA fully approved
  if (qa?.approved) {
    const lastQaTs = qa.auditTrail.at(-1)?.timestamp || daysAgo(0.5);
    // avoid duplicating the audit trail entry
    if (!qa.auditTrail.some((e) => e.action.includes("QA fully approved"))) {
      events.push(mk("seed-qa-approved", "approval", CURRENT_USER,
        "QA fully approved — content ready to publish",
        lastQaTs, true, undefined, "qa"));
    }
  }

  // Sort ascending
  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ─── Timeline grouping ───

function groupByDay(events: ActivityEvent[]) {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const groups: { label: string; events: ActivityEvent[] }[] = [];
  const todayEvs = events.filter((e) => isSameDay(e.timestamp, today));
  const yestEvs  = events.filter((e) => isSameDay(e.timestamp, yesterday));
  const olderEvs = events.filter((e) => {
    const d = new Date(e.timestamp);
    return d < yesterday;
  });

  if (todayEvs.length)   groups.push({ label: "Today",     events: todayEvs.slice().reverse() });
  if (yestEvs.length)    groups.push({ label: "Yesterday", events: yestEvs.slice().reverse() });
  if (olderEvs.length)   groups.push({ label: "Earlier",   events: olderEvs.slice().reverse() });

  return groups;
}

// ─── Avatar ───

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-[#d94e33]", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-blue-500", "bg-gray-400"];
  const color = name === "System" ? "bg-gray-300" : colors[name.charCodeAt(0) % colors.length];
  const sz = size === "xs" ? "size-4 text-[7px]" : "size-5 text-[8px]";
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white shrink-0", sz, color)}>
      {name === "System" ? <Settings2 className="size-2" /> : initials}
    </div>
  );
}

// ─── Main Component ───

export function ActivityStudio({
  platform, contentType, title, createdAt,
  brief, outputs, onUpdateOutputs, onNext, onBack,
  isPanel = false,
}: ActivityStudioProps) {
  const canonical = brief.canonicalType || CONTENT_TYPE_TO_CANONICAL[contentType] || "TEXT_POST";

  // ── Initialize activity data ──
  const existingActivity = outputs.activityData;
  const seeded = seedEvents(title, createdAt, brief, outputs);

  const activityData: ActivityData = existingActivity ?? {
    events: seeded,
    decisionLog: [],
  };

  // Merge seeded events with user-added events (non-seeded)
  const userEvents = activityData.events.filter((e) => !e.id.startsWith("seed-"));
  const allEvents: ActivityEvent[] = [
    ...seeded,
    ...userEvents,
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const updateActivity = useCallback(
    (updates: Partial<ActivityData>) => {
      onUpdateOutputs({
        ...outputs,
        activityData: { ...activityData, ...updates },
      });
    },
    [outputs, activityData, onUpdateOutputs]
  );

  // Seed on first render
  useEffect(() => {
    if (!outputs.activityData) {
      onUpdateOutputs({ ...outputs, activityData });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<ActivityEventType>>(new Set(ALL_EVENT_TYPES));
  const [activePeople, setActivePeople] = useState<string[]>([]);
  const [showOnlyImportant, setShowOnlyImportant] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const toggleType = (t: ActivityEventType) =>
    setActiveTypes((prev) => {
      const s = new Set(prev);
      s.has(t) ? s.delete(t) : s.add(t);
      return s;
    });

  const togglePerson = (p: string) =>
    setActivePeople((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  // ── Decision log state ──
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decisionForm, setDecisionForm] = useState<{ title: string; note: string; scope: DecisionScope }>({
    title: "", note: "", scope: "brief",
  });

  const addDecision = () => {
    if (!decisionForm.title.trim()) { toast.error("Decision title required"); return; }
    const entry: DecisionLogEntry = {
      id: `dec-${Date.now()}`,
      title: decisionForm.title.trim(),
      note: decisionForm.note.trim(),
      scope: decisionForm.scope,
      actor: CURRENT_USER,
      timestamp: new Date().toISOString(),
    };
    updateActivity({ decisionLog: [...activityData.decisionLog, entry] });
    setDecisionForm({ title: "", note: "", scope: "brief" });
    setShowDecisionForm(false);
    toast.success("Decision logged");
  };

  // ── System audit state ──
  const [auditExpanded, setAuditExpanded] = useState(false);
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpandedEventIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // ── Filtered events ──
  const filtered = allEvents.filter((ev) => {
    if (!activeTypes.has(ev.type)) return false;
    if (activePeople.length > 0 && !activePeople.includes(ev.actor)) return false;
    if (showOnlyImportant && !ev.important) return false;
    if (search && !ev.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groups = groupByDay(filtered);
  const uniqueActors = Array.from(new Set(allEvents.map((e) => e.actor)));

  // ── Context chips ──
  const contextChips = [
    { label: PLATFORM_LABELS[platform], icon: "🌐" },
    { label: CANONICAL_LABELS[canonical], icon: "📄" },
    { label: brief.approved ? "Brief Approved" : "Brief Pending", icon: brief.approved ? "✅" : "⏳" },
    ...(brief.owner ? [{ label: `Owner: ${brief.owner}`, icon: "👤" }] : []),
    ...(brief.dueDate ? [{ label: `Due: ${new Date(brief.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`, icon: "📅" }] : []),
    ...(outputs.packagingData?.scheduleAt ? [{ label: `Scheduled: ${fmtDateTime(outputs.packagingData.scheduleAt)}`, icon: "🗓️" }] : []),
  ];

  // ─── Render ───
  return (
    <div className="space-y-1.5">

      {/* ── Context chips row ── */}
      <div className="flex flex-wrap items-center gap-1.5 px-0.5">
        {contextChips.map((chip) => (
          <span key={chip.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[9px] text-gray-600">
            <span>{chip.icon}</span>{chip.label}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-gray-100 text-gray-500">
            {allEvents.length} events
          </Badge>
          <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-gray-100 text-gray-500">
            {activityData.decisionLog.length} decisions
          </Badge>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <Card className="border-gray-100">
        <CardContent className="px-3 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="size-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="h-6 pl-6 text-xs"
              />
            </div>

            {/* Important toggle */}
            <button
              onClick={() => setShowOnlyImportant(!showOnlyImportant)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] transition-colors",
                showOnlyImportant
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              )}
            >
              <Star className="size-2.5" />
              Important only
            </button>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] transition-colors",
                showFilters ? "bg-[#d94e33]/10 border-[#d94e33]/20 text-[#d94e33]" : "bg-gray-50 border-gray-200 text-gray-500"
              )}
            >
              <SlidersHorizontal className="size-2.5" />
              Filters {showFilters ? <ChevronUp className="size-2" /> : <ChevronDown className="size-2" />}
            </button>
          </div>

          {showFilters && (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
              {/* Event type chips */}
              <div>
                <p className="text-[8px] text-gray-400 uppercase tracking-wider mb-1">Event type</p>
                <div className="flex flex-wrap gap-1">
                  {ALL_EVENT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={cn(
                        "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[8px] transition-colors",
                        activeTypes.has(t)
                          ? "bg-gray-800 border-gray-800 text-white"
                          : "bg-white border-gray-200 text-gray-400"
                      )}
                    >
                      {getEventIcon(t)} {EVENT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* People filter */}
              {uniqueActors.length > 1 && (
                <div>
                  <p className="text-[8px] text-gray-400 uppercase tracking-wider mb-1">People</p>
                  <div className="flex flex-wrap gap-1">
                    {uniqueActors.map((actor) => (
                      <button
                        key={actor}
                        onClick={() => togglePerson(actor)}
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] transition-colors",
                          activePeople.includes(actor)
                            ? "bg-gray-800 border-gray-800 text-white"
                            : "bg-white border-gray-200 text-gray-400"
                        )}
                      >
                        <Avatar name={actor} size="xs" /> {actor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setActiveTypes(new Set(ALL_EVENT_TYPES)); setActivePeople([]); setSearch(""); setShowOnlyImportant(false); }}
                  className="text-[8px] text-[#d94e33] hover:underline">
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-1.5 items-start">

        {/* ─── LEFT: Timeline ─── */}
        <div className="space-y-1.5 min-w-0">
          {groups.length === 0 ? (
            <Card className="border-gray-100">
              <CardContent className="px-3 py-6 text-center">
                <Clock className="size-6 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No events match your filters.</p>
                <button onClick={() => { setShowOnlyImportant(false); setSearch(""); setActiveTypes(new Set(ALL_EVENT_TYPES)); }} className="text-[10px] text-[#d94e33] hover:underline mt-1">Clear filters</button>
              </CardContent>
            </Card>
          ) : groups.map((group) => (
            <div key={group.label}>
              {/* Day header */}
              <div className="flex items-center gap-2 mb-1 px-0.5">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{group.label}</span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[8px] text-gray-300">{group.events.length}</span>
              </div>

              <Card className="border-gray-100">
                <CardContent className="px-0 py-0 divide-y divide-gray-50">
                  {group.events.map((ev) => {
                    const isExpanded = expandedEventIds.has(ev.id);
                    return (
                      <div key={ev.id} className={cn(
                        "px-3 py-2 flex items-start gap-2.5 group hover:bg-gray-50/50 transition-colors",
                        ev.important && "border-l-2 border-[#d94e33]/30"
                      )}>
                        {/* Icon */}
                        <div className={cn("flex items-center justify-center size-5 rounded-md shrink-0 mt-0.5", getEventIconBg(ev.type))}>
                          {getEventIcon(ev.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Avatar name={ev.actor} size="xs" />
                            <span className="text-[9px] text-gray-500">{ev.actor}</span>
                            <span className="text-[8px] text-gray-300">·</span>
                            <span className="text-[8px] text-gray-400">{fmtTime(ev.timestamp)}</span>
                            {ev.tab && (
                              <span className="text-[7px] uppercase tracking-wider px-1 py-0 rounded bg-gray-100 text-gray-400">{ev.tab}</span>
                            )}
                            {ev.important && (
                              <Star className="size-2.5 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                          <p className="text-xs mt-0.5 text-gray-600">
                            {ev.message}
                          </p>
                          {isExpanded && ev.detail && (
                            <p className="text-[9px] text-gray-400 mt-0.5 pl-1 border-l-2 border-gray-100">{ev.detail}</p>
                          )}
                        </div>

                        {/* Expand / detail affordance */}
                        {ev.detail && (
                          <button
                            onClick={() => toggleExpand(ev.id)}
                            className="text-[8px] text-gray-300 hover:text-gray-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="space-y-1.5 lg:sticky lg:top-4">

          {/* ── Decision Log ── */}
          <Card className="border-gray-100">
            <CardContent className="px-2.5 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Flag className="size-3 text-gray-400" />
                  <span className="text-xs text-gray-800" style={{ fontWeight: 600 }}>Decision Log</span>
                </div>
                <button
                  onClick={() => setShowDecisionForm(!showDecisionForm)}
                  className="flex items-center gap-0.5 text-[8px] text-[#d94e33] hover:underline"
                >
                  <Plus className="size-2.5" /> Add
                </button>
              </div>

              {/* Existing decisions */}
              {activityData.decisionLog.length > 0 && (
                <div className="space-y-1 mb-1.5 max-h-48 overflow-y-auto">
                  {activityData.decisionLog.map((dec) => (
                    <div key={dec.id} className="px-2 py-1.5 rounded border border-gray-100 bg-gray-50/50">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[9px] text-gray-700" style={{ fontWeight: 600 }}>{dec.title}</span>
                        <span className="text-[7px] uppercase tracking-wider px-1 py-0 rounded bg-gray-100 text-gray-400 shrink-0">
                          {DECISION_SCOPE_LABELS[dec.scope]}
                        </span>
                      </div>
                      {dec.note && <p className="text-[9px] text-gray-500">{dec.note}</p>}
                      <p className="text-[7px] text-gray-400 mt-0.5">{dec.actor} · {fmtDateTime(dec.timestamp)}</p>
                    </div>
                  ))}
                </div>
              )}

              {activityData.decisionLog.length === 0 && !showDecisionForm && (
                <p className="text-[9px] text-gray-400 italic">No decisions logged yet. Use this to capture key "why" notes.</p>
              )}

              {/* Add decision form */}
              {showDecisionForm && (
                <div className="space-y-1.5 pt-1.5 border-t border-gray-100">
                  <Input
                    placeholder="Decision title (required)"
                    value={decisionForm.title}
                    onChange={(e) => setDecisionForm((p) => ({ ...p, title: e.target.value }))}
                    className="h-6 text-xs"
                  />
                  <Textarea
                    placeholder="Decision note / rationale (optional)"
                    value={decisionForm.note}
                    onChange={(e) => setDecisionForm((p) => ({ ...p, note: e.target.value }))}
                    className="min-h-[48px] resize-none text-xs"
                  />
                  <Select value={decisionForm.scope} onValueChange={(v) => setDecisionForm((p) => ({ ...p, scope: v as DecisionScope }))}>
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DECISION_SCOPE_LABELS) as DecisionScope[]).map((s) => (
                        <SelectItem key={s} value={s}>{DECISION_SCOPE_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-5 text-[9px] flex-1 bg-[#d94e33] hover:bg-[#c4452d]" onClick={addDecision}>Log Decision</Button>
                    <Button size="sm" variant="ghost" className="h-5 text-[9px] px-2" onClick={() => setShowDecisionForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── System Audit (expandable) ── */}
          <Card className="border-gray-100">
            <CardContent className="px-2.5 py-2">
              <button
                onClick={() => setAuditExpanded(!auditExpanded)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-1.5">
                  <Settings2 className="size-3 text-gray-300" />
                  <span className="text-[10px] text-gray-500">System Audit</span>
                  <span className="text-[8px] text-gray-400">(advanced)</span>
                </div>
                {auditExpanded ? <ChevronUp className="size-3 text-gray-300" /> : <ChevronDown className="size-3 text-gray-300" />}
              </button>

              {auditExpanded && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5 max-h-64 overflow-y-auto">
                  {[...allEvents].reverse().map((ev) => (
                    <div key={ev.id} className="flex items-start gap-1.5 py-0.5 border-b border-gray-50 last:border-0">
                      <div className={cn("size-1 rounded-full mt-1.5 shrink-0", getEventDotColor(ev.type))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] text-gray-600 leading-tight">
                          <span className="text-gray-400">[{ev.type}]</span> {ev.message}
                        </p>
                        {ev.detail && <p className="text-[7px] text-gray-400">↳ {ev.detail}</p>}
                        <p className="text-[7px] text-gray-300">{fmtDateTime(ev.timestamp)} · {ev.actor}</p>
                      </div>
                    </div>
                  ))}
                  {/* Rule evaluations from brief/QA */}
                  <div className="mt-2 pt-1.5 border-t border-gray-100">
                    <p className="text-[7px] text-gray-400 uppercase tracking-wider mb-1">System rule evaluations</p>
                    {outputs.qaData?.approvals
                      .filter((a) => a.required && a.role === "legal-compliance")
                      .map((a) => (
                        <p key={a.role} className="text-[7px] text-gray-400">
                          → Legal/Compliance required because has_claims or paid_boosted = true
                        </p>
                      ))}
                    {brief.needsAccessibility && (
                      <p className="text-[7px] text-gray-400">→ Accessibility checks triggered because needs_accessibility = true</p>
                    )}
                    {brief.hasTalent && (
                      <p className="text-[7px] text-gray-400">→ Talent release required because has_talent = true</p>
                    )}
                    {(brief.compliance.containsClaims || brief.compliance.disclosureNeeded) && (
                      <p className="text-[7px] text-gray-400">→ Disclosure check triggered because has_claims or disclosure_needed = true</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Handoff CTA ── */}
          {!isPanel && onNext && (
            <Button
              className="w-full bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 h-7 text-xs"
              onClick={onNext}
            >
              <Send className="size-3" /> Hand Off to Pipeline
            </Button>
          )}
        </div>
      </div>

      {/* ── Footer nav ── */}
      {!isPanel && (
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onBack}>
            <ChevronLeft className="size-3 mr-1" /> QA
          </Button>
          <Button className="bg-[#d94e33] hover:bg-[#c4452d] gap-1 h-7 text-xs" onClick={onNext}>
            Hand Off <ArrowRight className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}