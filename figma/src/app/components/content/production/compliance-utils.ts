/**
 * COMPLIANCE & CLAIMS DETECTION
 * Detects risky content and enforces compliance rules
 */

export interface ComplianceFlag {
  type: "health" | "financial" | "legal" | "percentage" | "general";
  severity: "high" | "medium" | "low";
  phrase: string;
  position: number;
  requiresSource: boolean;
  requiresApproval: boolean;
}

export interface ComplianceScanResult {
  hasFlags: boolean;
  flags: ComplianceFlag[];
  riskLevel: "high" | "medium" | "low" | "none";
  requiresStrategistApproval: boolean;
  requiresSources: boolean;
  blocksProgress: boolean;
}

// Risky phrase patterns
const HEALTH_CLAIMS_PATTERNS = [
  /cure[sd]?/i,
  /treat[s]?/i,
  /prevent[s]?/i,
  /diagnos[e|is]/i,
  /lose weight/i,
  /burn fat/i,
  /boost immune/i,
  /heal[s]?/i,
];

const FINANCIAL_CLAIMS_PATTERNS = [
  /guaranteed return/i,
  /risk-free/i,
  /make \$\d+/i,
  /earn \$\d+/i,
  /passive income/i,
  /get rich/i,
  /financial freedom/i,
];

const LEGAL_CLAIMS_PATTERNS = [
  /legal advice/i,
  /you should sue/i,
  /violates the law/i,
  /illegal/i,
];

const PERCENTAGE_PATTERN = /\d+%/g;

/**
 * Scan text for compliance issues
 */
export function scanForCompliance(text: string, riskLevel?: string): ComplianceScanResult {
  const flags: ComplianceFlag[] = [];

  // Health claims
  HEALTH_CLAIMS_PATTERNS.forEach((pattern) => {
    const matches = text.matchAll(new RegExp(pattern, "gi"));
    for (const match of matches) {
      flags.push({
        type: "health",
        severity: "high",
        phrase: match[0],
        position: match.index || 0,
        requiresSource: true,
        requiresApproval: true,
      });
    }
  });

  // Financial claims
  FINANCIAL_CLAIMS_PATTERNS.forEach((pattern) => {
    const matches = text.matchAll(new RegExp(pattern, "gi"));
    for (const match of matches) {
      flags.push({
        type: "financial",
        severity: "high",
        phrase: match[0],
        position: match.index || 0,
        requiresSource: true,
        requiresApproval: true,
      });
    }
  });

  // Legal claims
  LEGAL_CLAIMS_PATTERNS.forEach((pattern) => {
    const matches = text.matchAll(new RegExp(pattern, "gi"));
    for (const match of matches) {
      flags.push({
        type: "legal",
        severity: "high",
        phrase: match[0],
        position: match.index || 0,
        requiresSource: true,
        requiresApproval: true,
      });
    }
  });

  // Percentage claims
  const percentageMatches = text.matchAll(PERCENTAGE_PATTERN);
  for (const match of percentageMatches) {
    flags.push({
      type: "percentage",
      severity: "medium",
      phrase: match[0],
      position: match.index || 0,
      requiresSource: true,
      requiresApproval: false,
    });
  }

  // Determine overall risk
  const highSeverityCount = flags.filter((f) => f.severity === "high").length;
  const mediumSeverityCount = flags.filter((f) => f.severity === "medium").length;

  let overallRisk: "high" | "medium" | "low" | "none" = "none";
  if (highSeverityCount > 0 || riskLevel === "high") {
    overallRisk = "high";
  } else if (mediumSeverityCount > 2) {
    overallRisk = "medium";
  } else if (mediumSeverityCount > 0) {
    overallRisk = "low";
  }

  const requiresStrategistApproval = overallRisk === "high" || flags.some((f) => f.requiresApproval);
  const requiresSources = flags.some((f) => f.requiresSource);

  return {
    hasFlags: flags.length > 0,
    flags,
    riskLevel: overallRisk,
    requiresStrategistApproval,
    requiresSources,
    blocksProgress: requiresStrategistApproval || requiresSources,
  };
}

/**
 * Check if sources are sufficient for claims
 */
