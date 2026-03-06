import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Layers,
  Users,
  Palette,
  Type,
  FileText,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
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
import type { ContentPillar, AudienceSegment } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PillarsSegmentsProps {
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onUpdatePillars: (pillars: ContentPillar[]) => void;
  onUpdateSegments: (segments: AudienceSegment[]) => void;
}

const PILLAR_COLORS = [
  "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#f59e0b",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export function PillarsSegments({ pillars, segments, onUpdatePillars, onUpdateSegments }: PillarsSegmentsProps) {
  const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null);
  const [editingSegment, setEditingSegment] = useState<AudienceSegment | null>(null);
  const [showPillarDialog, setShowPillarDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [pillarForm, setPillarForm] = useState({ name: "", description: "", color: PILLAR_COLORS[0] });
  const [segmentForm, setSegmentForm] = useState({ name: "", description: "" });

  const handleSavePillar = () => {
    if (!pillarForm.name.trim()) {
      toast.error("Pillar name is required");
      return;
    }
    if (editingPillar) {
      onUpdatePillars(pillars.map((p) => (p.id === editingPillar.id ? { ...p, ...pillarForm } : p)));
      toast.success("Pillar updated");
    } else {
      const newPillar: ContentPillar = {
        id: `p-${Date.now()}`,
        ...pillarForm,
      };
      onUpdatePillars([...pillars, newPillar]);
      toast.success("Pillar created");
    }
    setShowPillarDialog(false);
    setEditingPillar(null);
    setPillarForm({ name: "", description: "", color: PILLAR_COLORS[0] });
  };

  const handleDeletePillar = (id: string) => {
    onUpdatePillars(pillars.filter((p) => p.id !== id));
    toast.success("Pillar deleted");
  };

  const handleEditPillar = (pillar: ContentPillar) => {
    setEditingPillar(pillar);
    setPillarForm({ name: pillar.name, description: pillar.description, color: pillar.color });
    setShowPillarDialog(true);
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
    <div className="space-y-8">
      {/* Content Pillars */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#d94e33]/10">
              <Layers className="size-4 text-[#d94e33]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Content Pillars</h3>
              <p className="text-xs text-muted-foreground">Define the core themes your content is organized around</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-[#d94e33] hover:bg-[#c4452d] h-8 gap-1"
            onClick={() => {
              setEditingPillar(null);
              setPillarForm({ name: "", description: "", color: PILLAR_COLORS[pillars.length % PILLAR_COLORS.length] });
              setShowPillarDialog(true);
            }}
          >
            <Plus className="size-3" /> Add Pillar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pillars.map((pillar) => (
            <Card key={pillar.id} className="border-gray-100 group hover:border-gray-200 transition-colors overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: pillar.color }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />
                      <h4 className="font-bold text-sm text-gray-900 truncate">{pillar.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{pillar.description}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-[#d94e33]"
                      onClick={() => handleEditPillar(pillar)}
                    >
                      <Edit3 className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeletePillar(pillar.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Audience Segments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="size-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Audience Segments</h3>
              <p className="text-xs text-muted-foreground">Define the target audiences for your content</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {segments.map((segment) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pillar Dialog */}
      <Dialog open={showPillarDialog} onOpenChange={setShowPillarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPillar ? "Edit Pillar" : "New Content Pillar"}</DialogTitle>
            <DialogDescription>
              {editingPillar ? "Update your content pillar information" : "Create a strategic content pillar to categorize your content"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Type className="size-3" /> Name
              </Label>
              <Input
                value={pillarForm.name}
                onChange={(e) => setPillarForm({ ...pillarForm, name: e.target.value })}
                placeholder="e.g. Industry News"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FileText className="size-3" /> Description
              </Label>
              <Textarea
                value={pillarForm.description}
                onChange={(e) => setPillarForm({ ...pillarForm, description: e.target.value })}
                placeholder="Describe this content pillar..."
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Palette className="size-3" /> Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {PILLAR_COLORS.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "size-8 rounded-full border-2 transition-all flex items-center justify-center",
                      pillarForm.color === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setPillarForm({ ...pillarForm, color: c })}
                  >
                    {pillarForm.color === c && <Check className="size-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPillarDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-[#d94e33] hover:bg-[#c4452d]" onClick={handleSavePillar}>
              {editingPillar ? "Update" : "Create"} Pillar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                placeholder="e.g. Software Engineers"
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