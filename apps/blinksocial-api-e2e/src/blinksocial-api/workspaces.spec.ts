import axios from 'axios';

const validPayload = {
  general: { workspaceName: 'E2E Test Workspace' },
  platforms: {
    globalRules: { defaultPlatform: 'youtube', maxIdeasPerMonth: 30 },
    platforms: [{ platformId: 'youtube', enabled: true }],
  },
  brandVoice: {},
  contentPillars: [
    { id: 'p1', name: 'News', description: 'News pillar', color: '#d94e33' },
  ],
  audienceSegments: [
    { id: 's1', name: 'Engineers', description: 'Dev audience' },
  ],
  skills: {
    skills: [
      { id: 'sk1', skillId: 'reporter', name: 'Reporter', role: 'News' },
    ],
  },
};

describe('POST /api/workspaces', () => {
  it('should return 201 with valid payload', async () => {
    const res = await axios.post('/api/workspaces', validPayload);
    expect(res.status).toBe(201);
    expect(res.data).toEqual(
      expect.objectContaining({
        workspaceName: 'E2E Test Workspace',
        status: 'active',
      })
    );
    expect(res.data.id).toBeDefined();
    expect(res.data.createdAt).toBeDefined();
  });

  it('should return 400 with missing workspaceName', async () => {
    const invalidPayload = {
      ...validPayload,
      general: {},
    };
    try {
      await axios.post('/api/workspaces', invalidPayload);
      fail('Expected 400 error');
    } catch (err: unknown) {
      const error = err as { response: { status: number; data: { message: string } } };
      expect(error.response.status).toBe(400);
      expect(error.response.data.message).toBe('Validation failed');
    }
  });
});
