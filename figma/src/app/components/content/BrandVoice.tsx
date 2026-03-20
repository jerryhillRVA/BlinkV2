import React, { useState } from "react";
import {
  Mic,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import type { BrandVoice, VoiceAttribute, ToneContext } from "./types";
import { PLATFORM_CONFIG } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BrandVoiceProps {
  brandVoice: BrandVoice;
  onUpdateBrandVoice: (bv: BrandVoice) => void;
}

const MOCK_VOICE_ATTRIBUTES: VoiceAttribute[] = [
  {
    id: "va1",
    label: "Empowering",
    description: "We lift women up, never talk down to them.",
    doExample: "You have everything it takes — let's unlock it together.",
    dontExample: "You need to fix your relationship with your body.",
  },
  {
    id: "va2",
    label: "Knowledgeable but Accessible",
    description: "Expert-backed but never jargon-heavy.",
    doExample: "Estrogen affects your muscle recovery — here's what that means for your workouts.",
    dontExample: "HRT-mediated myofibrillar protein synthesis rates indicate...",
  },
  {
    id: "va3",
    label: "Warm & Inclusive",
    description: "Every woman in her 40s belongs here.",
    doExample: "Whether you're a lifelong athlete or just rediscovering movement — this is your space.",
    dontExample: "For women who are already committed to fitness.",
  },
  {
    id: "va4",
    label: "Honest & Real",
    description: "No toxic positivity, no impossible standards.",
    doExample: "Some days perimenopause wins. That's real. Here's how to adapt.",
    dontExample: "Every day is an opportunity to crush it!",
  },
];

const MOCK_TONE_CONTEXTS: ToneContext[] = [
  { id: "tc1", context: "Educational", tone: "Clear, authoritative, relatable — translate science into actionable insight", example: "Here's what's actually happening in your body during perimenopause — and what you can do about it today." },
  { id: "tc2", context: "Motivational", tone: "Energetic, affirming, forward-looking", example: "Your strongest decade might just be the one you're stepping into right now." },
  { id: "tc3", context: "Community", tone: "Warm, conversational, curious — invite participation", example: "What's been your biggest shift in how you train since turning 40? Drop it below 👇" },
  { id: "tc4", context: "Promotional", tone: "Honest and benefit-led — never pushy", example: "We built this program for the woman who knows what she wants but needs the right tools." },
];

const MOCK_VOCAB = {
  preferred: ["perimenopause", "hormonal shift", "movement", "reclaim", "adapt", "community", "evidence-backed", "sustainable"],
  avoid: ["anti-aging", "fight", "battle", "fix your body", "before & after", "dramatic results"],
};

const MOCK_PLATFORM_SUGGESTIONS: Record<string, string> = {
  instagram: "Warm, visual storytelling. Use emojis sparingly. Captions can be medium-length with a strong hook.",
  tiktok: "Fast-paced and conversational — mirror trending audio language. Hook within 2 seconds. Short punchy sentences.",
  youtube: "Thorough and evidence-backed. Viewers opt in for depth — reward them with real value. Earn trust over time.",
  facebook: "Community-first. Ask questions, celebrate wins, invite discussion. More personal and conversational.",
  linkedin: "Professional but human — share expertise with personal context. Longer-form insights welcome.",
};

const ACTIVE_PLATFORMS = ["instagram", "tiktok", "youtube", "facebook", "linkedin"] as const;

const EMPTY_ATTR_FORM = { label: "", description: "", doExample: "", dontExample: "" };
const EMPTY_TONE_FORM = { context: "", tone: "", example: "" };

export function BrandVoice({ brandVoice, onUpdateBrandVoice }: BrandVoiceProps) {
  // Section 1 — Mission
  const [mission, setMission] = useState(brandVoice.missionStatement);
  const [isDraftingMission, setIsDraftingMission] = useState(false);

  // Section 2 — Voice Attributes
  const [showAttrForm, setShowAttrForm] = useState(false);
  const [attrForm, setAttrForm] = useState(EMPTY_ATTR_FORM);
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [isGeneratingAttrs, setIsGeneratingAttrs] = useState(false);

  // Section 3 — Tone by Context
  const [showToneForm, setShowToneForm] = useState(false);
  const [toneForm, setToneForm] = useState(EMPTY_TONE_FORM);
  const [editingToneId, setEditingToneId] = useState<string | null>(null);

  // Section 4 — Platform adjustments
  const [platformSuggestingId, setPlatformSuggestingId] = useState<string | null>(null);

  // Section 5 — Vocabulary
  const [preferredInput, setPreferredInput] = useState("");
  const [avoidInput, setAvoidInput] = useState("");
  const [isGeneratingVocab, setIsGeneratingVocab] = useState(false);

  const update = (updates: Partial<BrandVoice>) => {
    onUpdateBrandVoice({ ...brandVoice, ...updates });
  };

  // Mission
  const handleSaveMission = () => {
    update({ missionStatement: mission });
    toast.success("Mission statement saved");
  };

  const handleDraftMission = () => {
    setIsDraftingMission(true);
    setTimeout(() => {
      const drafted = "We create content to help women in their 40s and 50s reclaim their strength and vitality during perimenopause by providing evidence-backed movement guidance and a supportive community that meets them where they are.";
      setMission(drafted);
      update({ missionStatement: drafted });
      setIsDraftingMission(false);
      toast.success("Mission drafted");
    }, 2500);
  };

  // Voice Attributes
  const handleSaveAttr = () => {
    if (!attrForm.label.trim()) return;
    if (editingAttrId) {
      update({
        voiceAttributes: brandVoice.voiceAttributes.map((a) =>
          a.id === editingAttrId ? { ...a, ...attrForm } : a
        ),
      });
    } else {
      const newAttr: VoiceAttribute = { id: `va-${Date.now()}`, ...attrForm };
      update({ voiceAttributes: [...brandVoice.voiceAttributes, newAttr] });
    }
    setAttrForm(EMPTY_ATTR_FORM);
    setShowAttrForm(false);
    setEditingAttrId(null);
    toast.success(editingAttrId ? "Attribute updated" : "Attribute added");
  };

  const handleEditAttr = (attr: VoiceAttribute) => {
    setEditingAttrId(attr.id);
    setAttrForm({ label: attr.label, description: attr.description, doExample: attr.doExample, dontExample: attr.dontExample });
    setShowAttrForm(true);
  };

  const handleDeleteAttr = (id: string) => {
    update({ voiceAttributes: brandVoice.voiceAttributes.filter((a) => a.id !== id) });
  };

  const handleGenerateAttrs = () => {
    setIsGeneratingAttrs(true);
    setTimeout(() => {
      update({ voiceAttributes: MOCK_VOICE_ATTRIBUTES });
      setIsGeneratingAttrs(false);
      toast.success("Voice attributes generated");
    }, 2500);
  };

  // Tone by Context
  const handleSaveTone = () => {
    if (!toneForm.context.trim()) return;
    if (editingToneId) {
      update({
        toneByContext: brandVoice.toneByContext.map((t) =>
          t.id === editingToneId ? { ...t, ...toneForm } : t
        ),
      });
    } else {
      const newTone: ToneContext = { id: `tc-${Date.now()}`, ...toneForm };
      update({ toneByContext: [...brandVoice.toneByContext, newTone] });
    }
    setToneForm(EMPTY_TONE_FORM);
    setShowToneForm(false);
    setEditingToneId(null);
  };

  const handleEditTone = (tc: ToneContext) => {
    setEditingToneId(tc.id);
    setToneForm({ context: tc.context, tone: tc.tone, example: tc.example });
    setShowToneForm(true);
  };

  const handleDeleteTone = (id: string) => {
    update({ toneByContext: brandVoice.toneByContext.filter((t) => t.id !== id) });
  };

  const handleGenerateTone = () => {
    update({ toneByContext: MOCK_TONE_CONTEXTS });
    toast.success("Tone contexts generated");
  };

  // Platform Tone
  const handlePlatformAdjustmentChange = (platform: string, value: string) => {
    const updated = brandVoice.platformToneAdjustments.map((p) =>
      p.platform === platform ? { ...p, adjustment: value } : p
    );
    update({ platformToneAdjustments: updated });
  };

  const handleAISuggestPlatform = (platform: string) => {
    setPlatformSuggestingId(platform);
    setTimeout(() => {
      const suggestion = MOCK_PLATFORM_SUGGESTIONS[platform] || "";
      const updated = brandVoice.platformToneAdjustments.map((p) =>
        p.platform === platform ? { ...p, adjustment: suggestion } : p
      );
      update({ platformToneAdjustments: updated });
      setPlatformSuggestingId(null);
      toast.success(`Tone suggestion added for ${PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]?.label ?? platform}`);
    }, 1500);
  };

  // Vocabulary
  const addPreferred = () => {
    const word = preferredInput.trim();
    if (!word || brandVoice.vocabulary.preferred.includes(word)) return;
    update({ vocabulary: { ...brandVoice.vocabulary, preferred: [...brandVoice.vocabulary.preferred, word] } });
    setPreferredInput("");
  };

  const addAvoid = () => {
    const word = avoidInput.trim();
    if (!word || brandVoice.vocabulary.avoid.includes(word)) return;
    update({ vocabulary: { ...brandVoice.vocabulary, avoid: [...brandVoice.vocabulary.avoid, word] } });
    setAvoidInput("");
  };

  const removePreferred = (word: string) => {
    update({ vocabulary: { ...brandVoice.vocabulary, preferred: brandVoice.vocabulary.preferred.filter((w) => w !== word) } });
  };

  const removeAvoid = (word: string) => {
    update({ vocabulary: { ...brandVoice.vocabulary, avoid: brandVoice.vocabulary.avoid.filter((w) => w !== word) } });
  };

  const handleGenerateVocab = () => {
    setIsGeneratingVocab(true);
    setTimeout(() => {
      update({ vocabulary: MOCK_VOCAB });
      setIsGeneratingVocab(false);
      toast.success("Vocabulary guide generated");
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-[#d94e33]/10">
          <Mic className="size-4 text-[#d94e33]" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Brand Voice & Tone</h3>
          <p className="text-xs text-muted-foreground">Define how your brand speaks, sounds, and connects with your audience</p>
        </div>
      </div>

      {/* ── Section 1: Content Mission ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Mission Statement</p>
            <p className="text-xs text-muted-foreground mt-0.5">Complete this sentence: We create content to help [audience] [achieve outcome] by [our approach].</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs shrink-0"
            onClick={handleDraftMission}
            disabled={isDraftingMission}
          >
            {isDraftingMission ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-[#d94e33]" />}
            Draft Mission
          </Button>
        </div>
        <Textarea
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          placeholder="We create content to help women in their 40s reclaim their energy and strength during perimenopause by..."
          className="min-h-[100px] resize-none text-sm"
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" className="bg-[#d94e33] hover:bg-[#c4452d] h-8 text-xs" onClick={handleSaveMission}>
            <Check className="size-3 mr-1" /> Save Mission
          </Button>
        </div>
      </div>

      {/* ── Section 2: Voice Attributes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand Personality</p>
            <p className="text-xs text-muted-foreground mt-0.5">3–5 defining traits that shape how your brand communicates</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs"
              onClick={handleGenerateAttrs}
              disabled={isGeneratingAttrs}
            >
              {isGeneratingAttrs ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-[#d94e33]" />}
              AI Generate
            </Button>
            <Button
              size="sm"
              className="bg-[#d94e33] hover:bg-[#c4452d] h-8 gap-1 text-xs"
              onClick={() => { setShowAttrForm(true); setEditingAttrId(null); setAttrForm(EMPTY_ATTR_FORM); }}
            >
              <Plus className="size-3" /> Add Attribute
            </Button>
          </div>
        </div>

        {/* Attribute form */}
        {showAttrForm && (
          <Card className="border-dashed border-[#d94e33]/40 mb-4">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{editingAttrId ? "Edit" : "New"} Voice Attribute</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input value={attrForm.label} onChange={(e) => setAttrForm({ ...attrForm, label: e.target.value })} placeholder="e.g. Empowering" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input value={attrForm.description} onChange={(e) => setAttrForm({ ...attrForm, description: e.target.value })} placeholder="What this means for the brand" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Do Example</Label>
                  <Input value={attrForm.doExample} onChange={(e) => setAttrForm({ ...attrForm, doExample: e.target.value })} placeholder="Example done right" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Don't Example</Label>
                  <Input value={attrForm.dontExample} onChange={(e) => setAttrForm({ ...attrForm, dontExample: e.target.value })} placeholder="Example to avoid" className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-[#d94e33] hover:bg-[#c4452d] h-8 text-xs" onClick={handleSaveAttr}>Save</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setShowAttrForm(false); setEditingAttrId(null); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {brandVoice.voiceAttributes.length === 0 && !showAttrForm && (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <Mic className="size-6 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No voice attributes defined yet. Add attributes or use AI Generate.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {brandVoice.voiceAttributes.map((attr) => (
            <Card key={attr.id} className="border-gray-100 group hover:border-gray-200 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900">{attr.label}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditAttr(attr)} className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-[#d94e33]">
                      <Edit3 className="size-3" />
                    </button>
                    <button onClick={() => handleDeleteAttr(attr.id)} className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{attr.description}</p>
                <div className="space-y-1.5">
                  <div className="rounded-md bg-green-50 border border-green-100 px-3 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-0.5">Do</p>
                    <p className="text-xs text-green-800">"{attr.doExample}"</p>
                  </div>
                  <div className="rounded-md bg-red-50 border border-red-100 px-3 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-0.5">Don't</p>
                    <p className="text-xs text-red-800">"{attr.dontExample}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Section 3: Tone by Context ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tone Shifts</p>
            <p className="text-xs text-muted-foreground mt-0.5">How your voice adapts in different content situations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleGenerateTone}>
              <Sparkles className="size-3 text-[#d94e33]" /> AI Generate
            </Button>
            <Button size="sm" className="bg-[#d94e33] hover:bg-[#c4452d] h-8 gap-1 text-xs" onClick={() => { setShowToneForm(true); setEditingToneId(null); setToneForm(EMPTY_TONE_FORM); }}>
              <Plus className="size-3" /> Add Context
            </Button>
          </div>
        </div>

        {showToneForm && (
          <Card className="border-dashed border-[#d94e33]/40 mb-4">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{editingToneId ? "Edit" : "New"} Context</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Context</Label>
                  <Input value={toneForm.context} onChange={(e) => setToneForm({ ...toneForm, context: e.target.value })} placeholder="e.g. Educational" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tone Description</Label>
                  <Input value={toneForm.tone} onChange={(e) => setToneForm({ ...toneForm, tone: e.target.value })} placeholder="How the voice sounds here" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Example Line</Label>
                  <Input value={toneForm.example} onChange={(e) => setToneForm({ ...toneForm, example: e.target.value })} placeholder="Sample copy" className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-[#d94e33] hover:bg-[#c4452d] h-8 text-xs" onClick={handleSaveTone}>Save</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setShowToneForm(false); setEditingToneId(null); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {brandVoice.toneByContext.length === 0 && !showToneForm ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm text-muted-foreground">No tone contexts defined. Add contexts or use AI Generate.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-3 gap-3 px-4 py-2 bg-gray-50/70 border-b border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Context</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tone</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Example</span>
            </div>
            <div className="divide-y divide-gray-50">
              {brandVoice.toneByContext.map((tc) => (
                <div key={tc.id} className="grid grid-cols-3 gap-3 px-4 py-3 group hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{tc.context}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditTone(tc)} className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-[#d94e33]">
                        <Edit3 className="size-3" />
                      </button>
                      <button onClick={() => handleDeleteTone(tc.id)} className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 self-center">{tc.tone}</p>
                  <p className="text-xs text-muted-foreground italic self-center">"{tc.example}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 4: Platform Tone Adjustments ── */}
      <div>
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Platform Nuances</p>
          <p className="text-xs text-muted-foreground mt-0.5">How your voice shifts on each platform</p>
        </div>
        <div className="space-y-3">
          {brandVoice.platformToneAdjustments
            .filter((p) => ACTIVE_PLATFORMS.includes(p.platform as typeof ACTIVE_PLATFORMS[number]))
            .map((p) => {
              const cfg = PLATFORM_CONFIG[p.platform];
              return (
                <div key={p.platform} className="flex items-start gap-3">
                  <div className="w-24 shrink-0 pt-2">
                    <span className={cn("text-xs font-bold", cfg?.color)}>{cfg?.label ?? p.platform}</span>
                  </div>
                  <div className="flex-1">
                    <Input
                      value={p.adjustment}
                      onChange={(e) => handlePlatformAdjustmentChange(p.platform, e.target.value)}
                      placeholder={`Tone notes for ${cfg?.label ?? p.platform}...`}
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 text-xs shrink-0"
                    onClick={() => handleAISuggestPlatform(p.platform)}
                    disabled={platformSuggestingId === p.platform}
                  >
                    {platformSuggestingId === p.platform ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3 text-[#d94e33]" />
                    )}
                    AI Suggest
                  </Button>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Section 5: Vocabulary Guide ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vocabulary Guide</p>
            <p className="text-xs text-muted-foreground mt-0.5">Words and phrases that define your brand's language</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={handleGenerateVocab}
            disabled={isGeneratingVocab}
          >
            {isGeneratingVocab ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-[#d94e33]" />}
            AI Generate
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Use These Words */}
          <div className="rounded-lg border border-green-100 bg-green-50/30 p-4">
            <p className="text-xs font-bold text-green-700 mb-3">Use These Words</p>
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px]">
              {brandVoice.vocabulary.preferred.map((word) => (
                <Badge key={word} variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 pr-1">
                  {word}
                  <button onClick={() => removePreferred(word)} className="hover:text-destructive ml-0.5">
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={preferredInput}
                onChange={(e) => setPreferredInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPreferred()}
                placeholder="Add word or phrase..."
                className="h-8 text-xs"
              />
              <Button size="sm" className="h-8 bg-[#d94e33] hover:bg-[#c4452d] text-xs" onClick={addPreferred}>Add</Button>
            </div>
          </div>

          {/* Avoid These Words */}
          <div className="rounded-lg border border-red-100 bg-red-50/30 p-4">
            <p className="text-xs font-bold text-red-700 mb-3">Avoid These Words</p>
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px]">
              {brandVoice.vocabulary.avoid.map((word) => (
                <Badge key={word} variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 pr-1">
                  {word}
                  <button onClick={() => removeAvoid(word)} className="hover:text-destructive ml-0.5">
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={avoidInput}
                onChange={(e) => setAvoidInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAvoid()}
                placeholder="Add word or phrase..."
                className="h-8 text-xs"
              />
              <Button size="sm" className="h-8 bg-[#d94e33] hover:bg-[#c4452d] text-xs" onClick={addAvoid}>Add</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
