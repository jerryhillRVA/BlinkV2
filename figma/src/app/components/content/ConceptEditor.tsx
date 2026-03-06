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
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
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
} from "./types";
import { DEFAULT_SEGMENTS, PLATFORM_CONTENT_TYPES } from "./types";

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
  onCreateBrief?: (item: ContentItem) => void;
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

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex items-center justify-between w-full py-2">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{title}</span>
      {open ? <ChevronUp className="size-3.5 text-gray-400" /> : <ChevronDown className="size-3.5 text-gray-400" />}
    </button>
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
}: ConceptEditorProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [pillarIds, setPillarIds] = useState<string[]>(item.pillarIds);
  const [hook, setHook] = useState(item.hook || "");
  const [objective, setObjective] = useState<ContentObjective | "">(item.objective || "");
  const [platform, setPlatform] = useState<Platform | "">(item.platform || "");
  const [contentType, setContentType] = useState<ContentType | "">(item.contentType || "");
  const [audienceSegments, setAudienceSegments] = useState<AudienceSegment[]>(
    item.segmentIds
      .map((id) => segments.find((s) => s.id === id))
      .filter(Boolean) as AudienceSegment[]
  );
  const [ctaType, setCtaType] = useState<CTATypeEnum | "">(item.cta?.type || "");
  const [ctaText, setCtaText] = useState(item.cta?.text || "");

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const [openSections, setOpenSections] = useState({
    required: true,
    optional: true,
    productionReadiness: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Build current item snapshot
  const buildCurrentItem = useCallback((): ContentItem => ({
    ...item,
    title: title.trim(),
    description: description.trim(),
    pillarIds,
    segmentIds: audienceSegments.map((s) => s.id),
    hook: hook.trim(),
    objective: objective || undefined,
    platform: platform || undefined,
    contentType: contentType || undefined,
    cta: ctaType ? { type: ctaType as CTATypeEnum, text: ctaText.trim() } : undefined,
    updatedAt: new Date().toISOString(),
  }), [item, title, description, pillarIds, audienceSegments, hook, objective, platform, contentType, ctaType, ctaText]);

  // Auto-save with debounce
  useEffect(() => {
    // Skip the initial render
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

      // Reset to idle after a moment
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [title, description, pillarIds, audienceSegments, hook, objective, platform, contentType, ctaType, ctaText]);

  // Flush pending save and exit
  const handleExit = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Save current state immediately before exiting
    onSave(buildCurrentItem());
    onBack();
  }, [buildCurrentItem, onSave, onBack]);

  const contentTypes = platform && platform !== "tbd" && platform !== ""
    ? PLATFORM_CONTENT_TYPES[platform].map((type) => ({
        value: type.value,
        label: type.label,
      }))
    : [];

  // Validation check
  const validationErrors: string[] = [];
  if (!title.trim()) validationErrors.push("Title required");
  if (!description.trim() || description.length < 50 || description.length > 400) {
    validationErrors.push("Description (50-400 chars) required");
  }
  if (pillarIds.length === 0 || pillarIds.length > 3) validationErrors.push("1-3 Content Pillars required");
  if (!hook.trim()) validationErrors.push("Hook required");
  if (!objective) validationErrors.push("Objective required");

  const isValid = validationErrors.length === 0;

  const handleCreateBrief = () => {
    if (!isValid || !onCreateBrief) return;
    // Flush any pending auto-save
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const updatedItem: ContentItem = {
      ...buildCurrentItem(),
      objective: objective as ContentObjective,
      platform: platform as Platform,
      contentType: contentType as ContentType,
    };
    onCreateBrief(updatedItem);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 animate-in fade-in duration-300">
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
            {/* Auto-save status indicator */}
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
                onClick={handleCreateBrief}
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
              {/* Title - Highlighted */}
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

              {/* Description - Highlighted */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                <LabelWithTooltip
                  label="Description (50-400 characters)"
                  tooltip="A detailed description of what this content will be about. This helps guide the production process."
                  required
                />
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
                <LabelWithTooltip
                  label="Hook (max 120 characters)"
                  tooltip="The opening line or attention-grabber that will make people stop scrolling. Should be compelling and relevant."
                  required
                />
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
                <LabelWithTooltip
                  label="Objective"
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

        {/* Optional Fields Section */}
        <Card className="border-gray-100">
          <CardContent className="p-4 space-y-3">
            <div className="space-y-3">
              <div>
                <LabelWithTooltip
                  label="Platform"
                  tooltip="Select the target platform if known. This can help inform content direction even in the concept stage."
                />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {["tbd", "instagram", "tiktok", "youtube", "facebook", "linkedin"].map((p) => {
                    const selected = platform === p;
                    const icons: Record<string, React.ReactNode> = {
                      instagram: <Instagram className="size-4 text-pink-600" />,
                      tiktok: <TikTokIcon />,
                      youtube: <Youtube className="size-4 text-red-600" />,
                      facebook: <Facebook className="size-4 text-blue-600" />,
                      linkedin: <Linkedin className="size-4 text-blue-700" />,
                      tbd: null,
                    };
                    const labels: Record<string, string> = {
                      instagram: "Instagram",
                      tiktok: "TikTok",
                      youtube: "YouTube",
                      facebook: "Facebook",
                      linkedin: "LinkedIn",
                      tbd: "TBD",
                    };
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setPlatform(p as Platform);
                          setContentType("");
                        }}
                        className={cn(
                          "p-2 rounded-lg border transition-all flex flex-col items-center gap-1",
                          selected
                            ? "border-[#d94e33] bg-[#d94e33]/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {icons[p as keyof typeof icons] && (
                          <div className={cn(selected ? "text-[#d94e33]" : "text-gray-500")}>
                            {icons[p as keyof typeof icons]}
                          </div>
                        )}
                        <span className={cn("text-[10px] font-bold", selected ? "text-[#d94e33]" : "text-gray-600")}>
                          {labels[p as keyof typeof labels]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {platform && platform !== "tbd" && platform !== "" && (
                <div>
                  <LabelWithTooltip
                    label="Content Type"
                    tooltip="Choose the specific format for this content if you have a preference."
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    {contentTypes.map((type) => {
                      const selected = contentType === type.value;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setContentType(type.value)}
                          className={cn(
                            "px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all text-left",
                            selected
                              ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33]"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <LabelWithTooltip
                  label="Audience Segments"
                  tooltip="Select which audience segments this content should target. Helps with targeting and distribution."
                />
                <div className="grid grid-cols-3 gap-1.5">
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

              <div>
                <LabelWithTooltip
                  label="CTA Type"
                  tooltip="The call-to-action type determines what you want the audience to do after consuming this content."
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
                    tooltip="The specific text or phrasing for your call-to-action. Keep it concise and action-oriented."
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
            </div>
          </CardContent>
        </Card>

        {/* Move to Production */}
        {onCreateBrief && (
          <Button
            onClick={handleCreateBrief}
            disabled={!isValid}
            className={cn(
              "w-full gap-1.5 h-10 text-sm",
              isValid
                ? "bg-gradient-to-r from-[#d94e33] to-[#e8734a] hover:from-[#c4452d] hover:to-[#d96a42] text-white shadow-sm"
                : ""
            )}
          >
            <ArrowRight className="size-4" />
            Move to Production
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}