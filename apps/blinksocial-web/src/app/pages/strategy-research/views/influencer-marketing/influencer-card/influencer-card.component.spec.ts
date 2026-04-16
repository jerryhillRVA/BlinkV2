import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InfluencerCardComponent } from './influencer-card.component';
import type { InfluencerProfile } from '../../../strategy-research.types';

describe('InfluencerCardComponent', () => {
  let component: InfluencerCardComponent;
  let componentRef: ComponentRef<InfluencerCardComponent>;
  let fixture: ReturnType<typeof TestBed.createComponent<InfluencerCardComponent>>;
  let nativeElement: HTMLElement;

  const sampleProfile: InfluencerProfile = {
    id: 'inf-1',
    name: 'Maya Chen',
    handle: '@mayachen',
    platforms: ['instagram', 'tiktok'],
    tier: 'micro',
    followers: 48200,
    engagementRate: 5.8,
    niche: ['fitness', 'wellness'],
    audienceAlignment: 89,
    objectiveFit: ['growth', 'engagement'],
    bio: 'Fitness creator',
    avatarColor: '#6366f1',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InfluencerCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(InfluencerCardComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('profile', sampleProfile);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders name, handle, tier and followers', () => {
    expect(nativeElement.textContent).toContain('Maya Chen');
    expect(nativeElement.textContent).toContain('@mayachen');
    expect(nativeElement.textContent).toContain('Micro');
    expect(nativeElement.textContent).toContain('48.2K');
    expect(nativeElement.textContent).toContain('5.8%');
  });

  it('renders audience match progress', () => {
    const fill = nativeElement.querySelector<HTMLElement>('.influencer-card__match-fill');
    expect(fill?.style.width).toBe('89%');
  });

  it('renders objective-fit chips with emojis', () => {
    const chips = nativeElement.querySelectorAll('.influencer-card__fit-chip');
    expect(chips).toHaveLength(2);
    expect(chips[0].textContent).toContain('Growth');
    expect(chips[1].textContent).toContain('Engagement');
  });

  it('emits shortlist event when Shortlist button clicked', () => {
    const spy = vi.fn();
    component.shortlist.subscribe(spy);
    const buttons = nativeElement.querySelectorAll('.influencer-card__btn');
    (buttons[0] as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith(sampleProfile);
  });

  it('emits outreach event when Outreach button clicked', () => {
    const spy = vi.fn();
    component.outreach.subscribe(spy);
    const buttons = nativeElement.querySelectorAll('.influencer-card__btn');
    (buttons[1] as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith(sampleProfile);
  });

  it('emits dismiss event when × button clicked', () => {
    const spy = vi.fn();
    component.dismiss.subscribe(spy);
    (nativeElement.querySelector('.influencer-card__dismiss') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith(sampleProfile);
  });

  it('disables shortlist button when already shortlisted', () => {
    componentRef.setInput('isShortlisted', true);
    fixture.detectChanges();
    const btn = nativeElement.querySelectorAll<HTMLButtonElement>('.influencer-card__btn')[0];
    expect(btn?.disabled).toBe(true);
    expect(btn?.textContent?.trim()).toBe('Shortlisted');
  });

  it('hides objective fit section when empty', () => {
    componentRef.setInput('profile', { ...sampleProfile, objectiveFit: [] });
    fixture.detectChanges();
    expect(nativeElement.querySelector('.influencer-card__fit')).toBeNull();
  });

  it('computes initials for single-name profile', () => {
    componentRef.setInput('profile', { ...sampleProfile, name: 'Maya' });
    fixture.detectChanges();
    expect(nativeElement.querySelector('.influencer-card__avatar')?.textContent?.trim()).toBe('MA');
  });
});
