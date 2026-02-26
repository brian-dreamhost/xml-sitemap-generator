import { TrashIcon, PlusIcon } from './ui/Icons';
import { isValidUrl } from '../utils/generateSitemap';

const PRIORITIES = ['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1'];
const FREQUENCIES = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

export function URLTable({ urls, onUpdate, onAdd, onRemove }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {urls.length > 0 && (
        <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-xs text-galactic uppercase tracking-wider mb-1">
          <div className="col-span-5">URL</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Change Freq</div>
          <div className="col-span-2">Last Modified</div>
          <div className="col-span-1" />
        </div>
      )}

      {urls.map((row) => {
        const validity = isValidUrl(row.url);
        const showError = validity === false && row.url.trim();
        return (
          <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-12 sm:col-span-5">
              <input
                type="text"
                value={row.url}
                onChange={(e) => onUpdate(row.id, { url: e.target.value })}
                placeholder="https://example.com/page"
                className={`w-full px-3 py-2 bg-midnight border rounded-lg text-sm text-white placeholder-galactic focus:outline-none focus:ring-1 font-mono ${
                  showError
                    ? 'border-coral/50 focus:border-coral focus:ring-coral'
                    : 'border-metal/30 focus:border-azure focus:ring-azure'
                }`}
                aria-label="Page URL"
                aria-invalid={showError ? 'true' : undefined}
              />
              {showError && (
                <p className="text-xs text-coral mt-1">Must be a valid URL (https://...)</p>
              )}
            </div>
            <div className="col-span-4 sm:col-span-2">
              <select
                value={row.priority}
                onChange={(e) => onUpdate(row.id, { priority: e.target.value })}
                className="w-full px-2 py-2 bg-midnight border border-metal/30 rounded-lg text-sm text-cloudy focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure"
                aria-label="Priority"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="col-span-4 sm:col-span-2">
              <select
                value={row.changefreq}
                onChange={(e) => onUpdate(row.id, { changefreq: e.target.value })}
                className="w-full px-2 py-2 bg-midnight border border-metal/30 rounded-lg text-sm text-cloudy focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure"
                aria-label="Change frequency"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="col-span-3 sm:col-span-2">
              <input
                type="date"
                value={row.lastmod}
                onChange={(e) => onUpdate(row.id, { lastmod: e.target.value })}
                defaultValue={today}
                className="w-full px-2 py-2 bg-midnight border border-metal/30 rounded-lg text-sm text-cloudy focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure"
                aria-label="Last modified date"
              />
            </div>
            <div className="col-span-1">
              <button
                onClick={() => onRemove(row.id)}
                disabled={urls.length === 1}
                className="p-2 text-galactic hover:text-coral transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-coral rounded"
                aria-label="Remove URL"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-sm text-azure hover:text-white transition-colors focus:outline-none focus:underline"
      >
        <PlusIcon className="w-4 h-4" />
        Add URL
      </button>
    </div>
  );
}
