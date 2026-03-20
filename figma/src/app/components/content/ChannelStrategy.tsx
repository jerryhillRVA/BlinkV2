import React, { useState } from "react";
import {
  Radio,
  Loader2,
  Sparkles,
  ChevronDown,
  Instagram,
  Youtube,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/app/components/ui/collapsible";
import type { ChannelStrategyEntry, AudienceSegment, ContentType, Platform } from "./types";
import { PLATFORM_CONFIG, PLATFORM_CONTENT_TYPES } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChannelStrategyProps {
  channelStrategies: ChannelStrategyEntry[];
  onUpdateChannelStrategies: (entries: ChannelStrategyEntry[]) => void;
  segments: AudienceSegment[];
}

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === "instagram") return <Instagram className="size-4 text-pink-500" />;
  if (platform === "youtube") return <Youtube className="size-4 text-red-600" />;
  if (platform === "tiktok") return <TikTokIcon />;
  if (platform === "linkedin") return <span className="size-4 text-blue-700 font-bold text-[11px] flex items-center justify-center">in</span>;
  if (platform === "facebook") return <span className="size-4 text-blue-600 font-bold text-[11px] flex items-center justify-center">f</span>;
  return <Radio className="size-4" />;
}

const PRIMARY_GOALS = ["Follower Growth", "Engagement", "Traffic", "Lead Gen", "Community", "Brand Awareness"];

const ACTIVE_PLATFORMS: Platform[] = ["instagram", "tiktok", "youtube", "facebook", "linkedin"];

const MOCK_STRATEGIES: Record<string, Partial<ChannelStrategyEntry>> = {
  instagram: {
    role: "Primary discovery and community hub",
    primaryContentTypes: ["reel", "carousel", "story"] as ContentType[],
    toneAdjustment: "Warm, visual storytelling. Use emojis sparingly. Medium-length captions with a strong hook.",
    postingCadence: "5x/week — Reels Mon/Wed/Fri, Carousels Tue/Thu",
    primaryAudience: "Active 40s — fitness-focused women in early perimenopause",
    primaryGoal: "Follower Growth",
    notes: "Instagram is where our most engaged community lives. Prioritize saves and shares over likes.",
  },
  tiktok: {
    role: "Discovery and trend amplification channel",
    primaryContentTypes: ["short-video"] as ContentType[],
    toneAdjustment: "Fast-paced, energetic — mirror trending language. Hook within 2 seconds. Conversational POV style.",
    postingCadence: "Daily — 1x/day between 7–9am or 7–9pm",
    primaryAudience: "Thriving 50s — women rediscovering fitness, trend-curious",
    primaryGoal: "Brand Awareness",
    notes: "Top-of-funnel discovery. Test trending formats. Not our primary community platform.",
  },
  youtube: {
    role: "Authority and long-form education channel",
    primaryContentTypes: ["long-form", "shorts"] as ContentType[],
    toneAdjustment: "Thorough, evidence-backed. Viewers opt in — reward them with real value. Earn trust over time.",
    postingCadence: "1x/week long-form (30–45 min) + 2x Shorts",
    primaryAudience: "Thriving 50s — women who research before committing",
    primaryGoal: "Community",
    notes: "Long-form drives highest retention and trust. Repurpose into Shorts and Reels.",
  },
  facebook: {
    role: "Community engagement and conversation hub",
    primaryContentTypes: ["fb-feed-post", "fb-reel"] as ContentType[],
    toneAdjustment: "Community-first. Ask questions, celebrate wins, invite discussion. More personal and conversational.",
    postingCadence: "3x/week — mix of shared content and exclusive posts",
    primaryAudience: "Active 40s — women who prefer Facebook Group community format",
    primaryGoal: "Engagement",
    notes: "Facebook Group is a key retention mechanism. Cross-post best Instagram content here.",
  },
  linkedin: {
    role: "Thought leadership and professional credibility channel",
    primaryContentTypes: ["ln-text-post", "ln-article"] as ContentType[],
    toneAdjustment: "Professional but human — share expertise with personal context. Longer-form insights welcome.",
    postingCadence: "2x/week",
    primaryAudience: "Career-peak women navigating hormonal change — corporate wellness angle",
    primaryGoal: "Lead Gen",
    notes: "Reaches women who are career-focused and health-conscious. B2B wellness angle.",
  },
};

