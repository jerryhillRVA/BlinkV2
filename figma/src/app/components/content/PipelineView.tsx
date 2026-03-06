import React, { useState, useMemo } from "react";
import {
  Plus,
  Lightbulb,
  PenTool,
  ShieldCheck,
  Clock,
  CheckCircle,
  Kanban as KanbanIcon,
  List as ListIcon,
  ArrowUpDown,
  FileText,
  Instagram,
  Youtube,
  Send,
  SlidersHorizontal,
  Search,
  Target,
  BarChart3,
  ChevronRight,
  User,
  AlertTriangle,
  X,
  Facebook,
  Linkedin,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { toast } from "sonner";
import type {
  ContentItem,
  ContentPillar,
  ContentStage,
  Platform,
  ContentType,
  ContentObjective,
  CTATypeEnum,
  FormatNote,
  RiskLevel,
  AudienceSegment,
} from "./types";
import { PLATFORM_CONTENT_TYPES, DEFAULT_SEGMENTS } from "./types";
import { Checkbox } from "@/app/components/ui/checkbox";

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
  if (platform === "tiktok") return <TikTokIcon />;
  return null;
}

type ViewMode = "kanban" | "list";
type SortField = "updatedAt" | "title" | "createdAt";
type SortOrder = "asc" | "desc";

interface PipelineViewProps {
  items: ContentItem[];
  pillars: ContentPillar[];
  onSelectItem: (id: string) => void;
  onSaveItem: (item: ContentItem) => void;
  onNavigateToStrategy: () => void;
  onNavigateToPerformance: () => void;
  onMoveToProduction: (id: string) => void;
}

