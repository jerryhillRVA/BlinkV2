import { TestBed } from '@angular/core/testing';
import { StrategyStubComponent } from './strategy-stub.component';

describe('StrategyStubComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrategyStubComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StrategyStubComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render stub title', () => {
    const fixture = TestBed.createComponent(StrategyStubComponent);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.stub-title');
    expect(title.textContent).toContain('Strategy & Research');
  });

  it('should render stub description', () => {
    const fixture = TestBed.createComponent(StrategyStubComponent);
    fixture.detectChanges();
    const desc = fixture.nativeElement.querySelector('.stub-description');
    expect(desc).toBeTruthy();
  });
});
