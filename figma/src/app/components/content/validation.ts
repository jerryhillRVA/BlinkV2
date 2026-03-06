import type { ContentItem } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates if an IDEA can move to CONCEPT stage
 * Required fields: Description, ≥1 Content Pillar, Hook, Objective, Owner
 */
export function validateIdeaToConcept(item: ContentItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: Description (50-400 characters)
  if (!item.description || item.description.trim().length === 0) {
    errors.push("Description is required");
  } else if (item.description.length < 50) {
    errors.push("Description must be at least 50 characters");
  } else if (item.description.length > 400) {
    errors.push("Description must not exceed 400 characters");
  }

  // Required: At least 1 Content Pillar (max 3)
  if (!item.pillarIds || item.pillarIds.length === 0) {
    errors.push("At least 1 Content Pillar is required");
  } else if (item.pillarIds.length > 3) {
    errors.push("Maximum 3 Content Pillars allowed");
  }

  // Required: Hook (max 120 characters)
  if (!item.hook || item.hook.trim().length === 0) {
    errors.push("Hook is required");
  } else if (item.hook.length > 120) {
    errors.push("Hook must not exceed 120 characters");
  } else if (item.hook.length >= 100) {
    warnings.push("Hook is getting long (100+ characters)");
  }

  // Required: Objective
  if (!item.objective) {
    errors.push("Objective is required");
  }

  // Required: Owner
  if (!item.owner) {
    errors.push("Owner is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates if a CONCEPT can move to IN PRODUCTION stage
 * Required: Platform (not TBD), Content Type, Audience Segment, CTA
 * If Claims Flag = true, requires at least 1 Source Link
 */
export function validateConceptToProduction(item: ContentItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: Primary Platform (cannot be TBD)
  if (!item.platform) {
    errors.push("Primary Platform is required");
  } else if (item.platform === "tbd") {
    errors.push("Platform cannot be TBD before moving to production");
  }

  // Required: Content Type
  if (!item.contentType) {
    errors.push("Content Type is required");
  }

  // Required: Audience Segment
  if (!item.audienceSegment && (!item.segmentIds || item.segmentIds.length === 0)) {
    errors.push("Audience Segment is required");
  }

  // Required: CTA
  if (!item.cta) {
    errors.push("CTA is required");
  } else {
    if (!item.cta.type) {
      errors.push("CTA Type is required");
    }
    if (!item.cta.text || item.cta.text.trim().length === 0) {
      errors.push("CTA Text is required");
    } else if (item.cta.text.length > 120) {
      errors.push("CTA Text must not exceed 120 characters");
    }
  }

  // Conditional: If Claims Flag = true, requires Source Links
  if (item.claimsFlag) {
    if (!item.sourceLinks || item.sourceLinks.length === 0) {
      errors.push("At least 1 Source Link is required when Claims Flag is enabled");
    }
  }

  // All IDEA → CONCEPT validations must still pass
  const conceptValidation = validateIdeaToConcept(item);
  errors.push(...conceptValidation.errors);
  warnings.push(...conceptValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates field constraints for a ContentItem
 */
export function validateContentItem(item: ContentItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation
  if (!item.title || item.title.trim().length === 0) {
    errors.push("Title is required");
  }

  // Hook validation (if provided)
  if (item.hook && item.hook.length > 120) {
    errors.push("Hook must not exceed 120 characters");
  } else if (item.hook && item.hook.length >= 100) {
    warnings.push("Hook is getting long (100+ characters)");
  }

  // Description validation (if provided)
  if (item.description) {
    if (item.description.length < 50 && item.stage !== "idea") {
      warnings.push("Description should be at least 50 characters");
    }
    if (item.description.length > 400) {
      errors.push("Description must not exceed 400 characters");
    }
  }

  // Key Message validation (if provided)
  if (item.keyMessage && item.keyMessage.length > 180) {
    errors.push("Key Message must not exceed 180 characters");
  }

  // CTA Text validation (if provided)
  if (item.cta?.text && item.cta.text.length > 120) {
    errors.push("CTA Text must not exceed 120 characters");
  }

  // Content Pillars validation (max 3)
  if (item.pillarIds && item.pillarIds.length > 3) {
    errors.push("Maximum 3 Content Pillars allowed");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets validation state for display purposes
 */
export function getValidationState(
  item: ContentItem,
  targetStage?: "concept" | "production"
): { canMove: boolean; message: string; type: "error" | "warning" | "success" } {
  if (targetStage === "concept") {
    const result = validateIdeaToConcept(item);
    if (!result.isValid) {
      return { canMove: false, message: result.errors[0], type: "error" };
    }
    if (result.warnings.length > 0) {
      return { canMove: true, message: result.warnings[0], type: "warning" };
    }
    return { canMove: true, message: "Ready to move to Concept", type: "success" };
  }

  if (targetStage === "production") {
    const result = validateConceptToProduction(item);
    if (!result.isValid) {
      return { canMove: false, message: result.errors[0], type: "error" };
    }
    if (result.warnings.length > 0) {
      return { canMove: true, message: result.warnings[0], type: "warning" };
    }
    return { canMove: true, message: "Ready to move to Production", type: "success" };
  }

  const result = validateContentItem(item);
  if (!result.isValid) {
    return { canMove: false, message: result.errors[0], type: "error" };
  }
  return { canMove: true, message: "Valid", type: "success" };
}
