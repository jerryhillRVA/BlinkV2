import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  Search,
  Eye,
  Sparkles,
  Loader2,
  Target,
  Clock,
  TrendingUp,
  Globe,
  BookOpen,
  ExternalLink,
  Instagram,
  Youtube,
  Zap,
  AlertTriangle,
  Heart,
  BarChart3,
  RefreshCcw,
  Layers,
  Lightbulb,
  Mic,
  Radio,
  PenTool,
  RefreshCw,
  ListOrdered,
  FlaskConical,
  Hash,
  Plus,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { ContentPillar, AudienceSegment, Platform, AudienceInsight, ResearchSource, ContentItem, InvestmentPlan, BrandVoice, ChannelStrategyEntry, BusinessObjective, ObjectiveCategory } from "./types";
import { MOCK_AUDIENCE_INSIGHTS, MOCK_RESEARCH_SOURCES, PLATFORM_CONFIG } from "./types";
import { PillarsSegments } from "./PillarsSegments";
import { StrategicPillars } from "./StrategicPillars";
import { AudienceSegments } from "./AudienceSegments";
import { CompetitorDeepDive } from "./CompetitorDeepDive";
import { ContentRepurposer } from "./ContentRepurposer";
import { ContentSeriesBuilder } from "./ContentSeriesBuilder";
import { ABAnalyzer } from "./ABAnalyzer";
import { SocialSEOStrategy } from "./SocialSEOStrategy";
import { BrandVoice as BrandVoiceComponent } from "./BrandVoice";
import { ChannelStrategy } from "./ChannelStrategy";
import { ContentMix } from "./ContentMix";
import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";


interface StrategyResearchProps {
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onUpdatePillars: (pillars: ContentPillar[]) => void;
  onUpdateSegments: (segments: AudienceSegment[]) => void;
  onNavigateToIdeation: () => void;
  onNavigateToProduction?: () => void;
  onCreateIdeaFromSource?: (source: ResearchSource) => void;
  onCreateProductionFromSource?: (source: ResearchSource) => void;
  onAddContentItem?: (item: ContentItem) => void;
  onSaveInvestmentPlan?: (plan: InvestmentPlan) => void;
  objectives?: BusinessObjective[];
  onUpdateObjectives?: (objectives: BusinessObjective[]) => void;
}

type StrategyView = "brand-voice" | "pillars" | "audience" | "channel" | "content-mix" | "research" | "competitors" | "repurposer" | "series" | "ab-analyzer" | "seo";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === "instagram") return <Instagram className="size-4 text-pink-600" />;
  if (platform === "youtube") return <Youtube className="size-4 text-red-600" />;
  return <TikTokIcon />;
}

