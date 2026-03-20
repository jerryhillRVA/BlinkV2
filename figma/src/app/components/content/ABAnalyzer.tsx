import React, { useState } from "react";
import {
  FlaskConical,
  Sparkles,
  Loader2,
  Check,
  Copy,
  AlertTriangle,
  Bookmark,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ContentPillar, AudienceSegment, ContentItem, ABAnalysisResult } from "./types";

// ─── Props ───

interface ABAnalyzerProps {
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onAddContentItem?: (item: ContentItem) => void;
  variantA?: string;
  variantB?: string;
  onApplyCopy?: (copy: string) => void;
  context?: "strategy" | "builder";
}

// ─── Mock Data ───

const MOCK_AB_RESULT: ABAnalysisResult = {
  winner: "A",
  confidence: "High",
  verdict:
    "Variant A leads with a stronger pattern-break hook and clearer outcome promise. Variant B is warmer but buries the value.",
  variantA: {
    strengths: [
      "Immediate pattern-break in the first 5 words",
      "Clear outcome stated before any context",
    ],
    weaknesses: ["CTA is generic — 'save this' without specificity"],
    scores: { hook: 9, clarity: 8, emotion: 7, cta: 6 },
  },
  variantB: {
    strengths: [
      "Warmer, more conversational tone",
      "Specific audience callout ('if you're in your 40s')",
    ],
    weaknesses: [
      "Hook takes too long to get to the point",
      "Outcome is buried in the third sentence",
    ],
    scores: { hook: 6, clarity: 7, emotion: 9, cta: 7 },
  },
  improvedVersion:
    "Nobody tells active women this about training in perimenopause — and it's the reason your results stalled.\n\nIf you're in your 40s and doing everything right but seeing different results, this is for you.\n\nSwipe to see the 3 things that actually changed — and exactly what to adjust. →\n\nSave this. You'll want it.",
  improvementRationale:
    "Combined A's strong opening pattern-break with B's specific audience callout. Moved the outcome up to sentence two. Made the CTA specific ('you'll want it') rather than generic.",
};

const CONTENT_GOALS = [
  "Maximize Saves",
  "Maximize Comments",
  "Maximize Shares",
  "Maximize Follows",
  "Drive Link Clicks",
];

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
];

const SCORE_ROWS: { key: keyof ABAnalysisResult["variantA"]["scores"]; label: string }[] = [
  { key: "hook", label: "Hook Strength" },
  { key: "clarity", label: "Clarity" },
  { key: "emotion", label: "Emotional Resonance" },
  { key: "cta", label: "CTA Effectiveness" },
];

// ─── Component ───

