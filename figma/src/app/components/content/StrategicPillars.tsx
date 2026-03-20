import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  Layers,
  Palette,
  Type,
  FileText,
  BarChart3,
  Loader2,
  Share2,
  Zap,
  ArrowRight,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { ContentPillar, AudienceSegment, InvestmentPlan, Platform, PillarGoal, BusinessObjective, ObjectiveCategory } from "./types";
import { PLATFORM_CONFIG } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StrategicPillarsProps {
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onUpdatePillars: (pillars: ContentPillar[]) => void;
  onSaveInvestmentPlan?: (plan: InvestmentPlan) => void;
  objectives?: BusinessObjective[];
}

const PILLAR_COLORS = [
  "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#f59e0b",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

const MOCK_INVESTMENT_PLAN: InvestmentPlan = {
  totalPostsPerWeek: 10,
  pillarAllocations: [
    { pillarId: "p1", postsPerWeek: 3, percentage: 30, rationale: "Top engagement driver for your segments" },
    { pillarId: "p3", postsPerWeek: 3, percentage: 30, rationale: "Highest save rate content type" },
    { pillarId: "p4", postsPerWeek: 2, percentage: 20, rationale: "Strongest share signal" },
    { pillarId: "p2", postsPerWeek: 1, percentage: 10, rationale: "Trust & credibility builder" },
    { pillarId: "p5", postsPerWeek: 1, percentage: 10, rationale: "Community & belonging driver" },
  ],
  platformAllocations: [
    { platform: "instagram", postsPerWeek: 6, rationale: "Primary platform for 88% of Active 40s segment" },
    { platform: "youtube", postsPerWeek: 3, rationale: "Long-form yoga content drives highest retention" },
    { platform: "tiktok", postsPerWeek: 1, rationale: "Discovery channel — test trending formats" },
  ],
  quickWins: [
    "You're underinvested in Yoga & Movement relative to your audience's #1 stated interest — shift 1 post/week from Nutrition",
    "Your Thriving 50s segment indexes heavily on YouTube — adding one long-form/week could unlock that audience",
    "Competitor analysis shows a gap in perimenopause fitness for active women — Fitness & Strength content here is underserved",
  ],
  generatedAt: new Date().toISOString(),
};

const BLANK_GOAL_FORM = { metric: "", target: "", unit: "%", period: "monthly" as PillarGoal["period"], current: "" };

export function StrategicPillars({ pillars, segments, onUpdatePillars, onSaveInvestmentPlan, objectives = [] }: StrategicPillarsProps) {
  const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null);
  const [showPillarDialog, setShowPillarDialog] = useState(false);
  const [pillarForm, setPillarForm] = useState({ name: "", description: "", color: PILLAR_COLORS[0] });

  // Goal state
  const [dialogGoals, setDialogGoals] = useState<PillarGoal[]>([]);
  const [dialogObjectiveIds, setDialogObjectiveIds] = useState<string[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState(BLANK_GOAL_FORM);
  const [isSuggestingGoals, setIsSuggestingGoals] = useState(false);

  // Distribution Analyzer state
  const [postsPerWeek, setPostsPerWeek] = useState<string>("");
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>(() => segments.map((s) => s.id));
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [investmentPlan, setInvestmentPlan] = useState<InvestmentPlan | null>(null);

  const handleSavePillar = () => {
    if (!pillarForm.name.trim()) {
      toast.error("Pillar name is required");
      return;
    }
    if (editingPillar) {
      onUpdatePillars(pillars.map((p) => (p.id === editingPillar.id ? { ...p, ...pillarForm, goals: dialogGoals, objectiveIds: dialogObjectiveIds } : p)));
      toast.success("Pillar updated");
    } else {
      const newPillar: ContentPillar = {
        id: `p-${Date.now()}`,
        ...pillarForm,
        goals: dialogGoals,
        objectiveIds: dialogObjectiveIds,
      };
      onUpdatePillars([...pillars, newPillar]);
      toast.success("Pillar created");
    }
    setShowPillarDialog(false);
    setEditingPillar(null);
    setPillarForm({ name: "", description: "", color: PILLAR_COLORS[0] });
    setDialogGoals([]);
    setDialogObjectiveIds([]);
    setShowGoalForm(false);
    setGoalForm(BLANK_GOAL_FORM);
  };

  const handleSaveGoal = () => {
    if (!goalForm.metric.trim() || !goalForm.target) return;
    const newGoal: PillarGoal = {
      id: `g-${Date.now()}`,
      metric: goalForm.metric.trim(),
      target: parseFloat(goalForm.target),
      unit: goalForm.unit,
      period: goalForm.period,
      current: goalForm.current ? parseFloat(goalForm.current) : undefined,
    };
    setDialogGoals((prev) => [...prev, newGoal]);
    setGoalForm(BLANK_GOAL_FORM);
    setShowGoalForm(false);
  };

  const handleSuggestGoals = () => {
    setIsSuggestingGoals(true);
    setTimeout(() => {
      const pillarName = pillarForm.name || "this pillar";
      const suggested: PillarGoal[] = [
        { id: `g-${Date.now()}-1`, metric: "Engagement Rate", target: 5, unit: "%", period: "monthly" },
        { id: `g-${Date.now()}-2`, metric: "Posts Published", target: 12, unit: "posts", period: "monthly" },
      ];
      setDialogGoals((prev) => [...prev, ...suggested]);
      setIsSuggestingGoals(false);
      toast.success("Goals suggested — review and adjust");
    }, 2500);
  };

  const handleDeletePillar = (id: string) => {
    onUpdatePillars(pillars.filter((p) => p.id !== id));
    toast.success("Pillar deleted");
  };

  const handleEditPillar = (pillar: ContentPillar) => {
    setEditingPillar(pillar);
    setPillarForm({ name: pillar.name, description: pillar.description, color: pillar.color });
    setDialogGoals(pillar.goals ? [...pillar.goals] : []);
    setDialogObjectiveIds(pillar.objectiveIds ? [...pillar.objectiveIds] : []);
    setShowGoalForm(false);
    setGoalForm(BLANK_GOAL_FORM);
    setShowPillarDialog(true);
  };

  const toggleSegment = (id: string) => {
    setSelectedSegmentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleOptimizeDistribution = () => {
    const total = parseInt(postsPerWeek, 10);
    if (!total || total < 1) return;
    setIsOptimizing(true);
    setTimeout(() => {
      const scale = total / MOCK_INVESTMENT_PLAN.totalPostsPerWeek;
      const scaledPillarAllocations = MOCK_INVESTMENT_PLAN.pillarAllocations
        .map((pa) => ({ ...pa, postsPerWeek: Math.round(pa.postsPerWeek * scale) }))
        .filter((pa) => pa.postsPerWeek > 0)
        .map((pa) => ({ ...pa, percentage: Math.round((pa.postsPerWeek / total) * 100) }));
      const scaledPlatformAllocations = MOCK_INVESTMENT_PLAN.platformAllocations.map((pa) => ({
        ...pa,
        postsPerWeek: Math.max(0, Math.round(pa.postsPerWeek * scale)),
      })).filter((pa) => pa.postsPerWeek > 0);
      const plan: InvestmentPlan = {
        ...MOCK_INVESTMENT_PLAN,
        totalPostsPerWeek: total,
        pillarAllocations: scaledPillarAllocations,
        platformAllocations: scaledPlatformAllocations,
        selectedSegmentIds,
        generatedAt: new Date().toISOString(),
      };
      setInvestmentPlan(plan);
      onSaveInvestmentPlan?.(plan);
      setIsOptimizing(false);
      toast.success("Distribution analysis complete");
    }, 2500);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#d94e33]/10">
            <Layers className="size-4 text-[#d94e33]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Content Pillars</h3>
            <p className="text-xs text-muted-foreground">Core wellness themes for Hive Collective's mission to support women 40+</p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-[#d94e33] hover:bg-[#c4452d] h-8 gap-1"
          onClick={() => {
            setEditingPillar(null);
            setPillarForm({ name: "", description: "", color: PILLAR_COLORS[pillars.length % PILLAR_COLORS.length] });
            setDialogGoals([]);
            setDialogObjectiveIds([]);
            setShowGoalForm(false);
            setGoalForm(BLANK_GOAL_FORM);
            setShowPillarDialog(true);
          }}
        >
          <Plus className="size-3" /> Add Pillar
        </Button>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pillars.map((pillar) => (
          <Card key={pillar.id} className="border-gray-100 group hover:border-gray-200 transition-colors overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: pillar.color }} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />
                    <h4 className="font-bold text-sm text-gray-900 truncate">{pillar.name}</h4>
                    {pillar.objectiveIds && pillar.objectiveIds.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#d94e33]/10 text-[#d94e33] shrink-0">
                        {pillar.objectiveIds.length} obj
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{pillar.description}</p>
                  {/* Goals */}
                  {pillar.goals && pillar.goals.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {pillar.goals.map((goal) => {
                        const pct = goal.current !== undefined ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
                        return (
                          <div key={goal.id}>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                              <span className="font-medium">{goal.metric}</span>
                              <span>{goal.current !== undefined ? `${goal.current} / ` : ""}{goal.target} {goal.unit} ({goal.period})</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pillar.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <button
                      className="mt-2 text-[10px] text-muted-foreground hover:text-[#d94e33] transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleEditPillar(pillar); setShowGoalForm(true); }}
                    >
                      + Add Goal
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-[#d94e33]"
                    onClick={() => handleEditPillar(pillar)}
                  >
                    <Edit3 className="size-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeletePillar(pillar.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Content Distribution Analysis ── */}
      <div className="mt-8">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-[#d94e33]/10">
            <BarChart3 className="size-4 text-[#d94e33]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Content Distribution Analysis</h3>
            <p className="text-xs text-muted-foreground">AI-recommended effort distribution across your content pillars</p>
          </div>
        </div>

        {/* Input row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="sm:w-36 shrink-0">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Posts per week</label>
            <input
              type="number"
              min={1}
              max={50}
              value={postsPerWeek}
              onChange={(e) => setPostsPerWeek(e.target.value)}
              placeholder="e.g. 10"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Audience Focus</label>
            <div className="flex flex-wrap gap-1.5">
              {segments.map((seg) => {
                const active = selectedSegmentIds.includes(seg.id);
                return (
                  <button
                    key={seg.id}
                    onClick={() => toggleSegment(seg.id)}
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      active
                        ? "bg-[#d94e33]/10 border-[#d94e33] text-[#d94e33]"
                        : "bg-white border-gray-200 text-muted-foreground hover:border-gray-300"
                    )}
                  >
                    {seg.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-end shrink-0">
            <button
              onClick={handleOptimizeDistribution}
              disabled={!postsPerWeek || parseInt(postsPerWeek, 10) < 1 || isOptimizing}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium text-white bg-[#d94e33] hover:bg-[#c4452d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isOptimizing ? (
                <><Loader2 className="size-3.5 animate-spin" /> Analyzing...</>
              ) : (
                <><BarChart3 className="size-3.5" /> Analyze Distribution</>
              )}
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!isOptimizing && !investmentPlan && (
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
            <BarChart3 className="size-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Enter your weekly posting volume to get a recommended distribution across your content pillars</p>
          </div>
        )}

        {/* Loading state */}
        {isOptimizing && (
          <div className="rounded-lg border border-gray-100 p-8 text-center">
            <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing your content distribution...</p>
          </div>
        )}

        {/* Output */}
        {!isOptimizing && investmentPlan && (
          <div className="space-y-4">
            {/* Pillar Distribution */}
            <div className="space-y-2">
              {/* Column headers */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-36 shrink-0">Pillar</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex-1">Recommended Distribution</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-20 shrink-0 text-right">Posts/Week</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-44 shrink-0">Rationale</span>
              </div>

              {/* Rows */}
              {investmentPlan.pillarAllocations.map((alloc) => {
                const pillar = pillars.find((p) => p.id === alloc.pillarId);
                if (!pillar) return null;
                return (
                  <div key={alloc.pillarId} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-36 shrink-0">
                      <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />
                      <span className="text-xs font-medium text-gray-700 truncate">{pillar.name}</span>
                    </div>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${alloc.percentage}%`,
                          backgroundColor: pillar.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-20 shrink-0 text-right">{alloc.postsPerWeek} posts/wk</span>
                    <span className="text-xs text-muted-foreground w-44 shrink-0">{alloc.rationale}</span>
                  </div>
                );
              })}

              {/* Legend */}
              <p className="text-xs text-muted-foreground pt-1">Bar width represents % of weekly posts recommended per pillar</p>
            </div>

            {/* Platform Split */}
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/70 border-b border-gray-100">
                <Share2 className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Platform Split</span>
              </div>
              <div className="divide-y divide-gray-50">
                {investmentPlan.platformAllocations.map((pa) => (
                  <div key={pa.platform} className="flex items-center gap-3 px-4 py-3">
                    <span className={cn("text-xs font-bold capitalize w-20 shrink-0", PLATFORM_CONFIG[pa.platform as Platform]?.color)}>
                      {PLATFORM_CONFIG[pa.platform as Platform]?.label ?? pa.platform}
                    </span>
                    <span className="text-sm font-bold text-gray-900 w-24 shrink-0">{pa.postsPerWeek} posts/wk</span>
                    <span className="text-xs text-muted-foreground">{pa.rationale}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins */}
            <div className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/70 border-b border-gray-100">
                <Zap className="size-3.5 text-[#d94e33]" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Wins</span>
              </div>
              <div className="p-4 space-y-3">
                {investmentPlan.quickWins.map((win, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className="size-3.5 text-[#d94e33] mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-700">{win}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pillar Dialog */}
      <Dialog open={showPillarDialog} onOpenChange={setShowPillarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPillar ? "Edit Pillar" : "New Content Pillar"}</DialogTitle>
            <DialogDescription>
              {editingPillar ? "Update your content pillar information" : "Create a strategic content pillar to categorize your content"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Type className="size-3" /> Name
              </Label>
              <Input
                value={pillarForm.name}
                onChange={(e) => setPillarForm({ ...pillarForm, name: e.target.value })}
                placeholder="e.g. Yoga & Movement"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FileText className="size-3" /> Description
              </Label>
              <Textarea
                value={pillarForm.description}
                onChange={(e) => setPillarForm({ ...pillarForm, description: e.target.value })}
                placeholder="Describe this content pillar..."
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Palette className="size-3" /> Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {PILLAR_COLORS.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "size-8 rounded-full border-2 transition-all flex items-center justify-center",
                      pillarForm.color === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setPillarForm({ ...pillarForm, color: c })}
                  >
                    {pillarForm.color === c && <Check className="size-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            {/* Linked Objectives section */}
            {objectives.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Target className="size-3" /> Linked Objectives
                </Label>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((obj) => {
                    const isLinked = dialogObjectiveIds.includes(obj.id);
                    return (
                      <button
                        key={obj.id}
                        type="button"
                        onClick={() => setDialogObjectiveIds((prev) =>
                          prev.includes(obj.id) ? prev.filter((id) => id !== obj.id) : [...prev, obj.id]
                        )}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full border transition-all max-w-[180px] truncate",
                          isLinked
                            ? "border-[#d94e33] bg-[#d94e33]/10 text-[#d94e33] font-medium"
                            : "border-gray-200 text-muted-foreground hover:border-gray-300"
                        )}
                        title={obj.statement}
                      >
                        {obj.statement.length > 38 ? obj.statement.slice(0, 38) + "…" : obj.statement || "(untitled)"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Goals section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Target className="size-3" /> Goals
                </Label>
                <button
                  type="button"
                  className="text-[10px] text-[#d94e33] flex items-center gap-1 hover:underline disabled:opacity-50"
                  onClick={handleSuggestGoals}
                  disabled={isSuggestingGoals}
                >
                  {isSuggestingGoals ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                  AI Suggest Goals
                </button>
              </div>
              {/* Existing goals list */}
              {dialogGoals.length > 0 && (
                <div className="space-y-1.5">
                  {dialogGoals.map((g) => (
                    <div key={g.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2.5 py-1.5">
                      <span className="font-medium text-gray-700">{g.metric}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{g.target} {g.unit} / {g.period}</span>
                        <button onClick={() => setDialogGoals((prev) => prev.filter((dg) => dg.id !== g.id))}>
                          <X className="size-3 hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Add goal form */}
              {showGoalForm ? (
                <div className="border rounded-md p-3 space-y-2 bg-gray-50">
                  <Input
                    placeholder="Metric name (e.g. Engagement Rate)"
                    value={goalForm.metric}
                    onChange={(e) => setGoalForm({ ...goalForm, metric: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Target"
                      value={goalForm.target}
                      onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Unit (%, followers…)"
                      value={goalForm.unit}
                      onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={goalForm.period} onValueChange={(v) => setGoalForm({ ...goalForm, period: v as PillarGoal["period"] })}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Current (optional)"
                      value={goalForm.current}
                      onChange={(e) => setGoalForm({ ...goalForm, current: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs bg-[#d94e33] hover:bg-[#c4452d]" onClick={handleSaveGoal}>Save</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowGoalForm(false); setGoalForm(BLANK_GOAL_FORM); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-[#d94e33] flex items-center gap-1"
                  onClick={() => setShowGoalForm(true)}
                >
                  <Plus className="size-3" /> Add Goal
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPillarDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-[#d94e33] hover:bg-[#c4452d]" onClick={handleSavePillar}>
              {editingPillar ? "Update" : "Create"} Pillar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
