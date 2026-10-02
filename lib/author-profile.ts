export function normalizeAuthorName(name: string) {
  return name.replace(/\s+/g, ' ').trim();
}

export function generateAuthorSlug(name: string) {
  return normalizeAuthorName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function shouldCreateAuthorProfile(name: string) {
  const normalized = normalizeAuthorName(name);
  if (!normalized) return false;
  return normalized.toLowerCase() !== 'redaksi';
}
