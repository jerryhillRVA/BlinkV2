import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Users,
  Type,
  FileText,
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
import type { AudienceSegment } from "./types";
import { toast } from "sonner";

interface AudienceSegmentsProps {
  segments: AudienceSegment[];
  onUpdateSegments: (segments: AudienceSegment[]) => void;
}

export function AudienceSegments({ segments, onUpdateSegments }: AudienceSegmentsProps) {
  const [editingSegment, setEditingSegment] = useState<AudienceSegment | null>(null);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [segmentForm, setSegmentForm] = useState({ name: "", description: "" });

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