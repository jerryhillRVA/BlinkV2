import axios from 'axios';

describe('GET /api/health', () => {
  it('should return status ok', async () => {
    const res = await axios.get(`/api/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual(
      expect.objectContaining({ status: 'ok', service: 'blinksocial-api' })
    );
  });
});

describe('GET /api/workspaces/:id/settings/:tab', () => {
  it('should return settings for a mock workspace', async () => {
    const res = await axios.get(`/api/workspaces/hive-collective/settings/general`);

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('workspaceName');
  });

  it('should return 404 for unknown workspace', async () => {
    try {
      await axios.get(`/api/workspaces/unknown/settings/general`);
      fail('Expected 404');
    } catch (e) {
      expect(e.response.status).toBe(404);
    }
  });
});
