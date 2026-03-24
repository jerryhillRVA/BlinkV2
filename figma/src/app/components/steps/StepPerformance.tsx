import React, { useState, useMemo } from "react";
import {
  Target,
  Eye,
  Users,
  Zap,
  BookmarkCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";
import type { BusinessObjective, ContentItem, Platform } from "@/app/components/content/types";

export interface StepPerformanceProps {
  objectives: BusinessObjective[];
  contentItems: ContentItem[];
  onNavigateToPipeline?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  "on-track": { label: "On Track", className: "bg-green-50 text-green-700 border border-green-200" },
  "at-risk":  { label: "At Risk",  className: "bg-amber-50 text-amber-700 border border-amber-200" },
  "behind":   { label: "Behind",   className: "bg-red-50 text-red-700 border border-red-200" },
  "achieved": { label: "Achieved", className: "bg-blue-50 text-blue-700 border border-blue-200" },
};

const STATUS_SORT: Record<string, number> = { behind: 0, "at-risk": 1, "on-track": 2, achieved: 3 };

const CATEGORY_STYLE: Record<string, string> = {
  growth:     "bg-blue-50 text-blue-700",
  revenue:    "bg-emerald-50 text-emerald-700",
  awareness:  "bg-purple-50 text-purple-700",
  trust:      "bg-teal-50 text-teal-700",
  community:  "bg-pink-50 text-pink-700",
  engagement: "bg-orange-50 text-orange-700",
};

const ITEM_STATUS_STYLE: Record<string, string> = {
  published:    "bg-green-50 text-green-700",
  "in-progress": "bg-yellow-50 text-yellow-700",
  scheduled:    "bg-blue-50 text-blue-700",
  review:       "bg-purple-50 text-purple-700",
  draft:        "bg-gray-100 text-gray-500",
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  "in-progress": "In Production",
  review: "Review",
  scheduled: "Scheduled",
  published: "Published",
};

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3 shrink-0" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
    </svg>
  );
}

