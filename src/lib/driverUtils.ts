/** Returns false for missing, N/A, Unknown, and synthetic Unknown (assetId) keys. */
export function isKnownDriver(name?: string | null): boolean {
  if (!name) return false;
  const norm = name.trim().toLowerCase();
  if (!norm) return false;
  if (norm === 'n/a' || norm === 'unknown' || norm === 'unknown driver') return false;
  if (norm === 'no driver assigned' || norm === 'no driver') return false;
  if (norm === 'n/a (n/a)') return false;
  if (norm.startsWith('unknown (')) return false;
  return true;
}

export function displayDriverName(name?: string | null, fallback = '—'): string {
  return isKnownDriver(name) ? name!.trim() : fallback;
}
