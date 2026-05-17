import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ContentMetricsContract, PlatformContract } from '@blinksocial/contracts';
import { PerformanceCardComponent } from './performance-card.component';

function setup(opts: {
  metrics?: ContentMetricsContract;
  platform?: PlatformContract;
} = {}): ComponentFixture<PerformanceCardComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PerformanceCardComponent] });
  const fixture = TestBed.createComponent(PerformanceCardComponent);
  if (opts.metrics !== undefined) fixture.componentRef.setInput('metrics', opts.metrics);
  if (opts.platform !== undefined) fixture.componentRef.setInput('platform', opts.platform);
  fixture.detectChanges();
  return fixture;
}

describe('PerformanceCardComponent', () => {
  it('renders empty-state when metrics is undefined', () => {
    const fixture = setup({ platform: 'instagram' });
    expect(fixture.nativeElement.querySelector('.perf-empty')?.textContent?.trim()).toBe(
      'No performance data yet. Add the live post link to enable tracking.',
    );
    expect(fixture.nativeElement.querySelector('.perf-rows')).toBeNull();
  });

  it('renders explicit-zero values as "0", not "—"', () => {
    const fixture = setup({
      platform: 'instagram',
      metrics: { views: 0, likes: 0, comments: 0 },
    });
    const rows = fixture.nativeElement.querySelectorAll('.perf-row');
    expect(rows.length).toBe(7);  // instagram has 7 rows; missing ones render '—'
    expect(rows[0].querySelector('.perf-row-value')?.textContent?.trim()).toBe('0');
    expect(rows[1].querySelector('.perf-row-value')?.textContent?.trim()).toBe('0');
    expect(rows[2].querySelector('.perf-row-value')?.textContent?.trim()).toBe('0');
  });

  it('renders populated metrics with toLocaleString + percentage for engagementRate', () => {
    const fixture = setup({
      platform: 'instagram',
      metrics: {
        views: 12400,
        likes: 847,
        comments: 63,
        shares: 124,
        saves: 312,
        engagementRate: 0.042,
        reach: 10800,
      },
    });
    const values = Array.from(
      fixture.nativeElement.querySelectorAll('.perf-row-value'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(values[0]).toBe((12400).toLocaleString());
    expect(values[1]).toBe('847');
    expect(values[2]).toBe('63');
    expect(values[3]).toBe('124');
    expect(values[4]).toBe('312');
    expect(values[5]).toBe('4.2%');
    expect(values[6]).toBe((10800).toLocaleString());
  });

  it('platform-specific rows: YouTube renders 5 rows including watchTime', () => {
    const fixture = setup({
      platform: 'youtube',
      metrics: { views: 100, likes: 10, comments: 5, engagementRate: 0.05, watchTime: 300 },
    });
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.perf-row-label'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(labels).toEqual(['Views', 'Likes', 'Comments', 'Engagement rate', 'Watch time']);
  });

  it('platform-specific rows: TikTok omits Reach + Impressions + Watch time', () => {
    const fixture = setup({
      platform: 'tiktok',
      metrics: { views: 100 },
    });
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.perf-row-label'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(labels).toEqual(['Views', 'Likes', 'Comments', 'Shares', 'Saves', 'Engagement rate']);
  });

  it('missing metric in populated set renders "—"', () => {
    const fixture = setup({
      platform: 'instagram',
      metrics: { views: 100 },
    });
    const rows = fixture.nativeElement.querySelectorAll('.perf-row-value');
    expect((rows[0] as HTMLElement).textContent?.trim()).toBe('100');
    expect((rows[1] as HTMLElement).textContent?.trim()).toBe('—');
  });

  it('refresh button emits refresh event', () => {
    const fixture = setup({ platform: 'instagram' });
    let count = 0;
    fixture.componentInstance.refresh.subscribe(() => count++);
    (fixture.nativeElement.querySelector('.perf-refresh-btn') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });
});
