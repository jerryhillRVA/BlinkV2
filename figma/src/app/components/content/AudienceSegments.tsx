import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Users,
  Type,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  Search,
  Target,
  Heart,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/app/components/ui/dialog";
import type { AudienceSegment, SegmentJourneyStage, JourneyStage } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STAGE_CONFIG: Record<JourneyStage, { label: string; color: string; bg: string; borderColor: string; Icon: typeof Eye }> = {
  awareness: { label: "Awareness", color: "text-blue-700", bg: "bg-blue-50", borderColor: "border-blue-200", Icon: Eye },
  consideration: { label: "Consideration", color: "text-amber-700", bg: "bg-amber-50", borderColor: "border-amber-200", Icon: Search },
  conversion: { label: "Conversion", color: "text-green-700", bg: "bg-green-50", borderColor: "border-green-200", Icon: Target },
  retention: { label: "Retention", color: "text-purple-700", bg: "bg-purple-50", borderColor: "border-purple-200", Icon: Heart },
};

const JOURNEY_STAGES: JourneyStage[] = ["awareness", "consideration", "conversion", "retention"];

function makeMockJourney(segmentName: string): SegmentJourneyStage[] {
  return [
    {
      stage: "awareness",
      primaryGoal: `Introduce the brand to ${segmentName} and build recognition`,
      contentTypes: ["Educational Reels", "Trend hooks", "Value carousels"],
      hookAngles: ["Did you know...", "Stop doing X", "The truth about Y"],
      successMetric: "New followers, Reach, Saves",
    },
    {
      stage: "consideration",
      primaryGoal: `Show ${segmentName} how the brand solves their specific challenges`,
      contentTypes: ["Tutorial series", "Q&A posts", "Behind the scenes"],
      hookAngles: ["Here's how to...", "3 mistakes to avoid", "What actually works"],
      successMetric: "Profile visits, Link clicks, Story replies",
    },
    {
      stage: "conversion",
      primaryGoal: `Drive ${segmentName} to take a high-intent action`,
      contentTypes: ["Testimonials", "Product demos", "Limited offers"],
      hookAngles: ["Transform your X in 30 days", "Join 1,000+ women who...", "Last chance for Y"],
      successMetric: "DMs, Sign-ups, Purchases, Bookings",
    },
    {
      stage: "retention",
      primaryGoal: `Keep ${segmentName} engaged and turn them into advocates`,
      contentTypes: ["Community spotlights", "Insider tips", "UGC reposts"],
      hookAngles: ["For our community...", "You asked, we delivered", "Celebrating your wins"],
      successMetric: "Comments, Shares, Repeat purchases, Referrals",
    },
  ];
}

interface AudienceSegmentsProps {
  segments: AudienceSegment[];
  onUpdateSegments: (segments: AudienceSegment[]) => void;
}

