/**
 * PRODUCTION EXECUTION FIELDS
 * Platform-specific field definitions for content production
 */

import type { Platform, ContentType } from "../types";

// ========================================
// FIELD DEFINITIONS
// ========================================

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "file"
  | "image"
  | "video"
  | "select"
  | "multiselect"
  | "checkbox"
  | "time"
  | "timestamp"
  | "url"
  | "tags";

export type ValidationRule = {
  type: "required" | "maxLength" | "minLength" | "maxDuration" | "aspectRatio" | "resolution" | "fileType" | "custom";
  value?: any;
  message: string;
  severity: "error" | "warning"; // error = hard block, warning = soft warning
};

export interface ExecutionField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  validations: ValidationRule[];
  defaultValue?: any;
  options?: { value: string; label: string }[]; // for select/multiselect
  accept?: string; // for file uploads
  showIf?: (data: any) => boolean; // conditional visibility
  aiAssistAvailable?: boolean;
  accessibilityField?: boolean; // marks accessibility requirements
}

// ========================================
// YOUTUBE LONG-FORM
// ========================================

export const YOUTUBE_LONGFORM_FIELDS: ExecutionField[] = [
  {
    id: "script",
    label: "Script",
    type: "textarea",
    placeholder: "Write your video script here...",
    helperText: "Optimal hook window: first 15 seconds",
    validations: [
      { type: "required", message: "Script is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "videoFile",
    label: "Video File",
    type: "video",
    accept: ".mp4,.mov,.avi",
    validations: [
      { type: "required", message: "Video file is required", severity: "error" },
      { type: "aspectRatio", value: "16:9", message: "Video must be 16:9 aspect ratio", severity: "error" },
      { type: "resolution", value: "720p", message: "Minimum resolution: 720p", severity: "error" },
      { type: "maxDuration", value: 43200, message: "Maximum duration: 12 hours", severity: "warning" },
    ],
  },
  {
    id: "title",
    label: "Title",
    type: "text",
    placeholder: "Enter video title...",
    validations: [
      { type: "required", message: "Title is required", severity: "error" },
      { type: "maxLength", value: 100, message: "Title cannot exceed 100 characters", severity: "error" },
      { type: "maxLength", value: 70, message: "Title over 70 characters may be truncated", severity: "warning" },
    ],
    helperText: "Optimal length: under 60 characters",
    aiAssistAvailable: true,
  },
  {
    id: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter video description...",
    validations: [
      { type: "required", message: "Description is required", severity: "error" },
      { type: "maxLength", value: 5000, message: "Description cannot exceed 5000 characters", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "tags",
    label: "Tags",
    type: "tags",
    placeholder: "Add tags...",
    validations: [
      { type: "required", message: "At least one tag is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "category",
    label: "Category",
    type: "select",
    options: [
      { value: "education", label: "Education" },
      { value: "entertainment", label: "Entertainment" },
      { value: "howto", label: "How-to & Style" },
      { value: "science", label: "Science & Technology" },
      { value: "people", label: "People & Blogs" },
      { value: "news", label: "News & Politics" },
    ],
    validations: [
      { type: "required", message: "Category is required", severity: "error" },
    ],
  },
  {
    id: "audienceSetting",
    label: "Audience Setting",
    type: "select",
    options: [
      { value: "not-for-kids", label: "Not Made for Kids" },
      { value: "for-kids", label: "Made for Kids" },
    ],
    validations: [
      { type: "required", message: "Audience setting is required", severity: "error" },
    ],
  },
  {
    id: "videoDuration",
    label: "Video Duration (Actual)",
    type: "time",
    validations: [
      { type: "required", message: "Video duration is required", severity: "error" },
    ],
  },
  {
    id: "thumbnail",
    label: "Thumbnail Image",
    type: "image",
    accept: "image/png,image/jpeg,image/jpg",
    helperText: "Required: 16:9, recommended 1280x720",
    validations: [
      { type: "required", message: "Thumbnail is required", severity: "error" },
      { type: "aspectRatio", value: "16:9", message: "Thumbnail must be 16:9 aspect ratio", severity: "error" },
    ],
  },
  {
    id: "chapters",
    label: "Chapters",
    type: "timestamp",
    helperText: "Required if video > 2 minutes",
    validations: [
      {
        type: "custom",
        message: "Chapters required for videos over 2 minutes",
        severity: "error",
        value: (data: any) => {
          if (data.videoDuration && data.videoDuration > 120) {
            return data.chapters && data.chapters.length > 0;
          }
          return true;
        },
      },
    ],
  },
  {
    id: "ctaOverlay",
    label: "CTA Overlay Text",
    type: "text",
    placeholder: "Optional CTA overlay text...",
    validations: [],
  },
  {
    id: "visibility",
    label: "Visibility Setting",
    type: "select",
    options: [
      { value: "public", label: "Public" },
      { value: "unlisted", label: "Unlisted" },
      { value: "private", label: "Private" },
    ],
    validations: [
      { type: "required", message: "Visibility setting is required", severity: "error" },
    ],
  },
  // Accessibility
  {
    id: "subtitleFile",
    label: "Subtitle File (.srt)",
    type: "file",
    accept: ".srt",
    helperText: "Required for accessibility OR confirm caption review",
    accessibilityField: true,
    validations: [],
  },
  {
    id: "captionReviewConfirmed",
    label: "Caption Review Confirmed",
    type: "checkbox",
    accessibilityField: true,
    validations: [
      {
        type: "custom",
        message: "Either upload subtitle file or confirm caption review",
        severity: "error",
        value: (data: any) => data.subtitleFile || data.captionReviewConfirmed,
      },
    ],
  },
  {
    id: "language",
    label: "Language",
    type: "select",
    options: [
      { value: "en", label: "English" },
      { value: "es", label: "Spanish" },
      { value: "fr", label: "French" },
      { value: "de", label: "German" },
      { value: "pt", label: "Portuguese" },
    ],
    validations: [
      { type: "required", message: "Language is required", severity: "error" },
    ],
    accessibilityField: true,
  },
];

// ========================================
// YOUTUBE SHORTS
// ========================================

export const YOUTUBE_SHORTS_FIELDS: ExecutionField[] = [
  {
    id: "scriptOrBeatSheet",
    label: "Script / Beat Sheet",
    type: "textarea",
    placeholder: "Write your Shorts script...",
    helperText: "Hook window: first 2-3 seconds",
    validations: [
      { type: "required", message: "Script or beat sheet is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "videoFile",
    label: "Video File",
    type: "video",
    accept: ".mp4,.mov",
    validations: [
      { type: "required", message: "Video file is required", severity: "error" },
      { type: "aspectRatio", value: "9:16", message: "Video must be 9:16 (vertical)", severity: "error" },
      { type: "maxDuration", value: 60, message: "Maximum duration: 60 seconds", severity: "error" },
    ],
  },
  {
    id: "title",
    label: "Title",
    type: "text",
    validations: [
      { type: "required", message: "Title is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "description",
    label: "Description",
    type: "textarea",
    validations: [
      { type: "required", message: "Description is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "hashtags",
    label: "Hashtags",
    type: "tags",
    validations: [
      { type: "required", message: "At least one hashtag is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "thumbnailFrame",
    label: "Thumbnail Frame Selection",
    type: "timestamp",
    helperText: "Select timestamp for thumbnail frame",
    validations: [
      { type: "required", message: "Thumbnail frame is required", severity: "error" },
    ],
  },
  {
    id: "videoDuration",
    label: "Video Duration (Actual)",
    type: "time",
    validations: [
      { type: "required", message: "Video duration is required", severity: "error" },
      { type: "maxDuration", value: 60, message: "Shorts max 60 seconds", severity: "error" },
    ],
  },
  // Accessibility
  {
    id: "burnedCaptions",
    label: "Burned Captions Present",
    type: "checkbox",
    accessibilityField: true,
    validations: [],
  },
  {
    id: "subtitleFile",
    label: "Subtitle File",
    type: "file",
    accept: ".srt",
    accessibilityField: true,
    validations: [
      {
        type: "custom",
        message: "Either burned captions or subtitle file required",
        severity: "error",
        value: (data: any) => data.burnedCaptions || data.subtitleFile,
      },
    ],
  },
];

// ========================================
// INSTAGRAM REELS
// ========================================

export const INSTAGRAM_REELS_FIELDS: ExecutionField[] = [
  {
    id: "scriptOrBeatSheet",
    label: "Script / Beat Sheet",
    type: "textarea",
    placeholder: "Write your Reel script...",
    helperText: "Hook window: first 3 seconds",
    validations: [
      { type: "required", message: "Script or beat sheet is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "videoFile",
    label: "Video File",
    type: "video",
    accept: ".mp4,.mov",
    validations: [
      { type: "required", message: "Video file is required", severity: "error" },
      { type: "aspectRatio", value: "9:16", message: "Video must be 9:16 (vertical)", severity: "error" },
      { type: "maxDuration", value: 90, message: "Maximum duration: 90 seconds", severity: "error" },
    ],
  },
  {
    id: "caption",
    label: "Caption",
    type: "textarea",
    placeholder: "Write your caption...",
    validations: [
      { type: "required", message: "Caption is required", severity: "error" },
      { type: "maxLength", value: 2200, message: "Caption cannot exceed 2200 characters", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "hashtags",
    label: "Hashtags",
    type: "tags",
    validations: [
      { type: "required", message: "At least one hashtag is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "coverImage",
    label: "Cover Image",
    type: "image",
    accept: "image/png,image/jpeg,image/jpg",
    validations: [
      { type: "required", message: "Cover image is required", severity: "error" },
    ],
  },
  {
    id: "audioSelection",
    label: "Audio Selection",
    type: "select",
    options: [
      { value: "original", label: "Original Audio" },
      { value: "track", label: "Music Track" },
    ],
    validations: [
      { type: "required", message: "Audio selection is required", severity: "error" },
    ],
  },
  {
    id: "audioTrackId",
    label: "Music Track ID",
    type: "text",
    showIf: (data) => data.audioSelection === "track",
    validations: [],
  },
  {
    id: "safeZoneConfirmed",
    label: "Safe Zone Awareness Confirmed",
    type: "checkbox",
    helperText: "Confirm text/important elements are within safe zones",
    validations: [
      { type: "required", message: "Safe zone confirmation required", severity: "error" },
    ],
  },
  // Accessibility
  {
    id: "altText",
    label: "Alt Text",
    type: "text",
    accessibilityField: true,
    validations: [
      { type: "required", message: "Alt text is required for accessibility", severity: "error" },
    ],
  },
  {
    id: "subtitlesPresent",
    label: "Subtitles Present",
    type: "checkbox",
    accessibilityField: true,
    validations: [
      { type: "custom", message: "Subtitles recommended", severity: "warning", value: () => true },
    ],
  },
];

// ========================================
// INSTAGRAM SINGLE POST
// ========================================

export const INSTAGRAM_POST_FIELDS: ExecutionField[] = [
  {
    id: "imageAsset",
    label: "Image Asset",
    type: "image",
    accept: "image/png,image/jpeg,image/jpg",
    helperText: "Recommended: 1:1 or 4:5 aspect ratio",
    validations: [
      { type: "required", message: "Image is required", severity: "error" },
    ],
  },
  {
    id: "caption",
    label: "Caption",
    type: "textarea",
    validations: [
      { type: "required", message: "Caption is required", severity: "error" },
      { type: "maxLength", value: 2200, message: "Caption cannot exceed 2200 characters", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "hashtags",
    label: "Hashtags",
    type: "tags",
    validations: [
      { type: "required", message: "At least one hashtag is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "altText",
    label: "Alt Text",
    type: "text",
    accessibilityField: true,
    validations: [
      { type: "required", message: "Alt text is required for accessibility", severity: "error" },
    ],
  },
];

// ========================================
// INSTAGRAM CAROUSEL
// ========================================

export const INSTAGRAM_CAROUSEL_FIELDS: ExecutionField[] = [
  {
    id: "slideAssets",
    label: "Slide Assets",
    type: "image",
    helperText: "Upload 2-10 images/videos. All must have matching aspect ratio.",
    validations: [
      { type: "required", message: "At least 2 slides required", severity: "error" },
      { type: "custom", message: "Maximum 10 slides", severity: "error", value: (data: any) => !data.slideAssets || data.slideAssets.length <= 10 },
      { type: "custom", message: "All slides must have matching aspect ratio", severity: "error", value: () => true },
    ],
  },
  {
    id: "slideOrder",
    label: "Slide Order",
    type: "custom",
    helperText: "Drag to reorder slides",
    validations: [
      { type: "required", message: "Slide order is required", severity: "error" },
    ],
  },
  {
    id: "caption",
    label: "Caption",
    type: "textarea",
    validations: [
      { type: "required", message: "Caption is required", severity: "error" },
      { type: "maxLength", value: 2200, message: "Caption cannot exceed 2200 characters", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "hashtags",
    label: "Hashtags",
    type: "tags",
    validations: [
      { type: "required", message: "At least one hashtag is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "altTextPerSlide",
    label: "Alt Text per Slide",
    type: "custom",
    accessibilityField: true,
    validations: [
      { type: "custom", message: "Alt text recommended for each slide", severity: "warning", value: () => true },
    ],
  },
];

// ========================================
// INSTAGRAM STORIES
// ========================================

export const INSTAGRAM_STORIES_FIELDS: ExecutionField[] = [
  {
    id: "storyFrames",
    label: "Story Frames",
    type: "image",
    helperText: "Upload 1-10 vertical assets (9:16)",
    validations: [
      { type: "required", message: "At least 1 story frame required", severity: "error" },
      { type: "custom", message: "Maximum 10 frames", severity: "error", value: (data: any) => !data.storyFrames || data.storyFrames.length <= 10 },
      { type: "aspectRatio", value: "9:16", message: "Stories must be 9:16 vertical", severity: "error" },
    ],
  },
  {
    id: "linkUrl",
    label: "Link URL",
    type: "url",
    showIf: (data) => data.ctaType === "link",
    validations: [
      {
        type: "custom",
        message: "Link URL required if CTA requires link",
        severity: "error",
        value: (data: any) => {
          if (data.ctaType === "link") return data.linkUrl && data.linkUrl.trim().length > 0;
          return true;
        },
      },
    ],
  },
  {
    id: "frameDurations",
    label: "Frame Durations",
    type: "custom",
    helperText: "Set duration for each frame",
    validations: [
      { type: "required", message: "Frame durations required", severity: "error" },
    ],
  },
  {
    id: "stickerType",
    label: "Sticker Type",
    type: "select",
    options: [
      { value: "none", label: "None" },
      { value: "poll", label: "Poll" },
      { value: "question", label: "Question" },
      { value: "quiz", label: "Quiz" },
      { value: "countdown", label: "Countdown" },
    ],
    validations: [],
  },
];

// ========================================
// TIKTOK SHORT-FORM
// ========================================

export const TIKTOK_SHORTFORM_FIELDS: ExecutionField[] = [
  {
    id: "scriptOrBeatSheet",
    label: "Script / Beat Sheet",
    type: "textarea",
    placeholder: "Write your TikTok script...",
    helperText: "Hook window: first 2 seconds",
    validations: [
      { type: "required", message: "Script or beat sheet is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "videoFile",
    label: "Video File",
    type: "video",
    accept: ".mp4,.mov",
    validations: [
      { type: "required", message: "Video file is required", severity: "error" },
      { type: "aspectRatio", value: "9:16", message: "Video must be 9:16 (vertical)", severity: "error" },
      { type: "maxDuration", value: 180, message: "Platform max enforced", severity: "error" },
    ],
  },
  {
    id: "caption",
    label: "Caption",
    type: "textarea",
    validations: [
      { type: "required", message: "Caption is required", severity: "error" },
      { type: "maxLength", value: 2200, message: "Caption cannot exceed 2200 characters", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "hashtags",
    label: "Hashtags",
    type: "tags",
    validations: [
      { type: "required", message: "At least one hashtag is required", severity: "error" },
    ],
    aiAssistAvailable: true,
  },
  {
    id: "coverFrame",
    label: "Cover Frame Selection",
    type: "timestamp",
    validations: [
      { type: "required", message: "Cover frame selection required", severity: "error" },
    ],
  },
  {
    id: "soundSelection",
    label: "Sound Selection",
    type: "select",
    options: [
      { value: "original", label: "Original Sound" },
      { value: "trending", label: "Trending Sound" },
    ],
    validations: [
      { type: "required", message: "Sound selection is required", severity: "error" },
    ],
  },
  {
    id: "soundId",
    label: "Sound ID",
    type: "text",
    showIf: (data) => data.soundSelection === "trending",
    validations: [],
  },
  {
    id: "videoDuration",
    label: "Video Duration (Actual)",
    type: "time",
    validations: [
      { type: "required", message: "Video duration is required", severity: "error" },
    ],
  },
  // Accessibility
  {
    id: "burnedCaptions",
    label: "Burned Captions Present",
    type: "checkbox",
    accessibilityField: true,
    validations: [],
  },
  {
    id: "subtitleFile",
    label: "Subtitle File",
    type: "file",
    accept: ".srt",
    accessibilityField: true,
    validations: [
      {
        type: "custom",
        message: "Either burned captions or subtitle file required",
        severity: "error",
        value: (data: any) => data.burnedCaptions || data.subtitleFile,
      },
    ],
  },
];

// ========================================
// FIELD MAPPING
// ========================================

export const EXECUTION_FIELDS_MAP: Record<string, ExecutionField[]> = {
  "youtube-long-form": YOUTUBE_LONGFORM_FIELDS,
  "youtube-shorts": YOUTUBE_SHORTS_FIELDS,
  "instagram-reel": INSTAGRAM_REELS_FIELDS,
  "instagram-post": INSTAGRAM_POST_FIELDS,
  "instagram-carousel": INSTAGRAM_CAROUSEL_FIELDS,
  "instagram-stories": INSTAGRAM_STORIES_FIELDS,
  "tiktok-short-video": TIKTOK_SHORTFORM_FIELDS,
};

export function getExecutionFields(platform: Platform, contentType: ContentType): ExecutionField[] {
  const key = `${platform}-${contentType}`;
  return EXECUTION_FIELDS_MAP[key] || [];
}

// ========================================
// VALIDATION HELPERS
// ========================================

export interface ValidationResult {
  isValid: boolean;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

export function validateExecutionData(
  fields: ExecutionField[],
  data: Record<string, any>
): ValidationResult {
  const errors: { field: string; message: string }[] = [];
  const warnings: { field: string; message: string }[] = [];

  fields.forEach((field) => {
    // Skip if conditionally hidden
    if (field.showIf && !field.showIf(data)) {
      return;
    }

    field.validations.forEach((validation) => {
      let isValid = true;

      switch (validation.type) {
        case "required":
          isValid = data[field.id] !== undefined && data[field.id] !== null && data[field.id] !== "";
          break;
        case "maxLength":
          if (data[field.id]) {
            isValid = data[field.id].length <= validation.value;
          }
          break;
        case "minLength":
          if (data[field.id]) {
            isValid = data[field.id].length >= validation.value;
          }
          break;
        case "custom":
          if (typeof validation.value === "function") {
            isValid = validation.value(data);
          }
          break;
        default:
          isValid = true;
      }

      if (!isValid) {
        if (validation.severity === "error") {
          errors.push({ field: field.id, message: validation.message });
        } else {
          warnings.push({ field: field.id, message: validation.message });
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ========================================
// MOVE TO REVIEW VALIDATION
// ========================================

export function canMoveToReview(
  fields: ExecutionField[],
  data: Record<string, any>,
  conceptData: any
): { canMove: boolean; blockingIssues: string[] } {
  const validation = validateExecutionData(fields, data);
  const blockingIssues: string[] = [];

  // 1. Primary asset uploaded
  const hasVideo = data.videoFile || data.imageAsset || data.slideAssets || data.storyFrames;
  if (!hasVideo) {
    blockingIssues.push("Primary asset not uploaded");
  }

  // 2. Required metadata completed
  if (!validation.isValid) {
    blockingIssues.push(...validation.errors.map((e) => e.message));
  }

  // 3. Accessibility requirements met
  const accessibilityFields = fields.filter((f) => f.accessibilityField);
  const accessibilityValidation = validateExecutionData(accessibilityFields, data);
  if (!accessibilityValidation.isValid) {
    blockingIssues.push("Accessibility requirements not met");
  }

  // 4. CTA consistency with concept
  if (conceptData?.cta && !data.caption?.includes(conceptData.cta.text)) {
    blockingIssues.push("CTA inconsistent with concept");
  }

  // 5. Claims resolved if flagged
  if (data.claimsDetected && (!data.sourcesAttached || data.sourcesAttached.length === 0)) {
    blockingIssues.push("Claims flagged but no sources attached");
  }

  return {
    canMove: blockingIssues.length === 0,
    blockingIssues,
  };
}
