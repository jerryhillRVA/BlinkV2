import React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

interface FieldInfoProps {
  content: string;
}

export function FieldInfo({ content }: FieldInfoProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button" 
          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-[#d94e33] transition-colors focus:outline-none"
          aria-label="More information"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-gray-900 text-white border-none shadow-lg p-3">
        <p className="text-[11px] font-medium leading-relaxed">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
