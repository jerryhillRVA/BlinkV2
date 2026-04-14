import { TestBed } from '@angular/core/testing';
import { PerformanceStubComponent } from './performance-stub.component';

describe('PerformanceStubComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceStubComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PerformanceStubComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render stub title', () => {
    const fixture = TestBed.createComponent(PerformanceStubComponent);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.stub-title');
    expect(title.textContent).toContain('Performance');
  });
});
