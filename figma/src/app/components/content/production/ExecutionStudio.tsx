import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Upload,
  X,
  FileText,
  Hash,
  Clock,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Shield,
  AlertCircle,
  ChevronRight,
  Copy,
  RefreshCcw,
  Loader2,
  Info,
  Tag,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Platform, ContentType, ContentItem } from "../types";
import {
  getExecutionFields,
  validateExecutionData,
  canMoveToReview,
  type ExecutionField,
  type ValidationResult,
} from "./execution-fields";
import {
  scanForCompliance,
  validateSources,
  checkForDuplicates,
  detectHookTiming,
  type ComplianceScanResult,
  type DuplicateCheckResult,
} from "./compliance-utils";
import {
  generateScript,
  generateCaptions,
  generateHashtags,
  generateTitleVariants,
  generateCutDowns,
  detectFormattingIssues,
  type AIScriptResult,
} from "./ai-assist-utils";
import {
  getCurrentUserRole,
  hasPermission,
  checkApprovalRequirements,
} from "./role-permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

interface ExecutionStudioProps {
  platform: Platform;
  contentType: ContentType;
  concept: ContentItem;
  existingContent: ContentItem[];
  onSave: (executionData: Record<string, any>) => void;
  onMoveToReview: () => void;
  onBack: () => void;
}

