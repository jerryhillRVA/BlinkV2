import axios from 'axios';

const workspaceId = 'hive-collective';

const validDraft = {
  title: 'Morning mobility flow',
  objective: 'engagement' as const,
  pillarIds: [],
  segmentIds: [],
};

describe('POST /api/ai-assist (draft scope)', () => {
  it('returns a stub description for scope=draft, field=concept-description', async () => {
    const res = await axios.post('/api/ai-assist', {
      scope: 'draft',
      workspaceId,
      field: 'concept-description',
      draft: validDraft,
    });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.data.values)).toBe(true);
    expect(res.data.values).toHaveLength(1);
    expect(typeof res.data.values[0]).toBe('string');
    expect(res.data.values[0].length).toBeGreaterThan(0);
  });

  it('returns a stub hook for scope=draft, field=concept-hook-angle', async () => {
    const res = await axios.post('/api/ai-assist', {
      scope: 'draft',
      workspaceId,
      field: 'concept-hook-angle',
      draft: validDraft,
    });
    expect(res.status).toBe(201);
    expect(res.data.values).toHaveLength(1);
    expect(typeof res.data.values[0]).toBe('string');
    expect(res.data.values[0].length).toBeGreaterThan(0);
  });

  it('returns 400 when a post-* field is requested on the draft scope', async () => {
    try {
      await axios.post('/api/ai-assist', {
        scope: 'draft',
        workspaceId,
        field: 'post-key-message',
        draft: validDraft,
      });
      fail('Expected 400');
    } catch (e) {
      const error = e as { response: { status: number; data: { message?: string } } };
      expect(error.response.status).toBe(400);
    }
  });

  it('returns 400 when draft.title is empty', async () => {
    try {
      await axios.post('/api/ai-assist', {
        scope: 'draft',
        workspaceId,
        field: 'concept-description',
        draft: { ...validDraft, title: '   ' },
      });
      fail('Expected 400');
    } catch (e) {
      const error = e as { response: { status: number } };
      expect(error.response.status).toBe(400);
    }
  });
});
