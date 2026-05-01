Apply the requested revision to the existing Blueprint and re-emit the
full document.

You MUST call the `submit_blueprint` tool exactly once. The tool's `input`
field IS the revised Blueprint document. Do NOT wrap it in code fences. Do
NOT emit free-form prose alongside the tool call.

# Mode

MODE: BLUEPRINT_REVISION — the user has confirmed a revision plan in the
chat. Apply ONLY the changes implied by the revision conversation below;
preserve every unrelated section of the prior Blueprint VERBATIM.

# Existing Blueprint

```json
{{priorBlueprintJson}}
```

# Revision conversation since generation

```
{{revisionTranscript}}
```

# Original discovery data (for grounding — do not duplicate or restate)

```json
{{discoveryDataJson}}
```

{{businessNameDirective}}

# Required-field checklist

The revised Blueprint MUST satisfy every constraint below. The schema is
enforced on tool input; a missing field or short string fails validation
and forces a retry. Read this list before composing the tool input.

{{requiredFieldsChecklist}}

# Hard rules — revision-specific

- Preserve every section of the existing Blueprint VERBATIM unless the
  revision conversation explicitly asks to change it. If the user asked
  to "tighten the strategic summary", change `strategicSummary` and
  nothing else. If they asked to "add a 1:1 coaching objective", append
  to `businessObjectives` and update only the sections that depend on it.
- Do NOT regenerate sections that weren't touched by the revision request.
- Do NOT abbreviate, truncate, or "clean up" sections that are unchanged.
- Do NOT drop or rename content pillars unless explicitly asked. Every
  pillar in `contentPillars` MUST still appear as a row in
  `contentChannelMatrix`, and the row count must equal the pillar count.
- Do NOT change a `journeyMap`'s `phase` enum values; the four phases
  (Discovery, Consideration, Conversion, Advocate) are fixed.
- Do NOT use a `placement.role` other than `"primary"` or `"occasional"`.
- Do NOT wrap the tool input in markdown code fences.

Now compose the revised Blueprint and call `submit_blueprint`.
