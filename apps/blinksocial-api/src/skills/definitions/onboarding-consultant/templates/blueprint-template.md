# Blueprint Generation Instructions

Generate a Blink Blueprint content strategy document based on the discovery data provided. The blueprint should be comprehensive, actionable, and specific to the client's business.

## Output Requirements

Return a valid JSON object matching the BlueprintDocumentContract structure. Each section should be richly detailed — not generic. Use the specific information gathered during discovery to make every recommendation concrete and tailored.

**Structural completeness rule.** Every subsection listed below is REQUIRED. If the discovery data is silent on a particular subsection, you MUST still emit the field — populate it with the literal placeholder string `*Not provided during discovery — capture in next session*` rather than dropping the subsection. Never silently omit a subsection.

## Required rendered subsections

The rendered `blueprint.md` MUST contain every heading below, exactly as worded. Tests in `libs/blinksocial-core` enforce this — adding to this list without wiring the field through the contract / schema / serializer will fail CI.

#### The Strategy in Plain English
#### Strategic Decisions Made in the Discovery Session
#### How These Objectives Shape Content
#### Voice in Action — Real Copy Examples
#### Journey Map
#### Differentiation Matrix
#### Differentiation Summary
#### Content Ideas Bank
#### Content-Channel Matrix
#### Review Cadence

## Section Guidance

### Strategic Summary

Write 2-3 paragraphs that synthesize the key strategic insight from the discovery. What territory does this brand own? What is the central content strategy? How do the business objectives form a sequence?

In addition to `strategicSummary`, populate the two structural subheaders:

- **`strategyInPlainEnglish`** — rendered under "**The Strategy in Plain English**". A concrete, jargon-free summary the client could explain to a friend. 2–4 sentences.
- **`strategicDecisions`** — rendered under "**Strategic Decisions Made in the Discovery Session**". Briefly enumerate the calls that were made (e.g. "Lead with strength training over yoga", "Optimize for saves over follows"). 3–6 bullets, written as prose.

### Business Objectives

Define 3-5 measurable objectives with specific metrics, categories (Audience Growth, Engagement Quality, Community, Awareness), and time horizons. Use the baselines shared during discovery.

In addition, populate **`objectivesShapeContent`** — rendered under "**How These Objectives Shape Content**". 2–3 sentences explaining the sequencing logic (which objective drives which content beat) and how every piece of content maps back to an objective.

### Brand & Voice

- Craft a positioning statement (1-2 sentences)
- Define a content mission statement
- List 3-5 voice attributes with descriptions
- Create DO and DON'T lists for tone (5-7 items each)

Also populate **`brandVoice.voiceInAction`** — rendered under "**Voice in Action — Real Copy Examples**". At least 3 short copy samples (1–3 sentences each) that calibrate briefs / captions / copy reviews. Each entry has a `context` (e.g. "Reel caption", "Email subject line", "DM reply to first-time saver") and a `sample` (the actual copy).

### Target Audience

Write 1–2 paragraphs (≥50 chars) synthesizing *who* this brand serves overall — the audience-level north star — that frames the per-segment profiles below. This is distinct from the segment-specific profiles: it is the unifying description of the audience as a whole.

### Audience Profiles

For each audience segment identified (typically 2-4):

- Demographics and psychographics
- Pain points (3-5 specific ones)
- Preferred channels with activity patterns
- Content hooks that resonate with this segment
- **`journeyMap`** — rendered under a per-segment "**Journey Map**" subsection. Exactly four phases in canonical order: `Discovery`, `Consideration`, `Conversion`, `Advocate`. For each phase emit a one-line `goal` (what the segment is doing then) and a one-line `contentMoment` (which pillar/format meets them). If the discovery data is silent for a phase, use the placeholder string for `goal` / `contentMoment` — never omit a phase.

### Competitor Landscape

For each competitor identified:

- Their platforms and strengths
- Their weaknesses/gaps
- Relevancy score to the client's audience

Then populate the structured comparison:

- **`differentiationMatrix`** — rendered under "**Differentiation Matrix**". At least 3 rows comparing Hive against the named competitors across competitor-relevant dimensions (e.g. "Audience specificity", "Tone", "Content format mix", "Posting cadence"). Each row has a `dimension`, Hive's `hive` value, and a `competitors` array with one `{ name, value }` cell per competitor compared.
- **`differentiationSummary`** — rendered under "**Differentiation Summary**". 2–3 sentence paragraph naming the lane Hive is winning and the wedge Hive is exploiting. If the discovery data is silent on this, emit the placeholder string.

### Content Pillars

Define 3-5 content pillars with:

- Name and description
- Content formats suited to this pillar
- Percentage share of total content
- **`contentIdeas`** — rendered under a per-pillar "**Content Ideas Bank**" subsection. Exactly 5 specific real post ideas per pillar (working titles or hooks, not categories). Each has a `title` and a one-line `angle`. Be concrete — reuse phrases from the discovery answers when relevant.

Total share must equal 100%.

### Channels & Cadence

For each recommended channel:

- Platform role (discovery, community, authority, etc.)
- Posting frequency
- Best posting times
- Primary content types for this channel

Then populate **`contentChannelMatrix`** — rendered under "**Content-Channel Matrix**". One row per content pillar showing where it lives:

- `pillar` — must match a `contentPillars[].name` exactly.
- `placements` — list of `{ channel, role }` entries, where `role` is either `"primary"` or `"occasional"`. Every active channel that the pillar uses gets an entry; channels the pillar should NOT use are simply omitted.

### Performance Scorecard

Define 6-10 metrics with:

- Current baseline (use "Baseline" if unknown)
- 30-day target
- 90-day target
- **`definition`** — a 1-sentence plain-language explanation of what this metric measures and how it's calculated. The strategist hands this to the client as-is during review.

Also populate the top-level **`reviewCadence`** field — rendered under "**Review Cadence**". 2–3 sentences describing when and how the scorecard is reviewed (weekly check-ins, 30-day pulse, 90-day strategic review, etc.).

### Quick Wins

List 8-10 specific, sequenced actions for the first 30 days. Be specific — reference actual content ideas, channel priorities, and measurement setup.
