import { describe, expect, it } from 'vitest';

import { sanitizeAnsiForRendering } from '../sanitize-ansi.js';

describe('sanitizeAnsiForRendering', () => {
  it('returns plain text unchanged', () => {
    expect(sanitizeAnsiForRendering('hello world')).toBe('hello world');
  });

  it('preserves SGR color codes (m-terminated)', () => {
    const colored = '\x1b[38;2;255;0;0mred text\x1b[0m';
    expect(sanitizeAnsiForRendering(colored)).toBe(colored);
  });

  it('preserves SGR bold/italic codes', () => {
    const bold = '\x1b[1mbold\x1b[22m';
    expect(sanitizeAnsiForRendering(bold)).toBe(bold);
  });

  it('strips cursor-up (CSI A)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[1Aafter')).toBe('beforeafter');
  });

  it('strips cursor-down (CSI B)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[1Bafter')).toBe('beforeafter');
  });

  it('strips cursor-forward (CSI C)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[5Cafter')).toBe('beforeafter');
  });

  it('strips cursor-back (CSI D)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[3Dafter')).toBe('beforeafter');
  });

  it('strips show-cursor (CSI ?25h)', () => {
    expect(sanitizeAnsiForRendering('text\x1b[?25h more')).toBe('text more');
  });

  it('strips hide-cursor (CSI ?25l)', () => {
    expect(sanitizeAnsiForRendering('text\x1b[?25l more')).toBe('text more');
  });

  it('strips bracketed-paste enable (CSI ?2004h)', () => {
    expect(sanitizeAnsiForRendering('\x1b[?2004hcontent')).toBe('content');
  });

  it('strips bracketed-paste disable (CSI ?2004l)', () => {
    expect(sanitizeAnsiForRendering('content\x1b[?2004l')).toBe('content');
  });

  it('strips erase-in-display (CSI J) — wait, J is recognised by pi-tui', () => {
    // CSI J IS recognised by extractAnsiCode so it won't cause swallowing,
    // but it's a screen-clearing op that shouldn't be in content.
    // We still strip it since it's not SGR.
    expect(sanitizeAnsiForRendering('before\x1b[2Jafter')).toBe('beforeafter');
  });

  it('strips erase-in-line (CSI K)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[2Kafter')).toBe('beforeafter');
  });

  it('strips cursor-position (CSI H)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[10;20Hafter')).toBe('beforeafter');
  });

  it('strips cursor-horizontal-absolute (CSI G)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[5Gafter')).toBe('beforeafter');
  });

  it('strips alternate-screen-buffer (CSI ?1049h)', () => {
    expect(sanitizeAnsiForRendering('\x1b[?1049hcontent\x1b[?1049l')).toBe('content');
  });

  it('strips scroll-region (CSI r)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[1;50rafter')).toBe('beforeafter');
  });

  it('handles mixed SGR and non-SGR sequences', () => {
    const input = '\x1b[1mbold\x1b[1A\x1b[2K\x1b[38;2;0;255;0mgreen\x1b[0m';
    const expected = '\x1b[1mbold\x1b[38;2;0;255;0mgreen\x1b[0m';
    expect(sanitizeAnsiForRendering(input)).toBe(expected);
  });

  it('returns text without ESC unchanged (fast path)', () => {
    const text = 'no escape codes here at all';
    expect(sanitizeAnsiForRendering(text)).toBe(text);
  });

  it('handles empty string', () => {
    expect(sanitizeAnsiForRendering('')).toBe('');
  });

  it('strips Kitty keyboard protocol push (CSI >1u)', () => {
    expect(sanitizeAnsiForRendering('text\x1b[>1umore')).toBe('textmore');
  });

  it('strips save/restore cursor (CSI s / CSI u)', () => {
    expect(sanitizeAnsiForRendering('before\x1b[safter\x1b[u')).toBe('beforeafter');
  });
});
