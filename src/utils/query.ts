export function parseStatuses(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.flatMap((s) => s.split(','));
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function parseIntQuery(value: unknown, fallback: number): number {
  const n = parseInt(String(value ?? fallback), 10);
  return Number.isFinite(n) ? n : fallback;
}
