import React, { useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  Sparkles,
  Loader2,
  MessageSquare,
  Instagram,
  Youtube,
  Send,
  Eye,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  User,
  Facebook,
  Linkedin,
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
import type { ContentItem, ContentPillar, AudienceSegment, ContentStatus, Platform } from "./types";
import { STATUS_CONFIG, STAGE_CONFIG, PLATFORM_CONFIG, PLATFORM_CONTENT_TYPES } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewSchedulingProps {
  items: ContentItem[];
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onUpdateItem: (item: ContentItem) => void;
  onSelectItem: (id: string) => void;
}

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

function PlatformIcon({ platform }: { platform?: Platform }) {
  if (!platform) return null;
  if (platform === "instagram") return <Instagram className="size-4 text-pink-600" />;
  if (platform === "youtube") return <Youtube className="size-4 text-red-600" />;
  if (platform === "facebook") return <Facebook className="size-4 text-blue-600" />;
  if (platform === "linkedin") return <Linkedin className="size-4 text-blue-700" />;
  if (platform === "tiktok") return <TikTokIcon />;
  return null;
}

type ReviewView = "pending" | "scheduled";

// AI recommended times
const AI_RECOMMENDED_TIMES: { day: string; time: string; reason: string; score: number }[] = [
  { day: "Tuesday", time: "10:00 AM", reason: "Peak activity for Engineers & Founders", score: 95 },
  { day: "Thursday", time: "3:00 PM", reason: "High engagement for Social Media Managers", score: 91 },
  { day: "Wednesday", time: "2:00 PM", reason: "Cross-segment overlap - maximum reach", score: 88 },
  { day: "Saturday", time: "10:00 AM", reason: "Weekend browsing peak for Tech Enthusiasts", score: 82 },
  { day: "Monday", time: "8:00 AM", reason: "Start-of-week content consumption spike", score: 79 },
];

export function ReviewScheduling({
  items,
  pillars,
  segments,
  onUpdateItem,
  onSelectItem,
}: ReviewSchedulingProps) {
  const [activeView, setActiveView] = useState<ReviewView>("pending");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [schedulingItem, setSchedulingItem] = useState<ContentItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAITimes, setShowAITimes] = useState(false);

  // Items pending review
  const pendingItems = useMemo(
    () => items.filter((i) => i.status === "review").sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [items]
  );

  // Scheduled items
  const scheduledItems = useMemo(
    () => items.filter((i) => i.status === "scheduled").sort((a, b) => {
      if (a.scheduledDate && b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate);
      return 0;
    }),
    [items]
  );

  const handleApprove = (item: ContentItem) => {
    setSchedulingItem(item);
    setReviewNotes("");
    setScheduleDate("");
    setScheduleTime("");
    setShowAITimes(false);
    setShowScheduleDialog(true);
  };

  const handleReject = (item: ContentItem) => {
    const updated: ContentItem = {
      ...item,
      status: "in-progress",
      updatedAt: new Date().toISOString(),
      reviewNotes: "Sent back for revisions",
    };
    onUpdateItem(updated);
    toast.success("Content sent back for revisions");
  };

  const handleSchedule = () => {
    if (!schedulingItem) return;
    if (!scheduleDate || !scheduleTime) {
      toast.error("Please select a date and time");
      return;
    }
    const updated: ContentItem = {
      ...schedulingItem,
      status: "scheduled" as ContentStatus,
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
      reviewNotes: reviewNotes || undefined,
      approvedBy: "Brett Lewis",
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateItem(updated);
    setShowScheduleDialog(false);
    toast.success("Content approved and scheduled!");
  };

  const handlePublishNow = (item: ContentItem) => {
    const updated: ContentItem = {
      ...item,
      status: "published" as ContentStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateItem(updated);
    toast.success("Content published!");
  };

  const handleGetAIRecommendations = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowAITimes(true);
      toast.success("AI analyzed optimal posting times!");
    }, 1500);
  };

  const handleUseRecommendedTime = (time: typeof AI_RECOMMENDED_TIMES[0]) => {
    // Map day name to next occurrence
    const dayMap: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const targetDay = dayMap[time.day];
    const now = new Date(2026, 1, 23); // Feb 23, 2026
    const currentDay = now.getDay();
    const daysUntil = ((targetDay - currentDay + 7) % 7) || 7;
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysUntil);

    const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;
    const [hourStr, period] = time.time.split(" ");
    const [hours] = hourStr.split(":");
    let h = parseInt(hours);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const timeStr = `${String(h).padStart(2, "0")}:00`;

    setScheduleDate(dateStr);
    setScheduleTime(timeStr);
    toast.success(`Set to ${time.day} ${time.time}`);
  };

  const views = [
    { id: "pending" as const, label: "Pending Review", icon: ShieldCheck, count: pendingItems.length },
    { id: "scheduled" as const, label: "Scheduled", icon: CalendarDays, count: scheduledItems.length },
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
              {v.count > 0 && (
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-[#d94e33] text-white" : "bg-gray-200 text-gray-600"
                )}>
                  {v.count}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d94e33] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Pending Review */}
      {activeView === "pending" && (
        <div className="space-y-3">
          {pendingItems.length === 0 ? (
            <Card className="border-gray-100">
              <CardContent className="py-16 text-center">
                <CheckCircle className="size-8 mx-auto mb-3 text-green-300" />
                <p className="text-sm font-bold text-gray-700">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">No content pending review right now.</p>
              </CardContent>
            </Card>
          ) : (
            pendingItems.map((item) => {
              const pillarNames = item.pillarIds.map((id) => pillars.find((p) => p.id === id)).filter(Boolean);
              return (
                <Card key={item.id} className="border-gray-100 border-l-4 border-l-purple-400">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-[9px] font-bold gap-1 border bg-purple-100 text-purple-700 border-purple-200">
                            <ShieldCheck className="size-3" /> Pending Review
                          </Badge>
                          {item.platform && (
                            <div className="flex items-center gap-1">
                              <PlatformIcon platform={item.platform} />
                              <span className="text-[10px] text-muted-foreground">{PLATFORM_CONFIG[item.platform].label}</span>
                              {item.contentType && (
                                <span className="text-[10px] text-muted-foreground">
                                  / {PLATFORM_CONTENT_TYPES[item.platform].find((c) => c.value === item.contentType)?.label}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <h4
                          className="text-sm font-bold text-gray-900 hover:text-[#d94e33] cursor-pointer transition-colors"
                          onClick={() => onSelectItem(item.id)}
                        >
                          {item.title}
                        </h4>
                        {item.hook && (
                          <p className="text-xs text-muted-foreground italic mt-1">"{item.hook}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {pillarNames.map((p) => p && (
                            <span key={p.id} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: p.color + "15", color: p.color }}>
                              {p.name}
                            </span>
                          ))}
                        </div>
                        {/* Preview sections */}
                        {item.script && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Script Preview</span>
                            <p className="text-[10px] text-gray-600 mt-1 line-clamp-3 font-mono whitespace-pre-wrap">{item.script}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="h-8 bg-green-600 hover:bg-green-700 gap-1.5"
                          onClick={() => handleApprove(item)}
                        >
                          <CheckCircle className="size-3.5" /> Approve & Schedule
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => handleReject(item)}
                        >
                          <XCircle className="size-3.5" /> Request Changes
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 text-muted-foreground"
                          onClick={() => onSelectItem(item.id)}
                        >
                          <Eye className="size-3.5" /> View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Scheduled */}
      {activeView === "scheduled" && (
        <div className="space-y-3">
          {scheduledItems.length === 0 ? (
            <Card className="border-gray-100">
              <CardContent className="py-16 text-center">
                <CalendarDays className="size-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-bold text-gray-700">No scheduled content</p>
                <p className="text-xs text-muted-foreground mt-1">Approve and schedule content from the Pending Review tab.</p>
              </CardContent>
            </Card>
          ) : (
            scheduledItems.map((item) => (
              <Card key={item.id} className="border-gray-100 border-l-4 border-l-pink-400">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center shrink-0 w-16">
                      <div className="text-lg font-bold text-[#d94e33]">
                        {item.scheduledDate && new Date(item.scheduledDate).getDate()}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {item.scheduledDate && new Date(item.scheduledDate).toLocaleDateString("en-US", { month: "short" })}
                      </div>
                      <div className="text-[10px] text-gray-500">{item.scheduledTime}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.platform && <PlatformIcon platform={item.platform} />}
                        <span className="text-[10px] text-muted-foreground">
                          {item.platform && PLATFORM_CONFIG[item.platform].label}
                          {item.contentType && ` / ${PLATFORM_CONTENT_TYPES[item.platform!].find((c) => c.value === item.contentType)?.label}`}
                        </span>
                      </div>
                      <h4
                        className="text-xs font-bold text-gray-900 hover:text-[#d94e33] cursor-pointer transition-colors truncate"
                        onClick={() => onSelectItem(item.id)}
                      >
                        {item.title}
                      </h4>
                      {item.approvedBy && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="size-3 text-green-500" />
                          <span className="text-[10px] text-green-600">Approved by {item.approvedBy}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="h-8 bg-[#d94e33] hover:bg-[#c4452d] gap-1.5 shrink-0"
                      onClick={() => handlePublishNow(item)}
                    >
                      <Send className="size-3.5" /> Publish Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve & Schedule</DialogTitle>
            <DialogDescription>
              Add any notes about this approval and select a date and time to schedule the content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {schedulingItem && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs font-bold">{schedulingItem.title}</p>
                {schedulingItem.platform && (
                  <div className="flex items-center gap-1 mt-1">
                    <PlatformIcon platform={schedulingItem.platform} />
                    <span className="text-[10px] text-muted-foreground">{PLATFORM_CONFIG[schedulingItem.platform].label}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Review Notes (optional)
              </Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="min-h-[60px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="size-3" /> Date *
                </Label>
                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> Time *
                </Label>
                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-9" />
              </div>
            </div>

            {/* AI Recommended Times */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 gap-1.5 text-[#d94e33] border-[#d94e33]/20 hover:bg-[#d94e33]/5"
                onClick={handleGetAIRecommendations}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                AI Recommend Best Times
              </Button>

              {showAITimes && (
                <div className="space-y-1.5 p-3 rounded-lg bg-gradient-to-br from-[#d94e33]/5 to-orange-50 border border-[#d94e33]/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#d94e33] flex items-center gap-1">
                    <Sparkles className="size-3" /> Optimal Posting Times
                  </span>
                  {AI_RECOMMENDED_TIMES.map((rt, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100 hover:border-[#d94e33]/30 transition-colors text-left"
                      onClick={() => handleUseRecommendedTime(rt)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold">{rt.day} at {rt.time}</div>
                        <div className="text-[10px] text-muted-foreground">{rt.reason}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          rt.score >= 90 ? "bg-green-100 text-green-700" :
                          rt.score >= 80 ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {rt.score}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 gap-1.5" onClick={handleSchedule}>
              <CheckCircle className="size-3.5" /> Approve & Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}