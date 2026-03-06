/**
 * AI ASSIST FEATURES FOR PRODUCTION
 * Mock AI generation for script, captions, hashtags, etc.
 */

import type { ContentBrief } from "../types";

export interface AIScriptOptions {
  platform: string;
  contentType: string;
  brief: ContentBrief;
  currentScript?: string;
  action: "generate" | "refine" | "shorten" | "engage";
}

export interface AIScriptResult {
  script: string;
  hookScore: number;
  clarityScore: number;
  engagementScore: number;
  suggestions: string[];
}

/**
 * AI Script Generation/Refinement
 */
export function generateScript(options: AIScriptOptions): AIScriptResult {
  const { platform, contentType, brief, currentScript, action } = options;

  let script = "";
  const suggestions: string[] = [];

  if (action === "generate" || !currentScript) {
    // Generate new script
    if (contentType === "long-form") {
      script = generateLongFormScript(brief);
    } else if (contentType.includes("short") || contentType === "reel") {
      script = generateShortFormScript(brief);
    } else if (contentType === "feed-post" || contentType === "carousel") {
      script = generateImageCaptionScript(brief);
    } else {
      script = generateDefaultScript(brief);
    }
  } else {
    // Refine existing script
    if (action === "refine") {
      script = refineScript(currentScript, brief);
      suggestions.push("Improved clarity and flow");
    } else if (action === "shorten") {
      script = shortenScript(currentScript);
      suggestions.push("Reduced length while maintaining key points");
    } else if (action === "engage") {
      script = increaseEngagement(currentScript, brief);
      suggestions.push("Added engagement elements");
    }
  }

  // Calculate scores (mock)
  const hookScore = calculateHookScore(script);
  const clarityScore = calculateClarityScore(script);
  const engagementScore = calculateEngagementScore(script);

  return {
    script,
    hookScore,
    clarityScore,
    engagementScore,
    suggestions,
  };
}

function generateLongFormScript(brief: ContentBrief): string {
  return `HOOK: ${brief.platformRules.hookType === "problem-first" ? "Are you making this critical mistake?" : "Let me show you something that will change everything..."}

[PROMISE]: In this video, ${brief.strategy.viewerPromise || "you'll discover the exact system that transformed our results"}

--- SECTION 1: THE PROBLEM ---
${brief.strategy.keyMessage}

Most people struggle with this because they're missing one crucial element.

--- SECTION 2: THE SOLUTION ---
Here's what the data actually shows...

[Include specific insights from your research]

--- SECTION 3: HOW TO IMPLEMENT ---
Step-by-step breakdown:
1. Start by analyzing your current situation
2. Apply the framework we discussed
3. Track your results and iterate

--- RECAP ---
Let's quickly recap the key takeaways...

--- CTA ---
${brief.strategy.ctaText || "If you found this helpful, subscribe and hit the bell so you don't miss the next one."}`;
}

function generateShortFormScript(brief: ContentBrief): string {
  return `[0-3s] HOOK: Stop scrolling. This changes everything.

[3-8s] SETUP: ${brief.strategy.keyMessage}

[8-25s] CONTENT:
✓ First key point that delivers value
✓ Second insight that surprises them
✓ Third takeaway they can use today

[25s+] CTA: ${brief.strategy.ctaText || "Follow for more content like this"}

---

ON-SCREEN TEXT:
"${brief.platformRules.hookType === "problem-first" ? "The Problem No One Talks About" : "The Solution You've Been Missing"}"`;
}

function generateImageCaptionScript(brief: ContentBrief): string {
  return `${brief.strategy.keyMessage}

Here's the breakdown:

→ Key insight #1
→ Key insight #2
→ Key insight #3

This approach works because [explain why it matters to them].

${brief.strategy.ctaText || "Save this for later and share with someone who needs to see it."}`;
}

function generateDefaultScript(brief: ContentBrief): string {
  return `HOOK: ${brief.strategy.keyMessage}

BODY: 
Supporting context and details that expand on the hook.

${brief.strategy.ctaText || "Follow for more insights."}`;
}

