import React, { useState } from "react";
import { Sparkles, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type { BusinessObjective, ObjectiveCategory } from "@/app/components/content/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG: Record<ObjectiveCategory, { label: string; emoji: string }> = {
  growth:     { label: "Growth",     emoji: "📈" },
  revenue:    { label: "Revenue",    emoji: "💰" },
  awareness:  { label: "Awareness",  emoji: "📣" },
  trust:      { label: "Trust",      emoji: "🤝" },
  community:  { label: "Community",  emoji: "👥" },
  engagement: { label: "Engagement", emoji: "⚡" },
};

const MOCK_SUGGESTED: Omit<BusinessObjective, "id">[] = [
  {
    category: "growth",
    statement: "Grow combined social following to 25,000",
    target: 25000,
    unit: "followers",
    timeframe: "Q4 2026",
    status: "on-track",
  },
  {
    category: "engagement",
    statement: "Achieve 5% average engagement rate across platforms",
    target: 5,
    unit: "%",
    timeframe: "Q3 2026",
    status: "on-track",
  },
];

function newBlankObjective(): BusinessObjective {
  return {
    id: `obj-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    category: "growth",
    statement: "",
    target: 0,
    unit: "",
    timeframe: "",
    status: "on-track",
  };
}

export function DEFAULT_OBJECTIVES(): BusinessObjective[] {
  return [
    { id: "obj-hive-1", category: "growth", statement: "Grow combined social following to 25,000", target: 25000, unit: "followers", timeframe: "Q4 2026", status: "on-track", currentValue: 11400 },
    { id: "obj-hive-2", category: "engagement", statement: "Achieve 5% average engagement rate across all platforms", target: 5, unit: "%", timeframe: "Q3 2026", status: "at-risk", currentValue: 3.2 },
    { id: "obj-hive-3", category: "community", statement: "Build an active community of 2,000 members who save and share content", target: 2000, unit: "members", timeframe: "Q4 2026", status: "on-track", currentValue: 780 },
    { id: "obj-hive-4", category: "awareness", statement: "Reach 500,000 monthly impressions across Instagram and TikTok", target: 500000, unit: "impressions", timeframe: "Q3 2026", status: "behind", currentValue: 187000 },
  ];
}

interface StepObjectivesProps {
  objectives: BusinessObjective[];
  onUpdateObjectives: (objectives: BusinessObjective[]) => void;
}

export function StepObjectives({ objectives, onUpdateObjectives }: StepObjectivesProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);

  const updateObjective = (id: string, updates: Partial<BusinessObjective>) => {
    onUpdateObjectives(objectives.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const removeObjective = (id: string) => {
    if (objectives.length <= 1) return;
    onUpdateObjectives(objectives.filter((o) => o.id !== id));
  };

  const addObjective = () => {
    if (objectives.length >= 4) return;
    onUpdateObjectives([...objectives, newBlankObjective()]);
  };

  const handleAISuggest = () => {
    setIsSuggesting(true);
    setTimeout(() => {
      setIsSuggesting(false);
      const suggested = MOCK_SUGGESTED.map((o) => ({
        ...o,
        id: `obj-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }));
      onUpdateObjectives([...objectives, ...suggested].slice(0, 4));
      toast.success("Objectives suggested — adjust to fit your goals");
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">Business Objectives</h2>
        <p className="text-muted-foreground">
          What does success look like? Define 2–4 measurable goals that your content strategy will serve.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Everything in Blink — your pillars, audience, content, and performance — traces back to these objectives. Set them carefully.
      </div>

      <div className="space-y-4">
        {objectives.map((obj) => (
          <div key={obj.id} className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white relative">
            {objectives.length > 1 && (
              <button
                className="absolute top-3 right-3 size-6 flex items-center justify-center text-muted-foreground hover:text-destructive rounded"
                onClick={() => removeObjective(obj.id)}
              >
                <X className="size-4" />
              </button>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(CATEGORY_CONFIG) as [ObjectiveCategory, { label: string; emoji: string }][]).map(([cat, cfg]) => (
                  <button
                    key={cat}
                    onClick={() => updateObjective(obj.id, { category: cat })}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all",
                      obj.category === cat
                        ? "border-[#d94e33] bg-[#d94e33]/5 text-[#d94e33] font-medium"
                        : "border-gray-200 text-muted-foreground hover:border-gray-300"
                    )}
                  >
                    <span>{cfg.emoji}</span> {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Objective</Label>
              <Input
                value={obj.statement}
                onChange={(e) => updateObjective(obj.id, { statement: e.target.value })}
                placeholder="e.g. Grow Instagram following to 10,000"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target</Label>
                <Input
                  type="number"
                  value={obj.target || ""}
                  onChange={(e) => updateObjective(obj.id, { target: Number(e.target.value) })}
                  placeholder="10000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit</Label>
                <Input
                  value={obj.unit}
                  onChange={(e) => updateObjective(obj.id, { unit: e.target.value })}
                  placeholder="followers"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeframe</Label>
                <Input
                  value={obj.timeframe}
                  onChange={(e) => updateObjective(obj.id, { timeframe: e.target.value })}
                  placeholder="Q2 2026"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {objectives.length < 4 && (
          <Button variant="outline" className="gap-2" onClick={addObjective}>
            <Plus className="size-4" /> Add Objective
          </Button>
        )}
        <Button
          variant="outline"
          className="gap-2 text-[#d94e33] border-[#d94e33] hover:bg-[#d94e33]/5"
          onClick={handleAISuggest}
          disabled={isSuggesting || objectives.length >= 4}
        >
          {isSuggesting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          AI Suggest Objectives
        </Button>
      </div>
    </div>
  );
}
