import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} style={{ display: "contents" }}>
              {/* Step Circle */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    "size-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
                    isCompleted
                      ? "bg-[#d94e33] border-[#d94e33] text-white"
                      : isActive
                      ? "bg-white border-[#d94e33] text-[#d94e33]"
                      : "bg-white border-muted-foreground text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="size-5" /> : step.id}
                </div>
                <div className="absolute top-12 text-center whitespace-nowrap">
                  <p className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    isActive ? "text-[#d94e33]" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Progress Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-4 bg-muted overflow-hidden">
                  <div
                    className="h-full bg-[#d94e33] transition-all duration-500 ease-in-out"
                    style={{
                      width: isCompleted ? "100%" : isActive ? "0%" : "0%",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-12" /> {/* Spacer for labels */}
    </div>
  );
}