function PlatformIcon({ platform }: { platform?: Platform }) {
  if (platform === "instagram") return <Instagram className="size-3 text-pink-600" />;
  if (platform === "youtube")   return <Youtube className="size-3 text-red-600" />;
  if (platform === "facebook")  return <Facebook className="size-3 text-blue-600" />;
  if (platform === "linkedin")  return <Linkedin className="size-3 text-blue-700" />;
  if (platform === "tiktok")    return <TikTokIcon />;
  return null;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const SHOW_DEFAULT = 3;

export function StepPerformance({ objectives, contentItems, onNavigateToPipeline }: StepPerformanceProps) {
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpandedObjectives((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const itemsWithMetrics = useMemo(
    () => contentItems.filter((i) => i.performanceMetrics),
    [contentItems]
  );

  const publishedCount = useMemo(
    () => contentItems.filter((i) => i.status === "published").length,
    [contentItems]
  );

  const avgEngagement = useMemo(() => {
    if (itemsWithMetrics.length === 0) return 0;
    const sum = itemsWithMetrics.reduce(
      (s, i) => s + (i.performanceMetrics?.engagementRate ?? 0),
      0
    );
    return sum / itemsWithMetrics.length;
  }, [itemsWithMetrics]);

  const totalImpressions = useMemo(
    () => itemsWithMetrics.reduce((s, i) => s + (i.performanceMetrics?.impressions ?? 0), 0),
    [itemsWithMetrics]
  );

  const totalReach = useMemo(
    () => itemsWithMetrics.reduce((s, i) => s + (i.performanceMetrics?.reach ?? 0), 0),
    [itemsWithMetrics]
  );

  const sortedObjectives = useMemo(
    () =>
      [...objectives]
        .filter((o) => o.statement.trim())
        .sort((a, b) => (STATUS_SORT[a.status] ?? 3) - (STATUS_SORT[b.status] ?? 3)),
    [objectives]
  );

  const unlinkedPublished = useMemo(
    () => contentItems.filter((i) => i.status === "published" && !i.objectiveId),
    [contentItems]
  );

  const summaryCards = [
    {
      label: "Content Published",
      value: String(publishedCount),
      sub: "total posts live",
      trend: "+2 vs last period",
      trendUp: true,
      icon: <BarChart3 className="size-4 text-[#d94e33]" />,
      bg: "bg-[#d94e33]/5",
    },
    {
      label: "Avg Engagement Rate",
      value: avgEngagement > 0 ? `${avgEngagement.toFixed(1)}%` : "—",
      sub: "across tracked content",
      trend: "-0.4% vs last period",
      trendUp: false,
      icon: <Zap className="size-4 text-orange-500" />,
      bg: "bg-orange-50",
    },
    {
      label: "Total Impressions",
      value: totalImpressions > 0 ? fmt(totalImpressions) : "—",
      sub: "tracked content only",
      trend: "+12% vs last period",
      trendUp: true,
      icon: <Eye className="size-4 text-purple-500" />,
      bg: "bg-purple-50",
    },
    {
      label: "Total Reach",
      value: totalReach > 0 ? fmt(totalReach) : "—",
      sub: "unique accounts",
      trend: "+8% vs last period",
      trendUp: true,
      icon: <Users className="size-4 text-blue-500" />,
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-none shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-1.5 rounded-lg", card.bg)}>{card.icon}</div>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-[10px] font-medium",
                    card.trendUp ? "text-green-600" : "text-red-500"
                  )}
                >
                  {card.trendUp ? (
                    <TrendingUp className="size-2.5" />
                  ) : (
                    <TrendingDown className="size-2.5" />
                  )}
                  {card.trend}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-gray-900 leading-none mb-1">{card.value}</p>
              <p className="text-xs font-medium text-gray-700">{card.label}</p>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unlinked content callout */}
      {unlinkedPublished.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="size-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-bold">
              {unlinkedPublished.length} published post
              {unlinkedPublished.length !== 1 ? "s are" : " is"} not linked
            </span>{" "}
            to a business objective.{" "}
            {onNavigateToPipeline && (
              <button
                onClick={onNavigateToPipeline}
                className="underline hover:text-amber-800 font-medium"
              >
                View in Pipeline Board
              </button>
            )}
          </p>
        </div>
      )}

      {/* Objective Performance Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-[#d94e33]" />
          <h3 className="text-sm font-bold text-gray-900">Performance by Business Objective</h3>
        </div>

        {sortedObjectives.map((obj) => {
          const linkedItems = contentItems.filter((i) => i.objectiveId === obj.id);
          const progressPct =
            obj.target > 0
              ? Math.min(100, Math.round(((obj.currentValue ?? 0) / obj.target) * 100))
              : 0;
          const isExpanded = expandedObjectives.has(obj.id);
          const displayItems = isExpanded ? linkedItems : linkedItems.slice(0, SHOW_DEFAULT);
          const statusCfg = STATUS_CONFIG[obj.status] ?? STATUS_CONFIG["on-track"];

          const barColor =
            obj.status === "on-track"
              ? "bg-[#d94e33]"
              : obj.status === "at-risk"
              ? "bg-amber-400"
              : obj.status === "behind"
              ? "bg-red-400"
              : "bg-blue-400";

          const accentColor =
            obj.status === "on-track"
              ? "bg-[#d94e33]"
              : obj.status === "at-risk"
              ? "bg-amber-400"
              : obj.status === "behind"
              ? "bg-red-400"
              : "bg-blue-400";

          return (
            <Card key={obj.id} className="border-none shadow-sm bg-white overflow-hidden">
              <div className={cn("h-1", accentColor)} />
              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[#d94e33]/5 shrink-0 mt-0.5">
                    <Target className="size-3.5 text-[#d94e33]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold capitalize",
                          CATEGORY_STYLE[obj.category] ?? "bg-gray-100 text-gray-600"
                        )}
                      >
                        {obj.category}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          statusCfg.className
                        )}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{obj.statement}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {obj.currentValue !== undefined ? fmt(obj.currentValue) : "—"} /{" "}
                      {fmt(obj.target)} {obj.unit}
                    </span>
                    <span className="font-bold text-gray-700">{progressPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", barColor)}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Target: {obj.timeframe}</p>
                </div>

                {/* Linked content */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Content contributing ({linkedItems.length})
                  </p>
                  {linkedItems.length === 0 ? (
                    <div className="py-4 text-center rounded-lg bg-gray-50">
                      <p className="text-xs text-muted-foreground">
                        No published content linked to this objective yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {displayItems.map((item) => {
                        const m = item.performanceMetrics;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="shrink-0">
                              <PlatformIcon platform={item.platform} />
                            </div>
                            <p className="text-xs font-medium text-gray-900 flex-1 min-w-0 truncate">
                              {item.title}
                            </p>
                            <span
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
                                ITEM_STATUS_STYLE[item.status] ?? "bg-gray-100 text-gray-500"
                              )}
                            >
                              {ITEM_STATUS_LABEL[item.status] ?? item.status}
                            </span>
                            {m && (
                              <div className="hidden sm:flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
                                <span className="flex items-center gap-0.5">
                                  <Eye className="size-2.5" />
                                  {fmt(m.impressions)}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Zap className="size-2.5" />
                                  {m.engagementRate.toFixed(1)}%
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <BookmarkCheck className="size-2.5" />
                                  {fmt(m.saves)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {linkedItems.length > SHOW_DEFAULT && (
                        <button
                          onClick={() => toggleExpand(obj.id)}
                          className="flex items-center gap-1 text-xs text-[#d94e33] hover:underline w-full justify-center py-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="size-3" /> Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="size-3" /> Show all {linkedItems.length} items
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