function refineScript(script: string, brief: ContentBrief): string {
  // Mock refinement: just add some polish
  let refined = script;
  
  // Check for claims without sources
  if (script.match(/\d+%/) && !script.includes("source:")) {
    refined += "\n\n[NOTE: Claims require source attribution]";
  }

  // Check tone alignment
  if (brief.strategy.tone === "professional" && script.match(/\b(yo|hey|dude)\b/i)) {
    refined = refined.replace(/\b(yo|hey|dude)\b/gi, "");
  }

  return refined;
}

function shortenScript(script: string): string {
  // Mock shortening: take first 60% of content
  const lines = script.split("\n");
  const shortened = lines.slice(0, Math.ceil(lines.length * 0.6));
  return shortened.join("\n") + "\n\n[Shortened version - review for completeness]";
}

function increaseEngagement(script: string, brief: ContentBrief): string {
  // Add engagement hooks
  const engagementElements = [
    "Comment below if you agree!",
    "Which strategy works best for you? Let me know!",
    "Tag someone who needs to see this",
    "Save this for later",
  ];

  return script + "\n\n" + engagementElements[Math.floor(Math.random() * engagementElements.length)];
}

// Score calculations (mock)
function calculateHookScore(script: string): number {
  const hookKeywords = ["stop", "wait", "breaking", "urgent", "secret", "mistake", "nobody"];
  const firstLine = script.split("\n")[0].toLowerCase();
  const hasKeyword = hookKeywords.some((keyword) => firstLine.includes(keyword));
  return hasKeyword ? 85 : 60;
}

function calculateClarityScore(script: string): number {
  // Mock clarity score based on sentence length
  const avgSentenceLength = script.split(".").reduce((sum, s) => sum + s.length, 0) / script.split(".").length;
  return avgSentenceLength < 100 ? 90 : 70;
}

function calculateEngagementScore(script: string): number {
  const engagementWords = ["you", "your", "we", "comment", "share", "save", "follow"];
  const count = engagementWords.reduce((sum, word) => {
    return sum + (script.toLowerCase().match(new RegExp(word, "g")) || []).length;
  }, 0);
  return Math.min(95, 50 + count * 5);
}

/**
 * Caption Generation
 */
export interface AICaptionOptions {
  platform: string;
  contentType: string;
  script: string;
  brief: ContentBrief;
  characterLimit: number;
}

export function generateCaptions(options: AICaptionOptions): string[] {
  const { script, brief, characterLimit } = options;

  const keyMessage = brief.strategy.keyMessage.slice(0, characterLimit / 2);
  const cta = brief.strategy.ctaText || "Follow for more";

  return [
    `${keyMessage}\n\n${cta}`.slice(0, characterLimit),
    `${keyMessage.slice(0, 80)}... (thread below)\n\nFull breakdown in comments.`.slice(0, characterLimit),
    `SAVE THIS.\n\n${keyMessage}\n\n${cta}`.slice(0, characterLimit),
  ];
}

/**
 * Hashtag Optimization
 */
export interface AIHashtagOptions {
  platform: string;
  contentType: string;
  brief: ContentBrief;
  script: string;
}

export function generateHashtags(options: AIHashtagOptions): string[][] {
  const { platform } = options;

  // Platform-specific hashtag sets
  if (platform === "instagram") {
    return [
      ["#ContentStrategy", "#SocialMedia", "#Marketing", "#GrowthTips"],
      ["#CreatorTips", "#ContentCreator", "#DigitalMarketing", "#BrandGrowth"],
      ["#SocialMediaMarketing", "#ContentMarketing", "#Viral", "#Trending", "#Growth"],
    ];
  } else if (platform === "tiktok") {
    return [
      ["#fyp", "#foryou", "#viral", "#trending"],
      ["#contentcreator", "#creator", "#socialmedia", "#tips"],
      ["#algorithm", "#growth", "#strategy", "#marketing", "#2026"],
    ];
  } else if (platform === "youtube") {
    return [
      ["#ContentStrategy", "#YouTubeGrowth", "#VideoMarketing"],
      ["#CreatorTips", "#YouTubeTips", "#GrowYourChannel"],
      ["#SocialMedia", "#DigitalMarketing", "#2026"],
    ];
  }

  return [
    ["#content", "#social", "#marketing"],
    ["#growth", "#tips", "#strategy"],
  ];
}