export function validateSources(
  complianceScan: ComplianceScanResult,
  sources: { url: string; description: string }[]
): { valid: boolean; message: string } {
  if (!complianceScan.requiresSources) {
    return { valid: true, message: "No sources required" };
  }

  if (sources.length === 0) {
    return { valid: false, message: "Claims detected but no sources provided" };
  }

  // Check that high-severity flags have at least one source
  const highSeverityFlags = complianceScan.flags.filter((f) => f.severity === "high");
  if (highSeverityFlags.length > 0 && sources.length === 0) {
    return { valid: false, message: "High-risk claims require source validation" };
  }

  return { valid: true, message: `${sources.length} source(s) attached` };
}

/**
 * Duplicate detection
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  duplicateId?: string;
  duplicateTitle?: string;
  duplicateDate?: string;
}

export function checkForDuplicates(
  newScript: string,
  newTitle: string,
  platform: string,
  existingContent: Array<{
    id: string;
    title: string;
    script?: string;
    platform?: string;
    createdAt: string;
  }>
): DuplicateCheckResult {
  // Simple similarity check (in production, use proper fuzzy matching)
  const normalize = (text: string) => text.toLowerCase().trim().replace(/[^\w\s]/g, "");

  const newScriptNorm = normalize(newScript);
  const newTitleNorm = normalize(newTitle);

  for (const content of existingContent) {
    // Check if same platform and within 30 days
    const daysDiff = Math.abs(
      (new Date().getTime() - new Date(content.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (content.platform === platform && daysDiff <= 30) {
      const contentScriptNorm = normalize(content.script || "");
      const contentTitleNorm = normalize(content.title || "");

      // Calculate similarity (simple character overlap)
      const scriptSimilarity = calculateSimilarity(newScriptNorm, contentScriptNorm);
      const titleSimilarity = calculateSimilarity(newTitleNorm, contentTitleNorm);

      // If title matches exactly and platform matches
      if (titleSimilarity > 0.9 && content.platform === platform) {
        return {
          isDuplicate: true,
          similarity: titleSimilarity * 100,
          duplicateId: content.id,
          duplicateTitle: content.title,
          duplicateDate: content.createdAt,
        };
      }

      // If script similarity is very high
      if (scriptSimilarity > 0.8) {
        return {
          isDuplicate: true,
          similarity: scriptSimilarity * 100,
          duplicateId: content.id,
          duplicateTitle: content.title,
          duplicateDate: content.createdAt,
        };
      }
    }
  }

  return {
    isDuplicate: false,
    similarity: 0,
  };
}

/**
 * Simple similarity calculation (Jaccard similarity)
 */
function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Hook timing detection (mock AI heuristic)
 */
export interface HookTimingResult {
  hookDetected: boolean;
  hookStartTime: number;
  isOptimal: boolean;
  recommendation: string;
}

export function detectHookTiming(
  script: string,
  platform: string
): HookTimingResult {
  // Mock detection - in production, this would use AI/NLP
  const hookKeywords = ["stop", "wait", "attention", "breaking", "urgent", "you won't believe"];
  const lowerScript = script.toLowerCase();

  let hookStartTime = 0;
  let hookDetected = false;

  for (const keyword of hookKeywords) {
    if (lowerScript.includes(keyword)) {
      hookDetected = true;
      // Estimate position based on character position
      const position = lowerScript.indexOf(keyword);
      hookStartTime = Math.floor((position / lowerScript.length) * 10); // rough seconds estimate
      break;
    }
  }

  // Platform-specific optimal windows
  const optimalWindows: Record<string, number> = {
    youtube: 15,
    "youtube-shorts": 3,
    instagram: 3,
    tiktok: 2,
  };

  const optimalWindow = optimalWindows[platform] || 5;
  const isOptimal = hookStartTime <= optimalWindow;

  let recommendation = "";
  if (!hookDetected) {
    recommendation = "No clear hook detected. Consider adding a strong opening.";
  } else if (!isOptimal) {
    recommendation = `Hook appears at ${hookStartTime}s. For ${platform}, aim for within ${optimalWindow}s.`;
  } else {
    recommendation = "Hook timing is optimal!";
  }

  return {
    hookDetected,
    hookStartTime,
    isOptimal,
    recommendation,
  };
}
