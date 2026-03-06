import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  Layers,
  Palette,
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
import type { ContentPillar } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StrategicPillarsProps {
  pillars: ContentPillar[];
  onUpdatePillars: (pillars: ContentPillar[]) => void;
}

const PILLAR_COLORS = [
  "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#f59e0b",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export function StrategicPillars({ pillars, onUpdatePillars }: StrategicPillarsProps) {
  const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null);
  const [showPillarDialog, setShowPillarDialog] = useState(false);
  const [pillarForm, setPillarForm] = useState({ name: "", description: "", color: PILLAR_COLORS[0] });

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#d94e33]/10">
            <Layers className="size-4 text-[#d94e33]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Content Pillars</h3>
            <p className="text-xs text-muted-foreground">Core wellness themes for Hive Collective's mission to support women 40+</p>
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

      {/* Pillars Grid */}
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
                placeholder="e.g. Yoga & Movement"
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
    </div>
  );
}