/**
 * Title Optimization (YouTube)
 */
export interface AITitleOptions {
  currentTitle: string;
  script: string;
  brief: ContentBrief;
}

export function generateTitleVariants(options: AITitleOptions): {
  seo: string;
  retention: string;
  short: string;
} {
  const { currentTitle, brief } = options;

  return {
    seo: `${currentTitle} - Complete Guide 2026 | ${brief.strategy.keyMessage.slice(0, 30)}`,
    retention: `${currentTitle}: The One Thing Nobody Tells You`,
    short: currentTitle.slice(0, 50) + (currentTitle.length > 50 ? "..." : ""),
  };
}

/**
 * Cut-down Generation (Long-form → Short-form)
 */
export interface CutDownResult {
  platform: string;
  timestamp: string;
  script: string;
  notes: string;
}

export function generateCutDowns(longFormScript: string): CutDownResult[] {
  // Mock cut-down suggestions
  return [
    {
      platform: "TikTok",
      timestamp: "1:23-1:58",
      script: "[Extract key insight from this section]\n\nHOOK: The one thing nobody talks about...\nCONTENT: [Key point]\nCTA: Follow for the full breakdown",
      notes: "Best hook section, high retention potential",
    },
    {
      platform: "Instagram Reels",
      timestamp: "3:15-3:45",
      script: "[Problem-solution framework]\n\nPROBLEM: Here's what's holding you back\nSOLUTION: The simple fix\nCTA: Save this for later",
      notes: "Clear value prop, good for saves",
    },
    {
      platform: "YouTube Shorts",
      timestamp: "5:02-5:50",
      script: "[Actionable tip]\n\nSTEP 1: [action]\nSTEP 2: [action]\nRESULT: [outcome]",
      notes: "Step-by-step format, easy to follow",
    },
  ];
}

/**
 * Platform Formatting Suggestions
 */
export interface FormatSuggestion {
  issue: string;
  severity: "error" | "warning";
  fix: string;
}

export function detectFormattingIssues(script: string, platform: string, contentType: string): FormatSuggestion[] {
  const suggestions: FormatSuggestion[] = [];

  // Check hook timing
  const firstSentence = script.split(".")[0];
  if (firstSentence.length > 200) {
    suggestions.push({
      issue: "Hook appears late or too long",
      severity: "warning",
      fix: "Move hook to first sentence, keep it under 10 words",
    });
  }

  // Check for safe zones (vertical video)
  if (contentType.includes("short") || contentType === "reel") {
    if (script.includes("[TEXT:") && !script.includes("[SAFE ZONE]")) {
      suggestions.push({
        issue: "Text positioning not confirmed for safe zones",
        severity: "warning",
        fix: "Ensure on-screen text stays within center 80% of frame",
      });
    }
  }

  // Check caption density
  const wordCount = script.split(/\s+/).length;
  if (wordCount > 500 && (contentType === "feed-post" || contentType === "carousel")) {
    suggestions.push({
      issue: "Caption too dense for feed content",
      severity: "warning",
      fix: "Consider shortening to improve readability",
    });
  }

  // Check for engagement drivers
  const hasQuestion = script.includes("?");
  const hasCTA = script.match(/comment|share|save|follow/i);
  if (!hasQuestion && !hasCTA) {
    suggestions.push({
      issue: "No clear engagement driver",
      severity: "warning",
      fix: "Add a question or call-to-action to drive interaction",
    });
  }

  return suggestions;
}
