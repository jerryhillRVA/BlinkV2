import React from "react";
import { CheckCircle2, PartyPopper } from "lucide-react";
import { motion } from "motion/react";

export function StepReview({ workspaceName = "Social Main" }: { workspaceName?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-10 text-center space-y-6"
    >
      <div className="relative">
        <div className="absolute -inset-4 bg-[#d94e33]/10 rounded-full animate-pulse" />
        <CheckCircle2 className="size-20 text-[#d94e33]" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-[#d94e33]">All Set!</h2>
        <p className="text-muted-foreground text-lg max-w-md">
          Your Blink Social workspace has been configured. The agents are now ready to start working for you.
        </p>
      </div>

      <div className="bg-muted/50 p-6 rounded-xl border w-full max-w-sm text-left space-y-3">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Workspace:</span>
            <span className="font-medium">{workspaceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Content Pillars:</span>
            <span className="font-medium">2 Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platforms:</span>
            <span className="font-medium">LinkedIn, X</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Agents:</span>
            <span className="font-medium">2</span>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground italic flex items-center gap-2">
        <PartyPopper className="size-4" /> Ready to launch?
      </p>
    </motion.div>
  );
}
