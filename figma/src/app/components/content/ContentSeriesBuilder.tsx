import React, { useState } from "react";
import {
  ListOrdered,
  Sparkles,
  Loader2,
  ChevronDown,
  Check,
  Bookmark,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ContentPillar, AudienceSegment, ContentItem, ContentSeries } from "./types";

interface ContentSeriesBuilderProps {
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onAddContentItem?: (item: ContentItem) => void;
  onNavigateToIdeation: () => void;
}

const SERIES_GOALS = [
  "Educate & Build Trust",
  "Drive Profile Follows",
  "Launch a New Topic or Offer",
  "Re-engage Inactive Audience",
  "Community & Engagement Push",
];

const SERIES_LENGTHS = ["3", "5", "7"];

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
];

const ROLE_COLORS: Record<string, string> = {
  Hook: "bg-[#d94e33]/10 text-[#d94e33] border-[#d94e33]/20",
  Value: "bg-blue-50 text-blue-700 border-blue-200",
  Proof: "bg-green-50 text-green-700 border-green-200",
  Pivot: "bg-purple-50 text-purple-700 border-purple-200",
  Conversion: "bg-amber-50 text-amber-700 border-amber-200",
};

const MOCK_SERIES: ContentSeries = {
  title: "The Perimenopause Fitness Reset",
  narrativeArc:
    "Moves from validating frustration → reframing the problem → delivering a concrete protocol → proving it works → inviting community action.",
  platform: "instagram",
  goal: "Educate & Build Trust",
  pillarId: "",
  segmentId: "",
  generatedAt: new Date().toISOString(),
  posts: [
    {
      postNumber: 1,
      suggestedDay: "Monday",
      contentType: "reel",
      seriesRole: "Hook",
      hook: "Your workouts didn't stop working. Your hormones changed the rules.",
      captionSummary:
        "Opens with the core frustration: active women in their 40s doing everything 'right' but seeing different results. Validates the experience without blaming the person.",
      cta: "Save this — series drops all week.",
      bridgeNote: "Establishes shared frustration → next post reframes the cause",
    },
    {
      postNumber: 2,
      suggestedDay: "Wednesday",
      contentType: "carousel",
      seriesRole: "Value",
      hook: "3 hormones that quietly reshape your fitness after 40 (and what to do about each)",
      captionSummary:
        "Educates on estrogen, cortisol, and progesterone shifts. Practical, not scary. Each slide = one hormone + one action.",
      cta: "Which one resonates most? Comment below.",
      bridgeNote: "Teaches the 'why' → next post delivers the 'what'",
    },
    {
      postNumber: 3,
      suggestedDay: "Friday",
      contentType: "reel",
      seriesRole: "Value",
      hook: "The 20-minute strength routine designed specifically for perimenopause",
      captionSummary:
        "Demonstrates the actual workout. Modifications shown. Focuses on compound movements and recovery emphasis.",
      cta: "Save this workout. Try it this weekend.",
      bridgeNote: "Delivers protocol → next post provides social proof",
    },
    {
      postNumber: 4,
      suggestedDay: "Sunday",
      contentType: "feed-post",
      seriesRole: "Proof",
      hook: "She's 47, runs a company, and just hit her strongest season of training yet.",
      captionSummary:
        "Member story or testimonial format. Real results, real woman from the Hive Collective community. Emphasizes the transformation of approach, not just body.",
      cta: "Share this with someone who needs to hear it.",
      bridgeNote: "Social proof → final post converts to community action",
    },
    {
      postNumber: 5,
      suggestedDay: "Tuesday",
      contentType: "story",
      seriesRole: "Conversion",
      hook: "Which part of this series hit hardest for you?",
      captionSummary:
        "Interactive story series recapping the highlights. Poll sticker asking which topic to go deeper on next. Drives follows and engagement.",
      cta: "Vote + follow to see what we cover next.",
      bridgeNote: undefined,
    },
  ],
};

