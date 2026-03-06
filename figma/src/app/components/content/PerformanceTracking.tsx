import React, { useState, useMemo, useId } from "react";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  Instagram,
  Youtube,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Target,
  Sparkles,
  Loader2,
  ThumbsUp,
  Users,
  Zap,
  RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import type { ContentItem, ContentPillar, Platform } from "./types";
import { STAGE_CONFIG, STATUS_CONFIG, PLATFORM_CONFIG } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PerformanceTrackingProps {
  items: ContentItem[];
  pillars: ContentPillar[];
  onSelectItem: (id: string) => void;
}

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

const engagementData = [
  { month: "Sep", views: 12400, likes: 890, comments: 234, shares: 156 },
  { month: "Oct", views: 18200, likes: 1240, comments: 412, shares: 289 },
  { month: "Nov", views: 15800, likes: 1050, comments: 356, shares: 198 },
  { month: "Dec", views: 22100, likes: 1680, comments: 523, shares: 345 },
  { month: "Jan", views: 28400, likes: 2100, comments: 678, shares: 456 },
  { month: "Feb", views: 34200, likes: 2540, comments: 812, shares: 567 },
];

const platformPerformance = [
  { platform: "Instagram" as const, followers: "12.4K", growth: "+8.2%", engagement: "4.7%", positive: true, icon: "instagram" as Platform },
  { platform: "YouTube" as const, followers: "8.1K", growth: "+12.5%", engagement: "6.2%", positive: true, icon: "youtube" as Platform },
  { platform: "TikTok" as const, followers: "22.8K", growth: "+18.9%", engagement: "8.1%", positive: true, icon: "tiktok" as Platform },
];

type PerfView = "dashboard" | "content" | "recommendations";

