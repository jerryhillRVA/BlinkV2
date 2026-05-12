import { AgenticFilesystemService } from './agentic-filesystem.service';

const SKIP = !process.env['AGENTIC_FS_URL'];
const TEST_TENANT = '__test_integration__';
const TEST_NAMESPACE = '__test_ns__';

(SKIP ? describe.skip : describe)('AgenticFilesystemService (integration)', () => {
  let service: AgenticFilesystemService;

  beforeAll(() => {
    service = new AgenticFilesystemService();
  });

  afterAll(async () => {
    // Delete the entire test tenant — removes all files, namespaces, and the tenant itself
    try {
      await service.deleteTenant(TEST_TENANT);
    } catch {
      // best-effort cleanup
    }
  });

  it('should upload, retrieve, and delete a JSON file', async () => {
    const filename = `test-crud-${Date.now()}.json`;
    const content = { hello: 'world', ts: Date.now() };

    // Create
    const uploaded = await service.uploadJsonFile(TEST_TENANT, TEST_NAMESPACE, filename, content);
    expect(uploaded.file_id).toBeTruthy();
    expect(uploaded.filename).toBe(filename);

    // Read
    const retrieved = await service.batchRetrieve(TEST_TENANT, [uploaded.file_id]);
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].content).toEqual(content);
    expect(retrieved[0].content_type).toBe('json');

    // Delete
    await service.deleteFile(TEST_TENANT, uploaded.file_id);

    // Confirm deleted
    const afterDelete = await service.batchRetrieve(TEST_TENANT, [uploaded.file_id]);
    expect(afterDelete[0].content_type).toBe('error');
  }, 15_000);

  it('should replace a file and retrieve updated content', async () => {
    const filename = `test-replace-${Date.now()}.json`;

    const uploaded = await service.uploadJsonFile(TEST_TENANT, TEST_NAMESPACE, filename, { version: 1 });

    await service.replaceJsonFile(TEST_TENANT, uploaded.file_id, filename, { version: 2 });

    const retrieved = await service.batchRetrieve(TEST_TENANT, [uploaded.file_id]);
    expect(retrieved[0].content).toEqual({ version: 2 });
  }, 15_000);

  it('should list uploaded file in directory', async () => {
    const filename = `test-list-${Date.now()}.json`;

    const uploaded = await service.uploadJsonFile(TEST_TENANT, TEST_NAMESPACE, filename, { listed: true });

    const entries = await service.listDirectory(TEST_TENANT, TEST_NAMESPACE);
    const found = entries.find((e) => e.file_id === uploaded.file_id);
    expect(found).toBeTruthy();
    if (!found) throw new Error('uploaded file not in directory listing');
    expect(found.name).toBe(filename);
  }, 15_000);

  it('should list tenants', async () => {
    const tenants = await service.listTenants();
    expect(Array.isArray(tenants)).toBe(true);
  }, 15_000);

  it('should round-trip a content item with the new ProductionBriefContract fields (#112)', async () => {
    const filename = `test-brief-roundtrip-${Date.now()}.json`;
    const item = {
      id: 'integration-post-1',
      stage: 'post',
      status: 'in-progress',
      title: 'Integration test post',
      description: 'a'.repeat(80),
      pillarIds: ['p1'],
      segmentIds: ['s1'],
      production: {
        productionStep: 'brief',
        brief: {
          // The seven new fields from #112
          referenceLinks: ['https://a.com', 'https://b.com'],
          dueDate: '2026-12-01',
          campaignName: 'Instagram_reel_2026-12-01',
          publishingMode: 'PAID_BOOSTED',
          primaryCta: 'shop-now',
          approvalNote: 'Looks good — locked for Q4 push.',
          unlockedAt: '2026-11-28T08:30:00.000Z',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const uploaded = await service.uploadJsonFile(TEST_TENANT, TEST_NAMESPACE, filename, item);
    const retrieved = await service.batchRetrieve(TEST_TENANT, [uploaded.file_id]);
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].content_type).toBe('json');
    expect(retrieved[0].content).toEqual(item);
    // Spot-check the brief sub-object survived intact.
    const brief = (retrieved[0].content as { production: { brief: Record<string, unknown> } })
      .production.brief;
    expect(brief.referenceLinks).toEqual(['https://a.com', 'https://b.com']);
    expect(brief.publishingMode).toBe('PAID_BOOSTED');
    expect(brief.primaryCta).toBe('shop-now');
    expect(brief.unlockedAt).toBe('2026-11-28T08:30:00.000Z');
  }, 15_000);

  it('should round-trip a content item with ProductionDraftContract.video (#114)', async () => {
    const filename = `test-draft-roundtrip-${Date.now()}.json`;
    const item = {
      id: 'integration-post-draft-1',
      stage: 'post',
      status: 'in-progress',
      title: 'Integration test draft',
      description: 'a'.repeat(80),
      pillarIds: ['p1'],
      segmentIds: ['s1'],
      production: {
        productionStep: 'draft',
        draft: {
          mode: 'VIDEO',
          video: {
            hook: 'Test hook',
            body: 'Test body',
            cta: 'Test CTA',
            hookBank: ['alt 1', 'alt 2'],
            targetDuration: '60s',
            bRollNotes: 'B-roll notes',
            voiceoverNotes: 'VO notes',
            shotList: [
              { id: 'sl-1', type: 'Shot', description: 'Open on smile', duration: '0:00–0:03' },
              { id: 'sl-2', type: 'CTA', description: 'Outro', duration: '0:55–1:00' },
            ],
          },
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const uploaded = await service.uploadJsonFile(TEST_TENANT, TEST_NAMESPACE, filename, item);
    const retrieved = await service.batchRetrieve(TEST_TENANT, [uploaded.file_id]);
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].content).toEqual(item);
    // Spot-check the draft.video sub-object survived intact.
    const draft = (retrieved[0].content as { production: { draft: Record<string, unknown> } })
      .production.draft;
    expect(draft.mode).toBe('VIDEO');
    const video = draft.video as { hook: string; shotList: unknown[] };
    expect(video.hook).toBe('Test hook');
    expect(video.shotList).toHaveLength(2);
  }, 15_000);

  it('should round-trip a content item with ProductionPackagingContract.instagram (#116)', async () => {
    const filename = `test-packaging-roundtrip-${Date.now()}.json`;
    const item = {
      id: 'integration-post-packaging-1',
      stage: 'post',
      status: 'in-progress',
      title: 'Integration test packaging',
      description: 'p'.repeat(80),
      pillarIds: ['p1'],
      segmentIds: ['s1'],
      platform: 'instagram',
      contentType: 'reel',
      production: {
        productionStep: 'packaging',
        packaging: {
          platform: 'instagram',
          instagram: {
            caption: 'Caption with hashtags #wellness #mobility',
            hashtags: ['wellness', 'mobility', 'morningroutine'],
            link: 'https://example.com/landing',
            utm: {
              source: 'instagram',
              medium: 'social',
              campaign: 'launch-q3',
              content: 'reel-mobility',
            },
            audio: {
              trackId: 'audio-1',
              trackName: 'Morning Glow',
              artistName: 'Loop Studio',
              source: 'trending',
            },
            platformControls: {
              visibility: 'public',
              allowComments: true,
            },
          },
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const uploaded = await service.uploadJsonFile(TEST_TENANT, TEST_NAMESPACE, filename, item);
    const retrieved = await service.batchRetrieve(TEST_TENANT, [uploaded.file_id]);
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].content).toEqual(item);
    // Spot-check the packaging.instagram sub-object survived intact.
    const packaging = (
      retrieved[0].content as { production: { packaging: Record<string, unknown> } }
    ).production.packaging;
    expect(packaging.platform).toBe('instagram');
    const ig = packaging.instagram as {
      caption: string;
      hashtags: string[];
      utm: { source: string };
      audio: { trackId: string };
    };
    expect(ig.caption).toContain('#mobility');
    expect(ig.hashtags).toHaveLength(3);
    expect(ig.utm.source).toBe('instagram');
    expect(ig.audio.trackId).toBe('audio-1');
  }, 15_000);
});
