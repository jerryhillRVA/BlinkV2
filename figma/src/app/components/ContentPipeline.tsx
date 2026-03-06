import React, { useState, useMemo } from "react";
import {
  BarChart3,
  RefreshCcw,
  Layout,
  Clock,
  PlayCircle,
  CheckCircle,
  FileText,
  Package,
  Eye,
  Zap,
  ChevronDown,
  Mail,
  Lightbulb,
  PenTool,
  ShieldCheck,
  Send,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import type { ContentItem, Platform } from "./content/types";
import { MOCK_CONTENT, PLATFORM_CONFIG } from "./content/types";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.25 8.25 0 0 0 4.81 1.54V6.97a4.83 4.83 0 0 1-1.05-.28z" />
  </svg>
);

function PlatformIcon({ platform }: { platform?: Platform }) {
  if (!platform) return null;
  if (platform === "instagram") return <Instagram className="size-3.5 text-pink-600" />;
  if (platform === "youtube") return <Youtube className="size-3.5 text-red-600" />;
  if (platform === "facebook") return <Facebook className="size-3.5 text-blue-600" />;
  if (platform === "linkedin") return <Linkedin className="size-3.5 text-blue-700" />;
  return <TikTokIcon />;
}

export function ContentPipeline() {
  const [items] = useState<ContentItem[]>(() => {
    const stored = loadFromStorage("blink_content_items", MOCK_CONTENT);
    // Filter out old unrelated content items (c1-c12)
    const oldContentIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12"];
    return stored.filter((i) => !oldContentIds.includes(i.id));
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);

  // Get unique content types from all items
  const availableContentTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach(item => {
      if (item.contentType) types.add(item.contentType);
    });
    return Array.from(types).sort();
  }, [items]);

  // Filter items by selected platforms and content types
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter(item => item.platform && selectedPlatforms.includes(item.platform));
    }
    
    if (selectedContentTypes.length > 0) {
      filtered = filtered.filter(item => item.contentType && selectedContentTypes.includes(item.contentType));
    }
    
    return filtered;
  }, [items, selectedPlatforms, selectedContentTypes]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const toggleContentType = (contentType: string) => {
    setSelectedContentTypes(prev =>
      prev.includes(contentType)
        ? prev.filter(ct => ct !== contentType)
        : [...prev, contentType]
    );
  };

  const clearFilters = () => {
    setSelectedPlatforms([]);
    setSelectedContentTypes([]);
  };

  const availablePlatforms: Platform[] = ["instagram", "tiktok", "youtube", "facebook", "linkedin"];

  const platformIcons: Record<Platform, React.ReactNode> = {
    instagram: <Instagram className="size-4" />,
    tiktok: <TikTokIcon />,
    youtube: <Youtube className="size-4" />,
    facebook: <Facebook className="size-4" />,
    linkedin: <Linkedin className="size-4" />,
    tbd: null,
  };

  const platformColors: Record<Platform, string> = {
    instagram: "border-pink-500 bg-pink-50 text-pink-700 hover:bg-pink-100",
    tiktok: "border-gray-800 bg-gray-50 text-gray-800 hover:bg-gray-100",
    youtube: "border-red-600 bg-red-50 text-red-700 hover:bg-red-100",
    facebook: "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100",
    linkedin: "border-blue-700 bg-blue-50 text-blue-800 hover:bg-blue-100",
    tbd: "",
  };

  const platformLabels: Record<Platform, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    tbd: "TBD",
  };

  const columns = [
    { id: "idea", title: "Ideas", filter: (i: ContentItem) => i.stage === "idea", color: "border-l-blue-400 bg-blue-50/30", icon: <Lightbulb className="size-4 text-blue-500" /> },
    { id: "concept", title: "In Production", filter: (i: ContentItem) => i.stage === "concept" || (i.stage === "idea" && i.status === "in-progress"), color: "border-l-yellow-400 bg-yellow-50/30", icon: <PenTool className="size-4 text-yellow-500" /> },
    { id: "review", title: "In Review", filter: (i: ContentItem) => i.status === "review", color: "border-l-purple-400 bg-purple-50/30", icon: <ShieldCheck className="size-4 text-purple-500" /> },
    { id: "scheduled", title: "Scheduled", filter: (i: ContentItem) => i.status === "scheduled", color: "border-l-pink-400 bg-pink-50/30", icon: <Clock className="size-4 text-pink-500" /> },
    { id: "published", title: "Published", filter: (i: ContentItem) => i.status === "published", color: "border-l-green-400 bg-green-50/30", icon: <CheckCircle className="size-4 text-green-500" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-6 text-[#d94e33]" />
            <h1 className="text-2xl font-bold">Content Pipeline</h1>
          </div>
          <p className="text-muted-foreground">Kanban board view of all content in the production pipeline</p>
        </div>
      </div>

      {/* Platform Filter */}
      <Card className="border-gray-100 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Filter by Platform:</span>
            {availablePlatforms.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform);
              return (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all
                    ${isSelected 
                      ? "border-[#d94e33] bg-gradient-to-r from-[#d94e33] to-[#f26b4d] text-white shadow-md"
                      : platformColors[platform]
                    }
                  `}
                >
                  {platformIcons[platform]}
                  {platformLabels[platform]}
                  {isSelected && (
                    <span className="ml-1 flex items-center justify-center size-4 rounded-full bg-white/20">
                      <CheckCircle className="size-3" />
                    </span>
                  )}
                </button>
              );
            })}
            {selectedPlatforms.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-[#d94e33] h-7"
              >
                Clear all
              </Button>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              {selectedPlatforms.length > 0 || selectedContentTypes.length > 0
                ? `Showing ${filteredItems.length} of ${items.length} items`
                : `${items.length} total items`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Type Filter */}
      <Card className="border-gray-100 bg-white">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Filter by Content Type:</span>
            {availableContentTypes.map((contentType) => {
              const isSelected = selectedContentTypes.includes(contentType);
              return (
                <button
                  key={contentType}
                  onClick={() => toggleContentType(contentType)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all
                    ${isSelected 
                      ? "border-[#d94e33] bg-gradient-to-r from-[#d94e33] to-[#f26b4d] text-white shadow-md"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  {contentType}
                  {isSelected && (
                    <span className="ml-1 flex items-center justify-center size-4 rounded-full bg-white/20">
                      <CheckCircle className="size-3" />
                    </span>
                  )}
                </button>
              );
            })}
            {selectedContentTypes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-[#d94e33] h-7"
              >
                Clear all
              </Button>
            )}
            <div className="ml-auto text-xs text-muted-foreground">
              {selectedContentTypes.length > 0 
                ? `Showing ${filteredItems.length} of ${items.length} items`
                : `${items.length} total items`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="bg-linear-to-r from-[#d94e33] to-[#f26b4d] p-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white font-medium">
            <Layout className="size-4" />
            Pipeline Board
            <Badge className="bg-white/20 text-white border-0 text-[10px]">{filteredItems.length} items</Badge>
          </div>
        </div>
        <CardContent className="p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-[1000px]">
            {columns.map((col) => {
              const columnCards = filteredItems.filter(col.filter);
              return (
                <div key={col.id} className={`flex-1 min-h-[500px] border rounded-lg overflow-hidden flex flex-col ${col.color}`}>
                  <div className="p-3 border-b flex items-center gap-2 font-semibold bg-white/50 backdrop-blur-sm text-sm">
                    {col.icon}
                    {col.title} ({columnCards.length})
                  </div>
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {columnCards.length > 0 ? (
                      columnCards.map((card) => (
                        <div key={card.id} className="p-3 bg-white rounded-md border border-gray-200 shadow-sm hover:border-[#d94e33]/30 transition-colors group">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {card.pillarIds.slice(0, 1).map((pid) => (
                              <Badge key={pid} variant="outline" className="text-[9px] font-medium py-0 h-4 border-[#d94e33]/20 text-[#d94e33]">
                                {pid}
                              </Badge>
                            ))}
                            {card.contentType && (
                              <Badge variant="outline" className="text-[9px] font-medium py-0 h-4 border-gray-300 bg-gray-50 text-gray-600">
                                {card.contentType}
                              </Badge>
                            )}
                            {card.platform && (
                              <div className="flex items-center gap-1 ml-auto">
                                <PlatformIcon platform={card.platform} />
                              </div>
                            )}
                          </div>
                          <h5 className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-[#d94e33] transition-colors">
                            {card.title}
                          </h5>
                          {card.hook && (
                            <p className="text-[9px] text-muted-foreground mt-1 italic line-clamp-1">"{card.hook}"</p>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex -space-x-1.5">
                              {card.pillarIds.slice(0, 2).map((_, idx) => (
                                <div key={idx} className="size-5 rounded-full bg-gray-100 border border-white flex items-center justify-center">
                                  <FileText className="size-2.5 text-gray-400" />
                                </div>
                              ))}
                            </div>
                            {card.scheduledDate && (
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <Clock className="size-2.5" />
                                {new Date(card.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-2 opacity-60">
                        <div className="p-3 bg-white/50 rounded-full border border-gray-100">
                          <Mail className="size-8 text-blue-400/20" />
                        </div>
                        <p className="text-[10px]">No content in this stage</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Content", value: items.length.toString(), icon: <FileText className="size-4 text-blue-500" /> },
          { label: "In Production", value: items.filter((i) => i.stage === "concept" || i.status === "in-progress").length.toString(), icon: <PenTool className="size-4 text-yellow-500" /> },
          { label: "Published", value: items.filter((i) => i.status === "published").length.toString(), icon: <Eye className="size-4 text-green-500" /> },
          { label: "Scheduled", value: items.filter((i) => i.status === "scheduled").length.toString(), icon: <Clock className="size-4 text-pink-500" /> },
        ].map((stat, i) => (
          <Card key={i} className="bg-white/50 border-gray-100">
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-gray-50 rounded-lg">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-[#d94e33]">{stat.value}</div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}