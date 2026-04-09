import { TestBed } from '@angular/core/testing';
import { MockDataService } from './mock-data.service';

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockDataService);
  });

  it('returns true for known mock features by default', () => {
    expect(service.isMock('brand-voice')).toBe(true);
    expect(service.isMock('audience')).toBe(true);
    expect(service.isMock('strategic-pillars')).toBe(true);
  });

  it('returns false for unknown features', () => {
    expect(service.isMock('does-not-exist')).toBe(false);
  });

  it('markReal flips a feature to false', () => {
    expect(service.isMock('brand-voice')).toBe(true);
    service.markReal('brand-voice');
    expect(service.isMock('brand-voice')).toBe(false);
  });

  it('markMock flips a feature back to true', () => {
    service.markReal('audience');
    expect(service.isMock('audience')).toBe(false);
    service.markMock('audience');
    expect(service.isMock('audience')).toBe(true);
  });

  it('snapshot returns a reactive view of the state', () => {
    const before = service.snapshot();
    expect(before['channel-strategy']).toBe(true);
    service.markReal('channel-strategy');
    expect(service.snapshot()['channel-strategy']).toBe(false);
  });
});
