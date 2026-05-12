import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';

interface RawITunesResult {
  trackId?: number | string;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
}

interface RawITunesResponse {
  results?: RawITunesResult[];
}

export interface ITunesTrack {
  trackId: string;
  trackName: string;
  artistName: string;
  /** 300x300 album art (upscaled from artworkUrl100). */
  artworkUrl?: string;
  /** 30-second audio preview URL (m4a). */
  previewUrl?: string;
}

/**
 * Thin wrapper around the iTunes Search API.
 *
 * Mirrors the prototype's `searchItunes` + `fetchItunesTrack` calls
 * (PackagingStudio.tsx:534-562). The API is public, CORS-friendly, and
 * unauthenticated — same approach the prototype takes for trending /
 * search artwork + audio previews.
 *
 * All methods return Observables that fall back to an empty / null
 * result on network or parsing errors, so the caller never has to
 * handle rejection — the UI just shows the synthetic gradient
 * placeholder when artwork can't be resolved.
 */
@Injectable({ providedIn: 'root' })
export class ITunesService {
  private readonly http = inject(HttpClient);

  /** Free-text track search; returns up to `limit` normalized tracks. */
  search(query: string, limit = 8): Observable<ITunesTrack[]> {
    const q = query.trim();
    if (!q) return of([]);
    const params = {
      term: q,
      media: 'music',
      limit: String(limit),
    };
    return this.http
      .get<RawITunesResponse>(ITUNES_SEARCH_URL, { params })
      .pipe(
        map((res) => (res?.results ?? []).map(normalize).filter(isResolved)),
        catchError(() => of([])),
      );
  }

  /**
   * Resolve a single trending seed (trackName + artistName) to its full
   * iTunes metadata. Returns null if no result matches, so the caller
   * can fall back to the seed's local values.
   */
  findTrack(trackName: string, artistName: string): Observable<ITunesTrack | null> {
    const q = `${trackName} ${artistName}`.trim();
    if (!q) return of(null);
    const params = {
      term: q,
      media: 'music',
      limit: '1',
    };
    return this.http
      .get<RawITunesResponse>(ITUNES_SEARCH_URL, { params })
      .pipe(
        map((res) => {
          const first = res?.results?.[0];
          if (!first) return null;
          const t = normalize(first);
          return isResolved(t) ? t : null;
        }),
        catchError(() => of(null)),
      );
  }
}

function normalize(r: RawITunesResult): ITunesTrack {
  return {
    trackId: r.trackId !== undefined ? String(r.trackId) : '',
    trackName: r.trackName ?? '',
    artistName: r.artistName ?? '',
    // Upscale 100x100 thumb to 300x300 for crisper rendering on retina
    // displays. Mirrors PackagingStudio.tsx:546.
    artworkUrl: r.artworkUrl100?.replace('100x100', '300x300'),
    previewUrl: r.previewUrl,
  };
}

function isResolved(t: ITunesTrack): boolean {
  return !!t.trackId && !!t.trackName;
}
