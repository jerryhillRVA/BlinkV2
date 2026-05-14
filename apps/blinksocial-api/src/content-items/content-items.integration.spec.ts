import { ContentItemsService } from './content-items.service';
import { AgenticFilesystemService } from '../agentic-filesystem/agentic-filesystem.service';
import type {
  ContentItemContract,
  ProductionBriefContract,
  ProductionDraftContract,
  ProductionPackagingContract,
  ProductionQAContract,
} from '@blinksocial/contracts';

/**
 * Ticket #126: full-lifecycle integration test for the content workflow
 * against a real Agentic Filesystem. Skips when `AGENTIC_FS_URL` is unset
 * — matches the pattern in `agentic-filesystem.integration.spec.ts`.
 *
 * Scope: end-to-end Idea → Concept → IG-Reel Post create / patch / get /
 * delete cycle including the New ↔ Used cascade from #117 and the field-
 * complete persistence requirement from #126.
 */

const SKIP = !process.env['AGENTIC_FS_URL'];
const TEST_TENANT = `__test_content_items_${Math.random().toString(36).slice(2, 10)}__`;

function buildBrief(): ProductionBriefContract {
  return {
    strategy: {
      objective: 'engagement',
      audienceSegmentIds: ['s4'],
      pillarIds: ['p1'],
      keyMessage: 'A 60-second flow can transform your mornings',
      ctaType: 'follow',
      ctaText: 'Follow for daily flows',
      tonePreset: 'casual',
      doChecklist: ['Show clear form cues', 'Keep energy upbeat'],
      dontChecklist: ['No complex transitions', 'Avoid medical claims'],
    },
    platformRules: {
      durationTarget: 60,
      hookType: 'outcome-first',
      loopEnding: true,
    },
    creativePlan: {
      hook: "Your body shouldn't feel 80 when you're 40.",
      storyArc: 'hook-promise-sections-recap-cta',
      musicNotes: 'Lo-fi ambient beat',
    },
    compliance: { containsClaims: false, disclosureNeeded: false },
    canonicalType: 'VIDEO_SHORT_VERTICAL',
    hasTalent: true,
    hasMusic: true,
    needsAccessibility: true,
    referenceLinks: ['https://example.com/ref1', 'https://example.com/ref2'],
    dueDate: '2026-12-01',
    campaignName: 'Spring Mobility',
    destinationUrl: 'https://hive.fit/morning',
    legalApprover: 'user-brett',
    publishingMode: 'PAID_BOOSTED',
    primaryCta: 'shop-now',
    approvalNote: 'Pending legal sign-off',
    unlockedAt: '2026-11-28T08:30:00.000Z',
  };
}

function buildDraft(): ProductionDraftContract {
  return {
    mode: 'VIDEO',
    video: {
      hook: "Your body shouldn't feel 80 when you're 40.",
      body: 'Three minutes a day. No equipment.',
      cta: 'Save this — your tomorrow self will thank you.',
      hookBank: [
        "Your body shouldn't feel 80 when you're 40.",
        'No gym. No equipment. Just movement.',
      ],
      coverAssetRef: 'cover-asset-1.jpg',
      targetDuration: '60s',
      bRollNotes: 'Window light, no harsh shadows',
      voiceoverNotes: 'Soft, warm tone',
      shotList: [
        { id: 'sl-1', type: 'Shot', description: 'Open on smile', duration: '0:00–0:03' },
        { id: 'sl-2', type: 'CTA', description: 'Outro', duration: '0:55–1:00' },
      ],
    },
  };
}

function buildPackaging(): ProductionPackagingContract {
  return {
    platform: 'instagram',
    instagram: {
      caption: 'Test caption with #morningflow hashtag',
      hashtags: ['morningflow', 'mobility'],
      link: 'https://hive.fit/r/123',
      utm: {
        source: 'ig',
        medium: 'paid',
        campaign: 'spring',
        content: 'reel',
        term: 'mobility',
      },
      audio: {
        trackId: 'audio-1',
        trackName: 'Morning Glow',
        artistName: 'Loop Studio',
        artworkUrl: 'https://example.com/art.jpg',
        previewUrl: 'https://example.com/preview.mp3',
        source: 'trending',
      },
      coverAsset: 'morning-mobility-cover.jpg',
      coverAssetUrl: 'data:image/jpeg;base64,/9j/4AAQ',
      peopleTags: ['@yoga-instructor'],
      productTags: ['mat-pro'],
      reelsCoverTag: 'Morning Flow',
      platformControls: {
        ig: {
          commentsOff: true,
          hideLikeCount: true,
          paidPartnership: true,
          collaboratorTag: '@brand-co',
        },
      },
    },
  };
}

