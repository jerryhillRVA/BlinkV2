import { TestBed } from '@angular/core/testing';
import { SectionProgressComponent } from './section-progress.component';
import { Component } from '@angular/core';
import type { DiscoverySectionContract, DiscoverySectionId } from '@blinksocial/contracts';

@Component({
  imports: [SectionProgressComponent],
  template: `<app-section-progress [sections]="sections" [currentSection]="currentSection" />`,
})
class TestHostComponent {
  sections: DiscoverySectionContract[] = [
    { id: 'business', name: 'Business Overview', covered: true },
    { id: 'brand_voice', name: 'Brand & Voice', covered: false },
    { id: 'audience', name: 'Audience', covered: false },
    { id: 'competitors', name: 'Competitors', covered: false },
    { id: 'content', name: 'Content Strategy', covered: false },
    { id: 'channels', name: 'Channels & Capacity', covered: false },
    { id: 'expectations', name: 'Expectations & Goals', covered: false },
  ];
  currentSection: DiscoverySectionId = 'brand_voice';
}

describe('SectionProgressComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render all 7 sections', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const steps = fixture.nativeElement.querySelectorAll('.progress-step');
    expect(steps.length).toBe(7);
  });

  it('should mark covered sections', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const covered = fixture.nativeElement.querySelectorAll('.covered');
    expect(covered.length).toBe(1);
  });

  it('should mark active section', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.active');
    expect(active).toBeTruthy();
    expect(active.querySelector('.step-label').textContent.trim()).toBe('Brand & Voice');
  });
});
