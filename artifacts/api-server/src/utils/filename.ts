/**
 * Sanitize a video title into a safe, readable filename stem (no extension).
 *
 * Rules applied in order:
 *  1. Normalise unicode (NFC) so combined chars don't fragment
 *  2. Replace characters that are illegal on Windows/macOS/Linux with " -"
 *  3. Strip leading/trailing dots and spaces (Windows dislikes them)
 *  4. Collapse runs of whitespace and dashes into a single " - "
 *  5. Cap at 200 chars to stay well inside all filesystem limits
 *  6. Fall back to "download" if nothing survives sanitisation
 */
export function sanitizeFilename(title: string): string {
  const ILLEGAL = /[/\\:*?"<>|]/g;
  const CONTROL = /[\x00-\x1f\x7f]/g;

  let name = title
    .normalize("NFC")
    .replace(CONTROL, "")
    .replace(ILLEGAL, " -")
    // collapse multiple consecutive spaces / dashes
    .replace(/[ \t]+/g, " ")
    .replace(/-{2,}/g, "-")
    .replace(/ - -/g, " -")
    // trim leading/trailing spaces and dots
    .replace(/^[\s.]+|[\s.]+$/g, "")
    .slice(0, 200)
    .trimEnd();

  return name.length > 0 ? name : "download";
}

/**
 * Encode a string for use in the RFC 5987 `filename*` Content-Disposition
 * parameter so that non-ASCII characters (accents, CJK, etc.) are preserved
 * correctly in all modern browsers.
 *
 * Format: UTF-8''<percent-encoded>
 */
export function encodeRFC5987(str: string): string {
  return (
    "UTF-8''" +
    encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
    )
  );
}
