// Leading/trailing characters trimmed from display names: whitespace, ASCII
// double/single quotes, curly quotes (U+201C/U+201D) and guillemets
// (U+00AB/U+00BB).
const WRAPPING_CHARS = /^[\s"'“”«»]+|[\s"'“”«»]+$/g

/**
 * Some source entries wrap the narrator name in stray quotation marks (the
 * source prints each entry as a quoted block, and the parser occasionally keeps
 * the opening quote on the name). Strip wrapping quote/whitespace characters for
 * display without otherwise altering the name.
 */
export function cleanNarratorName(name: string): string {
  const cleaned = name.replace(WRAPPING_CHARS, '')
  return cleaned || name.trim()
}
