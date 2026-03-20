import React, { useState } from "react";
import {
  Hash,
  Loader2,
  Copy,
  Check,
  CheckCircle,
  User,
  ListChecks,
  TrendingUp,
  Zap,
  Bookmark,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ContentPillar, AudienceSegment, ContentItem, SEOStrategy } from "./types";

// ─── Props ───

interface SocialSEOStrategyProps {
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onAddContentItem?: (item: ContentItem) => void;
  activeContentItem?: ContentItem;
  onUpdateContentItem?: (item: ContentItem) => void;
}

// ─── Mock Data ───

const MOCK_SEO_STRATEGY: SEOStrategy = {
  platform: "instagram",
  pillarId: "p1",
  goal: "Discoverability",
  generatedAt: new Date().toISOString(),
  hashtagSets: {
    reach: [
      { tag: "#yoga", estimatedPosts: "120M" },
      { tag: "#fitness", estimatedPosts: "500M" },
      { tag: "#wellness", estimatedPosts: "80M" },
      { tag: "#womenshealth", estimatedPosts: "15M" },
      { tag: "#healthylifestyle", estimatedPosts: "95M" },
    ],
    niche: [
      { tag: "#yogaover40", estimatedPosts: "820K" },
      { tag: "#womenover40fitness", estimatedPosts: "1.2M" },
      { tag: "#perimenopausehealth", estimatedPosts: "450K" },
      { tag: "#midlifewellness", estimatedPosts: "380K" },
      { tag: "#yogaforwomen", estimatedPosts: "2.1M" },
      { tag: "#over40andfit", estimatedPosts: "670K" },
    ],
    community: [
      { tag: "#hivecollective", estimatedPosts: "Under 10K" },
      { tag: "#women40plus", estimatedPosts: "48K" },
      { tag: "#yogamidlife", estimatedPosts: "22K" },
      { tag: "#perimenopauseyoga", estimatedPosts: "15K" },
      { tag: "#thriving40s", estimatedPosts: "31K" },
    ],
  },
  bioKeywords: [
    "yoga for women 40+",
    "perimenopause fitness",
    "midlife wellness",
    "women's strength training",
    "hormone health yoga",
    "menopause movement",
  ],
  searchIntents: [
    "Women searching for yoga routines safe for perimenopause",
    "Active women 40+ looking for community and expert guidance",
    "Women frustrated with generic fitness advice who want age-specific protocols",
  ],
  exampleBio:
    "🧘‍♀️ Yoga & movement for women 40+ | Perimenopause-friendly fitness | Hive Collective community | Weekly flows + wellness tips ↓",
  captionChecklist: [
    {
      label: "Open with primary keyword",
      tip: "Include 'yoga for women 40+' or 'perimenopause fitness' in your first sentence",
    },
    {
      label: "Use keyword naturally 2-3 times",
      tip: "Don't force it — work keywords into conversational sentences",
    },
    {
      label: "Include a search-friendly first line",
      tip: "Instagram indexes the first 125 chars — make it keyword-rich",
    },
    {
      label: "Add location context if relevant",
      tip: "Local search boosts discovery for community-based content",
    },
    {
      label: "End with save/share CTA",
      tip: "Saves signal high value to the algorithm — explicitly request them",
    },
    {
      label: "Use 3-tier hashtag stack",
      tip: "Mix reach + niche + community tags every post",
    },
    {
      label: "Alt text on images",
      tip: "Describe the image with natural keyword inclusion",
    },
    {
      label: "Reply to comments quickly",
      tip: "First-hour engagement velocity strongly influences reach",
    },
  ],
  trendingAngles: [
    {
      angle: "Myth-busting perimenopause fitness advice",
      hookExample:
        "Everything you've been told about cardio in perimenopause is wrong.",
      viralitySignal: "Very High",
    },
    {
      angle: "Morning routines for hormone support",
      hookExample:
        "5-minute yoga sequence that supports estrogen balance (yes, really)",
      viralitySignal: "High",
    },
    {
      angle: "Before/after strength training mindset shift",
      hookExample:
        "I stopped running and started lifting at 43. Here's what actually changed.",
      viralitySignal: "Very High",
    },
    {
      angle: "Science-backed wellness explainer",
      hookExample:
        "What happens to your muscles during perimenopause (and the one fix that works)",
      viralitySignal: "High",
    },
  ],
};

// ─── Config ───

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
];

const CONTENT_GOALS = [
  "Discoverability",
  "Saves & Shares",
  "Niche Authority",
  "Trending Reach",
];

const VIRALITY_BADGE: Record<string, string> = {
  "Very High": "bg-[#d94e33]/10 text-[#d94e33] border-[#d94e33]/20",
  High: "bg-amber-50 text-amber-700 border-amber-200",
  Medium: "bg-blue-50 text-blue-700 border-blue-200",
};

// ─── Component ───

