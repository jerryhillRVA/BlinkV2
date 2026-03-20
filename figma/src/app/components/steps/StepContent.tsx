import React from "react";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Plus,
  Trash2,
  Layout,
  Type,
  ListTodo,
  Users,
  Check,
  Share2,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { FieldInfo } from "@/app/components/FieldInfo";
import type { BusinessObjective } from "@/app/components/content/types";

interface ContentPillar {
  id: number;
  name: string;
  description: string;
  themes: string;
  audienceSegments: string[];
  platforms: string[];
  objectiveId?: string;
}

const fieldStyles = "bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors";

interface StepContentProps {
  objectives?: BusinessObjective[];
}

export function StepContent({ objectives = [] }: StepContentProps) {
  const [pillars, setPillars] = React.useState<ContentPillar[]>([
    { 
      id: 1, 
      name: "Industry News", 
      description: "Timely updates on industry shifts and breaking tech news.",
      themes: "AI, Software Development, Venture Capital",
      audienceSegments: ["Engineers", "Founders"],
      platforms: ["YouTube", "LinkedIn"]
    },
    { 
      id: 2, 
      name: "How-To Guides", 
      description: "Practical tutorials and educational deep-dives.",
      themes: "Tutorials, Productivity, Automation",
      audienceSegments: ["Social Media Managers", "Engineers"],
      platforms: ["YouTube", "Instagram"]
    }
  ]);

  const AVAILABLE_SEGMENTS = ["Engineers", "Founders", "Social Media Managers", "Tech Enthusiasts", "Executives"];
  const AVAILABLE_PLATFORMS = ["YouTube", "LinkedIn", "Twitter/X", "Instagram", "Facebook", "Slack", "Discord"];

  const addPillar = () => {
    const newPillar: ContentPillar = { 
      id: Date.now(), 
      name: "", 
      description: "", 
      themes: "", 
      audienceSegments: [],
      platforms: []
    };
    setPillars([...pillars, newPillar]);
  };

  const removePillar = (id: number) => {
    if (pillars.length > 1) {
      setPillars(pillars.filter(p => p.id !== id));
    }
  };

  const updatePillar = (id: number, field: keyof ContentPillar, value: any) => {
    setPillars(pillars.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const toggleSelection = (pillarId: number, field: "audienceSegments" | "platforms", item: string) => {
    setPillars(pillars.map(p => {
      if (p.id === pillarId) {
        const items = p[field].includes(item)
          ? p[field].filter(s => s !== item)
          : [...p[field], item];
        return { ...p, [field]: items };
      }
      return p;
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Content Strategy</h2>
        <p className="text-muted-foreground text-sm">
          Define your content pillars to ensure consistency and audience alignment.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={addPillar} variant="outline" size="sm" className="h-8 text-[#d94e33] border-[#d94e33] hover:bg-[#d94e33]/5">
          <Plus className="mr-1 size-3" /> Add Pillar
        </Button>
      </div>

      <div className="space-y-10">
        <AnimatePresence mode="popLayout">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative p-8 border rounded-2xl bg-white shadow-sm space-y-6 group"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-[#d94e33] text-white flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Content Pillar Details</h3>
                </div>
                {pillars.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    onClick={() => removePillar(pillar.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <Layout className="size-4 text-[#d94e33]" /> Pillar Name
                      <FieldInfo content="Give this content pillar a clear, descriptive name." />
                    </Label>
                    <Input
                      value={pillar.name}
                      onChange={(e) => updatePillar(pillar.id, "name", e.target.value)}
                      placeholder="e.g. Industry News"
                      className={cn(fieldStyles, "h-12")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <Target className="size-4 text-[#d94e33]" /> Linked Objective
                      <FieldInfo content="Connect this pillar to a business objective so your content always traces back to a measurable goal." />
                    </Label>
                    <Select
                      value={pillar.objectiveId || ""}
                      onValueChange={(v) => updatePillar(pillar.id, "objectiveId", v)}
                    >
                      <SelectTrigger className={cn(fieldStyles, "h-12")}>
                        <SelectValue placeholder={objectives.length === 0 ? "No objectives defined — add in previous step" : "Select an objective"} />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives.length === 0 ? (
                          <SelectItem value="__none__" disabled>No objectives defined — add in previous step</SelectItem>
                        ) : (
                          objectives.map((obj) => (
                            <SelectItem key={obj.id} value={obj.id}>
                              {obj.statement || `${obj.category} objective`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <ListTodo className="size-4 text-[#d94e33]" /> Content Themes
                      <FieldInfo content="List the specific themes or topics that fall under this pillar." />
                    </Label>
                    <Input
                      value={pillar.themes}
                      onChange={(e) => updatePillar(pillar.id, "themes", e.target.value)}
                      placeholder="e.g. AI News, Tutorials, Tips"
                      className={cn(fieldStyles, "h-12")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Type className="size-4 text-[#d94e33]" /> Description
                    <FieldInfo content="Provide a brief explanation of what this pillar covers and why it is important." />
                  </Label>
                  <Textarea 
                    value={pillar.description}
                    onChange={(e) => updatePillar(pillar.id, "description", e.target.value)}
                    placeholder="Describe the purpose of this pillar..." 
                    className={cn(fieldStyles, "min-h-[100px] py-4 resize-none")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Users className="size-4" /> Target Audience
                      <FieldInfo content="Select which audience segments this content pillar is primarily intended for." />
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_SEGMENTS.map((segment) => {
                        const isSelected = pillar.audienceSegments.includes(segment);
                        return (
                          <button
                            key={segment}
                            onClick={() => toggleSelection(pillar.id, "audienceSegments", segment)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5",
                              isSelected 
                                ? "bg-[#d94e33] border-[#d94e33] text-white shadow-sm" 
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[#d94e33]/50"
                            )}
                          >
                            {isSelected && <Check className="size-3" />}
                            {segment}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Share2 className="size-4" /> Distribution Platforms
                      <FieldInfo content="Choose which social platforms this content pillar will be distributed on." />
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_PLATFORMS.map((platform) => {
                        const isSelected = pillar.platforms.includes(platform);
                        return (
                          <button
                            key={platform}
                            onClick={() => toggleSelection(pillar.id, "platforms", platform)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1.5",
                              isSelected 
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-600/50"
                            )}
                          >
                            {isSelected && <Check className="size-3" />}
                            {platform}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
