/**
 * Generates a valid XML sitemap from a list of URL entries.
 */
export function generateSitemap(urls) {
  const validUrls = urls.filter((u) => u.include && u.url && u.url.trim());

  const urlElements = validUrls.map((entry) => {
    const lines = [`  <url>`, `    <loc>${escapeXml(entry.url.trim())}</loc>`];
    if (entry.lastmod && entry.lastmod.trim()) {
      lines.push(`    <lastmod>${entry.lastmod.trim()}</lastmod>`);
    }
    if (entry.changefreq && entry.changefreq !== 'none') {
      lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    }
    if (entry.priority) {
      lines.push(`    <priority>${entry.priority}</priority>`);
    }
    lines.push(`  </url>`);
    return lines.join('\n');
  });

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urlElements,
    `</urlset>`,
  ].join('\n');

  return xml;
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function estimateSize(xml) {
  const bytes = new Blob([xml]).size;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function isValidUrl(url) {
  if (!url.trim()) return null; // empty = neutral
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
