export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Remove leading honorifics ("Dr.", "Prof.", "Professor", ...) from a
 * display name so slug builders can add their own canonical `dr-` prefix
 * without producing `dr-dr-...` when the input already contains "Dr".
 * The display name itself is left untouched — only the slug base changes.
 */
export function stripTitlePrefix(name: string): string {
  let out = (name || "").trim();
  for (let i = 0; i < 3; i++) {
    const next = out.replace(/^(dr\.?|prof\.?|professor)\s+/i, "").trim();
    if (next === out) break;
    out = next;
  }
  return out;
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "item";
  let candidate = root;
  let i = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${i++}`;
    if (i > 1000) {
      candidate = `${root}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}
