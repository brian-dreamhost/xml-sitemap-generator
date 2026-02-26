import { useState } from 'react';

export function BulkImport({ onImport, defaultPriority, defaultChangefreq }) {
  const [text, setText] = useState('');

  const handleImport = () => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && (l.startsWith('http://') || l.startsWith('https://')));

    if (lines.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const newRows = lines.map((url) => ({
      id: Date.now() + Math.random(),
      url,
      priority: defaultPriority,
      changefreq: defaultChangefreq,
      lastmod: today,
      include: true,
    }));
    onImport(newRows);
    setText('');
  };

  const urlCount = text
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return t.startsWith('http://') || t.startsWith('https://');
    }).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-cloudy mb-2" htmlFor="bulk-textarea">
          Paste URLs (one per line)
        </label>
        <textarea
          id="bulk-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={`https://example.com/\nhttps://example.com/about\nhttps://example.com/services\nhttps://example.com/contact`}
          className="w-full px-4 py-3 bg-midnight border border-metal/30 rounded-xl text-sm text-white placeholder-galactic focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure font-mono resize-y"
          spellCheck={false}
        />
        <p className="text-xs text-galactic mt-1">
          {urlCount > 0 ? (
            <span className="text-azure">{urlCount} valid URL{urlCount !== 1 ? 's' : ''} detected</span>
          ) : (
            'Only lines starting with http:// or https:// will be imported'
          )}
        </p>
      </div>
      <button
        onClick={handleImport}
        disabled={urlCount === 0}
        className="px-6 py-2.5 bg-azure hover:bg-azure-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-azure focus:ring-offset-2 focus:ring-offset-abyss"
      >
        Import {urlCount > 0 ? `${urlCount} URL${urlCount !== 1 ? 's' : ''}` : 'URLs'}
      </button>
    </div>
  );
}
