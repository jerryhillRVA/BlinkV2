import React, { useState, useMemo } from "react";
import {
  Lightbulb,
  Plus,
  Search,
  Trash2,
  Edit3,
  MoreHorizontal,
  ArrowRight,
  ChevronRight,
  Target,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import type { ContentItem, ContentPillar, AudienceSegment, BusinessObjective } from "./types";
import { STATUS_CONFIG } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface IdeationPlanningProps {
  items: ContentItem[];
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onDeleteItem: (id: string) => void;
  onSelectItem: (id: string) => void;
  onMoveToProduction: (id: string) => void;
  onSaveItem: (item: ContentItem) => void;
  objectives?: BusinessObjective[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function IdeationPlanning({
  items,
  pillars,
  segments,
  onDeleteItem,
  onSelectItem,
  onMoveToProduction,
  onSaveItem,
  objectives = [],
}: IdeationPlanningProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const ideas = useMemo(() => {
    let result = items.filter((i) => i.stage === "idea");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            className="pl-9 h-9 border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">{ideas.length} ideas captured</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ideas.map((idea) => {
          return (
            <Card key={idea.id} className="border-gray-100 hover:border-[#d94e33]/30 transition-all group cursor-pointer" onClick={() => onSelectItem(idea.id)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[9px] font-bold gap-1 border bg-blue-100 text-blue-700 border-blue-200">
                    <Lightbulb className="size-3" /> Idea
                  </Badge>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onSelectItem(idea.id)}>
                          <Edit3 className="mr-2 size-3" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (!idea.objectiveId) {
                              onSelectItem(idea.id);
                              toast.info("Add a Business Objective to promote this idea to a Concept");
                            } else {
                              onSaveItem({ ...idea, stage: "concept" });
                              toast.success("Promoted to Concept");
                            }
                          }}
                        >
                          <ChevronRight className="mr-2 size-3" /> Promote to Concept
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMoveToProduction(idea.id)}>
                          <ArrowRight className="mr-2 size-3" /> Move to Production
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => onDeleteItem(idea.id)}>
                          <Trash2 className="mr-2 size-3" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold line-clamp-2 group-hover:text-[#d94e33] transition-colors">
                    {idea.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{idea.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {idea.pillarIds.slice(0, 2).map((pid) => {
                      const p = pillars.find((pp) => pp.id === pid);
                      return p ? (
                        <span key={pid} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: p.color + "15", color: p.color }}>
                          {p.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDate(idea.createdAt)}</span>
                </div>
                {idea.objectiveId && (() => {
                  const obj = objectives.find((o) => o.id === idea.objectiveId);
                  return obj ? (
                    <div className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-[#d94e33]/5 text-[#d94e33] border border-[#d94e33]/10 w-fit mt-1">
                      <Target className="size-2.5" />
                      {obj.statement.length > 30 ? obj.statement.slice(0, 30) + "…" : obj.statement}
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
