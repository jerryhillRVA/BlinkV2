import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Check,
  Copy,
  Loader2,
  Instagram,
  Youtube,
  Plus,
  X,
  Bookmark,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/app/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ContentPillar, AudienceSegment, ContentItem, RepurposeOutput } from "./types";
import { MOCK_REPURPOSE_OUTPUT } from "./mock-repurpose-data";

interface ContentRepurposerProps {
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onAddContentItem?: (item: ContentItem) => void;
}

interface SavedIdeaRecord {
  uid: string;
  title: string;
  platformId: string;
  badge: string;
  badgeClass: string;
}

// ─── Platform Icons ───

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// ─── Platform Config ───

interface PlatformConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  iconLarge: React.ReactNode;
}

const PLATFORMS: PlatformConfig[] = [
  { id: "instagram", label: "Instagram", icon: <Instagram className="size-3.5 shrink-0 text-pink-600" />, iconLarge: <Instagram className="size-4 text-pink-600" /> },
  { id: "tiktok", label: "TikTok", icon: <TikTokIcon />, iconLarge: <TikTokIcon /> },
  { id: "youtube", label: "YouTube", icon: <Youtube className="size-3.5 shrink-0 text-red-600" />, iconLarge: <Youtube className="size-4 text-red-600" /> },
  { id: "linkedin", label: "LinkedIn", icon: <LinkedInIcon />, iconLarge: <LinkedInIcon /> },
  { id: "facebook", label: "Facebook", icon: <FacebookIcon />, iconLarge: <FacebookIcon /> },
];

// ─── Output Card ───

interface OutputCard {
  key: string;
  platformId: string;
  label: string;
  badge: string;
  badgeClass: string;
  content: string;
}

// Mock AI-generated themes per card key
const MOCK_CARD_THEMES: Record<string, string> = {
  reelHooks: "Perimenopause Fitness Reset",
  carousel: "Hormone Health Tips",
  caption: "Midlife Fitness Strategy",
  tiktok: "Perimenopause Workout Reset",
  youtube: "Post-Workout Exhaustion Fix",
  linkedin: "Midlife Fitness Research",
  facebook: "Fitness Strategy for Women 40+",
};

function generateDefaultTitle(card: OutputCard): string {
  return `${card.label} — ${MOCK_CARD_THEMES[card.key] || "Content Repurpose"}`;
}

function buildCards(output: RepurposeOutput, platforms: Set<string>): OutputCard[] {
  const cards: OutputCard[] = [];

  if (platforms.has("instagram")) {
    cards.push({
      key: "reelHooks", platformId: "instagram", label: "Instagram Reel",
      badge: "Reel Hook", badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
      content: output.reelHooks.map((h, i) => `${i + 1}. ${h}`).join("\n"),
    });
    cards.push({
      key: "carousel", platformId: "instagram", label: "Instagram Carousel",
      badge: "Carousel Concept", badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
      content: output.carouselSlides.map((s, i) => `Slide ${i + 1} [${s.role}]: ${s.headline}`).join("\n"),
    });
    cards.push({
      key: "caption", platformId: "instagram", label: "Instagram Caption",
      badge: "Caption", badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
      content: output.instagramCaption,
    });
  }

  if (platforms.has("tiktok")) {
    cards.push({
      key: "tiktok", platformId: "tiktok", label: "TikTok",
      badge: "Short Video Hook", badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
      content: output.tiktokHook,
    });
  }

  if (platforms.has("youtube")) {
    cards.push({
      key: "youtube", platformId: "youtube", label: "YouTube Short",
      badge: "YouTube Short", badgeClass: "bg-red-50 text-red-700 border-red-200",
      content: output.youtubeShort,
    });
  }

  if (platforms.has("linkedin")) {
    cards.push({
      key: "linkedin", platformId: "linkedin", label: "LinkedIn",
      badge: "Text Post", badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      content: output.linkedinPost,
    });
  }

  if (platforms.has("facebook")) {
    cards.push({
      key: "facebook", platformId: "facebook", label: "Facebook",
      badge: "Post", badgeClass: "bg-blue-50 text-blue-600 border-blue-200",
      content: output.facebookPost,
    });
  }

  return cards;
}

function areSetsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

// ─── Component ───

