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
    expect(found!.name).toBe(filename);
  }, 15_000);

  it('should list tenants', async () => {
    const tenants = await service.listTenants();
    expect(Array.isArray(tenants)).toBe(true);
  }, 15_000);
});
