export function normalizeSearchQuery(query: string): string {
  if (!query) return '';
  return query.trim().replace(/\s+/g, ' ');
}
