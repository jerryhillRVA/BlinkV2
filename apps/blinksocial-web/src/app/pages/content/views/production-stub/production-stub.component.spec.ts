import { TestBed } from '@angular/core/testing';
import { ProductionStubComponent } from './production-stub.component';

describe('ProductionStubComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductionStubComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProductionStubComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render stub title', () => {
    const fixture = TestBed.createComponent(ProductionStubComponent);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.stub-title');
    expect(title.textContent).toContain('Production');
  });
});
