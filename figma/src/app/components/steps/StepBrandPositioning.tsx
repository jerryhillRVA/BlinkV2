import React, { useState } from "react";
import { Crosshair, Mic2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FieldInfo } from "@/app/components/FieldInfo";
import { toast } from "sonner";

const fieldStyles = "bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors";

const TONE_OPTIONS = [
  "Authoritative",
  "Playful",
  "Educational",
  "Inspirational",
  "Conversational",
  "Bold",
  "Empathetic",
  "Direct",
];

interface StepBrandPositioningProps {
  workspaceName?: string;
}

export function StepBrandPositioning({ workspaceName = "your brand" }: StepBrandPositioningProps) {
  const [targetCustomer, setTargetCustomer] = useState("");
  const [problemSolved, setProblemSolved] = useState("");
  const [solution, setSolution] = useState("");
  const [differentiator, setDifferentiator] = useState("");
  const [positioningStatement, setPositioningStatement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [brandVoice, setBrandVoice] = useState("");
  const [selectedTones, setSelectedTones] = useState<string[]>([]);

  const handleGenerateStatement = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const statement = `For ${targetCustomer || "[target customer]"} who ${problemSolved || "[problem solved]"}, ${workspaceName} is the ${solution || "[solution]"} that ${differentiator || "[differentiator]"}.`;
      setPositioningStatement(statement);
      toast.success("Positioning statement generated");
    }, 1500);
  };

  const toggleTone = (tone: string) => {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Brand Positioning & Voice</h2>
        <p className="text-muted-foreground text-sm">
          Define how you communicate and what makes you different.
        </p>
      </div>

      {/* Section A — Brand Positioning */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Crosshair className="size-4 text-[#d94e33]" />
          <span className="font-bold text-gray-900">Brand Positioning</span>
          <FieldInfo content="Your positioning defines who you serve, what problem you solve, and why you're different. This guides every piece of content." />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Who is your target customer?
            </Label>
            <Input
              value={targetCustomer}
              onChange={(e) => setTargetCustomer(e.target.value)}
              placeholder="e.g. Women 40+ navigating midlife wellness"
              className={cn(fieldStyles, "h-11")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              What problem do they have?
            </Label>
            <Input
              value={problemSolved}
              onChange={(e) => setProblemSolved(e.target.value)}
              placeholder="e.g. Overwhelmed by conflicting fitness advice"
              className={cn(fieldStyles, "h-11")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              What's your solution?
            </Label>
            <Input
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="e.g. A movement-first wellness community with expert guidance"
              className={cn(fieldStyles, "h-11")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              What makes you different?
            </Label>
            <Input
              value={differentiator}
              onChange={(e) => setDifferentiator(e.target.value)}
              placeholder="e.g. We combine clinical expertise with authentic community"
              className={cn(fieldStyles, "h-11")}
            />
          </div>

          <Button
            variant="outline"
            className="gap-2 text-[#d94e33] border-[#d94e33] hover:bg-[#d94e33]/5"
            onClick={handleGenerateStatement}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate Positioning Statement
          </Button>

          {positioningStatement && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Positioning Statement
              </Label>
              <Textarea
                value={positioningStatement}
                onChange={(e) => setPositioningStatement(e.target.value)}
                className={cn(fieldStyles, "min-h-[80px] py-3 resize-none")}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section B — Brand Voice */}
      <div className="space-y-5 pt-2 border-t">
        <div className="flex items-center gap-2 pt-4">
          <Mic2 className="size-4 text-gray-600" />
          <span className="font-bold text-gray-900">Brand Voice & Tone</span>
          <FieldInfo content="How does your brand sound? Describe your personality and communication style." />
        </div>

        <div className="space-y-4">
          <Textarea
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="e.g. Professional but approachable. We explain complex topics simply without being condescending."
            className={cn(fieldStyles, "min-h-[100px] py-4 resize-none")}
          />

          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((tone) => {
              const isSelected = selectedTones.includes(tone);
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => toggleTone(tone)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    isSelected
                      ? "bg-[#d94e33] border-[#d94e33] text-white"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {tone}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
