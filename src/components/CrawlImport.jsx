import { useState, useRef, useCallback } from 'react';
import { fetchViaProxy, extractInternalLinks, normalizeUrl } from '../utils/crawlUtils';

const MAX_PAGES_OPTIONS = [25, 50, 100, 200];
const DEPTH_OPTIONS = [
  { label: '2 levels', value: 2 },
  { label: '3 levels', value: 3 },
  { label: '5 levels', value: 5 },
  { label: 'Unlimited', value: Infinity },
];
const BATCH_SIZE = 3;

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function CrawlImport({ onCrawlImport, defaultPriority, defaultChangefreq }) {
  const [startUrl, setStartUrl] = useState('');
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [discovered, setDiscovered] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  // Mutable BFS state — refs so mutations don't trigger re-renders
  const visitedRef = useRef(new Set());
  const abortRef = useRef(null);

  const reset = () => {
    setDiscovered([]);
    setSelected(new Set());
    setStatus('');
    setError('');
    setIsDone(false);
    setFailedCount(0);
    visitedRef.current = new Set();
  };

  const stopCrawl = () => {
    if (abortRef.current) abortRef.current.abort();
    setIsRunning(false);
    setIsDone(true);
    setStatus((prev) => prev || 'Stopped.');
  };

  const startCrawl = useCallback(async () => {
    const normalized = normalizeUrl(startUrl.trim());
    if (!isValidUrl(normalized)) {
      setError('Please enter a valid URL (must start with http:// or https://).');
      return;
    }

    reset();
    setIsRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    const visited = visitedRef.current;
    visited.add(normalized);

    const allDiscovered = [];
    let failed = 0;

    // --- Test the start URL first so we can show a real error if it fails ---
    setStatus('Connecting to site…');
    let startHtml;
    try {
      startHtml = await fetchViaProxy(normalized, signal);
    } catch (err) {
      if (err.name === 'AbortError') {
        setIsRunning(false);
        return;
      }
      setIsRunning(false);
      setIsDone(true);
      setError(
        `Could not fetch ${normalized}. ${err.message ? `(${err.message}) ` : ''}` +
        `This usually means the site blocks external requests. ` +
        `Try using Bulk Import instead and paste your URLs manually.`
      );
      return;
    }

    if (signal.aborted) {
      setIsRunning(false);
      return;
    }

    // Start URL succeeded — add it and enqueue its links
    allDiscovered.push(normalized);
    setDiscovered([normalized]);

    const startLinks = extractInternalLinks(startHtml, normalized);
    const queue = [];
    for (const link of startLinks) {
      if (!visited.has(link)) {
        visited.add(link);
        queue.push({ url: link, depth: 1 });
      }
    }

    // --- BFS for remaining pages ---
    const processUrl = async ({ url, depth }) => {
      if (signal.aborted) return;
      try {
        setStatus(`Crawling ${new URL(url).pathname || '/'}…`);
        const html = await fetchViaProxy(url, signal);
        if (signal.aborted) return;

        allDiscovered.push(url);
        setDiscovered([...allDiscovered]);

        if (depth < maxDepth) {
          const links = extractInternalLinks(html, normalized);
          for (const link of links) {
            if (!visited.has(link) && allDiscovered.length + queue.length < maxPages * 2) {
              visited.add(link);
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        failed++;
        setFailedCount(failed);
      }
    };

    try {
      while (queue.length > 0 && allDiscovered.length < maxPages && !signal.aborted) {
        const batch = queue.splice(0, BATCH_SIZE);
        await Promise.allSettled(batch.map(processUrl));
      }
    } finally {
      if (!signal.aborted) {
        setIsRunning(false);
        setIsDone(true);
        setStatus(
          `Done — ${allDiscovered.length} page${allDiscovered.length !== 1 ? 's' : ''} found` +
          (failed > 0 ? `, ${failed} skipped (blocked or not found)` : '') +
          '.'
        );
      }
    }
  }, [startUrl, maxPages, maxDepth]);

  const toggleSelect = (url) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(discovered));
  const deselectAll = () => setSelected(new Set());

  const handleImport = () => {
    if (selected.size === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const rows = [...selected].map((url) => ({
      id: Date.now() + Math.random(),
      url,
      priority: defaultPriority,
      changefreq: defaultChangefreq,
      lastmod: today,
      include: true,
    }));
    onCrawlImport(rows);
  };

  const progressPct = maxPages > 0 ? Math.min((discovered.length / maxPages) * 100, 100) : 0;

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="p-3 bg-azure/10 border border-azure/20 rounded-lg text-sm text-cloudy">
        <strong className="text-white">Crawl website:</strong> Enter your site URL and we'll discover internal pages automatically.
        Works best with static or server-rendered sites. JavaScript-rendered pages (SPAs) may not be fully discovered.
      </div>

      {/* URL input + controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={startUrl}
          onChange={(e) => setStartUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isRunning && startCrawl()}
          placeholder="https://example.com"
          disabled={isRunning}
          className="flex-1 px-4 py-2.5 bg-midnight border border-metal/20 rounded-lg text-white placeholder-galactic focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure disabled:opacity-50"
          aria-label="Website URL to crawl"
        />
        {!isRunning ? (
          <button
            onClick={startCrawl}
            className="px-5 py-2.5 bg-azure hover:bg-azure-hover text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-azure focus:ring-offset-2 focus:ring-offset-abyss whitespace-nowrap"
          >
            Start Crawl
          </button>
        ) : (
          <button
            onClick={stopCrawl}
            className="px-5 py-2.5 bg-coral/20 hover:bg-coral/30 text-coral border border-coral/30 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 focus:ring-offset-abyss whitespace-nowrap"
          >
            Stop
          </button>
        )}
      </div>

      {/* Settings row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-galactic whitespace-nowrap" htmlFor="max-pages">Max pages:</label>
          <select
            id="max-pages"
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            disabled={isRunning}
            className="px-2 py-1 bg-midnight border border-metal/30 rounded text-sm text-cloudy focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure disabled:opacity-50"
          >
            {MAX_PAGES_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} pages</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-galactic whitespace-nowrap" htmlFor="max-depth">Crawl depth:</label>
          <select
            id="max-depth"
            value={maxDepth}
            onChange={(e) => setMaxDepth(Number(e.target.value))}
            disabled={isRunning}
            className="px-2 py-1 bg-midnight border border-metal/30 rounded text-sm text-cloudy focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure disabled:opacity-50"
          >
            {DEPTH_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-coral/10 border border-coral/30 rounded-lg text-sm text-coral">
          {error}
        </div>
      )}

      {/* Progress */}
      {(isRunning || isDone) && !error && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={isRunning ? 'text-tangerine' : 'text-turtle'}>
              {status}
            </span>
            <span className="text-galactic">{discovered.length} / {maxPages} pages</span>
          </div>
          <div className="h-2 bg-metal/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-azure rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isRunning && !isDone && discovered.length === 0 && (
        <div className="py-12 text-center text-galactic text-sm">
          Enter a URL above and click <strong className="text-cloudy">Start Crawl</strong> to discover pages automatically.
        </div>
      )}

      {/* Results */}
      {discovered.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-cloudy font-medium">{discovered.length} page{discovered.length !== 1 ? 's' : ''} discovered</span>
            <div className="flex gap-3 text-sm">
              <button onClick={selectAll} className="text-azure hover:text-white transition-colors">Select all</button>
              <span className="text-metal">|</span>
              <button onClick={deselectAll} className="text-azure hover:text-white transition-colors">Deselect all</button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border border-metal/20 rounded-xl divide-y divide-metal/10">
            {discovered.map((url) => {
              const path = (() => { try { return new URL(url).pathname || '/'; } catch { return url; } })();
              return (
                <label
                  key={url}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-metal/10 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(url)}
                    onChange={() => toggleSelect(url)}
                    className="w-4 h-4 rounded border-metal/40 bg-midnight text-azure focus:ring-azure focus:ring-offset-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-white truncate font-mono">{path}</span>
                    <span className="block text-xs text-galactic truncate">{url}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {/* Import footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-galactic">
              {selected.size} selected
            </span>
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="px-5 py-2.5 bg-azure hover:bg-azure-hover text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-azure focus:ring-offset-2 focus:ring-offset-abyss disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import {selected.size > 0 ? selected.size : ''} URL{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