export function ExecutionStudio({
  platform,
  contentType,
  concept,
  existingContent,
  onSave,
  onMoveToReview,
  onBack,
}: ExecutionStudioProps) {
  const [executionData, setExecutionData] = useState<Record<string, any>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [complianceScan, setComplianceScan] = useState<ComplianceScanResult | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null);
  const [sources, setSources] = useState<{ url: string; description: string }[]>([]);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceDesc, setNewSourceDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showCutDowns, setShowCutDowns] = useState(false);

  const fields = useMemo(() => getExecutionFields(platform, contentType), [platform, contentType]);
  const currentUserRole = getCurrentUserRole();

  // Real-time validation
  useEffect(() => {
    const validationResult = validateExecutionData(fields, executionData);
    setValidation(validationResult);
  }, [executionData, fields]);

  // Compliance scanning on script changes
  useEffect(() => {
    if (executionData.script || executionData.scriptOrBeatSheet || executionData.caption) {
      const text = executionData.script || executionData.scriptOrBeatSheet || executionData.caption || "";
      const scan = scanForCompliance(text, concept.riskLevel);
      setComplianceScan(scan);
    }
  }, [executionData.script, executionData.scriptOrBeatSheet, executionData.caption, concept.riskLevel]);

  // Duplicate detection
  useEffect(() => {
    if (executionData.script && executionData.title) {
      const duplicate = checkForDuplicates(
        executionData.script,
        executionData.title,
        platform,
        existingContent.map((item) => ({
          id: item.id,
          title: item.title,
          script: item.production?.outputs?.scriptVersions?.[0]?.content,
          platform: item.platform,
          createdAt: item.createdAt,
        }))
      );
      setDuplicateCheck(duplicate);
    }
  }, [executionData.script, executionData.title, platform, existingContent]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setExecutionData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleAIAssist = async (fieldId: string, action: "generate" | "refine" | "shorten" | "engage") => {
    setIsGenerating(fieldId);

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (fieldId === "script" || fieldId === "scriptOrBeatSheet") {
      const result = generateScript({
        platform,
        contentType,
        brief: {
          strategy: {
            keyMessage: concept.description,
            ctaText: concept.cta?.text,
            tone: "professional",
            viewerPromise: "",
          },
          platformRules: {
            hookType: "problem-first",
            videoStyle: "talking-head",
            storyArc: "hook-promise-sections-recap-cta",
            viewerPromise: "",
          },
        },
        currentScript: executionData[fieldId],
        action,
      });

      handleFieldChange(fieldId, result.script);
      toast.success(`Script ${action}ed successfully!`, {
        description: `Hook: ${result.hookScore}/100 | Clarity: ${result.clarityScore}/100 | Engagement: ${result.engagementScore}/100`,
      });
    } else if (fieldId === "caption") {
      const captions = generateCaptions({
        platform,
        contentType,
        script: executionData.script || executionData.scriptOrBeatSheet || "",
        brief: {
          strategy: {
            keyMessage: concept.description,
            ctaText: concept.cta?.text,
            tone: "professional",
            viewerPromise: "",
          },
          platformRules: {
            hookType: "problem-first",
            videoStyle: "talking-head",
            storyArc: "hook-promise-sections-recap-cta",
            viewerPromise: "",
          },
        },
        characterLimit: 2200,
      });
      handleFieldChange(fieldId, captions[0]);
      toast.success("Caption generated!");
    } else if (fieldId === "hashtags") {
      const hashtagSets = generateHashtags({
        platform,
        contentType,
        brief: {
          strategy: {
            keyMessage: concept.description,
            ctaText: concept.cta?.text,
            tone: "professional",
            viewerPromise: "",
          },
          platformRules: {
            hookType: "problem-first",
            videoStyle: "talking-head",
            storyArc: "hook-promise-sections-recap-cta",
            viewerPromise: "",
          },
        },
        script: executionData.script || "",
      });
      handleFieldChange(fieldId, hashtagSets[0]);
      toast.success("Hashtags generated!");
    } else if (fieldId === "title") {
      const variants = generateTitleVariants({
        currentTitle: concept.title,
        script: executionData.script || "",
        brief: {
          strategy: {
            keyMessage: concept.description,
            ctaText: concept.cta?.text,
            tone: "professional",
            viewerPromise: "",
          },
          platformRules: {
            hookType: "problem-first",
            videoStyle: "talking-head",
            storyArc: "hook-promise-sections-recap-cta",
            viewerPromise: "",
          },
        },
      });
      handleFieldChange(fieldId, variants.seo);
      toast.success("Title optimized for SEO!");
    }

    setIsGenerating(null);
  };

  const handleAddSource = () => {
    if (!newSourceUrl.trim()) {
      toast.error("Please enter a source URL");
      return;
    }
    setSources([...sources, { url: newSourceUrl, description: newSourceDesc }]);
    setNewSourceUrl("");
    setNewSourceDesc("");
    toast.success("Source added");
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleMoveToReview = () => {
    const reviewCheck = canMoveToReview(fields, executionData, concept);

    if (!reviewCheck.canMove) {
      toast.error("Cannot move to review", {
        description: reviewCheck.blockingIssues.join(", "),
      });
      return;
    }

    // Check approval requirements
    const approvalReq = checkApprovalRequirements(
      complianceScan?.riskLevel || "none",
      complianceScan?.hasFlags || false,
      currentUserRole
    );

    if (approvalReq) {
      toast.error("Approval required", {
        description: `${approvalReq.reason}. Contact ${approvalReq.approverRole}.`,
      });
      return;
    }

    // Check sources if compliance requires
    if (complianceScan?.requiresSources) {
      const sourceValidation = validateSources(complianceScan, sources);
      if (!sourceValidation.valid) {
        toast.error("Source validation failed", {
          description: sourceValidation.message,
        });
        setShowSourceDialog(true);
        return;
      }
    }

    onSave(executionData);
    onMoveToReview();
  };

  const handleSaveDraft = () => {
    onSave(executionData);
    toast.success("Draft saved successfully");
  };

  const renderField = (field: ExecutionField) => {
    // Check conditional visibility
    if (field.showIf && !field.showIf(executionData)) {
      return null;
    }

    const value = executionData[field.id] || field.defaultValue || "";
    const fieldErrors = validation?.errors.filter((e) => e.field === field.id) || [];
    const fieldWarnings = validation?.warnings.filter((w) => w.field === field.id) || [];
    const hasError = fieldErrors.length > 0;
    const hasWarning = fieldWarnings.length > 0;

    const commonClasses = cn(
      "transition-all",
      hasError && "border-red-500 focus-visible:ring-red-500",
      hasWarning && "border-amber-500 focus-visible:ring-amber-500"
    );

    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className="flex items-center gap-2">
            {field.label}
            {field.validations.some((v) => v.type === "required" && v.severity === "error") && (
              <span className="text-red-500">*</span>
            )}
            {field.accessibilityField && (
              <Badge variant="outline" className="text-[9px] py-0 h-4">
                A11y
              </Badge>
            )}
          </Label>
          {field.aiAssistAvailable && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] gap-1"
                onClick={() => handleAIAssist(field.id, value ? "refine" : "generate")}
                disabled={isGenerating === field.id}
              >
                {isGenerating === field.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                {value ? "Refine" : "Generate"}
              </Button>
            </div>
          )}
        </div>

        {field.type === "text" && (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
            maxLength={field.validations.find((v) => v.type === "maxLength")?.value}
          />
        )}

        {field.type === "textarea" && (
          <div className="space-y-1">
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={commonClasses}
              rows={field.id.includes("script") ? 12 : 4}
              maxLength={field.validations.find((v) => v.type === "maxLength")?.value}
            />
            {field.validations.find((v) => v.type === "maxLength") && (
              <div className="flex justify-between text-[10px]">
                <span className={cn(
                  "text-muted-foreground",
                  value.length > field.validations.find((v) => v.type === "maxLength")!.value! * 0.9 && "text-amber-600",
                  value.length >= field.validations.find((v) => v.type === "maxLength")!.value! && "text-red-600"
                )}>
                  {value.length} / {field.validations.find((v) => v.type === "maxLength")?.value} characters
                </span>
                {field.validations.find((v) => v.type === "minLength") && value.length > 0 && value.length < field.validations.find((v) => v.type === "minLength")!.value! && (
                  <span className="text-red-600">
                    {field.validations.find((v) => v.type === "minLength")!.value! - value.length} more needed
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {field.type === "select" && (
          <Select value={value} onValueChange={(v) => handleFieldChange(field.id, v)}>
            <SelectTrigger className={commonClasses}>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === "checkbox" && (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.id}
              checked={value}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <label htmlFor={field.id} className="text-sm text-muted-foreground cursor-pointer">
              {field.helperText || field.label}
            </label>
          </div>
        )}

        {field.type === "tags" && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(value) ? value : []).map((tag: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = [...value];
                      newTags.splice(idx, 1);
                      handleFieldChange(field.id, newTags);
                    }}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={field.placeholder || "Add tag..."}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget.value.trim();
                    if (input) {
                      handleFieldChange(field.id, [...(Array.isArray(value) ? value : []), input]);
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
              {field.aiAssistAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIAssist(field.id, "generate")}
                  disabled={isGenerating === field.id}
                  className="gap-1.5"
                >
                  {isGenerating === field.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Generate
                </Button>
              )}
            </div>
          </div>
        )}

        {(field.type === "file" || field.type === "image" || field.type === "video") && (
          <div className="space-y-2">
            {!value ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-[#d94e33] transition-colors",
                  commonClasses
                )}
                onClick={() => {
                  toast.info("File upload simulation", {
                    description: "In production, this would open file picker",
                  });
                  // Mock file upload
                  handleFieldChange(field.id, `mock-file-${field.id}.${field.accept?.split(",")[0].split("/")[1] || "mp4"}`);
                }}
              >
                <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload {field.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {field.accept} {field.helperText && `• ${field.helperText}`}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  {field.type === "video" ? (
                    <Video className="size-4 text-[#d94e33]" />
                  ) : (
                    <ImageIcon className="size-4 text-[#d94e33]" />
                  )}
                  <span className="text-sm font-medium">{value}</span>
                  <CheckCircle2 className="size-4 text-green-600" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFieldChange(field.id, "")}
                  className="h-7 px-2"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {field.type === "time" && (
          <Input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="MM:SS"
            className={commonClasses}
          />
        )}

        {field.type === "url" && (
          <Input
            id={field.id}
            type="url"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || "https://..."}
            className={commonClasses}
          />
        )}

        {field.type === "timestamp" && (
          <Input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="0:00"
            className={commonClasses}
          />
        )}

        {field.helperText && !field.type.includes("checkbox") && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="size-3" />
            {field.helperText}
          </p>
        )}

        {fieldErrors.map((error, idx) => (
          <p key={idx} className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="size-3" />
            {error.message}
          </p>
        ))}

        {fieldWarnings.map((warning, idx) => (
          <p key={idx} className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="size-3" />
            {warning.message}
          </p>
        ))}
      </div>
    );
  };

  const reviewCheck = canMoveToReview(fields, executionData, concept);
  const canMoveNow = reviewCheck.canMove && (!complianceScan?.requiresSources || sources.length > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-none shadow-sm">
        <div className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{concept.title}</h2>
              <p className="text-white/90 text-sm">
                {platform.charAt(0).toUpperCase() + platform.slice(1)} • {contentType}
              </p>
            </div>
            <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      <div className="space-y-2">
        {/* Compliance Scan */}
        {complianceScan && complianceScan.hasFlags && (
          <Card className={cn(
            "border-2",
            complianceScan.riskLevel === "high" ? "border-red-500 bg-red-50" : "border-amber-500 bg-amber-50"
          )}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Shield className={cn("size-5 mt-0.5", complianceScan.riskLevel === "high" ? "text-red-600" : "text-amber-600")} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                      Compliance Scan: {complianceScan.flags.length} flag(s) detected
                    </p>
                    <Badge variant={complianceScan.riskLevel === "high" ? "destructive" : "default"}>
                      {complianceScan.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {complianceScan.flags.slice(0, 3).map((flag, idx) => (
                      <p key={idx} className="text-xs">
                        • <span className="font-mono bg-white px-1 rounded">{flag.phrase}</span> - {flag.type} claim
                        {flag.requiresSource && " (requires source)"}
                      </p>
                    ))}
                  </div>
                  {complianceScan.requiresSources && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSourceDialog(true)}
                      className="gap-2"
                    >
                      <LinkIcon className="size-3.5" />
                      Attach Sources ({sources.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Duplicate Warning */}
        {duplicateCheck && duplicateCheck.isDuplicate && (
          <Card className="border-2 border-amber-500 bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    Duplicate Content Warning ({duplicateCheck.similarity.toFixed(0)}% similar)
                  </p>
                  <p className="text-xs mt-1">
                    Similar to: <span className="font-medium">{duplicateCheck.duplicateTitle}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hook Timing (for video content) */}
        {executionData.script && (contentType.includes("long-form") || contentType.includes("short") || contentType === "reel") && (
          (() => {
            const hookTiming = detectHookTiming(executionData.script, platform);
            return !hookTiming.isOptimal ? (
              <Card className="border-2 border-blue-500 bg-blue-50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Clock className="size-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Hook Timing Feedback</p>
                      <p className="text-xs mt-1">{hookTiming.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })()
        )}
      </div>

      {/* Execution Fields */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {fields.map((field) => renderField(field))}
          </div>

          {/* Cut-downs for long-form */}
          {contentType === "long-form" && executionData.script && (
            <div className="pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCutDowns(!showCutDowns)}
                className="gap-2"
              >
                <Sparkles className="size-4" />
                {showCutDowns ? "Hide" : "Generate"} Short-form Cut-downs
              </Button>

              {showCutDowns && (
                <div className="mt-4 space-y-3">
                  {generateCutDowns(executionData.script).map((cutdown, idx) => (
                    <Card key={idx} className="bg-gray-50">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{cutdown.platform}</p>
                            <p className="text-xs text-muted-foreground">{cutdown.timestamp}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 px-2">
                            <Copy className="size-3" />
                          </Button>
                        </div>
                        <p className="text-xs bg-white p-2 rounded border font-mono whitespace-pre-wrap">
                          {cutdown.script}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">{cutdown.notes}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {validation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {validation.isValid ? (
                  <>
                    <CheckCircle2 className="size-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-sm">All required fields complete</p>
                      {validation.warnings.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {validation.warnings.length} warning(s) - review recommended
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-sm">
                        {validation.errors.length} required field(s) missing
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Complete all fields to move to review
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button
                  onClick={handleMoveToReview}
                  disabled={!canMoveNow}
                  className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] hover:from-[#c2462e] hover:to-[#e05a3d] text-white gap-2 disabled:opacity-50"
                >
                  Continue to Assets
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Dialog */}
      <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach Sources</DialogTitle>
            <DialogDescription>
              Claims detected in your content require source validation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Source URL</Label>
              <Input
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={newSourceDesc}
                onChange={(e) => setNewSourceDesc(e.target.value)}
                placeholder="What this source validates..."
              />
            </div>
            <Button onClick={handleAddSource} className="w-full">
              Add Source
            </Button>

            {sources.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-semibold">Attached Sources ({sources.length})</p>
                {sources.map((source, idx) => (
                  <div key={idx} className="flex items-start justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">{source.url}</p>
                      {source.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{source.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSource(idx)}
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}