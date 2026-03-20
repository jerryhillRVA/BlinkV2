import React from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Rocket, Target, Shield } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FieldInfo } from "@/app/components/FieldInfo";

const fieldStyles = "bg-[#f3f4f6] border-none shadow-none focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:bg-[#edeff2] transition-colors";

export function StepWorkspaceBasics() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Strategic Foundation</h2>
        <p className="text-muted-foreground text-sm">
          Define the purpose and mission your content strategy will serve.
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
      </div>
    </motion.div>
  );
}
