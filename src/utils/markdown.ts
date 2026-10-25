/**
 * @fileoverview Contextual Markdown escaping for values this server did not author. Open Food Facts
 * is contributor-edited, so every product name, ingredient string, and tag ID rendered into
 * `content[]` sits outside this server's trust boundary: a value carrying Markdown syntax would
 * change the structure of the document rather than be displayed in it, and text presented as data
 * would present itself as instructions to the reading agent. Each function escapes for one
 * rendering context and preserves the value's characters, so `structuredContent` and `content[]`
 * still carry the same text.
 * @module utils/markdown
 */

import { escapeMarkdownInline, markdown } from '@cyanheads/mcp-ts-core/utils';

/** Any line break, including the CRLF pair, collapsed as one unit rather than two. */
const LINE_BREAKS = /\r\n|[\r\n]/g;

/**
 * Escape a value rendered inside a line — a bold label's value, a bullet, a heading. Line breaks
 * collapse to a space: they are the only character that opens a new block, so a value carrying one
 * would otherwise end the line it was given and start structure of its own.
 */
export function mdInline(value: string): string {
  return escapeMarkdownInline(value.replace(LINE_BREAKS, ' '));
}

/**
 * Render a value as a fenced code block the value cannot terminate. The fence is sized past the
 * longest backtick run in the content, per CommonMark's rule that a fenced block closes only on a
 * run at least as long as the one that opened it.
 */
export function mdCodeFence(value: string): string {
  return markdown().codeBlock(value).build();
}

/**
 * Render a value as an inline code span the value cannot close. The delimiter is longer than the
 * longest backtick run inside, and the content is padded with one space on each side — CommonMark
 * strips a single leading and trailing space pair — so a value that begins or ends with a backtick
 * cannot merge with the delimiter.
 */
export function mdInlineCode(value: string): string {
  const text = value.replace(LINE_BREAKS, ' ');
  let longestRun = 0;
  for (const [run] of text.matchAll(/`+/g)) longestRun = Math.max(longestRun, run.length);
  if (longestRun === 0) return `\`${text}\``;
  const delimiter = '`'.repeat(longestRun + 1);
  return `${delimiter} ${text} ${delimiter}`;
}
