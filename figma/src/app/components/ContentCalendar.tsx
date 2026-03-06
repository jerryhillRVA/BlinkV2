import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Instagram, Youtube,
  Filter, Search, Flag, Send, AlertTriangle, OctagonX, Plus, X, Eye, Pencil,
  User, List, LayoutGrid, Columns, CalendarDays,
  Linkedin, Facebook, ExternalLink, Wrench, ClipboardCheck, ArrowRight,
  Copy, Link2, Activity, Image as ImageIcon, CheckCircle2,
  Sparkles, TrendingUp, Lightbulb, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Popover, PopoverContent, PopoverAnchor, PopoverTrigger } from "@/app/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/app/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/app/components/ui/context-menu";
import type { ContentItem, Platform } from "./content/types";
import { MOCK_CONTENT, PLATFORM_CONFIG, STATUS_CONFIG } from "./content/types";
import { cn } from "@/lib/utils";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay, isSameMonth,
  isBefore, parseISO, differenceInDays, isWithinInterval
} from "date-fns";
import { toast } from "sonner";

// ─── Constants ───
const TODAY = new Date("2026-03-03");

// ─── Icons ───
const TikTokIcon = ({ className = "size-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

const PlatformIcon = ({ platform, className = "size-3" }: { platform: Platform; className?: string }) => {
  switch (platform) {
    case "instagram": return <Instagram className={cn(className, "text-pink-600")} />;
    case "youtube": return <Youtube className={cn(className, "text-red-600")} />;
    case "tiktok": return <TikTokIcon className={className} />;
    case "linkedin": return <Linkedin className={cn(className, "text-blue-700")} />;
    case "facebook": return <Facebook className={cn(className, "text-blue-600")} />;
    default: return null;
  }
};

// ─── Types ───
type CalendarView = "month" | "week" | "day" | "list";
type MilestoneType = "brief_due" | "draft_due" | "blueprint_due" | "assets_due" | "packaging_due" | "qa_due";
type PhaseType = "production_window" | "review_window";
type Severity = "overdue" | "at-risk" | "blocked" | null;

interface Milestone {
  milestone_id: string;
  content_id: string;
  milestone_type: MilestoneType;
  due_at: string;
  milestone_owner: string;
  is_required: boolean;
  milestone_status: "not_started" | "in_progress" | "done" | "overdue";
}

interface PhaseWindow {
  phase_window_id: string;
  content_id: string;
  phase_type: PhaseType;
  start_at: string;
  end_at: string;
  owner: string;
  is_required: boolean;
  notes?: string;
}

interface CalendarEvent {
  id: string;
  type: "publish" | "milestone" | "phase_window";
  content_id: string;
  title: string;
  platform: Platform;
  status: string;
  owner: string;
  date: Date;          // For publish/milestone: the point date. For phase: start_at.
  endDate?: Date;      // For phase windows only: end_at.
  time?: string;
  milestone?: Milestone;
  phaseWindow?: PhaseWindow;
  severity: Severity;
  contentItem: ContentItem;
  milestoneLabel?: string;
  phaseLabel?: string;
}

// ─── Helpers ───
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return fallback;
}

const MILESTONE_LABELS: Record<MilestoneType, string> = {
  brief_due: "Brief Due",
  draft_due: "Draft Due",
  blueprint_due: "Blueprint Due",
  assets_due: "Assets Due",
  packaging_due: "Packaging Due",
  qa_due: "QA Due",
};

const PHASE_LABELS: Record<PhaseType, string> = {
  production_window: "Production",
  review_window: "Review",
};

const PHASE_ICONS: Record<PhaseType, typeof Wrench> = {
  production_window: Wrench,
  review_window: ClipboardCheck,
};

const PHASE_COLORS: Record<PhaseType, { bg: string; border: string; text: string; barBg: string }> = {
  production_window: { bg: "bg-blue-100/60", border: "border-blue-300", text: "text-blue-700", barBg: "bg-blue-200/80" },
  review_window: { bg: "bg-purple-100/60", border: "border-purple-300", text: "text-purple-700", barBg: "bg-purple-200/80" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  "in-progress": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  review: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  scheduled: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  published: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-600" },
};

const SEVERITY_CONFIG = {
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700 border-red-300", icon: AlertTriangle, iconColor: "text-red-600" },
  "at-risk": { label: "At-risk", color: "bg-amber-100 text-amber-700 border-amber-300", icon: AlertTriangle, iconColor: "text-amber-600" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700 border-red-300", icon: OctagonX, iconColor: "text-red-600" },
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

// ─── Deep-link routing: determine which production tab to open ───
const MILESTONE_TAB_MAP: Record<MilestoneType, string> = {
  brief_due: "brief",
  draft_due: "draft",
  blueprint_due: "blueprint",
  assets_due: "assets",
  packaging_due: "packaging",
  qa_due: "qa",
};

const PHASE_TAB_MAP: Record<PhaseType, string> = {
  production_window: "draft",
  review_window: "qa",
};

const STATUS_TAB_MAP: Record<string, string> = {
  draft: "brief",
  "in-progress": "draft",
  review: "qa",
  scheduled: "packaging",
  published: "qa",
};

function getDeepLinkTab(event: CalendarEvent): string {
  // Rule 1: If blocked, open QA (unless purely packaging fields)
  if (event.severity === "blocked") {
    // Check if blocker is packaging-specific
    if (event.type === "publish") {
      const item = event.contentItem;
      const hasPackagingIssue = !item.production?.outputs?.qaData?.approved;
      if (hasPackagingIssue) return "qa";
    }
    return "qa";
  }

  // Rule 3: Status-aware override (takes priority for clarity)
  const statusTab = STATUS_TAB_MAP[event.contentItem.status];

  // Rule 2: Route by event type
  if (event.type === "publish") return statusTab || "packaging";
  if (event.type === "milestone" && event.milestone) {
    return MILESTONE_TAB_MAP[event.milestone.milestone_type] || statusTab || "draft";
  }
  if (event.type === "phase_window" && event.phaseWindow) {
    return PHASE_TAB_MAP[event.phaseWindow.phase_type] || statusTab || "draft";
  }

  return statusTab || "draft";
}

// ─── Derive blocker snippets for Quick Peek ───
function deriveBlockers(item: ContentItem): string[] {
  const blockers: string[] = [];
  if (item.production?.outputs?.qaData && !item.production.outputs.qaData.approved) {
    blockers.push("QA not approved");
  }
  if (item.production?.assets?.some(a => a.required && !a.completed)) {
    blockers.push("Missing required assets");
  }
  if (item.production?.outputs?.draftData && !item.production.outputs.draftData.body) {
    blockers.push("Draft content missing");
  }
  if (!item.production?.outputs?.briefData?.objective) {
    blockers.push("Brief objective not set");
  }
  return blockers.slice(0, 3);
}

// ─── Workspace settings (persisted in component state) ───
interface WorkspaceDeadlineSettings {
  enabled: boolean;
  autoCreateOnPublishSet: boolean;
}

// ─── Mock milestone generation ───
function generateMilestones(items: ContentItem[]): Milestone[] {
  const milestones: Milestone[] = [];

  items.forEach((item) => {
    if (!item.production && !item.scheduledDate) return;
    const owner = item.owner || "Unassigned";

    if (item.scheduledDate) {
      const publishDate = parseISO(item.scheduledDate);
      const offsets: { type: MilestoneType; days: number }[] = [
        { type: "draft_due", days: -7 },
        { type: "assets_due", days: -5 },
        { type: "qa_due", days: -2 },
      ];
      offsets.forEach(({ type, days }) => {
        const dueDate = addDays(publishDate, days);
        const isDone = item.status === "published" || item.status === "scheduled";
        const isOverdue = isBefore(dueDate, TODAY) && !isDone;
        milestones.push({
          milestone_id: `ms-${item.id}-${type}`,
          content_id: item.id,
          milestone_type: type,
          due_at: format(dueDate, "yyyy-MM-dd"),
          milestone_owner: owner,
          is_required: true,
          milestone_status: isDone ? "done" : isOverdue ? "overdue" : "in_progress",
        });
      });
    } else if (item.production) {
      const step = item.production.productionStep;
      const stepOrder = ["brief", "draft", "blueprint", "assets", "packaging", "qa"];
      const currentIdx = stepOrder.indexOf(step);
      stepOrder.forEach((s, idx) => {
        if (idx >= currentIdx) {
          const dueDate = addDays(TODAY, (idx - currentIdx + 1) * 3);
          milestones.push({
            milestone_id: `ms-${item.id}-${s}_due`,
            content_id: item.id,
            milestone_type: `${s}_due` as MilestoneType,
            due_at: format(dueDate, "yyyy-MM-dd"),
            milestone_owner: owner,
            is_required: true,
            milestone_status: "in_progress",
          });
        }
      });
    }
  });
  return milestones;
}

// ─── Mock phase window generation ───
function generatePhaseWindows(items: ContentItem[]): PhaseWindow[] {
  const windows: PhaseWindow[] = [];

  items.forEach((item) => {
    const owner = item.owner || "Unassigned";

    if (item.scheduledDate) {
      const publishDate = parseISO(item.scheduledDate);
      // Production window: publish - 7 to publish - 3
      windows.push({
        phase_window_id: `pw-${item.id}-prod`,
        content_id: item.id,
        phase_type: "production_window",
        start_at: format(addDays(publishDate, -7), "yyyy-MM-dd"),
        end_at: format(addDays(publishDate, -3), "yyyy-MM-dd"),
        owner,
        is_required: true,
      });
      // Review window: publish - 2 to publish - 1
      windows.push({
        phase_window_id: `pw-${item.id}-review`,
        content_id: item.id,
        phase_type: "review_window",
        start_at: format(addDays(publishDate, -2), "yyyy-MM-dd"),
        end_at: format(addDays(publishDate, -1), "yyyy-MM-dd"),
        owner,
        is_required: true,
      });
    } else if (item.production) {
      // Items in production without publish date
      const step = item.production.productionStep;
      const stepOrder = ["brief", "draft", "blueprint", "assets", "packaging", "qa"];
      const currentIdx = stepOrder.indexOf(step);
      if (currentIdx >= 0 && currentIdx < 4) {
        windows.push({
          phase_window_id: `pw-${item.id}-prod`,
          content_id: item.id,
          phase_type: "production_window",
          start_at: format(addDays(TODAY, 1), "yyyy-MM-dd"),
          end_at: format(addDays(TODAY, (4 - currentIdx) * 3), "yyyy-MM-dd"),
          owner,
          is_required: true,
        });
      }
      if (currentIdx >= 4 || (currentIdx >= 0 && currentIdx < 6)) {
        const reviewStart = currentIdx >= 4
          ? addDays(TODAY, 1)
          : addDays(TODAY, (4 - currentIdx) * 3 + 1);
        windows.push({
          phase_window_id: `pw-${item.id}-review`,
          content_id: item.id,
          phase_type: "review_window",
          start_at: format(reviewStart, "yyyy-MM-dd"),
          end_at: format(addDays(reviewStart, 2), "yyyy-MM-dd"),
          owner,
          is_required: true,
        });
      }
    }
  });
  return windows;
}

function deriveSeverity(item: ContentItem, milestone?: Milestone): Severity {
  if (milestone && milestone.milestone_status === "overdue") return "overdue";
  if (milestone && isBefore(parseISO(milestone.due_at), TODAY) && milestone.milestone_status !== "done") return "overdue";
  if (item.status === "scheduled" && item.scheduledDate) {
    const pubDate = parseISO(item.scheduledDate);
    const daysUntil = differenceInDays(pubDate, TODAY);
    if (daysUntil <= 7 && daysUntil >= 0) {
      const hasIncompleteAssets = item.production?.assets?.some(a => a.required && !a.completed);
      if (hasIncompleteAssets) return "at-risk";
    }
  }
  if (item.production?.outputs?.qaData && !item.production.outputs.qaData.approved) {
    if (item.scheduledDate) {
      const pubDate = parseISO(item.scheduledDate);
      if (differenceInDays(pubDate, TODAY) <= 3) return "blocked";
    }
  }
  return null;
}

function derivePhaseWindowSeverity(pw: PhaseWindow, item: ContentItem): Severity {
  // Review window extends past publish
  if (pw.phase_type === "review_window" && item.scheduledDate) {
    const pubDate = parseISO(item.scheduledDate);
    const endDate = parseISO(pw.end_at);
    if (!isBefore(endDate, pubDate)) return "at-risk";
  }
  return null;
}

// ─── Saved Views ───
const SAVED_VIEWS = [
  { id: "all", label: "All Events" },
  { id: "my-items", label: "My Items" },
  { id: "this-week", label: "This Week Launches" },
  { id: "needs-review", label: "Needs Review" },
  { id: "at-risk", label: "At-risk Scheduled" },
  { id: "overdue", label: "Overdue Milestones" },
  { id: "in-phase", label: "In Active Phase" },
];


// ═══════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───
// ═══════════════════════════════════════════════════════════

interface ContentCalendarProps {
  onOpenItem?: (itemId: string, tab: string) => void;
}

export function ContentCalendar({ onOpenItem }: ContentCalendarProps = {}) {
  const [items] = useState<ContentItem[]>(() => {
    const stored = loadFromStorage("blink_content_items", MOCK_CONTENT);
    const oldContentIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12"];
    return stored.filter((i: ContentItem) => !oldContentIds.includes(i.id));
  });

  const [currentDate, setCurrentDate] = useState(TODAY);
  const [view, setView] = useState<CalendarView>("month");
  const [showMilestones, setShowMilestones] = useState(true);
  const [showPublished, setShowPublished] = useState(true);
  const [showPhaseWindows, setShowPhaseWindows] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilters, setPlatformFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [savedView, setSavedView] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [peekEvent, setPeekEvent] = useState<CalendarEvent | null>(null);
  const [peekInstanceId, setPeekInstanceId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editApplyDefaults, setEditApplyDefaults] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [createDate, setCreateDate] = useState<Date | null>(null);

  const peekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Workspace settings state
  const [deadlineSettings] = useState<WorkspaceDeadlineSettings>(() =>
    loadFromStorage("blink_deadline_settings", { enabled: true, autoCreateOnPublishSet: true })
  );

  const milestones = useMemo(() => generateMilestones(items), [items]);
  const phaseWindows = useMemo(() => generatePhaseWindows(items), [items]);

  // ─── Derive calendar events ───
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    items.forEach((item) => {
      if (item.scheduledDate) {
        const date = parseISO(item.scheduledDate);
        events.push({
          id: `pub-${item.id}`,
          type: "publish",
          content_id: item.id,
          title: item.title,
          platform: item.platform || "tbd",
          status: item.status,
          owner: item.owner || "Unassigned",
          date,
          time: item.scheduledTime,
          severity: deriveSeverity(item),
          contentItem: item,
        });
      }
    });

    milestones.forEach((ms) => {
      const item = items.find(i => i.id === ms.content_id);
      if (!item) return;
      events.push({
        id: ms.milestone_id,
        type: "milestone",
        content_id: ms.content_id,
        title: item.title,
        platform: item.platform || "tbd",
        status: item.status,
        owner: ms.milestone_owner,
        date: parseISO(ms.due_at),
        milestone: ms,
        severity: deriveSeverity(item, ms),
        contentItem: item,
        milestoneLabel: MILESTONE_LABELS[ms.milestone_type],
      });
    });

    phaseWindows.forEach((pw) => {
      const item = items.find(i => i.id === pw.content_id);
      if (!item) return;
      events.push({
        id: pw.phase_window_id,
        type: "phase_window",
        content_id: pw.content_id,
        title: item.title,
        platform: item.platform || "tbd",
        status: item.status,
        owner: pw.owner,
        date: parseISO(pw.start_at),
        endDate: parseISO(pw.end_at),
        phaseWindow: pw,
        severity: derivePhaseWindowSeverity(pw, item),
        contentItem: item,
        phaseLabel: PHASE_LABELS[pw.phase_type],
      });
    });

    return events;
  }, [items, milestones, phaseWindows]);

  // ─── Filtering ───
  const filteredEvents = useMemo(() => {
    let evts = allEvents;

    if (!showMilestones) evts = evts.filter(e => e.type !== "milestone");
    if (!showPublished) evts = evts.filter(e => e.status !== "published");
    if (!showPhaseWindows) evts = evts.filter(e => e.type !== "phase_window");

    if (platformFilters.length > 0) evts = evts.filter(e => platformFilters.includes(e.platform));
    if (statusFilters.length > 0) evts = evts.filter(e => statusFilters.includes(e.status));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      evts = evts.filter(e => e.title.toLowerCase().includes(q) || e.platform.toLowerCase().includes(q));
    }

    switch (savedView) {
      case "my-items": evts = evts.filter(e => e.owner === "Brett Lewis"); break;
      case "this-week": {
        const ws = startOfWeek(currentDate);
        const we = endOfWeek(currentDate);
        evts = evts.filter(e => e.type === "publish" && e.date >= ws && e.date <= we);
        break;
      }
      case "needs-review": evts = evts.filter(e => e.status === "review"); break;
      case "at-risk": evts = evts.filter(e => e.severity === "at-risk"); break;
      case "overdue": evts = evts.filter(e => e.severity === "overdue"); break;
      case "in-phase": evts = evts.filter(e => {
        if (e.type !== "phase_window" || !e.endDate) return false;
        return isWithinInterval(TODAY, { start: e.date, end: e.endDate });
      }); break;
    }

    return evts;
  }, [allEvents, showMilestones, showPublished, showPhaseWindows, platformFilters, statusFilters, searchQuery, savedView, currentDate]);

  // ─── Date helpers ───
  const getPointEventsForDate = useCallback((date: Date) => {
    return filteredEvents
      .filter(e => e.type !== "phase_window" && isSameDay(e.date, date))
      .sort((a, b) => {
        if (a.severity === "overdue" && b.severity !== "overdue") return -1;
        if (b.severity === "overdue" && a.severity !== "overdue") return 1;
        if (a.type === "milestone" && b.type === "publish") return -1;
        if (a.type === "publish" && b.type === "milestone") return 1;
        return 0;
      });
  }, [filteredEvents]);

  const getPhaseWindowsForDate = useCallback((date: Date) => {
    return filteredEvents.filter(e => {
      if (e.type !== "phase_window" || !e.endDate) return false;
      return isWithinInterval(date, { start: e.date, end: e.endDate });
    });
  }, [filteredEvents]);

  const getAllEventsForDate = useCallback((date: Date) => {
    return [...getPhaseWindowsForDate(date), ...getPointEventsForDate(date)];
  }, [getPhaseWindowsForDate, getPointEventsForDate]);

  // ─── Navigation ───
  const navigate = (direction: "prev" | "next" | "today") => {
    if (direction === "today") { setCurrentDate(TODAY); return; }
    const fns = {
      month: direction === "prev" ? subMonths : addMonths,
      week: direction === "prev" ? subWeeks : addWeeks,
      day: direction === "prev" ? subDays : addDays,
      list: direction === "prev" ? subWeeks : addWeeks,
    };
    setCurrentDate(fns[view](currentDate, 1));
  };

  const dateLabel = useMemo(() => {
    switch (view) {
      case "month": return format(currentDate, "MMMM yyyy");
      case "week": {
        const ws = startOfWeek(currentDate);
        const we = endOfWeek(currentDate);
        return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
      }
      case "day": return format(currentDate, "EEEE, MMMM d, yyyy");
      case "list": return `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`;
    }
  }, [view, currentDate]);

  // ─── Quick peek ───
  const handlePeekEnter = (event: CalendarEvent, instanceId: string) => {
    if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
    peekTimeoutRef.current = setTimeout(() => {
      setPeekEvent(event);
      setPeekInstanceId(instanceId);
    }, 300);
  };
  const handlePeekLeave = () => {
    if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
    peekTimeoutRef.current = setTimeout(() => {
      setPeekEvent(null);
      setPeekInstanceId(null);
    }, 200);
  };

  // ─── Quick edit ───
  const openQuickEdit = (event: CalendarEvent) => {
    setEditEvent(event);
    setEditDate(format(event.date, "yyyy-MM-dd"));
    setEditEndDate(event.endDate ? format(event.endDate, "yyyy-MM-dd") : "");
    setEditTime(event.time || "");
    setEditOwner(event.owner);
    setEditNotes(event.phaseWindow?.notes || "");
    setEditApplyDefaults(false);
    setPeekEvent(null);
    setPeekInstanceId(null);
  };

  const saveQuickEdit = () => {
    if (editEvent?.type === "phase_window" && editEndDate && editDate > editEndDate) {
      toast.error("End date cannot be before start date.");
      return;
    }
    if (editEvent?.type === "publish" && editDate < format(TODAY, "yyyy-MM-dd")) {
      toast.error("Can't schedule in the past.");
      return;
    }
    // Warnings
    if (editEvent?.type === "phase_window" && editEvent.phaseWindow?.phase_type === "review_window") {
      const item = editEvent.contentItem;
      if (item.scheduledDate && editEndDate > item.scheduledDate) {
        toast.warning("Review window extends past publish date.");
      }
    }
    if (editEvent?.type === "publish" && editApplyDefaults && deadlineSettings.enabled) {
      toast.success("Suggested deadlines added based on your workspace defaults.", {
        action: { label: "Undo", onClick: () => toast.info("Deadlines removed.") },
      });
    }
    toast.success("Changes saved.");
    setEditEvent(null);
  };

  // ─── Open Item (deep-link into Content Detail) ───
  const handleOpenItem = useCallback((event: CalendarEvent) => {
    const tab = getDeepLinkTab(event);
    setPeekEvent(null);
    setPeekInstanceId(null);
    setEditEvent(null);
    if (onOpenItem) {
      onOpenItem(event.content_id, tab);
    } else {
      toast.info(`Open "${event.title}" → ${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`);
    }
  }, [onOpenItem]);

  const handleCopyLink = useCallback((event: CalendarEvent) => {
    const tab = getDeepLinkTab(event);
    const link = `${window.location.origin}/content/${event.content_id}?tab=${tab}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link copied to clipboard");
    }).catch(() => {
      toast.info(`Link: /content/${event.content_id}?tab=${tab}`);
    });
    setPeekEvent(null);
    setPeekInstanceId(null);
  }, []);

  // ─── Upcoming panel data ───
  const upcomingEvents = useMemo(() => {
    const horizon = addDays(TODAY, 14);
    // 1) Overdue milestones pinned at top
    const overdue = filteredEvents
      .filter(e => e.severity === "overdue" && e.type === "milestone")
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    // 2) Items currently in a phase window
    const inPhase = filteredEvents.filter(e => {
      if (e.type !== "phase_window" || !e.endDate) return false;
      return isWithinInterval(TODAY, { start: e.date, end: e.endDate });
    });
    // 3) Publish events
    const publishUpcoming = filteredEvents
      .filter(e => e.type === "publish" && e.date >= TODAY && e.date <= horizon)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    // 4) Next milestones
    const milestoneUpcoming = filteredEvents
      .filter(e => e.type === "milestone" && e.date >= TODAY && e.date <= horizon && e.severity !== "overdue")
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const seen = new Set<string>();
    const result: CalendarEvent[] = [];
    const add = (e: CalendarEvent) => { if (!seen.has(e.id)) { seen.add(e.id); result.push(e); } };
    overdue.slice(0, 5).forEach(add);
    inPhase.slice(0, 3).forEach(add);
    publishUpcoming.slice(0, 5).forEach(add);
    milestoneUpcoming.slice(0, 5).forEach(add);
    return result.slice(0, 15);
  }, [filteredEvents]);

  // ─── Stats ───
  const stats = useMemo(() => ({
    overdue: filteredEvents.filter(e => e.severity === "overdue").length,
    atRisk: filteredEvents.filter(e => e.severity === "at-risk").length,
    activePhases: filteredEvents.filter(e => e.type === "phase_window" && e.endDate &&
      isWithinInterval(TODAY, { start: e.date, end: e.endDate })).length,
  }), [filteredEvents]);

  // ─── AI Insights ───
  type InsightLevel = "error" | "warning" | "info" | "tip";
  interface Insight { level: InsightLevel; headline: string; detail: string; }

  const aiInsights = useMemo((): Insight[] => {
    const insights: Insight[] = [];

    // 1. Overdue milestones
    const overdueMilestones = allEvents.filter(e => e.severity === "overdue" && e.type === "milestone");
    if (overdueMilestones.length > 0) {
      const titles = [...new Set(overdueMilestones.map(e => e.title))].slice(0, 2).join(", ");
      insights.push({
        level: "error",
        headline: `${overdueMilestones.length} milestone${overdueMilestones.length > 1 ? "s" : ""} overdue`,
        detail: `${titles}${overdueMilestones.length > 2 ? ` +${overdueMilestones.length - 2} more` : ""} — unblock production immediately.`,
      });
    }

    // 2. Blocked / QA failures
    const blocked = allEvents.filter(e => e.severity === "blocked");
    if (blocked.length > 0) {
      insights.push({
        level: "error",
        headline: `${blocked.length} item${blocked.length > 1 ? "s" : ""} blocked`,
        detail: `QA not approved with publish date approaching. Review before scheduling.`,
      });
    }

    // 3. At-risk publishes
    const atRiskPublish = allEvents.filter(e => e.severity === "at-risk" && e.type === "publish");
    if (atRiskPublish.length > 0) {
      insights.push({
        level: "warning",
        headline: `${atRiskPublish.length} scheduled publish${atRiskPublish.length > 1 ? "es" : ""} at-risk`,
        detail: `Missing required assets within 7 days of publish. Assign assets now.`,
      });
    }

    // 4. Content gap — no publishes in next 5 days
    const next7Days = Array.from({ length: 7 }, (_, i) => format(addDays(TODAY, i + 1), "yyyy-MM-dd"));
    const scheduledDates = new Set(allEvents.filter(e => e.type === "publish" && e.date > TODAY).map(e => format(e.date, "yyyy-MM-dd")));
    const gapDays = next7Days.filter(d => !scheduledDates.has(d));
    if (gapDays.length >= 5) {
      insights.push({
        level: "warning",
        headline: `${gapDays.length}-day publish gap ahead`,
        detail: `No content scheduled for ${gapDays.length} of the next 7 days. Fill gaps to maintain cadence.`,
      });
    }

    // 5. Overloaded publish day (3+ items same day)
    const pubByDay: Record<string, CalendarEvent[]> = {};
    allEvents.filter(e => e.type === "publish" && e.date >= TODAY).forEach(e => {
      const key = format(e.date, "MMM d");
      if (!pubByDay[key]) pubByDay[key] = [];
      pubByDay[key].push(e);
    });
    const heavyDays = Object.entries(pubByDay).filter(([, evts]) => evts.length >= 3);
    if (heavyDays.length > 0) {
      const [day, evts] = heavyDays[0];
      insights.push({
        level: "info",
        headline: `${evts.length} items publishing on ${day}`,
        detail: `Clustering publishes reduces reach. Consider spreading across the week.`,
      });
    }

    // 6. Items in production without a publish date
    const inProductionNoDate = items.filter(i => i.production && !i.scheduledDate);
    if (inProductionNoDate.length > 0) {
      insights.push({
        level: "info",
        headline: `${inProductionNoDate.length} item${inProductionNoDate.length > 1 ? "s" : ""} in production without a publish date`,
        detail: `Set a target publish date to auto-generate milestones and phase windows.`,
      });
    }

    // 7. Platform diversity gap
    const platformCounts: Partial<Record<Platform, number>> = {};
    allEvents.filter(e => e.type === "publish" && e.date >= TODAY && e.date <= addDays(TODAY, 30)).forEach(e => {
      platformCounts[e.platform] = (platformCounts[e.platform] || 0) + 1;
    });
    const activePlatforms = Object.keys(PLATFORM_CONFIG).filter(p => p !== "tbd" && (platformCounts[p as Platform] || 0) > 0);
    const unusedPlatforms = Object.keys(PLATFORM_CONFIG).filter(p => p !== "tbd" && !platformCounts[p as Platform]);
    if (activePlatforms.length > 0 && unusedPlatforms.length >= 3) {
      const names = unusedPlatforms.slice(0, 2).map(p => PLATFORM_CONFIG[p as Platform]?.label).join(" and ");
      insights.push({
        level: "tip",
        headline: `${unusedPlatforms.length} platforms inactive this month`,
        detail: `No content scheduled for ${names} in the next 30 days. Expand your reach.`,
      });
    }

    // 8. Review window extending past publish
    const reviewOverrun = allEvents.filter(e =>
      e.type === "phase_window" && e.phaseWindow?.phase_type === "review_window" && e.severity === "at-risk"
    );
    if (reviewOverrun.length > 0) {
      insights.push({
        level: "tip",
        headline: `${reviewOverrun.length} review window${reviewOverrun.length > 1 ? "s" : ""} extend past publish`,
        detail: `Tighten review schedules or push publish dates to avoid rushed approvals.`,
      });
    }

    return insights;
  }, [allEvents, items]);

  // ═══════════════════════════════════════════════════════════
  // ─── PHASE WINDOW BAR ───
  // ═══════════════════════════════════════════════════════════

  const PhaseWindowBar = ({ event, compact = false, instanceId }: { event: CalendarEvent; compact?: boolean; instanceId?: string }) => {
    if (!event.phaseWindow) return null;
    const phaseCfg = PHASE_COLORS[event.phaseWindow.phase_type];
    const PhaseIcon = PHASE_ICONS[event.phaseWindow.phase_type];
    const sevCfg = event.severity ? SEVERITY_CONFIG[event.severity] : null;
    const isActive = event.endDate && isWithinInterval(TODAY, { start: event.date, end: event.endDate });
    const iid = instanceId || event.id;
    const isOpen = peekEvent?.id === event.id && peekInstanceId === iid;

    return (
      <Popover open={isOpen} onOpenChange={(open) => { if (!open) { setPeekEvent(null); setPeekInstanceId(null); } }}>
        <PopoverAnchor asChild>
          <div
            onMouseEnter={() => handlePeekEnter(event, iid)}
            onMouseLeave={handlePeekLeave}
          >
            <EventContextWrapper event={event}>
              <button
                className={cn(
                  "w-full text-left rounded-sm flex items-center gap-1 transition-all cursor-pointer",
                  phaseCfg.barBg, phaseCfg.border, phaseCfg.text,
                  "border px-1 py-px",
                  event.phaseWindow.phase_type === "production_window" && "border-l-[3px] border-l-blue-500",
                  event.phaseWindow.phase_type === "review_window" && "border-l-[3px] border-l-purple-500",
                  isActive && "ring-1 ring-offset-1",
                  isActive && event.phaseWindow.phase_type === "production_window" && "ring-blue-400",
                  isActive && event.phaseWindow.phase_type === "review_window" && "ring-purple-400",
                  event.severity === "at-risk" && "!border-amber-400 ring-1 ring-amber-300",
                  "hover:opacity-90 hover:shadow-sm",
                  compact ? "text-[7px]" : "text-[8px]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOpen) { setPeekEvent(null); setPeekInstanceId(null); }
                  else { setPeekEvent(event); setPeekInstanceId(iid); }
                }}
                onDoubleClick={(e) => { e.stopPropagation(); handleOpenItem(event); }}
              >
                <PhaseIcon className="size-2.5 shrink-0 opacity-80" />
                <span className="truncate flex-1">{event.title}</span>
                {sevCfg && <sevCfg.icon className={cn("size-2 shrink-0", sevCfg.iconColor)} />}
              </button>
            </EventContextWrapper>
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-72 p-0 shadow-xl border-gray-200"
          side="right"
          align="start"
          sideOffset={4}
          onMouseEnter={() => { if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current); }}
          onMouseLeave={handlePeekLeave}
          onPointerDownOutside={() => { setPeekEvent(null); setPeekInstanceId(null); }}
        >
          <QuickPeekCard event={event} onEdit={() => openQuickEdit(event)} onClose={() => { setPeekEvent(null); setPeekInstanceId(null); }} />
        </PopoverContent>
      </Popover>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ─── EVENT PILL ───
  // ═══════════════════════════════════════════════════════════

  const EventPill = ({ event, compact = false, instanceId }: { event: CalendarEvent; compact?: boolean; instanceId?: string }) => {
    if (event.type === "phase_window") return <PhaseWindowBar event={event} compact={compact} instanceId={instanceId} />;

    const statusColor = STATUS_COLORS[event.status] || STATUS_COLORS.draft;
    const isPublish = event.type === "publish";
    const sevCfg = event.severity ? SEVERITY_CONFIG[event.severity] : null;
    const iid = instanceId || event.id;
    const isOpen = peekEvent?.id === event.id && peekInstanceId === iid;

    return (
      <Popover open={isOpen} onOpenChange={(open) => { if (!open) { setPeekEvent(null); setPeekInstanceId(null); } }}>
        <PopoverAnchor asChild>
          <div
            onMouseEnter={() => handlePeekEnter(event, iid)}
            onMouseLeave={handlePeekLeave}
          >
            <EventContextWrapper event={event}>
              <button
                className={cn(
                  "w-full text-left rounded px-1.5 py-0.5 flex items-center gap-1 transition-all group/pill cursor-pointer",
                  "hover:ring-1 hover:ring-[#d94e33]/30 hover:shadow-sm",
                  isPublish
                    ? cn(statusColor.bg, statusColor.text)
                    : "bg-transparent border border-dashed border-gray-300 text-gray-600 hover:border-gray-400",
                  event.severity === "overdue" && "!border-red-400 !bg-red-50 !text-red-700 border-solid",
                  event.severity === "at-risk" && isPublish && "ring-1 ring-amber-300",
                  event.severity === "blocked" && "!border-red-500 !bg-red-50 !text-red-800 border-solid",
                  compact ? "text-[8px]" : "text-[9px]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOpen) { setPeekEvent(null); setPeekInstanceId(null); }
                  else { setPeekEvent(event); setPeekInstanceId(iid); }
                }}
                onDoubleClick={(e) => { e.stopPropagation(); handleOpenItem(event); }}
              >
                {isPublish ? <Send className="size-2.5 shrink-0 opacity-60" /> : <Flag className="size-2.5 shrink-0 opacity-60" />}
                <PlatformIcon platform={event.platform} className="size-2.5 shrink-0" />
                <span className="truncate flex-1">
                  {event.title}
                </span>
                {!isPublish && !compact && (
                  <span className="shrink-0 text-[7px] opacity-50">{event.milestoneLabel}</span>
                )}
                {sevCfg && !compact && (
                  <sevCfg.icon className={cn("size-2.5 shrink-0", sevCfg.iconColor)} />
                )}
              </button>
            </EventContextWrapper>
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="w-72 p-0 shadow-xl border-gray-200"
          side="right"
          align="start"
          sideOffset={4}
          onMouseEnter={() => { if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current); }}
          onMouseLeave={handlePeekLeave}
          onPointerDownOutside={() => { setPeekEvent(null); setPeekInstanceId(null); }}
        >
          <QuickPeekCard event={event} onEdit={() => openQuickEdit(event)} onClose={() => { setPeekEvent(null); setPeekInstanceId(null); }} />
        </PopoverContent>
      </Popover>
    );
  };

  // ─── Quick Peek Card ───
  const QuickPeekCard = ({ event, onEdit, onClose }: { event: CalendarEvent; onEdit: () => void; onClose: () => void }) => {
    const statusCfg = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
    const sevCfg = event.severity ? SEVERITY_CONFIG[event.severity] : null;
    const isPhase = event.type === "phase_window";
    const isActive = isPhase && event.endDate && isWithinInterval(TODAY, { start: event.date, end: event.endDate });
    const blockers = deriveBlockers(event.contentItem);
    const deepTab = getDeepLinkTab(event);

    // Event summary line per spec
    const eventSummary = isPhase && event.endDate
      ? `${event.phaseLabel} window: ${format(event.date, "MMM d")} – ${format(event.endDate, "MMM d")}`
      : event.type === "milestone"
        ? `${event.milestoneLabel}: ${format(event.date, "EEE, MMM d")} • All day`
        : `Publishes: ${format(event.date, "EEE, MMM d")}${event.time ? ` • ${event.time}` : ""}`;

    return (
      <div className="divide-y">
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <button
              className="text-xs font-bold line-clamp-2 text-left hover:text-[#d94e33] transition-colors cursor-pointer"
              onClick={() => handleOpenItem(event)}
            >
              {event.title}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="size-3.5" /></button>
          </div>
          {/* Chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge variant="outline" className={cn("text-[8px] font-bold border", statusCfg.color)}>
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className="text-[8px] font-bold capitalize">
              <PlatformIcon platform={event.platform} className="size-2.5 mr-0.5" />
              {PLATFORM_CONFIG[event.platform]?.label || event.platform}
            </Badge>
            {event.contentItem.contentType && (
              <Badge variant="outline" className="text-[8px] font-bold capitalize bg-gray-50">
                {event.contentItem.contentType.replace(/-/g, " ")}
              </Badge>
            )}
            {event.type === "milestone" && (
              <Badge variant="outline" className="text-[8px] font-bold bg-gray-50">
                <Flag className="size-2.5 mr-0.5" /> {event.milestoneLabel}
              </Badge>
            )}
            {isPhase && event.phaseWindow && (
              <Badge variant="outline" className={cn(
                "text-[8px] font-bold",
                PHASE_COLORS[event.phaseWindow.phase_type].bg,
                PHASE_COLORS[event.phaseWindow.phase_type].text
              )}>
                {React.createElement(PHASE_ICONS[event.phaseWindow.phase_type], { className: "size-2.5 mr-0.5" })}
                {event.phaseLabel}
              </Badge>
            )}
          </div>
          {/* Event summary */}
          <div className="text-[9px] text-muted-foreground mb-2 flex items-center gap-1.5">
            <CalendarDays className="size-3 shrink-0" />
            {eventSummary}
          </div>
          {/* Active phase indicator */}
          {isActive && (
            <div className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 mb-2">
              <Wrench className="size-3" />
              <span className="font-bold">Today is within this {event.phaseLabel?.toLowerCase()} window</span>
            </div>
          )}
          {/* Severity / readiness badges */}
          {sevCfg && (
            <div className={cn("text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 mb-2", sevCfg.color)}>
              <sevCfg.icon className="size-3" />
              <span className="font-bold">{sevCfg.label}</span>
              {event.severity === "at-risk" && isPhase && <span>— review window extends past publish date</span>}
              {event.severity === "at-risk" && !isPhase && <span>— missing required assets</span>}
              {event.severity === "blocked" && <span>— QA not approved</span>}
              {event.severity === "overdue" && <span>— deadline has passed</span>}
            </div>
          )}
          {/* Blocker snippets (max 2) */}
          {blockers.length > 0 && (
            <div className="mb-2 space-y-0.5">
              {blockers.slice(0, 2).map((b, i) => (
                <div key={i} className="text-[9px] text-red-600 flex items-center gap-1">
                  <OctagonX className="size-2.5 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
              {blockers.length > 2 && (
                <span className="text-[8px] text-muted-foreground">+{blockers.length - 2} more</span>
              )}
            </div>
          )}
          {/* Owner & pipeline step */}
          <div className="space-y-1 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5"><User className="size-3" /> {event.owner}</div>
            {event.contentItem.production && (
              <div className="flex items-center gap-1.5">
                <Flag className="size-3" />
                Step: {event.contentItem.production.productionStep}
              </div>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="p-2 space-y-1.5">
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="text-[10px] h-6 gap-1 flex-1" onClick={onEdit}>
              <Pencil className="size-3" /> Edit Dates
            </Button>
            <Button
              size="sm"
              className="text-[10px] h-6 gap-1 flex-1 bg-[#d94e33] hover:bg-[#c2462e] text-white"
              onClick={() => handleOpenItem(event)}
            >
              <Eye className="size-3" /> Open Item
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="text-[10px] h-5 gap-1 flex-1 text-muted-foreground"
              onClick={() => handleCopyLink(event)}
            >
              <Link2 className="size-2.5" /> Copy Link
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-[10px] h-5 gap-1 flex-1 text-muted-foreground"
              onClick={() => {
                setPeekEvent(null);
                setPeekInstanceId(null);
                toast.info(`Opens pipeline filtered to "${event.title}"`);
              }}
            >
              <ArrowRight className="size-2.5" /> Pipeline
            </Button>
          </div>
          <div className="text-[8px] text-center text-muted-foreground/50">
            Opens → {deepTab.charAt(0).toUpperCase() + deepTab.slice(1)} tab
          </div>
        </div>
      </div>
    );
  };

  // ─── Event Context Menu (right-click) ───
  const EventContextWrapper = ({ event, children }: { event: CalendarEvent; children: React.ReactNode }) => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem className="text-xs gap-2" onClick={() => handleOpenItem(event)}>
          <Eye className="size-3.5" /> Open Item
        </ContextMenuItem>
        <ContextMenuItem className="text-xs gap-2" onClick={() => openQuickEdit(event)}>
          <Pencil className="size-3.5" /> Edit Date{event.type === "phase_window" ? "s" : ""}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-xs gap-2" onClick={() => handleCopyLink(event)}>
          <Link2 className="size-3.5" /> Copy Link
        </ContextMenuItem>
        <ContextMenuItem className="text-xs gap-2" onClick={() => {
          toast.info(`Activity view for "${event.title}"`);
        }}>
          <Activity className="size-3.5" /> View Activity
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-xs gap-2" onClick={() => {
          toast.info(`Opens pipeline filtered to "${event.title}"`);
        }}>
          <ArrowRight className="size-3.5" /> View in Pipeline
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  // ─── Severity Badge ───
  const SeverityBadge = ({ severity }: { severity: Severity }) => {
    if (!severity) return null;
    const cfg = SEVERITY_CONFIG[severity];
    const IconCmp = cfg.icon;
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded border", cfg.color)}>
        <IconCmp className="size-2.5" /> {cfg.label}
      </span>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ─── MONTH VIEW ───
  // ═══════════════════════════════════════════════════════════

  const MonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calStart, end: calEnd });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-muted-foreground bg-gray-50/50 border-r last:border-r-0 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map(day => {
            const phaseEvents = getPhaseWindowsForDate(day);
            const pointEvents = getPointEventsForDate(day);
            const inMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isSameDay(day, TODAY);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-r border-b p-1 min-h-[100px] transition-colors cursor-pointer",
                  "hover:bg-gray-50/80",
                  !inMonth && "bg-gray-50/40 opacity-50",
                  isCurrentDay && "bg-[#d94e33]/5"
                )}
                onClick={() => {
                  if (pointEvents.length === 0 && phaseEvents.length === 0) setCreateDate(day);
                  else { setCurrentDate(day); setView("day"); }
                }}
              >
                <span className={cn(
                  "text-[10px] font-bold inline-flex items-center justify-center size-5 rounded-full",
                  isCurrentDay ? "bg-[#d94e33] text-white" : inMonth ? "text-gray-600" : "text-gray-400"
                )}>
                  {format(day, "d")}
                </span>
                {/* Phase window bars at top */}
                {phaseEvents.length > 0 && (
                  <div className="space-y-px mt-0.5">
                    {phaseEvents.slice(0, 2).map(event => (
                      <PhaseWindowBar key={`${event.id}-${day.toISOString()}`} event={event} compact instanceId={`${event.id}-${day.toISOString()}`} />
                    ))}
                    {phaseEvents.length > 2 && (
                      <span className="text-[7px] text-muted-foreground">+{phaseEvents.length - 2} phases</span>
                    )}
                  </div>
                )}
                {/* Point events */}
                <div className="mt-0.5 space-y-0.5">
                  {pointEvents.slice(0, 3).map(event => (
                    <EventPill key={`${event.id}-${day.toISOString()}`} event={event} compact={pointEvents.length > 2} instanceId={`${event.id}-${day.toISOString()}`} />
                  ))}
                  {pointEvents.length > 3 && (
                    <button
                      className="text-[8px] text-[#d94e33] font-bold hover:underline"
                      onClick={(e) => { e.stopPropagation(); setCurrentDate(day); setView("day"); }}
                    >
                      +{pointEvents.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ─── WEEK VIEW ───
  // ═══════════════════════════════════════════════════════════

  const WeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-y-auto max-h-[600px]">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-[60px]" />
              {weekDays.map(day => (
                <col key={day.toISOString()} />
              ))}
            </colgroup>
            {/* Header */}
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b">
                <th className="border-r" />
                {weekDays.map(day => {
                  const isCurrentDay = isSameDay(day, TODAY);
                  return (
                    <th key={day.toISOString()} className={cn("text-center py-2 border-r last:border-r-0", isCurrentDay && "bg-[#d94e33]/5")}>
                      <div className="text-[9px] text-muted-foreground uppercase font-normal">{format(day, "EEE")}</div>
                      <div className={cn(
                        "text-sm font-bold inline-flex items-center justify-center size-7 rounded-full",
                        isCurrentDay && "bg-[#d94e33] text-white"
                      )}>{format(day, "d")}</div>
                    </th>
                  );
                })}
              </tr>
              {/* All-day lane */}
              <tr className="border-b bg-gray-50/30">
                <td className="p-1 text-[8px] text-muted-foreground border-r text-center align-middle">All Day</td>
                {weekDays.map(day => {
                  const phaseEvents = getPhaseWindowsForDate(day);
                  const allDayMilestones = getPointEventsForDate(day).filter(e => e.type === "milestone");
                  const isCurrentDay = isSameDay(day, TODAY);
                  return (
                    <td key={day.toISOString()} className={cn("border-r last:border-r-0 p-0.5 align-top", isCurrentDay && "bg-[#d94e33]/5")}>
                      <div className="space-y-px min-h-[44px]">
                        {phaseEvents.slice(0, 2).map(e => <PhaseWindowBar key={`${e.id}-${day.toISOString()}`} event={e} compact instanceId={`${e.id}-${day.toISOString()}`} />)}
                        {phaseEvents.length > 2 && <span className="text-[7px] text-muted-foreground">+{phaseEvents.length - 2} phases</span>}
                        {allDayMilestones.slice(0, 2).map(e => <EventPill key={`${e.id}-${day.toISOString()}`} event={e} compact instanceId={`${e.id}-${day.toISOString()}`} />)}
                        {allDayMilestones.length > 2 && <span className="text-[7px] text-muted-foreground">+{allDayMilestones.length - 2}</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </thead>
            {/* Time grid */}
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b last:border-b-0">
                  <td className="border-r h-14 text-right pr-1.5 pt-0.5 align-top">
                    <span className="text-[9px] text-muted-foreground">{hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}</span>
                  </td>
                  {weekDays.map(day => {
                    const publishEvents = getPointEventsForDate(day).filter(e => {
                      if (e.type !== "publish" || !e.time) return false;
                      const h = parseInt(e.time.split(":")[0]);
                      return h === hour;
                    });
                    const isCurrentDay = isSameDay(day, TODAY);
                    return (
                      <td
                        key={`${day.toISOString()}-${hour}`}
                        className={cn("border-r last:border-r-0 h-14 p-0.5 align-top", isCurrentDay && "bg-[#d94e33]/3")}
                      >
                        {publishEvents.map(e => <EventPill key={`${e.id}-${day.toISOString()}-${hour}`} event={e} instanceId={`${e.id}-${day.toISOString()}-${hour}`} />)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ─── DAY VIEW ───
  // ═══════════════════════════════════════════════════════════

  const DayView = () => {
    const phaseEvents = getPhaseWindowsForDate(currentDate);
    const pointEvents = getPointEventsForDate(currentDate);
    const allDayEvents = [...phaseEvents, ...pointEvents];
    const isCurrentDay = isSameDay(currentDate, TODAY);

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className={cn("p-3 border-b flex items-center gap-3", isCurrentDay && "bg-[#d94e33]/5")}>
          <div className={cn(
            "text-2xl font-bold size-12 rounded-full flex items-center justify-center",
            isCurrentDay ? "bg-[#d94e33] text-white" : "bg-gray-100 text-gray-700"
          )}>
            {format(currentDate, "d")}
          </div>
          <div>
            <div className="text-sm font-bold">{format(currentDate, "EEEE, MMMM d, yyyy")}</div>
            <div className="text-xs text-muted-foreground">
              {allDayEvents.length} event{allDayEvents.length !== 1 ? "s" : ""}
              {phaseEvents.length > 0 && ` · ${phaseEvents.length} active phase${phaseEvents.length !== 1 ? "s" : ""}`}
            </div>
          </div>
        </div>

        {allDayEvents.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarIcon className="size-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No content scheduled. Create content for this day.</p>
            <Button size="sm" className="bg-[#d94e33] hover:bg-[#c2462e] text-white gap-1" onClick={() => setCreateDate(currentDate)}>
              <Plus className="size-3.5" /> Create Content
            </Button>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="divide-y">
              {/* Phase windows first */}
              {phaseEvents.map(event => {
                const phaseCfg = event.phaseWindow ? PHASE_COLORS[event.phaseWindow.phase_type] : null;
                const PhaseIcon = event.phaseWindow ? PHASE_ICONS[event.phaseWindow.phase_type] : Wrench;
                const statusCfg = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                const isActive = event.endDate && isWithinInterval(TODAY, { start: event.date, end: event.endDate });
                return (
                  <div
                    key={event.id}
                    className={cn("p-3 hover:bg-gray-50/50 transition-colors cursor-pointer flex items-start gap-3", phaseCfg?.bg)}
                    onClick={() => openQuickEdit(event)}
                    onDoubleClick={() => handleOpenItem(event)}
                  >
                    <div className="shrink-0 flex flex-col items-center w-12 text-center pt-0.5">
                      <PhaseIcon className={cn("size-4", phaseCfg?.text)} />
                      <span className="text-[8px] text-muted-foreground mt-0.5">
                        {format(event.date, "M/d")}–{event.endDate ? format(event.endDate, "M/d") : ""}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{event.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{event.phaseLabel}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {isActive && <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Active</span>}
                        <Badge variant="outline" className={cn("text-[8px] font-bold border", statusCfg.color)}>
                          <div className={cn("size-1.5 rounded-full mr-1", statusCfg.dotColor)} />
                          {statusCfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-[8px] font-bold capitalize">
                          <PlatformIcon platform={event.platform} className="size-2.5 mr-0.5" />
                          {PLATFORM_CONFIG[event.platform]?.label}
                        </Badge>
                        <SeverityBadge severity={event.severity} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Point events */}
              {pointEvents.map(event => {
                const statusCfg = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                return (
                  <div
                    key={event.id}
                    className="p-3 hover:bg-gray-50/50 transition-colors cursor-pointer flex items-start gap-3"
                    onClick={() => openQuickEdit(event)}
                    onDoubleClick={() => handleOpenItem(event)}
                  >
                    <div className="shrink-0 flex flex-col items-center w-12 text-center pt-0.5">
                      {event.type === "publish" ? (
                        <Send className="size-4 text-[#d94e33]" />
                      ) : (
                        <Flag className="size-4 text-gray-500" />
                      )}
                      <span className="text-[9px] text-muted-foreground mt-0.5">
                        {event.time || "All day"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{event.title}</p>
                      {event.type === "milestone" && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{event.milestoneLabel}</p>}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <Badge variant="outline" className={cn("text-[8px] font-bold border", statusCfg.color)}>
                          <div className={cn("size-1.5 rounded-full mr-1", statusCfg.dotColor)} />
                          {statusCfg.label}
                        </Badge>
                        <Badge variant="outline" className="text-[8px] font-bold capitalize">
                          <PlatformIcon platform={event.platform} className="size-2.5 mr-0.5" />
                          {PLATFORM_CONFIG[event.platform]?.label}
                        </Badge>
                        <SeverityBadge severity={event.severity} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ─── LIST (AGENDA) VIEW ───
  // ═══════════════════════════════════════════════════════════

  const ListView = () => {
    const weekStart = startOfWeek(currentDate);
    const listDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 13) });

    return (
      <div className="space-y-1">
        {listDays.map(day => {
          const phaseEvents = getPhaseWindowsForDate(day);
          const pointEvents = getPointEventsForDate(day);
          // Only show phase windows on their start day to avoid duplication
          const phaseStartEvents = phaseEvents.filter(e => isSameDay(e.date, day));
          const allEvents = [...phaseStartEvents, ...pointEvents];
          if (allEvents.length === 0) return null;
          const isCurrentDay = isSameDay(day, TODAY);
          return (
            <div key={day.toISOString()} className="border rounded-lg overflow-hidden bg-white">
              <button
                className={cn(
                  "w-full px-3 py-2 flex items-center gap-2 text-left border-b",
                  isCurrentDay ? "bg-[#d94e33]/5" : "bg-gray-50/50"
                )}
                onClick={() => { setCurrentDate(day); setView("day"); }}
              >
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isCurrentDay && "text-[#d94e33]"
                )}>
                  {format(day, "EEE, MMM d")}
                </span>
                <Badge variant="secondary" className="text-[8px] h-4 px-1">{allEvents.length}</Badge>
                {isCurrentDay && <span className="text-[8px] font-bold text-[#d94e33] bg-[#d94e33]/10 px-1.5 py-0.5 rounded">Today</span>}
              </button>
              <div className="divide-y">
                {/* Phase window range rows first */}
                {phaseStartEvents.map(event => {
                  const phaseCfg = event.phaseWindow ? PHASE_COLORS[event.phaseWindow.phase_type] : null;
                  const PhaseIcon = event.phaseWindow ? PHASE_ICONS[event.phaseWindow.phase_type] : Wrench;
                  const statusCfg = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                  const isActive = event.endDate && isWithinInterval(TODAY, { start: event.date, end: event.endDate });
                  return (
                    <div
                      key={event.id}
                      className={cn("px-3 py-2 flex items-start gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer", phaseCfg?.bg)}
                      onClick={() => openQuickEdit(event)}
                      onDoubleClick={() => handleOpenItem(event)}
                    >
                      <div className="w-14 text-center shrink-0 pt-0.5">
                        <PhaseIcon className={cn("size-3.5 mx-auto", phaseCfg?.text)} />
                        <div className="text-[8px] text-muted-foreground mt-0.5">
                          {format(event.date, "M/d")}–{event.endDate ? format(event.endDate, "M/d") : ""}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{event.phaseLabel}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {isActive && <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Active</span>}
                          <Badge variant="outline" className={cn("text-[8px] font-bold border", statusCfg.color)}>
                            <div className={cn("size-1.5 rounded-full mr-1", statusCfg.dotColor)} />
                            {statusCfg.label}
                          </Badge>
                          <Badge variant="outline" className="text-[8px] font-bold capitalize">
                            <PlatformIcon platform={event.platform} className="size-2.5 mr-0.5" />
                            {PLATFORM_CONFIG[event.platform]?.label}
                          </Badge>
                          <SeverityBadge severity={event.severity} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Point events */}
                {pointEvents.map(event => {
                  const statusCfg = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                  return (
                    <div
                      key={event.id}
                      className="px-3 py-2 flex items-start gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => openQuickEdit(event)}
                      onDoubleClick={() => handleOpenItem(event)}
                    >
                      <div className="w-14 text-center shrink-0 pt-0.5">
                        {event.type === "publish"
                          ? <Send className="size-3.5 text-[#d94e33] mx-auto" />
                          : <Flag className="size-3.5 text-gray-400 mx-auto" />
                        }
                        <div className="text-[9px] text-muted-foreground mt-0.5">{event.time || "All day"}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{event.title}</p>
                        {event.type === "milestone" && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{event.milestoneLabel}</p>}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <Badge variant="outline" className={cn("text-[8px] font-bold border", statusCfg.color)}>
                            <div className={cn("size-1.5 rounded-full mr-1", statusCfg.dotColor)} />
                            {statusCfg.label}
                          </Badge>
                          <Badge variant="outline" className="text-[8px] font-bold capitalize">
                            <PlatformIcon platform={event.platform} className="size-2.5 mr-0.5" />
                            {PLATFORM_CONFIG[event.platform]?.label}
                          </Badge>
                          <SeverityBadge severity={event.severity} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ─── UPCOMING PANEL ───
  // ═══════════════════════════════════════════════════════════

  // ─── Insight config ───
  const INSIGHT_CONFIG = {
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: OctagonX, iconClass: "text-red-500", dot: "bg-red-500" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: AlertTriangle, iconClass: "text-amber-500", dot: "bg-amber-500" },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: TrendingUp, iconClass: "text-blue-500", dot: "bg-blue-500" },
    tip: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", icon: Lightbulb, iconClass: "text-violet-500", dot: "bg-violet-500" },
  } as const;

  const UpcomingPanel = () => {
    const [insightsExpanded, setInsightsExpanded] = useState(showInsights);
    const errorCount = aiInsights.filter(i => i.level === "error").length;
    const warnCount = aiInsights.filter(i => i.level === "warning").length;

    return (
    <div className="space-y-3">
      {/* ─── AI Insights Card ─── */}
      <Card className={cn("border", errorCount > 0 ? "border-red-200" : warnCount > 0 ? "border-amber-200" : "border-violet-200")}>
        <button
          className="w-full px-3 pt-3 pb-2 flex items-center gap-2 text-left"
          onClick={() => setInsightsExpanded(v => !v)}
        >
          <div className={cn(
            "size-6 rounded-md flex items-center justify-center shrink-0",
            errorCount > 0 ? "bg-red-100" : warnCount > 0 ? "bg-amber-100" : "bg-violet-100"
          )}>
            <Sparkles className={cn("size-3.5", errorCount > 0 ? "text-red-500" : warnCount > 0 ? "text-amber-500" : "text-violet-500")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">AI Insights</span>
              {aiInsights.length > 0 && (
                <span className={cn(
                  "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                  errorCount > 0 ? "bg-red-100 text-red-600" : warnCount > 0 ? "bg-amber-100 text-amber-600" : "bg-violet-100 text-violet-600"
                )}>
                  {aiInsights.length}
                </span>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground truncate">
              {aiInsights.length === 0 ? "All clear — no issues detected" :
                errorCount > 0 ? `${errorCount} critical issue${errorCount > 1 ? "s" : ""} require${errorCount === 1 ? "s" : ""} attention` :
                warnCount > 0 ? `${warnCount} warning${warnCount > 1 ? "s" : ""} detected` :
                `${aiInsights.length} recommendation${aiInsights.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {insightsExpanded ? <ChevronUp className="size-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />}
        </button>

        {insightsExpanded && (
          <CardContent className="px-3 pb-3 pt-0">
            {aiInsights.length === 0 ? (
              <div className="flex flex-col items-center py-3 gap-1.5 text-center">
                <CheckCircle2 className="size-6 text-emerald-400" />
                <p className="text-[10px] text-muted-foreground">Calendar looks healthy. Keep up the momentum!</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {aiInsights.map((insight, i) => {
                  const cfg = INSIGHT_CONFIG[insight.level];
                  const IconCmp = cfg.icon;
                  return (
                    <div key={i} className={cn("rounded-md border p-2", cfg.bg, cfg.border)}>
                      <div className="flex items-start gap-1.5">
                        <IconCmp className={cn("size-3 shrink-0 mt-px", cfg.iconClass)} />
                        <div>
                          <p className={cn("text-[10px] font-bold leading-tight", cfg.text)}>{insight.headline}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">{insight.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Actionable alert stats — only shown when non-zero */}
      {(stats.overdue > 0 || stats.atRisk > 0 || stats.activePhases > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {stats.activePhases > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-blue-600">{stats.activePhases}</div>
                <div className="text-[9px] text-blue-600">Active Phases</div>
              </CardContent>
            </Card>
          )}
          {stats.overdue > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-red-600">{stats.overdue}</div>
                <div className="text-[9px] text-red-600">Overdue</div>
              </CardContent>
            </Card>
          )}
          {stats.atRisk > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-amber-600">{stats.atRisk}</div>
                <div className="text-[9px] text-amber-600">At-risk</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upcoming list */}
      <Card className="border-gray-100">
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <Clock className="size-3.5 text-[#d94e33]" /> Upcoming (14 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="overflow-y-auto max-h-[400px]">
            <div className="space-y-1.5">
              {upcomingEvents.map(event => {
                const statusCfg = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                const isPhase = event.type === "phase_window";
                const isActive = isPhase && event.endDate && isWithinInterval(TODAY, { start: event.date, end: event.endDate });
                const phaseCfg = isPhase && event.phaseWindow ? PHASE_COLORS[event.phaseWindow.phase_type] : null;
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "p-2 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer bg-white",
                      event.severity === "overdue" && "border-red-200 bg-red-50/30",
                      event.severity === "at-risk" && "border-amber-200 bg-amber-50/30",
                      isActive && "border-blue-200 bg-blue-50/30"
                    )}
                    onClick={() => openQuickEdit(event)}
                    onDoubleClick={() => handleOpenItem(event)}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {event.type === "publish" && <Send className="size-3 text-[#d94e33]" />}
                      {event.type === "milestone" && <Flag className="size-3 text-gray-400" />}
                      {isPhase && event.phaseWindow && React.createElement(PHASE_ICONS[event.phaseWindow.phase_type], {
                        className: cn("size-3", phaseCfg?.text)
                      })}
                      <span className="text-[9px] text-muted-foreground">
                        {isPhase && event.endDate
                          ? `${format(event.date, "MMM d")} – ${format(event.endDate, "MMM d")}`
                          : `${format(event.date, "MMM d")}${event.time ? ` • ${event.time}` : ""}`
                        }
                      </span>
                    </div>
                    <p className="text-[11px] font-bold line-clamp-1">{event.title}</p>
                    {isPhase && (
                      <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">{event.phaseLabel}</p>
                    )}
                    {event.type === "milestone" && (
                      <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">{event.milestoneLabel}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {isActive && <span className="text-[7px] font-bold text-blue-600 bg-blue-100 px-1 py-0.5 rounded">Active</span>}
                      <Badge variant="outline" className={cn("text-[7px] font-bold border", statusCfg.color)}>
                        <div className={cn("size-1.5 rounded-full mr-0.5", statusCfg.dotColor)} />
                        {statusCfg.label}
                      </Badge>
                      <Badge variant="outline" className="text-[7px] font-bold capitalize">
                        <PlatformIcon platform={event.platform} className="size-2.5 mr-0.5" />
                        {PLATFORM_CONFIG[event.platform]?.label}
                      </Badge>
                      <SeverityBadge severity={event.severity} />
                    </div>
                  </div>
                );
              })}
              {upcomingEvents.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-4">No upcoming events</p>
              )}
            </div>
          </div>
          {upcomingEvents.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full text-[10px] mt-2 text-[#d94e33]" onClick={() => setView("list")}>
              View all →
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CalendarIcon className="size-6 text-[#d94e33]" />
          <h1 className="text-2xl font-bold">Content Calendar</h1>
        </div>
        <p className="text-muted-foreground text-sm">Unified planning surface for publish schedules, production phases, and deadlines</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-block w-3 h-2.5 rounded-sm bg-blue-200 border-l-[3px] border-l-blue-500" />
            Production
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-block w-3 h-2.5 rounded-sm bg-purple-200 border-l-[3px] border-l-purple-500" />
            Review
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Send className="size-2.5 text-[#d94e33]" />
            Publish
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Flag className="size-2.5 text-gray-400" />
            Milestone
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View switcher */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {([
            { id: "month" as const, icon: LayoutGrid, label: "Month" },
            { id: "week" as const, icon: Columns, label: "Week" },
            { id: "day" as const, icon: CalendarDays, label: "Day" },
            { id: "list" as const, icon: List, label: "List" },
          ]).map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all",
                view === v.id
                  ? "bg-white shadow-sm text-[#d94e33]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <v.icon className="size-3.5" /> {v.label}
            </button>
          ))}
        </div>

        {/* Date nav */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate("prev")}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => navigate("today")}>
            Today
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate("next")}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-sm font-bold ml-1">{dateLabel}</span>
        </div>

        <div className="flex-1" />

        {/* Filters popover */}
        {(() => {
          const activeCount = platformFilters.length + statusFilters.length +
            (!showPhaseWindows ? 1 : 0) + (!showMilestones ? 1 : 0) + (!showPublished ? 1 : 0) +
            (savedView !== "all" ? 1 : 0) + (searchQuery ? 1 : 0);
          const togglePlatform = (p: string) =>
            setPlatformFilters(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
          const toggleStatus = (s: string) =>
            setStatusFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
          return (
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant={activeCount > 0 ? "default" : "outline"}
                  size="sm"
                  className={cn("h-7 text-[10px] gap-1 relative", activeCount > 0 && "bg-[#d94e33] hover:bg-[#c2462e] text-white")}
                >
                  <Filter className="size-3" /> Filters
                  {activeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-white text-[#d94e33] text-[9px] font-bold flex items-center justify-center border border-[#d94e33]/30 shadow-sm">
                      {activeCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-3 space-y-3 shadow-xl" sideOffset={6}>
                {/* Search */}
                <div className="flex items-center gap-1.5">
                  <Search className="size-3.5 text-gray-400 shrink-0" />
                  <Input
                    placeholder="Search titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 text-[10px] flex-1"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Event Types */}
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Event Types</p>
                  <div className="flex gap-1.5">
                    {([
                      { key: "phases", label: "Phases", checked: showPhaseWindows, toggle: () => setShowPhaseWindows(v => !v), activeClass: "bg-blue-100 text-blue-700 border-blue-300", dot: "bg-blue-500" },
                      { key: "milestones", label: "Milestones", checked: showMilestones, toggle: () => setShowMilestones(v => !v), activeClass: "bg-gray-200 text-gray-700 border-gray-300", dot: "bg-gray-500" },
                      { key: "published", label: "Published", checked: showPublished, toggle: () => setShowPublished(v => !v), activeClass: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "bg-emerald-500" },
                    ] as const).map(item => (
                      <button key={item.key} onClick={item.toggle}
                        className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-all flex-1 justify-center",
                          item.checked ? item.activeClass : "bg-white text-gray-400 border-gray-200"
                        )}>
                        <span className={cn("size-1.5 rounded-full", item.checked ? item.dot : "bg-gray-300")} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform */}
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Platform</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(PLATFORM_CONFIG).filter(([k]) => k !== "tbd").map(([key, cfg]) => {
                      const active = platformFilters.includes(key);
                      return (
                        <button key={key} onClick={() => togglePlatform(key)}
                          className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-all",
                            active ? "bg-[#d94e33]/10 text-[#d94e33] border-[#d94e33]/30" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                          )}>
                          <PlatformIcon platform={key as Platform} className="size-2.5" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const active = statusFilters.includes(key);
                      return (
                        <button key={key} onClick={() => toggleStatus(key)}
                          className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-all",
                            active ? cn(cfg.color, "border-current") : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                          )}>
                          <span className={cn("size-1.5 rounded-full", active ? cfg.dotColor : "bg-gray-300")} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Saved View */}
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Saved View</p>
                  <Select value={savedView} onValueChange={setSavedView}>
                    <SelectTrigger className="h-7 w-full text-[10px]">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAVED_VIEWS.map(sv => (
                        <SelectItem key={sv.id} value={sv.id}>{sv.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Footer */}
                <div className="flex justify-between pt-1 border-t border-gray-100">
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 text-muted-foreground gap-1"
                    onClick={() => {
                      setSearchQuery(""); setPlatformFilters([]); setStatusFilters([]);
                      setShowPhaseWindows(true); setShowMilestones(true); setShowPublished(true); setSavedView("all");
                    }}>
                    <X className="size-3" /> Clear all
                  </Button>
                  <Button size="sm" className="text-[10px] h-6 bg-[#d94e33] hover:bg-[#c2462e] text-white"
                    onClick={() => setShowFilters(false)}>
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          );
        })()}

        {/* Sidebar toggle (desktop) */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] gap-1 hidden lg:flex"
          onClick={() => setShowUpcoming(!showUpcoming)}
        >
          {showUpcoming ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
          Upcoming
        </Button>
      </div>

      {/* Active filter chips strip — compact, only shown when filters are active */}
      {(() => {
        const chips: { label: string; onRemove: () => void }[] = [];
        if (searchQuery) chips.push({ label: `"${searchQuery}"`, onRemove: () => setSearchQuery("") });
        if (!showPhaseWindows) chips.push({ label: "Phases hidden", onRemove: () => setShowPhaseWindows(true) });
        if (!showMilestones) chips.push({ label: "Milestones hidden", onRemove: () => setShowMilestones(true) });
        if (!showPublished) chips.push({ label: "Published hidden", onRemove: () => setShowPublished(true) });
        platformFilters.forEach(p => chips.push({ label: PLATFORM_CONFIG[p as Platform]?.label || p, onRemove: () => setPlatformFilters(prev => prev.filter(x => x !== p)) }));
        statusFilters.forEach(s => chips.push({ label: STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label || s, onRemove: () => setStatusFilters(prev => prev.filter(x => x !== s)) }));
        if (savedView !== "all") chips.push({ label: SAVED_VIEWS.find(v => v.id === savedView)?.label || savedView, onRemove: () => setSavedView("all") });
        if (chips.length === 0) return null;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground shrink-0">Filtered by:</span>
            {chips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#d94e33]/10 text-[#d94e33] border border-[#d94e33]/20 rounded text-[9px] font-medium">
                {chip.label}
                <button onClick={chip.onRemove} className="ml-0.5 hover:text-[#c2462e]"><X className="size-2.5" /></button>
              </span>
            ))}
            <button
              onClick={() => { setSearchQuery(""); setPlatformFilters([]); setStatusFilters([]); setShowPhaseWindows(true); setShowMilestones(true); setShowPublished(true); setSavedView("all"); }}
              className="text-[9px] text-muted-foreground hover:text-red-500 underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        );
      })()}

      {/* Main layout */}
      <div className={cn("grid gap-4", showUpcoming ? "grid-cols-1 lg:grid-cols-[1fr_260px]" : "grid-cols-1")}>
        <div>
          {view === "month" && <MonthView />}
          {view === "week" && <WeekView />}
          {view === "day" && <DayView />}
          {view === "list" && <ListView />}
        </div>

        {showUpcoming && (
          <div className="hidden lg:block">
            <UpcomingPanel />
          </div>
        )}
      </div>

      {/* ─── Quick Edit Modal (Publish / Milestone / Phase Window) ─── */}
      <Dialog open={!!editEvent} onOpenChange={(open) => { if (!open) setEditEvent(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              {editEvent?.type === "publish" && <Send className="size-4 text-[#d94e33]" />}
              {editEvent?.type === "milestone" && <Flag className="size-4 text-gray-500" />}
              {editEvent?.type === "phase_window" && editEvent.phaseWindow &&
                React.createElement(PHASE_ICONS[editEvent.phaseWindow.phase_type], {
                  className: cn("size-4", PHASE_COLORS[editEvent.phaseWindow.phase_type].text)
                })
              }
              Quick Edit — {editEvent?.type === "publish" ? "Publish Event" : editEvent?.type === "milestone" ? "Milestone" : "Phase Window"}
            </DialogTitle>
          </DialogHeader>
          {editEvent && (
            <div className="space-y-3 py-2">
              <p className="text-xs font-bold">
                {editEvent.type === "milestone" ? editEvent.milestoneLabel
                  : editEvent.type === "phase_window" ? editEvent.phaseLabel
                  : editEvent.title}
              </p>
              {(editEvent.type === "milestone" || editEvent.type === "phase_window") && (
                <p className="text-[10px] text-muted-foreground">{editEvent.title}</p>
              )}

              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[8px] capitalize">
                  <PlatformIcon platform={editEvent.platform} className="size-2.5 mr-0.5" />
                  {PLATFORM_CONFIG[editEvent.platform]?.label}
                </Badge>
                <SeverityBadge severity={editEvent.severity} />
              </div>

              <div className="space-y-2">
                {editEvent.type === "phase_window" ? (
                  <>
                    <div>
                      <Label className="text-[10px] mb-1 block">Start Date</Label>
                      <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] mb-1 block">End Date</Label>
                      <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="h-8 text-xs" />
                    </div>
                    {editEndDate && editDate > editEndDate && (
                      <div className="text-[9px] p-1.5 rounded border bg-red-50 text-red-700 border-red-300 flex items-center gap-1">
                        <OctagonX className="size-3" /> End date cannot be before start date.
                      </div>
                    )}
                    {editEvent.phaseWindow?.phase_type === "review_window" && editEvent.contentItem.scheduledDate && editEndDate > editEvent.contentItem.scheduledDate && (
                      <div className="text-[9px] p-1.5 rounded border bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Review window extends past publish date.
                      </div>
                    )}
                    <div>
                      <Label className="text-[10px] mb-1 block">Owner</Label>
                      <Input value={editOwner} onChange={(e) => setEditOwner(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px] mb-1 block">Notes</Label>
                      <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="h-8 text-xs" placeholder="Optional notes..." />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-[10px] mb-1 block">Date</Label>
                      <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 text-xs" />
                    </div>
                    {editEvent.type === "publish" && editDate < format(TODAY, "yyyy-MM-dd") && (
                      <div className="text-[9px] p-1.5 rounded border bg-red-50 text-red-700 border-red-300 flex items-center gap-1">
                        <OctagonX className="size-3" /> Can&apos;t schedule in the past.
                      </div>
                    )}
                    {editEvent.type === "publish" && (
                      <div>
                        <Label className="text-[10px] mb-1 block">Time</Label>
                        <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="h-8 text-xs" />
                      </div>
                    )}
                    <div>
                      <Label className="text-[10px] mb-1 block">{editEvent.type === "milestone" ? "Milestone Owner" : "Owner"}</Label>
                      <Input value={editOwner} onChange={(e) => setEditOwner(e.target.value)} className="h-8 text-xs" />
                    </div>
                    {editEvent.type === "publish" && deadlineSettings.enabled && (
                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <Switch checked={editApplyDefaults} onCheckedChange={setEditApplyDefaults} className="scale-75" />
                        <span className="text-[10px] text-muted-foreground">Apply default deadlines</span>
                      </label>
                    )}
                  </>
                )}
              </div>

              {editEvent.severity && (
                <div className={cn("text-[9px] p-2 rounded border", SEVERITY_CONFIG[editEvent.severity].color)}>
                  <div className="flex items-center gap-1 font-bold">
                    {React.createElement(SEVERITY_CONFIG[editEvent.severity].icon, { className: "size-3" })}
                    {SEVERITY_CONFIG[editEvent.severity].label}
                  </div>
                  {editEvent.severity === "at-risk" && editEvent.type === "phase_window" && <p className="mt-0.5">Review window extends past publish date.</p>}
                  {editEvent.severity === "at-risk" && editEvent.type !== "phase_window" && <p className="mt-0.5">Missing required assets for scheduled publish.</p>}
                  {editEvent.severity === "blocked" && <p className="mt-0.5">QA has not been approved.</p>}
                  {editEvent.severity === "overdue" && <p className="mt-0.5">This deadline has passed.</p>}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-[10px] gap-1" onClick={() => editEvent && handleOpenItem(editEvent)}>
              <ExternalLink className="size-3" /> Open Item
            </Button>
            <Button size="sm" className="text-[10px] bg-[#d94e33] hover:bg-[#c2462e] text-white" onClick={saveQuickEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Content Modal ─── */}
      <Dialog open={!!createDate} onOpenChange={(open) => { if (!open) setCreateDate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Plus className="size-4 text-[#d94e33]" />
              Create Content — {createDate && format(createDate, "MMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[10px] mb-1 block">Platform</Label>
              <Select defaultValue="instagram">
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_CONFIG).filter(([k]) => k !== "tbd").map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Content Type</Label>
              <Select defaultValue="reel">
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="feed-post">Feed Post</SelectItem>
                  <SelectItem value="story">Stories</SelectItem>
                  <SelectItem value="short-video">Short Video</SelectItem>
                  <SelectItem value="long-form">Long-form Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Key Message</Label>
              <Input placeholder="What's the main message?" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Owner</Label>
              <Input defaultValue="Brett Lewis" className="h-8 text-xs" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Switch defaultChecked className="scale-75" />
                <span className="text-[10px] text-muted-foreground">Set as publish date</span>
              </label>
            </div>
            {deadlineSettings.enabled && deadlineSettings.autoCreateOnPublishSet && (
              <div className="text-[9px] p-2 rounded bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1.5">
                <CalendarIcon className="size-3" />
                Suggested deadlines will be auto-created based on workspace defaults.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-[10px]" onClick={() => setCreateDate(null)}>Cancel</Button>
            <Button size="sm" className="text-[10px] bg-[#d94e33] hover:bg-[#c2462e] text-white gap-1" onClick={() => {
              setCreateDate(null);
              if (deadlineSettings.enabled && deadlineSettings.autoCreateOnPublishSet) {
                toast.success("Suggested deadlines added based on your workspace defaults.", {
                  action: { label: "Undo", onClick: () => toast.info("Deadlines removed.") },
                });
              }
            }}>
              <Plus className="size-3" /> Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
