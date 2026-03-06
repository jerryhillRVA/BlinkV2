import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Layers,
  Rocket,
  Brain,
  GitBranch,
  Fingerprint,
  ClipboardList,
  AlertTriangle,
  AlertCircle,
  Info,
  Copy,
  CheckCheck,
  LayoutGrid,
  List,
  BookOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  ZapOff,
  Circle,
  PlayCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
} from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════
type Priority = "P0" | "P1" | "P2";
type Status = "Not Started" | "In Progress" | "Completed" | "Blocked" | "On Hold";
type Category =
  | "Onboarding & Workspace Setup"
  | "AI Research & Content Engine"
  | "Workflow & Management"
  | "Identity & Personalization";

type UserStoryId =
  | "US-01" | "US-02" | "US-03" | "US-04" | "US-05"
  | "US-06" | "US-07" | "US-08" | "US-09" | "US-10"
  | "US-11" | "US-12" | "US-13";

type EpicId =
  | "EP-01" | "EP-02" | "EP-03" | "EP-04"
  | "EP-05" | "EP-06" | "EP-07" | "EP-08";

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  category: Category;
  userStory: UserStoryId;
  epic: EpicId;
  mvp: boolean;
  status: Status;
}

// ═══════════════════════════════════════
// localStorage helpers
// ═══════════════════════════════════════
const STORAGE_KEY_PRIORITY = "blink-feature-priorities";
const STORAGE_KEY_MVP = "blink-feature-mvp";
const STORAGE_KEY_STATUS = "blink-feature-status";
const STORAGE_KEY_VIEW = "blink-feature-view-state";

interface ViewState {
  searchQuery: string;
  filterCategory: string;
  filterPriority: string;
  filterUserStory: string;
  filterEpic: string;
  filterMvp: string;
  filterStatus: string;
  viewMode: string;
  sortField: string;
  sortDirection: string;
  expandedCategories: string[];
  expandedEpics: string[];
  expandedDescriptions: string[];
}

function loadViewState(): Partial<ViewState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIEW);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveViewState(state: ViewState) {
  try {
    localStorage.setItem(STORAGE_KEY_VIEW, JSON.stringify(state));
  } catch { /* ignore */ }
}

function loadOverrides<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveOverrides<T>(key: string, overrides: Record<string, T>) {
  try {
    localStorage.setItem(key, JSON.stringify(overrides));
  } catch { /* ignore */ }
}

// ═══════════════════════════════════════
// Epics
// ═══════════════════════════════════════
interface EpicDef {
  id: EpicId;
  title: string;
  color: string;
  bg: string;
  iconColor: string;
}

