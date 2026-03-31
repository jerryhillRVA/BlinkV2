# Mapping Guide

## Platform Enum Values and Aliases

Map channel names from the blueprint to these valid Platform enum values:

| Platform Enum | Aliases / Common Names |
|--------------|----------------------|
| `instagram` | Instagram, Instagram Reels, IG, Insta |
| `tiktok` | TikTok, Tik Tok |
| `youtube` | YouTube, Youtube, YT, YouTube Shorts |
| `facebook` | Facebook, FB, Meta |
| `linkedin` | LinkedIn, Linkedin |
| `twitter` | Twitter, X, Twitter/X |
| `slack` | Slack |
| `discord` | Discord |
| `tbd` | Blog, Email, Newsletter, Website, Pinterest, Threads, Snapchat, WhatsApp, Telegram, Other |

If a channel does not match any alias above, use `tbd`.

## Pillar Color Palette

Assign colors from this palette in order. Cycle back to the start if there are more pillars than colors.

1. `#7C3AED` (purple)
2. `#059669` (green)
3. `#2563EB` (blue)
4. `#D97706` (amber)
5. `#DC2626` (red)
6. `#0891B2` (cyan)
7. `#7C2D12` (brown)
8. `#4338CA` (indigo)

## Frequency Conversion Table

Convert frequency descriptions to approximate monthly post counts:

| Frequency Description | Monthly Count |
|----------------------|--------------|
| Daily | 30 |
| 2x daily | 60 |
| 3x/week, 3 times a week | 12 |
| 2x/week, twice a week | 8 |
| Weekly, 1x/week | 4 |
| Bi-weekly, every 2 weeks | 2 |
| Monthly, 1x/month | 1 |
| 2x/month | 2 |
| 3x/month | 3 |

For any other format, estimate the monthly count as best you can.

## Default Agent Skill Templates

### Content Writer
```json
{
  "id": "content-writer",
  "skillId": "content-writer",
  "name": "Content Writer",
  "role": "Content Creation",
  "responsibilities": ["Draft social media posts", "Write captions and copy", "Adapt content for different platforms"],
  "enabled": true
}
```

### Social Strategist
```json
{
  "id": "social-strategist",
  "skillId": "social-strategist",
  "name": "Social Strategist",
  "role": "Strategy & Planning",
  "responsibilities": ["Develop content calendar", "Identify trending topics", "Plan campaign strategies"],
  "enabled": true
}
```

### Community Manager
```json
{
  "id": "community-manager",
  "skillId": "community-manager",
  "name": "Community Manager",
  "role": "Engagement & Community",
  "responsibilities": ["Draft responses to comments", "Monitor engagement trends", "Suggest community initiatives"],
  "enabled": true
}
```

### Analytics Reporter
```json
{
  "id": "analytics-reporter",
  "skillId": "analytics-reporter",
  "name": "Analytics Reporter",
  "role": "Performance Analysis",
  "responsibilities": ["Summarize performance metrics", "Identify top-performing content", "Recommend optimizations"],
  "enabled": true
}
```