export function ABAnalyzer({
  pillars: _pillars,
  segments: _segments,
  onAddContentItem,
  variantA: initA = "",
  variantB: initB = "",
  onApplyCopy,
  context = "strategy",
}: ABAnalyzerProps) {
  const [textA, setTextA] = useState(initA);
  const [textB, setTextB] = useState(initB);
  const [goal, setGoal] = useState(CONTENT_GOALS[0]);
  const [platform, setPlatform] = useState("instagram");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ABAnalysisResult | null>(null);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [ideaSaved, setIdeaSaved] = useState(false);
  const [copiedImproved, setCopiedImproved] = useState(false);

  const canAnalyze = textA.trim().length > 0 && textB.trim().length > 0;

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setResult(null);
    setIdeaSaved(false);
    setTitleError(false);

    setTimeout(() => {
      setResult(MOCK_AB_RESULT);
      // Pre-populate title from first line of improved version
      const firstLine = MOCK_AB_RESULT.improvedVersion.split("\n")[0].trim();
      setIdeaTitle(firstLine.length > 60 ? firstLine.slice(0, 60) + "…" : firstLine);
      setIsAnalyzing(false);
      toast.success("Analysis complete");
    }, 2500);
  };

  const handleCopyImproved = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.improvedVersion).catch(() => {});
    setCopiedImproved(true);
    setTimeout(() => setCopiedImproved(false), 2000);
  };

  const handleCreateIdea = () => {
    if (!result) return;
    const title = ideaTitle.trim();
    if (!title) {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    const now = new Date().toISOString();
    const item: ContentItem = {
      id: `c-ab-${Date.now()}`,
      stage: "idea",
      status: "draft",
      title,
      description: result.improvedVersion,
      pillarIds: [],
      segmentIds: [],
      createdAt: now,
      updatedAt: now,
    };
    onAddContentItem?.(item);
    setIdeaSaved(true);
    toast.success("Idea created from improved copy");
  };

  const handleUseVersion = () => {
    if (!result || !onApplyCopy) return;
    onApplyCopy(result.improvedVersion);
    toast.success("Copy applied to your content");
  };

  const confidenceBadgeClass = (c: ABAnalysisResult["confidence"]) => {
    if (c === "High") return "bg-green-100 text-green-700 border-green-200";
    if (c === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="space-y-5">

      {/* ─── Input Panel ─── */}
      <Card className="border-gray-100">
        <CardContent className="p-5 space-y-4">

          {/* Two-column textareas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Variant A */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px] font-bold px-1.5">
                  A
                </Badge>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Variant A
                </label>
                {textA && (
                  <button
                    onClick={() => setTextA("")}
                    className="ml-auto text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <Textarea
                  placeholder="Paste your hook, caption, or full copy..."
                  className="min-h-[140px] resize-none text-sm"
                  value={textA}
                  onChange={(e) => setTextA(e.target.value)}
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground pointer-events-none">
                  {textA.length.toLocaleString()} chars
                </span>
              </div>
            </div>

            {/* Variant B */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 text-[10px] font-bold px-1.5">
                  B
                </Badge>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Variant B
                </label>
                {textB && (
                  <button
                    onClick={() => setTextB("")}
                    className="ml-auto text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <Textarea
                  placeholder="Paste your hook, caption, or full copy..."
                  className="min-h-[140px] resize-none text-sm"
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground pointer-events-none">
                  {textB.length.toLocaleString()} chars
                </span>
              </div>
            </div>
          </div>

          {/* Goal + Platform + Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                Content Goal
              </label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_GOALS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                Platform
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end pb-0.5">
              <Button
                className="bg-[#d94e33] hover:bg-[#c4452d] text-white gap-2 h-9 mt-5"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FlaskConical className="size-4" />
                )}
                Analyze with AI
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Loading ─── */}
      {isAnalyzing && (
        <Card className="border-gray-100">
          <CardContent className="py-16 text-center">
            <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Analyzing your copy variants...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Scoring hook strength, clarity, resonance, and CTA effectiveness
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Empty State ─── */}
      {!isAnalyzing && !result && (
        <div className="py-20 text-center">
          <FlaskConical className="size-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            Paste two copy variants above and click Analyze with AI
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Get a scored breakdown of which hook or caption will perform better — and a combined improved version
          </p>
        </div>
      )}

      {/* ─── Output ─── */}
      {result && !isAnalyzing && (
        <div className="space-y-4">

          {/* Winner Banner */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-xl font-bold text-gray-900">
                      Variant {result.winner} Wins
                    </h2>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold", confidenceBadgeClass(result.confidence))}
                    >
                      {result.confidence} Confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.verdict}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div
                    className={cn(
                      "flex items-center justify-center size-10 rounded-full text-base font-bold border-2",
                      result.winner === "A"
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    )}
                  >
                    A
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center size-10 rounded-full text-base font-bold border-2",
                      result.winner === "B"
                        ? "bg-purple-100 text-purple-700 border-purple-300"
                        : "bg-gray-100 text-gray-400 border-gray-200"
                    )}
                  >
                    B
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 1 — Strengths & Weaknesses */}
          <Card className="border-gray-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Strengths &amp; Weaknesses
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Variant A */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-blue-100">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px] font-bold px-1.5">A</Badge>
                    <span className="text-xs font-bold text-blue-700">Variant A</span>
                  </div>
                  <div className="space-y-2">
                    {result.variantA.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className="size-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">{s}</span>
                      </div>
                    ))}
                    {result.variantA.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variant B */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-purple-100">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 text-[10px] font-bold px-1.5">B</Badge>
                    <span className="text-xs font-bold text-purple-700">Variant B</span>
                  </div>
                  <div className="space-y-2">
                    {result.variantB.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className="size-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">{s}</span>
                      </div>
                    ))}
                    {result.variantB.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-600">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Score Breakdown */}
          <Card className="border-gray-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Score Breakdown
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {/* Column headers */}
                <div className="flex items-center gap-3">
                  <span className="w-36 shrink-0" />
                  <div className="flex-1 flex items-center gap-1">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-[9px] font-bold px-1">A</Badge>
                    <span className="text-[10px] text-muted-foreground">out of 10</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 text-[9px] font-bold px-1">B</Badge>
                    <span className="text-[10px] text-muted-foreground">out of 10</span>
                  </div>
                </div>

                {SCORE_ROWS.map(({ key, label }) => {
                  const scoreA = result.variantA.scores[key];
                  const scoreB = result.variantB.scores[key];
                  const winnerA = scoreA >= scoreB;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-36 shrink-0">{label}</span>
                      {/* A bar */}
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              winnerA ? "bg-blue-500" : "bg-blue-200"
                            )}
                            style={{ width: `${(scoreA / 10) * 100}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-bold w-4 text-right tabular-nums",
                          winnerA ? "text-blue-700" : "text-blue-400"
                        )}>
                          {scoreA}
                        </span>
                      </div>
                      {/* B bar */}
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              !winnerA ? "bg-purple-500" : "bg-purple-200"
                            )}
                            style={{ width: `${(scoreB / 10) * 100}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-bold w-4 text-right tabular-nums",
                          !winnerA ? "text-purple-700" : "text-purple-400"
                        )}>
                          {scoreB}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Card 3 — Improved Version */}
          <Card className="border-gray-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#d94e33]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  AI-Combined Version
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">

              {/* Improved copy */}
              <div className="relative">
                <Textarea
                  value={result.improvedVersion}
                  readOnly
                  className="min-h-[120px] resize-none text-sm bg-gray-50 cursor-default"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-gray-700"
                  onClick={handleCopyImproved}
                  title="Copy to clipboard"
                >
                  {copiedImproved ? (
                    <Check className="size-3.5 text-green-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>

              {/* Rationale */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold">Why this works: </span>
                {result.improvementRationale}
              </p>

              {/* Context-specific action */}
              {context === "strategy" ? (
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Save as Idea
                  </p>
                  <Input
                    placeholder="Idea title..."
                    value={ideaTitle}
                    onChange={(e) => {
                      setIdeaTitle(e.target.value);
                      if (e.target.value.trim()) setTitleError(false);
                    }}
                    className={cn(
                      "h-8 text-sm border rounded",
                      titleError ? "border-red-400 focus-visible:ring-red-200" : ""
                    )}
                    disabled={ideaSaved}
                  />
                  {titleError && (
                    <p className="text-[10px] text-red-500">Add a title to save this idea</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "gap-1.5 h-8 text-xs transition-all",
                      ideaSaved
                        ? "border-green-300 text-green-700 bg-green-50 cursor-default"
                        : "border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5"
                    )}
                    onClick={() => !ideaSaved && handleCreateIdea()}
                    disabled={ideaSaved}
                  >
                    {ideaSaved ? (
                      <><Check className="size-3" /> Saved ✓</>
                    ) : (
                      <><Bookmark className="size-3" /> Create Idea with this copy →</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="pt-1 border-t border-gray-100">
                  <Button
                    className="bg-[#d94e33] hover:bg-[#c4452d] text-white gap-2 h-8 text-xs"
                    onClick={handleUseVersion}
                  >
                    <Check className="size-3.5" />
                    Use This Version
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
