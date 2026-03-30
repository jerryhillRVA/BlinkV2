import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OnboardApiService } from './onboard-api.service';

describe('OnboardApiService', () => {
  let service: OnboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(OnboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a session', () => {
    service.createSession({ businessName: 'Acme' }).subscribe((res) => {
      expect(res.sessionId).toBe('abc-123');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ businessName: 'Acme' });
    req.flush({ sessionId: 'abc-123', status: 'active', initialMessage: 'Hi', sections: [] });
  });

  it('should send a message', () => {
    service.sendMessage('abc-123', 'We sell widgets').subscribe((res) => {
      expect(res.agentMessage).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/onboarding/sessions/abc-123/messages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'We sell widgets' });
    req.flush({ agentMessage: 'Great!', sections: [], currentSection: 'business', readyToGenerate: false });
  });

  it('should get session state', () => {
    service.getSession('abc-123').subscribe((res) => {
      expect(res.sessionId).toBe('abc-123');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions/abc-123');
    expect(req.request.method).toBe('GET');
    req.flush({ sessionId: 'abc-123', status: 'active', messages: [], sections: [], currentSection: 'business', readyToGenerate: false, blueprint: null });
  });

  it('should create session without params', () => {
    service.createSession().subscribe((res) => {
      expect(res.sessionId).toBe('abc-456');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions');
    expect(req.request.body).toEqual({});
    req.flush({ sessionId: 'abc-456', status: 'active', initialMessage: 'Hi', sections: [] });
  });

  it('should generate blueprint', () => {
    service.generateBlueprint('abc-123').subscribe((res) => {
      expect(res.markdownDocument).toContain('Blueprint');
    });

    const req = httpMock.expectOne('/api/onboarding/sessions/abc-123/generate');
    expect(req.request.method).toBe('POST');
    req.flush({ blueprint: {}, markdownDocument: '# Blueprint' });
  });
});