export function ChannelStrategy({ channelStrategies, onUpdateChannelStrategies, segments }: ChannelStrategyProps) {
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingPlatform, setGeneratingPlatform] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Set<string>>(
    () => new Set(channelStrategies.filter((c) => c.active).map((c) => c.platform))
  );

  const updateEntry = (platform: Platform, updates: Partial<ChannelStrategyEntry>) => {
    onUpdateChannelStrategies(
      channelStrategies.map((e) => (e.platform === platform ? { ...e, ...updates } : e))
    );
  };

  const toggleOpen = (platform: string) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  const handleToggleActive = (platform: Platform, active: boolean) => {
    updateEntry(platform, { active });
    if (active) {
      setOpenCards((prev) => new Set([...prev, platform]));
    }
  };

  const handleGenerateStrategy = (platform: Platform) => {
    setGeneratingPlatform(platform);
    setTimeout(() => {
      const mock = MOCK_STRATEGIES[platform];
      if (mock) {
        updateEntry(platform, { ...mock, generatedAt: new Date().toISOString() });
      }
      setGeneratingPlatform(null);
      toast.success(`Strategy generated for ${PLATFORM_CONFIG[platform]?.label ?? platform}`);
    }, 2500);
  };

  const handleGenerateAll = () => {
    setIsGeneratingAll(true);
    setTimeout(() => {
      const updated = channelStrategies.map((entry) => {
        if (!entry.active) return entry;
        const mock = MOCK_STRATEGIES[entry.platform];
        return mock ? { ...entry, ...mock, generatedAt: new Date().toISOString() } : entry;
      });
      onUpdateChannelStrategies(updated);
      setIsGeneratingAll(false);
      toast.success("Channel strategies generated for all active platforms");
    }, 3000);
  };

  const toggleContentType = (platform: Platform, contentType: ContentType, checked: boolean) => {
    const entry = channelStrategies.find((e) => e.platform === platform);
    if (!entry) return;
    const next = checked
      ? [...entry.primaryContentTypes, contentType]
      : entry.primaryContentTypes.filter((ct) => ct !== contentType);
    updateEntry(platform, { primaryContentTypes: next });
  };

  const activeCount = channelStrategies.filter((e) => e.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#d94e33]/10">
            <Radio className="size-4 text-[#d94e33]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Channel Strategy</h3>
            <p className="text-xs text-muted-foreground">Define the role and approach for each platform in your content mix</p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5"
          onClick={handleGenerateAll}
          disabled={isGeneratingAll || activeCount === 0}
        >
          {isGeneratingAll ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          AI Generate All Strategies
        </Button>
      </div>

      {isGeneratingAll && (
        <div className="rounded-lg border border-gray-100 p-6 text-center">
          <Loader2 className="size-7 text-[#d94e33] animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Generating channel strategies for all active platforms...</p>
        </div>
      )}

      {/* Platform Cards */}
      <div className="space-y-3">
        {ACTIVE_PLATFORMS.map((platform) => {
          const entry = channelStrategies.find((e) => e.platform === platform);
          if (!entry) return null;
          const cfg = PLATFORM_CONFIG[platform];
          const isOpen = openCards.has(platform);
          const contentTypeOptions = PLATFORM_CONTENT_TYPES[platform] ?? [];

          return (
            <Collapsible key={platform} open={isOpen} onOpenChange={() => toggleOpen(platform)}>
              <Card className={cn("border-gray-100 overflow-hidden transition-opacity", !entry.active && "opacity-60")}>
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-2 group">
                        <PlatformIcon platform={platform} />
                        <span className={cn("font-bold text-sm", cfg?.color)}>{cfg?.label}</span>
                        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                    {entry.active && entry.role && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-gray-200 hidden sm:flex">
                        {entry.role}
                      </Badge>
                    )}
                    {entry.generatedAt && (
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        Generated {new Date(entry.generatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{entry.active ? "Active" : "Inactive"}</span>
                    <Switch
                      checked={entry.active}
                      onCheckedChange={(checked) => handleToggleActive(platform, checked)}
                    />
                  </div>
                </div>

                <CollapsibleContent>
                  <CardContent className="p-4 space-y-4">
                    {!entry.active ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Mark as active to define strategy</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Role */}
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Role</label>
                            <Input
                              value={entry.role}
                              onChange={(e) => updateEntry(platform, { role: e.target.value })}
                              placeholder="What role does this platform play?"
                              className="h-9 text-sm"
                            />
                          </div>

                          {/* Posting Cadence */}
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Posting Cadence</label>
                            <Input
                              value={entry.postingCadence}
                              onChange={(e) => updateEntry(platform, { postingCadence: e.target.value })}
                              placeholder="e.g. 5x/week, Mon/Wed/Fri at 7am"
                              className="h-9 text-sm"
                            />
                          </div>

                          {/* Primary Audience */}
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Primary Audience</label>
                            {segments.length > 0 ? (
                              <Select
                                value={entry.primaryAudience}
                                onValueChange={(v) => updateEntry(platform, { primaryAudience: v })}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select segment..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {segments.map((s) => (
                                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                  ))}
                                  <SelectItem value="custom">Custom...</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={entry.primaryAudience}
                                onChange={(e) => updateEntry(platform, { primaryAudience: e.target.value })}
                                placeholder="Which segment to prioritize"
                                className="h-9 text-sm"
                              />
                            )}
                          </div>

                          {/* Primary Goal */}
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Primary Goal</label>
                            <Select
                              value={entry.primaryGoal}
                              onValueChange={(v) => updateEntry(platform, { primaryGoal: v })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select goal..." />
                              </SelectTrigger>
                              <SelectContent>
                                {PRIMARY_GOALS.map((g) => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Primary Content Types */}
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Primary Content Types</label>
                          <div className="flex flex-wrap gap-2">
                            {contentTypeOptions.map((ct) => {
                              const selected = entry.primaryContentTypes.includes(ct.value);
                              return (
                                <button
                                  key={ct.value}
                                  onClick={() => toggleContentType(platform, ct.value, !selected)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                                    selected
                                      ? "bg-[#d94e33]/10 border-[#d94e33] text-[#d94e33]"
                                      : "bg-white border-gray-200 text-muted-foreground hover:border-gray-300"
                                  )}
                                >
                                  {ct.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tone Adjustment */}
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Tone Adjustment</label>
                          <Textarea
                            value={entry.toneAdjustment}
                            onChange={(e) => updateEntry(platform, { toneAdjustment: e.target.value })}
                            placeholder="How does your voice shift on this platform?"
                            className="min-h-[70px] resize-none text-sm"
                          />
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Strategy Notes</label>
                          <Textarea
                            value={entry.notes}
                            onChange={(e) => updateEntry(platform, { notes: e.target.value })}
                            placeholder="Open strategy notes for this platform..."
                            className="min-h-[70px] resize-none text-sm"
                          />
                        </div>

                        {/* AI Generate per card */}
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => handleGenerateStrategy(platform)}
                            disabled={generatingPlatform === platform}
                          >
                            {generatingPlatform === platform ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Sparkles className="size-3 text-[#d94e33]" />
                            )}
                            AI Generate Strategy
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