export function ContentRepurposer({ pillars, segments, onAddContentItem }: ContentRepurposerProps) {
  const [sources, setSources] = useState<string[]>([""]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(["instagram", "tiktok", "youtube", "linkedin", "facebook"])
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<RepurposeOutput | null>(null);

  // Multi-select pillars / segments
  const [selectedPillarIds, setSelectedPillarIds] = useState<Set<string>>(new Set());
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());

  // Track values at last run to detect pending changes
  const [lastRunPillarIds, setLastRunPillarIds] = useState<Set<string>>(new Set());
  const [lastRunSegmentIds, setLastRunSegmentIds] = useState<Set<string>>(new Set());
  const [lastRunPlatforms, setLastRunPlatforms] = useState<Set<string>>(new Set());

  // Card state
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [dismissedCards, setDismissedCards] = useState<Set<string>>(new Set());
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [cardTitles, setCardTitles] = useState<Record<string, string>>({});
  const [titleErrors, setTitleErrors] = useState<Set<string>>(new Set());

  // Saved ideas that survive regeneration
  const [savedIdeaRecords, setSavedIdeaRecords] = useState<SavedIdeaRecord[]>([]);

  // Regenerate dialog
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  const hasSource = sources.some((s) => s.trim().length > 0);
  const canRepurpose = hasSource && selectedPlatforms.size > 0;

  const cards = output ? buildCards(output, selectedPlatforms) : [];
  const visibleCards = cards.filter((c) => !dismissedCards.has(c.key));
  const unsavedCount = visibleCards.filter((c) => !savedCards.has(c.key)).length;

  const hasPendingChanges =
    output !== null &&
    !isGenerating &&
    (!areSetsEqual(selectedPillarIds, lastRunPillarIds) ||
      !areSetsEqual(selectedSegmentIds, lastRunSegmentIds) ||
      !areSetsEqual(selectedPlatforms, lastRunPlatforms));

  // ─── Handlers ───

  const updateSource = (index: number, value: string) => {
    setSources((prev) => prev.map((s, i) => (i === index ? value : s)));
  };

  const addSource = () => {
    if (sources.length < 3) setSources((prev) => [...prev, ""]);
  };

  const removeSource = (index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const togglePillar = (id: string) => {
    setSelectedPillarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSegment = (id: string) => {
    setSelectedSegmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const runGeneration = (platforms: Set<string>, pillarIds: Set<string>, segmentIds: Set<string>) => {
    setIsGenerating(true);
    setTimeout(() => {
      const combinedSource = sources.filter((s) => s.trim()).join("\n\n---\n\n");
      const newOutput: RepurposeOutput = {
        sourceText: combinedSource,
        pillarId: [...pillarIds][0] || "",
        segmentId: [...segmentIds][0] || "",
        generatedAt: new Date().toISOString(),
        reelHooks: MOCK_REPURPOSE_OUTPUT.instagram_reel_hooks,
        carouselSlides: MOCK_REPURPOSE_OUTPUT.instagram_carousel,
        instagramCaption: MOCK_REPURPOSE_OUTPUT.instagram_caption,
        tiktokHook: MOCK_REPURPOSE_OUTPUT.tiktok_hook,
        youtubeShort: MOCK_REPURPOSE_OUTPUT.youtube_short,
        linkedinPost: MOCK_REPURPOSE_OUTPUT.linkedin_post,
        facebookPost: MOCK_REPURPOSE_OUTPUT.facebook_post,
      };

      setOutput(newOutput);
      setLastRunPillarIds(new Set(pillarIds));
      setLastRunSegmentIds(new Set(segmentIds));
      setLastRunPlatforms(new Set(platforms));

      // Initialize card titles with AI-generated defaults
      const generatedCards = buildCards(newOutput, platforms);
      const titles: Record<string, string> = {};
      generatedCards.forEach((c) => { titles[c.key] = generateDefaultTitle(c); });
      setCardTitles(titles);

      setIsGenerating(false);
      toast.success(`${generatedCards.length} format${generatedCards.length === 1 ? "" : "s"} generated`);
    }, 2500);
  };

  const handleRepurpose = () => {
    // AI auto-detects: select first 2 pillars and first segment
    const autoPillarIds = new Set(pillars.slice(0, 2).map((p) => p.id));
    const autoSegmentIds = new Set(segments.slice(0, 1).map((s) => s.id));

    setSelectedPillarIds(autoPillarIds);
    setSelectedSegmentIds(autoSegmentIds);
    setSavedCards(new Set());
    setDismissedCards(new Set());
    setTitleErrors(new Set());
    setSavedIdeaRecords([]);

    runGeneration(selectedPlatforms, autoPillarIds, autoSegmentIds);
  };

  const executeRegenerate = () => {
    // Move currently saved cards to the persistent saved ideas section
    const newRecords: SavedIdeaRecord[] = cards
      .filter((c) => savedCards.has(c.key))
      .map((c) => ({
        uid: `${c.key}-${Date.now()}`,
        title: cardTitles[c.key] || c.label,
        platformId: c.platformId,
        badge: c.badge,
        badgeClass: c.badgeClass,
      }));

    setSavedIdeaRecords((prev) => [...prev, ...newRecords]);
    setOutput(null);
    setSavedCards(new Set());
    setDismissedCards(new Set());
    setCardTitles({});
    setTitleErrors(new Set());

    runGeneration(selectedPlatforms, selectedPillarIds, selectedSegmentIds);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedCard(key);
    setTimeout(() => setCopiedCard(null), 2000);
  };

  const handleSaveIdea = (card: OutputCard) => {
    const title = (cardTitles[card.key] || "").trim();
    if (!title) {
      setTitleErrors((prev) => new Set([...prev, card.key]));
      return;
    }
    setTitleErrors((prev) => { const n = new Set(prev); n.delete(card.key); return n; });

    const now = new Date().toISOString();
    const item: ContentItem = {
      id: `c-repurpose-${Date.now()}-${card.key}`,
      stage: "idea",
      status: "draft",
      title,
      description: card.content,
      pillarIds: [...selectedPillarIds],
      segmentIds: [...selectedSegmentIds],
      createdAt: now,
      updatedAt: now,
    };

    onAddContentItem?.(item);
    setSavedCards((prev) => new Set([...prev, card.key]));
    toast.success("Idea saved to Ideation");
  };

  const handleSaveAll = () => {
    const toSave = visibleCards.filter((c) => !savedCards.has(c.key));
    const now = new Date().toISOString();
    toSave.forEach((card) => {
      const title = (cardTitles[card.key] || card.label).trim();
      const item: ContentItem = {
        id: `c-repurpose-${Date.now()}-${card.key}`,
        stage: "idea",
        status: "draft",
        title,
        description: card.content,
        pillarIds: [...selectedPillarIds],
        segmentIds: [...selectedSegmentIds],
        createdAt: now,
        updatedAt: now,
      };
      onAddContentItem?.(item);
    });
    setSavedCards((prev) => new Set([...prev, ...toSave.map((c) => c.key)]));
    if (toSave.length > 0) {
      toast.success(`${toSave.length} idea${toSave.length === 1 ? "" : "s"} saved to Ideation`);
    }
  };

  const handleDismiss = (key: string) => {
    setDismissedCards((prev) => new Set([...prev, key]));
  };

  const platformConfig = (id: string) => PLATFORMS.find((p) => p.id === id);

  return (
    <div className="space-y-5">

      {/* ─── Input Panel ─── */}
      <Card className="border-gray-100">
        <CardContent className="p-5 space-y-4">

          {/* Sources */}
          <div className="space-y-3">
            {sources.map((src, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {sources.length > 1 ? `Source ${i + 1}` : "Source Content"}
                  </label>
                  {sources.length > 1 && (
                    <button
                      onClick={() => removeSource(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Textarea
                    placeholder="Paste your blog post, podcast transcript, newsletter, or any long-form content here..."
                    className="min-h-[140px] resize-none text-sm"
                    value={src}
                    onChange={(e) => updateSource(i, e.target.value)}
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground pointer-events-none">
                    {src.length.toLocaleString()} chars
                  </span>
                </div>
              </div>
            ))}

            {sources.length < 3 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs text-muted-foreground"
                onClick={addSource}
              >
                <Plus className="size-3" /> Add Source
              </Button>
            )}
            {sources.length > 1 && (
              <p className="text-[10px] text-muted-foreground">
                AI will combine all sources into a unified output
              </p>
            )}
          </div>

          {/* Platform Toggles */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Repurpose for
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = selectedPlatforms.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                      active
                        ? "bg-[#d94e33]/10 border-[#d94e33] text-[#d94e33]"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repurpose Button */}
          <Button
            className="w-full bg-[#d94e33] hover:bg-[#c4452d] text-white gap-2"
            onClick={handleRepurpose}
            disabled={!canRepurpose || isGenerating}
          >
            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Repurpose with AI
          </Button>
        </CardContent>
      </Card>

      {/* ─── Loading ─── */}
      {isGenerating && (
        <Card className="border-gray-100">
          <CardContent className="py-20 text-center">
            <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Generating platform formats...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adapting your content for {selectedPlatforms.size} platform{selectedPlatforms.size === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Empty State ─── */}
      {!isGenerating && !output && (
        <div className="py-20 text-center">
          <RefreshCw className="size-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">
            Select platforms, paste your content, and click Repurpose with AI
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Generates platform-ready formats for every selected channel
          </p>
        </div>
      )}

      {/* ─── Output ─── */}
      {output && !isGenerating && (
        <div className="space-y-4">

          {/* AI Detected — multi-select pillars & segments */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                AI Detected — adjust if needed
              </span>
              {hasPendingChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 text-xs border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5"
                  onClick={() => setShowRegenerateDialog(true)}
                >
                  <RefreshCw className="size-3" /> Regenerate
                </Button>
              )}
            </div>

            {/* Content Pillars */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Content Pillars</p>
              <div className="flex flex-wrap gap-1.5">
                {pillars.map((p) => {
                  const active = selectedPillarIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePillar(p.id)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-medium transition-all",
                        active
                          ? "border-current"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
                      )}
                      style={
                        active
                          ? { color: p.color, backgroundColor: p.color + "15", borderColor: p.color + "60" }
                          : {}
                      }
                    >
                      <span className="size-1.5 rounded-full shrink-0" style={{ background: p.color }} />
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audience Segments */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5">Audience Segments</p>
              <div className="flex flex-wrap gap-1.5">
                {segments.map((s) => {
                  const active = selectedSegmentIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSegment(s.id)}
                      className={cn(
                        "px-2 py-1 rounded-full border text-[11px] font-medium transition-all",
                        active
                          ? "bg-[#d94e33]/10 border-[#d94e33]/40 text-[#d94e33]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Save All + count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {visibleCards.length} format{visibleCards.length === 1 ? "" : "s"} generated
              {dismissedCards.size > 0 && ` · ${dismissedCards.size} dismissed`}
            </p>
            {unsavedCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-7 text-xs"
                onClick={handleSaveAll}
              >
                <Bookmark className="size-3" />
                Save All as Ideas ({unsavedCount})
              </Button>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleCards.map((card) => {
              const pc = platformConfig(card.platformId);
              const isSaved = savedCards.has(card.key);
              const isCopied = copiedCard === card.key;
              const hasTitleError = titleErrors.has(card.key);

              return (
                <Card key={card.key} className="border-gray-100">
                  <CardHeader className="pb-2 pt-4 px-4">
                    {/* Editable title */}
                    <div className="mb-2">
                      <Input
                        placeholder="Idea title..."
                        value={cardTitles[card.key] || ""}
                        onChange={(e) => {
                          setCardTitles((prev) => ({ ...prev, [card.key]: e.target.value }));
                          if (e.target.value.trim()) {
                            setTitleErrors((prev) => { const n = new Set(prev); n.delete(card.key); return n; });
                          }
                        }}
                        className={cn(
                          "h-8 text-sm font-semibold border-0 border-b rounded-none px-0 bg-transparent focus-visible:ring-0 shadow-none",
                          hasTitleError
                            ? "border-b-red-400"
                            : "border-b-transparent hover:border-b-gray-200 focus-visible:border-b-gray-300"
                        )}
                        disabled={isSaved}
                      />
                      {hasTitleError && (
                        <p className="text-[10px] text-red-500 mt-0.5">Add a title to save this idea</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {pc?.iconLarge}
                        <span className="text-sm font-bold">{card.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={cn("text-[10px]", card.badgeClass)}>
                          {card.badge}
                        </Badge>
                        <button
                          onClick={() => handleDismiss(card.key)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                          title="Dismiss"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                        {card.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1.5 flex-1"
                        onClick={() => copyToClipboard(card.content, card.key)}
                      >
                        {isCopied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
                        {isCopied ? "Copied!" : "Copy"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                          "h-7 text-[10px] gap-1.5 flex-1 transition-all",
                          isSaved
                            ? "border-green-300 text-green-700 bg-green-50 cursor-default"
                            : "border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5"
                        )}
                        onClick={() => !isSaved && handleSaveIdea(card)}
                        disabled={isSaved}
                      >
                        {isSaved ? (
                          <><Check className="size-3" /> Saved ✓</>
                        ) : (
                          <><Bookmark className="size-3" /> Save as Idea</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* All dismissed state */}
          {visibleCards.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              <p className="text-sm">All formats dismissed.</p>
              <button
                onClick={() => setDismissedCards(new Set())}
                className="text-xs text-[#d94e33] hover:underline mt-1"
              >
                Restore all
              </button>
            </div>
          )}

          {/* Previously saved ideas (survive regeneration) */}
          {savedIdeaRecords.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Previously Saved Ideas
              </p>
              {savedIdeaRecords.map((r) => (
                <div
                  key={r.uid}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <Badge variant="outline" className={cn("text-[9px] shrink-0", r.badgeClass)}>
                    {r.badge}
                  </Badge>
                  <p className="text-xs text-gray-700 flex-1 truncate">{r.title}</p>
                  <a href="#" className="text-[10px] text-[#d94e33] hover:underline shrink-0">
                    View in Ideation
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Regenerate Confirmation Dialog ─── */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate content formats?</AlertDialogTitle>
            <AlertDialogDescription>
              This will rebuild all platform formats using your updated pillars, audience, and platform
              selections. Ideas you've already saved are safe — unsaved cards will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#d94e33] hover:bg-[#c4452d] text-white"
              onClick={() => {
                setShowRegenerateDialog(false);
                executeRegenerate();
              }}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
