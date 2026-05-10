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
});
