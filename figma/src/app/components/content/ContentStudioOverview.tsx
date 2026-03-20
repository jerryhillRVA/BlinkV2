import React, { useState, useMemo } from "react";
import {
  LayoutGrid,
  FileText,
  Lightbulb,
  PenTool,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  Tag,
  Clock,
  ArrowRight,
  Instagram,
  Youtube,
  ChevronRight,
  Facebook,
  Linkedin,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";
import type { ContentItem, ContentPillar, ContentStage, ContentStatus, Platform, InvestmentPlan, ContentMixTarget } from "./types";

const DEFAULT_MIX: ContentMixTarget[] = [
  { category: "educational", label: "Educational", targetPercent: 35, color: "#3b82f6", description: "How-tos, tips, tutorials, expert insights" },
  { category: "entertaining", label: "Entertaining", targetPercent: 25, color: "#f59e0b", description: "Relatable content, humor, storytelling, trends" },
  { category: "community", label: "Community", targetPercent: 20, color: "#10b981", description: "UGC, Q&As, behind the scenes, audience spotlights" },
  { category: "promotional", label: "Promotional", targetPercent: 15, color: "#d94e33", description: "Products, services, offers, launches" },
  { category: "trending", label: "Trending / Reactive", targetPercent: 5, color: "#8b5cf6", description: "Timely content, news hooks, cultural moments" },
];

interface ContentStudioOverviewProps {
  items: ContentItem[];
  pillars: ContentPillar[];
  onSelectItem: (id: string) => void;
  onNavigateToStep?: (step: string) => void;
  investmentPlan?: InvestmentPlan | null;
}

const STAGE_CONFIG: Record<ContentStage, { label: string; color: string; icon: typeof Lightbulb }> = {
  idea: { label: "Idea", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Lightbulb },
  concept: { label: "Concept", color: "bg-purple-100 text-purple-700 border-purple-200", icon: PenTool },
  post: { label: "Post", color: "bg-green-100 text-green-700 border-green-200", icon: FileText },
};

const STATUS_CONFIG: Record<ContentStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-200" },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  review: { label: "In Review", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  scheduled: { label: "Scheduled", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  published: { label: "Published", color: "bg-green-100 text-green-700 border-green-200" },
};

const PLATFORM_ICONS: Record<Platform, typeof Instagram> = {
  instagram: Instagram,
  tiktok: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  tbd: () => <div className="size-4" />,
};

