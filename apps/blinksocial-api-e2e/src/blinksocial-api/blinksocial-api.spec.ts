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

describe('GET /api/workspaces', () => {
  it('should return workspaces array', async () => {
    const res = await axios.get(`/api/workspaces`);

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('workspaces');
    expect(Array.isArray(res.data.workspaces)).toBe(true);
  });
});
