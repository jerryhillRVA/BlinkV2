import { TestBed } from '@angular/core/testing';
import { ReviewStubComponent } from './review-stub.component';

describe('ReviewStubComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewStubComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ReviewStubComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render stub title', () => {
    const fixture = TestBed.createComponent(ReviewStubComponent);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.stub-title');
    expect(title.textContent).toContain('Review & Scheduling');
  });
});