export function ContentStudioOverview({
  items,
  pillars,
  onSelectItem,
  onNavigateToStep,
  investmentPlan,
}: ContentStudioOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<ContentStage | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ContentStatus | "all">("all");
  const [filterPillar, setFilterPillar] = useState<string>("all");

  // Calculate statistics
  const stats = useMemo(() => {
    const total = items.length;
    const byStage = {
      idea: items.filter((i) => i.stage === "idea").length,
      concept: items.filter((i) => i.stage === "concept").length,
      post: items.filter((i) => i.stage === "post").length,
    };
    const byStatus = {
      draft: items.filter((i) => i.status === "draft").length,
      inProgress: items.filter((i) => i.status === "in-progress").length,
      review: items.filter((i) => i.status === "review").length,
      scheduled: items.filter((i) => i.status === "scheduled").length,
      published: items.filter((i) => i.status === "published").length,
    };
    const recentlyUpdated = items.filter((i) => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(i.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceUpdate <= 7;
    }).length;

    return { total, byStage, byStatus, recentlyUpdated };
  }, [items]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Stage filter
      const matchesStage = filterStage === "all" || item.stage === filterStage;

      // Status filter
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;

      // Pillar filter
      const matchesPillar = filterPillar === "all" || item.pillarIds.includes(filterPillar);

      return matchesSearch && matchesStage && matchesStatus && matchesPillar;
    });
  }, [items, searchQuery, filterStage, filterStatus, filterPillar]);

  // Sort by most recently updated
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [filteredItems]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Simplified Stats Section - Combined */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="size-3.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground font-medium">Total</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>

        {/* Ideas */}
        <button
          onClick={() => setFilterStage("idea")}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
        >
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="size-3.5 text-blue-600" />
            <div className="text-xs text-muted-foreground font-medium group-hover:text-blue-700">Ideas</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-700">{stats.byStage.idea}</div>
        </button>

        {/* Concepts */}
        <button
          onClick={() => setFilterStage("concept")}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:border-purple-300 hover:bg-purple-50/30 transition-all text-left group"
        >
          <div className="flex items-center gap-2 mb-1">
            <PenTool className="size-3.5 text-purple-600" />
            <div className="text-xs text-muted-foreground font-medium group-hover:text-purple-700">Concepts</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 group-hover:text-purple-700">{stats.byStage.concept}</div>
        </button>

        {/* Posts */}
        <button
          onClick={() => setFilterStage("post")}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:border-green-300 hover:bg-green-50/30 transition-all text-left group"
        >
          <div className="flex items-center gap-2 mb-1">
            <FileText className="size-3.5 text-green-600" />
            <div className="text-xs text-muted-foreground font-medium group-hover:text-green-700">Posts</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 group-hover:text-green-700">{stats.byStage.post}</div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setFilterStatus("in-progress")}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group"
        >
          <div className="flex items-center gap-2 mb-1">
            <PenTool className="size-3.5 text-blue-600" />
            <div className="text-xs text-muted-foreground font-medium group-hover:text-blue-700">Active</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-700">{stats.byStatus.inProgress}</div>
        </button>

        {/* Review */}
        <button
          onClick={() => setFilterStatus("review")}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:border-yellow-300 hover:bg-yellow-50/30 transition-all text-left group"
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="size-3.5 text-yellow-600" />
            <div className="text-xs text-muted-foreground font-medium group-hover:text-yellow-700">Review</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 group-hover:text-yellow-700">
            {stats.byStatus.review + stats.byStatus.scheduled}
          </div>
        </button>

        {/* Published */}
        <button
          onClick={() => setFilterStatus("published")}
          className="bg-white rounded-lg border border-gray-200 p-3 hover:border-green-300 hover:bg-green-50/30 transition-all text-left group"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-3.5 text-green-600" />
            <div className="text-xs text-muted-foreground font-medium group-hover:text-green-700">Published</div>
          </div>
          <div className="text-2xl font-bold text-gray-900 group-hover:text-green-700">{stats.byStatus.published}</div>
        </button>
      </div>

      {/* Content Mix Widget */}
      {(() => {
        const categorized = items.filter((i) => i.contentCategory);
        if (categorized.length === 0) return null;
        const counts: Record<string, number> = {};
        for (const item of categorized) {
          counts[item.contentCategory!] = (counts[item.contentCategory!] || 0) + 1;
        }
        const total = categorized.length;
        return (
          <button
            className="w-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-left hover:border-gray-300 transition-colors"
            onClick={() => onNavigateToStep?.("strategy")}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-[#d94e33]" />
                <span className="text-sm font-bold text-gray-900">Content Mix</span>
                <span className="text-xs text-muted-foreground">actual distribution</span>
              </div>
              <span className="text-xs text-[#d94e33]">Manage →</span>
            </div>
            <div className="px-4 py-3">
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {DEFAULT_MIX.map((m) => {
                  const pct = total > 0 ? Math.round(((counts[m.category] || 0) / total) * 100) : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={m.category}
                      style={{ width: `${pct}%`, backgroundColor: m.color }}
                      title={`${m.label}: ${pct}%`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {DEFAULT_MIX.map((m) => {
                  const pct = total > 0 ? Math.round(((counts[m.category] || 0) / total) * 100) : 0;
                  if (pct === 0) return null;
                  return (
                    <div key={m.category} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                      {m.label} {pct}%
                    </div>
                  );
                })}
              </div>
            </div>
          </button>
        );
      })()}

      {/* Content Health Widget — only shown when an investment plan exists */}
      {investmentPlan && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-[#d94e33]" />
              <div>
                <span className="text-sm font-bold text-gray-900">Content Health</span>
                <span className="text-xs text-muted-foreground ml-2">vs. recommended</span>
              </div>
            </div>
            {onNavigateToStep && (
              <button
                onClick={() => onNavigateToStep("strategy")}
                className="text-xs text-[#d94e33] hover:underline"
              >
                Optimize →
              </button>
            )}
          </div>
          <div className="p-4 space-y-3">
            {investmentPlan.pillarAllocations.map((alloc) => {
              const pillar = pillars.find((p) => p.id === alloc.pillarId);
              if (!pillar) return null;
              const totalItems = items.length;
              const actualItems = totalItems > 0
                ? items.filter((i) => i.pillarIds.includes(alloc.pillarId)).length
                : 0;
              const actualPercent = totalItems > 0 ? Math.round((actualItems / totalItems) * 100) : 0;
              const recommendedPercent = alloc.percentage;
              const diff = Math.abs(actualPercent - recommendedPercent);
              const isWarning = diff > 10;
              return (
                <div key={alloc.pillarId} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: pillar.color }} />
                      <span className="text-xs font-medium text-gray-700">{pillar.name}</span>
                      {isWarning && <AlertTriangle className="size-3 text-red-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>Rec: {recommendedPercent}%</span>
                      <span className={cn(isWarning && "text-red-500 font-bold")}>Actual: {actualPercent}%</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{ width: `${recommendedPercent}%`, backgroundColor: pillar.color, opacity: 0.3 }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{ width: `${actualPercent}%`, backgroundColor: pillar.color }}
                    />
                  </div>
                </div>
              );
            })}
            {/* Untagged row */}
            {(() => {
              const untaggedCount = items.filter((i) => !i.pillarIds || i.pillarIds.length === 0).length;
              const untaggedPercent = items.length > 0 ? Math.round((untaggedCount / items.length) * 100) : 0;
              if (untaggedCount === 0) return null;
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-gray-400 shrink-0" />
                      <span className="text-xs font-medium text-gray-500">Untagged</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      <span>{untaggedCount} items ({untaggedPercent}%)</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gray-400 transition-all duration-500"
                      style={{ width: `${untaggedPercent}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Stage Filter */}
          <Select value={filterStage} onValueChange={(v) => setFilterStage(v as ContentStage | "all")}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="size-4 mr-2 shrink-0" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="idea">Ideas</SelectItem>
              <SelectItem value="concept">Concepts</SelectItem>
              <SelectItem value="post">Posts</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ContentStatus | "all")}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>

          {/* Pillar Filter */}
          <Select value={filterPillar} onValueChange={setFilterPillar}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Tag className="size-4 mr-2 shrink-0" />
              <SelectValue placeholder="Pillar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pillars</SelectItem>
              {pillars.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="truncate">{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(searchQuery || filterStage !== "all" || filterStatus !== "all" || filterPillar !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFilterStage("all");
                setFilterStatus("all");
                setFilterPillar("all");
              }}
              className="shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">
              All Content ({sortedItems.length})
            </h3>
            {stats.recentlyUpdated > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{stats.recentlyUpdated} updated this week</span>
              </div>
            )}
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="size-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">No content found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || filterStage !== "all" || filterStatus !== "all" || filterPillar !== "all"
                ? "Try adjusting your filters"
                : "Create your first content to get started"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedItems.map((item) => {
              const stageConfig = STAGE_CONFIG[item.stage];
              const statusConfig = STATUS_CONFIG[item.status];
              const StageIcon = stageConfig.icon;
              const itemPillars = pillars.filter((p) => item.pillarIds.includes(p.id));
              const PlatformIcon = item.platform ? PLATFORM_ICONS[item.platform] : null;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item.id)}
                  className="w-full px-4 py-4 hover:bg-gray-50/80 transition-colors text-left group"
                >
                  <div className="flex items-start gap-4">
                    {/* Stage Icon */}
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-[#d94e33]/10 transition-colors shrink-0">
                      <StageIcon className="size-4 text-gray-600 group-hover:text-[#d94e33]" />
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Title */}
                      <h4 className="font-semibold text-gray-900 group-hover:text-[#d94e33] transition-colors line-clamp-1">
                        {item.title}
                      </h4>

                      {/* Description */}
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Stage */}
                        <Badge
                          variant="outline"
                          className={cn("font-medium border", stageConfig.color)}
                        >
                          {stageConfig.label}
                        </Badge>

                        {/* Status */}
                        <Badge
                          variant="outline"
                          className={cn("font-medium border", statusConfig.color)}
                        >
                          {statusConfig.label}
                        </Badge>

                        {/* Platform */}
                        {PlatformIcon && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <PlatformIcon className="size-3" />
                            <span className="capitalize">{item.platform}</span>
                          </div>
                        )}

                        {/* Pillars */}
                        {itemPillars.slice(0, 2).map((pillar) => (
                          <div
                            key={pillar.id}
                            className="flex items-center gap-1 text-muted-foreground"
                          >
                            <div
                              className="size-2 rounded-full"
                              style={{ backgroundColor: pillar.color }}
                            />
                            <span className="max-w-[100px] truncate">{pillar.name}</span>
                          </div>
                        ))}
                        {itemPillars.length > 2 && (
                          <span className="text-muted-foreground">
                            +{itemPillars.length - 2} more
                          </span>
                        )}

                        {/* Updated Date */}
                        <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                          <Clock className="size-3" />
                          <span>{formatDate(item.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="size-5 text-gray-400 group-hover:text-[#d94e33] transition-colors shrink-0 self-center" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}