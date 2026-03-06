import React from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/components/ui/select";
import { 
  Plus, 
  X, 
  Users, 
  Target, 
  Rocket, 
  Shield, 
  Mic2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { FieldInfo } from "@/app/components/FieldInfo";

const fieldStyles = "bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors";

export function StepWorkspaceBasics() {
  const [audienceSegments, setAudienceSegments] = React.useState([
    { id: 1, description: "", ageRange: "25-34" }
  ]);

  const addSegment = () => {
    setAudienceSegments([...audienceSegments, { id: Date.now(), description: "", ageRange: "25-34" }]);
  };

  const removeSegment = (id: number) => {
    if (audienceSegments.length > 1) {
      setAudienceSegments(audienceSegments.filter(s => s.id !== id));
    }
  };

  const AGE_RANGES = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Workspace Identity</h2>
        <p className="text-muted-foreground text-sm">
          Define the core purpose and strategic foundation of your workspace.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="workspace-name" className="flex items-center gap-2 font-bold text-gray-900">
            <Rocket className="size-4" /> Workspace Name
            <FieldInfo content="The public name of your workspace as it will appear in your dashboard and reports." />
          </Label>
          <Input 
            id="workspace-name" 
            placeholder="e.g. Hive Collective Main" 
            className={cn(fieldStyles, "h-12")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace-purpose" className="flex items-center gap-2 font-bold text-gray-900">
            <Target className="size-4" /> Workspace Purpose
            <FieldInfo content="Describe why this workspace exists and what the primary goal of your content strategy is." />
          </Label>
          <Textarea
            id="workspace-purpose"
            placeholder="What is the primary reason this workspace exists?"
            className={cn(fieldStyles, "min-h-[100px] py-4")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mission" className="flex items-center gap-2 font-bold text-gray-900">
            <Shield className="size-4" /> Mission
            <FieldInfo content="Your long-term objective. What impact do you want your workspace to have?" />
          </Label>
          <Textarea
            id="mission"
            placeholder="What do you aim to achieve in the long term?"
            className={cn(fieldStyles, "min-h-[100px] py-4")}
          />
        </div>

        {/* Audience Segment Targets */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 font-bold text-gray-900">
              <Users className="size-4" /> Audience Segment Targets
              <FieldInfo content="Define the specific groups of people you are targeting with your content." />
            </Label>
            <Button onClick={addSegment} variant="outline" size="sm" className="h-8 text-[#d94e33] border-[#d94e33] hover:bg-[#d94e33]/5">
              <Plus className="mr-1 size-3" /> Add Segment
            </Button>
          </div>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {audienceSegments.map((segment) => (
                <motion.div 
                  layout 
                  key={segment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative grid grid-cols-1 md:grid-cols-[1fr_150px] gap-4 p-4 rounded-xl bg-gray-50/50"
                >
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Description</Label>
                    <Input 
                      defaultValue={segment.description} 
                      placeholder="e.g. Young professionals in tech"
                      className={cn(fieldStyles, "bg-white border border-gray-100 shadow-none")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Age Range</Label>
                    <Select defaultValue={segment.ageRange}>
                      <SelectTrigger className="bg-white border-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_RANGES.map(range => (
                          <SelectItem key={range} value={range}>{range}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {audienceSegments.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute -right-2 -top-2 size-6 rounded-full bg-white border shadow-sm opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                      onClick={() => removeSegment(segment.id)}
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand-voice" className="flex items-center gap-2 font-bold text-gray-900">
            <Mic2 className="size-4" /> Brand Voice
            <FieldInfo content="Define the personality and tone of your brand. Is it funny, professional, or authoritative?" />
          </Label>
          <Textarea
            id="brand-voice"
            placeholder="Professional, funny, authoritative, etc..."
            className={cn(fieldStyles, "min-h-[100px] py-4")}
          />
        </div>
      </div>
    </motion.div>
  );
}
