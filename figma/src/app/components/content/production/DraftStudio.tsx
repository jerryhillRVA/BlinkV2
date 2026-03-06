import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { copyToClipboard as copyText } from "@/lib/clipboard";
import {
  Sparkles, Loader2, Plus, X, ChevronDown, ChevronUp,
  Check, Copy, AlertTriangle, CheckCircle2, Link2, MapPin,
  Hash, AtSign, Shield, ClipboardList, Video, FileText,
  Layers, LayoutGrid, Monitor, SquareCheck,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import type {
  Platform, ContentType, ContentBrief, ProductionOutput,
  CanonicalContentType, SlideOutline,
} from "../types";
import { CONTENT_TYPE_CONFIG } from "./production-config";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DraftStudioProps {
  platform: Platform;
  contentType: ContentType;
  title: string;
  brief: ContentBrief;
  outputs: ProductionOutput;
  onUpdateOutputs: (outputs: ProductionOutput) => void;
  onNext: () => void;
}

// ─── Canonical Type Mapping ────────────────────────────────────────────────

const CONTENT_TYPE_TO_CANONICAL: Record<ContentType, CanonicalContentType> = {
  // Instagram
  reel:            "VIDEO_SHORT_VERTICAL",
  carousel:        "IMAGE_CAROUSEL",
  "feed-post":     "IMAGE_SINGLE",
  story:           "STORY_FRAME_SET",
  guide:           "TEXT_POST",
  live:            "LIVE_BROADCAST",
  // TikTok
  "short-video":   "VIDEO_SHORT_VERTICAL",
  "photo-carousel":"IMAGE_CAROUSEL",
  // YouTube
  "long-form":     "VIDEO_LONG_HORIZONTAL",
  shorts:          "VIDEO_SHORT_VERTICAL",
  "live-stream":   "LIVE_BROADCAST",
  "community-post":"TEXT_POST",
  // Facebook
  "fb-feed-post":  "IMAGE_SINGLE",
  "fb-link-post":  "LINK_POST",
  "fb-reel":       "VIDEO_SHORT_VERTICAL",
  "fb-story":      "STORY_FRAME_SET",
  "fb-live":       "LIVE_BROADCAST",
  // LinkedIn
  "ln-text-post":  "TEXT_POST",
  "ln-document":   "DOCUMENT_CAROUSEL_PDF",
  "ln-article":    "TEXT_POST",
  "ln-video":      "VIDEO_SHORT_HORIZONTAL",
};

// ─── Platform Copy Limits ─────────────────────────────────────────────────

const COPY_LIMITS: Record<Platform, { limit: number; warn: number }> = {
  instagram: { limit: 2200, warn: 2000 },
  tiktok:    { limit: 2200, warn: 2000 },
  facebook:  { limit: 63206, warn: 500 },
  linkedin:  { limit: 3000, warn: 2500 },
  youtube:   { limit: 5000, warn: 4500 },
  tbd:       { limit: 2200, warn: 2000 },
};

// ─── Label Helpers ────────────────────────────────────────────────────────

function getHookLabel(ct: CanonicalContentType): string {
  switch (ct) {
    case "VIDEO_SHORT_VERTICAL":
    case "VIDEO_LONG_HORIZONTAL":
    case "VIDEO_SHORT_HORIZONTAL": return "Hook (first line / first 2 seconds)";
    case "STORY_FRAME_SET":        return "Frame 1 hook";
    case "IMAGE_CAROUSEL":
    case "DOCUMENT_CAROUSEL_PDF":  return "Slide 1 headline";
    case "TEXT_POST":
    case "LINK_POST":              return "Opening line";
    case "IMAGE_SINGLE":           return "Headline overlay (optional)";
    default:                       return "Hook";
  }
}

function getCopyLabel(ct: CanonicalContentType, platform: Platform): string {
  if (ct === "VIDEO_LONG_HORIZONTAL") return "Description (draft)";
  if (ct === "LINK_POST")             return "Post text (with link preview)";
  if (platform === "linkedin")        return "Post text";
  return "Caption";
}

function getScriptLabel(ct: CanonicalContentType): string {
  return ct === "LIVE_BROADCAST" ? "Run of Show" : "Script / Narration";
}

function getScriptPlaceholder(ct: CanonicalContentType): string {
  if (ct === "LIVE_BROADCAST")
    return "Segment plan + prompts + timing.\n\n00:00 – Welcome & intro\n05:00 – Main segment\n25:00 – Q&A\n28:00 – Wrap-up + CTA";
  if (ct === "VIDEO_LONG_HORIZONTAL")
    return "HOOK:\n\n[PROMISE]: In this video you'll discover...\n\n--- SECTION 1 ---\n\n--- SECTION 2 ---\n\n--- RECAP ---\n\n--- CTA ---";
  return "Beat-by-beat notes or full voiceover script...\n\n[0-3s] Hook\n[3-10s] Setup\n[10-30s] Content\n[30s+] CTA";
}

function getHookPlaceholder(ct: CanonicalContentType, platform: Platform): string {
  switch (ct) {
    case "VIDEO_SHORT_VERTICAL":   return "e.g., 'This one thing changed my mornings at 45...'";
    case "VIDEO_LONG_HORIZONTAL":  return "e.g., 'What if everything you know about midlife fitness is wrong?'";
    case "STORY_FRAME_SET":        return "e.g., '3 habits I wish I knew at 40'";
    case "IMAGE_CAROUSEL":         return "e.g., '5 yoga poses that changed everything after 40'";
    case "DOCUMENT_CAROUSEL_PDF":  return "e.g., 'The Midlife Wellness Framework'";
    case "TEXT_POST":
      return platform === "linkedin"
        ? "e.g., 'I spent 6 months testing this approach to wellness after 40...'"
        : "e.g., 'One thing I do every morning that took me from exhausted to energised...'";
    case "LINK_POST":              return "e.g., 'The metabolism truth nobody talks about after 40'";
    default:                       return "Make the first thing they see or hear impossible to ignore...";
  }
}

// ─── Requirement Rules (per draft-requirements.md) ───────────────────────

function isHookRequired(ct: CanonicalContentType, platform: Platform, brief: ContentBrief): boolean {
  const obj = brief.strategy.objective;
  if (ct === "VIDEO_SHORT_VERTICAL" || ct === "STORY_FRAME_SET") return true;
  if (brief.publishingMode === "PAID_BOOSTED") return true;
  if ((ct === "TEXT_POST" || ct === "LINK_POST") && (platform === "linkedin" || platform === "facebook")) return true;
  if ((ct === "VIDEO_LONG_HORIZONTAL" || ct === "VIDEO_SHORT_HORIZONTAL") && (obj === "awareness" || obj === "engagement")) return true;
  return false;
}

function isCopyRequired(ct: CanonicalContentType): boolean {
  return ["TEXT_POST","LINK_POST","IMAGE_SINGLE","IMAGE_CAROUSEL","DOCUMENT_CAROUSEL_PDF","STORY_FRAME_SET"].includes(ct);
}

function isScriptRequired(ct: CanonicalContentType): boolean {
  return ct === "LIVE_BROADCAST";
}

function showScriptSection(ct: CanonicalContentType): boolean {
  return ["VIDEO_SHORT_VERTICAL","VIDEO_LONG_HORIZONTAL","VIDEO_SHORT_HORIZONTAL","LIVE_BROADCAST"].includes(ct);
}

function showOSTSection(ct: CanonicalContentType): boolean {
  return ["VIDEO_SHORT_VERTICAL","VIDEO_LONG_HORIZONTAL","VIDEO_SHORT_HORIZONTAL","STORY_FRAME_SET"].includes(ct);
}

function isCtaLineShown(brief: ContentBrief): boolean {
  return ["traffic","leads","sales","conversion","lead-gen"].includes(brief.strategy.objective);
}

function isLinksRequired(ct: CanonicalContentType): boolean {
  return ct === "LINK_POST";
}

function isLinksShown(ct: CanonicalContentType, brief: ContentBrief): boolean {
  return ct === "LINK_POST" || !!brief.destinationUrl || ["traffic","leads","sales"].includes(brief.strategy.objective);
}

function isDisclosureRequired(brief: ContentBrief): boolean {
  return brief.publishingMode === "PAID_BOOSTED" || !!brief.paidPartnership;
}

function hasClaimsFlag(brief: ContentBrief): boolean {
  return !!brief.compliance?.containsClaims;
}

// ─── Slide helpers ────────────────────────────────────────────────────────

function isCarouselType(ct: CanonicalContentType): boolean {
  return ct === "IMAGE_CAROUSEL" || ct === "DOCUMENT_CAROUSEL_PDF";
}

// ─── AI Mock Generator ───────────────────────────────────────────────────

function mockGenerateField(
  field: string,
  canonicalType: CanonicalContentType,
  platform: Platform,
  contentType: ContentType,
  brief: ContentBrief,
  title: string,
  outputs: ProductionOutput,
): Partial<ProductionOutput> {
  const { keyMessage, ctaText, objective } = brief.strategy;
  const km = keyMessage || "wellness practices for women 40+";
  const config = CONTENT_TYPE_CONFIG[contentType];

  switch (field) {
    case "hook": {
      const options = [
        `This one thing changed everything for me at 40...`,
        `Nobody tells women over 40 this about ${km.slice(0, 35).toLowerCase()}...`,
        `I tested this for 30 days. Here's what actually happened.`,
        `The ${km.slice(0, 30).toLowerCase()} truth nobody talks about after 40`,
        `Stop scrolling — this is the sign you needed.`,
        `If you're over 40 and struggling with ${km.slice(0, 25).toLowerCase()}, read this.`,
        `What 6 months of consistency taught me about midlife wellness`,
      ];
      const count = config.hookBankCount || 3;
      const bank = options.slice(0, Math.min(count, options.length));
      return { hookBank: bank, hook: bank[0] };
    }
    case "post_copy": {
      const platformCopy: Record<Platform, string> = {
        instagram: `${km}\n\nHere's what no one tells you about this journey at 40+...\n\nSave this for your next practice session 💛\n\n${ctaText || "Follow for more wellness content made for women like you."}`,
        tiktok:    `${km} — and here's why it matters after 40 👇\n\n${ctaText || "Follow for more real wellness tips for midlife women."}`,
        facebook:  `${km}\n\nThis is something we don't talk about enough in the wellness space. If you're navigating your 40s or 50s, this one is for you.\n\n${ctaText || "Like and share if this resonates!"}`,
        linkedin:  `${km}\n\nAfter working with hundreds of women in their 40s and 50s, here's what I've learned:\n\n→ Small, consistent habits beat intense bursts\n→ Your body's needs evolve — and that's okay\n→ Wellness isn't one-size-fits-all\n\nWhat's been the biggest shift in your wellness journey?\n\n${ctaText || "#WellnessOver40 #MidlifeWellness #HiveCollective"}`,
        youtube:   `${km}\n\nIn this video, we break down everything you need to know.\n\nTimestamps:\n0:00 – Introduction\n1:30 – The core insight\n5:00 – Practical steps\n10:00 – Q&A\n\n${ctaText || "Subscribe for weekly wellness content for women 40+."}`,
        tbd:       `${km}\n\n${ctaText || "Follow for more."}`,
      };
      return { postCopy: platformCopy[platform] || platformCopy.instagram };
    }
    case "script": {
      if (canonicalType === "LIVE_BROADCAST") {
        return { script: `00:00 – Welcome & intro\n   "Welcome to today's live! I'm so glad you're here. We're talking about ${km}."\n\n05:00 – Main segment\n   Key points:\n   • Point 1\n   • Point 2\n   • Point 3\n\n20:00 – Q&A\n   "Drop your questions in the comments!"\n\n28:00 – Wrap-up\n   "${ctaText || "Thanks for joining — see you next time!"}"`};
      }
      if (canonicalType === "VIDEO_LONG_HORIZONTAL") {
        return { script: `HOOK: ${(outputs.hook || km).slice(0, 80)}\n\n[PROMISE]: In this video, you'll discover ${brief.platformRules.viewerPromise || "the exact framework"}\n\n--- SECTION 1: The Problem ---\n${km}\n\n--- SECTION 2: The Solution ---\nHere's what the research shows...\n\n--- SECTION 3: Steps ---\n1. Start with awareness\n2. Build the habit\n3. Track and iterate\n\n--- RECAP ---\nLet's recap the key takeaways:\n\n--- CTA ---\n${ctaText || "Subscribe and hit the bell for more content like this."}` };
      }
      return { script: `[0-3s] HOOK: ${outputs.hook || "Pattern interrupt"}\n\n[3-10s] SETUP: ${km}\n\n[10-30s] CONTENT:\n• Point 1: The key insight\n• Point 2: Why it matters\n• Point 3: What to do\n\n[30s+] CTA: ${ctaText || "Follow for more"}` };
    }
    case "on_screen_text": {
      if (canonicalType === "STORY_FRAME_SET") {
        return { onScreenText: "Frame 1: Hook headline (large, centred)\nFrame 2: Main point overlay\nFrame 3: CTA text + sticker placement\n\n• Keep text within safe zones (top 250px / bottom 300px clear)\n• Max 3 lines per frame" };
      }
      return { onScreenText: `1. Hook callout (0–2s): "${(outputs.hook || km).slice(0, 40)}"\n2. Key benefit text (3–6s)\n3. Supporting stat or proof (7–10s)\n4. CTA visual (final 2s)\n\n• Keep text within safe zones\n• Max 2–3 words per card\n• High contrast — white on dark or dark on light` };
    }
    case "cta_line": {
      const templates: Record<string, string> = {
        traffic:    "Full details at the link in bio.",
        leads:      "Grab the free guide — link in bio.",
        sales:      "Shop now — link in bio.",
        "lead-gen": "Download the free resource — link in bio.",
        conversion: `${ctaText || "Take the next step — link in bio."}`,
      };
      return { ctaLine: templates[objective] || ctaText || "Learn more — link in bio." };
    }
    case "hashtags": {
      const sets: Record<Platform, { name: string; tags: string[] }[]> = {
        instagram: [
          { name: "Wellness", tags: ["wellness", "selfcare", "wellnessover40", "mindfulness", "healthylifestyle"] },
          { name: "Yoga 40+", tags: ["yogaover40", "yogaforwomen", "midlifeyoga", "yogaeveryday", "yogalove"] },
          { name: "Fitness", tags: ["fitnessover40", "strongwomen", "fitnessmotivation", "healthyaging", "fitnesswomen"] },
        ],
        tiktok: [
          { name: "For You", tags: ["wellnesstok", "fitnessover40", "midlifewellness", "yogatok", "healthyaging"] },
          { name: "Community", tags: ["womenover40", "midlife", "40pluswomen", "agegracefully", "selfcaretok"] },
        ],
        facebook: [
          { name: "General", tags: ["wellness", "womenover40", "healthyliving", "midlifewellness"] },
        ],
        linkedin: [
          { name: "Professional", tags: ["WellnessOver40", "MidlifeWellness", "HiveCollective", "WomenInWellness", "HealthyAging"] },
        ],
        youtube: [
          { name: "Channel", tags: ["wellnessover40", "yogaforwomen", "midlifehealth", "fitnessover40", "hivecollective"] },
        ],
        tbd: [
          { name: "General", tags: ["wellness", "womenover40", "healthyliving"] },
        ],
      };
      return { hashtagSets: sets[platform] || sets.instagram };
    }
    case "metadata": {
      return {
        metadata: {
          titleOptions: [
            `${title} (Complete Guide 2026)`,
            `How to ${title.toLowerCase()} — Step by Step for Women 40+`,
            `${title}: What Nobody Tells You After 40`,
          ],
          description: `In this video, we dive into ${title.toLowerCase()}.\n\n${km}\n\nTimestamps:\n0:00 – Introduction\n1:30 – The core insight\n5:00 – Practical steps\n10:00 – Q&A & wrap-up\n\n${ctaText || "Subscribe for weekly wellness content for women 40+."}\n\n#WellnessOver40 #HiveCollective`,
          chapters: [
            { time: "0:00",  title: "Introduction" },
            { time: "1:30",  title: "Core Insight" },
            { time: "5:00",  title: "Practical Steps" },
            { time: "10:00", title: "Q&A & Wrap-up" },
          ],
          tags: ["wellness over 40", "women's health", "midlife wellness", "yoga", "fitness", "hive collective"],
        },
      };
    }
    case "slides": {
      const hasCTA = brief.strategy.ctaType && brief.strategy.ctaType !== "none";
      const slideCount = Math.max(brief.platformRules.slideCount || 5, 3);
      const slides: SlideOutline[] = [];
      for (let i = 0; i < slideCount; i++) {
        const isFirst = i === 0;
        const isLast  = i === slideCount - 1;
        slides.push({
          id:            `slide-${Date.now()}-${i}`,
          slideNumber:   i + 1,
          headline:      isFirst ? (km.slice(0, 50) || "Hook Headline") : isLast && hasCTA ? `Ready to ${ctaText?.toLowerCase() || "get started"}?` : `Key Point ${i}`,
          body:          isFirst ? "Opening context that draws them in." : isLast && hasCTA ? ctaText || "Take action now." : `Supporting details and insight for point ${i}.`,
          visualGuidance: "",
          isCTA:         isLast && !!hasCTA,
        });
      }
      return { slideOutlines: slides };
    }
    case "story_frames": {
      const frameCount = brief.platformRules.frameCount || 3;
      return {
        storyFrames: Array.from({ length: frameCount }, (_, i) => ({
          id:          `frame-${Date.now()}-${i}`,
          frameNumber: i + 1,
          text:        i === 0 ? (outputs.hook || km.slice(0, 60)) : i === frameCount - 1 ? ctaText || "Take action now" : `Supporting point ${i}`,
          ostText:     i === 0 ? "Large headline text, centre frame" : i === frameCount - 1 ? "CTA button or link sticker" : "Key point overlay",
        })),
      };
    }
    default:
      return {};
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export function DraftStudio({
  platform,
  contentType,
  title,
  brief,
  outputs,
  onUpdateOutputs,
  onNext,
}: DraftStudioProps) {
  const canonicalType: CanonicalContentType =
    brief.canonicalType || CONTENT_TYPE_TO_CANONICAL[contentType] || "TEXT_POST";

  const config    = CONTENT_TYPE_CONFIG[contentType];
  const charLimits = COPY_LIMITS[platform];

  // ─── Derived requirements ───
  const hookRequired       = isHookRequired(canonicalType, platform, brief);
  const copyRequired       = isCopyRequired(canonicalType);
  const scriptRequired     = isScriptRequired(canonicalType);
  const showScript         = showScriptSection(canonicalType);
  const showOST            = showOSTSection(canonicalType);
  const showStory          = canonicalType === "STORY_FRAME_SET";
  const showCarousel       = isCarouselType(canonicalType);
  const showCtaLine        = isCtaLineShown(brief);
  const showLinks          = isLinksShown(canonicalType, brief);
  const linksRequired      = isLinksRequired(canonicalType);
  const disclosureRequired = isDisclosureRequired(brief);
  const hasClaims          = hasClaimsFlag(brief);
  const showYTMeta         = platform === "youtube" && canonicalType === "VIDEO_LONG_HORIZONTAL";

  // ─── UI state ───
  const [scriptExpanded,       setScriptExpanded]       = useState(canonicalType === "VIDEO_LONG_HORIZONTAL" || canonicalType === "LIVE_BROADCAST");
  const [hookBankOpen,         setHookBankOpen]         = useState(false);
  const [tagsOpen,             setTagsOpen]             = useState(false);
  const [ytMetaOpen,           setYtMetaOpen]           = useState(false);
  const [generatingField,      setGeneratingField]      = useState<string | null>(null);

  // inline add states
  const [addingLink,           setAddingLink]           = useState(false);
  const [newLink,              setNewLink]              = useState("");
  const [addingHashtag,        setAddingHashtag]        = useState(false);
  const [newHashtag,           setNewHashtag]           = useState("");
  const [addingMention,        setAddingMention]        = useState(false);
  const [newMention,           setNewMention]           = useState("");
  const [addingClaim,          setAddingClaim]          = useState(false);
  const [newClaim,             setNewClaim]             = useState("");
  const [addingHookOption,     setAddingHookOption]     = useState(false);
  const [newHookOption,        setNewHookOption]        = useState("");

  // ─── Helpers ───
  const update = (patch: Partial<ProductionOutput>) =>
    onUpdateOutputs({ ...outputs, ...patch });

  const handleAIGenerate = (field: string) => {
    setGeneratingField(field);
    setTimeout(() => {
      const patch = mockGenerateField(field, canonicalType, platform, contentType, brief, title, outputs);
      update(patch);
      setGeneratingField(null);
      toast.success(`${field.replace(/_/g, " ")} generated`);
    }, 1400);
  };

  const aiButton = (field: string, label = "AI") => (
    <Button
      variant="ghost" size="sm"
      className="h-6 text-[10px] gap-1 text-[#d94e33] shrink-0"
      onClick={() => handleAIGenerate(field)}
      disabled={!!generatingField}
    >
      {generatingField === field
        ? <Loader2 className="size-3 animate-spin" />
        : <Sparkles className="size-3" />}
      {label}
    </Button>
  );

  const sectionHeader = (icon: React.ReactNode, label: string, required?: boolean, action?: React.ReactNode) => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[#d94e33]">{icon}</span>
        <Label className="text-xs font-bold text-gray-800">
          {label}
          {required && <span className="text-[#d94e33] ml-0.5">*</span>}
        </Label>
      </div>
      {action}
    </div>
  );

  // ─── Validation (blockers + warnings) ───
  const blockers:  string[] = [];
  const warnings:  string[] = [];

  if (hookRequired   && !(outputs.hook?.trim()))           blockers.push("Hook is required");
  if (copyRequired   && !(outputs.postCopy?.trim()))       blockers.push(`${getCopyLabel(canonicalType, platform)} is required`);
  if (scriptRequired && !(outputs.script?.trim()))         blockers.push("Run of show is required");
  if (linksRequired  && !(outputs.links?.length))          blockers.push("A destination link is required for Link Posts");
  if (showCarousel   && !(outputs.slideOutlines?.length))  blockers.push("Add at least one slide");
  if (showStory      && !(outputs.storyFrames?.length))    blockers.push("Add at least one story frame");

  if ((outputs.hook?.length || 0) > 120)                                 warnings.push("Hook may be too long (>120 chars)");
  if ((outputs.postCopy?.length || 0) >= charLimits.warn)                warnings.push(`Caption approaching ${platform} limit (${charLimits.limit.toLocaleString()} chars)`);
  if (showCtaLine    && !(outputs.ctaLine?.trim()))                       warnings.push("CTA line recommended for this objective");
  if (disclosureRequired && !(outputs.disclosures?.trim()))               warnings.push("Disclosure text needed for paid / boosted content");
  if (hasClaims      && !(outputs.claimsList?.length))                    warnings.push("Claims flagged in Brief — add claims list for QA");
  if (showLinks && !linksRequired && !(outputs.links?.length))            warnings.push("Consider adding a destination link");

  const isReady = blockers.length === 0;

  // ─── Derived copy of script (backward compat) ───
  const scriptValue = outputs.script || outputs.scriptVersions?.[0]?.content || "";

  // ─── Canonical type label ───
  const canonicalLabels: Record<CanonicalContentType, string> = {
    VIDEO_SHORT_VERTICAL:   "Short Video",
    VIDEO_LONG_HORIZONTAL:  "Long-form Video",
    VIDEO_SHORT_HORIZONTAL: "Video",
    IMAGE_SINGLE:           "Image Post",
    IMAGE_CAROUSEL:         "Carousel",
    TEXT_POST:              "Text Post",
    LINK_POST:              "Link Post",
    DOCUMENT_CAROUSEL_PDF:  "Document Carousel",
    STORY_FRAME_SET:        "Story",
    LIVE_BROADCAST:         "Live Broadcast",
  };

  const platformLabels: Record<Platform, string> = {
    instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
    facebook: "Facebook", linkedin: "LinkedIn", tbd: "TBD",
  };

  const objectiveLabels: Record<string, string> = {
    awareness: "Awareness", engagement: "Engagement", traffic: "Traffic",
    leads: "Lead Gen", sales: "Sales", community: "Community",
    recruiting: "Recruiting", "lead-gen": "Lead Gen",
    trust: "Trust", education: "Education", conversion: "Conversion",
  };

  return (
    <div className="space-y-3">

      {/* ─── §1 DRAFT HEADER ─── */}
      <div className="flex flex-wrap items-center gap-1.5 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
        <Badge variant="outline" className="text-[10px] bg-white gap-1">
          {platformLabels[platform]}
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-white">
          {canonicalLabels[canonicalType]}
        </Badge>
        <Badge variant="outline" className="text-[10px] bg-white">
          {objectiveLabels[brief.strategy.objective] || brief.strategy.objective}
        </Badge>
        {brief.publishingMode === "PAID_BOOSTED" && (
          <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">Paid Boosted</Badge>
        )}
        {brief.paidPartnership && (
          <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">Paid Partnership</Badge>
        )}
        {brief.strategy.keyMessage && (
          <span className="text-[10px] text-gray-500 ml-1 truncate max-w-[240px]">
            "{brief.strategy.keyMessage.slice(0, 80)}{brief.strategy.keyMessage.length > 80 ? "..." : ""}"
          </span>
        )}
      </div>

      {/* ─── §2A HOOK ─── */}
      <Card className="border-gray-100">
        <CardContent className="p-4 space-y-3">
          {sectionHeader(
            <FileText className="size-3.5" />,
            getHookLabel(canonicalType),
            hookRequired,
            aiButton("hook", "Generate hooks"),
          )}
          <p className="text-[10px] text-gray-500">
            {canonicalType === "IMAGE_SINGLE"
              ? "Optional headline or text overlay on the image."
              : "Make the first thing they see or hear impossible to ignore."}
          </p>
          <div className="relative">
            <Input
              value={outputs.hook || ""}
              onChange={e => update({ hook: e.target.value })}
              placeholder={getHookPlaceholder(canonicalType, platform)}
              className={cn("h-9 text-xs pr-12", hookRequired && !(outputs.hook?.trim()) && "border-amber-300")}
            />
            <span className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 text-[9px]",
              (outputs.hook?.length || 0) > 120 ? "text-amber-600" : "text-gray-300"
            )}>
              {outputs.hook?.length || 0}
            </span>
          </div>
          {(outputs.hook?.length || 0) > 120 && (
            <p className="text-[10px] text-amber-600 flex items-center gap-1">
              <AlertTriangle className="size-3" /> Hook is long — consider trimming to under 120 characters
            </p>
          )}

          {/* Hook bank */}
          {(outputs.hookBank || []).length > 0 && (
            <div className="space-y-1.5">
              <button
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700"
                onClick={() => setHookBankOpen(v => !v)}
              >
                {hookBankOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                {outputs.hookBank!.length} hook option{outputs.hookBank!.length !== 1 ? "s" : ""} — click to select
              </button>
              {hookBankOpen && (
                <div className="space-y-1">
                  {outputs.hookBank!.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { update({ hook: h }); toast.success("Hook selected"); }}
                      className={cn(
                        "w-full text-left text-[10px] px-2.5 py-2 rounded-md border transition-colors",
                        outputs.hook === h
                          ? "border-[#d94e33]/40 bg-[#d94e33]/5 text-gray-800"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-white hover:border-gray-200"
                      )}
                    >
                      {h}
                    </button>
                  ))}
                  {/* Add custom hook option */}
                  {!addingHookOption ? (
                    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 w-full"
                      onClick={() => setAddingHookOption(true)}>
                      <Plus className="size-2.5" /> Add hook option
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Input value={newHookOption} onChange={e => setNewHookOption(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && newHookOption.trim()) {
                            update({ hookBank: [...(outputs.hookBank || []), newHookOption.trim()] });
                            setNewHookOption(""); setAddingHookOption(false);
                          } else if (e.key === "Escape") { setNewHookOption(""); setAddingHookOption(false); }
                        }}
                        placeholder="Enter hook option..." className="h-7 text-[10px] flex-1" autoFocus />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={() => { if (newHookOption.trim()) { update({ hookBank: [...(outputs.hookBank || []), newHookOption.trim()] }); setNewHookOption(""); setAddingHookOption(false); } }}>
                        <Check className="size-3 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={() => { setNewHookOption(""); setAddingHookOption(false); }}>
                        <X className="size-3 text-gray-400" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── §2B CAPTION / BODY COPY ─── */}
      {!showCarousel && (
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-3">
            {sectionHeader(
              <LayoutGrid className="size-3.5" />,
              getCopyLabel(canonicalType, platform),
              copyRequired,
              aiButton("post_copy"),
            )}
            {canonicalType === "VIDEO_LONG_HORIZONTAL" && (
              <p className="text-[10px] text-gray-500">Draft description copy. Final title is handled in Packaging.</p>
            )}
            <div className="space-y-1">
              <Textarea
                value={outputs.postCopy || ""}
                onChange={e => update({ postCopy: e.target.value })}
                placeholder={
                  copyRequired
                    ? platform === "linkedin"
                      ? "Start with your opening line, then build out your post in short paragraphs..."
                      : "Write your caption here..."
                    : "Caption (optional for this content type)..."
                }
                className={cn(
                  "resize-none text-xs",
                  canonicalType === "VIDEO_LONG_HORIZONTAL" ? "min-h-[120px]" : "min-h-[100px]",
                  copyRequired && !(outputs.postCopy?.trim()) && "border-amber-300"
                )}
                maxLength={charLimits.limit}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(outputs.postCopy?.length || 0) > 125 && platform !== "youtube" && (
                    <p className="text-[9px] text-amber-600">
                      Preview truncates at ~125 chars
                    </p>
                  )}
                </div>
                <span className={cn(
                  "text-[9px]",
                  (outputs.postCopy?.length || 0) >= charLimits.warn ? "text-amber-600" : "text-gray-400"
                )}>
                  {(outputs.postCopy?.length || 0).toLocaleString()} / {charLimits.limit.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── §2C SCRIPT / RUN OF SHOW ─── */}
      {showScript && (
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                className="flex items-center gap-1.5 group"
                onClick={() => setScriptExpanded(v => !v)}
              >
                <Video className="size-3.5 text-[#d94e33]" />
                <Label className="text-xs font-bold text-gray-800 cursor-pointer group-hover:text-[#d94e33] transition-colors">
                  {getScriptLabel(canonicalType)}
                  {scriptRequired && <span className="text-[#d94e33] ml-0.5">*</span>}
                  {!scriptRequired && <span className="text-[10px] font-normal text-gray-400 ml-1.5">(optional)</span>}
                </Label>
                {scriptExpanded
                  ? <ChevronUp className="size-3 text-gray-400" />
                  : <ChevronDown className="size-3 text-gray-400" />}
              </button>
              {scriptExpanded && aiButton("script")}
            </div>
            {!scriptExpanded && (
              <p className="text-[10px] text-gray-400">
                {canonicalType === "LIVE_BROADCAST"
                  ? "Segment plan + prompts + timing — click to expand"
                  : "Voiceover / dialog or beat-by-beat notes — click to expand"}
              </p>
            )}
            {scriptExpanded && (
              <>
                <p className="text-[10px] text-gray-500">
                  {canonicalType === "LIVE_BROADCAST"
                    ? "Segment plan + prompts + timing."
                    : "Voiceover / dialog or beat-by-beat notes."}
                </p>
                <Textarea
                  value={scriptValue}
                  onChange={e => update({ script: e.target.value, scriptVersions: [{ id: `sv-${Date.now()}`, content: e.target.value, version: 1, approved: false }] })}
                  placeholder={getScriptPlaceholder(canonicalType)}
                  className={cn(
                    "resize-none font-mono text-xs",
                    canonicalType === "VIDEO_LONG_HORIZONTAL" ? "min-h-[280px]" : "min-h-[180px]",
                    scriptRequired && !scriptValue.trim() && "border-amber-300"
                  )}
                />
                <div className="flex items-center justify-between text-[9px] text-gray-400">
                  <span>{scriptValue.length} chars</span>
                  <span>~{Math.ceil(scriptValue.split(/\s+/).filter(Boolean).length / 150)} min read</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── §2D ON-SCREEN TEXT ─── */}
      {showOST && (
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-2">
            {sectionHeader(
              <Monitor className="size-3.5" />,
              "On-Screen Text (OST) Plan",
              false,
              aiButton("on_screen_text"),
            )}
            <p className="text-[10px] text-gray-500">
              One idea per card / beat. Keep text within safe zones.
            </p>
            <Textarea
              value={outputs.onScreenText || ""}
              onChange={e => update({ onScreenText: e.target.value })}
              placeholder={
                canonicalType === "STORY_FRAME_SET"
                  ? "Frame 1: Headline (large, centred)\nFrame 2: Key point overlay\nFrame 3: CTA text + sticker"
                  : "1. Hook callout (0–2s)\n2. Key benefit (3–6s)\n3. Supporting proof (7–10s)\n4. CTA visual (final 2s)"
              }
              className="min-h-[80px] resize-none text-xs font-mono"
            />
          </CardContent>
        </Card>
      )}

      {/* ─── §2E STORY FRAME BREAKDOWN ─── */}
      {showStory && (
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-3">
            {sectionHeader(
              <Layers className="size-3.5" />,
              "Story Frame Breakdown",
              true,
              <div className="flex gap-1">
                {aiButton("story_frames", "Generate")}
                <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1"
                  onClick={() => {
                    const frames = outputs.storyFrames || [];
                    update({ storyFrames: [...frames, { id: `frame-${Date.now()}`, frameNumber: frames.length + 1, text: "", ostText: "" }] });
                  }}>
                  <Plus className="size-2.5" /> Add Frame
                </Button>
              </div>
            )}
            <p className="text-[10px] text-gray-500">
              Frame count from Brief: <strong>{brief.platformRules.frameCount || 3}</strong>.
              Each frame has its copy/script and on-screen text.
            </p>

            {!(outputs.storyFrames?.length) && (
              <div className="text-center py-5 border border-dashed border-gray-200 rounded-lg">
                <p className="text-[10px] text-gray-400 mb-2">No frames yet</p>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"
                  onClick={() => handleAIGenerate("story_frames")}>
                  <Sparkles className="size-3" /> Generate frames
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {(outputs.storyFrames || []).map((frame, idx) => (
                <div key={frame.id}
                  className={cn("border rounded-lg p-3 space-y-2 bg-white", idx === 0 ? "border-[#d94e33]/20" : "border-gray-200")}>
                  <div className="flex items-center justify-between">
                    <Badge variant={idx === 0 ? "default" : "outline"} className={cn("text-[9px]", idx === 0 && "bg-[#d94e33]")}>
                      {idx === 0 ? "Hook (Frame 1)" : `Frame ${frame.frameNumber}`}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                      onClick={() => {
                        const updated = (outputs.storyFrames || []).filter((_, i) => i !== idx)
                          .map((f, i) => ({ ...f, frameNumber: i + 1 }));
                        update({ storyFrames: updated });
                      }}>
                      <X className="size-3 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] text-gray-500">Script / copy</Label>
                      <Textarea
                        value={frame.text}
                        onChange={e => {
                          const updated = (outputs.storyFrames || []).map((f, i) => i === idx ? { ...f, text: e.target.value } : f);
                          update({ storyFrames: updated });
                        }}
                        placeholder={idx === 0 ? "Hook text or opening copy..." : "Frame copy or script..."}
                        className="min-h-[60px] resize-none text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-gray-500">On-screen text</Label>
                      <Textarea
                        value={frame.ostText}
                        onChange={e => {
                          const updated = (outputs.storyFrames || []).map((f, i) => i === idx ? { ...f, ostText: e.target.value } : f);
                          update({ storyFrames: updated });
                        }}
                        placeholder="Overlay text, sticker placement..."
                        className="min-h-[60px] resize-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── §2F CAROUSEL / DOCUMENT SLIDE OUTLINE ─── */}
      {showCarousel && (
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-3">
            {sectionHeader(
              canonicalType === "DOCUMENT_CAROUSEL_PDF" ? <FileText className="size-3.5" /> : <Layers className="size-3.5" />,
              canonicalType === "DOCUMENT_CAROUSEL_PDF" ? "Document Slide Outline" : "Slide Copy",
              true,
              <div className="flex gap-1">
                {aiButton("slides", "Generate")}
                <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1"
                  onClick={() => {
                    const slides = outputs.slideOutlines || [];
                    const hasCTA = brief.strategy.ctaType && brief.strategy.ctaType !== "none";
                    if (hasCTA && !slides.some(s => s.isCTA)) {
                      update({ slideOutlines: [...slides, { id: `slide-${Date.now()}-cta`, slideNumber: slides.length + 1, headline: "[CTA]", body: brief.strategy.ctaText || "", visualGuidance: "", isCTA: true }] });
                    } else {
                      update({ slideOutlines: [...slides, { id: `slide-${Date.now()}`, slideNumber: slides.length + 1, headline: "", body: "", visualGuidance: "" }] });
                    }
                  }}>
                  <Plus className="size-2.5" /> Add Slide
                </Button>
              </div>
            )}
            <p className="text-[10px] text-gray-500">
              {canonicalType === "DOCUMENT_CAROUSEL_PDF"
                ? "Outline each page: cover + content pages + CTA page."
                : "Each slide needs at least a headline. First slide = Hook, last slide = CTA (if applicable)."}
            </p>

            {/* Validation */}
            {(() => {
              const slides = outputs.slideOutlines || [];
              const hasCTA = brief.strategy.ctaType && brief.strategy.ctaType !== "none";
              const errs: string[] = [];
              if (slides.length < 2) errs.push("Minimum 2 slides required");
              if (hasCTA && !slides.some(s => s.isCTA)) errs.push("CTA slide required (from Brief)");
              return errs.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 space-y-1">
                  {errs.map((e, i) => (
                    <p key={i} className="text-[10px] text-amber-700 flex items-center gap-1">
                      <span className="size-1 rounded-full bg-amber-500 shrink-0" />{e}
                    </p>
                  ))}
                </div>
              ) : null;
            })()}

            {!(outputs.slideOutlines?.length) && (
              <div className="text-center py-5 border border-dashed border-gray-200 rounded-lg">
                <p className="text-[10px] text-gray-400 mb-2">No slides yet</p>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"
                  onClick={() => handleAIGenerate("slides")}>
                  <Sparkles className="size-3" /> Generate slides
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {(outputs.slideOutlines || []).map((slide, idx) => {
                const isFirst = idx === 0;
                return (
                  <div key={slide.id}
                    className={cn(
                      "border rounded-lg p-3 space-y-2",
                      slide.isCTA ? "border-green-300 bg-green-50/50" : isFirst ? "border-[#d94e33]/20 bg-[#d94e33]/[0.02]" : "border-gray-200 bg-gray-50/50"
                    )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={slide.isCTA ? "default" : "outline"} className={cn("text-[9px]", slide.isCTA && "bg-green-600")}>
                          {slide.isCTA ? "CTA Slide" : isFirst ? "Hook — Slide 1" : `Slide ${slide.slideNumber}`}
                        </Badge>
                        <div className="flex gap-0.5">
                          {idx > 0 && (
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-[#d94e33]"
                              onClick={() => {
                                const s = [...(outputs.slideOutlines || [])];
                                [s[idx-1], s[idx]] = [s[idx], s[idx-1]];
                                update({ slideOutlines: s.map((sl, i) => ({ ...sl, slideNumber: i + 1 })) });
                              }}>
                              <ChevronUp className="size-3" />
                            </Button>
                          )}
                          {idx < (outputs.slideOutlines || []).length - 1 && (
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-[#d94e33]"
                              onClick={() => {
                                const s = [...(outputs.slideOutlines || [])];
                                [s[idx], s[idx+1]] = [s[idx+1], s[idx]];
                                update({ slideOutlines: s.map((sl, i) => ({ ...sl, slideNumber: i + 1 })) });
                              }}>
                              <ChevronDown className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {!(slide.isCTA && brief.strategy.ctaType && brief.strategy.ctaType !== "none") && (
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-300 hover:text-red-500"
                          onClick={() => {
                            const updated = (outputs.slideOutlines || []).filter((_, i) => i !== idx).map((s, i) => ({ ...s, slideNumber: i + 1 }));
                            update({ slideOutlines: updated });
                          }}>
                          <X className="size-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[9px] text-gray-500">
                          Headline {!isFirst && <span className="text-gray-400">(optional if CTA slide)</span>}
                        </Label>
                        <Input
                          value={slide.headline}
                          onChange={e => {
                            const updated = (outputs.slideOutlines || []).map((s) => s.id === slide.id ? { ...s, headline: e.target.value } : s);
                            update({ slideOutlines: updated });
                          }}
                          placeholder={slide.isCTA ? "e.g., Ready to get started?" : isFirst ? "Hook headline..." : "Slide headline..."}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] text-gray-500">Body copy</Label>
                        <Textarea
                          value={slide.body}
                          onChange={e => {
                            const updated = (outputs.slideOutlines || []).map((s) => s.id === slide.id ? { ...s, body: e.target.value } : s);
                            update({ slideOutlines: updated });
                          }}
                          placeholder={slide.isCTA ? brief.strategy.ctaText || "Call-to-action text..." : "Supporting copy..."}
                          className="min-h-[60px] resize-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alt text */}
            <div className="space-y-1.5 pt-1 border-t border-gray-100">
              <Label className="text-[10px] font-bold text-gray-700">
                Alt text <span className="text-[#d94e33]">*</span>
                <span className="text-[9px] font-normal text-gray-400 ml-1">— accessibility description for the full carousel</span>
              </Label>
              <Input
                value={outputs.altText || ""}
                onChange={e => update({ altText: e.target.value })}
                placeholder="Describe the carousel for screen readers..."
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── §3 CTA & LINKS ─── */}
      {(showCtaLine || showLinks) && (
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-3">
            {sectionHeader(<Link2 className="size-3.5" />, "CTA & Links")}

            {showCtaLine && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-semibold text-gray-700">
                    CTA line <span className="text-gray-400 font-normal">(reinforcement)</span>
                  </Label>
                  {aiButton("cta_line")}
                </div>
                <p className="text-[10px] text-gray-500">e.g., "Grab the free guide — link in bio."</p>
                <Input
                  value={outputs.ctaLine || ""}
                  onChange={e => update({ ctaLine: e.target.value })}
                  placeholder={brief.strategy.ctaText || "Your call-to-action line..."}
                  className="h-9 text-xs"
                />
              </div>
            )}

            {showLinks && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-gray-700">
                  Destination link{linksRequired && <span className="text-[#d94e33] ml-0.5">*</span>}
                </Label>
                <p className="text-[10px] text-gray-500">
                  {linksRequired ? "Required for link posts." : "UTM tagging recommended for paid / traffic objectives."}
                </p>
                <div className="space-y-1.5">
                  {(outputs.links || []).map((link, i) => (
                    <div key={i} className="flex items-center gap-1.5 group">
                      <Link2 className="size-3 text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-700 flex-1 truncate">{link}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => update({ links: (outputs.links || []).filter((_, idx) => idx !== i) })}>
                        <X className="size-3 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                {!addingLink ? (
                  <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1"
                    onClick={() => setAddingLink(true)}>
                    <Plus className="size-2.5" /> Add link
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Input value={newLink} onChange={e => setNewLink(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && newLink.trim()) {
                          update({ links: [...(outputs.links || []), newLink.trim()] });
                          setNewLink(""); setAddingLink(false);
                        } else if (e.key === "Escape") { setNewLink(""); setAddingLink(false); }
                      }}
                      placeholder="https://..." className="h-7 text-[10px] flex-1" autoFocus type="url" />
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => { if (newLink.trim()) { update({ links: [...(outputs.links || []), newLink.trim()] }); setNewLink(""); setAddingLink(false); } }}>
                      <Check className="size-3 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => { setNewLink(""); setAddingLink(false); }}>
                      <X className="size-3 text-gray-400" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── §4 TAGS & MENTIONS (collapsible) ─── */}
      <Card className="border-gray-100">
        <CardContent className="p-4 space-y-3">
          <button className="flex items-center justify-between w-full group" onClick={() => setTagsOpen(v => !v)}>
            <div className="flex items-center gap-1.5">
              <Hash className="size-3.5 text-[#d94e33]" />
              <Label className="text-xs font-bold text-gray-800 cursor-pointer">Tags & Mentions</Label>
              <span className="text-[10px] text-gray-400">(optional)</span>
            </div>
            {tagsOpen ? <ChevronUp className="size-3.5 text-gray-400" /> : <ChevronDown className="size-3.5 text-gray-400" />}
          </button>

          {tagsOpen && (
            <div className="space-y-4 pt-1">
              {/* Hashtags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-semibold text-gray-700">Hashtags</Label>
                  {aiButton("hashtags", "Generate sets")}
                </div>
                {/* Saved sets */}
                {(outputs.hashtagSets || []).filter(s => s?.tags).map((set, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-2 bg-gray-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-700">{set.name}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5 text-[#d94e33]"
                          onClick={() => { update({ hashtags: set.tags }); toast.success(`"${set.name}" applied`); }}>
                          Use set
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0"
                          onClick={() => update({ hashtagSets: (outputs.hashtagSets || []).filter((_, idx) => idx !== i) })}>
                          <X className="size-2.5 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {set.tags.map((t, ti) => (
                        <span key={ti} className="text-[9px] text-gray-500">#{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Active tags */}
                <div className="flex flex-wrap gap-1.5">
                  {(outputs.hashtags || []).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] gap-1 pr-1">
                      #{tag}
                      <button onClick={() => update({ hashtags: (outputs.hashtags || []).filter((_, idx) => idx !== i) })}
                        className="hover:text-red-500">
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {!addingHashtag ? (
                    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"
                      onClick={() => setAddingHashtag(true)}>
                      <Plus className="size-2.5" /> Add
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">#</span>
                      <Input value={newHashtag} onChange={e => setNewHashtag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && newHashtag.trim()) {
                            update({ hashtags: [...(outputs.hashtags || []), newHashtag.trim()] });
                            setNewHashtag(""); setAddingHashtag(false);
                          } else if (e.key === "Escape") { setNewHashtag(""); setAddingHashtag(false); }
                        }}
                        placeholder="wellness" className="h-6 w-28 text-[10px]" autoFocus />
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => { if (newHashtag.trim()) { update({ hashtags: [...(outputs.hashtags || []), newHashtag.trim()] }); setNewHashtag(""); setAddingHashtag(false); } }}>
                        <Check className="size-3 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => { setNewHashtag(""); setAddingHashtag(false); }}>
                        <X className="size-3 text-gray-400" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mentions */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold text-gray-700">Mentions / Collaborators</Label>
                <p className="text-[9px] text-gray-400">Tag collaborators, partners, or featured creators.</p>
                <div className="flex flex-wrap gap-1.5">
                  {(outputs.mentions || []).map((m, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] gap-1 pr-1">
                      @{m}
                      <button onClick={() => update({ mentions: (outputs.mentions || []).filter((_, idx) => idx !== i) })}
                        className="hover:text-red-500">
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {!addingMention ? (
                    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"
                      onClick={() => setAddingMention(true)}>
                      <Plus className="size-2.5" /> Add
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">@</span>
                      <Input value={newMention} onChange={e => setNewMention(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && newMention.trim()) {
                            update({ mentions: [...(outputs.mentions || []), newMention.trim()] });
                            setNewMention(""); setAddingMention(false);
                          } else if (e.key === "Escape") { setNewMention(""); setAddingMention(false); }
                        }}
                        placeholder="username" className="h-6 w-28 text-[10px]" autoFocus />
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => { if (newMention.trim()) { update({ mentions: [...(outputs.mentions || []), newMention.trim()] }); setNewMention(""); setAddingMention(false); } }}>
                        <Check className="size-3 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => { setNewMention(""); setAddingMention(false); }}>
                        <X className="size-3 text-gray-400" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3 text-gray-400" />
                  <Label className="text-[10px] font-semibold text-gray-700">Location tag</Label>
                </div>
                <Input
                  value={outputs.location || ""}
                  onChange={e => update({ location: e.target.value })}
                  placeholder="City, venue, or location name..."
                  className="h-7 text-[10px]"
                />
              </div>

              {/* Pinned comment */}
              {(platform === "instagram" || platform === "tiktok" || platform === "youtube") && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700">Pinned comment (draft)</Label>
                  <p className="text-[9px] text-gray-400">Long links, disclaimers, or "Part 2" routing.</p>
                  <Textarea
                    value={outputs.pinnedComment || ""}
                    onChange={e => update({ pinnedComment: e.target.value })}
                    placeholder="Your pinned comment..."
                    className="min-h-[50px] resize-none text-xs"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── §5 DISCLOSURES & COMPLIANCE ─── */}
      {(disclosureRequired || hasClaims) && (
        <Card className={cn("border", disclosureRequired ? "border-amber-200" : "border-gray-100")}>
          <CardContent className="p-4 space-y-3">
            {sectionHeader(
              <Shield className="size-3.5" />,
              "Disclosures & Compliance",
              disclosureRequired,
            )}

            {/* Disclosure */}
            {disclosureRequired && (
              <div className="space-y-1.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-600" />
                  <Label className="text-[10px] font-semibold text-amber-900">
                    Disclosure text
                    {brief.publishingMode === "PAID_BOOSTED" && <span className="ml-1 text-amber-600">(Paid Boost)</span>}
                    {brief.paidPartnership && <span className="ml-1 text-amber-600">(Paid Partnership)</span>}
                  </Label>
                </div>
                <p className="text-[9px] text-amber-700">Include required disclosure language, e.g. #ad or "Paid partnership with [Brand]".</p>
                <Textarea
                  value={outputs.disclosures || ""}
                  onChange={e => update({ disclosures: e.target.value })}
                  placeholder="Paid partnership with [Brand] #ad"
                  className="min-h-[50px] resize-none text-xs bg-white"
                />
              </div>
            )}

            {/* Claims list */}
            {hasClaims && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="size-3 text-gray-400" />
                    <Label className="text-[10px] font-semibold text-gray-700">Claims list</Label>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500">List each claim so QA can verify substantiation.</p>
                <div className="space-y-1">
                  {(outputs.claimsList || []).map((claim, i) => (
                    <div key={i} className="flex items-center gap-1.5 group bg-gray-50 border border-gray-100 rounded px-2 py-1.5">
                      <SquareCheck className="size-3 text-[#d94e33] shrink-0" />
                      <span className="text-[10px] text-gray-700 flex-1">{claim}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => update({ claimsList: (outputs.claimsList || []).filter((_, idx) => idx !== i) })}>
                        <X className="size-3 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                {!addingClaim ? (
                  <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1"
                    onClick={() => setAddingClaim(true)}>
                    <Plus className="size-2.5" /> Add claim
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Input value={newClaim} onChange={e => setNewClaim(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && newClaim.trim()) {
                          update({ claimsList: [...(outputs.claimsList || []), newClaim.trim()] });
                          setNewClaim(""); setAddingClaim(false);
                        } else if (e.key === "Escape") { setNewClaim(""); setAddingClaim(false); }
                      }}
                      placeholder="Describe the claim..." className="h-7 text-[10px] flex-1" autoFocus />
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => { if (newClaim.trim()) { update({ claimsList: [...(outputs.claimsList || []), newClaim.trim()] }); setNewClaim(""); setAddingClaim(false); } }}>
                      <Check className="size-3 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                      onClick={() => { setNewClaim(""); setAddingClaim(false); }}>
                      <X className="size-3 text-gray-400" />
                    </Button>
                  </div>
                )}

                {/* Safety disclaimer */}
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  <Label className="text-[10px] font-semibold text-gray-700">Safety / medical disclaimer line</Label>
                  <Input
                    value={outputs.safetyDisclaimer || ""}
                    onChange={e => update({ safetyDisclaimer: e.target.value })}
                    placeholder="e.g., Always consult your healthcare provider before starting a new wellness routine."
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── §6 NOTES ─── */}
      <Card className="border-gray-100">
        <CardContent className="p-4 space-y-2">
          {sectionHeader(<FileText className="size-3.5" />, "Creative Notes to Production")}
          <p className="text-[10px] text-gray-500">Tone, pacing, visual style, references, or anything the team needs to know.</p>
          <Textarea
            value={outputs.contentNotes || outputs.editNotes || ""}
            onChange={e => update({ contentNotes: e.target.value, editNotes: e.target.value })}
            placeholder="e.g., Keep the energy warm and empowering. Use slow, deliberate cuts for the yoga section..."
            className="min-h-[60px] resize-none text-xs"
          />
        </CardContent>
      </Card>

      {/* ─── §7 DRAFT QUALITY CHECKS ─── */}
      {(() => {
        const checks: { label: string; pass: boolean; type: "ok" | "warn" | "error" }[] = [];

        // Hook
        if (hookRequired) {
          checks.push({ label: "Hook", pass: !!(outputs.hook?.trim()), type: outputs.hook?.trim() ? "ok" : "error" });
        } else {
          checks.push({ label: "Hook", pass: !!(outputs.hook?.trim()), type: outputs.hook?.trim() ? "ok" : "warn" });
        }
        // Copy
        if (copyRequired) {
          checks.push({ label: getCopyLabel(canonicalType, platform), pass: !!(outputs.postCopy?.trim()), type: outputs.postCopy?.trim() ? "ok" : "error" });
        } else if (!showCarousel) {
          checks.push({ label: getCopyLabel(canonicalType, platform), pass: !!(outputs.postCopy?.trim()), type: outputs.postCopy?.trim() ? "ok" : "warn" });
        }
        // Copy length
        if (outputs.postCopy?.trim()) {
          const len = outputs.postCopy.length;
          checks.push({ label: "Char limit", pass: len < charLimits.warn, type: len >= charLimits.limit ? "error" : len >= charLimits.warn ? "warn" : "ok" });
        }
        // Script
        if (scriptRequired) {
          checks.push({ label: getScriptLabel(canonicalType), pass: !!(outputs.script?.trim()), type: outputs.script?.trim() ? "ok" : "error" });
        }
        // Slides
        if (showCarousel) {
          checks.push({ label: "Slides", pass: (outputs.slideOutlines?.length || 0) >= 2, type: (outputs.slideOutlines?.length || 0) >= 2 ? "ok" : "error" });
        }
        // Story frames
        if (showStory) {
          checks.push({ label: "Story frames", pass: !!(outputs.storyFrames?.length), type: outputs.storyFrames?.length ? "ok" : "error" });
        }
        // CTA line
        if (showCtaLine) {
          checks.push({ label: "CTA line", pass: !!(outputs.ctaLine?.trim()), type: outputs.ctaLine?.trim() ? "ok" : "warn" });
        }
        // Links
        if (showLinks) {
          checks.push({ label: "Link", pass: !!(outputs.links?.length), type: linksRequired ? (outputs.links?.length ? "ok" : "error") : (outputs.links?.length ? "ok" : "warn") });
        }
        // Disclosure
        if (disclosureRequired) {
          checks.push({ label: "Disclosure", pass: !!(outputs.disclosures?.trim()), type: outputs.disclosures?.trim() ? "ok" : "warn" });
        }
        // Claims
        if (hasClaims) {
          checks.push({ label: "Claims documented", pass: !!(outputs.claimsList?.length), type: outputs.claimsList?.length ? "ok" : "warn" });
        }

        const colors = {
          ok:    "bg-green-50 border-green-200 text-green-700",
          warn:  "bg-amber-50 border-amber-200 text-amber-700",
          error: "bg-red-50 border-red-200 text-red-700",
        };
        const icons = {
          ok:    <CheckCircle2 className="size-3 text-green-500 shrink-0" />,
          warn:  <AlertTriangle className="size-3 text-amber-500 shrink-0" />,
          error: <AlertTriangle className="size-3 text-red-500 shrink-0" />,
        };

        return (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Draft quality checks</p>
            <div className="flex flex-wrap gap-1.5">
              {checks.map((c, i) => (
                <div key={i} className={cn("flex items-center gap-1 text-[10px] border rounded-full px-2 py-0.5", colors[c.type])}>
                  {icons[c.type]}
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ─── YouTube Metadata (long-form only) ─── */}
      {showYTMeta && (
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between w-full">
              <button className="flex items-center gap-1.5 group flex-1" onClick={() => setYtMetaOpen(v => !v)}>
                <Monitor className="size-3.5 text-[#d94e33]" />
                <Label className="text-xs font-bold text-gray-800 cursor-pointer">YouTube SEO Metadata</Label>
                <span className="text-[10px] text-gray-400">(title finalised in Packaging)</span>
              </button>
              <div className="flex items-center gap-2">
                {aiButton("metadata")}
                <button onClick={() => setYtMetaOpen(v => !v)} className="text-gray-400 hover:text-gray-600">
                  {ytMetaOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
              </div>
            </div>

            {ytMetaOpen && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                {/* Title options */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700">Title options</Label>
                  {(outputs.metadata?.titleOptions || []).map((t, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <Input value={t}
                        onChange={e => {
                          const titles = [...(outputs.metadata?.titleOptions || [])];
                          titles[i] = e.target.value;
                          update({ metadata: { ...(outputs.metadata || { titleOptions: [], description: "", tags: [] }), titleOptions: titles } });
                        }}
                        className="h-8 text-xs flex-1" />
                      <button onClick={() => copyText(t)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy className="size-3 text-gray-400" />
                      </button>
                    </div>
                  ))}
                  {!(outputs.metadata?.titleOptions?.length) && (
                    <p className="text-[10px] text-gray-400">Click AI generate to draft title options</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700">Description with timestamps</Label>
                  <Textarea
                    value={outputs.metadata?.description || ""}
                    onChange={e => update({ metadata: { ...(outputs.metadata || { titleOptions: [], description: "", tags: [] }), description: e.target.value } })}
                    placeholder="Video description with timestamps..."
                    className="min-h-[100px] resize-none text-xs font-mono"
                  />
                </div>

                {/* Chapters */}
                {(outputs.metadata?.chapters || []).length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-gray-700">Chapters</Label>
                    {outputs.metadata!.chapters!.map((ch, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-mono w-14 justify-center shrink-0">{ch.time}</Badge>
                        <Input value={ch.title}
                          onChange={e => {
                            const chapters = [...(outputs.metadata!.chapters || [])];
                            chapters[i] = { ...chapters[i], title: e.target.value };
                            update({ metadata: { ...outputs.metadata!, chapters } });
                          }}
                          className="h-7 text-[10px] flex-1" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold text-gray-700">Search tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {(outputs.metadata?.tags || []).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] gap-1">
                        {tag}
                        <button onClick={() => {
                          const tags = (outputs.metadata?.tags || []).filter((_, idx) => idx !== i);
                          update({ metadata: { ...outputs.metadata!, tags } });
                        }}><X className="size-2.5" /></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── FOOTER ─── */}
      <div className="flex items-start justify-between pt-2 border-t border-gray-100 gap-4">
        <div className="space-y-1 min-w-0 flex-1">
          {blockers.slice(0, 2).map((err, i) => (
            <p key={i} className="text-[10px] text-red-600 flex items-center gap-1">
              <AlertTriangle className="size-3 shrink-0" /> {err}
            </p>
          ))}
          {blockers.length > 2 && (
            <p className="text-[10px] text-red-500">+{blockers.length - 2} more required</p>
          )}
          {blockers.length === 0 && warnings.slice(0, 2).map((w, i) => (
            <p key={i} className="text-[10px] text-amber-600 flex items-center gap-1">
              <AlertTriangle className="size-3 shrink-0" /> {w}
            </p>
          ))}
          {blockers.length === 0 && warnings.length === 0 && (
            <p className="text-[10px] text-green-600 flex items-center gap-1">
              <CheckCircle2 className="size-3" /> All required fields complete
            </p>
          )}
        </div>
        <Button
          className={cn(
            "gap-1.5 shrink-0 transition-all",
            isReady ? "bg-[#d94e33] hover:bg-[#c4452d]" : "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"
          )}
          onClick={isReady ? onNext : undefined}
          disabled={!isReady}
        >
          {isReady ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
          Continue to Blueprint
        </Button>
      </div>

      {/* Loading overlay */}
      {generatingField && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 pointer-events-none">
          <Card className="border-gray-200 shadow-lg w-64 pointer-events-auto">
            <CardContent className="py-6 text-center">
              <Loader2 className="size-6 text-[#d94e33] animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-700">Generating {generatingField.replace(/_/g, " ")}...</p>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
