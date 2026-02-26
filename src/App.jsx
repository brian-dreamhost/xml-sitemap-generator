import { useState, useMemo } from 'react';
import { URLTable } from './components/URLTable';
import { BulkImport } from './components/BulkImport';
import { XMLPreview } from './components/XMLPreview';
import { generateSitemap, estimateSize } from './utils/generateSitemap';

const TABS = [
  { id: 'table', label: 'Add URLs' },
  { id: 'bulk', label: 'Bulk Import' },
  { id: 'preview', label: 'Preview & Download' },
];

const today = new Date().toISOString().split('T')[0];

function makeRow(overrides = {}) {
  return {
    id: Date.now() + Math.random(),
    url: '',
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: today,
    include: true,
    ...overrides,
  };
}

export default function App() {
  const [urls, setUrls] = useState([makeRow()]);
  const [activeTab, setActiveTab] = useState('table');
  const [defaultPriority, setDefaultPriority] = useState('0.5');
  const [defaultChangefreq, setDefaultChangefreq] = useState('weekly');

  const xml = useMemo(() => generateSitemap(urls), [urls]);
  const validCount = urls.filter((u) => u.include && u.url && u.url.trim()).length;
  const sizeLabel = validCount > 0 ? estimateSize(xml) : '0 B';

  const addRow = () => setUrls((prev) => [...prev, makeRow({ priority: defaultPriority, changefreq: defaultChangefreq })]);

  const updateRow = (id, changes) => {
    setUrls((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  };

  const removeRow = (id) => {
    setUrls((prev) => prev.filter((r) => r.id !== id));
  };

  const handleBulkImport = (newRows) => {
    setUrls((prev) => {
      const hasOnlyEmpty = prev.length === 1 && !prev[0].url.trim();
      return hasOnlyEmpty ? newRows : [...prev, ...newRows];
    });
    setActiveTab('table');
  };

  return (
    <div className="min-h-screen bg-abyss text-white bg-glow bg-grid">
      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10 animate-fadeIn">

        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-galactic">
          <a href="https://seo-tools-tau.vercel.app/" className="text-azure hover:text-white transition-colors">Free Tools</a>
          <span className="mx-2 text-metal">/</span>
          <a href="https://seo-tools-tau.vercel.app/seo/" className="text-azure hover:text-white transition-colors">SEO Tools</a>
          <span className="mx-2 text-metal">/</span>
          <span className="text-cloudy">XML Sitemap Generator</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 border border-turtle text-turtle rounded-full px-4 py-2 text-sm font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-turtle" />
            Free SEO Tool
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            XML Sitemap Generator
          </h1>
          <p className="text-lg text-cloudy max-w-2xl">
            Generate a valid XML sitemap for your website. Add URLs individually or paste a bulk list, set priorities and frequencies, then download your sitemap.xml file.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 card-gradient border border-metal/20 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{validCount}</span>
            <span className="text-cloudy">URL{validCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-px h-6 bg-metal/30" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-galactic">Estimated size:</span>
            <span className="text-sm font-medium text-cloudy">{sizeLabel}</span>
          </div>
          <div className="w-px h-6 bg-metal/30" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-galactic">Default priority:</span>
            <select
              value={defaultPriority}
              onChange={(e) => setDefaultPriority(e.target.value)}
              className="px-2 py-1 bg-midnight border border-metal/30 rounded text-sm text-cloudy focus:outline-none focus:border-azure"
              aria-label="Default priority"
            >
              {['1.0','0.9','0.8','0.7','0.6','0.5','0.4','0.3','0.2','0.1'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-galactic">Default freq:</span>
            <select
              value={defaultChangefreq}
              onChange={(e) => setDefaultChangefreq(e.target.value)}
              className="px-2 py-1 bg-midnight border border-metal/30 rounded text-sm text-cloudy focus:outline-none focus:border-azure"
              aria-label="Default change frequency"
            >
              {['always','hourly','daily','weekly','monthly','yearly','never'].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-oblivion border border-metal/20 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-azure focus:ring-offset-1 focus:ring-offset-oblivion ${
                activeTab === tab.id
                  ? 'bg-azure text-white'
                  : 'text-galactic hover:text-white'
              }`}
            >
              {tab.label}
              {tab.id === 'table' && urls.length > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-metal/30'}`}>
                  {validCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="card-gradient border border-metal/20 rounded-2xl p-6">
          {activeTab === 'table' && (
            <URLTable
              urls={urls}
              onUpdate={updateRow}
              onAdd={addRow}
              onRemove={removeRow}
            />
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div className="p-3 bg-azure/10 border border-azure/20 rounded-lg text-sm text-cloudy">
                <strong className="text-white">Bulk import:</strong> Paste your URLs below, one per line. They&apos;ll be added with your default priority and frequency settings.
              </div>
              <BulkImport
                onImport={handleBulkImport}
                defaultPriority={defaultPriority}
                defaultChangefreq={defaultChangefreq}
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <XMLPreview xml={xml} urlCount={validCount} />
          )}
        </div>

        {/* Quick actions */}
        {activeTab !== 'preview' && validCount > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setActiveTab('preview')}
              className="px-6 py-2.5 bg-azure hover:bg-azure-hover text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-azure focus:ring-offset-2 focus:ring-offset-abyss"
            >
              Preview & Download Sitemap →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-metal/30 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-galactic">
            <p>Free XML Sitemap Generator — DreamHost Marketing Tools</p>
            <div className="flex items-center gap-4">
              <a href="https://www.sitemaps.org/protocol.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Sitemap Protocol Docs
              </a>
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Submit in Search Console
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
