import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Sparkles, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import type { ContentItem, ContentMixTarget, ContentCategory } from "./types";
import { toast } from "sonner";

const DEFAULT_MIX: ContentMixTarget[] = [
  { category: "educational", label: "Educational", targetPercent: 35, color: "#3b82f6", description: "How-tos, tips, tutorials, expert insights" },
  { category: "entertaining", label: "Entertaining", targetPercent: 25, color: "#f59e0b", description: "Relatable content, humor, storytelling, trends" },
  { category: "community", label: "Community", targetPercent: 20, color: "#10b981", description: "UGC, Q&As, behind the scenes, audience spotlights" },
  { category: "promotional", label: "Promotional", targetPercent: 15, color: "#d94e33", description: "Products, services, offers, launches" },
  { category: "trending", label: "Trending / Reactive", targetPercent: 5, color: "#8b5cf6", description: "Timely content, news hooks, cultural moments" },
];

interface ContentMixProps {
  items: ContentItem[];
  onNavigateToStrategy?: () => void;
}

export function ContentMix({ items, onNavigateToStrategy }: ContentMixProps) {
  const [mix, setMix] = useState<ContentMixTarget[]>(DEFAULT_MIX);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const total = mix.reduce((sum, m) => sum + m.targetPercent, 0);
  const isValid = total === 100;

  const handleSliderChange = (category: ContentCategory, value: number) => {
    setMix((prev) => prev.map((m) => m.category === category ? { ...m, targetPercent: value } : m));
  };

  const handleInputChange = (category: ContentCategory, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 100) return;
    setMix((prev) => prev.map((m) => m.category === category ? { ...m, targetPercent: num } : m));
  };

  const handleReset = () => {
    setMix(DEFAULT_MIX);
    toast.success("Mix reset to defaults");
  };

  const handleAISuggest = () => {
    setIsSuggesting(true);
    setTimeout(() => {
      setMix([
        { ...DEFAULT_MIX[0], targetPercent: 40 },
        { ...DEFAULT_MIX[1], targetPercent: 20 },
        { ...DEFAULT_MIX[2], targetPercent: 25 },
        { ...DEFAULT_MIX[3], targetPercent: 10 },
        { ...DEFAULT_MIX[4], targetPercent: 5 },
      ]);
      setIsSuggesting(false);
      toast.success("Mix adjusted based on your pillars and audience");
    }, 2500);
  };

  // Compute actual distribution from content items
  const actual = useMemo(() => {
    const counts: Record<string, number> = {};
    let uncategorized = 0;
    for (const item of items) {
      if (item.contentCategory) {
        counts[item.contentCategory] = (counts[item.contentCategory] || 0) + 1;
      } else {
        uncategorized++;
      }
    }
    const total = items.length;
    return { counts, uncategorized, total };
  }, [items]);

  const getActualPct = (category: ContentCategory) => {
    if (actual.total === 0) return 0;
    return Math.round(((actual.counts[category] || 0) / actual.total) * 100);
  };

  // Chart data — actual distribution
  const chartData = useMemo(() => {
    const data = mix.map((m) => ({
      name: m.label,
      value: actual.counts[m.category] || 0,
      color: m.color,
    }));
    if (actual.uncategorized > 0) {
      data.push({ name: "Uncategorized", value: actual.uncategorized, color: "#d1d5db" });
    }
    return data.filter((d) => d.value > 0);
  }, [mix, actual]);

  const hasActualData = actual.total > 0 && chartData.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Content Mix Framework</h3>
          <p className="text-xs text-muted-foreground">Define your ideal content ratio and track actual distribution</p>
        </div>
      </div>

      {/* Section 1 — Target Mix */}
      <Card className="border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="font-bold text-gray-900">Target Content Mix</h4>
              <p className="text-xs text-muted-foreground">Define the ideal ratio of content types across your strategy</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs"
                onClick={handleReset}
              >
                <RotateCcw className="size-3" /> Reset to Defaults
              </Button>
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs bg-[#d94e33] hover:bg-[#c4452d]"
                onClick={handleAISuggest}
                disabled={isSuggesting}
              >
                {isSuggesting ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                AI Suggest Mix
              </Button>
            </div>
          </div>

          {/* Running total */}
          <div className={`text-xs font-bold mb-4 flex items-center gap-1.5 ${isValid ? "text-green-600" : "text-amber-600"}`}>
            {!isValid && <AlertTriangle className="size-3.5" />}
            Total: {total}% {isValid ? "✓ Balanced" : `— ${total > 100 ? "over" : "under"} by ${Math.abs(100 - total)}%`}
          </div>

          <div className="space-y-5">
            {mix.map((m) => (
              <div key={m.category} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-sm font-bold text-gray-900">{m.label}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{m.description}</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={m.targetPercent}
                    onChange={(e) => handleInputChange(m.category, e.target.value)}
                    className="w-14 text-right text-sm font-bold border border-gray-200 rounded px-2 py-0.5 outline-none focus:border-gray-400"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={m.targetPercent}
                  onChange={(e) => handleSliderChange(m.category, parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: m.color }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Actual vs Target */}
      <Card className="border-gray-100">
        <CardContent className="p-6">
          <h4 className="font-bold text-gray-900 mb-1">Actual vs. Target</h4>
          <p className="text-xs text-muted-foreground mb-5">
            Distribution based on {actual.total} tagged content items
            {actual.uncategorized > 0 && ` (${actual.uncategorized} uncategorized)`}
          </p>

          {hasActualData ? (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Donut chart */}
              <div className="w-full lg:w-64 shrink-0">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} items`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend + gap indicators */}
              <div className="flex-1 space-y-3">
                {mix.map((m) => {
                  const actualPct = getActualPct(m.category);
                  const diff = actualPct - m.targetPercent;
                  const isBelowTarget = diff < -10;
                  const isAboveTarget = diff > 10;
                  return (
                    <div key={m.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                          <span className="font-medium text-gray-700">{m.label}</span>
                          {isBelowTarget && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <AlertTriangle className="size-2.5" /> Below target
                            </span>
                          )}
                          {isAboveTarget && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
                              Above target
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>Target: {m.targetPercent}%</span>
                          <span className={isBelowTarget ? "text-amber-600 font-bold" : isAboveTarget ? "text-blue-600 font-bold" : "text-green-600 font-bold"}>
                            Actual: {actualPct}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full opacity-30"
                          style={{ width: `${m.targetPercent}%`, backgroundColor: m.color }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{ width: `${actualPct}%`, backgroundColor: m.color }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Uncategorized row */}
                {actual.uncategorized > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-gray-400 shrink-0" />
                        <span className="font-medium text-gray-500">Uncategorized</span>
                      </div>
                      <span className="text-muted-foreground">{Math.round((actual.uncategorized / actual.total) * 100)}% of items</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-400 rounded-full"
                        style={{ width: `${Math.round((actual.uncategorized / actual.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center">
              <div className="text-3xl mb-2">🥧</div>
              <p className="text-sm text-muted-foreground">
                No content items are tagged with a category yet.
                <br />
                Tag your ideas and concepts with a Content Category to see your actual mix.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
