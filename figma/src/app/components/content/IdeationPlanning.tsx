import React, { useState, useMemo } from "react";
import {
  Lightbulb,
  Plus,
  Search,
  Calendar,
  Sparkles,
  Loader2,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Trash2,
  Edit3,
  MoreHorizontal,
  Eye,
  Copy,
  ArrowRight,
  Type,
  AlignLeft,
  Zap,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/app/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import type { ContentItem, ContentPillar, AudienceSegment, ContentStatus } from "./types";
import { STAGE_CONFIG, STATUS_CONFIG } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

interface IdeationPlanningProps {
  items: ContentItem[];
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onSaveItem: (item: ContentItem) => void;
  onDeleteItem: (id: string) => void;
  onSelectItem: (id: string) => void;
  onMoveToProduction: (id: string) => void;
}

type IdeaView = "ideas" | "calendar" | "ai-tools";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function IdeationPlanning({
  items,
  pillars,
  segments,
  onSaveItem,
  onDeleteItem,
  onSelectItem,
  onMoveToProduction,
}: IdeationPlanningProps) {
  const [activeView, setActiveView] = useState<IdeaView>("ideas");
  const [searchQuery, setSearchQuery] = useState("");
  const [showIdeaDialog, setShowIdeaDialog] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ContentItem | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // New idea form
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [ideaPillars, setIdeaPillars] = useState<string[]>([]);
  const [ideaSegments, setIdeaSegments] = useState<string[]>([]);

  // AI Tools state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResults, setAiResults] = useState<{ type: string; content: string }[]>([]);

  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(1); // 0-based, February 2026

  // Ideas are items at "idea" stage
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

  const scheduledItems = useMemo(
    () => items.filter((i) => i.scheduledDate),
    [items]
  );

  const resetIdeaForm = () => {
    setIdeaTitle("");
    setIdeaDescription("");
    setIdeaPillars([]);
    setIdeaSegments([]);
    setEditingIdea(null);
  };

  const handleOpenNewIdea = () => {
    resetIdeaForm();
    setShowIdeaDialog(true);
  };

  const handleEditIdea = (idea: ContentItem) => {
    setEditingIdea(idea);
    setIdeaTitle(idea.title);
    setIdeaDescription(idea.description);
    setIdeaPillars(idea.pillarIds);
    setIdeaSegments(idea.segmentIds);
    setShowIdeaDialog(true);
  };

  const handleSaveIdea = () => {
    if (!ideaTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    const now = new Date().toISOString();
    const item: ContentItem = {
      id: editingIdea?.id || `c-${Date.now()}`,
      stage: "idea",
      status: editingIdea?.status || "draft",
      title: ideaTitle,
      description: ideaDescription,
      pillarIds: ideaPillars,
      segmentIds: ideaSegments,
      createdAt: editingIdea?.createdAt || now,
      updatedAt: now,
    };
    onSaveItem(item);
    setShowIdeaDialog(false);
    resetIdeaForm();
    toast.success(editingIdea ? "Idea updated" : "Idea captured!");
  };

  const handleAIGenerate = (type: "outlines" | "hooks" | "headlines") => {
    if (!aiPrompt.trim()) {
      toast.error("Enter a topic or description first");
      return;
    }
    setIsAIGenerating(true);
    setTimeout(() => {
      setIsAIGenerating(false);
      const topic = aiPrompt;
      const results: { type: string; content: string }[] = [];

      if (type === "outlines") {
        results.push(
          { type: "Outline", content: `1. Introduction: Why ${topic} matters in 2026\n2. The Current State: What's happening right now\n3. Key Trends: 3 shifts you need to know\n4. Practical Steps: How to adapt your strategy\n5. Conclusion: What to do next` },
          { type: "Outline", content: `1. Hook: A surprising statistic about ${topic}\n2. Context: The backstory most people miss\n3. Deep Dive: Expert insights and data\n4. Case Study: Real-world example\n5. Actionable Takeaways\n6. CTA: Join the conversation` },
        );
      } else if (type === "hooks") {
        results.push(
          { type: "Hook", content: `Most people get ${topic} completely wrong. Here's what actually works...` },
          { type: "Hook", content: `I spent 30 days testing every ${topic} strategy. The results shocked me.` },
          { type: "Hook", content: `Stop scrolling. If you care about ${topic}, this will change everything.` },
          { type: "Hook", content: `The top 1% already know this about ${topic}. Now you will too.` },
        );
      } else {
        results.push(
          { type: "Headline", content: `The Ultimate Guide to ${topic} in 2026` },
          { type: "Headline", content: `${topic}: What Nobody's Telling You` },
          { type: "Headline", content: `5 ${topic} Mistakes That Are Costing You Growth` },
          { type: "Headline", content: `How ${topic} Is Reshaping the Creator Economy` },
          { type: "Headline", content: `${topic} 101: Everything You Need to Know` },
        );
      }

      setAiResults(results);
      toast.success(`Generated ${results.length} ${type}!`);
    }, 2000);
  };

  const handleUseAIResult = (content: string) => {
    setIdeaTitle(content.split("\n")[0].replace(/^\d+\.\s*/, "").slice(0, 100));
    setIdeaDescription(content);
    setShowIdeaDialog(true);
    toast.success("AI result added to new idea");
  };

  // Calendar helpers
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentYear = 2026;
  const firstDay = new Date(currentYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, calendarMonth + 1, 0).getDate();

  const getItemsForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return scheduledItems.filter((i) => i.scheduledDate === dateStr);
  };

  const views = [
    { id: "ideas" as const, label: "Idea Hub", icon: Lightbulb },
    { id: "calendar" as const, label: "Editorial Calendar", icon: Calendar },
    { id: "ai-tools" as const, label: "AI Writing Tools", icon: Wand2 },
  ];

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {views.map((v) => {
          const Icon = v.icon;
          const isActive = activeView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all relative",
                isActive ? "text-[#d94e33]" : "text-muted-foreground hover:text-gray-700"
              )}
            >
              <Icon className={cn("size-4", isActive ? "text-[#d94e33]" : "opacity-60")} />
              {v.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d94e33] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Idea Hub */}
      {activeView === "ideas" && (
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
            <Button
              size="sm"
              className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 h-9"
              onClick={handleOpenNewIdea}
            >
              <Plus className="size-3.5" /> Capture Idea
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">{ideas.length} ideas captured</div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ideas.map((idea) => {
              const statusConf = STATUS_CONFIG[idea.status];
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
                            <DropdownMenuItem onClick={() => handleEditIdea(idea)}>
                              <Edit3 className="mr-2 size-3" /> Edit
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
                  </CardContent>
                </Card>
              );
            })}

            {/* Quick Add Card */}
            <Card
              className="border-dashed border-2 border-gray-200 hover:border-[#d94e33]/30 transition-colors cursor-pointer"
              onClick={handleOpenNewIdea}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center min-h-[150px] text-center">
                <div className="p-3 bg-gray-50 rounded-full mb-2">
                  <Plus className="size-5 text-gray-400" />
                </div>
                <p className="text-xs font-bold text-muted-foreground">Capture a new idea</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Quick capture your content concepts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Editorial Calendar */}
      {activeView === "calendar" && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-gray-100">
            <div className="p-4 flex items-center justify-between border-b bg-white">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setCalendarMonth((m) => Math.max(0, m - 1))}>
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <h2 className="text-sm font-bold">{months[calendarMonth]} {currentYear}</h2>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setCalendarMonth((m) => Math.min(11, m + 1))}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b">
                {days.map((day) => (
                  <div key={day} className="py-2 text-center text-[10px] font-bold text-muted-foreground bg-gray-50/50 border-r last:border-r-0 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="border-r border-b p-2 bg-gray-50/20 min-h-[90px]" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayItems = getItemsForDate(day);
                  const isToday = calendarMonth === 1 && day === 23; // Feb 23, 2026
                  return (
                    <div key={day} className={cn(
                      "border-r border-b p-1.5 min-h-[90px] hover:bg-gray-50/50 transition-colors",
                      isToday && "bg-[#d94e33]/5"
                    )}>
                      <span className={cn(
                        "text-[10px] font-bold inline-flex items-center justify-center size-5 rounded-full",
                        isToday ? "bg-[#d94e33] text-white" : "text-gray-500"
                      )}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayItems.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "text-[9px] px-1 py-0.5 rounded truncate cursor-pointer",
                              item.status === "published" ? "bg-green-100 text-green-700" :
                              item.status === "scheduled" ? "bg-pink-100 text-pink-700" :
                              "bg-blue-100 text-blue-700"
                            )}
                            onClick={() => onSelectItem(item.id)}
                            title={item.title}
                          >
                            {item.title}
                          </div>
                        ))}
                        {dayItems.length > 2 && (
                          <span className="text-[9px] text-muted-foreground">+{dayItems.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* Fill remaining cells */}
                {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
                  <div key={`end-${i}`} className="border-r border-b p-2 bg-gray-50/20 min-h-[90px]" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming scheduled */}
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="size-4 text-[#d94e33]" /> Upcoming Scheduled Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scheduledItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/50 border border-gray-100 cursor-pointer hover:border-[#d94e33]/30 transition-colors"
                    onClick={() => onSelectItem(item.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.scheduledDate && new Date(item.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {item.scheduledTime && ` at ${item.scheduledTime}`}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-bold border", STATUS_CONFIG[item.status].color)}>
                      {STATUS_CONFIG[item.status].label}
                    </Badge>
                  </div>
                ))}
                {scheduledItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No scheduled content yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Writing Tools */}
      {activeView === "ai-tools" && (
        <div className="space-y-6">
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-[#d94e33]" /> AI Content Brainstorm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Topic or Description
                </Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the topic, angle, or idea you want to explore..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 h-9"
                  onClick={() => handleAIGenerate("outlines")}
                  disabled={isAIGenerating}
                >
                  {isAIGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <AlignLeft className="size-3.5" />}
                  Generate Outlines
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-9 border-[#d94e33]/30 text-[#d94e33] hover:bg-[#d94e33]/5"
                  onClick={() => handleAIGenerate("hooks")}
                  disabled={isAIGenerating}
                >
                  {isAIGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
                  Generate Hooks
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-9 border-[#d94e33]/30 text-[#d94e33] hover:bg-[#d94e33]/5"
                  onClick={() => handleAIGenerate("headlines")}
                  disabled={isAIGenerating}
                >
                  {isAIGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Type className="size-3.5" />}
                  Generate Headlines
                </Button>
              </div>
            </CardContent>
          </Card>

          {isAIGenerating && (
            <Card className="border-gray-100">
              <CardContent className="py-12 text-center">
                <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700">AI is brainstorming...</p>
                <p className="text-xs text-muted-foreground mt-1">Generating creative content based on your topic</p>
              </CardContent>
            </Card>
          )}

          {!isAIGenerating && aiResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="size-4 text-[#d94e33]" />
                Generated Results ({aiResults.length})
              </h3>
              {aiResults.map((result, idx) => (
                <Card key={idx} className="border-gray-100 hover:border-[#d94e33]/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Badge variant="outline" className="text-[9px] font-bold mb-2 text-[#d94e33] border-[#d94e33]/20 bg-[#d94e33]/5">
                          {result.type}
                        </Badge>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{result.content}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] text-muted-foreground hover:text-[#d94e33]"
                          onClick={() => {
                            copyToClipboard(result.content);
                            toast.success("Copied to clipboard");
                          }}
                        >
                          <Copy className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] text-[#d94e33] gap-1"
                          onClick={() => handleUseAIResult(result.content)}
                        >
                          <Plus className="size-3" /> Use
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Idea Dialog */}
      <Dialog open={showIdeaDialog} onOpenChange={setShowIdeaDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIdea ? "Edit Idea" : "Capture New Idea"}</DialogTitle>
            <DialogDescription>
              {editingIdea ? "Update your content idea details" : "Quickly capture your content concept and categorize it"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title *</Label>
              <Input
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="What's the big idea?"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                placeholder="Describe your content idea..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Pillars</Label>
              <div className="flex flex-wrap gap-2">
                {pillars.map((p) => {
                  const selected = ideaPillars.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setIdeaPillars((prev) => selected ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
                        selected ? "text-white shadow-sm" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400"
                      )}
                      style={selected ? { backgroundColor: p.color, borderColor: p.color } : undefined}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audience Segments</Label>
              <div className="flex flex-wrap gap-2">
                {segments.map((s) => {
                  const selected = ideaSegments.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setIdeaSegments((prev) => selected ? prev.filter((x) => x !== s.id) : [...prev, s.id])}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
                        selected ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-400"
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIdeaDialog(false)}>Cancel</Button>
            <Button className="bg-[#d94e33] hover:bg-[#c4452d]" onClick={handleSaveIdea}>
              {editingIdea ? "Update" : "Capture"} Idea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}