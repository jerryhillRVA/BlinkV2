import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Instagram,
  Youtube,
  Trash2,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Check,
  Loader2,
  Facebook,
  Linkedin,
  Sparkles,
  Layers,
  Target,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  ContentItem,
  ContentPillar,
  AudienceSegment,
  Platform,
  ContentType,
  ContentObjective,
  CTATypeEnum,
  BusinessObjective,
} from "./types";
import { DEFAULT_SEGMENTS, PLATFORM_CONTENT_TYPES, PLATFORM_CONFIG } from "./types";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

interface ConceptEditorProps {
  item: ContentItem;
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onBack: () => void;
  onSave: (item: ContentItem) => void;
  onDelete: () => void;
  onCreateBrief?: (items: ContentItem[], keepConcept?: boolean, workOnIndex?: number) => void;
  existingProductionItems?: ContentItem[]; // items already in production for this concept
  objectives?: BusinessObjective[];
}

function LabelWithTooltip({ label, tooltip, required }: { label: string; tooltip: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <Label className="text-[10px] font-bold text-muted-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="size-3 text-gray-400 hover:text-gray-600 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-[10px]">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function SelectGrid({
  options,
  value,
  onChange,
  cols = 3,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  cols?: number;
}) {
  return (
    <div className={cn("grid gap-1.5", cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-4" : "grid-cols-3")}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all text-center",
            value === opt.value
              ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33]"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const OBJECTIVE_OPTIONS = [
  { value: "awareness", label: "Awareness" },
  { value: "engagement", label: "Engagement" },
  { value: "trust", label: "Trust" },
  { value: "leads", label: "Leads" },
  { value: "conversion", label: "Conversion" },
];

const CTA_OPTIONS = [
  { value: "learn-more", label: "Learn More" },
  { value: "subscribe", label: "Subscribe" },
  { value: "comment", label: "Comment" },
  { value: "download", label: "Download" },
  { value: "buy", label: "Buy" },
  { value: "book-call", label: "Book Call" },
  { value: "other", label: "Other" },
];

export function ConceptEditor({
  item,
  pillars,
  segments,
  onBack,
  onSave,
  onDelete,
  onCreateBrief,
  existingProductionItems,
  objectives = [],
}: ConceptEditorProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [pillarIds, setPillarIds] = useState<string[]>(item.pillarIds);
  const [hook, setHook] = useState(item.hook || "");
  const [objective, setObjective] = useState<ContentObjective | "">(item.objective || "");
  
  // Multiple production targets
  const [selectedTargets, setSelectedTargets] = useState<Array<{platform: Platform, contentType: ContentType}>>(() => {
    if (item.productionTargets && item.productionTargets.length > 0) return item.productionTargets;
    if (item.platform && item.contentType && item.platform !== "tbd") {
       return [{ platform: item.platform, contentType: item.contentType }];
    }
    return [];
  });
  
  const [audienceSegments, setAudienceSegments] = useState<AudienceSegment[]>(
    item.segmentIds
      .map((id) => segments.find((s) => s.id === id))
      .filter(Boolean) as AudienceSegment[]
  );
  const [ctaType, setCtaType] = useState<CTATypeEnum | "">(item.cta?.type || "");
  const [ctaText, setCtaText] = useState(item.cta?.text || "");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>(item.objectiveId || "");

  // AI Assist States
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingHook, setIsGeneratingHook] = useState(false);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Modal state
  const [showProductionModal, setShowProductionModal] = useState(false);

  // Build current item snapshot
  const buildCurrentItem = useCallback((): ContentItem => ({
    ...item,
    title: title.trim(),
    description: description.trim(),
    pillarIds,
    segmentIds: audienceSegments.map((s) => s.id),
    hook: hook.trim(),
    objective: objective || undefined,
    objectiveId: selectedObjectiveId || undefined,
    productionTargets: selectedTargets,
    platform: selectedTargets.length > 0 ? selectedTargets[0].platform : undefined,
    contentType: selectedTargets.length > 0 ? selectedTargets[0].contentType : undefined,
    cta: ctaType ? { type: ctaType as CTATypeEnum, text: ctaText.trim() } : undefined,
    updatedAt: new Date().toISOString(),
  }), [item, title, description, pillarIds, audienceSegments, hook, objective, selectedObjectiveId, selectedTargets, ctaType, ctaText]);

  // Auto-save with debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus("saving");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSave(buildCurrentItem());
      setSaveStatus("saved");

      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [title, description, pillarIds, audienceSegments, hook, objective, selectedObjectiveId, selectedTargets, ctaType, ctaText]);

  // Flush pending save and exit
  const handleExit = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSave(buildCurrentItem());
    onBack();
  }, [buildCurrentItem, onSave, onBack]);

  // Validation check
  const validationErrors: string[] = [];
  if (!selectedObjectiveId) {
    const hasValidObjectives = objectives.filter((o) => o.statement.trim()).length > 0;
    if (!hasValidObjectives) {
      validationErrors.push("No business objectives have been set up yet. Add them in Strategy & Research before moving to production.");
    } else {
      validationErrors.push("A Business Objective must be linked before moving to production. Select one above.");
    }
  }
  if (!title.trim()) validationErrors.push("Title required");
  if (!description.trim() || description.length < 50 || description.length > 400) {
    validationErrors.push("Description (50-400 chars) required");
  }
  if (pillarIds.length === 0 || pillarIds.length > 3) validationErrors.push("1-3 Content Pillars required");
  if (!hook.trim()) validationErrors.push("Hook required");
  if (!objective) validationErrors.push("Content Goal required");
  if (selectedTargets.length === 0) validationErrors.push("At least 1 Production Target required to move to production");

  const isValid = validationErrors.length === 0;

  const executeMoveToProduction = (keepConcept: boolean, workOnIndex: number) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Create an array of ContentItems, one for each target
    const itemsToProduce: ContentItem[] = selectedTargets.map((t, idx) => ({
      ...buildCurrentItem(),
      id: selectedTargets.length > 1 ? `${item.id}-${idx}-${Date.now()}` : item.id,
      conceptId: item.id,
      platform: t.platform,
      contentType: t.contentType,
      title: title,
    }));

    onCreateBrief!(itemsToProduce, keepConcept, workOnIndex);
    setShowProductionModal(false);
  };

  const handleCreateBriefClick = () => {
    if (!isValid || !onCreateBrief) return;
    if (selectedTargets.length > 1) {
      setShowProductionModal(true);
    } else {
      executeMoveToProduction(false, 0);
    }
  };

  const handleAiDesc = () => {
    setIsGeneratingDesc(true);
    setTimeout(() => {
      setDescription("This engaging and well-structured concept focuses on key points tailored perfectly to our target audience, aiming to spark genuine interaction and connection.");
      setIsGeneratingDesc(false);
    }, 1500);
  };

  const handleAiHook = () => {
    setIsGeneratingHook(true);
    setTimeout(() => {
      setHook("Stop scrolling! We just found the #1 way to instantly upgrade your routine today.");
      setIsGeneratingHook(false);
    }, 1500);
  };

  const toggleTarget = (platform: Platform, contentType: ContentType) => {
    setSelectedTargets(prev => {
      const exactMatch = prev.some(t => t.platform === platform && t.contentType === contentType);
      if (exactMatch) {
        // Deselect this exact pair
        return prev.filter(t => !(t.platform === platform && t.contentType === contentType));
      }
      // Check if this contentType is already selected (on any platform)
      const contentTypeAlreadySelected = prev.some(t => t.contentType === contentType);
      if (contentTypeAlreadySelected) {
        // Replace the existing entry for this content type with the new platform
        return [
          ...prev.filter(t => t.contentType !== contentType),
          { platform, contentType }
        ];
      }
      return [...prev, { platform, contentType }];
    });
  };

  const isTargetSelected = (platform: Platform, contentType: ContentType) =>
    selectedTargets.some(t => t.platform === platform && t.contentType === contentType);

  // A content type is already taken by a different platform selection
  const isContentTypeTakenByOtherPlatform = (platform: Platform, contentType: ContentType) =>
    selectedTargets.some(t => t.contentType === contentType && t.platform !== platform);

  // A content type already has a production item for this concept
  const isAlreadyInProduction = (contentType: ContentType) =>
    (existingProductionItems || []).some(i => i.contentType === contentType && i.stage === "post");

  const availablePlatforms = ["instagram", "tiktok", "youtube", "facebook", "linkedin"] as Platform[];

  return (
    <TooltipProvider>
      <div className="space-y-4 animate-in fade-in duration-300 pb-10">
        {/* Back to Pipeline */}
        <Button variant="ghost" size="sm" onClick={handleExit} className="gap-1 h-7 text-[10px] -ml-3">
          <ChevronLeft className="size-4" /> Back to Pipeline
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Edit Concept</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              All changes are saved automatically
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-in fade-in duration-150">
                  <Loader2 className="size-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-[10px] text-green-600 animate-in fade-in duration-150">
                  <Check className="size-3" />
                  Saved
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onDelete} className="gap-1 text-red-600 h-7 text-[10px]">
              <Trash2 className="size-3" />
              Delete
            </Button>
            {onCreateBrief && (
              <Button
                onClick={handleCreateBriefClick}
                className="gap-1 bg-[#d94e33] hover:bg-[#c2462e] h-7 text-[10px]"
                disabled={!isValid}
              >
                <ArrowRight className="size-3" />
                Move to Production
              </Button>
            )}
          </div>
        </div>

        {/* Validation Status */}
        {validationErrors.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div className="text-amber-600 text-[10px] font-bold">
                  {validationErrors.length} Required Field{validationErrors.length !== 1 ? "s" : ""} Missing:
                </div>
              </div>
              <ul className="mt-1 ml-4 list-disc text-[9px] text-amber-700">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Fields */}
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-3">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                <LabelWithTooltip
                  label="Title"
                  tooltip="The working title for this content concept. This helps identify and organize your content."
                  required
                />
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content title..."
                  className="h-9 text-xs bg-white"
                />
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <LabelWithTooltip
                    label="Description (50-400 characters)"
                    tooltip="A detailed description of what this content will be about. This helps guide the production process."
                    required
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] gap-1 text-[#d94e33] hover:text-[#d94e33] hover:bg-[#d94e33]/10 px-2"
                    onClick={handleAiDesc}
                    disabled={isGeneratingDesc}
                  >
                    {isGeneratingDesc ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                    AI Assist
                  </Button>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the content..."
                  rows={3}
                  className="text-xs bg-white"
                />
                <span
                  className={cn(
                    "text-[9px]",
                    description.length < 50
                      ? "text-red-500"
                      : description.length > 400
                      ? "text-red-500"
                      : "text-gray-400"
                  )}
                >
                  {description.length}/400 characters
                  {description.length < 50 && ` (${50 - description.length} more needed)`}
                </span>
              </div>

              <div>
                <LabelWithTooltip
                  label="Content Pillars (1-3 required)"
                  tooltip="Select the strategic content pillars this concept aligns with. This ensures content stays on-brand."
                  required
                />
                <div className="grid grid-cols-3 gap-1.5">
                  {pillars.map((pillar) => (
                    <button
                      key={pillar.id}
                      onClick={() => {
                        setPillarIds((prev) =>
                          prev.includes(pillar.id)
                            ? prev.filter((p) => p !== pillar.id)
                            : prev.length < 3
                            ? [...prev, pillar.id]
                            : prev
                        );
                      }}
                      className={cn(
                        "px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                        pillarIds.includes(pillar.id)
                          ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {pillar.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <LabelWithTooltip
                    label="Hook (max 120 characters)"
                    tooltip="The opening line or attention-grabber that will make people stop scrolling."
                    required
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] gap-1 text-[#d94e33] hover:text-[#d94e33] hover:bg-[#d94e33]/10 px-2"
                    onClick={handleAiHook}
                    disabled={isGeneratingHook}
                  >
                    {isGeneratingHook ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                    AI Assist
                  </Button>
                </div>
                <Input
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="Enter a compelling hook..."
                  maxLength={120}
                  className="h-9 text-xs"
                />
                <span className={cn("text-[9px]", hook.length >= 100 ? "text-amber-600" : "text-gray-400")}>
                  {hook.length}/120 characters
                </span>
              </div>

              <div>
                <div className="mb-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Business Objective <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Required to move to production. Links this concept to a measurable business goal.</p>
                </div>
                {(() => {
                  const validObjectives = objectives.filter((o) => o.statement.trim());
                  if (validObjectives.length === 0) {
                    return (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700">No business objectives have been set up. Add them in Strategy & Research first.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {validObjectives.map((obj) => {
                        const selected = selectedObjectiveId === obj.id;
                        return (
                          <button
                            key={obj.id}
                            onClick={() => setSelectedObjectiveId(selected ? "" : obj.id)}
                            className={cn(
                              "px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all text-left",
                              selected
                                ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33]"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            )}
                          >
                            {obj.statement.length > 50 ? obj.statement.slice(0, 50) + "…" : obj.statement}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div>
                <LabelWithTooltip
                  label="Content Goal"
                  tooltip="The primary goal of this content. This guides the creative direction and measures success."
                  required
                />
                <SelectGrid
                  options={OBJECTIVE_OPTIONS}
                  value={objective}
                  onChange={(v) => setObjective(v as ContentObjective)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targets & Distribution */}
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-4">
            <div>
              <LabelWithTooltip
                label="Production Targets"
                tooltip="Select the platforms and variations you want to produce. You can select multiple!"
              />
              <div className="space-y-3 mt-1">
                {availablePlatforms.map((p) => {
                  const platformTypes = PLATFORM_CONTENT_TYPES[p] || [];
                  const icons: Record<string, React.ReactNode> = {
                    instagram: <Instagram className="size-4 text-pink-600" />,
                    tiktok: <TikTokIcon />,
                    youtube: <Youtube className="size-4 text-red-600" />,
                    facebook: <Facebook className="size-4 text-blue-600" />,
                    linkedin: <Linkedin className="size-4 text-blue-700" />,
                  };
                  return (
                    <div key={p} className="border border-gray-100 rounded-lg p-2.5 bg-gray-50/30">
                      <div className="flex items-center gap-2 mb-2">
                        {icons[p]}
                        <span className="font-bold text-xs text-gray-700">{PLATFORM_CONFIG[p].label}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {platformTypes.map(type => {
                          const selected = isTargetSelected(p, type.value);
                          const takenByOtherPlatform = isContentTypeTakenByOtherPlatform(p, type.value);
                          const alreadyInProduction = isAlreadyInProduction(type.value);
                          return (
                            <button
                              key={type.value}
                              onClick={() => toggleTarget(p, type.value)}
                              className={cn(
                                "px-2 py-2 rounded-lg border text-[10px] font-medium transition-all text-left flex items-start gap-2",
                                selected
                                  ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33]"
                                  : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                              )}
                              disabled={takenByOtherPlatform || alreadyInProduction}
                            >
                              <div className={cn(
                                "size-3.5 rounded-[3px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors", 
                                selected ? "border-[#d94e33] bg-[#d94e33]" : "border-gray-300"
                              )}>
                                {selected && <Check className="size-2.5 text-white" />}
                              </div>
                              <span className="leading-tight">{type.label}</span>
                              {takenByOtherPlatform && (
                                <Badge className="ml-1 bg-amber-500 text-[9px] font-bold">Taken</Badge>
                              )}
                              {alreadyInProduction && (
                                <Badge className="ml-1 bg-gray-500 text-[9px] font-bold">In Production</Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <LabelWithTooltip
                label="Audience Segments"
                tooltip="Select which audience segments this content should target."
              />
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {DEFAULT_SEGMENTS.map((segment) => {
                  const selected = audienceSegments.some((s) => s.id === segment.id);
                  return (
                    <button
                      key={segment.id}
                      onClick={() => {
                        if (selected) {
                          setAudienceSegments((prev) => prev.filter((s) => s.id !== segment.id));
                        } else {
                          setAudienceSegments((prev) => [...prev, segment]);
                        }
                      }}
                      className={cn(
                        "px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                        selected
                          ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {segment.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <LabelWithTooltip
                label="CTA Type"
                tooltip="The call-to-action type determines what you want the audience to do."
              />
              <SelectGrid
                options={CTA_OPTIONS}
                value={ctaType}
                onChange={(v) => {
                  if (ctaType === v) {
                    setCtaType("");
                    setCtaText("");
                  } else {
                    setCtaType(v as CTATypeEnum);
                  }
                }}
                cols={4}
              />
            </div>

            {ctaType && (
              <div>
                <LabelWithTooltip
                  label="CTA Text (max 120 characters)"
                  tooltip="The specific text or phrasing for your call-to-action."
                />
                <Input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Enter CTA text, e.g. 'Learn more in bio link'"
                  maxLength={120}
                  className="h-9 text-xs"
                />
                <span className={cn("text-[9px]", ctaText.length >= 100 ? "text-amber-600" : "text-gray-400")}>
                  {ctaText.length}/120 characters
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Multiple Target Production Modal */}
      <Dialog open={showProductionModal} onOpenChange={setShowProductionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move Variations to Production</DialogTitle>
            <DialogDescription>
              You've selected <span className="font-bold text-gray-900">{selectedTargets.length} variations</span> for this concept. How would you like to proceed?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 flex flex-col items-start gap-1.5 border-gray-200 hover:bg-gray-50"
              onClick={() => executeMoveToProduction(false, -1)}
            >
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-blue-600" />
                <span className="font-bold text-sm text-gray-900">Add all to Production Queue</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal text-left pl-6">
                Creates {selectedTargets.length} items in your pipeline. Returns you to the Overview.
              </span>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 flex flex-col items-start gap-1.5 border-gray-200 hover:bg-gray-50"
              onClick={() => executeMoveToProduction(true, -1)}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="font-bold text-sm text-gray-900">Queue all & Keep Concept Card</span>
              </div>
              <span className="text-xs text-muted-foreground font-normal text-left pl-6">
                Creates {selectedTargets.length} items but leaves this Concept card in the Concepts column.
              </span>
            </Button>
            
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Or start working on one now:</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {selectedTargets.map((t, idx) => {
                  const pName = PLATFORM_CONFIG[t.platform]?.label;
                  const cType = PLATFORM_CONTENT_TYPES[t.platform]?.find(pt => pt.value === t.contentType)?.label;
                  return (
                    <Button 
                      key={idx}
                      variant="outline" 
                      className="w-full justify-start text-sm border-[#d94e33]/20 hover:bg-[#d94e33]/5 text-gray-800"
                      onClick={() => executeMoveToProduction(false, idx)}
                    >
                      <ArrowRight className="size-3.5 mr-2 text-[#d94e33]" />
                      Produce {pName} {cType}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}