export function PerformanceTracking({
  items,
  pillars,
  onSelectItem,
}: PerformanceTrackingProps) {
  const [activeView, setActiveView] = useState<PerfView>("dashboard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<{ title: string; description: string; priority: string; category: string }[]>([]);
  const uid = useId();
  const gradientId = `viewsGrad-${uid.replace(/:/g, "")}`;

  const publishedItems = useMemo(
    () => items.filter((i) => i.status === "published"),
    [items]
  );

  const totalMetrics = useMemo(() => {
    let views = 0, likes = 0, comments = 0, shares = 0;
    publishedItems.forEach((item) => {
      if (item.metrics) {
        views += item.metrics.views;
        likes += item.metrics.likes;
        comments += item.metrics.comments;
        shares += item.metrics.shares;
      }
    });
    return { views, likes, comments, shares };
  }, [publishedItems]);

  const stageCount = {
    idea: items.filter((i) => i.stage === "idea").length,
    concept: items.filter((i) => i.stage === "concept").length,
    post: items.filter((i) => i.stage === "post").length,
  };

  const statusCount = {
    draft: items.filter((i) => i.status === "draft").length,
    "in-progress": items.filter((i) => i.status === "in-progress").length,
    review: items.filter((i) => i.status === "review").length,
    scheduled: items.filter((i) => i.status === "scheduled").length,
    published: items.filter((i) => i.status === "published").length,
  };

  const pieData = [
    { name: "Ideas", value: stageCount.idea, color: "#3b82f6" },
    { name: "Concepts", value: stageCount.concept, color: "#f59e0b" },
    { name: "Posts", value: stageCount.post, color: "#10b981" },
  ];

  const pillarData = pillars.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name,
    count: items.filter((i) => i.pillarIds.includes(p.id)).length,
    color: p.color,
  }));

  const handleGetRecommendations = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiRecommendations([
        {
          title: "Increase TikTok posting frequency",
          description: "Your TikTok engagement rate (8.1%) is the highest across platforms, but you're only posting 2x/week. Competitors like ViralVault post 5x/week. Increasing to 4x/week could yield 40-60% more reach.",
          priority: "High",
          category: "Frequency",
        },
        {
          title: "Repurpose YouTube content to Instagram Reels",
          description: "Your YouTube Shorts content performs well. Repurposing the top-performing clips as Instagram Reels could capture the 12.4K Instagram audience with minimal extra effort.",
          priority: "High",
          category: "Repurpose",
        },
        {
          title: "Post at peak times for Engineers segment",
          description: "Analysis shows Engineers are most active Tuesday 10AM and Thursday 9AM. Schedule your technical content during these windows for 25-35% higher engagement.",
          priority: "Medium",
          category: "Timing",
        },
        {
          title: "Add more Public Safety content",
          description: "Your Public Safety content (I-35 story) has the highest engagement rate at 12.1%. Consider increasing this pillar from 1x/week to 2x/week to capitalize on audience interest.",
          priority: "Medium",
          category: "Content Mix",
        },
        {
          title: "Test carousel format on Instagram",
          description: "Competitor TechForward sees 4.5% engagement on carousels. Your carousel content is in-progress. Prioritize completing '5 Tools Every SMM Needs' to test this format.",
          priority: "Low",
          category: "Format",
        },
      ]);
      toast.success("AI analysis complete!");
    }, 2500);
  };

  const views = [
    { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { id: "content" as const, label: "Content Performance", icon: TrendingUp },
    { id: "recommendations" as const, label: "AI Recommendations", icon: Sparkles },
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

      {/* Dashboard */}
      {activeView === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Content", value: items.length.toString(), icon: FileText, change: "+4 this week", positive: true, color: "text-blue-600 bg-blue-50" },
              { label: "Published", value: statusCount.published.toString(), icon: CheckCircle, change: "2 this month", positive: true, color: "text-green-600 bg-green-50" },
              { label: "Scheduled", value: statusCount.scheduled.toString(), icon: Clock, change: "Next: Feb 25", positive: true, color: "text-pink-600 bg-pink-50" },
              { label: "Total Reach", value: totalMetrics.views > 0 ? `${(totalMetrics.views / 1000).toFixed(1)}K` : "43.3K", icon: Eye, change: "+24% vs last month", positive: true, color: "text-[#d94e33] bg-[#d94e33]/10" },
            ].map((stat) => (
              <Card key={stat.label} className="border-gray-100">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2 rounded-lg", stat.color)}>
                      <stat.icon className="size-4" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      {stat.positive ? (
                        <ArrowUpRight className="size-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="size-3 text-red-500" />
                      )}
                      <span className={stat.positive ? "text-green-600" : "text-red-600"}>{stat.change}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-gray-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="size-4 text-[#d94e33]" /> Engagement Trend
                  </CardTitle>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#d94e33]" /> Views</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Likes</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" /> Comments</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={engagementData}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d94e33" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#d94e33" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                    <Area type="monotone" dataKey="views" stroke="#d94e33" fill={`url(#${gradientId})`} strokeWidth={2} />
                    <Area type="monotone" dataKey="likes" stroke="#3b82f6" fill="transparent" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="comments" stroke="#10b981" fill="transparent" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Target className="size-4 text-[#d94e33]" /> Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <PieChart width={160} height={160}>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  </PieChart>
                </div>
                <div className="space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="size-4 text-[#d94e33]" /> By Pillar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={pillarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                      {pillarData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Share2 className="size-4 text-[#d94e33]" /> Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {platformPerformance.map((p) => {
                  const Icon = p.icon === "instagram" ? Instagram : p.icon === "youtube" ? Youtube : TikTokIcon;
                  return (
                    <div key={p.platform} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/50 border border-gray-100">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        p.icon === "instagram" ? "bg-pink-50 text-pink-600" :
                        p.icon === "youtube" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-900"
                      )}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold">{p.platform}</div>
                        <div className="text-[10px] text-muted-foreground">{p.followers} followers</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-green-600">{p.growth}</div>
                        <div className="text-[10px] text-muted-foreground">{p.engagement} eng.</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card className="border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Zap className="size-4 text-[#d94e33]" /> Engagement Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Total Views", value: "43.3K", icon: Eye, color: "text-blue-600 bg-blue-50" },
                  { label: "Total Likes", value: "5.7K", icon: Heart, color: "text-pink-600 bg-pink-50" },
                  { label: "Comments", value: "1.8K", icon: MessageSquare, color: "text-green-600 bg-green-50" },
                  { label: "Shares", value: "1.3K", icon: Share2, color: "text-purple-600 bg-purple-50" },
                ].map((metric) => (
                  <div key={metric.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/50 border border-gray-100">
                    <div className={cn("p-1.5 rounded-lg", metric.color)}>
                      <metric.icon className="size-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-muted-foreground">{metric.label}</div>
                    </div>
                    <div className="text-xs font-bold">{metric.value}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Content Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(Object.entries(statusCount) as [string, number][]).map(([key, count]) => {
                  const config = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG];
                  return (
                    <div key={key} className="text-center p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className={cn("size-2 rounded-full", config.dotColor)} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{config.label}</span>
                      </div>
                      <div className="text-xl font-bold">{count}</div>
                      <Progress value={items.length > 0 ? (count / items.length) * 100 : 0} className="h-1 mt-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Performance */}
      {activeView === "content" && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">{publishedItems.length} published items</div>
          {publishedItems.length === 0 ? (
            <Card className="border-gray-100">
              <CardContent className="py-16 text-center">
                <TrendingUp className="size-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-bold text-gray-700">No published content yet</p>
                <p className="text-xs text-muted-foreground mt-1">Publish content to see performance metrics here.</p>
              </CardContent>
            </Card>
          ) : (
            publishedItems.map((item, idx) => {
              const metrics = item.metrics || { views: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0, reach: 0 };
              return (
                <Card key={item.id} className="border-gray-100 hover:border-[#d94e33]/30 transition-colors cursor-pointer" onClick={() => onSelectItem(item.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-xl font-bold text-[#d94e33]/30">#{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.platform && (
                            <Badge variant="outline" className={cn("text-[9px] border", PLATFORM_CONFIG[item.platform].color, PLATFORM_CONFIG[item.platform].bgColor)}>
                              {PLATFORM_CONFIG[item.platform].label}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] font-bold text-green-700 bg-green-50 border-green-200">
                            Published
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Eye className="size-3" /> {metrics.views.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Heart className="size-3" /> {metrics.likes.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MessageSquare className="size-3" /> {metrics.comments.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Share2 className="size-3" /> {metrics.shares.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><TrendingUp className="size-3" /> {metrics.engagementRate}% eng.</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* AI Recommendations */}
      {activeView === "recommendations" && (
        <div className="space-y-4">
          <Button
            size="sm"
            className="bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 h-9"
            onClick={handleGetRecommendations}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            Generate AI Recommendations
          </Button>

          {isAnalyzing && (
            <Card className="border-gray-100">
              <CardContent className="py-16 text-center">
                <Loader2 className="size-8 text-[#d94e33] animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700">Analyzing your content performance...</p>
                <p className="text-xs text-muted-foreground mt-1">Reviewing engagement data, audience patterns, and competitor activity</p>
              </CardContent>
            </Card>
          )}

          {!isAnalyzing && aiRecommendations.length > 0 && (
            <div className="space-y-3">
              {aiRecommendations.map((rec, idx) => (
                <Card key={idx} className={cn(
                  "border-l-4",
                  rec.priority === "High" ? "border-l-red-400" :
                  rec.priority === "Medium" ? "border-l-amber-400" :
                  "border-l-blue-400",
                  "border-gray-100"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        rec.priority === "High" ? "bg-red-50" :
                        rec.priority === "Medium" ? "bg-amber-50" : "bg-blue-50"
                      )}>
                        <Sparkles className={cn(
                          "size-4",
                          rec.priority === "High" ? "text-red-500" :
                          rec.priority === "Medium" ? "text-amber-500" : "text-blue-500"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-900">{rec.title}</h4>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold",
                            rec.priority === "High" ? "text-red-700 bg-red-50 border-red-200" :
                            rec.priority === "Medium" ? "text-amber-700 bg-amber-50 border-amber-200" :
                            "text-blue-700 bg-blue-50 border-blue-200"
                          )}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] text-gray-500 border-gray-200">
                            {rec.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{rec.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isAnalyzing && aiRecommendations.length === 0 && (
            <Card className="border-gray-100">
              <CardContent className="py-16 text-center">
                <Sparkles className="size-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-bold text-gray-700">No recommendations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Generate AI Recommendations" to get data-driven insights for your content strategy.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}