/**
 * @fileoverview Unit tests for the contextual Markdown escapers (GH issue #27) — one context per
 * describe block, each pinning that a value cannot change the structure it renders into and that
 * an ordinary value passes through unchanged.
 * @module tests/utils/markdown.test
 */

import { describe, expect, it } from 'vitest';

import { mdCodeFence, mdInline, mdInlineCode } from '@/utils/markdown.js';

describe('mdInline', () => {
  it('escapes the characters that open structure inside a line', () => {
    expect(mdInline('*bold* _em_ [link] `code` <tag> back\\slash')).toBe(
      '\\*bold\\* \\_em\\_ \\[link\\] \\`code\\` \\<tag> back\\slash',
    );
  });

  it('collapses every line-break form to a space', () => {
    expect(mdInline('a\nb\r\nc\rd')).toBe('a b c d');
  });

  it('never re-escapes an escape it just added', () => {
    expect(mdInline('*')).toBe('\\*');
    expect(mdInline('\\*')).toBe('\\\\\\*');
  });

  it('leaves ordinary values untouched', () => {
    for (const value of [
      'Nutella',
      'en:organic',
      '28 g',
      'Ferrero, Nutella',
      'snake_case',
      'AT&T',
    ]) {
      expect(mdInline(value)).toBe(value);
    }
  });

  it('escapes entity references, strikethrough, and line-leading structure', () => {
    expect(mdInline('&copy; ~~brand~~ | extra')).toBe('\\&copy; \\~\\~brand\\~\\~ \\| extra');
    expect(mdInline('# heading')).toBe('\\# heading');
    expect(mdInline('  brand  ')).toBe('&#32;&#32;brand&#32;&#32;');
  });
});

describe('mdInline in table cells', () => {
  it('escapes a pipe so a value cannot add a column', () => {
    expect(mdInline('A | B')).toBe('A \\| B');
  });

  it('collapses a line break so a value cannot end its row', () => {
    expect(mdInline('Line\nBreak')).toBe('Line Break');
  });

  it('applies the inline escapes as well', () => {
    expect(mdInline('*A* | `B`')).toBe('\\*A\\* \\| \\`B\\`');
  });

  it('escapes a backslash before the pipe pass, so a value cannot re-open its own pipe', () => {
    // The framework escapes a backslash before punctuation and then the pipe itself, so the
    // value's backslash cannot neutralize the pipe escape and open another table column.
    expect(mdInline('a\\|b')).toBe('a\\\\\\|b');
    expect(mdInline('\\')).toBe('\\\\');
  });

  it('leaves an ordinary cell untouched', () => {
    expect(mdInline('Nutella (Ferrero)')).toBe('Nutella (Ferrero)');
  });
});

describe('mdCodeFence', () => {
  it('sizes the fence past the longest backtick run in the value', () => {
    for (const run of ['```', '````', '``````']) {
      const value = `before\n${run}\nafter`;
      const fence = mdCodeFence(value).split('\n')[0] as string;
      expect(fence.length).toBeGreaterThan(run.length);
      expect(mdCodeFence(value)).toContain(value);
    }
  });

  it('keeps the content byte-identical', () => {
    const value = 'Sucre, huile de palme, NOISETTES 13%, lécithines [SOJA)';
    const block = mdCodeFence(value);
    expect(block.split('\n').slice(1, -1).join('\n')).toBe(value);
  });

  it('uses the ordinary three-backtick fence for a value with no run', () => {
    expect(mdCodeFence('water, sugar')).toBe('```\nwater, sugar\n```');
  });
});

describe('mdInlineCode', () => {
  it('sizes the delimiter past the longest backtick run and pads the content', () => {
    const span = mdInlineCode('en:x` — **pwned**, `en:y');
    expect(span).toBe('`` en:x` — **pwned**, `en:y ``');
  });

  it('wraps an ordinary tag ID in single backticks with no padding', () => {
    expect(mdInlineCode('en:organic')).toBe('`en:organic`');
  });

  it('collapses a line break inside the span', () => {
    expect(mdInlineCode('en:a\nen:b')).toBe('`en:a en:b`');
  });
});
