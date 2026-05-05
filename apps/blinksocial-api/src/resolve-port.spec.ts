import { resolvePort } from './resolve-port';

describe('resolvePort', () => {
  it('falls back to 8080 when PORT is unset', () => {
    expect(resolvePort({})).toBe(8080);
  });

  it('falls back to 8080 when PORT is empty string', () => {
    expect(resolvePort({ PORT: '' })).toBe(8080);
  });

  it('returns the value of PORT when set', () => {
    expect(resolvePort({ PORT: '9000' })).toBe('9000');
  });

  it('passes through non-numeric PORT values (e.g. unix sockets)', () => {
    expect(resolvePort({ PORT: '/var/run/blink.sock' })).toBe('/var/run/blink.sock');
  });
});
