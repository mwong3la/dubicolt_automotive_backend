/** Strip display prefixes (e.g. `#DBK-123`) before DB / URL lookup. */
export function normalizeTrackingId(input: string): string {
  return input.trim().replace(/^#+/, '').trim();
}
