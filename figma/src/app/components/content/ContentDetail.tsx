import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

import React from "react";
import {
  ChevronLeft,
  Lightbulb,
  PenTool,
  Send,
  Instagram,
  Youtube,
  ExternalLink,
  Clock,
  CalendarDays,
  Hash,
  FileText,
  Link,
  Edit3,
  Trash2,
  Copy,
  ChevronRight,
  Paperclip,
  Users,
  Layers,
  ArrowRight,
  Facebook,
  Linkedin,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { ContentItem, ContentPillar, AudienceSegment, Platform, ContentStatus } from "./types";
import { STAGE_CONFIG, STATUS_CONFIG, PLATFORM_CONFIG, PLATFORM_CONTENT_TYPES } from "./types";

interface ContentDetailProps {
  item: ContentItem;
  pillars: ContentPillar[];
  segments: AudienceSegment[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: ContentStatus) => void;
  onAdvanceStage: () => void;
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ContentDetail({
  item,
  pillars,
  segments,
  onBack,
  onEdit,
  onDelete,
  onUpdateStatus,
  onAdvanceStage,
}: ContentDetailProps) {
  const stageConf = STAGE_CONFIG[item.stage];
  const statusConf = STATUS_CONFIG[item.status];
  const pillarNames = item.pillarIds.map((id) => pillars.find((p) => p.id === id)).filter(Boolean) as ContentPillar[];
  const segmentNames = item.segmentIds.map((id) => segments.find((s) => s.id === id)).filter(Boolean) as AudienceSegment[];
  const nextStage = item.stage === "idea" ? "concept" : item.stage === "concept" ? "post" : null;

  const handleCopy = async () => {
    const text = [
      `Title: ${item.title}`,
      `Stage: ${stageConf.label}`,
      `Status: ${statusConf.label}`,
      item.hook && `Hook: ${item.hook}`,
      item.platform && `Platform: ${PLATFORM_CONFIG[item.platform].label}`,
      item.description && `Description: ${item.description}`,
      item.script && `\nScript:\n${item.script}`,
      item.caption && `\nCaption:\n${item.caption}`,
      item.hashtags && `\nHashtags: ${item.hashtags.join(" ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    
    const success = await copyToClipboard(text);
    if (success) {
      toast.success("Content copied to clipboard");
    } else {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground mb-3 -ml-2">
            <ChevronLeft className="size-4" /> Back to Library
          </Button>
          <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] font-bold gap-1 border", stageConf.color)}>
              {item.stage === "idea" ? (
                <Lightbulb className="size-3" />
              ) : item.stage === "concept" ? (
                <PenTool className="size-3" />
              ) : (
                <Send className="size-3" />
              )}
              {stageConf.label}
            </Badge>
            <Select value={item.status} onValueChange={(v) => onUpdateStatus(v as ContentStatus)}>
              <SelectTrigger className="h-7 w-auto border-none bg-transparent p-0 text-xs font-bold gap-1.5">
                <span className={cn("size-2 rounded-full", statusConf.dotColor)} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as ContentStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", STATUS_CONFIG[s].dotColor)} />
                      {STATUS_CONFIG[s].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {item.platform && (
              <div className="flex items-center gap-1.5">
                <PlatformIcon platform={item.platform} />
                <span className="text-xs text-gray-600">{PLATFORM_CONFIG[item.platform].label}</span>
                {item.contentType && (
                  <span className="text-xs text-muted-foreground">
                    · {PLATFORM_CONTENT_TYPES[item.platform].find((c) => c.value === item.contentType)?.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-8">
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleCopy}>
            <Copy className="size-3" /> Copy
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onEdit}>
            <Edit3 className="size-3" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3" /> Delete
          </Button>
          {nextStage && (
            <Button size="sm" className="h-8 bg-[#d94e33] hover:bg-[#c4452d] gap-1" onClick={onAdvanceStage}>
              Advance to {STAGE_CONFIG[nextStage].label}
              <ArrowRight className="size-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {item.hook && (
            <Card className="border-gray-100">
              <CardContent className="p-4">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Hook
                </Label>
                <p className="text-sm text-gray-800 italic">"{item.hook}"</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                Description
              </Label>
              <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
            </CardContent>
          </Card>

          {item.script && (
            <Card className="border-gray-100">
              <CardContent className="p-4">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Script
                </Label>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg leading-relaxed">
                  {item.script}
                </pre>
              </CardContent>
            </Card>
          )}

          {item.textOverlay && (
            <Card className="border-gray-100">
              <CardContent className="p-4">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Text Overlay
                </Label>
                <p className="text-sm text-gray-700">{item.textOverlay}</p>
              </CardContent>
            </Card>
          )}

          {item.caption && (
            <Card className="border-gray-100">
              <CardContent className="p-4">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Caption
                </Label>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.caption}</p>
              </CardContent>
            </Card>
          )}

          {item.hashtags && item.hashtags.length > 0 && (
            <Card className="border-gray-100">
              <CardContent className="p-4">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Hashtags
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {item.hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-gray-100">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                  <Layers className="size-3" /> Pillars
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {pillarNames.map((p) => (
                    <Badge
                      key={p.id}
                      variant="outline"
                      className="text-[10px] font-bold"
                      style={{ borderColor: p.color + "40", color: p.color, backgroundColor: p.color + "10" }}
                    >
                      {p.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                  <Users className="size-3" /> Audience
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {segmentNames.map((s) => (
                    <Badge key={s.id} variant="outline" className="text-[10px] font-bold text-blue-600 bg-blue-50 border-blue-200">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {item.sourceUrl && (
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                    <Link className="size-3" /> Source
                  </Label>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#d94e33] hover:underline flex items-center gap-1 truncate"
                  >
                    {item.sourceUrl.replace(/https?:\/\//, "").slice(0, 40)}...
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              )}

              {item.attachments && item.attachments.length > 0 && (
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                    <Paperclip className="size-3" /> Attachments
                  </Label>
                  {item.attachments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-xs">
                      <FileText className="size-3.5 text-gray-500" />
                      <span className="text-gray-700 font-medium">{a.name}</span>
                      <span className="text-muted-foreground ml-auto">{a.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4 space-y-3">
              {item.scheduledDate && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Publish Date</div>
                    <div className="text-xs font-bold text-gray-900">
                      {new Date(item.scheduledDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {item.scheduledTime && ` at ${item.scheduledTime}`}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Created</div>
                  <div className="text-xs text-gray-700">{formatDate(item.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Updated</div>
                  <div className="text-xs text-gray-700">{formatDate(item.updatedAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stage Progress */}
          <Card className="border-gray-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#d94e33] to-[#f26b4d]" />
            <CardContent className="p-4">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                Content Journey
              </Label>
              <div className="space-y-3">
                {(["idea", "concept", "post"] as const).map((stage, idx) => {
                  const conf = STAGE_CONFIG[stage];
                  const isActive = item.stage === stage;
                  const isCompleted = (["idea", "concept", "post"].indexOf(item.stage)) > idx;
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-7 rounded-full flex items-center justify-center text-white text-xs font-bold",
                          isActive
                            ? "bg-[#d94e33]"
                            : isCompleted
                            ? "bg-[#d94e33]/70"
                            : "bg-gray-200"
                        )}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span className={cn("text-xs font-bold", isActive ? "text-[#d94e33]" : isCompleted ? "text-gray-600" : "text-gray-400")}>
                        {conf.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}