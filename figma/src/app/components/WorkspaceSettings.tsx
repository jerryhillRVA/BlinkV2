import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Switch } from "@/app/components/ui/switch";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/app/components/ui/accordion";
import { Badge } from "@/app/components/ui/badge";
import { 
  Save, 
  UserPlus, 
  Trash2, 
  Globe, 
  Share2, 
  Users, 
  Bell, 
  ShieldCheck, 
  RefreshCw,
  UserCheck,
  Shield,
  Target,
  Mic2,
  ListTodo,
  Rocket,
  Plus,
  X,
  Clock,
  Video,
  Layout,
  Type,
  User,
  Briefcase,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
  Zap,
  Lock,
  Layers,
  FileSearch,
  ChevronRight,
  Archive,
  Edit2,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  Flag,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { FieldInfo } from "@/app/components/FieldInfo";

interface Agent {
  id: number;
  name: string;
  role: string;
  bio: string;
  isEditing?: boolean;
}

interface ContentPillar {
  id: number;
  name: string;
  description: string;
  themes: string;
  audienceSegments: string[];
  platforms: string[];
}

const fieldStyles = "bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors";

// ─── Calendar Deadline Template Types ───
type MilestoneType = "brief_due" | "draft_due" | "blueprint_due" | "assets_due" | "packaging_due" | "qa_due";
type PhaseType = "production_window" | "review_window";

interface MilestoneTemplateRow { id: number; milestone_type: MilestoneType; offset_days: number; required: boolean }
interface PhaseTemplateRow { id: number; phase_type: PhaseType; start_offset_days: number; end_offset_days: number; required: boolean }

const CANONICAL_TYPE_OPTIONS = [
  { value: "VIDEO_SHORT_VERTICAL", label: "Short Vertical Video (Reels / Shorts / TikTok)" },
  { value: "VIDEO_LONG_HORIZONTAL", label: "Long Horizontal Video (YouTube)" },
  { value: "IMAGE_SINGLE", label: "Single Image" },
  { value: "IMAGE_CAROUSEL", label: "Image Carousel" },
  { value: "TEXT_POST", label: "Text Post" },
  { value: "LINK_POST", label: "Link Post" },
  { value: "DOCUMENT_CAROUSEL_PDF", label: "Document Carousel / PDF" },
  { value: "STORY_FRAME_SET", label: "Story Frame Set" },
  { value: "LIVE_BROADCAST", label: "Live Broadcast" },
];

const MILESTONE_TYPE_OPTIONS: { value: MilestoneType; label: string }[] = [
  { value: "brief_due", label: "Brief Due" },
  { value: "draft_due", label: "Draft Due" },
  { value: "blueprint_due", label: "Blueprint Due" },
  { value: "assets_due", label: "Assets Due" },
  { value: "packaging_due", label: "Packaging Due" },
  { value: "qa_due", label: "QA Due" },
];

const DEFAULT_TEMPLATES: Record<string, { milestones: MilestoneTemplateRow[]; phases: PhaseTemplateRow[] }> = {
  VIDEO_SHORT_VERTICAL: {
    milestones: [
      { id: 1, milestone_type: "draft_due", offset_days: -7, required: true },
      { id: 2, milestone_type: "assets_due", offset_days: -5, required: true },
      { id: 3, milestone_type: "qa_due", offset_days: -2, required: true },
    ],
    phases: [
      { id: 1, phase_type: "production_window", start_offset_days: -7, end_offset_days: -3, required: true },
      { id: 2, phase_type: "review_window", start_offset_days: -2, end_offset_days: -1, required: true },
    ],
  },
  VIDEO_LONG_HORIZONTAL: {
    milestones: [
      { id: 1, milestone_type: "draft_due", offset_days: -14, required: true },
      { id: 2, milestone_type: "assets_due", offset_days: -10, required: true },
      { id: 3, milestone_type: "qa_due", offset_days: -3, required: true },
    ],
    phases: [
      { id: 1, phase_type: "production_window", start_offset_days: -14, end_offset_days: -6, required: true },
      { id: 2, phase_type: "review_window", start_offset_days: -3, end_offset_days: -1, required: true },
    ],
  },
  IMAGE_SINGLE: {
    milestones: [
      { id: 1, milestone_type: "draft_due", offset_days: -5, required: true },
      { id: 2, milestone_type: "assets_due", offset_days: -3, required: true },
      { id: 3, milestone_type: "qa_due", offset_days: -1, required: true },
    ],
    phases: [
      { id: 1, phase_type: "production_window", start_offset_days: -5, end_offset_days: -2, required: true },
      { id: 2, phase_type: "review_window", start_offset_days: -1, end_offset_days: -1, required: false },
    ],
  },
  IMAGE_CAROUSEL: {
    milestones: [
      { id: 1, milestone_type: "draft_due", offset_days: -7, required: true },
      { id: 2, milestone_type: "assets_due", offset_days: -4, required: true },
      { id: 3, milestone_type: "qa_due", offset_days: -2, required: true },
    ],
    phases: [
      { id: 1, phase_type: "production_window", start_offset_days: -7, end_offset_days: -3, required: true },
      { id: 2, phase_type: "review_window", start_offset_days: -2, end_offset_days: -1, required: true },
    ],
  },
  TEXT_POST: {
    milestones: [
      { id: 1, milestone_type: "draft_due", offset_days: -3, required: true },
      { id: 2, milestone_type: "qa_due", offset_days: -1, required: true },
    ],
    phases: [
      { id: 1, phase_type: "review_window", start_offset_days: -1, end_offset_days: -1, required: false },
    ],
  },
  LINK_POST: {
    milestones: [
      { id: 1, milestone_type: "draft_due", offset_days: -3, required: true },
      { id: 2, milestone_type: "qa_due", offset_days: -1, required: true },
    ],
    phases: [
      { id: 1, phase_type: "review_window", start_offset_days: -1, end_offset_days: -1, required: false },
    ],
  },
  STORY_FRAME_SET: {
    milestones: [
      { id: 1, milestone_type: "draft_due", offset_days: -4, required: true },
      { id: 2, milestone_type: "assets_due", offset_days: -2, required: true },
      { id: 3, milestone_type: "qa_due", offset_days: -1, required: true },
    ],
    phases: [],
  },
  LIVE_BROADCAST: {
    milestones: [
      { id: 1, milestone_type: "qa_due", offset_days: -1, required: false },
    ],
    phases: [
      { id: 1, phase_type: "production_window", start_offset_days: -7, end_offset_days: -1, required: true },
    ],
  },
};

function CalendarDeadlineSettings() {
  const [deadlinesEnabled, setDeadlinesEnabled] = React.useState(true);
  const [autoCreate, setAutoCreate] = React.useState(true);
  const [remindersEnabled, setRemindersEnabled] = React.useState(true);
  const [milestone72h, setMilestone72h] = React.useState(true);
  const [milestone24h, setMilestone24h] = React.useState(true);
  const [milestoneOverdue, setMilestoneOverdue] = React.useState(true);
  const [publish24h, setPublish24h] = React.useState(true);
  const [selectedType, setSelectedType] = React.useState("VIDEO_SHORT_VERTICAL");

  const template = DEFAULT_TEMPLATES[selectedType] || DEFAULT_TEMPLATES.VIDEO_SHORT_VERTICAL;
  const [milestones, setMilestones] = React.useState<MilestoneTemplateRow[]>(template.milestones);
  const [phases, setPhases] = React.useState<PhaseTemplateRow[]>(template.phases);

  React.useEffect(() => {
    const t = DEFAULT_TEMPLATES[selectedType];
    if (t) { setMilestones(t.milestones); setPhases(t.phases); }
  }, [selectedType]);

  const previewPublishDate = new Date("2026-04-30");

  const addMilestone = () => {
    setMilestones(prev => [...prev, { id: Date.now(), milestone_type: "brief_due", offset_days: -3, required: true }]);
  };
  const removeMilestone = (id: number) => setMilestones(prev => prev.filter(m => m.id !== id));
  const updateMilestone = (id: number, field: keyof MilestoneTemplateRow, value: any) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };
  const addPhase = () => {
    setPhases(prev => [...prev, { id: Date.now(), phase_type: "production_window", start_offset_days: -5, end_offset_days: -2, required: true }]);
  };
  const removePhase = (id: number) => setPhases(prev => prev.filter(p => p.id !== id));
  const updatePhase = (id: number, field: keyof PhaseTemplateRow, value: any) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const formatPreviewDate = (offsetDays: number) => {
    const d = new Date(previewPublishDate);
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Deadline Templates */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-[#d94e33]" /> Deadline Templates
          </CardTitle>
          <CardDescription>
            Configure default milestone offsets and phase windows by content type. Deadlines are auto-suggested when a publish date is set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-bold">Enable Deadline Templates</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Auto-suggest milestones and phase windows</p>
              </div>
              <Switch checked={deadlinesEnabled} onCheckedChange={setDeadlinesEnabled} />
            </div>
            <div className={cn("flex items-center justify-between", !deadlinesEnabled && "opacity-50 pointer-events-none")}>
              <div>
                <Label className="text-sm font-bold">Auto-create on Publish</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Create deadlines when publish date is set</p>
              </div>
              <Switch checked={autoCreate} onCheckedChange={setAutoCreate} />
            </div>
          </div>

          <div className={cn(!deadlinesEnabled && "opacity-50 pointer-events-none")}>
            {/* Canonical type selector */}
            <div className="space-y-2 mb-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className={cn(fieldStyles, "h-11")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANONICAL_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Milestones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Flag className="size-3 text-gray-500" /> Milestones
                </Label>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-[#d94e33] text-[#d94e33]" onClick={addMilestone}>
                  <Plus className="size-3" /> Add
                </Button>
              </div>
              {milestones.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 bg-white group">
                  <Select value={ms.milestone_type} onValueChange={(v) => updateMilestone(ms.id, "milestone_type", v as MilestoneType)}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MILESTONE_TYPE_OPTIONS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Label className="text-[9px] text-muted-foreground whitespace-nowrap">Offset:</Label>
                    <Input type="number" value={ms.offset_days} onChange={(e) => updateMilestone(ms.id, "offset_days", parseInt(e.target.value) || 0)} className="h-8 w-16 text-xs text-center" />
                    <span className="text-[9px] text-muted-foreground">days</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <Checkbox checked={ms.required} onCheckedChange={(v) => updateMilestone(ms.id, "required", !!v)} />
                    <span className="text-[9px] text-muted-foreground">Req</span>
                  </label>
                  <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => removeMilestone(ms.id)}>
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Phase Windows */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Wrench className="size-3 text-blue-600" /> Phase Windows
                </Label>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-[#d94e33] text-[#d94e33]" onClick={addPhase}>
                  <Plus className="size-3" /> Add
                </Button>
              </div>
              {phases.map((pw) => (
                <div key={pw.id} className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 bg-white group">
                  <Select value={pw.phase_type} onValueChange={(v) => updatePhase(pw.id, "phase_type", v as PhaseType)}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production_window">Production Window</SelectItem>
                      <SelectItem value="review_window">Review Window</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Label className="text-[9px] text-muted-foreground whitespace-nowrap">Start:</Label>
                    <Input type="number" value={pw.start_offset_days} onChange={(e) => updatePhase(pw.id, "start_offset_days", parseInt(e.target.value) || 0)} className="h-8 w-14 text-xs text-center" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-[9px] text-muted-foreground whitespace-nowrap">End:</Label>
                    <Input type="number" value={pw.end_offset_days} onChange={(e) => updatePhase(pw.id, "end_offset_days", parseInt(e.target.value) || 0)} className="h-8 w-14 text-xs text-center" />
                    <span className="text-[9px] text-muted-foreground">days</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <Checkbox checked={pw.required} onCheckedChange={(v) => updatePhase(pw.id, "required", !!v)} />
                    <span className="text-[9px] text-muted-foreground">Req</span>
                  </label>
                  <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => removePhase(pw.id)}>
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
              {phases.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-3">No phase windows configured for this type.</p>
              )}
            </div>

            {/* Preview panel */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#d94e33]/5 to-orange-50 border border-[#d94e33]/20">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="size-4 text-[#d94e33]" />
                <span className="text-xs font-bold">Preview — If publish date is Apr 30</span>
              </div>
              <div className="space-y-1.5">
                {phases.map(pw => (
                  <div key={pw.id} className="flex items-center gap-2 text-[10px]">
                    {pw.phase_type === "production_window" ? <Wrench className="size-3 text-blue-600" /> : <ClipboardCheck className="size-3 text-purple-600" />}
                    <span className="font-bold">{pw.phase_type === "production_window" ? "Production" : "Review"}</span>
                    <span className="text-muted-foreground">{formatPreviewDate(pw.start_offset_days)} → {formatPreviewDate(pw.end_offset_days)}</span>
                    {pw.required && <Badge variant="outline" className="text-[7px] h-3.5 px-1">Required</Badge>}
                  </div>
                ))}
                {milestones.map(ms => (
                  <div key={ms.id} className="flex items-center gap-2 text-[10px]">
                    <Flag className="size-3 text-gray-500" />
                    <span className="font-bold">{MILESTONE_TYPE_OPTIONS.find(o => o.value === ms.milestone_type)?.label}</span>
                    <span className="text-muted-foreground">{formatPreviewDate(ms.offset_days)}</span>
                    {ms.required && <Badge variant="outline" className="text-[7px] h-3.5 px-1">Required</Badge>}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-[#d94e33]/10 mt-2">
                  <CalendarDays className="size-3 text-[#d94e33]" />
                  <span className="font-bold text-[#d94e33]">Publish</span>
                  <span className="text-muted-foreground">Apr 30</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50/50 p-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" className="text-[10px] gap-1" onClick={() => {
            const t = DEFAULT_TEMPLATES[selectedType];
            if (t) { setMilestones(t.milestones); setPhases(t.phases); }
          }}>
            <RefreshCw className="size-3" /> Reset to Defaults
          </Button>
          <Button className="bg-[#d94e33] hover:bg-[#c2462e]">
            <Save className="mr-2 size-4" /> Save Templates
          </Button>
        </CardFooter>
      </Card>

      {/* Reminder Settings */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-[#d94e33]" /> Reminder Defaults
          </CardTitle>
          <CardDescription>Configure when reminders are sent for milestones and publish events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <Label className="text-sm font-bold">Enable Reminders</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">Send notifications for upcoming deadlines</p>
            </div>
            <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
          </div>
          <div className={cn("space-y-4", !remindersEnabled && "opacity-50 pointer-events-none")}>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Flag className="size-3" /> Milestone Reminders
              </Label>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white cursor-pointer">
                  <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /><span className="text-xs">72 hours before due</span></div>
                  <Checkbox checked={milestone72h} onCheckedChange={(v) => setMilestone72h(!!v)} />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white cursor-pointer">
                  <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /><span className="text-xs">24 hours before due</span></div>
                  <Checkbox checked={milestone24h} onCheckedChange={(v) => setMilestone24h(!!v)} />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white cursor-pointer">
                  <div className="flex items-center gap-2"><AlertTriangle className="size-4 text-red-500" /><span className="text-xs">Day-of morning if overdue</span></div>
                  <Checkbox checked={milestoneOverdue} onCheckedChange={(v) => setMilestoneOverdue(!!v)} />
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="size-3" /> Publish Reminders
              </Label>
              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white cursor-pointer">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <div>
                    <span className="text-xs">24h before publish if not approved or blocked</span>
                    <p className="text-[9px] text-muted-foreground">Alerts when content is scheduled within 24h but missing approvals or has blockers</p>
                  </div>
                </div>
                <Checkbox checked={publish24h} onCheckedChange={(v) => setPublish24h(!!v)} />
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50/50 p-6 flex justify-end">
          <Button className="bg-[#d94e33] hover:bg-[#c2462e]">
            <Save className="mr-2 size-4" /> Save Reminder Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function WorkspaceSettings({ activeWorkspace = "Hive Collective" }: { activeWorkspace?: string }) {
  const [agents, setAgents] = React.useState<Agent[]>([
    { 
      id: 1, 
      name: "Reporting Agent", 
      role: "News Aggregator", 
      bio: "Focuses on scanning RSS feeds daily to identify emerging tech trends. Summarizes complex software engineering articles into clear, actionable insights for the development team. Maintains a professional and technically accurate tone while filtering out sensationalist news.",
    },
    { 
      id: 2, 
      name: "Creative Agent", 
      role: "Content Specialist", 
      bio: "Specializes in high-engagement social media content. Generates creative captions, researches strategic hashtags, and drafts story outlines for Instagram and LinkedIn. Maintains an upbeat brand voice while ensuring all visual assets align with established design guidelines.",
    },
  ]);

  const [audienceSegments, setAudienceSegments] = React.useState([
    { id: 1, description: "Tech-savvy engineers interested in AI automation.", ageRange: "25-34" },
    { id: 2, description: "Social media managers looking for workflow efficiency.", ageRange: "18-24" }
  ]);

  const [contentPillars, setContentPillars] = React.useState<ContentPillar[]>([
    { 
      id: 1, 
      name: "Industry News", 
      description: "Timely updates on industry shifts and breaking tech news.",
      themes: "AI, Software Development, Venture Capital",
      audienceSegments: ["Engineers"],
      platforms: ["LinkedIn", "YouTube"]
    },
    { 
      id: 2, 
      name: "How-To Guides", 
      description: "Practical tutorials and educational deep-dives.",
      themes: "Tutorials, Productivity, Automation",
      audienceSegments: ["Social Media Managers"],
      platforms: ["YouTube", "Instagram"]
    }
  ]);

  const [users, setUsers] = React.useState([
    { id: 1, name: "Brett Lewis", role: "Admin", email: "blewis@jackreiley.com", isMe: true },
    { id: 2, name: "Brett Lewis", role: "User", email: "vthokiebrett@gmail.com", isMe: false },
  ]);

  const [enabledPlatforms, setEnabledPlatforms] = React.useState<string[]>(["YouTube", "LinkedIn"]);

  const addSegment = () => {
    setAudienceSegments([...audienceSegments, { id: Date.now(), description: "", ageRange: "25-34" }]);
  };

  const removeSegment = (id: number) => {
    setAudienceSegments(audienceSegments.filter(s => s.id !== id));
  };

  const addPillar = () => {
    setContentPillars([...contentPillars, { id: Date.now(), name: "", description: "", themes: "", audienceSegments: [], platforms: [] }]);
  };

  const removePillar = (id: number) => {
    setContentPillars(contentPillars.filter(p => p.id !== id));
  };

  const updatePillar = (id: number, field: keyof ContentPillar, value: any) => {
    setContentPillars(contentPillars.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const togglePlatform = (platform: string) => {
    setEnabledPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const toggleSegmentOnPillar = (pillarId: number, segment: string) => {
    setContentPillars(contentPillars.map(p => {
      if (p.id === pillarId) {
        const segments = p.audienceSegments.includes(segment)
          ? p.audienceSegments.filter(s => s !== segment)
          : [...p.audienceSegments, segment];
        return { ...p, audienceSegments: segments };
      }
      return p;
    }));
  };

  const togglePlatformOnPillar = (pillarId: number, platform: string) => {
    setContentPillars(contentPillars.map(p => {
      if (p.id === pillarId) {
        const platforms = p.platforms.includes(platform)
          ? p.platforms.filter(s => s !== platform)
          : [...p.platforms, platform];
        return { ...p, platforms };
      }
      return p;
    }));
  };

  const addAgent = () => {
    const newAgent: Agent = { 
      id: Date.now(), 
      name: "New Agent", 
      role: "Specialist", 
      bio: "",
      isEditing: true
    };
    setAgents([...agents, newAgent]);
  };

  const archiveAgent = (id: number) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const toggleAgentEdit = (id: number) => {
    setAgents(agents.map(a => a.id === id ? { ...a, isEditing: !a.isEditing } : a));
  };

  const updateAgent = (id: number, field: keyof Agent, value: any) => {
    setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const AGE_RANGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
  const AVAILABLE_AUDIENCES = ["Engineers", "Founders", "Social Media Managers", "Tech Enthusiasts", "Executives"];
  const AVAILABLE_PLATFORMS = ["YouTube", "LinkedIn", "Twitter/X", "Instagram", "Facebook", "Slack", "Discord"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground">
          Manage your Blink Social workspace configuration and agent behaviors.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border w-full justify-start h-12 p-1 gap-1 mb-6 overflow-x-auto">
          <TabsTrigger value="general" className="gap-2 px-4 data-[state=active]:bg-[#d94e33] data-[state=active]:text-white">
            <Globe className="size-4" /> General
          </TabsTrigger>
          <TabsTrigger value="platforms" className="gap-2 px-4 data-[state=active]:bg-[#d94e33] data-[state=active]:text-white">
            <Share2 className="size-4" /> Platforms
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2 px-4 data-[state=active]:bg-[#d94e33] data-[state=active]:text-white">
            <Users className="size-4" /> Agents
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 px-4 data-[state=active]:bg-[#d94e33] data-[state=active]:text-white">
            <UserCheck className="size-4" /> Team
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 px-4 data-[state=active]:bg-[#d94e33] data-[state=active]:text-white">
            <Bell className="size-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2 px-4 data-[state=active]:bg-[#d94e33] data-[state=active]:text-white">
            <CalendarDays className="size-4" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 px-4 data-[state=active]:bg-[#d94e33] data-[state=active]:text-white">
            <ShieldCheck className="size-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Detailed identity and basic strategy for your Blink Social workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="workspace-name" className="flex items-center gap-2 font-bold text-gray-900">
                  <Rocket className="size-4" /> Workspace Name
                  <FieldInfo content="The name of your workspace used for identification." />
                </Label>
                <Input 
                  id="workspace-name" 
                  defaultValue={activeWorkspace} 
                  placeholder="e.g. Hive Collective" 
                  className={cn(fieldStyles, "h-12")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-purpose" className="flex items-center gap-2 font-bold text-gray-900">
                  <Target className="size-4" /> Workspace Purpose
                  <FieldInfo content="The core objective or intent of this specific workspace." />
                </Label>
                <Textarea
                  id="workspace-purpose"
                  placeholder="The primary reason this workspace exists..."
                  defaultValue="To aggregate and summarize daily tech news for the engineering team."
                  className={cn(fieldStyles, "min-h-[100px] py-4")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mission" className="flex items-center gap-2 font-bold text-gray-900">
                  <Shield className="size-4" /> Mission
                  <FieldInfo content="A high-level statement of what you aim to achieve long-term." />
                </Label>
                <Textarea
                  id="mission"
                  placeholder="Describe what this workspace aims to achieve..."
                  className={cn(fieldStyles, "min-h-[100px] py-4")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-voice" className="flex items-center gap-2 font-bold text-gray-900">
                  <Mic2 className="size-4" /> Brand Voice
                  <FieldInfo content="The characteristic style and tone used in all workspace communications." />
                </Label>
                <Textarea
                  id="brand-voice"
                  placeholder="What tone and style will you use?"
                  defaultValue="Professional, concise, and technically accurate tone."
                  className={cn(fieldStyles, "min-h-[100px] py-4")}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50/50 p-6 flex justify-end">
              <Button className="bg-[#d94e33] hover:bg-[#c2462e]">
                <Save className="mr-2 size-4" /> Save Workspace Identity
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-gray-100/50">
              <CardTitle className="text-lg">Global Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-900 flex items-center gap-2">
                    Default Platform
                    <FieldInfo content="The primary platform that will be pre-selected for new content." />
                  </Label>
                  <Select defaultValue="youtube">
                    <SelectTrigger className={cn(fieldStyles, "h-12 w-full")}>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-900 flex items-center gap-2">
                    Max Ideas Per Platform/Month
                    <FieldInfo content="Set a cap on the number of AI-generated content ideas per month." />
                  </Label>
                  <Input type="number" defaultValue={30} className={cn(fieldStyles, "h-12")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Platforms</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Accordion type="multiple" className="w-full">
                {["YouTube", "LinkedIn", "Twitter/X", "Instagram", "Facebook", "Slack", "Discord"].map((platform) => {
                  const isActive = enabledPlatforms.includes(platform);
                  return (
                    <AccordionItem key={platform} value={platform} className="border-b last:border-none px-4">
                      <div className="flex items-center justify-between w-full pr-10 relative">
                        <AccordionTrigger className="hover:no-underline py-4 flex-1">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "size-8 rounded-lg flex items-center justify-center transition-colors",
                              isActive ? "bg-[#d94e33]/10 text-[#d94e33]" : "bg-gray-100 text-gray-400"
                            )}>
                              <Share2 className="size-4" />
                            </div>
                            <span className={cn("font-medium", !isActive && "text-muted-foreground")}>{platform}</span>
                            <Badge variant={isActive ? "default" : "outline"} className={cn(
                              "text-[10px] h-5",
                              isActive ? "bg-green-500 hover:bg-green-600 text-white border-transparent" : "text-muted-foreground/60 border-gray-200"
                            )}>
                              {isActive ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                          <Switch 
                            checked={isActive} 
                            onCheckedChange={() => togglePlatform(platform)}
                          />
                        </div>
                      </div>

                      <AccordionContent className={cn("pt-2 pb-6 space-y-8", !isActive && "opacity-50 pointer-events-none grayscale-[0.5]")}>
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Video className="size-3" /> Video Settings
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-gray-900 flex items-center gap-2">
                                Aspect Ratio
                                <FieldInfo content="The preferred width-to-height ratio for video content on this platform." />
                              </Label>
                              <Select defaultValue="16:9">
                                <SelectTrigger className={cn(fieldStyles, "h-11")}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-gray-900 flex items-center gap-2">
                                Video Resolution
                                <FieldInfo content="The quality setting for exported video files." />
                              </Label>
                              <Select defaultValue="1080p">
                                <SelectTrigger className={cn(fieldStyles, "h-11")}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="4k">3840x2160 (4K)</SelectItem>
                                  <SelectItem value="1080p">1920x1080 (Full HD)</SelectItem>
                                  <SelectItem value="720p">1280x720 (HD)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agent Personalities</CardTitle>
                <CardDescription>
                  View and manage your AI team members. Expand an agent to edit their full biography.
                </CardDescription>
              </div>
              <Button onClick={addAgent} size="sm" variant="outline" className="border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5">
                <UserPlus className="mr-2 size-4" /> Add Agent
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="popLayout">
                {agents.map((agent, index) => (
                  <motion.div
                    layout
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border rounded-2xl bg-white shadow-xs overflow-hidden"
                  >
                    <div className="p-5 flex items-center justify-between group cursor-pointer" onClick={() => toggleAgentEdit(agent.id)}>
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-[#d94e33]/10 flex items-center justify-center text-[#d94e33] font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            {agent.name}
                            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5 border-gray-100">{agent.role}</Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                            {agent.bio || "No biography provided yet."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAgentEdit(agent.id);
                          }}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveAgent(agent.id);
                          }}
                        >
                          <Archive className="size-4" />
                        </Button>
                        <ChevronRight className={cn("size-5 text-muted-foreground transition-transform", agent.isEditing && "rotate-90")} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {agent.isEditing && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t bg-gray-50/30"
                        >
                          <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                  Agent Name
                                  <FieldInfo content="The identifier for this AI personality." />
                                </Label>
                                <Input 
                                  value={agent.name} 
                                  onChange={(e) => updateAgent(agent.id, "name", e.target.value)}
                                  className={cn(fieldStyles, "h-11 bg-white")}
                                  placeholder="e.g. Reporting Bot"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                  Role
                                  <FieldInfo content="The specific function or niche this agent serves." />
                                </Label>
                                <Input 
                                  value={agent.role}
                                  onChange={(e) => updateAgent(agent.id, "role", e.target.value)}
                                  className={cn(fieldStyles, "h-11 bg-white")}
                                  placeholder="e.g. Research Specialist"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                Full Bio
                                <FieldInfo content="The comprehensive biography and operational instructions for this agent." />
                              </Label>
                              <Textarea 
                                value={agent.bio}
                                onChange={(e) => updateAgent(agent.id, "bio", e.target.value)}
                                className={cn(fieldStyles, "min-h-[160px] py-4 bg-white")}
                                placeholder="Describe the agent's personality, responsibilities, and specific goals..."
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => toggleAgentEdit(agent.id)}
                              >
                                Done
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
            <CardFooter className="border-t bg-gray-50/50 p-6 flex justify-end">
              <Button className="bg-[#d94e33] hover:bg-[#c2462e]">
                <Save className="mr-2 size-4" /> Save All Agents
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base font-semibold">Workspace Users</CardTitle>
                </div>
                <Button size="sm" className="bg-[#2b6bff] hover:bg-[#2152cc] gap-2">
                  <UserPlus className="size-4" /> Add User
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {users.map((user) => (
                  <div key={user.id} className={cn("flex items-center justify-between p-3 rounded-lg border", user.isMe ? "bg-blue-50/50 border-blue-100" : "bg-white")}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-100">
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{user.name} ({user.role})</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {["Content Published", "Critical Errors"].map((label, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-xl">
                  <Label className="text-base">{label}</Label>
                  <Checkbox defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarDeadlineSettings />
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader><CardTitle>Security & Access</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <Button variant="destructive" className="w-full sm:w-auto">Archive Workspace</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}