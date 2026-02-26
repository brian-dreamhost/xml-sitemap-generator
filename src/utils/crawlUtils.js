// CORS proxies tried in order. If the first fails, fall back to the next.
const PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Fetch a URL through CORS proxies (tries each in order) and return the HTML string.
 * Throws with a descriptive message if all proxies fail.
 * @param {string} url - absolute URL to fetch
 * @param {AbortSignal} [signal] - optional AbortSignal for cancellation
 */
export async function fetchViaProxy(url, signal) {
  let lastError;
  for (const buildUrl of PROXIES) {
    try {
      const res = await fetch(buildUrl(url), { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Normalise a URL for deduplication:
 * - Strip fragment (#)
 * - Strip trailing slash (except root path)
 */
export function normalizeUrl(href) {
  try {
    const u = new URL(href);
    u.hash = '';
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch {
    return href;
  }
}

/**
 * Parse HTML and return deduplicated same-origin internal links.
 * @param {string} html
 * @param {string} baseUrl - the page the HTML came from (determines origin)
 * @returns {string[]} absolute URLs
 */
export function extractInternalLinks(html, baseUrl) {
  const base = new URL(baseUrl);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const seen = new Set();
  const links = [];

  doc.querySelectorAll('a[href]').forEach((a) => {
    try {
      const resolved = new URL(a.getAttribute('href'), base);
      if (resolved.origin !== base.origin) return;
      if (!['http:', 'https:'].includes(resolved.protocol)) return;
      const norm = normalizeUrl(resolved.href);
      if (!seen.has(norm)) {
        seen.add(norm);
        links.push(norm);
      }
    } catch {
      // ignore malformed hrefs
    }
  });

  return links;
}