export function PipelineView({
  items,
  pillars,
  onSelectItem,
  onSaveItem,
  onNavigateToStrategy,
  onNavigateToPerformance,
  onMoveToProduction,
}: PipelineViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPillar, setFilterPillar] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterContentType, setFilterContentType] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemType, setNewItemType] = useState<ContentStage>("idea");

  // Form state for new item
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPillarIds, setNewPillarIds] = useState<string[]>([]);
  const [newHook, setNewHook] = useState("");
  const [newPlatform, setNewPlatform] = useState<Platform | "">("");
  const [newContentType, setNewContentType] = useState<ContentType | "">("");
  const [newObjective, setNewObjective] = useState<ContentObjective | "">("");
  const [newCTAType, setNewCTAType] = useState<CTATypeEnum | "">("");
  const [newCTAText, setNewCTAText] = useState("");
  const [newFormatNote, setNewFormatNote] = useState<FormatNote | "">("");
  const [newRiskLevel, setNewRiskLevel] = useState<RiskLevel | "">("");
  const [newAudienceSegments, setNewAudienceSegments] = useState<AudienceSegment[]>([]);
  const [savedIdeaId, setSavedIdeaId] = useState<string | null>(null); // Track saved idea when promoting to concept
  const [savedConceptId, setSavedConceptId] = useState<string | null>(null); // Track saved concept when moving to production
  const [isProductionMode, setIsProductionMode] = useState(false); // Track if we're in production editing mode
  
  // Production Brief specific fields
  const [newTonePreset, setNewTonePreset] = useState<string>("");
  const [newKeyMessage, setNewKeyMessage] = useState("");

  // Get unique content types from all items
  const availableContentTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach(item => {
      if (item.contentType) types.add(item.contentType);
    });
    return Array.from(types).sort();
  }, [items]);

  const columns = [
    {
      id: "idea",
      title: "Ideas",
      filter: (i: ContentItem) => i.stage === "idea" && i.status === "draft",
      color: "border-l-blue-400 bg-blue-50/30",
      icon: <Lightbulb className="size-4 text-blue-500" />,
    },
    {
      id: "concept",
      title: "Concepts",
      filter: (i: ContentItem) => i.stage === "concept" && i.status === "draft",
      color: "border-l-purple-400 bg-purple-50/30",
      icon: <Send className="size-4 text-purple-500" />,
    },
    {
      id: "production",
      title: "In Production",
      filter: (i: ContentItem) => i.status === "in-progress",
      color: "border-l-yellow-400 bg-yellow-50/30",
      icon: <PenTool className="size-4 text-yellow-500" />,
    },
    {
      id: "review",
      title: "Review & Schedule",
      filter: (i: ContentItem) => i.status === "review" || i.status === "scheduled",
      color: "border-l-pink-400 bg-pink-50/30",
      icon: <ShieldCheck className="size-4 text-pink-500" />,
    },
    {
      id: "published",
      title: "Published",
      filter: (i: ContentItem) => i.status === "published",
      color: "border-l-green-400 bg-green-50/30",
      icon: <CheckCircle className="size-4 text-green-500" />,
    },
  ];

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query) ||
          i.hook?.toLowerCase().includes(query)
      );
    }

    // Pillar filter
    if (filterPillar !== "all") {
      result = result.filter((i) => i.pillarIds.includes(filterPillar));
    }

    // Platform filter
    if (filterPlatform !== "all") {
      result = result.filter((i) => i.platform === filterPlatform);
    }

    // Content type filter
    if (filterContentType !== "all") {
      result = result.filter((i) => i.contentType === filterContentType);
    }

    return result;
  }, [items, searchQuery, filterPillar, filterPlatform, filterContentType]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      let aVal, bVal;
      if (sortField === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else {
        aVal = new Date(a[sortField]).getTime();
        bVal = new Date(b[sortField]).getTime();
      }
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  }, [filteredItems, sortField, sortOrder]);

  const handleCreateItem = (moveToProduction?: boolean) => {
    if (!newTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    // Validate Concept required fields
    if (newItemType === "concept") {
      if (!newDescription || newDescription.trim().length < 50) {
        toast.error("Description is required (minimum 50 characters)");
        return;
      }
      if (newDescription.length > 400) {
        toast.error("Description must not exceed 400 characters");
        return;
      }
      if (newPillarIds.length === 0) {
        toast.error("At least 1 Content Pillar is required");
        return;
      }
      if (newPillarIds.length > 3) {
        toast.error("Maximum 3 Content Pillars allowed");
        return;
      }
      if (!newHook || newHook.trim().length === 0) {
        toast.error("Hook is required");
        return;
      }
      if (newHook.length > 120) {
        toast.error("Hook must not exceed 120 characters");
        return;
      }
      if (!newObjective) {
        toast.error("Objective is required");
        return;
      }

      // Additional validation for Move to Production
      if (moveToProduction) {
        if (!newPlatform || newPlatform === "tbd") {
          toast.error("Platform must be selected (cannot be TBD) to move to production");
          return;
        }
        if (!newContentType) {
          toast.error("Content Type is required to move to production");
          return;
        }
        if (newAudienceSegments.length === 0) {
          toast.error("At least 1 Audience Segment is required to move to production");
          return;
        }
        if (!newCTAType || !newCTAText.trim()) {
          toast.error("CTA Type and Text are required to move to production");
          return;
        }
        if (newCTAText.length > 120) {
          toast.error("CTA Text must not exceed 120 characters");
          return;
        }
      }
    }

    const now = new Date().toISOString();
    
    // If we have a savedIdeaId (came from Idea -> Create Concept flow), update it to Concept
    const itemId = savedIdeaId || `c-${Date.now()}`;
    
    const newItem: ContentItem = {
      id: itemId,
      stage: newItemType,
      status: "draft",
      title: newTitle,
      description: newDescription,
      pillarIds: newPillarIds,
      segmentIds: newAudienceSegments.map((s) => s.id),
      createdAt: now,
      updatedAt: now,
      hook: newHook || undefined,
      platform: newPlatform || undefined,
      contentType: newContentType || undefined,
      objective: newObjective || undefined,
      owner: "Brett Lewis", // Default owner
      cta: newCTAType && newCTAText ? { type: newCTAType, text: newCTAText } : undefined,
      audienceSegment: newAudienceSegments.length > 0 ? newAudienceSegments[0].id : undefined,
    };

    onSaveItem(newItem);

    if (moveToProduction) {
      // Move to production immediately
      setTimeout(() => onMoveToProduction(newItem.id), 100);
    } else {
      if (savedIdeaId && newItemType === "concept") {
        toast.success("Idea promoted to Concept successfully!");
      } else {
        toast.success(`${newItemType === "idea" ? "Idea" : "Concept"} created successfully`);
      }
    }

    // Reset form
    setNewTitle("");
    setNewDescription("");
    setNewPillarIds([]);
    setNewHook("");
    setNewPlatform("");
    setNewContentType("");
    setNewObjective("");
    setNewCTAType("");
    setNewCTAText("");
    setNewFormatNote("");
    setNewRiskLevel("");
    setNewAudienceSegments([]);
    setSavedIdeaId(null);
    setShowAddDialog(false);
  };

  const handleMoveToConcept = () => {
    if (!newTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    // Save the Idea first
    const now = new Date().toISOString();
    const ideaId = savedIdeaId || `c-${Date.now()}`;
    const ideaItem: ContentItem = {
      id: ideaId,
      stage: "idea",
      status: "draft",
      title: newTitle,
      description: newDescription || "",
      pillarIds: newPillarIds,
      segmentIds: newAudienceSegments.map((s) => s.id),
      createdAt: now,
      updatedAt: now,
      platform: newPlatform || undefined,
      contentType: newContentType || undefined,
      owner: "Brett Lewis",
      audienceSegment: newAudienceSegments.length > 0 ? newAudienceSegments[0].id : undefined,
    };

    onSaveItem(ideaItem);
    setSavedIdeaId(ideaId);
    toast.success("Idea saved! Complete the fields below to create a Concept.");

    // Switch to Concept mode and keep the modal open
    setNewItemType("concept");
  };

  const handleMoveConceptToProduction = () => {
    // Validate Concept requirements before saving
    if (!newTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!newDescription || newDescription.trim().length < 50) {
      toast.error("Description is required (minimum 50 characters)");
      return;
    }
    if (newDescription.length > 400) {
      toast.error("Description must not exceed 400 characters");
      return;
    }
    if (newPillarIds.length === 0) {
      toast.error("At least 1 Content Pillar is required");
      return;
    }
    if (newPillarIds.length > 3) {
      toast.error("Maximum 3 Content Pillars allowed");
      return;
    }
    if (!newHook || newHook.trim().length === 0) {
      toast.error("Hook is required");
      return;
    }
    if (newHook.length > 120) {
      toast.error("Hook must not exceed 120 characters");
      return;
    }
    if (!newObjective) {
      toast.error("Objective is required");
      return;
    }

    // Save the Concept first
    const now = new Date().toISOString();
    const conceptId = savedConceptId || savedIdeaId || `c-${Date.now()}`;
    const conceptItem: ContentItem = {
      id: conceptId,
      stage: "concept",
      status: "draft",
      title: newTitle,
      description: newDescription,
      pillarIds: newPillarIds,
      segmentIds: newAudienceSegments.map((s) => s.id),
      createdAt: now,
      updatedAt: now,
      hook: newHook,
      platform: newPlatform || undefined,
      contentType: newContentType || undefined,
      objective: newObjective,
      owner: "Brett Lewis",
      cta: newCTAType && newCTAText ? { type: newCTAType, text: newCTAText } : undefined,
      audienceSegment: newAudienceSegments.length > 0 ? newAudienceSegments[0].id : undefined,
    };

    onSaveItem(conceptItem);
    setSavedConceptId(conceptId);
    setIsProductionMode(true);
    toast.success("Concept saved! Complete the production fields below.");
  };

  const handleSaveProductionBrief = () => {
    if (!productionBriefRequirementsMet) {
      toast.error("Please fill all required fields");
      return;
    }

    const now = new Date().toISOString();
    const briefId = `c-${Date.now()}`;
    
    const briefItem: ContentItem = {
      id: briefId,
      stage: "concept",
      status: "in-progress",
      title: newTitle,
      description: newDescription,
      pillarIds: newPillarIds,
      segmentIds: newAudienceSegments.map((s) => s.id),
      createdAt: now,
      updatedAt: now,
      platform: newPlatform as Platform,
      contentType: newContentType as ContentType,
      objective: newObjective as ContentObjective,
      owner: "Brett Lewis",
      keyMessage: newKeyMessage,
      cta: newCTAType && newCTAType !== "none" ? { type: newCTAType, text: newCTAText || "" } : undefined,
      audienceSegment: newAudienceSegments.length > 0 ? newAudienceSegments[0].id : undefined,
    };

    onSaveItem(briefItem);
    toast.success("Production Brief saved successfully!");
    setShowAddDialog(false);

    // Reset form
    setNewTitle("");
    setNewDescription("");
    setNewPillarIds([]);
    setNewHook("");
    setNewPlatform("");
    setNewContentType("");
    setNewObjective("");
    setNewCTAType("");
    setNewCTAText("");
    setNewTonePreset("");
    setNewKeyMessage("");
    setNewAudienceSegments([]);
  };

  const handleDraftAssets = () => {
    if (!productionBriefRequirementsMet) {
      toast.error("Please fill all required fields");
      return;
    }

    const now = new Date().toISOString();
    const briefId = `c-${Date.now()}`;
    
    const briefItem: ContentItem = {
      id: briefId,
      stage: "concept",
      status: "in-progress",
      title: newTitle,
      description: newDescription,
      pillarIds: newPillarIds,
      segmentIds: newAudienceSegments.map((s) => s.id),
      createdAt: now,
      updatedAt: now,
      platform: newPlatform as Platform,
      contentType: newContentType as ContentType,
      objective: newObjective as ContentObjective,
      owner: "Brett Lewis",
      keyMessage: newKeyMessage,
      cta: newCTAType && newCTAType !== "none" ? { type: newCTAType, text: newCTAText || "" } : undefined,
      audienceSegment: newAudienceSegments.length > 0 ? newAudienceSegments[0].id : undefined,
    };

    onSaveItem(briefItem);
    toast.success("Production Brief created! Opening Draft Studio...");
    setShowAddDialog(false);

    // Navigate to the production detail screen
    setTimeout(() => {
      onSelectItem(briefId);
    }, 100);

    // Reset form
    setNewTitle("");
    setNewDescription("");
    setNewPillarIds([]);
    setNewHook("");
    setNewPlatform("");
    setNewContentType("");
    setNewObjective("");
    setNewCTAType("");
    setNewCTAText("");
    setNewTonePreset("");
    setNewKeyMessage("");
    setNewAudienceSegments([]);
  };

  const ContentCard = ({ item }: { item: ContentItem }) => (
    <div
      className="p-3 bg-white rounded-md border border-gray-200 shadow-sm hover:border-[#d94e33]/30 transition-all cursor-pointer group hover:shadow-md"
      onClick={() => onSelectItem(item.id)}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {item.pillarIds.slice(0, 2).map((pid) => {
          const pillar = pillars.find((p) => p.id === pid);
          return (
            <Badge
              key={pid}
              variant="outline"
              className="text-[9px] font-medium py-0 h-4 border-[#d94e33]/20 text-[#d94e33]"
            >
              {pillar?.name || pid}
            </Badge>
          );
        })}
        {item.contentType && (
          <Badge variant="outline" className="text-[9px] font-medium py-0 h-4 border-gray-300 bg-gray-50 text-gray-600">
            {item.contentType}
          </Badge>
        )}
        {item.platform && (
          <div className="flex items-center gap-1 ml-auto">
            <PlatformIcon platform={item.platform} />
          </div>
        )}
      </div>
      <h5 className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-[#d94e33] transition-colors">
        {item.title}
      </h5>
      {item.hook && (
        <p className="text-[9px] text-muted-foreground mt-1 italic line-clamp-1">
          "{item.hook}"
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {item.pillarIds.slice(0, 2).map((_, idx) => (
            <div
              key={idx}
              className="size-5 rounded-full bg-gray-100 border border-white flex items-center justify-center"
            >
              <FileText className="size-2.5 text-gray-400" />
            </div>
          ))}
        </div>
        {item.scheduledDate && (
          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
            <Clock className="size-2.5" />
            {new Date(item.scheduledDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {!item.scheduledDate && (
          <span className="text-[9px] text-muted-foreground">
            {new Date(item.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );

  const contentTypes = newPlatform ? PLATFORM_CONTENT_TYPES[newPlatform as Platform] || [] : [];

  // Check if Idea requirements are met (just title for Ideas)
  const ideaRequirementsMet = newTitle.trim().length > 0;

  // Check if Concept requirements are met
  const conceptRequirementsMet = 
    newTitle.trim().length > 0 &&
    newDescription.trim().length >= 50 &&
    newDescription.length <= 400 &&
    newPillarIds.length >= 1 &&
    newPillarIds.length <= 3 &&
    newHook.trim().length > 0 &&
    newHook.length <= 120 &&
    newObjective !== "";

  // Check if Production requirements are met (in addition to Concept requirements)
  const productionRequirementsMet =
    conceptRequirementsMet &&
    newPlatform !== "" &&
    newPlatform !== "tbd" &&
    newContentType !== "" &&
    newAudienceSegments.length > 0 &&
    newCTAType !== "" &&
    newCTAText.trim().length > 0 &&
    newCTAText.length <= 120;

  // Check if Production Brief requirements are met
  const productionBriefRequirementsMet =
    newTitle.trim().length > 0 &&
    newDescription.trim().length > 0 &&
    newPlatform !== "" &&
    newPlatform !== "tbd" &&
    newContentType !== "" &&
    newPillarIds.length >= 1 &&
    newPillarIds.length <= 3 &&
    newObjective !== "" &&
    newKeyMessage.trim().length > 0 &&
    newKeyMessage.length <= 140 &&
    newAudienceSegments.length > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-64"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <SlidersHorizontal className="size-4" />
                <span className="hidden sm:inline">Filter</span>
                {(filterPillar !== "all" || filterPlatform !== "all" || filterContentType !== "all") && (
                  <Badge className="ml-1 h-4 px-1 text-[9px] bg-[#d94e33] text-white">
                    {(filterPillar !== "all" ? 1 : 0) + (filterPlatform !== "all" ? 1 : 0) + (filterContentType !== "all" ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Filter by Pillar</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterPillar("all")}>
                {filterPillar === "all" && "✓ "}All Pillars
              </DropdownMenuItem>
              {pillars.map((pillar) => (
                <DropdownMenuItem key={pillar.id} onClick={() => setFilterPillar(pillar.id)}>
                  {filterPillar === pillar.id && "✓ "}{pillar.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterPlatform("all")}>
                {filterPlatform === "all" && "✓ "}All Platforms
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlatform("instagram")}>
                <Instagram className="size-3.5 mr-2 text-pink-600" />
                {filterPlatform === "instagram" && "✓ "}Instagram
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlatform("tiktok")}>
                <TikTokIcon />
                <span className="ml-2">{filterPlatform === "tiktok" && "✓ "}TikTok</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlatform("youtube")}>
                <Youtube className="size-3.5 mr-2 text-red-600" />
                {filterPlatform === "youtube" && "✓ "}YouTube
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlatform("facebook")}>
                <Facebook className="size-3.5 mr-2 text-blue-600" />
                {filterPlatform === "facebook" && "✓ "}Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPlatform("linkedin")}>
                <Linkedin className="size-3.5 mr-2 text-blue-700" />
                {filterPlatform === "linkedin" && "✓ "}LinkedIn
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Content Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterContentType("all")}>
                {filterContentType === "all" && "✓ "}All Types
              </DropdownMenuItem>
              {availableContentTypes.map((contentType) => (
                <DropdownMenuItem key={contentType} onClick={() => setFilterContentType(contentType)}>
                  {filterContentType === contentType && "✓ "}{contentType}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "h-8 gap-1.5 px-3",
                viewMode === "kanban"
                  ? "bg-white shadow-sm"
                  : "hover:bg-transparent text-muted-foreground"
              )}
            >
              <KanbanIcon className="size-3.5" />
              <span className="text-xs">Kanban</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-8 gap-1.5 px-3",
                viewMode === "list"
                  ? "bg-white shadow-sm"
                  : "hover:bg-transparent text-muted-foreground"
              )}
            >
              <ListIcon className="size-3.5" />
              <span className="text-xs">List</span>
            </Button>
          </div>

          {/* Add Button */}
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              // Reset form when closing
              setNewItemType("idea");
              setNewTitle("");
              setNewDescription("");
              setNewPillarIds([]);
              setNewHook("");
              setNewPlatform("");
              setNewContentType("");
              setNewObjective("");
              setNewCTAType("");
              setNewCTAText("");
              setNewFormatNote("");
              setNewRiskLevel("");
              setNewAudienceSegments([]);
              setNewTonePreset("");
              setNewKeyMessage("");
              setSavedIdeaId(null);
              setSavedConceptId(null);
              setIsProductionMode(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#d94e33] hover:bg-[#c2462e] text-white gap-2 h-9 shadow-sm"
                size="sm"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Content</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Create New Content</DialogTitle>
                <DialogDescription>
                  Add a new idea or concept to your content pipeline
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 overflow-y-auto flex-1 px-1">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newItemType} onValueChange={(v) => setNewItemType(v as ContentStage)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="size-4 text-blue-500" />
                          Idea
                        </div>
                      </SelectItem>
                      <SelectItem value="concept">
                        <div className="flex items-center gap-2">
                          <Send className="size-4 text-purple-500" />
                          Concept
                        </div>
                      </SelectItem>
                      <SelectItem value="production-brief">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-orange-500" />
                          Production Brief
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter content title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description{(newItemType === "concept" || newItemType === "production-brief") && <span className="text-red-500"> *</span>}
                  </Label>
                  <Textarea
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={newItemType === "concept" ? "50-400 characters required" : newItemType === "production-brief" ? "Brief description of the content..." : "Brief description of the content..."}
                    rows={3}
                  />
                  {newItemType === "concept" && newDescription && (
                    <p className={cn(
                      "text-[10px]",
                      newDescription.length < 50 ? "text-red-500" : newDescription.length > 400 ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {newDescription.length}/400 characters {newDescription.length < 50 && `(${50 - newDescription.length} more needed)`}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Content Pillars{(newItemType === "concept" || newItemType === "production-brief") && <span className="text-red-500"> *</span>}
                    {(newItemType === "concept" || newItemType === "production-brief") && <span className="text-xs text-muted-foreground ml-2">(1-3 required)</span>}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {pillars.map((pillar) => (
                      <Button
                        key={pillar.id}
                        variant={newPillarIds.includes(pillar.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setNewPillarIds((prev) =>
                            prev.includes(pillar.id)
                              ? prev.filter((p) => p !== pillar.id)
                              : prev.length < 3 ? [...prev, pillar.id] : prev
                          );
                        }}
                        className={cn(
                          "text-xs h-7",
                          newPillarIds.includes(pillar.id) && "bg-[#d94e33] hover:bg-[#c2462e]"
                        )}
                      >
                        {pillar.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Show Hook and Platform only for Concepts */}
                {newItemType === "concept" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hook">
                        Hook <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="hook"
                        value={newHook}
                        onChange={(e) => setNewHook(e.target.value)}
                        placeholder="Enter a compelling hook (max 120 characters)..."
                        maxLength={120}
                      />
                      {newHook && (
                        <p className={cn(
                          "text-[10px]",
                          newHook.length >= 100 ? "text-amber-600" : "text-muted-foreground"
                        )}>
                          {newHook.length}/120 characters
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Objective <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newObjective}
                        onValueChange={(v) => setNewObjective(v as ContentObjective)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select objective" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="awareness">Awareness</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="trust">Trust</SelectItem>
                          <SelectItem value="leads">Leads</SelectItem>
                          <SelectItem value="conversion">Conversion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">Optional Fields</p>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Platform</Label>
                          <Select
                            value={newPlatform}
                            onValueChange={(v) => {
                              setNewPlatform(v as Platform);
                              setNewContentType(""); // Reset content type when platform changes
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tbd">TBD</SelectItem>
                              <SelectItem value="instagram">
                                <div className="flex items-center gap-2">
                                  <Instagram className="size-4 text-pink-600" />
                                  Instagram
                                </div>
                              </SelectItem>
                              <SelectItem value="youtube">
                                <div className="flex items-center gap-2">
                                  <Youtube className="size-4 text-red-600" />
                                  YouTube
                                </div>
                              </SelectItem>
                              <SelectItem value="tiktok">
                                <div className="flex items-center gap-2">
                                  <TikTokIcon />
                                  TikTok
                                </div>
                              </SelectItem>
                              <SelectItem value="facebook">
                                <div className="flex items-center gap-2">
                                  <Facebook className="size-4 text-blue-600" />
                                  Facebook
                                </div>
                              </SelectItem>
                              <SelectItem value="linkedin">
                                <div className="flex items-center gap-2">
                                  <Linkedin className="size-4 text-blue-700" />
                                  LinkedIn
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newPlatform && newPlatform !== "tbd" && (
                          <div className="space-y-2">
                            <Label>Content Type</Label>
                            <Select
                              value={newContentType}
                              onValueChange={(v) => setNewContentType(v as ContentType)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select content type" />
                              </SelectTrigger>
                              <SelectContent>
                                {contentTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Audience Segments</Label>
                          <div className="flex flex-wrap gap-2">
                            {DEFAULT_SEGMENTS.map((segment) => (
                              <Button
                                key={segment.id}
                                variant={newAudienceSegments.some((s) => s.id === segment.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const isSelected = newAudienceSegments.some((s) => s.id === segment.id);
                                  if (isSelected) {
                                    setNewAudienceSegments((prev) => prev.filter((s) => s.id !== segment.id));
                                  } else {
                                    setNewAudienceSegments((prev) => [...prev, segment]);
                                  }
                                }}
                                className={cn(
                                  "text-xs h-7",
                                  newAudienceSegments.some((s) => s.id === segment.id) && "bg-[#d94e33] hover:bg-[#c2462e]"
                                )}
                              >
                                {segment.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Required to Move to Production</p>
                      <p className="text-[10px] text-muted-foreground mb-3">Complete these fields if you plan to move directly to production</p>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>CTA Type</Label>
                          <Select
                            value={newCTAType}
                            onValueChange={(v) => setNewCTAType(v as CTATypeEnum)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select CTA type (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="learn-more">Learn More</SelectItem>
                              <SelectItem value="subscribe">Subscribe</SelectItem>
                              <SelectItem value="comment">Comment</SelectItem>
                              <SelectItem value="download">Download</SelectItem>
                              <SelectItem value="buy">Buy</SelectItem>
                              <SelectItem value="book-call">Book a Call</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newCTAType && (
                          <div className="space-y-2">
                            <Label htmlFor="ctaText">CTA Text</Label>
                            <Input
                              id="ctaText"
                              value={newCTAText}
                              onChange={(e) => setNewCTAText(e.target.value)}
                              placeholder="Enter CTA text (max 120 characters)..."
                              maxLength={120}
                            />
                            {newCTAText && (
                              <p className="text-[10px] text-muted-foreground">
                                {newCTAText.length}/120 characters
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Production Brief Fields */}
                {newItemType === "production-brief" && (
                  <>
                    <div className="space-y-2">
                      <Label>
                        Platform <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newPlatform}
                        onValueChange={(v) => {
                          setNewPlatform(v as Platform);
                          setNewContentType(""); // Reset content type when platform changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">
                            <div className="flex items-center gap-2">
                              <Instagram className="size-4 text-pink-600" />
                              Instagram
                            </div>
                          </SelectItem>
                          <SelectItem value="youtube">
                            <div className="flex items-center gap-2">
                              <Youtube className="size-4 text-red-600" />
                              YouTube
                            </div>
                          </SelectItem>
                          <SelectItem value="tiktok">
                            <div className="flex items-center gap-2">
                              <TikTokIcon />
                              TikTok
                            </div>
                          </SelectItem>
                          <SelectItem value="facebook">
                            <div className="flex items-center gap-2">
                              <Facebook className="size-4 text-blue-600" />
                              Facebook
                            </div>
                          </SelectItem>
                          <SelectItem value="linkedin">
                            <div className="flex items-center gap-2">
                              <Linkedin className="size-4 text-blue-700" />
                              LinkedIn
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newPlatform && newPlatform !== "tbd" && (
                      <div className="space-y-2">
                        <Label>
                          Content Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={newContentType}
                          onValueChange={(v) => setNewContentType(v as ContentType)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                          <SelectContent>
                            {contentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>
                        Objective <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={newObjective}
                        onValueChange={(v) => setNewObjective(v as ContentObjective)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select objective" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="awareness">Awareness</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="trust">Trust</SelectItem>
                          <SelectItem value="leads">Leads</SelectItem>
                          <SelectItem value="conversion">Conversion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tone Preset</Label>
                      <Select
                        value={newTonePreset}
                        onValueChange={(v) => setNewTonePreset(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="authoritative">Authoritative</SelectItem>
                          <SelectItem value="inspiring">Inspiring</SelectItem>
                          <SelectItem value="playful">Playful</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keyMessage">
                        Key Message <span className="text-red-500">*</span>
                        <span className="text-xs text-muted-foreground ml-2">(max 140 chars)</span>
                      </Label>
                      <Input
                        id="keyMessage"
                        value={newKeyMessage}
                        onChange={(e) => setNewKeyMessage(e.target.value.slice(0, 140))}
                        placeholder="One core message this content delivers..."
                        maxLength={140}
                      />
                      {newKeyMessage && (
                        <p className="text-[10px] text-muted-foreground">
                          {newKeyMessage.length}/140 characters
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Audience Segments <span className="text-red-500">*</span>
                        <span className="text-xs text-muted-foreground ml-2">(at least 1)</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {DEFAULT_SEGMENTS.map((segment) => (
                          <Button
                            key={segment.id}
                            variant={newAudienceSegments.some((s) => s.id === segment.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const isSelected = newAudienceSegments.some((s) => s.id === segment.id);
                              if (isSelected) {
                                setNewAudienceSegments((prev) => prev.filter((s) => s.id !== segment.id));
                              } else {
                                setNewAudienceSegments((prev) => [...prev, segment]);
                              }
                            }}
                            className={cn(
                              "text-xs h-7",
                              newAudienceSegments.some((s) => s.id === segment.id) && "bg-[#d94e33] hover:bg-[#c2462e]"
                            )}
                          >
                            {segment.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Type</Label>
                      <Select
                        value={newCTAType}
                        onValueChange={(v) => setNewCTAType(v as CTATypeEnum)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CTA type (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="learn-more">Learn More</SelectItem>
                          <SelectItem value="subscribe">Subscribe</SelectItem>
                          <SelectItem value="comment">Comment</SelectItem>
                          <SelectItem value="download">Download</SelectItem>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="book-call">Book a Call</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newCTAType && newCTAType !== "none" && (
                      <div className="space-y-2">
                        <Label htmlFor="ctaText">CTA Text</Label>
                        <Input
                          id="ctaText"
                          value={newCTAText}
                          onChange={(e) => setNewCTAText(e.target.value)}
                          placeholder="Enter CTA text (max 120 characters)..."
                          maxLength={120}
                        />
                        {newCTAText && (
                          <p className="text-[10px] text-muted-foreground">
                            {newCTAText.length}/120 characters
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <div className="flex w-full gap-2 justify-end">
                  {newItemType !== "production-brief" && (
                    <Button 
                      onClick={() => handleCreateItem(false)} 
                      disabled={newItemType === "idea" ? !ideaRequirementsMet : !conceptRequirementsMet}
                    >
                      {newItemType === "idea" ? "Save Idea" : "Save Concept"}
                    </Button>
                  )}
                  {newItemType === "concept" && !isProductionMode && (
                    <Button
                      onClick={() => handleMoveConceptToProduction()}
                      disabled={!conceptRequirementsMet}
                      className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] hover:from-[#c2462e] hover:to-[#e05a3d] text-white gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Move to Production</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                  {newItemType === "concept" && isProductionMode && (
                    <Button
                      onClick={() => handleCreateItem(true)}
                      disabled={!productionRequirementsMet}
                      className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] hover:from-[#c2462e] hover:to-[#e05a3d] text-white gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Complete Production</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                  {newItemType === "idea" && (
                    <Button
                      onClick={() => handleMoveToConcept()}
                      disabled={!ideaRequirementsMet}
                      className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] hover:from-[#c2462e] hover:to-[#e05a3d] text-white gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Create Concept</span>
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                  {newItemType === "production-brief" && (
                    <>
                      <Button
                        onClick={handleSaveProductionBrief}
                        disabled={!productionBriefRequirementsMet}
                        variant="outline"
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Production Brief
                      </Button>
                      <Button
                        onClick={handleDraftAssets}
                        disabled={!productionBriefRequirementsMet}
                        className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] hover:from-[#c2462e] hover:to-[#e05a3d] text-white gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Draft Assets</span>
                        <ChevronRight className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content Display */}
      {viewMode === "kanban" ? (
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white font-medium">
              <KanbanIcon className="size-4" />
              Pipeline Board
              <Badge className="bg-white/20 text-white border-0 text-[10px]">
                {filteredItems.length} items
              </Badge>
            </div>
          </div>
          <CardContent className="p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-[1000px]">
              {columns.map((col) => {
                const columnCards = filteredItems.filter(col.filter);
                return (
                  <div
                    key={col.id}
                    className={`flex-1 min-h-[500px] border rounded-lg overflow-hidden flex flex-col ${col.color}`}
                  >
                    <div className="p-3 border-b flex items-center gap-2 font-semibold bg-white/50 backdrop-blur-sm text-sm">
                      {col.icon}
                      {col.title} ({columnCards.length})
                    </div>
                    <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                      {columnCards.length > 0 ? (
                        columnCards.map((item) => <ContentCard key={item.id} item={item} />)
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-2 opacity-60 min-h-[200px]">
                          <div className="p-3 bg-white/50 rounded-full border border-gray-100">
                            {col.icon}
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
      ) : (
        <Card className="border-none shadow-sm bg-white">
          <div className="bg-gradient-to-r from-[#d94e33] to-[#f26b4d] p-3 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white font-medium">
              <ListIcon className="size-4" />
              List View
              <Badge className="bg-white/20 text-white border-0 text-[10px]">
                {sortedItems.length} items
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-7 gap-1.5">
                  <ArrowUpDown className="size-3.5" />
                  <span className="text-xs">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortField("updatedAt")}>
                  Updated Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortField("createdAt")}>
                  Created Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortField("title")}>
                  Title
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                  {sortOrder === "asc" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => {
                  const column = columns.find((c) => c.filter(item));
                  return (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                      onClick={() => onSelectItem(item.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {column?.icon}
                            <h4 className="font-bold text-sm group-hover:text-[#d94e33] transition-colors">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.pillarIds.slice(0, 3).map((pid) => {
                              const pillar = pillars.find((p) => p.id === pid);
                              return (
                                <Badge
                                  key={pid}
                                  variant="outline"
                                  className="text-[9px] font-medium py-0 h-4 border-[#d94e33]/20 text-[#d94e33]"
                                >
                                  {pillar?.name || pid}
                                </Badge>
                              );
                            })}
                            {item.platform && (
                              <div className="flex items-center gap-1">
                                <PlatformIcon platform={item.platform} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-[10px] mb-1">
                            {column?.title}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <ListIcon className="size-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No content found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}