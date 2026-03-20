import React, { useState } from "react";
import {
  Eye,
  Sparkles,
  Loader2,
  Plus,
  ChevronDown,
  Trash2,
  RefreshCw,
  Brain,
  Instagram,
  Youtube,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Collapsible, CollapsibleContent } from "@/app/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/app/components/ui/tooltip";
import type { ContentPillar, AudienceSegment, Platform, CompetitorInsight, ContentItem, CompetitorIntel } from "./types";
import { MOCK_COMPETITOR_INSIGHTS, PLATFORM_CONFIG } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_COMPETITOR_INTEL: CompetitorIntel = {
  handle: "@drmaryClairehaver",
  platform: "tiktok",
  analyzedAt: new Date().toISOString(),
  positioning: {
    brandVoice: "Clinical + Empowering",
    primaryMessage: "Menopause doesn't have to derail your life — science can help.",
    messagingHierarchy: [
      "1. Bust menopause myths with medical authority",
      "2. Give actionable protocol-level advice",
      "3. Validate shared frustration with traditional healthcare",
    ],
    targetAudience: "Women 45-60 frustrated with traditional OB-GYN menopause guidance",
  },
  contentStrategy: {
    topFormat: "60-second talking head with bold on-screen text",
    postingFrequency: "5x per week",
    hookStyle: "Myth-busting opener ('Everyone thinks X, but actually...')",
    ctaPattern: "Save this + follow for more + link in bio for free guide",
    engagementSignal: "Very High",
  },
  gaps: {
    uncoveredAngles: [
      "Movement and yoga as menopause symptom management — almost no fitness content",
      "Community and emotional support angle — purely informational, no vulnerability",
      "Perimenopause for active women in their early 40s — skews toward 50s audience",
    ],
    missedPainPoints: [
      "Women who are already fitness-focused and don't know why their routine stopped working",
      "The intersection of career peak years + hormonal change — energy management at work",
    ],
    counterStrategy:
      "Position Hive Collective as the movement-first complement to medical menopause content. Where Dr. Haver owns 'understand your hormones,' own 'move with your hormones.' Lead with active women in their early 40s who are already fit but confused — this audience is underserved and highly engaged.",
  },
};

interface CompetitorDeepDiveProps {
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onAddContentItem?: (item: ContentItem) => void;
  onNavigateToIdeation: () => void;
}

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