const EPICS: EpicDef[] = [
  { id: "EP-01", title: "Workspace Onboarding", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", iconColor: "text-violet-500" },
  { id: "EP-02", title: "AI Research Engine", color: "text-[#d94e33]", bg: "bg-[#d94e33]/5 border-[#d94e33]/20", iconColor: "text-[#d94e33]" },
  { id: "EP-03", title: "Content Creation & AI", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", iconColor: "text-orange-500" },
  { id: "EP-04", title: "Production Pipeline", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", iconColor: "text-blue-500" },
  { id: "EP-05", title: "Publishing & Scheduling", color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-200", iconColor: "text-cyan-500" },
  { id: "EP-06", title: "Workspace Configuration", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-500" },
  { id: "EP-07", title: "Team & Security", color: "text-pink-700", bg: "bg-pink-50 border-pink-200", iconColor: "text-pink-500" },
  { id: "EP-08", title: "Platform Optimization", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
];

const getEpic = (id: EpicId) => EPICS.find((e) => e.id === id)!;

// ═══════════════════════════════════════
// User Stories
// ═══════════════════════════════════════
interface UserStoryDef {
  id: UserStoryId;
  title: string;
  persona: string;
  color: string;
}

const USER_STORIES: UserStoryDef[] = [
  { id: "US-01", title: "Set up a new workspace quickly", persona: "New User", color: "text-violet-600" },
  { id: "US-02", title: "Configure platform-specific rules", persona: "Workspace Admin", color: "text-violet-600" },
  { id: "US-03", title: "Define my content strategy", persona: "Content Strategist", color: "text-violet-600" },
  { id: "US-04", title: "Manage multiple brands", persona: "Power User", color: "text-violet-600" },
  { id: "US-05", title: "Find relevant research sources with AI", persona: "Content Creator", color: "text-[#d94e33]" },
  { id: "US-06", title: "Turn research into content ideas", persona: "Content Creator", color: "text-[#d94e33]" },
  { id: "US-07", title: "Track content through production", persona: "Content Manager", color: "text-blue-600" },
  { id: "US-08", title: "Manage and find my content", persona: "Content Manager", color: "text-blue-600" },
  { id: "US-09", title: "Plan my publishing schedule", persona: "Content Planner", color: "text-blue-600" },
  { id: "US-10", title: "Customize my AI agent team", persona: "Workspace Admin", color: "text-emerald-600" },
  { id: "US-11", title: "Manage my team and access control", persona: "Team Lead", color: "text-emerald-600" },
  { id: "US-12", title: "Manage my account and security", persona: "User", color: "text-emerald-600" },
  { id: "US-13", title: "Configure workspace identity and branding", persona: "Workspace Admin", color: "text-emerald-600" },
];

const getUserStory = (id: UserStoryId) => USER_STORIES.find((s) => s.id === id)!;

// ═══════════════════════════════════════
// Category & Priority Config
// ═══════════════════════════════════════
const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: "Onboarding & Workspace Setup", label: "Onboarding & Workspace Setup", icon: <Rocket className="size-4" />, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  { id: "AI Research & Content Engine", label: "AI Research & Content Engine", icon: <Brain className="size-4" />, color: "text-[#d94e33]", bg: "bg-[#d94e33]/5 border-[#d94e33]/20" },
  { id: "Workflow & Management", label: "Workflow & Management", icon: <GitBranch className="size-4" />, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { id: "Identity & Personalization", label: "Identity & Personalization", icon: <Fingerprint className="size-4" />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  P0: { label: "P0 — Critical", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <AlertTriangle className="size-3" /> },
  P1: { label: "P1 — Important", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <AlertCircle className="size-3" /> },
  P2: { label: "P2 — Nice-to-Have", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <Info className="size-3" /> },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  "Not Started": { label: "Not Started", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: <Circle className="size-3" /> },
  "In Progress": { label: "In Progress", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <PlayCircle className="size-3" /> },
  "Completed": { label: "Completed", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: <CheckCircle2 className="size-3" /> },
  "Blocked": { label: "Blocked", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <XCircle className="size-3" /> },
  "On Hold": { label: "On Hold", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: <PauseCircle className="size-3" /> },
};

// ═══════════════════════════════════════
// Sort Config
// ═══════════════════════════════════════
type SortField = "id" | "category" | "priority" | "epic" | "mvp" | "status";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "id", label: "ID" },
  { field: "category", label: "Category" },
  { field: "priority", label: "Priority" },
  { field: "epic", label: "Epic" },
  { field: "mvp", label: "MVP" },
  { field: "status", label: "Status" },
];

const PRIORITY_ORDER: Record<Priority, number> = { P0: 0, P1: 1, P2: 2 };
const STATUS_ORDER: Record<Status, number> = { 
  "Not Started": 0, 
  "In Progress": 1, 
  "Blocked": 2, 
  "On Hold": 3, 
  "Completed": 4 
};
const CATEGORY_ORDER: Record<Category, number> = {
  "Onboarding & Workspace Setup": 0,
  "AI Research & Content Engine": 1,
  "Workflow & Management": 2,
  "Identity & Personalization": 3,
};

function sortFeatures(features: Feature[], field: SortField, direction: SortDirection): Feature[] {
  const sorted = [...features].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "id":
        cmp = a.id.localeCompare(b.id);
        break;
      case "category":
        cmp = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
        break;
      case "priority":
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        break;
      case "epic":
        cmp = a.epic.localeCompare(b.epic);
        break;
      case "mvp":
        cmp = (a.mvp === b.mvp) ? 0 : a.mvp ? -1 : 1;
        break;
      case "status":
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
    }
    return direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}

// ═══════════════════════════════════════
// Feature Data (initial)
// ═══════════════════════════════════════
const INITIAL_FEATURES: Feature[] = [
  // ── Onboarding & Workspace Setup ──
  { id: "OWS-001", name: "5-Step Setup Wizard", description: "Guided workspace initialization flow with sequential steps: Workspace Identity → Platform Config → Content Strategy → Agent Team → Review & Launch. StepIndicator, AnimatePresence transitions, auto-save to localStorage, and Back/Next/Finish controls in Card footer.", priority: "P0", category: "Onboarding & Workspace Setup", userStory: "US-01", epic: "EP-01", mvp: true, status: "Completed" },
  { id: "OWS-002", name: "Workspace Identity Configuration", description: "Step 1 of setup wizard (StepWorkspaceBasics). Captures workspace name, purpose statement, mission, brand voice textarea, and audience segment targets with age range selectors.", priority: "P0", category: "Onboarding & Workspace Setup", userStory: "US-01", epic: "EP-01", mvp: true, status: "Completed" },
  { id: "OWS-003", name: "Platform Configuration & Rules", description: "Step 2 of setup wizard (StepPlatformConfig). Per-platform toggles for Instagram, TikTok, YouTube, LinkedIn, Facebook. Configure aspect ratio, video/thumbnail resolution, posting frequency, timezone, peak times, AI content style, and design prompt suffix.", priority: "P0", category: "Onboarding & Workspace Setup", userStory: "US-02", epic: "EP-08", mvp: true, status: "Completed" },
  { id: "OWS-004", name: "Content Pillar Definition", description: "Step 3 of setup wizard (StepContent). Create content pillars with name, description, themes (tag input), audience segment multi-select, and platform distribution multi-select. Add/remove pillar operations with animated transitions.", priority: "P0", category: "Onboarding & Workspace Setup", userStory: "US-03", epic: "EP-01", mvp: true, status: "Completed" },
  { id: "OWS-005", name: "AI Agent Team Setup", description: "Step 4 of setup wizard (StepAgents). Define AI agent personalities with name, role description, core responsibilities, and desired outputs. Animated add/remove. Pre-populated with Hive Collective example agents.", priority: "P0", category: "Onboarding & Workspace Setup", userStory: "US-10", epic: "EP-03", mvp: true, status: "Completed" },
  { id: "OWS-006", name: "Setup Review & Launch", description: "Step 5 of setup wizard (StepReview). Summary of all configuration sections before launch. 'Finish & Launch' button transitions to the dashboard and sets activeTab to 'content'.", priority: "P0", category: "Onboarding & Workspace Setup", userStory: "US-01", epic: "EP-01", mvp: true, status: "Completed" },
  { id: "OWS-007", name: "Multi-Workspace Support", description: "Home screen (Home component) with workspace tiles for Hive Collective and Booze Kills. Each tile shows branded header, quick-access links to Content/Calendar/Strategy/Performance tabs, and workspace metadata. 'New Workspace' tile triggers setup wizard.", priority: "P1", category: "Onboarding & Workspace Setup", userStory: "US-04", epic: "EP-06", mvp: false, status: "Completed" },
  { id: "OWS-008", name: "Audience Segment Targeting", description: "Demographic audience segments with description and age range. Defined in StepWorkspaceBasics and editable in WorkspaceSettings Content tab. Used for audience-to-pillar mapping throughout the app.", priority: "P1", category: "Onboarding & Workspace Setup", userStory: "US-03", epic: "EP-01", mvp: false, status: "Completed" },
  { id: "OWS-009", name: "Global Platform Rules", description: "Workspace-level platform defaults in WorkspaceSettings Platforms tab: default platform, max AI ideas per month, content warning toggle, AI disclaimer auto-include. UI complete; backend persistence pending.", priority: "P1", category: "Onboarding & Workspace Setup", userStory: "US-02", epic: "EP-08", mvp: false, status: "In Progress" },
  { id: "OWS-010", name: "Workspace Templates", description: "Pre-built workspace configurations for common use cases (e.g., 'B2B SaaS', 'Creator Economy', 'Agency Multi-Client') to accelerate onboarding.", priority: "P2", category: "Onboarding & Workspace Setup", userStory: "US-04", epic: "EP-06", mvp: false, status: "Not Started" },
  { id: "OWS-011", name: "Onboarding Progress Persistence", description: "Wizard progress persists to localStorage so users can leave and resume setup. UI shows 'Progress is automatically saved'. Cross-device sync and backend persistence not yet implemented.", priority: "P2", category: "Onboarding & Workspace Setup", userStory: "US-01", epic: "EP-01", mvp: false, status: "In Progress" },
  { id: "OWS-012", name: "Workspace Cloning", description: "Clone an existing workspace configuration to create a new workspace with identical pillars, agents, and platform settings as a starting point.", priority: "P2", category: "Onboarding & Workspace Setup", userStory: "US-04", epic: "EP-06", mvp: false, status: "Not Started" },

  // ── AI Research & Content Engine ──
  { id: "ARC-001", name: "Research-First Content Generation", description: "Enforced constraint: 'New Idea' button is disabled until ≥1 research source is selected from the Research Results drawer. Gate logic in StrategyResearch prevents idea creation without source context.", priority: "P0", category: "AI Research & Content Engine", userStory: "US-05", epic: "EP-02", mvp: true, status: "Completed" },
  { id: "ARC-002", name: "AI Research Runner", description: "One-click 'Run Research' in StrategyResearch triggers AI source scanning with loading spinner. Results appear in an expandable drawer below the research bar. Mock AI results seeded from wellness/Hive Collective data.", priority: "P0", category: "AI Research & Content Engine", userStory: "US-05", epic: "EP-02", mvp: true, status: "Completed" },
  { id: "ARC-003", name: "Research Source Cards", description: "Source cards in StrategyResearch showing: pillar badge, title, expandable summary, external URL link, selection checkbox, and bookmark toggle. Responsive 1–3 column grid with scrollable results area.", priority: "P0", category: "AI Research & Content Engine", userStory: "US-05", epic: "EP-02", mvp: true, status: "Completed" },
  { id: "ARC-004", name: "Source-to-Idea Conversion", description: "Selected research sources converted to content ideas via 'Create Ideas' action. Auto-populates title, pillar, description (from summary), source URL, and sets stage to 'Idea'. Batch creation supported with toast feedback.", priority: "P0", category: "AI Research & Content Engine", userStory: "US-06", epic: "EP-03", mvp: true, status: "Completed" },
  { id: "ARC-005", name: "Research Library", description: "Persistent Library tab in StrategyResearch for saved/bookmarked sources. Sources saved when bookmarked or used to create ideas. Manual deletion with toast undo. Persists to localStorage.", priority: "P1", category: "AI Research & Content Engine", userStory: "US-06", epic: "EP-02", mvp: false, status: "Completed" },
  { id: "ARC-006", name: "Research Pillar Filtering", description: "Pillar dropdown filter in StrategyResearch filters displayed research results to a specific content pillar. 'All Pillars' option resets filter. Works on both AI results and library.", priority: "P1", category: "AI Research & Content Engine", userStory: "US-05", epic: "EP-02", mvp: false, status: "Completed" },
  { id: "ARC-007", name: "Manual Source Addition", description: "Add custom research sources to the library via dialog form: title (required), URL, summary text, and pillar assignment. Validates that title and at least one of URL or summary are provided.", priority: "P1", category: "AI Research & Content Engine", userStory: "US-06", epic: "EP-03", mvp: false, status: "Completed" },
  { id: "ARC-008", name: "AI Script Generation", description: "Generate short-form video scripts from content ideas in ContentProduction Draft tab. Output includes hook, narrative body, and CTA. Simulated AI generation with loading state; generated content stored with timestamp.", priority: "P1", category: "AI Research & Content Engine", userStory: "US-06", epic: "EP-03", mvp: false, status: "Completed" },
  { id: "ARC-009", name: "AI Asset Generation Pipeline", description: "Assets tab in ContentProduction manages required asset checklist (video clips, thumbnails, graphics) with completion tracking. AI generation simulation for thumbnails and clips. Full real-AI pipeline and file upload integration pending.", priority: "P2", category: "AI Research & Content Engine", userStory: "US-06", epic: "EP-03", mvp: false, status: "In Progress" },
  { id: "ARC-010", name: "Research Source Scoring & Ranking", description: "AI-powered relevance scoring for discovered sources based on workspace pillars, audience alignment, and recency. Auto-sort by relevance score.", priority: "P2", category: "AI Research & Content Engine", userStory: "US-05", epic: "EP-02", mvp: false, status: "Not Started" },
  { id: "ARC-011", name: "RSS Feed Integration", description: "Connect RSS feeds as persistent research sources. Agents automatically scan feeds on schedule and surface new articles matching content pillars.", priority: "P2", category: "AI Research & Content Engine", userStory: "US-05", epic: "EP-02", mvp: false, status: "Not Started" },
  { id: "ARC-012", name: "Research Source Deduplication", description: "Detect and flag or auto-merge duplicate research sources across manual additions and AI-discovered results to keep the library clean.", priority: "P2", category: "AI Research & Content Engine", userStory: "US-05", epic: "EP-02", mvp: false, status: "Not Started" },

  // ── Workflow & Management ──
  { id: "WFM-001", name: "Content Pipeline (Kanban Board)", description: "5-column visual kanban in ContentPipeline: Idea → In Production → Ready to Publish → Scheduled → Published. Cards show platform icon, content type badge, pillar badge, title, and quick-open button. Multi-select filter by platform and content type. Column event counts in badges.", priority: "P0", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: true, status: "Completed" },
  { id: "WFM-002", name: "Content Status System", description: "Unified status model across all app surfaces: Draft (gray), In Progress (blue), Review (purple), Scheduled (pink), Published (green). STATUS_CONFIG drives color-coded badges, pipeline column assignments, calendar event pills, and filter chips everywhere.", priority: "P0", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: true, status: "Completed" },
  { id: "WFM-003", name: "Content Ideas Views (Table / Kanban / Grid)", description: "PipelineView component inside ContentIdeas offers three switchable layouts: Kanban (column cards), Table (sortable rows with Title, Pillar, Platform, Status, Type, Date), and Grid (card tiles). Full-text search plus filter dropdowns for Status, Pillar, Platform, Stage, and Content Type.", priority: "P0", category: "Workflow & Management", userStory: "US-08", epic: "EP-04", mvp: true, status: "Completed" },
  { id: "WFM-004", name: "Content Detail View", description: "ContentDetail component showing full idea metadata: hook, description, source URL link, target platforms (icons), content type, pillar, owner, scheduled date, and generated assets list. 'Open Production' action routes to ContentProduction with the correct starting tab.", priority: "P1", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: false, status: "Completed" },
  { id: "WFM-005", name: "6-Tab Content Production Pipeline", description: "ContentProduction component with tabs: Brief (objective, target audience, key messages, hooks), Draft (AI script generation, rich text editor), Blueprint (shot list, b-roll notes, storyboard), Assets (required asset checklist with completion tracking and progress bar), Packaging (thumbnail config, title, description, tags, CTA, platform metadata), QA (approval checklist, reviewer sign-off, final notes). Each tab has save actions with toast feedback. Activity slide-over drawer accessible from all tabs.", priority: "P1", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: false, status: "Completed" },
  { id: "WFM-006", name: "Content Calendar — Full Planning Surface", description: "ContentCalendar component with Month, Week, Day, and List views. Features: EventPill (publish/milestone) and PhaseWindowBar (production/review spanning bars) with severity badges (overdue/at-risk/blocked). Upcoming panel (14-day lookahead with 4-priority bucket ordering). AI Insights sidebar card. Compact Popover filter with multi-select chips for Platform, Status, Event Types, and Saved Views. Active filter chip strip. Date navigation per view. Quick-add on empty day click.", priority: "P1", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Completed" },
  { id: "WFM-007", name: "Pipeline Analytics Dashboard", description: "ContentPipeline header area shows content counts by status, platform breakdown, and content type distribution. Filters for platform (multi-select) and content type (multi-select) update all counts and card lists in real time.", priority: "P1", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Completed" },
  { id: "WFM-008", name: "Content Search & Sort", description: "Full-text search across idea titles, pillars, and descriptions. Sort by Created Date, Title, Status, or Platform with ascending/descending toggle. Filters for Status (multi), Pillar (multi), Platform (multi), Stage, and Content Type in PipelineView and ContentIdeas header.", priority: "P1", category: "Workflow & Management", userStory: "US-08", epic: "EP-04", mvp: false, status: "Completed" },
  { id: "WFM-009", name: "Drag-and-Drop Pipeline Cards", description: "Drag content cards between kanban columns to update status in ContentPipeline. Visual grab/grabbing cursor feedback. react-dnd integration planned but not yet implemented.", priority: "P2", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: false, status: "Not Started" },
  { id: "WFM-010", name: "Content Scheduling Engine", description: "Publish events scheduled via Quick Edit modal on the Calendar. Date/time picker validates against past-date scheduling. Phase window start/end date editing with end-before-start validation. Review window warns when end exceeds publish date. Workspace deadline auto-apply toggle for milestone generation.", priority: "P2", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Completed" },
  { id: "WFM-011", name: "Bulk Actions on Content", description: "Multi-select content ideas for batch operations: bulk status change, bulk delete, bulk platform assignment, and bulk pillar re-categorization.", priority: "P2", category: "Workflow & Management", userStory: "US-08", epic: "EP-04", mvp: false, status: "Not Started" },
  { id: "WFM-012", name: "Pipeline Board Reset", description: "One-click 'Reset Pipeline' action to clear all content cards from the kanban board for testing or fresh-start scenarios.", priority: "P2", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: false, status: "Not Started" },
  { id: "WFM-013", name: "Calendar AI Insights Panel", description: "Collapsible AI Insights card at the top of the Calendar sidebar. Dynamically computes up to 8 insight types from live event data: overdue milestones (error), blocked items with QA failures (error), at-risk publishes missing assets (warning), content gaps in next 7 days (warning), overloaded publish days 3+ same day (info), items in production without a publish date (info), platform diversity gaps — unused platforms in 30-day window (tip), review windows extending past publish date (tip). Header color shifts red/amber/violet based on severity. Insight count badge and expand/collapse toggle.", priority: "P1", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Completed" },
  { id: "WFM-014", name: "Calendar Multi-select Filter Popover", description: "Filters button opens a Radix Popover (w-80) with: Search input, Event Types (toggle chips: Phases/Milestones/Published, default all-on), Platform (multi-select chips with icons — empty = all), Status (multi-select chips with status colors — empty = all), Saved View dropdown (7 presets), Clear all + Done footer. Active filter count badge turns button red. Applied filters shown as removable chip strip below toolbar with per-chip ✕ and 'Clear all' text link.", priority: "P1", category: "Workflow & Management", userStory: "US-08", epic: "EP-05", mvp: false, status: "Completed" },
  { id: "WFM-015", name: "Calendar Event Quick Peek Cards", description: "Radix Popover hover card on EventPill and PhaseWindowBar (Month/Week views only; Day/List/Upcoming use Quick Edit directly). 300ms mouseenter delay, 200ms mouseleave grace. Card shows: clickable title, status/platform/type/milestone/phase chips, event summary line, active phase banner, severity banner with contextual message, up to 2 blocker snippets, owner + production step, Edit Dates/Open Item primary actions, Copy Link/Pipeline ghost actions, and routing hint.", priority: "P1", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Completed" },
  { id: "WFM-016", name: "Calendar Phase Windows & Milestone Events", description: "Phase windows render as multi-day spanning bars: Production (blue-200 fill, blue-500 left border, Wrench icon) and Review (purple-200 fill, purple-500 left border, ClipboardCheck icon). Active phase shows ring. Auto-generated from scheduled dates (production = publish−7d to −3d, review = −2d to −1d). Milestone pills (Brief/Draft/Assets/QA Due etc.) render as dashed-border Flag pills. Severity derived from deadline proximity, asset completion, and QA approval state.", priority: "P1", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Completed" },
  { id: "WFM-017", name: "Calendar Cross-tab Deep-link Navigation", description: "Event routing maps calendar events to the correct ContentProduction tab: milestone events use MILESTONE_TAB_MAP, phase windows use PHASE_TAB_MAP, blocked severity always routes to QA, publish events use STATUS_TAB_MAP. Double-click or 'Open Item' sets calendarOpenItem in App.tsx, switches activeTab to 'content', and ContentIdeas opens with selectedItemId + activeStep pre-set.", priority: "P1", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: false, status: "Completed" },
  { id: "WFM-018", name: "Calendar Right-click Context Menus", description: "Right-click on any EventPill or PhaseWindowBar opens a Radix ContextMenu via EventContextWrapper. Items: Open Item, Edit Dates, separator, Copy Link (writes deep-link URL to clipboard with toast), View Activity, separator, View in Pipeline. Applies to all event types across all calendar views.", priority: "P2", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Completed" },
  { id: "WFM-019", name: "Calendar Drag-and-drop Rescheduling", description: "Drag EventPills to new dates on the calendar grid to reschedule publish/milestone events. Resize handles on PhaseWindowBar ends to extend or shrink phase windows. Drop validation: no past-date publish, end > start for phases, warning when review window extends past publish. Not yet implemented.", priority: "P2", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Not Started" },
  { id: "WFM-020", name: "Content Studio Overview Dashboard", description: "ContentStudioOverview landing page for the Content tab: workspace health metrics (content by status with color-coded counts), recent activity feed, active production items list, platform distribution, pillar coverage, and quick-action buttons (New Idea, Run Research, View Calendar). Navigates to sub-sections via ContentIdeas state callbacks.", priority: "P1", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: false, status: "Completed" },
  { id: "WFM-021", name: "Content Production Activity Drawer", description: "Persistent slide-over Activity drawer accessible from all ContentProduction tabs via an Activity button in the tab header. Shows chronological event log: status transitions, file uploads, comments, QA approvals, AI generation events. Each entry has timestamp, actor, event type icon, and description. Slides in from the right without obscuring tab content.", priority: "P1", category: "Workflow & Management", userStory: "US-07", epic: "EP-04", mvp: false, status: "Completed" },
  { id: "WFM-022", name: "Performance Tracking Dashboard", description: "PerformanceTracking component (PerformanceTab) showing: KPI summary cards (views, engagement rate, reach, conversions), platform breakdown charts, top-performing content ranked list, pillar performance comparison, trend lines over time, and audience growth metrics. Fed from live content items and pillar config via localStorage.", priority: "P1", category: "Workflow & Management", userStory: "US-09", epic: "EP-05", mvp: false, status: "Completed" },

  // ── Identity & Personalization ──
  { id: "IDP-001", name: "Workspace Settings Dashboard", description: "WorkspaceSettings component with 7 tabs: General (name, brand voice, branding), Platforms (per-platform accordion with full specs), Content (pillars + audience segments CRUD), Agents (AI agent team editor), Team (member management), Notifications (channel + trigger toggles), Security (2FA, sessions, API keys). Active tab highlighted with #d94e33 accent.", priority: "P0", category: "Identity & Personalization", userStory: "US-13", epic: "EP-06", mvp: true, status: "Completed" },
  { id: "IDP-002", name: "User Profile Management", description: "ProfileSettings page: Display Name, Email, avatar, Current Workspace Role (Admin shield badge), Workspace Access count, linked accounts section, and danger zone. Password change sub-section with current/new/confirm fields and 8-char minimum validation inline.", priority: "P0", category: "Identity & Personalization", userStory: "US-12", epic: "EP-07", mvp: true, status: "Completed" },
  { id: "IDP-003", name: "Brand Voice Configuration", description: "Brand voice textarea in WorkspaceSettings General tab. Defines tone/style for AI content generation. Saved to localStorage and referenced during AI generation prompts. Editable at any time post-setup.", priority: "P1", category: "Identity & Personalization", userStory: "US-03", epic: "EP-06", mvp: false, status: "Completed" },
  { id: "IDP-004", name: "Agent Bio & Behavior Editor", description: "WorkspaceSettings Agents tab: inline edit toggle per agent (name, role, bio, responsibilities, desired outputs), archive action, add new agent form, and remove agent with confirmation. Animated list transitions for add/remove.", priority: "P1", category: "Identity & Personalization", userStory: "US-10", epic: "EP-03", mvp: false, status: "Completed" },
  { id: "IDP-005", name: "Team Management", description: "WorkspaceSettings Team tab: current members list with name, role badge, email, and 'me' indicator. Invite new member via email input + role select. Remove member with confirmation. Role options: Admin, Editor, Viewer.", priority: "P1", category: "Identity & Personalization", userStory: "US-11", epic: "EP-07", mvp: false, status: "Completed" },
  { id: "IDP-006", name: "Platform-Specific AI Styling", description: "WorkspaceSettings Platforms tab has an accordion per active platform. Each section includes video specs, posting schedule, peak time config, AI content style dropdown, and design prompt suffix input for per-platform AI customization.", priority: "P1", category: "Identity & Personalization", userStory: "US-02", epic: "EP-08", mvp: false, status: "Completed" },
  { id: "IDP-007", name: "Content Pillar Management (Settings)", description: "WorkspaceSettings Content tab + PillarsSegments component: full CRUD for content pillars (name, description, themes, audience segment mapping, platform distribution) and audience segments. Changes sync to StrategyResearch pillar filter and ContentIdeas pillar selectors.", priority: "P1", category: "Identity & Personalization", userStory: "US-03", epic: "EP-06", mvp: false, status: "Completed" },
  { id: "IDP-008", name: "Password Management", description: "Password change section in ProfileSettings: current password, new password (min 8 chars with strength indicator), confirm password with match validation. Lock icon field decoration and inline error messages.", priority: "P2", category: "Identity & Personalization", userStory: "US-12", epic: "EP-07", mvp: false, status: "Completed" },
  { id: "IDP-009", name: "Notification Preferences", description: "WorkspaceSettings Notifications tab: toggle switches for email, in-app, and Slack channels. Trigger toggles for new research results, content published, team mentions, QA review required, and approaching deadlines. Per-workspace rules saved to localStorage.", priority: "P2", category: "Identity & Personalization", userStory: "US-12", epic: "EP-07", mvp: false, status: "Completed" },
  { id: "IDP-010", name: "Security Settings", description: "WorkspaceSettings Security tab: 2FA toggle (UI only), active sessions table (device/browser/location/last-active/revoke), API key display with copy, and login history. Real 2FA enrollment flow and backend session management not yet implemented.", priority: "P2", category: "Identity & Personalization", userStory: "US-12", epic: "EP-07", mvp: false, status: "In Progress" },
  { id: "IDP-011", name: "Role-Based Access Control", description: "Granular permission enforcement based on user role. Admins: full access. Editors: content management only. Viewers: read-only. Role assignment UI exists in Team tab but enforcement logic (route guards, action gating) not yet implemented.", priority: "P2", category: "Identity & Personalization", userStory: "US-11", epic: "EP-07", mvp: false, status: "Not Started" },
  { id: "IDP-012", name: "Workspace Branding & Theming", description: "WorkspaceSettings General tab has brand color input and logo placeholder. Brand color (#d94e33) applied globally to header, nav active states, and buttons. Custom logo upload and live theme switching across all surfaces not yet implemented.", priority: "P2", category: "Identity & Personalization", userStory: "US-13", epic: "EP-06", mvp: false, status: "In Progress" },
];

// Apply saved overrides on load
function getInitialFeatures(): Feature[] {
  const pOverrides = loadOverrides<Priority>(STORAGE_KEY_PRIORITY);
  const mOverrides = loadOverrides<boolean>(STORAGE_KEY_MVP);
  const sOverrides = loadOverrides<Status>(STORAGE_KEY_STATUS);
  if (Object.keys(pOverrides).length === 0 && Object.keys(mOverrides).length === 0 && Object.keys(sOverrides).length === 0) return INITIAL_FEATURES;
  return INITIAL_FEATURES.map((f) => ({
    ...f,
    priority: pOverrides[f.id] ?? f.priority,
    mvp: mOverrides[f.id] ?? f.mvp,
    status: sOverrides[f.id] ?? f.status,
  }));
}

// ═══════════════════════════════════════
// Component
// ═══════════════════════════════════════
type ViewMode = "grouped" | "epic" | "table";
type FilterCategory = "All" | Category;
type FilterPriority = "All" | Priority;
type FilterUserStory = "All" | UserStoryId;
type FilterEpic = "All" | EpicId;
type FilterMvp = "All" | "MVP" | "Post-MVP";
type FilterStatus = "All" | Status;

const VIEW_MODES: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: "grouped", label: "Category", icon: <LayoutGrid className="size-3.5" /> },
  { mode: "epic", label: "Epic", icon: <Target className="size-3.5" /> },
  { mode: "table", label: "Table", icon: <List className="size-3.5" /> },
];

export function FeatureList() {
  const savedView = useRef(loadViewState());
  const sv = savedView.current;

  const [features, setFeatures] = useState<Feature[]>(getInitialFeatures);
  const [searchQuery, setSearchQuery] = useState(sv?.searchQuery ?? "");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>((sv?.filterCategory as FilterCategory) ?? "All");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>((sv?.filterPriority as FilterPriority) ?? "All");
  const [filterUserStory, setFilterUserStory] = useState<FilterUserStory>((sv?.filterUserStory as FilterUserStory) ?? "All");
  const [filterEpic, setFilterEpic] = useState<FilterEpic>((sv?.filterEpic as FilterEpic) ?? "All");
  const [filterMvp, setFilterMvp] = useState<FilterMvp>((sv?.filterMvp as FilterMvp) ?? "All");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>((sv?.filterStatus as FilterStatus) ?? "All");
  const [viewMode, setViewMode] = useState<ViewMode>((sv?.viewMode as ViewMode) ?? "grouped");
  const [sortField, setSortField] = useState<SortField>((sv?.sortField as SortField) ?? "id");
  const [sortDirection, setSortDirection] = useState<SortDirection>((sv?.sortDirection as SortDirection) ?? "asc");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    sv?.expandedCategories ? new Set(sv.expandedCategories) : new Set(CATEGORIES.map((c) => c.id))
  );
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(
    sv?.expandedEpics ? new Set(sv.expandedEpics) : new Set(EPICS.map((e) => e.id))
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    sv?.expandedDescriptions ? new Set(sv.expandedDescriptions) : new Set()
  );

  // Persist view state to localStorage on every change
  useEffect(() => {
    saveViewState({
      searchQuery,
      filterCategory,
      filterPriority,
      filterUserStory,
      filterEpic,
      filterMvp,
      filterStatus,
      viewMode,
      sortField,
      sortDirection,
      expandedCategories: Array.from(expandedCategories),
      expandedEpics: Array.from(expandedEpics),
      expandedDescriptions: Array.from(expandedDescriptions),
    });
  }, [searchQuery, filterCategory, filterPriority, filterUserStory, filterEpic, filterMvp, filterStatus, viewMode, sortField, sortDirection, expandedCategories, expandedEpics, expandedDescriptions]);

  // Persist priority changes
  const handleChangePriority = useCallback((featureId: string, newPriority: Priority) => {
    setFeatures((prev) => {
      const updated = prev.map((f) => (f.id === featureId ? { ...f, priority: newPriority } : f));
      const overrides: Record<string, Priority> = {};
      updated.forEach((f) => {
        const original = INITIAL_FEATURES.find((o) => o.id === f.id);
        if (original && f.priority !== original.priority) overrides[f.id] = f.priority;
      });
      saveOverrides(STORAGE_KEY_PRIORITY, overrides);
      return updated;
    });
    toast.success(`${featureId} updated to ${newPriority}`, {
      description: `${PRIORITY_CONFIG[newPriority].label} — saved`,
    });
  }, []);

  // Persist MVP toggle
  const handleToggleMvp = useCallback((featureId: string) => {
    setFeatures((prev) => {
      const updated = prev.map((f) => (f.id === featureId ? { ...f, mvp: !f.mvp } : f));
      const overrides: Record<string, boolean> = {};
      updated.forEach((f) => {
        const original = INITIAL_FEATURES.find((o) => o.id === f.id);
        if (original && f.mvp !== original.mvp) overrides[f.id] = f.mvp;
      });
      saveOverrides(STORAGE_KEY_MVP, overrides);
      const toggled = updated.find((f) => f.id === featureId)!;
      toast.success(
        `${featureId} ${toggled.mvp ? "added to" : "removed from"} MVP`,
        { description: toggled.name }
      );
      return updated;
    });
  }, []);

  // Persist status changes
  const handleChangeStatus = useCallback((featureId: string, newStatus: Status) => {
    setFeatures((prev) => {
      const updated = prev.map((f) => (f.id === featureId ? { ...f, status: newStatus } : f));
      const overrides: Record<string, Status> = {};
      updated.forEach((f) => {
        const original = INITIAL_FEATURES.find((o) => o.id === f.id);
        if (original && f.status !== original.status) overrides[f.id] = f.status;
      });
      saveOverrides(STORAGE_KEY_STATUS, overrides);
      return updated;
    });
    toast.success(`${featureId} status updated`, {
      description: `${STATUS_CONFIG[newStatus].label}`,
    });
  }, []);

  const toggleDescription = useCallback((id: string) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredFeatures = useMemo(() => {
    const filtered = features.filter((f) => {
      if (filterCategory !== "All" && f.category !== filterCategory) return false;
      if (filterPriority !== "All" && f.priority !== filterPriority) return false;
      if (filterUserStory !== "All" && f.userStory !== filterUserStory) return false;
      if (filterEpic !== "All" && f.epic !== filterEpic) return false;
      if (filterMvp === "MVP" && !f.mvp) return false;
      if (filterMvp === "Post-MVP" && f.mvp) return false;
      if (filterStatus !== "All" && f.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const story = getUserStory(f.userStory);
        const epic = getEpic(f.epic);
        return (
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          story.title.toLowerCase().includes(q) ||
          story.persona.toLowerCase().includes(q) ||
          epic.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return sortFeatures(filtered, sortField, sortDirection);
  }, [features, filterCategory, filterPriority, filterUserStory, filterEpic, filterMvp, filterStatus, searchQuery, sortField, sortDirection]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<Category, Feature[]> = {
      "Onboarding & Workspace Setup": [],
      "AI Research & Content Engine": [],
      "Workflow & Management": [],
      "Identity & Personalization": [],
    };
    filteredFeatures.forEach((f) => groups[f.category].push(f));
    return groups;
  }, [filteredFeatures]);

  const groupedByEpic = useMemo(() => {
    const groups: Record<string, Feature[]> = {};
    EPICS.forEach((e) => (groups[e.id] = []));
    filteredFeatures.forEach((f) => {
      if (groups[f.epic]) groups[f.epic].push(f);
    });
    return groups;
  }, [filteredFeatures]);

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const toggleEpic = (epicId: string) => {
    const next = new Set(expandedEpics);
    if (next.has(epicId)) next.delete(epicId);
    else next.add(epicId);
    setExpandedEpics(next);
  };

  const stats = useMemo(() => {
    const total = features.length;
    const p0 = features.filter((f) => f.priority === "P0").length;
    const p1 = features.filter((f) => f.priority === "P1").length;
    const p2 = features.filter((f) => f.priority === "P2").length;
    const mvpCount = features.filter((f) => f.mvp).length;
    const epicCount = new Set(features.map((f) => f.epic)).size;
    const storyCount = new Set(features.map((f) => f.userStory)).size;
    return { total, p0, p1, p2, mvpCount, epicCount, storyCount };
  }, [features]);

  const activeStoryCount = useMemo(() => new Set(filteredFeatures.map((f) => f.userStory)).size, [filteredFeatures]);
  const activeEpicCount = useMemo(() => new Set(filteredFeatures.map((f) => f.epic)).size, [filteredFeatures]);

  const copyToClipboard = (text: string): boolean => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  const handleCopyAll = () => {
    const lines = filteredFeatures.map((f) => {
      const story = getUserStory(f.userStory);
      const epic = getEpic(f.epic);
      return `${f.id}\t${f.name}\t${f.description}\t${f.priority}\t${f.status}\t${f.mvp ? "MVP" : ""}\t${f.category}\t${f.epic}\t${epic.title}\t${f.userStory}\t${story.title}\t${story.persona}`;
    });
    const header = "ID\tFeature Name\tDescription\tPriority\tStatus\tMVP\tCategory\tEpic ID\tEpic\tStory ID\tUser Story\tPersona";
    const text = [header, ...lines].join("\n");
    if (copyToClipboard(text)) {
      toast.success(`${filteredFeatures.length} features copied to clipboard`, {
        description: "Tab-delimited format — paste into PowerPoint or Excel",
      });
    } else {
      toast.error("Copy failed — try selecting and copying manually");
    }
  };

  const handleCopyRow = (f: Feature) => {
    const story = getUserStory(f.userStory);
    const epic = getEpic(f.epic);
    const text = `${f.id}\t${f.name}\t${f.description}\t${f.priority}\t${f.status}\t${f.mvp ? "MVP" : ""}\t${f.category}\t${f.epic}\t${epic.title}\t${f.userStory}\t${story.title}\t${story.persona}`;
    if (copyToClipboard(text)) {
      setCopiedId(f.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getCategoryMeta = (cat: Category) => CATEGORIES.find((c) => c.id === cat)!;

  const hasActiveFilters =
    filterCategory !== "All" ||
    filterPriority !== "All" ||
    filterUserStory !== "All" ||
    filterEpic !== "All" ||
    filterMvp !== "All" ||
    filterStatus !== "All" ||
    searchQuery;

  const clearAllFilters = () => {
    setFilterCategory("All");
    setFilterPriority("All");
    setFilterUserStory("All");
    setFilterEpic("All");
    setFilterMvp("All");
    setFilterStatus("All");
    setSearchQuery("");
  };

  const selectedStoryLabel = useMemo(() => {
    if (filterUserStory === "All") return "All Stories";
    const story = getUserStory(filterUserStory);
    return `${story.id}: ${story.title.length > 20 ? story.title.slice(0, 20) + "…" : story.title}`;
  }, [filterUserStory]);

  const selectedEpicLabel = useMemo(() => {
    if (filterEpic === "All") return "All Epics";
    const epic = getEpic(filterEpic);
    return `${epic.id}: ${epic.title}`;
  }, [filterEpic]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-3 text-muted-foreground/50" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="size-3 text-[#d94e33]" />
    ) : (
      <ArrowDown className="size-3 text-[#d94e33]" />
    );
  };

  const overrideCount = useMemo(() => {
    const pCount = Object.keys(loadOverrides<Priority>(STORAGE_KEY_PRIORITY)).length;
    const mCount = Object.keys(loadOverrides<boolean>(STORAGE_KEY_MVP)).length;
    const sCount = Object.keys(loadOverrides<Status>(STORAGE_KEY_STATUS)).length;
    return pCount + mCount + sCount;
  }, [features]);

  const resetAll = () => {
    saveOverrides(STORAGE_KEY_PRIORITY, {});
    saveOverrides(STORAGE_KEY_MVP, {});
    saveOverrides(STORAGE_KEY_STATUS, {});
    setFeatures(INITIAL_FEATURES);
    toast.success("All overrides reset to defaults");
  };

  // Shared feature row props
  const featureRowProps = {
    copiedId,
    onCopy: handleCopyRow,
    onChangePriority: handleChangePriority,
    onToggleMvp: handleToggleMvp,
    onChangeStatus: handleChangeStatus,
    expandedDescriptions,
    onToggleDesc: toggleDescription,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-6 text-[#d94e33]" />
            <h1 className="text-2xl font-bold">Feature Backlog</h1>
          </div>
          <p className="text-muted-foreground">
            {stats.total} features · {stats.mvpCount} MVP · {stats.epicCount} epics · {stats.storyCount} user stories
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {overrideCount > 0 && (
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={resetAll}>
              Reset ({overrideCount})
            </Button>
          )}
          {/* Segmented View Switcher */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {VIEW_MODES.map((v) => (
              <button
                key={v.mode}
                onClick={() => setViewMode(v.mode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all",
                  viewMode === v.mode
                    ? "bg-white shadow-sm text-[#d94e33] font-bold"
                    : "text-muted-foreground hover:text-gray-700"
                )}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>
          <Button size="sm" className="bg-[#d94e33] hover:bg-[#c4452d] gap-2" onClick={handleCopyAll}>
            <Copy className="size-4" /> Copy All ({filteredFeatures.length})
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900", bg: "bg-white" },
          { label: "MVP", value: stats.mvpCount, color: "text-[#d94e33]", bg: "bg-[#d94e33]/5" },
          { label: "P0 Critical", value: stats.p0, color: "text-red-600", bg: "bg-red-50" },
          { label: "P1 Important", value: stats.p1, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "P2 Nice-to-Have", value: stats.p2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Epics", value: stats.epicCount, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "User Stories", value: stats.storyCount, color: "text-teal-600", bg: "bg-teal-50" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border p-3 text-center transition-all", s.bg)}>
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Sort */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search features, stories, epics..."
                className="pl-9 h-10 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* MVP Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-10 gap-2 border-gray-200", filterMvp !== "All" && "border-[#d94e33]/50 bg-[#d94e33]/5 text-[#d94e33]")}>
                    <Zap className="size-4" />
                    {filterMvp === "All" ? "All Scope" : filterMvp}
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setFilterMvp("All")}>
                    All Features
                    {filterMvp === "All" && <Check className="ml-auto size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterMvp("MVP")}>
                    <Zap className="size-3 mr-2 text-[#d94e33]" />
                    MVP Only
                    <span className="ml-auto text-[10px] text-muted-foreground mr-2">{stats.mvpCount}</span>
                    {filterMvp === "MVP" && <Check className="size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMvp("Post-MVP")}>
                    Post-MVP
                    <span className="ml-auto text-[10px] text-muted-foreground mr-2">{stats.total - stats.mvpCount}</span>
                    {filterMvp === "Post-MVP" && <Check className="size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Epic Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-10 gap-2 border-gray-200", filterEpic !== "All" && "border-purple-400/60 bg-purple-50 text-purple-700")}>
                    <Target className="size-4" />
                    {selectedEpicLabel}
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 max-h-[420px] overflow-y-auto">
                  <DropdownMenuItem onClick={() => setFilterEpic("All")}>
                    <div className="flex-1">All Epics</div>
                    {filterEpic === "All" && <Check className="ml-auto size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {EPICS.map((epic) => {
                    const count = features.filter((f) => f.epic === epic.id).length;
                    return (
                      <DropdownMenuItem key={epic.id} onClick={() => setFilterEpic(epic.id)} className="flex items-center gap-2 py-2">
                        <Badge variant="outline" className={cn("text-[9px] font-bold shrink-0", epic.bg, epic.color)}>{epic.id}</Badge>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium">{epic.title}</div>
                          <div className="text-[10px] text-muted-foreground">{count} features</div>
                        </div>
                        {filterEpic === epic.id && <Check className="size-3 text-[#d94e33] shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Story Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-10 gap-2 border-gray-200", filterUserStory !== "All" && "border-[#d94e33]/40 bg-[#d94e33]/5 text-[#d94e33]")}>
                    <BookOpen className="size-4" />
                    {selectedStoryLabel}
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 max-h-[420px] overflow-y-auto">
                  <DropdownMenuItem onClick={() => setFilterUserStory("All")}>
                    <div className="flex-1">All User Stories</div>
                    {filterUserStory === "All" && <Check className="ml-auto size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {USER_STORIES.map((story) => {
                    const count = features.filter((f) => f.userStory === story.id).length;
                    return (
                      <DropdownMenuItem key={story.id} onClick={() => setFilterUserStory(story.id)} className="flex items-start gap-2 py-2">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{story.id}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">As a {story.persona}, I want to {story.title.toLowerCase()}</div>
                          <div className="text-[10px] text-muted-foreground">{count} features</div>
                        </div>
                        {filterUserStory === story.id && <Check className="size-3 text-[#d94e33] shrink-0 mt-0.5" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Category Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 border-gray-200">
                    <Layers className="size-4" />
                    {filterCategory === "All" ? "All Categories" : filterCategory.split("&")[0].trim()}
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={() => setFilterCategory("All")}>
                    All Categories
                    {filterCategory === "All" && <Check className="ml-auto size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {CATEGORIES.map((c) => (
                    <DropdownMenuItem key={c.id} onClick={() => setFilterCategory(c.id)}>
                      <span className={cn("mr-2", c.color)}>{c.icon}</span>
                      {c.label}
                      {filterCategory === c.id && <Check className="ml-auto size-3 text-[#d94e33]" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-2 border-gray-200">
                    <AlertTriangle className="size-4" />
                    {filterPriority === "All" ? "All Priorities" : filterPriority}
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterPriority("All")}>
                    All Priorities
                    {filterPriority === "All" && <Check className="ml-auto size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(["P0", "P1", "P2"] as Priority[]).map((p) => (
                    <DropdownMenuItem key={p} onClick={() => setFilterPriority(p)}>
                      <span className={cn("mr-2", PRIORITY_CONFIG[p].color)}>{PRIORITY_CONFIG[p].icon}</span>
                      {PRIORITY_CONFIG[p].label}
                      {filterPriority === p && <Check className="ml-auto size-3 text-[#d94e33]" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-10 gap-2 border-gray-200", filterStatus !== "All" && "border-green-400/60 bg-green-50 text-green-700")}>
                    <PlayCircle className="size-4" />
                    {filterStatus === "All" ? "All Statuses" : filterStatus}
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setFilterStatus("All")}>
                    All Statuses
                    {filterStatus === "All" && <Check className="ml-auto size-3 text-[#d94e33]" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(["Not Started", "In Progress", "Completed", "Blocked", "On Hold"] as Status[]).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => setFilterStatus(s)}>
                      <span className={cn("mr-2", STATUS_CONFIG[s].color)}>{STATUS_CONFIG[s].icon}</span>
                      {STATUS_CONFIG[s].label}
                      {filterStatus === s && <Check className="ml-auto size-3 text-[#d94e33]" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.field}
                onClick={() => handleSort(opt.field)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                  sortField === opt.field
                    ? "bg-[#d94e33]/10 text-[#d94e33] font-bold"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                {opt.label}
                <SortIcon field={opt.field} />
              </button>
            ))}
          </div>

          {/* Active Banners */}
          {filterMvp !== "All" && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-[#d94e33]/5 border border-[#d94e33]/15 rounded-lg">
              <Zap className="size-4 text-[#d94e33] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  {filterMvp === "MVP" ? "MVP Scope" : "Post-MVP Scope"}: {filteredFeatures.length} feature{filteredFeatures.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {filterMvp === "MVP"
                    ? "Minimum features for the end-to-end core loop: Setup → Research → Generate Ideas → Track in Pipeline"
                    : "Features planned for post-launch iterations"}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-[#d94e33]" onClick={() => setFilterMvp("All")}>Clear</Button>
            </div>
          )}

          {filterEpic !== "All" && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-purple-50 border border-purple-200/60 rounded-lg">
              <Target className="size-4 text-purple-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">{getEpic(filterEpic).id}: {getEpic(filterEpic).title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {filteredFeatures.length} feature{filteredFeatures.length !== 1 ? "s" : ""} · {activeStoryCount} user {activeStoryCount === 1 ? "story" : "stories"}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-purple-700" onClick={() => setFilterEpic("All")}>Clear</Button>
            </div>
          )}

          {filterUserStory !== "All" && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-[#d94e33]/5 border border-[#d94e33]/15 rounded-lg">
              <BookOpen className="size-4 text-[#d94e33] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  {getUserStory(filterUserStory).id}: As a {getUserStory(filterUserStory).persona}, I want to {getUserStory(filterUserStory).title.toLowerCase()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{filteredFeatures.length} feature{filteredFeatures.length !== 1 ? "s" : ""}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-[#d94e33]" onClick={() => setFilterUserStory("All")}>Clear</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ GROUPED BY CATEGORY VIEW ═══ */}
      {viewMode === "grouped" && (
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const catFeatures = groupedByCategory[cat.id];
            const isExpanded = expandedCategories.has(cat.id);
            if (catFeatures.length === 0 && filterCategory !== "All") return null;
            return (
              <Card key={cat.id} className="border-none shadow-sm overflow-hidden">
                <button onClick={() => toggleCategory(cat.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg border", cat.bg)}>
                      <span className={cat.color}>{cat.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{cat.label}</h3>
                      <GroupMeta features={catFeatures} />
                    </div>
                  </div>
                  <ChevronRight className={cn("size-5 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-90")} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="border-t">
                        {catFeatures.length > 0 ? (
                          <div className="divide-y">
                            {catFeatures.map((feature) => (
                              <FeatureRow key={feature.id} feature={feature} {...featureRowProps} />
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-muted-foreground text-sm">No features match current filters</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ GROUPED BY EPIC VIEW ═══ */}
      {viewMode === "epic" && (
        <div className="space-y-4">
          {EPICS.map((epicDef) => {
            const epicFeatures = groupedByEpic[epicDef.id] || [];
            const isExpanded = expandedEpics.has(epicDef.id);
            if (epicFeatures.length === 0 && (filterEpic !== "All" || filterCategory !== "All" || filterMvp !== "All" || filterPriority !== "All" || filterUserStory !== "All" || searchQuery)) return null;
            const mvpCount = epicFeatures.filter((f) => f.mvp).length;
            const totalInEpic = features.filter((f) => f.epic === epicDef.id).length;
            const totalMvpInEpic = features.filter((f) => f.epic === epicDef.id && f.mvp).length;
            const mvpPercent = totalInEpic > 0 ? Math.round((totalMvpInEpic / totalInEpic) * 100) : 0;

            return (
              <Card key={epicDef.id} className="border-none shadow-sm overflow-hidden">
                <button onClick={() => toggleEpic(epicDef.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("p-2 rounded-lg border", epicDef.bg)}>
                      <Target className={cn("size-4", epicDef.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[9px] font-bold", epicDef.bg, epicDef.color)}>{epicDef.id}</Badge>
                        <h3 className="font-bold text-gray-900">{epicDef.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <GroupMeta features={epicFeatures} />
                      </div>
                      {/* MVP Progress Bar */}
                      <div className="flex items-center gap-2 mt-2 max-w-xs">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#d94e33] to-[#e07a3a] transition-all duration-500"
                            style={{ width: `${mvpPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#d94e33] shrink-0">
                          {totalMvpInEpic}/{totalInEpic} MVP
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">({mvpPercent}%)</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={cn("size-5 text-muted-foreground transition-transform duration-200 shrink-0 ml-2", isExpanded && "rotate-90")} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="border-t">
                        {epicFeatures.length > 0 ? (
                          <div className="divide-y">
                            {epicFeatures.map((feature) => (
                              <FeatureRow key={feature.id} feature={feature} {...featureRowProps} showCategory />
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-muted-foreground text-sm">No features in this epic match current filters</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ TABLE VIEW ═══ */}
      {viewMode === "table" && (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b">
                  <th className="px-4 py-3 text-left w-20">
                    <button onClick={() => handleSort("id")} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-gray-900 transition-colors">
                      ID <SortIcon field="id" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Feature</th>
                  <th className="px-4 py-3 text-left w-24">
                    <button onClick={() => handleSort("priority")} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-gray-900 transition-colors">
                      Priority <SortIcon field="priority" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left w-16">
                    <button onClick={() => handleSort("mvp")} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-gray-900 transition-colors">
                      Scope <SortIcon field="mvp" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left w-32">
                    <button onClick={() => handleSort("status")} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-gray-900 transition-colors">
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left w-44">
                    <button onClick={() => handleSort("epic")} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-gray-900 transition-colors">
                      Epic <SortIcon field="epic" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left w-44 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User Story</th>
                  <th className="px-4 py-3 text-left w-40">
                    <button onClick={() => handleSort("category")} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-gray-900 transition-colors">
                      Category <SortIcon field="category" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFeatures.map((feature) => {
                  const story = getUserStory(feature.userStory);
                  const epic = getEpic(feature.epic);
                  const descExpanded = expandedDescriptions.has(feature.id);
                  return (
                    <tr key={feature.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3 align-top">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded">
                          {feature.id}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-bold text-gray-900 text-sm">{feature.name}</div>
                        <div className="mt-0.5">
                          <p className={cn("text-xs text-muted-foreground", !descExpanded && "line-clamp-2")}>{feature.description}</p>
                          {feature.description.length > 120 && (
                            <button onClick={() => toggleDescription(feature.id)} className="text-[10px] text-[#d94e33] hover:underline font-medium mt-0.5">
                              {descExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <PriorityPicker priority={feature.priority} onChange={(p) => handleChangePriority(feature.id, p)} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <MvpToggle isMvp={feature.mvp} onToggle={() => handleToggleMvp(feature.id)} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusPicker status={feature.status} onChange={(s) => handleChangeStatus(feature.id, s)} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button onClick={() => setFilterEpic(epic.id)} className="text-left hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors">
                          <Badge variant="outline" className={cn("text-[9px] font-bold", epic.bg, epic.color)}>{epic.id}</Badge>
                          <div className="text-[10px] text-gray-600 mt-0.5">{epic.title}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button onClick={() => setFilterUserStory(story.id)} className="text-left hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors">
                          <span className="text-[9px] font-mono font-bold text-[#d94e33] bg-[#d94e33]/10 px-1 py-0.5 rounded">{story.id}</span>
                          <div className="text-[10px] text-gray-600 mt-0.5 truncate max-w-[160px]">{story.title}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className={getCategoryMeta(feature.category).color}>{getCategoryMeta(feature.category).icon}</span>
                          <span className="text-xs text-gray-700">{feature.category.split("&")[0].trim()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button onClick={() => handleCopyRow(feature)} className="p-1.5 rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedId === feature.id ? <CheckCheck className="size-3.5 text-green-600" /> : <Copy className="size-3.5 text-muted-foreground" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredFeatures.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No features match your filters. Try adjusting your search.</div>
          )}
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pb-4">
        Showing {filteredFeatures.length} of {features.length} features
        {" "}· {activeEpicCount} epic{activeEpicCount !== 1 ? "s" : ""}
        {" "}· {activeStoryCount} {activeStoryCount === 1 ? "story" : "stories"}
        {" "}· sorted by {SORT_OPTIONS.find((o) => o.field === sortField)?.label} ({sortDirection === "asc" ? "A→Z" : "Z→A"})
        {hasActiveFilters ? (
          <button onClick={clearAllFilters} className="ml-2 text-[#d94e33] hover:underline font-medium">Clear all filters</button>
        ) : null}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Group Meta Line (shared)
// ═══════════════════════════════════════
function GroupMeta({ features }: { features: Feature[] }) {
  return (
    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
      <span className="text-xs text-muted-foreground">{features.length} features</span>
      <span className="text-[10px] text-muted-foreground">·</span>
      <span className="text-[10px] text-[#d94e33] font-bold">{features.filter((f) => f.mvp).length} MVP</span>
      <span className="text-[10px] text-muted-foreground">·</span>
      <span className="text-[10px] text-red-600 font-medium">{features.filter((f) => f.priority === "P0").length} P0</span>
      <span className="text-[10px] text-amber-600 font-medium">{features.filter((f) => f.priority === "P1").length} P1</span>
      <span className="text-[10px] text-blue-600 font-medium">{features.filter((f) => f.priority === "P2").length} P2</span>
    </div>
  );
}

// ═══════════════════════════════════════
// MVP Toggle (interactive)
// ═══════════════════════════════════════
function MvpToggle({ isMvp, onToggle }: { isMvp: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase transition-all cursor-pointer",
        isMvp
          ? "bg-gradient-to-r from-[#d94e33] to-[#e07a3a] text-white hover:shadow-md hover:scale-105"
          : "border border-dashed border-gray-300 text-gray-400 hover:border-[#d94e33]/50 hover:text-[#d94e33] hover:bg-[#d94e33]/5"
      )}
      title={isMvp ? "Click to remove from MVP" : "Click to add to MVP"}
    >
      {isMvp ? <Zap className="size-2.5" /> : <ZapOff className="size-2.5" />}
      {isMvp ? "MVP" : "Add"}
    </button>
  );
}

// ═══════════════════════════════════════
// Priority Picker (inline edit)
// ═══════════════════════════════════════
function PriorityPicker({ priority, onChange }: { priority: Priority; onChange: (p: Priority) => void }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold transition-all hover:ring-2 hover:ring-offset-1 hover:ring-gray-200 cursor-pointer", config.bg, config.color)}>
          {config.icon}
          {priority}
          <ChevronDown className="size-2.5 ml-0.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {(["P0", "P1", "P2"] as Priority[]).map((p) => (
          <DropdownMenuItem key={p} onClick={() => onChange(p)} className="gap-2">
            <span className={cn("flex items-center gap-1", PRIORITY_CONFIG[p].color)}>{PRIORITY_CONFIG[p].icon}</span>
            <span className="text-xs">{PRIORITY_CONFIG[p].label}</span>
            {priority === p && <Check className="ml-auto size-3 text-[#d94e33]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ═══════════════════════════════════════
// Status Picker (inline edit)
// ═══════════════════════════════════════
function StatusPicker({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  const config = STATUS_CONFIG[status];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold transition-all hover:ring-2 hover:ring-offset-1 hover:ring-gray-200 cursor-pointer", config.bg, config.color)}>
          {config.icon}
          {status}
          <ChevronDown className="size-2.5 ml-0.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {(["Not Started", "In Progress", "Completed", "Blocked", "On Hold"] as Status[]).map((s) => (
          <DropdownMenuItem key={s} onClick={() => onChange(s)} className="gap-2">
            <span className={cn("flex items-center gap-1", STATUS_CONFIG[s].color)}>{STATUS_CONFIG[s].icon}</span>
            <span className="text-xs">{STATUS_CONFIG[s].label}</span>
            {status === s && <Check className="ml-auto size-3 text-[#d94e33]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ═══════════════════════════════════════
// Feature Row (Grouped & Epic Views)
// ═══════════════════════════════════════
function FeatureRow({
  feature,
  copiedId,
  onCopy,
  onChangePriority,
  onToggleMvp,
  onChangeStatus,
  expandedDescriptions,
  onToggleDesc,
  showCategory,
}: {
  feature: Feature;
  copiedId: string | null;
  onCopy: (f: Feature) => void;
  onChangePriority: (id: string, p: Priority) => void;
  onToggleMvp: (id: string) => void;
  onChangeStatus: (id: string, s: Status) => void;
  expandedDescriptions: Set<string>;
  onToggleDesc: (id: string) => void;
  showCategory?: boolean;
}) {
  const story = getUserStory(feature.userStory);
  const epic = getEpic(feature.epic);
  const isDescExpanded = expandedDescriptions.has(feature.id);

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-gray-50/30 transition-colors group">
      {/* Priority + MVP + Status */}
      <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
        <PriorityPicker priority={feature.priority} onChange={(p) => onChangePriority(feature.id, p)} />
        <MvpToggle isMvp={feature.mvp} onToggle={() => onToggleMvp(feature.id)} />
        <StatusPicker status={feature.status} onChange={(s) => onChangeStatus(feature.id, s)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[10px] font-mono font-bold text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{feature.id}</span>
          <h4 className="font-bold text-gray-900 text-sm truncate">{feature.name}</h4>
        </div>
        <div>
          <p className={cn("text-xs text-muted-foreground leading-relaxed", !isDescExpanded && "line-clamp-2")}>{feature.description}</p>
          {feature.description.length > 120 && (
            <button onClick={() => onToggleDesc(feature.id)} className="text-[10px] text-[#d94e33] hover:underline font-medium mt-0.5">
              {isDescExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {/* Show category badge in Epic view */}
          {showCategory && (
            <>
              <div className="flex items-center gap-1.5">
                <span className={CATEGORIES.find((c) => c.id === feature.category)?.color}>{CATEGORIES.find((c) => c.id === feature.category)?.icon}</span>
                <span className="text-[10px] text-gray-500">{feature.category.split("&")[0].trim()}</span>
              </div>
              <span className="text-gray-200">|</span>
            </>
          )}
          {/* Epic badge (hide in epic view since it's the group) */}
          {!showCategory && (
            <>
              <div className="flex items-center gap-1.5">
                <Target className="size-3 text-purple-500" />
                <Badge variant="outline" className={cn("text-[9px] font-bold py-0", epic.bg, epic.color)}>{epic.id}</Badge>
                <span className="text-[10px] text-gray-500">{epic.title}</span>
              </div>
              <span className="text-gray-200">|</span>
            </>
          )}
          {/* User story */}
          <div className="flex items-center gap-1.5">
            <BookOpen className="size-3 text-[#d94e33]" />
            <span className="text-[9px] font-mono font-bold text-[#d94e33] bg-[#d94e33]/10 px-1 py-0.5 rounded">{story.id}</span>
            <span className="text-[10px] text-gray-500 italic">As a {story.persona}, I want to {story.title.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Copy */}
      <button onClick={() => onCopy(feature)} className="p-1.5 rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" title="Copy to clipboard">
        {copiedId === feature.id ? <CheckCheck className="size-3.5 text-green-600" /> : <Copy className="size-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}