export function AudienceSegments({ segments, onUpdateSegments }: AudienceSegmentsProps) {
  const [editingSegment, setEditingSegment] = useState<AudienceSegment | null>(null);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [segmentForm, setSegmentForm] = useState({ name: "", description: "" });

  // Journey state: map of segmentId → expanded boolean
  const [expandedJourneys, setExpandedJourneys] = useState<Record<string, boolean>>({});
  const [mappingJourney, setMappingJourney] = useState<Record<string, boolean>>({});

  // Chip editing: map of `${segmentId}-${stage}-${field}` → newChipValue
  const [newChipValues, setNewChipValues] = useState<Record<string, string>>({});

  const toggleJourney = (id: string) => setExpandedJourneys((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAIMapJourney = (segment: AudienceSegment) => {
    setMappingJourney((prev) => ({ ...prev, [segment.id]: true }));
    setExpandedJourneys((prev) => ({ ...prev, [segment.id]: true }));
    setTimeout(() => {
      const journeyStages = makeMockJourney(segment.name);
      onUpdateSegments(segments.map((s) => s.id === segment.id ? { ...s, journeyStages } : s));
      setMappingJourney((prev) => ({ ...prev, [segment.id]: false }));
      toast.success(`Journey mapped for ${segment.name}`);
    }, 2500);
  };

  const updateStageField = (segmentId: string, stage: JourneyStage, field: keyof SegmentJourneyStage, value: string) => {
    onUpdateSegments(segments.map((s) => {
      if (s.id !== segmentId) return s;
      const stages = (s.journeyStages || []).map((js) =>
        js.stage === stage ? { ...js, [field]: value } : js
      );
      return { ...s, journeyStages: stages };
    }));
  };

  const addChip = (segmentId: string, stage: JourneyStage, field: "contentTypes" | "hookAngles") => {
    const key = `${segmentId}-${stage}-${field}`;
    const val = (newChipValues[key] || "").trim();
    if (!val) return;
    onUpdateSegments(segments.map((s) => {
      if (s.id !== segmentId) return s;
      const stages = (s.journeyStages || []).map((js) => {
        if (js.stage !== stage) return js;
        return { ...js, [field]: [...js[field], val] };
      });
      return { ...s, journeyStages: stages };
    }));
    setNewChipValues((prev) => ({ ...prev, [key]: "" }));
  };

  const removeChip = (segmentId: string, stage: JourneyStage, field: "contentTypes" | "hookAngles", index: number) => {
    onUpdateSegments(segments.map((s) => {
      if (s.id !== segmentId) return s;
      const stages = (s.journeyStages || []).map((js) => {
        if (js.stage !== stage) return js;
        const arr = [...js[field]];
        arr.splice(index, 1);
        return { ...js, [field]: arr };
      });
      return { ...s, journeyStages: stages };
    }));
  };

  const handleSaveSegment = () => {
    if (!segmentForm.name.trim()) {
      toast.error("Segment name is required");
      return;
    }
    if (editingSegment) {
      onUpdateSegments(segments.map((s) => (s.id === editingSegment.id ? { ...s, ...segmentForm } : s)));
      toast.success("Segment updated");
    } else {
      const newSegment: AudienceSegment = {
        id: `s-${Date.now()}`,
        ...segmentForm,
      };
      onUpdateSegments([...segments, newSegment]);
      toast.success("Segment created");
    }
    setShowSegmentDialog(false);
    setEditingSegment(null);
    setSegmentForm({ name: "", description: "" });
  };

  const handleDeleteSegment = (id: string) => {
    onUpdateSegments(segments.filter((s) => s.id !== id));
    toast.success("Segment deleted");
  };

  const handleEditSegment = (segment: AudienceSegment) => {
    setEditingSegment(segment);
    setSegmentForm({ name: segment.name, description: segment.description });
    setShowSegmentDialog(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50">
            <Users className="size-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Audience Segments</h3>
            <p className="text-xs text-muted-foreground">Target audiences within the Hive Collective community of women 40+</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
          onClick={() => {
            setEditingSegment(null);
            setSegmentForm({ name: "", description: "" });
            setShowSegmentDialog(true);
          }}
        >
          <Plus className="size-3" /> Add Segment
        </Button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {segments.map((segment) => {
          const isExpanded = expandedJourneys[segment.id];
          const isMappingThis = mappingJourney[segment.id];
          const hasJourney = segment.journeyStages && segment.journeyStages.length > 0;

          return (
            <Card key={segment.id} className="border-gray-100 group hover:border-gray-200 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="size-3.5 text-blue-500 shrink-0" />
                      <h4 className="font-bold text-sm text-gray-900 truncate">{segment.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{segment.description}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-blue-600"
                      onClick={() => handleEditSegment(segment)}
                    >
                      <Edit3 className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteSegment(segment.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Journey section */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <button
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => toggleJourney(segment.id)}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Journey</span>
                    {isExpanded ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
                  </button>

                  {/* Collapsed summary */}
                  {!isExpanded && (
                    <div className="mt-2">
                      {hasJourney ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {JOURNEY_STAGES.map((stage) => {
                            const cfg = STAGE_CONFIG[stage];
                            return (
                              <span key={stage} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.bg, cfg.color, "border", cfg.borderColor)}>
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          className="text-[10px] text-[#d94e33] hover:underline flex items-center gap-1 mt-1"
                          onClick={(e) => { e.stopPropagation(); handleAIMapJourney(segment); }}
                          disabled={isMappingThis}
                        >
                          {isMappingThis ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                          {isMappingThis ? "Mapping..." : "Map Journey"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Expanded journey */}
                  {isExpanded && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 border-[#d94e33] text-[#d94e33] hover:bg-[#d94e33]/5"
                          onClick={() => handleAIMapJourney(segment)}
                          disabled={isMappingThis}
                        >
                          {isMappingThis ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                          {isMappingThis ? "Mapping..." : "AI Map Journey"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {JOURNEY_STAGES.map((stage) => {
                          const cfg = STAGE_CONFIG[stage];
                          const StageIcon = cfg.Icon;
                          const stageData = segment.journeyStages?.find((js) => js.stage === stage);
                          if (!stageData) {
                            return (
                              <div key={stage} className={cn("rounded-lg border p-3", cfg.borderColor, cfg.bg)}>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <StageIcon className={cn("size-3.5", cfg.color)} />
                                  <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Not yet mapped — click AI Map Journey</p>
                              </div>
                            );
                          }
                          return (
                            <div key={stage} className={cn("rounded-lg border p-3 space-y-2", cfg.borderColor, cfg.bg)}>
                              <div className="flex items-center gap-1.5">
                                <StageIcon className={cn("size-3.5", cfg.color)} />
                                <span className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</span>
                              </div>
                              {/* Primary Goal */}
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Goal</p>
                                <textarea
                                  className="w-full text-[10px] text-gray-700 bg-white/60 border border-transparent focus:border-gray-200 rounded px-1.5 py-1 resize-none outline-none"
                                  rows={2}
                                  value={stageData.primaryGoal}
                                  onChange={(e) => updateStageField(segment.id, stage, "primaryGoal", e.target.value)}
                                />
                              </div>
                              {/* Content Types chips */}
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Content Types</p>
                                <div className="flex flex-wrap gap-1">
                                  {stageData.contentTypes.map((ct, i) => (
                                    <span key={i} className="inline-flex items-center gap-0.5 bg-white/80 border border-gray-200 text-[9px] px-1.5 py-0.5 rounded-full text-gray-700">
                                      {ct}
                                      <button onClick={() => removeChip(segment.id, stage, "contentTypes", i)}><X className="size-2.5 text-gray-400 hover:text-red-500" /></button>
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <input
                                    className="text-[9px] bg-white/60 border border-gray-200 rounded px-1.5 py-0.5 flex-1 outline-none"
                                    placeholder="Add type..."
                                    value={newChipValues[`${segment.id}-${stage}-contentTypes`] || ""}
                                    onChange={(e) => setNewChipValues((prev) => ({ ...prev, [`${segment.id}-${stage}-contentTypes`]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(segment.id, stage, "contentTypes"); } }}
                                  />
                                  <button className="text-[9px] text-[#d94e33]" onClick={() => addChip(segment.id, stage, "contentTypes")}>+</button>
                                </div>
                              </div>
                              {/* Hook Angles chips */}
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Hook Angles</p>
                                <div className="flex flex-wrap gap-1">
                                  {stageData.hookAngles.map((h, i) => (
                                    <span key={i} className="inline-flex items-center gap-0.5 bg-white/80 border border-gray-200 text-[9px] px-1.5 py-0.5 rounded-full text-gray-700 italic">
                                      {h}
                                      <button onClick={() => removeChip(segment.id, stage, "hookAngles", i)}><X className="size-2.5 text-gray-400 hover:text-red-500" /></button>
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <input
                                    className="text-[9px] bg-white/60 border border-gray-200 rounded px-1.5 py-0.5 flex-1 outline-none italic"
                                    placeholder="Add hook..."
                                    value={newChipValues[`${segment.id}-${stage}-hookAngles`] || ""}
                                    onChange={(e) => setNewChipValues((prev) => ({ ...prev, [`${segment.id}-${stage}-hookAngles`]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(segment.id, stage, "hookAngles"); } }}
                                  />
                                  <button className="text-[9px] text-[#d94e33]" onClick={() => addChip(segment.id, stage, "hookAngles")}>+</button>
                                </div>
                              </div>
                              {/* Success Metric */}
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Success Metric</p>
                                <input
                                  className="w-full text-[9px] text-gray-700 bg-white/60 border border-gray-200 rounded px-1.5 py-0.5 outline-none"
                                  value={stageData.successMetric}
                                  onChange={(e) => updateStageField(segment.id, stage, "successMetric", e.target.value)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Segment Dialog */}
      <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSegment ? "Edit Segment" : "New Audience Segment"}</DialogTitle>
            <DialogDescription>
              {editingSegment ? "Update your audience segment details" : "Define a target audience segment for your content"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Users className="size-3" /> Name
              </Label>
              <Input
                value={segmentForm.name}
                onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                placeholder="e.g. Active 40s"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FileText className="size-3" /> Description
              </Label>
              <Textarea
                value={segmentForm.description}
                onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                placeholder="Describe this audience segment..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSegmentDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveSegment}>
              {editingSegment ? "Update" : "Create"} Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}