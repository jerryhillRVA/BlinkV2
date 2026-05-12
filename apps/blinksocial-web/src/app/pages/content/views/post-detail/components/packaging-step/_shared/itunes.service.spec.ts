import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ITunesService, type ITunesTrack } from './itunes.service';

describe('ITunesService', () => {
  let service: ITunesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ITunesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('search()', () => {
    it('GETs the iTunes search endpoint with term + media + limit params', () => {
      const emitted: ITunesTrack[][] = [];
      service.search('Espresso', 8).subscribe((v) => emitted.push(v));
      const req = http.expectOne(
        (r) =>
          r.url === 'https://itunes.apple.com/search' &&
          r.params.get('term') === 'Espresso' &&
          r.params.get('media') === 'music' &&
          r.params.get('limit') === '8',
      );
      req.flush({
        results: [
          {
            trackId: 123,
            trackName: 'Espresso',
            artistName: 'Sabrina Carpenter',
            artworkUrl100: 'https://is1.example/100x100/foo.jpg',
            previewUrl: 'https://aud.example/preview.m4a',
          },
        ],
      });
      expect(emitted[0]?.[0]).toEqual({
        trackId: '123',
        trackName: 'Espresso',
        artistName: 'Sabrina Carpenter',
        artworkUrl: 'https://is1.example/300x300/foo.jpg',
        previewUrl: 'https://aud.example/preview.m4a',
      });
    });

    it('returns [] for an empty query without making a request', () => {
      const emitted: ITunesTrack[][] = [];
      service.search('   ').subscribe((v) => emitted.push(v));
      http.expectNone(() => true);
      expect(emitted).toEqual([[]]);
    });

    it('falls back to [] on network / parse errors', () => {
      const emitted: ITunesTrack[][] = [];
      service.search('Anything').subscribe((v) => emitted.push(v));
      http.expectOne(() => true).error(new ProgressEvent('error'));
      expect(emitted).toEqual([[]]);
    });

    it('filters out entries missing trackId or trackName', () => {
      const emitted: ITunesTrack[][] = [];
      service.search('partial').subscribe((v) => emitted.push(v));
      http.expectOne(() => true).flush({
        results: [
          { trackName: 'No id' },
          { trackId: 999 },
          { trackId: 1, trackName: 'Good' },
        ],
      });
      expect(emitted[0]).toHaveLength(1);
      expect(emitted[0][0].trackName).toBe('Good');
    });
  });

  describe('findTrack()', () => {
    it('resolves the first matching iTunes result', () => {
      let resolved: ITunesTrack | null | undefined;
      service.findTrack('Espresso', 'Sabrina Carpenter').subscribe((v) => (resolved = v));
      const req = http.expectOne(
        (r) =>
          r.url === 'https://itunes.apple.com/search' &&
          r.params.get('term') === 'Espresso Sabrina Carpenter' &&
          r.params.get('limit') === '1',
      );
      req.flush({
        results: [
          {
            trackId: 42,
            trackName: 'Espresso',
            artistName: 'Sabrina Carpenter',
            artworkUrl100: 'https://art.example/100x100/x.jpg',
          },
        ],
      });
      expect(resolved?.trackId).toBe('42');
      expect(resolved?.artworkUrl).toBe('https://art.example/300x300/x.jpg');
    });

    it('returns null when iTunes has no results', () => {
      let resolved: ITunesTrack | null | undefined;
      service.findTrack('Nope', 'Nobody').subscribe((v) => (resolved = v));
      http.expectOne(() => true).flush({ results: [] });
      expect(resolved).toBeNull();
    });

    it('returns null when both inputs are empty (no request issued)', () => {
      let resolved: ITunesTrack | null | undefined;
      service.findTrack('', '   ').subscribe((v) => (resolved = v));
      http.expectNone(() => true);
      expect(resolved).toBeNull();
    });

    it('falls back to null on error', () => {
      let resolved: ITunesTrack | null | undefined;
      service.findTrack('Boom', 'Crash').subscribe((v) => (resolved = v));
      http.expectOne(() => true).error(new ProgressEvent('error'));
      expect(resolved).toBeNull();
    });
  });
});
