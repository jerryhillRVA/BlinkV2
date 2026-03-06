import React, { useState } from "react";
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
  ChevronRight,
  Layers,
  Lightbulb,
  PenTool,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { ContentPillar, AudienceSegment, Platform, AudienceInsight, CompetitorInsight, ResearchSource, ContentItem } from "./types";
import { MOCK_AUDIENCE_INSIGHTS, MOCK_COMPETITOR_INSIGHTS, MOCK_RESEARCH_SOURCES, PLATFORM_CONFIG } from "./types";
import { PillarsSegments } from "./PillarsSegments";
import { StrategicPillars } from "./StrategicPillars";
import { AudienceSegments } from "./AudienceSegments";
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
}

type StrategyView = "pillars" | "audience" | "research" | "competitors";

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
}: StrategyResearchProps) {
  const [activeView, setActiveView] = useState<StrategyView>("audience");
  const [selectedSegment, setSelectedSegment] = useState<string>(segments[0]?.id || "");
  const [selectedPillar, setSelectedPillar] = useState<string>("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>(MOCK_AUDIENCE_INSIGHTS);
  const [researchSources, setResearchSources] = useState<ResearchSource[]>(MOCK_RESEARCH_SOURCES);
  const [competitorInsights, setCompetitorInsights] = useState<CompetitorInsight[]>(MOCK_COMPETITOR_INSIGHTS);

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

  const views = [
    { id: "pillars" as const, label: "Strategic Pillars", icon: Layers },
    { id: "audience" as const, label: "Audience", icon: Users },
    { id: "research" as const, label: "Research Sources", icon: BookOpen },
    { id: "competitors" as const, label: "Competitor Audit", icon: Eye },
  ];

  const sourceTypeConfig: Record<string, { color: string; bg: string }> = {
    article: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    report: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
    social: { color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
    news: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    video: { color: "text-red-700", bg: "bg-red-50 border-red-200" },
  };

  return (
    <div className="space-y-6">
      {/* Strategy Views */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px overflow-x-auto">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = activeView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all relative whitespace-nowrap",
                isActive ? "text-[#d94e33]" : "text-muted-foreground hover:text-gray-700"
              )}
            >
              <Icon className={cn("size-4", isActive ? "text-[#d94e33]" : "opacity-60")} />
              {v.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d94e33] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Pillars & Segments */}
      {activeView === "pillars" && (
        <StrategicPillars
          pillars={pillars}
          onUpdatePillars={onUpdatePillars}
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

      {/* Competitor Audit */}
      {activeView === "competitors" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 h-9"
              onClick={() => handleAIAnalyze("competitor")}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Eye className="size-3.5" />
              )}
              AI Competitor Scan
            </Button>
          </div>

          {isAnalyzing ? (
            <Card className="border-gray-100">
              <CardContent className="py-16 text-center">
                <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700">Scanning competitor activity...</p>
                <p className="text-xs text-muted-foreground mt-1">Analyzing content strategies, engagement patterns, and opportunities</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {competitorInsights.map((ci) => (
                <Card key={ci.id} className="border-gray-100 hover:border-gray-200 transition-colors">
                  <CardContent className="p-4">
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
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold",
                          ci.engagement.includes("Very High") ? "text-green-700 bg-green-50 border-green-200" :
                          ci.engagement.includes("High") ? "text-blue-700 bg-blue-50 border-blue-200" :
                          "text-gray-700 bg-gray-50 border-gray-200"
                        )}
                      >
                        {ci.engagement}
                      </Badge>
                    </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA to move to next step */}
      <Card className="border-[#d94e33]/20 bg-gradient-to-r from-[#d94e33]/5 to-orange-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">Ready to create content from your research?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Move to Ideation & Planning to start capturing ideas and building your editorial calendar.</p>
          </div>
          <Button
            size="sm"
            className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 shrink-0"
            onClick={onNavigateToIdeation}
          >
            Go to Ideation <ChevronRight className="size-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}