function buildQA(): ProductionQAContract {
  return {
    approvals: [
      {
        role: 'brand-reviewer',
        label: 'Brand Reviewer',
        required: true,
        status: 'approved',
        timestamp: '2026-03-07T14:00:00Z',
        note: 'Looks great',
      },
      {
        role: 'publisher',
        label: 'Publisher',
        required: true,
        status: 'pending',
      },
    ],
    approved: false,
    qaApprovedAt: undefined,
    qaApprovedBy: undefined,
    publishConfig: {
      publishAction: 'schedule',
      scheduleAt: '2026-05-20T10:00:00.000Z',
      visibility: 'public',
      madeForKids: false,
      accountId: 'acct-1',
      deliveryMethod: 'auto',
      notifyTeam: true,
      notifyFollowers: false,
    },
  };
}

(SKIP ? describe.skip : describe)('ContentItemsService (integration, AFS)', () => {
  let svc: ContentItemsService;
  let fs: AgenticFilesystemService;

  beforeAll(() => {
    fs = new AgenticFilesystemService();
    // mockDataService not needed — fs.isConfigured() is true in this env.
    svc = new ContentItemsService(fs, null);
  });

  afterAll(async () => {
    try {
      await fs.deleteTenant(TEST_TENANT);
    } catch {
      // best-effort cleanup
    }
  });

  it('full lifecycle: Idea → Concept → IG-Reel Post with cascade + field round-trip + cleanup', async () => {
    // 1. Create Idea
    const idea = await svc.createItem(TEST_TENANT, {
      stage: 'idea',
      status: 'new',
      title: 'Integration test idea',
      description: 'idea-desc',
      pillarIds: ['p1'],
      segmentIds: ['s4'],
    });
    expect(idea.status).toBe('new');

    // 2. Create Concept under the Idea — parent should flip to `used`
    const concept = await svc.createItem(TEST_TENANT, {
      stage: 'concept',
      status: 'new',
      title: 'Integration test concept',
      description: 'concept-desc',
      pillarIds: ['p1'],
      segmentIds: ['s4'],
      parentIdeaId: idea.id,
    });
    expect(concept.status).toBe('new');
    {
      const refreshedIdea = await svc.getItem(TEST_TENANT, idea.id);
      expect(refreshedIdea.status).toBe('used');
    }

    // 3. Create IG-Reel Post under the Concept — parent flips to `used`
    const post = await svc.createItem(TEST_TENANT, {
      stage: 'post',
      status: 'in-progress',
      title: 'Integration test post',
      description: 'post-desc',
      pillarIds: ['p1'],
      segmentIds: ['s4'],
      platform: 'instagram',
      contentType: 'reel',
      parentConceptId: concept.id,
      conceptId: concept.id,
    });
    expect(post.status).toBe('in-progress');
    expect(post.parentConceptId).toBe(concept.id);
    {
      const refreshedConcept = await svc.getItem(TEST_TENANT, concept.id);
      expect(refreshedConcept.status).toBe('used');
    }

    // 4. Patch every Brief/Draft/Packaging/QA field + top-level metadata
    const brief = buildBrief();
    const draft = buildDraft();
    const packaging = buildPackaging();
    const qa = buildQA();
    await svc.updateItem(TEST_TENANT, post.id, {
      title: 'Updated title',
      description: 'updated description',
      owner: 'user-brett',
      objective: 'engagement',
      keyMessage: 'Updated key message',
      tonePreset: 'casual',
      hook: 'Updated hook',
      cta: { type: 'follow', text: 'Follow for daily flows' },
      tags: ['mobility', 'morning-routine'],
      briefApproved: true,
      briefApprovedAt: '2026-02-22T10:00:00Z',
      briefApprovedBy: 'user-brett',
      targetPublishWindow: {
        start: '2026-03-10T00:00:00Z',
        end: '2026-03-14T23:59:59Z',
      },
      scheduledDate: '2026-03-12',
      production: {
        productionStep: 'qa',
        brief,
        draft,
        packaging,
        qa,
      },
    } as unknown as Parameters<ContentItemsService['updateItem']>[2]);

    // 5. Read back and deep-equal every slot
    const fetched = await svc.getItem(TEST_TENANT, post.id);
    expect(fetched.title).toBe('Updated title');
    expect(fetched.briefApproved).toBe(true);
    expect(fetched.production?.productionStep).toBe('qa');
    expect(fetched.production?.brief).toEqual(brief);
    expect(fetched.production?.draft).toEqual(draft);
    expect(fetched.production?.packaging).toEqual(packaging);
    expect(fetched.production?.qa).toEqual(qa);

    // 6. Delete the post — concept should flip back to `new`
    await svc.deleteItem(TEST_TENANT, post.id);
    {
      const refreshedConcept = await svc.getItem(TEST_TENANT, concept.id);
      expect(refreshedConcept.status).toBe('new');
    }

    // 7. Delete the concept — idea should flip back to `new`
    await svc.deleteItem(TEST_TENANT, concept.id);
    {
      const refreshedIdea = await svc.getItem(TEST_TENANT, idea.id);
      expect(refreshedIdea.status).toBe('new');
    }

    // 8. Delete the idea
    await svc.deleteItem(TEST_TENANT, idea.id);
  }, 60_000);

  it('concurrent multi-target Move-to-Production lands all N posts and flips parent once', async () => {
    const concept = await svc.createItem(TEST_TENANT, {
      stage: 'concept',
      status: 'new',
      title: 'Concurrent parent',
      description: '',
      pillarIds: [],
      segmentIds: [],
    });

    const N = 3;
    const created = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        svc.createItem(TEST_TENANT, {
          stage: 'post',
          status: 'in-progress',
          title: `Concurrent post ${i + 1}`,
          description: '',
          pillarIds: [],
          segmentIds: [],
          platform: 'instagram',
          contentType: 'reel',
          parentConceptId: concept.id,
          conceptId: concept.id,
        }),
      ),
    );
    expect(new Set(created.map((c: ContentItemContract) => c.id)).size).toBe(N);

    const refreshedConcept = await svc.getItem(TEST_TENANT, concept.id);
    expect(refreshedConcept.status).toBe('used');

    const index = await svc.getIndex(TEST_TENANT);
    const childRows = index.items.filter((r) => r.parentConceptId === concept.id);
    expect(childRows).toHaveLength(N);

    // Cleanup
    for (const c of created) await svc.deleteItem(TEST_TENANT, c.id);
    await svc.deleteItem(TEST_TENANT, concept.id);
  }, 60_000);

  it('sendConceptBack against AFS cascades + flips concept to new', async () => {
    const concept = await svc.createItem(TEST_TENANT, {
      stage: 'concept',
      status: 'new',
      title: 'Send-back parent',
      description: '',
      pillarIds: [],
      segmentIds: [],
    });
    const live1 = await svc.createItem(TEST_TENANT, {
      stage: 'post',
      status: 'in-progress',
      title: 'live 1',
      description: '',
      pillarIds: [],
      segmentIds: [],
      parentConceptId: concept.id,
    });
    const live2 = await svc.createItem(TEST_TENANT, {
      stage: 'post',
      status: 'in-progress',
      title: 'live 2',
      description: '',
      pillarIds: [],
      segmentIds: [],
      parentConceptId: concept.id,
    });
    const archived = await svc.createItem(TEST_TENANT, {
      stage: 'post',
      status: 'in-progress',
      title: 'archived',
      description: '',
      pillarIds: [],
      segmentIds: [],
      parentConceptId: concept.id,
    });
    await svc.archiveItem(TEST_TENANT, archived.id);

    const result = await svc.sendConceptBack(TEST_TENANT, concept.id);
    expect(result.conceptStatus).toBe('new');
    expect(result.archivedPostIds.sort()).toEqual([live1.id, live2.id].sort());
    expect(result.alreadyArchivedPostIds).toEqual([archived.id]);

    for (const id of [live1.id, live2.id, archived.id]) {
      const p = await svc.getItem(TEST_TENANT, id);
      expect(p.archived).toBe(true);
    }
    const refreshedConcept = await svc.getItem(TEST_TENANT, concept.id);
    expect(refreshedConcept.status).toBe('new');

    // Cleanup
    for (const id of [live1.id, live2.id, archived.id]) {
      await svc.deleteItem(TEST_TENANT, id);
    }
    await svc.deleteItem(TEST_TENANT, concept.id);
  }, 60_000);
});
