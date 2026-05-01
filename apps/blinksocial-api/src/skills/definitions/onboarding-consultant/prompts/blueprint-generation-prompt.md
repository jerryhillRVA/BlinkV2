Generate the Blink Blueprint document.

You MUST call the `submit_blueprint` tool exactly once. The tool's `input`
field IS the Blueprint document. Do NOT wrap it in code fences. Do NOT emit
free-form prose alongside the tool call.

# Mode

MODE: BLUEPRINT_GENERATION — first-time generation. Use the discovery data
and any uploaded reference materials below.

# Discovery data

```json
{{discoveryDataJson}}
```

{{businessNameDirective}}

# Required-field checklist

Every Blueprint MUST satisfy every constraint below. The schema is enforced
on tool input — a missing field or short string fails validation and forces
a retry. Read this list before composing the tool input.

{{requiredFieldsChecklist}}

# Hard rules

- Do NOT abbreviate, truncate, summarize, or paraphrase any required field
  to "save space". Every field above must be present in full.
- Do NOT omit any audience profile's `journeyMap` — every profile MUST have
  a 4-row map covering Discovery → Consideration → Conversion → Advocate
  (in that exact order, with those exact phase names). Three rows or five
  rows is invalid; the schema enforces minItems=4 / maxItems=4.
- Do NOT drop a content pillar from `contentChannelMatrix` — every pillar
  in `contentPillars` MUST appear as a row in `contentChannelMatrix`, and
  the row count must equal the pillar count.
- Do NOT use a `phase` value other than the four enum values above; do NOT
  use a `placement.role` other than `"primary"` or `"occasional"`.
- Do NOT wrap the tool input in markdown code fences. The Anthropic tool
  contract takes a JSON object directly.
- Do NOT echo the user's prompt or the discovery data back as prose in the
  Blueprint — synthesize, don't quote.

# One-shot shape example

A minimal-but-valid Blueprint shape for reference (lengths shown are
floors, not ceilings — exceed them with substantive prose):

```json
{
  "clientName": "Hive Collective",
  "deliveredDate": "2026-05-01",
  "strategicSummary": "<≥100 chars of executive prose summarising the strategy>",
  "strategyInPlainEnglish": "<≥30 chars>",
  "strategicDecisions": "<≥30 chars>",
  "businessObjectives": [
    {"objective":"…","category":"…","timeHorizon":"…","metric":"…"},
    {"objective":"…","category":"…","timeHorizon":"…","metric":"…"}
  ],
  "objectivesShapeContent": "<≥30 chars>",
  "brandVoice": {
    "positioningStatement": "…",
    "contentMission": "…",
    "voiceAttributes": [{"attribute":"…","description":"…"}],
    "doList": ["…"],
    "dontList": ["…"],
    "voiceInAction": [
      {"context":"…","sample":"…"},
      {"context":"…","sample":"…"},
      {"context":"…","sample":"…"}
    ]
  },
  "audienceProfiles": [
    {
      "name":"…","demographics":"…",
      "painPoints":["…"],"channels":["…"],"contentHook":"…",
      "journeyMap":[
        {"phase":"Discovery","goal":"…","contentMoment":"…"},
        {"phase":"Consideration","goal":"…","contentMoment":"…"},
        {"phase":"Conversion","goal":"…","contentMoment":"…"},
        {"phase":"Advocate","goal":"…","contentMoment":"…"}
      ]
    }
  ],
  "targetAudience": "<≥50 chars summarising the overall audience>",
  "competitorLandscape": [
    {"name":"…","platforms":["…"],"strengths":["…"],"gaps":["…"],"relevancy":"…"}
  ],
  "differentiationMatrix": [
    {"dimension":"…","hive":"…","competitors":[{"name":"…","value":"…"}]},
    {"dimension":"…","hive":"…","competitors":[{"name":"…","value":"…"}]},
    {"dimension":"…","hive":"…","competitors":[{"name":"…","value":"…"}]}
  ],
  "differentiationSummary": "<≥30 chars>",
  "contentPillars": [
    {"name":"…","description":"…","formats":["…"],"sharePercent":40,
     "contentIdeas":[
       {"title":"…","angle":"…"},{"title":"…","angle":"…"},
       {"title":"…","angle":"…"},{"title":"…","angle":"…"},
       {"title":"…","angle":"…"}
     ]},
    {"name":"…","description":"…","formats":["…"],"sharePercent":30,
     "contentIdeas":[
       {"title":"…","angle":"…"},{"title":"…","angle":"…"},
       {"title":"…","angle":"…"},{"title":"…","angle":"…"},
       {"title":"…","angle":"…"}
     ]}
  ],
  "channelsAndCadence": [
    {"channel":"…","role":"…","frequency":"…","bestTimes":"…","contentTypes":["…"]}
  ],
  "contentChannelMatrix": [
    {"pillar":"<must match contentPillars[0].name>",
     "placements":[{"channel":"…","role":"primary"}]},
    {"pillar":"<must match contentPillars[1].name>",
     "placements":[{"channel":"…","role":"occasional"}]}
  ],
  "performanceScorecard": [
    {"metric":"…","baseline":"…","thirtyDayTarget":"…","ninetyDayTarget":"…","definition":"<≥10 chars>"},
    {"metric":"…","baseline":"…","thirtyDayTarget":"…","ninetyDayTarget":"…","definition":"<≥10 chars>"},
    {"metric":"…","baseline":"…","thirtyDayTarget":"…","ninetyDayTarget":"…","definition":"<≥10 chars>"}
  ],
  "reviewCadence": "<≥30 chars>",
  "quickWins": ["<idea 1>", "<idea 2>", "<idea 3>"]
}
```

Now compose the actual Blueprint and call `submit_blueprint`.