const engagementBadgeClass = (signal: string) => {
  if (signal === "Very High") return "bg-green-100 text-green-700 border-green-200";
  if (signal === "High") return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const relevancyBadgeClass = (level: "Very High" | "High" | "Medium") => {
  if (level === "Very High") return "text-red-700 bg-red-50 border-red-200";
  if (level === "High") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-gray-700 bg-gray-50 border-gray-200";
};

const RELEVANCY_TOOLTIPS: Record<"Very High" | "High" | "Medium", string> = {
  "Very High": "Direct overlap in audience, content pillars, and posting strategy. Watch closely.",
  "High": "Significant overlap in audience or content type. Worth monitoring.",
  "Medium": "Some overlap, but different enough to serve as a reference point rather than a direct competitor.",
};

export function CompetitorDeepDive({
  pillars: _pillars,
  segments: _segments,
  onAddContentItem: _onAddContentItem,
  onNavigateToIdeation,
}: CompetitorDeepDiveProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [competitorInsights, setCompetitorInsights] = useState<CompetitorInsight[]>(MOCK_COMPETITOR_INSIGHTS);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [newCompetitorPlatform, setNewCompetitorPlatform] = useState<Platform>("instagram");
  const [isAIFinding, setIsAIFinding] = useState(false);

  const randomRelevancy = (): "Very High" | "High" | "Medium" => {
    const levels = ["Very High", "High", "Medium"] as const;
    return levels[Math.floor(Math.random() * levels.length)];
  };

  const updateCompetitor = (id: string, updates: Partial<CompetitorInsight>) => {
    setCompetitorInsights((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleRunIntelForCompetitor = (id: string) => {
    const ci = competitorInsights.find((c) => c.id === id);
    if (!ci) return;
    updateCompetitor(id, { isRunningIntel: true, intelOpen: true });
    setTimeout(() => {
      updateCompetitor(id, {
        isRunningIntel: false,
        intel: {
          ...MOCK_COMPETITOR_INTEL,
          handle: ci.competitor,
          platform: ci.platform,
          analyzedAt: new Date().toISOString(),
        },
      });
      toast.success("Competitor Intel ready");
    }, 2500);
  };

  const handleRefreshIntel = (id: string) => {
    const ci = competitorInsights.find((c) => c.id === id);
    if (!ci) return;
    updateCompetitor(id, { isRunningIntel: true });
    setTimeout(() => {
      updateCompetitor(id, {
        isRunningIntel: false,
        intel: {
          ...MOCK_COMPETITOR_INTEL,
          handle: ci.competitor,
          platform: ci.platform,
          analyzedAt: new Date().toISOString(),
        },
      });
      toast.success("Intel refreshed");
    }, 2500);
  };

  const handleToggleIntel = (id: string) => {
    setCompetitorInsights((prev) =>
      prev.map((c) => (c.id === id ? { ...c, intelOpen: !c.intelOpen } : c))
    );
  };

  const handleDeleteCompetitor = (id: string) => {
    setCompetitorInsights((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAIFindCompetitors = () => {
    setIsAIFinding(true);
    setTimeout(() => {
      const found: CompetitorInsight[] = [
        {
          id: `ci-found-${Date.now()}-1`,
          competitor: "Sydney Cummings Houdyshell",
          platform: "youtube",
          contentType: "Long-form workout",
          topic: "Full-length structured workout programs",
          relevancyLevel: "High",
          frequency: "5x/week",
          insight: "Structured workout programs with strong progression arcs. Highly loyal community of women 35-50 seeking guided home fitness.",
        },
        {
          id: `ci-found-${Date.now()}-2`,
          competitor: "@sarahs_day",
          platform: "instagram",
          contentType: "Lifestyle + Fitness",
          topic: "Holistic wellness & morning routines",
          relevancyLevel: "Medium",
          frequency: "Daily",
          insight: "Aspirational lifestyle content blending fitness, nutrition, and wellbeing. Appeals to women seeking a complete healthy lifestyle identity.",
        },
        {
          id: `ci-found-${Date.now()}-3`,
          competitor: "@obeyoga",
          platform: "instagram",
          contentType: "Yoga tutorials",
          topic: "Accessible yoga for all body types",
          relevancyLevel: "Very High",
          frequency: "4x/week",
          insight: "Highly accessible yoga content with strong body-positive messaging. Directly overlaps with Active 40s and Yoga Enthusiast segments.",
        },
      ];
      setCompetitorInsights((prev) => [...prev, ...found]);
      setIsAIFinding(false);
      toast.success("Found 3 new competitors");
    }, 2500);
  };

  const handleAddCompetitor = () => {
    if (!newCompetitorName.trim()) return;
    const newCi: CompetitorInsight = {
      id: `ci-${Date.now()}`,
      competitor: newCompetitorName.trim(),
      platform: newCompetitorPlatform,
      contentType: "Not yet analyzed",
      topic: "Not yet analyzed — run AI scan to populate",
      relevancyLevel: randomRelevancy(),
      frequency: "Not yet analyzed — run AI scan to populate",
      insight: "Not yet analyzed — run AI scan to populate",
    };
    setCompetitorInsights((prev) => [...prev, newCi]);
    setNewCompetitorName("");
    setNewCompetitorPlatform("instagram");
    setShowAddCompetitor(false);
    toast.success("Competitor added");
  };

  const handleCreateIdeaFromGap = (gapText: string, counterStrategy?: string, handle?: string) => {
    const now = new Date().toISOString();
    const _idea: ContentItem = {
      id: `c-${Date.now()}`,
      stage: "idea",
      status: "draft",
      title: gapText,
      description: counterStrategy || "",
      pillarIds: [],
      segmentIds: [],
      sourceUrl: handle,
      createdAt: now,
      updatedAt: now,
    };
    toast.success("Idea created from competitor gap");
    onNavigateToIdeation();
  };

  return (
    <div className="space-y-6">

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-9 self-start"
            onClick={() => {
              setIsAnalyzing(true);
              setTimeout(() => {
                setIsAnalyzing(false);
                toast.success("AI competitor analysis complete!");
              }, 2500);
            }}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
            AI Competitor Scan
          </Button>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Refresh tracked competitor activity across all monitored accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={handleAIFindCompetitors}
            disabled={isAIFinding}
          >
            {isAIFinding ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            AI Find Competitors
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowAddCompetitor(true)}
          >
            <Plus className="size-3" /> Add Competitor
          </Button>
        </div>
      </div>

      {/* Add Competitor inline form */}
      {showAddCompetitor && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Competitor</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Competitor name or @handle"
                value={newCompetitorName}
                onChange={(e) => setNewCompetitorName(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Select value={newCompetitorPlatform} onValueChange={(v) => setNewCompetitorPlatform(v as Platform)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["instagram", "tiktok", "youtube", "linkedin", "facebook"] as Platform[]).map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_CONFIG[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#d94e33] hover:bg-[#c4452d]" onClick={handleAddCompetitor}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowAddCompetitor(false); setNewCompetitorName(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitor Cards */}
      {isAnalyzing ? (
        <Card className="border-gray-100">
          <CardContent className="py-16 text-center">
            <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Scanning competitor activity...</p>
            <p className="text-xs text-muted-foreground mt-1">Analyzing content strategies, engagement patterns, and opportunities</p>
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {competitorInsights.map((ci) => (
              <Card key={ci.id} className="border-gray-100 hover:border-gray-200 transition-colors">
                <CardContent className="p-4">

                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{ci.competitor}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <PlatformIcon platform={ci.platform} />
                        <span className="text-xs text-muted-foreground">{PLATFORM_CONFIG[ci.platform].label}</span>
                        <span className="text-[10px] text-muted-foreground">|</span>
                        <span className="text-xs text-muted-foreground">{ci.contentType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">Relevancy:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-bold cursor-default", relevancyBadgeClass(ci.relevancyLevel))}
                          >
                            {ci.relevancyLevel}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[200px]">
                          <p className="text-xs">{RELEVANCY_TOOLTIPS[ci.relevancyLevel]}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => updateCompetitor(ci.id, { deleteConfirm: true })}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {ci.deleteConfirm && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 mb-3">
                      <p className="text-xs text-red-700 flex-1">Remove this competitor?</p>
                      <Button size="sm" variant="destructive" className="h-6 text-xs px-2" onClick={() => handleDeleteCompetitor(ci.id)}>Confirm</Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => updateCompetitor(ci.id, { deleteConfirm: false })}>Cancel</Button>
                    </div>
                  )}

                  {/* Card body */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Topic</span>
                      <p className="text-xs text-gray-700">{ci.topic}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Frequency</span>
                      <p className="text-xs text-gray-700">{ci.frequency}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#d94e33]/5 to-orange-50 border border-[#d94e33]/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#d94e33] flex items-center gap-1">
                        <Sparkles className="size-3" /> AI Insight
                      </span>
                      <p className="text-xs text-gray-700 mt-1">{ci.insight}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5 gap-1.5 text-xs"
                      disabled={ci.isRunningIntel}
                      onClick={() => handleRunIntelForCompetitor(ci.id)}
                    >
                      {ci.isRunningIntel ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                      Run Teardown →
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 text-xs hover:border-[#d94e33] hover:text-[#d94e33]"
                      onClick={() => {
                        if (!ci.intelOpen && !ci.intel && !ci.isRunningIntel) {
                          handleRunIntelForCompetitor(ci.id);
                        } else {
                          handleToggleIntel(ci.id);
                        }
                      }}
                    >
                      <Brain className="size-3.5 text-[#d94e33]" />
                      <span>{ci.intelOpen ? "Hide Intel" : "View Intel"}</span>
                      <ChevronDown className={cn("size-3.5 ml-auto transition-transform", ci.intelOpen && "rotate-180")} />
                    </Button>
                  </div>

                  {/* Intel content */}
                  <Collapsible open={ci.intelOpen}>
                    <CollapsibleContent>
                      <div className="mt-3 space-y-3">
                        {ci.isRunningIntel ? (
                          <div className="py-8 text-center">
                            <Loader2 className="size-6 text-[#d94e33] animate-spin mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Analyzing competitor...</p>
                          </div>
                        ) : ci.intel ? (
                          <>
                            {/* Freshness row */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">
                                Last updated {new Date(ci.intel.analyzedAt).toLocaleDateString()}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-5 text-muted-foreground hover:text-gray-900"
                                onClick={() => handleRefreshIntel(ci.id)}
                              >
                                <RefreshCw className="size-3" />
                              </Button>
                            </div>

                            {/* Positioning */}
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Positioning</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">Brand Voice</span>
                                <Badge variant="outline" className="text-[9px]">{ci.intel.positioning.brandVoice}</Badge>
                              </div>
                              <p className="text-xs text-gray-700">{ci.intel.positioning.primaryMessage}</p>
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-1">Targeting</p>
                                <p className="text-xs text-gray-700">{ci.intel.positioning.targetAudience}</p>
                              </div>
                            </div>

                            {/* Content Strategy */}
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Content Strategy</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Top Format</p>
                                  <p className="text-xs text-gray-700">{ci.intel.contentStrategy.topFormat}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Frequency</p>
                                  <p className="text-xs text-gray-700">{ci.intel.contentStrategy.postingFrequency}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Hook Style</p>
                                  <p className="text-xs text-gray-700">{ci.intel.contentStrategy.hookStyle}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">CTA Pattern</p>
                                  <p className="text-xs text-gray-700">{ci.intel.contentStrategy.ctaPattern}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">Engagement</span>
                                <Badge variant="outline" className={cn("text-[9px]", engagementBadgeClass(ci.intel.contentStrategy.engagementSignal))}>
                                  {ci.intel.contentStrategy.engagementSignal}
                                </Badge>
                              </div>
                            </div>

                            {/* Content Gaps — brand-accented */}
                            <div className="rounded-lg border border-[#d94e33]/20 bg-gradient-to-br from-[#d94e33]/5 to-orange-50 p-3 space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#d94e33] flex items-center gap-1">
                                <Sparkles className="size-3" /> Content Gaps & Opportunities
                              </p>
                              <ul className="space-y-1.5">
                                {ci.intel.gaps.uncoveredAngles.map((angle, i) => (
                                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                    <span className="mt-1.5 size-1.5 rounded-full bg-[#d94e33] flex-shrink-0" />
                                    {angle}
                                  </li>
                                ))}
                                {ci.intel.gaps.missedPainPoints.map((point, i) => (
                                  <li key={`mp-${i}`} className="text-xs text-gray-700 flex items-start gap-1.5">
                                    <span className="mt-1.5 size-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                              <p className="text-xs text-gray-600 pt-1 border-t border-[#d94e33]/10">{ci.intel.gaps.counterStrategy}</p>
                            </div>

                            {/* AI Recommended Actions */}
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">AI Recommended Actions</p>
                              {ci.intel.gaps.uncoveredAngles.map((angle, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                                  <p className="text-xs text-gray-700 flex-1">{angle}</p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5 flex-shrink-0 h-6 text-[10px] px-2"
                                    onClick={() => handleCreateIdeaFromGap(angle, ci.intel?.gaps.counterStrategy, ci.competitor)}
                                  >
                                    Create Idea →
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                </CardContent>
              </Card>
            ))}
          </div>
        </TooltipProvider>
      )}

    </div>
  );
}