export function ContentSeriesBuilder({
  pillars,
  segments,
  onAddContentItem,
  onNavigateToIdeation,
}: ContentSeriesBuilderProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState(segments[0]?.id || "");
  const [selectedPillarId, setSelectedPillarId] = useState(pillars[0]?.id || "");
  const [selectedGoal, setSelectedGoal] = useState(SERIES_GOALS[0]);
  const [selectedLength, setSelectedLength] = useState("5");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [isBuilding, setIsBuilding] = useState(false);
  const [series, setSeries] = useState<ContentSeries | null>(null);
  const [postTitles, setPostTitles] = useState<Record<number, string>>({});
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());

  const handleBuildSeries = () => {
    setIsBuilding(true);
    setSeries(null);
    setSavedPosts(new Set());

    setTimeout(() => {
      const postsToShow = MOCK_SERIES.posts.slice(0, parseInt(selectedLength));
      const newSeries: ContentSeries = {
        ...MOCK_SERIES,
        platform: selectedPlatform as ContentSeries["platform"],
        goal: selectedGoal,
        pillarId: selectedPillarId,
        segmentId: selectedSegmentId,
        generatedAt: new Date().toISOString(),
        posts: postsToShow,
      };
      setSeries(newSeries);

      // Initialize post titles
      const titles: Record<number, string> = {};
      postsToShow.forEach((post) => {
        titles[post.postNumber] = `${newSeries.title} — Post ${post.postNumber}`;
      });
      setPostTitles(titles);

      setIsBuilding(false);
      toast.success(`${postsToShow.length}-post series generated`);
    }, 2500);
  };

  const handleCreatePost = (postNumber: number, post: ContentSeries["posts"][number]) => {
    const title = (postTitles[postNumber] || "").trim();
    if (!title) return;

    const now = new Date().toISOString();
    const item: ContentItem = {
      id: `c-series-${Date.now()}-${postNumber}`,
      conceptId: `series-${series?.generatedAt || Date.now()}`,
      stage: "idea",
      status: "draft",
      title,
      description: `${post.captionSummary}\n\nCTA: ${post.cta}`,
      pillarIds: selectedPillarId ? [selectedPillarId] : [],
      segmentIds: selectedSegmentId ? [selectedSegmentId] : [],
      hook: post.hook,
      createdAt: now,
      updatedAt: now,
    };

    onAddContentItem?.(item);
    setSavedPosts((prev) => new Set([...prev, postNumber]));
    toast.success("Idea created in Ideation");
  };

  const handleCreateAll = () => {
    if (!series) return;
    const toCreate = series.posts.filter((p) => !savedPosts.has(p.postNumber));
    const now = new Date().toISOString();
    const conceptId = `series-${series.generatedAt}`;

    toCreate.forEach((post) => {
      const title = (postTitles[post.postNumber] || `${series.title} — Post ${post.postNumber}`).trim();
      const item: ContentItem = {
        id: `c-series-${Date.now()}-${post.postNumber}`,
        conceptId,
        stage: "idea",
        status: "draft",
        title,
        description: `${post.captionSummary}\n\nCTA: ${post.cta}`,
        pillarIds: selectedPillarId ? [selectedPillarId] : [],
        segmentIds: selectedSegmentId ? [selectedSegmentId] : [],
        hook: post.hook,
        createdAt: now,
        updatedAt: now,
      };
      onAddContentItem?.(item);
    });

    setSavedPosts(new Set(series.posts.map((p) => p.postNumber)));
    toast.success(`${toCreate.length} idea${toCreate.length === 1 ? "" : "s"} created for your series`);
    onNavigateToIdeation();
  };

  const selectedPillar = pillars.find((p) => p.id === selectedPillarId);

  return (
    <div className="space-y-6">

      {/* ─── Input Form ─── */}
      <Card className="border-gray-100">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Audience Segment
              </label>
              <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                Series Goal
              </label>
              <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERIES_GOALS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Series Length
              </label>
              <Select value={selectedLength} onValueChange={setSelectedLength}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERIES_LENGTHS.map((l) => (
                    <SelectItem key={l} value={l}>{l} posts</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Primary Platform
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

            <div className="flex items-end">
              <Button
                className="w-full bg-[#d94e33] hover:bg-[#c4452d] text-white gap-2 h-9"
                onClick={handleBuildSeries}
                disabled={isBuilding}
              >
                {isBuilding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ListOrdered className="size-4" />
                )}
                Build Series with AI
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Loading ─── */}
      {isBuilding && (
        <Card className="border-gray-100">
          <CardContent className="py-20 text-center">
            <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Building your content series...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Creating a {selectedLength}-post narrative arc
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Empty State ─── */}
      {!isBuilding && !series && (
        <div className="py-20 text-center">
          <ListOrdered className="size-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            Configure your series and click Build Series with AI
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Generates a complete multi-post narrative with posting schedule
          </p>
        </div>
      )}

      {/* ─── Series Output ─── */}
      {series && !isBuilding && (
        <div className="space-y-5">

          {/* Series Overview Card */}
          <Card className="border-[#d94e33]/20 bg-gradient-to-r from-[#d94e33]/5 to-orange-50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ListOrdered className="size-4 text-[#d94e33]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#d94e33]">
                      Content Series
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{series.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{series.narrativeArc}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge variant="outline" className="text-[10px] capitalize">{series.platform}</Badge>
                    <Badge variant="outline" className="text-[10px]">{series.posts.length} posts</Badge>
                    <Badge variant="outline" className="text-[10px]">{series.goal}</Badge>
                    {selectedPillar && (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1"
                        style={{ color: selectedPillar.color, borderColor: selectedPillar.color + "40" }}
                      >
                        <span className="size-1.5 rounded-full" style={{ background: selectedPillar.color }} />
                        {selectedPillar.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-[#d94e33] hover:bg-[#c4452d] text-white gap-1.5 shrink-0"
                  onClick={handleCreateAll}
                >
                  <Sparkles className="size-3.5" />
                  Create All in Ideation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Post Cards */}
          <div className="space-y-3">
            {series.posts.map((post, idx) => {
              const isSaved = savedPosts.has(post.postNumber);

              return (
                <div key={post.postNumber}>
                  <Card className={cn("border-gray-100 transition-colors", isSaved && "border-green-100 bg-green-50/30")}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Post number */}
                        <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-600">
                          {post.postNumber}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Editable title */}
                          <Input
                            placeholder="Post title..."
                            value={postTitles[post.postNumber] || ""}
                            onChange={(e) =>
                              setPostTitles((prev) => ({ ...prev, [post.postNumber]: e.target.value }))
                            }
                            className="h-8 text-sm font-semibold border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 shadow-none border-b-transparent hover:border-b-gray-200 focus-visible:border-b-gray-300 mb-2"
                            disabled={isSaved}
                          />

                          {/* Meta row */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="outline" className={cn("text-[9px]", ROLE_COLORS[post.seriesRole])}>
                              {post.seriesRole}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] capitalize">
                              {post.contentType}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              Post {post.postNumber} — {post.suggestedDay}
                            </span>
                          </div>

                          {/* Hook */}
                          <div className="mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Hook</p>
                            <p className="text-sm font-semibold text-gray-900 leading-snug">{post.hook}</p>
                          </div>

                          {/* Caption summary */}
                          <div className="mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Caption Direction</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{post.captionSummary}</p>
                          </div>

                          {/* CTA */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CTA:</span>
                            <span className="text-xs text-gray-700 italic">{post.cta}</span>
                          </div>
                        </div>

                        {/* Action */}
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn(
                            "shrink-0 gap-1.5 h-8 text-xs transition-all",
                            isSaved
                              ? "border-green-300 text-green-700 bg-green-50 cursor-default"
                              : "border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5"
                          )}
                          onClick={() => !isSaved && handleCreatePost(post.postNumber, post)}
                          disabled={isSaved}
                        >
                          {isSaved ? (
                            <><Check className="size-3" /> Created</>
                          ) : (
                            <><Bookmark className="size-3" /> Create in Ideation →</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bridge connector */}
                  {post.bridgeNote && idx < series.posts.length - 1 && (
                    <div className="flex items-center gap-2 py-1 px-4">
                      <ArrowDown className="size-3 text-muted-foreground shrink-0" />
                      <p className="text-[10px] text-muted-foreground italic">{post.bridgeNote}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
