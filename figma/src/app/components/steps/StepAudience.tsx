import React, { useState } from "react";
import { Plus, X, Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const fieldStyles = "bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors";

interface Segment {
  id: number;
  name: string;
}

export function StepAudience() {
  const [segments, setSegments] = useState<Segment[]>([
    { id: 1, name: "" },
    { id: 2, name: "" },
  ]);

  const addSegment = () => {
    if (segments.length >= 6) return;
    setSegments((prev) => [...prev, { id: Date.now(), name: "" }]);
  };

  const removeSegment = (id: number) => {
    if (segments.length <= 1) return;
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSegment = (id: number, name: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Audience Segments</h2>
        <p className="text-muted-foreground text-sm">
          Name the groups you're creating content for. You'll define full segment details in the Strategy section.
        </p>
      </div>

      {/* Callout */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Keep this simple — just names for now. Detailed personas, pain points, and journey stages are built in the Strategy section.
        </p>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {segments.map((segment) => (
            <motion.div
              key={segment.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <Input
                value={segment.name}
                onChange={(e) => updateSegment(segment.id, e.target.value)}
                placeholder="e.g. Early-stage founders"
                className={cn(fieldStyles, "h-11 flex-1")}
              />
              {segments.length > 1 && (
                <button
                  onClick={() => removeSegment(segment.id)}
                  className="size-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded transition-colors shrink-0"
                >
                  <X className="size-4" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {segments.length < 6 && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-[#d94e33] border-[#d94e33] hover:bg-[#d94e33]/5"
          onClick={addSegment}
        >
          <Plus className="size-4" /> Add Segment
        </Button>
      )}
    </motion.div>
  );
}