export function StrategyResearch({
  pillars,
  segments,
  onUpdatePillars,
  onUpdateSegments,
  onNavigateToIdeation,
  onNavigateToProduction,
  onCreateIdeaFromSource,
  onCreateProductionFromSource,
  onAddContentItem,
  onSaveInvestmentPlan,
  objectives = [],
  onUpdateObjectives,
}: StrategyResearchProps) {
  const [activeView, setActiveView] = useState<StrategyView>("brand-voice");

  // Objectives management state
  const [showObjectivesDrawer, setShowObjectivesDrawer] = useState(false);
  const [dialogObjectives, setDialogObjectives] = useState<BusinessObjective[]>([]);
  const [isSuggestingObjectives, setIsSuggestingObjectives] = useState(false);

  const OBJECTIVE_CATEGORY_CONFIG: Record<ObjectiveCategory, { label: string; emoji: string }> = {
    growth:     { label: "Growth",     emoji: "📈" },
    revenue:    { label: "Revenue",    emoji: "💰" },
    awareness:  { label: "Awareness",  emoji: "📣" },
    trust:      { label: "Trust",      emoji: "🤝" },
    community:  { label: "Community",  emoji: "👥" },
    engagement: { label: "Engagement", emoji: "⚡" },
  };

  const OBJECTIVE_STATUS_COLOR: Record<BusinessObjective["status"], string> = {
    "on-track": "bg-green-500",
    "at-risk":  "bg-amber-400",
    "behind":   "bg-red-500",
    "achieved": "bg-[#d94e33]",
  };

  const OBJECTIVE_STATUS_BADGE: Record<BusinessObjective["status"], string> = {
    "on-track": "bg-green-50 text-green-700 border-green-200",
    "at-risk":  "bg-amber-50 text-amber-700 border-amber-200",
    "behind":   "bg-red-50 text-red-700 border-red-200",
    "achieved": "bg-[#d94e33]/10 text-[#d94e33] border-[#d94e33]/20",
  };

  const newBlankObjective = (): BusinessObjective => ({
    id: `obj-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    category: "growth",
    statement: "",
    target: 0,
    unit: "",
    timeframe: "",
    status: "on-track",
  });

  const openObjectivesDialog = () => {
    setDialogObjectives(objectives.length > 0 ? [...objectives] : [newBlankObjective()]);
    setShowObjectivesDrawer(true);
  };

  const saveObjectivesDialog = () => {
    onUpdateObjectives?.(dialogObjectives.filter((o) => o.statement.trim()));
    setShowObjectivesDrawer(false);
    toast.success("Objectives updated");
  };

  const updateDialogObjective = (id: string, updates: Partial<BusinessObjective>) => {
    setDialogObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const handleSuggestObjectivesInDialog = () => {
    setIsSuggestingObjectives(true);
    setTimeout(() => {
      setIsSuggestingObjectives(false);
      const suggested: BusinessObjective[] = [
        { id: `obj-${Date.now()}-1`, category: "growth", statement: "Grow combined social following to 25,000", target: 25000, unit: "followers", timeframe: "Q4 2026", status: "on-track" },
        { id: `obj-${Date.now()}-2`, category: "engagement", statement: "Achieve 5% average engagement rate across platforms", target: 5, unit: "%", timeframe: "Q3 2026", status: "on-track" },
      ];
      setDialogObjectives((prev) => [...prev, ...suggested].slice(0, 4));
      toast.success("Objectives suggested — adjust to fit your goals");
    }, 2500);
  };
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    missionStatement: "",
    voiceAttributes: [],
    toneByContext: [],
    platformToneAdjustments: [
      { platform: "instagram", adjustment: "" },
      { platform: "tiktok", adjustment: "" },
      { platform: "youtube", adjustment: "" },
      { platform: "facebook", adjustment: "" },
      { platform: "linkedin", adjustment: "" },
    ],
    vocabulary: { preferred: [], avoid: [] },
  });
  const [channelStrategies, setChannelStrategies] = useState<ChannelStrategyEntry[]>([
    { platform: "instagram", active: false, role: "", primaryContentTypes: [], toneAdjustment: "", postingCadence: "", primaryAudience: "", primaryGoal: "", notes: "" },
    { platform: "tiktok", active: false, role: "", primaryContentTypes: [], toneAdjustment: "", postingCadence: "", primaryAudience: "", primaryGoal: "", notes: "" },
    { platform: "youtube", active: false, role: "", primaryContentTypes: [], toneAdjustment: "", postingCadence: "", primaryAudience: "", primaryGoal: "", notes: "" },
    { platform: "facebook", active: false, role: "", primaryContentTypes: [], toneAdjustment: "", postingCadence: "", primaryAudience: "", primaryGoal: "", notes: "" },
    { platform: "linkedin", active: false, role: "", primaryContentTypes: [], toneAdjustment: "", postingCadence: "", primaryAudience: "", primaryGoal: "", notes: "" },
  ]);
  const [selectedSegment, setSelectedSegment] = useState<string>(segments[0]?.id || "");
  const [selectedPillar, setSelectedPillar] = useState<string>("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>(MOCK_AUDIENCE_INSIGHTS);
  const [researchSources, setResearchSources] = useState<ResearchSource[]>(MOCK_RESEARCH_SOURCES);


  const currentInsight = audienceInsights.find((a) => a.segmentId === selectedSegment);
  const currentSegment = segments.find((s) => s.id === selectedSegment);

  const filteredSources = selectedPillar === "all"
    ? researchSources
    : researchSources.filter((s) => s.pillarIds.includes(selectedPillar));

  const handleAIAnalyze = (type: string) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast.success(`AI ${type} analysis complete!`);
    }, 2500);
  };


  const sourceTypeConfig: Record<string, { color: string; bg: string }> = {
    article: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    report: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
    social: { color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
    news: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    video: { color: "text-red-700", bg: "bg-red-50 border-red-200" },
  };

  return (
    <div className="space-y-6">
      {/* ── Business Objectives Strip ── */}
      <div className="border border-gray-100 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-[#d94e33]" />
            <span className="text-sm font-bold text-gray-900">Business Objectives</span>
          </div>
          <button
            onClick={() => {
              if (showObjectivesDrawer) {
                setShowObjectivesDrawer(false);
              } else {
                openObjectivesDialog();
              }
            }}
            className="text-xs text-[#d94e33] hover:underline font-medium"
          >
            {showObjectivesDrawer ? "Close" : "Edit"}
          </button>
        </div>

        {objectives.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No objectives defined. Add objectives to root your strategy in measurable goals.</p>
            <Button size="sm" variant="outline" className="text-[#d94e33] border-[#d94e33] hover:bg-[#d94e33]/5" onClick={openObjectivesDialog}>
              Add Objectives →
            </Button>
          </div>
        ) : (
          <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {objectives.map((obj) => {
              const cfg = OBJECTIVE_CATEGORY_CONFIG[obj.category];
              const pct = obj.currentValue !== undefined && obj.target > 0
                ? Math.min(100, Math.round((obj.currentValue / obj.target) * 100))
                : 0;
              return (
                <div key={obj.id} className="flex-shrink-0 w-56 border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cfg.emoji} {cfg.label}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate mb-2">{obj.statement || "(No statement)"}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={cn("h-full rounded-full transition-all", OBJECTIVE_STATUS_COLOR[obj.status])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", OBJECTIVE_STATUS_BADGE[obj.status])}>
                      {obj.status === "on-track" ? "On Track" : obj.status === "at-risk" ? "At Risk" : obj.status === "behind" ? "Behind" : "Achieved"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{obj.timeframe}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {objectives.length > 2 && (
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          )}
          </div>
        )}

        <AnimatePresence>
          {showObjectivesDrawer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-100 mt-3 pt-3 space-y-4">
                {dialogObjectives.map((obj) => (
                  <div key={obj.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white relative">
                    <button
                      className="absolute top-3 right-3 size-6 flex items-center justify-center text-muted-foreground hover:text-destructive rounded"
                      onClick={() => setDialogObjectives((prev) => prev.filter((o) => o.id !== obj.id))}
                      disabled={dialogObjectives.length <= 1}
                    >
                      <X className="size-4" />
                    </button>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(OBJECTIVE_CATEGORY_CONFIG) as [ObjectiveCategory, { label: string; emoji: string }][]).map(([cat, cfg]) => (
                          <button
                            key={cat}
                            onClick={() => updateDialogObjective(obj.id, { category: cat })}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-all",
                              obj.category === cat
                                ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33] font-medium"
                                : "border-gray-200 text-muted-foreground hover:border-gray-300"
                            )}
                          >
                            {cfg.emoji} {cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Objective</Label>
                      <Input
                        value={obj.statement}
                        onChange={(e) => updateDialogObjective(obj.id, { statement: e.target.value })}
                        placeholder="e.g. Grow Instagram following to 10,000"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target</Label>
                        <Input type="number" value={obj.target || ""} onChange={(e) => updateDialogObjective(obj.id, { target: Number(e.target.value) })} placeholder="10000" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit</Label>
                        <Input value={obj.unit} onChange={(e) => updateDialogObjective(obj.id, { unit: e.target.value })} placeholder="followers" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeframe</Label>
                        <Input value={obj.timeframe} onChange={(e) => updateDialogObjective(obj.id, { timeframe: e.target.value })} placeholder="Q2 2026" className="h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  {dialogObjectives.length < 4 && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDialogObjectives((prev) => [...prev, newBlankObjective()])}>
                      <Plus className="size-3.5" /> Add Objective
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-[#d94e33] border-[#d94e33] hover:bg-[#d94e33]/5"
                    onClick={handleSuggestObjectivesInDialog}
                    disabled={isSuggestingObjectives || dialogObjectives.length >= 4}
                  >
                    {isSuggestingObjectives ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    AI Suggest
                  </Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowObjectivesDrawer(false)}>Cancel</Button>
                  <Button className="bg-[#d94e33] hover:bg-[#c4452d]" onClick={saveObjectivesDialog}>Save</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Strategy Views */}
      <div className="flex flex-row gap-6">
        {/* Left Sidebar */}
        <div className="w-52 shrink-0">
          {/* STRATEGY */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">Strategy</p>
          {([
            { id: "brand-voice" as const, label: "Brand Voice & Tone", icon: Mic },
            { id: "pillars" as const, label: "Strategic Pillars", icon: Layers },
            { id: "audience" as const, label: "Audience", icon: Users },
            { id: "channel" as const, label: "Channel Strategy", icon: Radio },
            { id: "content-mix" as const, label: "Content Mix", icon: PieChart },
          ]).map((v) => {
            const Icon = v.icon;
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={isActive
                  ? "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-[#d94e33] bg-[#d94e33]/5 w-full text-left"
                  : "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-gray-800 hover:bg-gray-100 transition-all w-full text-left"}
              >
                <Icon className={isActive ? "size-4 text-[#d94e33]" : "size-4 opacity-50"} />
                {v.label}
              </button>
            );
          })}

          <div className="border-t border-gray-100 my-2" />

          {/* RESEARCH */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">Research</p>
          {([
            { id: "research" as const, label: "Research Sources", icon: BookOpen },
            { id: "competitors" as const, label: "Competitor Deep Dive", icon: Eye },
          ]).map((v) => {
            const Icon = v.icon;
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={isActive
                  ? "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-[#d94e33] bg-[#d94e33]/5 w-full text-left"
                  : "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-gray-800 hover:bg-gray-100 transition-all w-full text-left"}
              >
                <Icon className={isActive ? "size-4 text-[#d94e33]" : "size-4 opacity-50"} />
                {v.label}
              </button>
            );
          })}

          <div className="border-t border-gray-100 my-2" />

          {/* CONTENT TOOLS */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">Content Tools</p>
          {([
            { id: "repurposer" as const, label: "Content Repurposer", icon: RefreshCw },
            { id: "series" as const, label: "Series Builder", icon: ListOrdered },
            { id: "ab-analyzer" as const, label: "A/B Analyzer", icon: FlaskConical },
            { id: "seo" as const, label: "SEO & Hashtags", icon: Hash },
          ]).map((v) => {
            const Icon = v.icon;
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={isActive
                  ? "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold text-[#d94e33] bg-[#d94e33]/5 w-full text-left"
                  : "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-gray-800 hover:bg-gray-100 transition-all w-full text-left"}
              >
                <Icon className={isActive ? "size-4 text-[#d94e33]" : "size-4 opacity-50"} />
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">

      {/* Brand Voice & Tone */}
      {activeView === "brand-voice" && (
        <BrandVoiceComponent
          brandVoice={brandVoice}
          onUpdateBrandVoice={setBrandVoice}
        />
      )}

      {/* Channel Strategy */}
      {activeView === "channel" && (
        <ChannelStrategy
          channelStrategies={channelStrategies}
          onUpdateChannelStrategies={setChannelStrategies}
          segments={segments}
        />
      )}

      {/* Content Mix */}
      {activeView === "content-mix" && (
        <ContentMix items={[]} />
      )}

      {/* Pillars & Segments */}
      {activeView === "pillars" && (
        <StrategicPillars
          pillars={pillars}
          segments={segments}
          onUpdatePillars={onUpdatePillars}
          onSaveInvestmentPlan={onSaveInvestmentPlan}
          objectives={objectives}
        />
      )}

      {/* Audience Analysis */}
      {activeView === "audience" && (
        <div className="space-y-6">
          {/* Audience Segments Management */}
          <AudienceSegments
            segments={segments}
            onUpdateSegments={onUpdateSegments}
          />

          {/* Segment Selector + AI Analyze */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-[220px] h-9 border-gray-200">
                <SelectValue placeholder="Select Segment" />
              </SelectTrigger>
              <SelectContent>
                {segments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 h-9"
              onClick={() => handleAIAnalyze("audience")}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              AI Analyze Audience
            </Button>
          </div>

          {isAnalyzing ? (
            <Card className="border-gray-100">
              <CardContent className="py-16 text-center">
                <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700">Analyzing {currentSegment?.name} audience...</p>
                <p className="text-xs text-muted-foreground mt-1">Identifying interests, pain points, and activity patterns</p>
              </CardContent>
            </Card>
          ) : currentInsight ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Interests */}
              <Card className="border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Heart className="size-4 text-pink-500" /> Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentInsight.interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-200">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pain Points */}
              <Card className="border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" /> Pain Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentInsight.painPoints.map((point) => (
                      <div key={point} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="size-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        {point}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Peak Activity Times */}
              <Card className="border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="size-4 text-blue-500" /> Peak Activity Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentInsight.peakActivityTimes.map((time) => (
                      <div key={`${time.day}-${time.hour}`} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock className="size-3.5 text-blue-500" />
                          <span className="text-xs font-bold">{time.day}</span>
                          <span className="text-xs text-muted-foreground">{time.hour}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px]",
                            time.engagement === "Very High" ? "text-green-700 bg-green-50 border-green-200" :
                            time.engagement === "High" ? "text-blue-700 bg-blue-50 border-blue-200" :
                            "text-gray-700 bg-gray-50 border-gray-200"
                          )}
                        >
                          {time.engagement}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Platform Preferences */}
              <Card className="border-gray-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Globe className="size-4 text-purple-500" /> Platform Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentInsight.preferredPlatforms.map((pp) => (
                    <div key={pp.platform} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={pp.platform} />
                          <span className="text-xs font-bold">{PLATFORM_CONFIG[pp.platform].label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{pp.preference}%</span>
                      </div>
                      <Progress value={pp.preference} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Content Preferences */}
              <Card className="border-gray-100 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Zap className="size-4 text-[#d94e33]" /> Content Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentInsight.contentPreferences.map((pref) => (
                      <div key={pref} className="px-3 py-2 rounded-lg bg-gradient-to-br from-[#d94e33]/5 to-orange-50 border border-[#d94e33]/10 text-xs font-bold text-gray-700">
                        {pref}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-gray-100">
              <CardContent className="py-12 text-center">
                <Users className="size-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-muted-foreground">Select a segment and run AI Analysis to see audience insights.</p>
                <p className="text-xs text-gray-400 mt-1">Insights include interests, pain points, activity times, and platform preferences.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Research Sources */}
      {activeView === "research" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedPillar} onValueChange={setSelectedPillar}>
              <SelectTrigger className="w-[200px] h-9 border-gray-200">
                <SelectValue placeholder="Filter by Pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pillars</SelectItem>
                {pillars.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 h-9"
              onClick={() => handleAIAnalyze("research")}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5" />
              )}
              AI Discover Sources
            </Button>
          </div>

          {isAnalyzing ? (
            <Card className="border-gray-100">
              <CardContent className="py-16 text-center">
                <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700">Scanning for relevant sources...</p>
                <p className="text-xs text-muted-foreground mt-1">Analyzing articles, reports, and social signals for your content pillars</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSources.map((source) => {
                const typeConf = sourceTypeConfig[source.type] || sourceTypeConfig.article;
                return (
                  <Card key={source.id} className="border-gray-100 hover:border-gray-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border", typeConf.bg, typeConf.color)}>
                              {source.type}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Target className="size-3 text-green-500" />
                              <span className="text-[10px] text-green-600 font-bold">{source.relevance}% relevance</span>
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">{source.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">{source.summary}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {source.pillarIds.map((pid) => {
                              const p = pillars.find((pp) => pp.id === pid);
                              return p ? (
                                <span key={pid} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: p.color + "15", color: p.color }}>
                                  {p.name}
                                </span>
                              ) : null;
                            })}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(source.discoveredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-[#d94e33] shrink-0">
                          <ExternalLink className="size-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 h-8 text-xs"
                          onClick={() => {
                            const now = new Date().toISOString();
                            const idea: ContentItem = {
                              id: `c-${Date.now()}`,
                              stage: "idea",
                              status: "draft",
                              title: source.title,
                              description: source.summary,
                              pillarIds: source.pillarIds,
                              segmentIds: [],
                              sourceUrl: source.url,
                              createdAt: now,
                              updatedAt: now,
                            };
                            onCreateIdeaFromSource?.(source);
                            toast.success("Idea created from source");
                          }}
                        >
                          <Lightbulb className="size-3" />
                          Create Idea
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 h-8 text-xs"
                          onClick={() => {
                            onCreateProductionFromSource?.(source);
                            toast.success("Starting production from source");
                          }}
                        >
                          <PenTool className="size-3" />
                          Start Production
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredSources.length === 0 && (
                <Card className="border-gray-100">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="size-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-muted-foreground">No sources found for this pillar.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Competitor Deep Dive */}
      {activeView === "competitors" && (
        <CompetitorDeepDive
          pillars={pillars}
          segments={segments}
          onAddContentItem={onAddContentItem}
          onNavigateToIdeation={onNavigateToIdeation}
        />
      )}

      {/* Content Repurposer */}
      {activeView === "repurposer" && (
        <ContentRepurposer
          pillars={pillars}
          segments={segments}
          onAddContentItem={onAddContentItem}
        />
      )}

      {/* Series Builder */}
      {activeView === "series" && (
        <ContentSeriesBuilder
          pillars={pillars}
          segments={segments}
          onAddContentItem={onAddContentItem}
          onNavigateToIdeation={onNavigateToIdeation}
        />
      )}

      {/* A/B Analyzer */}
      {activeView === "ab-analyzer" && (
        <ABAnalyzer
          pillars={pillars}
          segments={segments}
          onAddContentItem={onAddContentItem}
          context="strategy"
        />
      )}

      {/* SEO & Hashtags */}
      {activeView === "seo" && (
        <SocialSEOStrategy
          pillars={pillars}
          segments={segments}
          onAddContentItem={onAddContentItem}
        />
      )}

        </div>{/* end content area */}
      </div>{/* end flex row */}

    </div>
  );
}