export function SocialSEOStrategy({
  pillars,
  onAddContentItem,
  activeContentItem,
  onUpdateContentItem,
}: SocialSEOStrategyProps) {
  const [selectedPillarId, setSelectedPillarId] = useState(pillars[0]?.id || "");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [selectedGoal, setSelectedGoal] = useState(CONTENT_GOALS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<SEOStrategy | null>(null);

  // Per-angle editable idea titles
  const [angleTitles, setAngleTitles] = useState<Record<number, string>>({});
  const [savedAngles, setSavedAngles] = useState<Set<number>>(new Set());

  // Copy feedback
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedAllTab, setCopiedAllTab] = useState<string | null>(null);

  const canGenerate = !!selectedPillarId && !!selectedPlatform && !!selectedGoal;

  const handleGenerate = () => {
    setIsGenerating(true);
    setStrategy(null);
    setSavedAngles(new Set());

    setTimeout(() => {
      const result: SEOStrategy = {
        ...MOCK_SEO_STRATEGY,
        platform: selectedPlatform as SEOStrategy["platform"],
        pillarId: selectedPillarId,
        goal: selectedGoal,
        generatedAt: new Date().toISOString(),
      };
      setStrategy(result);

      // Init angle titles
      const titles: Record<number, string> = {};
      MOCK_SEO_STRATEGY.trendingAngles.forEach((a, i) => {
        titles[i] = a.angle;
      });
      setAngleTitles(titles);

      setIsGenerating(false);
      toast.success("SEO strategy generated");
    }, 2500);
  };

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag).catch(() => {});
    setCopiedTag(tag);
    toast.success(`${tag} copied`);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const copyAll = (tags: { tag: string }[], tier: string) => {
    const text = tags.map((t) => t.tag).join(" ");
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedAllTab(tier);
    toast.success(`${tags.length} hashtags copied`);
    setTimeout(() => setCopiedAllTab(null), 2000);
  };

  const copyBio = () => {
    if (!strategy) return;
    navigator.clipboard.writeText(strategy.exampleBio).catch(() => {});
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
  };

  const applyHashtagsToContent = (tags: { tag: string }[]) => {
    if (!activeContentItem || !onUpdateContentItem) return;
    const tagStrings = tags.map((t) => t.tag);
    const production = activeContentItem.production || {
      productionStep: "builder" as const,
      sources: [],
      outputs: {},
      assets: [],
      tasks: [],
      versions: [],
    };
    const outputs = production.outputs || {};
    const packagingData = outputs.packagingData || {};
    const updatedItem: ContentItem = {
      ...activeContentItem,
      production: {
        ...production,
        outputs: {
          ...outputs,
          hashtags: tagStrings,
          packagingData: {
            ...packagingData,
            keywords: tagStrings,
          },
        },
      },
    };
    onUpdateContentItem(updatedItem);
    toast.success(`Hashtags applied to "${activeContentItem.title}"`);
  };

  const handleCreateIdea = (index: number, angle: SEOStrategy["trendingAngles"][number]) => {
    const title = (angleTitles[index] || angle.angle).trim();
    const now = new Date().toISOString();
    const item: ContentItem = {
      id: `c-seo-${Date.now()}-${index}`,
      stage: "idea",
      status: "draft",
      title,
      description: `${angle.angle}\n\n${angle.hookExample}`,
      pillarIds: selectedPillarId ? [selectedPillarId] : [],
      segmentIds: [],
      createdAt: now,
      updatedAt: now,
    };
    onAddContentItem?.(item);
    setSavedAngles((prev) => new Set([...prev, index]));
    toast.success("Idea created — check Ideation");
  };

  const selectedPillar = pillars.find((p) => p.id === selectedPillarId);

  return (
    <div className="space-y-5">

      {/* ─── Input Panel ─── */}
      <Card className="border-gray-100">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Content Pillar
              </label>
              <Select value={selectedPillarId} onValueChange={setSelectedPillarId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select pillar" />
                </SelectTrigger>
                <SelectContent>
                  {pillars.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full shrink-0" style={{ background: p.color }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Platform
              </label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Content Goal
              </label>
              <Select value={selectedGoal} onValueChange={setSelectedGoal}>
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
          </div>

          <Button
            className="w-full bg-[#d94e33] hover:bg-[#c4452d] text-white gap-2"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Hash className="size-4" />}
            Generate SEO Strategy
          </Button>
        </CardContent>
      </Card>

      {/* ─── Loading ─── */}
      {isGenerating && (
        <Card className="border-gray-100">
          <CardContent className="py-20 text-center">
            <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Building your SEO & hashtag strategy...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Analyzing {selectedPlatform} for {selectedGoal.toLowerCase()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Empty State ─── */}
      {!isGenerating && !strategy && (
        <div className="py-20 text-center">
          <Hash className="size-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            Select a pillar, platform, and goal to generate your strategy
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Get a full hashtag taxonomy, bio keywords, caption checklist, and trending angles
          </p>
        </div>
      )}

      {/* ─── Output ─── */}
      {strategy && !isGenerating && (
        <div className="space-y-4">

          {/* Card 1 — Hashtag Sets */}
          <Card className="border-gray-100">
            <CardHeader className="pb-0 pt-4 px-4">
              <div className="flex items-center gap-1.5">
                <Hash className="size-3.5 text-[#d94e33]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Hashtag Sets
                </p>
                {selectedPillar && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-[9px] gap-1"
                    style={{ color: selectedPillar.color, borderColor: selectedPillar.color + "40" }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: selectedPillar.color }} />
                    {selectedPillar.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-3">
              <Tabs defaultValue="reach">
                <TabsList className="h-8 mb-3">
                  <TabsTrigger value="reach" className="text-xs">Reach</TabsTrigger>
                  <TabsTrigger value="niche" className="text-xs">Niche</TabsTrigger>
                  <TabsTrigger value="community" className="text-xs">Community</TabsTrigger>
                </TabsList>

                {(["reach", "niche", "community"] as const).map((tier) => {
                  const tags = strategy.hashtagSets[tier];
                  const tierColor = {
                    reach: "bg-blue-50 text-blue-700 border-blue-200",
                    niche: "bg-green-50 text-green-700 border-green-200",
                    community: "bg-purple-50 text-purple-700 border-purple-200",
                  }[tier];

                  return (
                    <TabsContent key={tier} value={tier} className="mt-0 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {tags.map((t) => (
                          <button
                            key={t.tag}
                            onClick={() => copyTag(t.tag)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:opacity-80",
                              copiedTag === t.tag
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                            )}
                          >
                            {copiedTag === t.tag ? (
                              <Check className="size-3 text-green-600" />
                            ) : (
                              <Hash className="size-3 text-muted-foreground" />
                            )}
                            {t.tag.replace("#", "")}
                            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 ml-0.5", tierColor)}>
                              {t.estimatedPosts} posts
                            </Badge>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-7 text-xs"
                          onClick={() => copyAll(tags, tier)}
                        >
                          {copiedAllTab === tier ? (
                            <Check className="size-3 text-green-600" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          {copiedAllTab === tier ? "Copied!" : `Copy All (${tags.length})`}
                        </Button>

                        {activeContentItem && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-7 text-xs border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5"
                            onClick={() => applyHashtagsToContent(tags)}
                          >
                            <Zap className="size-3" />
                            Apply to Active Content
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>

          {/* Card 2 — Bio & Profile Keywords */}
          <Card className="border-gray-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 text-[#d94e33]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Bio & Profile Keywords
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">

              {/* Keyword chips */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Recommended keywords for your bio
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.bioKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="outline"
                      className="text-[11px] bg-green-50 text-green-700 border-green-200"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Search intents */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Search intent your profile should satisfy
                </p>
                <div className="space-y-1.5">
                  {strategy.searchIntents.map((intent, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="size-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-700">{intent}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example bio */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Example optimized bio</p>
                <div className="relative rounded-lg bg-gray-50 border border-gray-100 p-3 pr-10">
                  <p className="text-sm text-gray-800 leading-relaxed">{strategy.exampleBio}</p>
                  <button
                    onClick={copyBio}
                    className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-gray-700 transition-colors"
                    title="Copy bio"
                  >
                    {copiedBio ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 — Caption SEO Checklist */}
          <Card className="border-gray-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-1.5">
                <ListChecks className="size-3.5 text-[#d94e33]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Caption SEO Checklist
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {strategy.captionChecklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="size-3.5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 4 — Trending Angles */}
          <Card className="border-gray-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-[#d94e33]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Trending Angles
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {strategy.trendingAngles.map((angle, i) => {
                  const isSaved = savedAngles.has(i);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border p-3 space-y-2.5 transition-colors",
                        isSaved ? "border-green-100 bg-green-50/40" : "border-gray-100 bg-gray-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{angle.angle}</p>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] shrink-0", VIRALITY_BADGE[angle.viralitySignal])}
                        >
                          {angle.viralitySignal}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        "{angle.hookExample}"
                      </p>

                      {/* Editable title + Create Idea */}
                      <div className="space-y-1.5 pt-1 border-t border-gray-100">
                        <Input
                          placeholder="Idea title..."
                          value={angleTitles[i] || ""}
                          onChange={(e) =>
                            setAngleTitles((prev) => ({ ...prev, [i]: e.target.value }))
                          }
                          className="h-8 text-xs"
                          disabled={isSaved}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "w-full gap-1.5 h-7 text-xs transition-all",
                            isSaved
                              ? "border-green-300 text-green-700 bg-green-50 cursor-default"
                              : "border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5"
                          )}
                          onClick={() => !isSaved && handleCreateIdea(i, angle)}
                          disabled={isSaved}
                        >
                          {isSaved ? (
                            <><Check className="size-3" /> Created ✓</>
                          ) : (
                            <><Bookmark className="size-3" /> Create Idea →</>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
