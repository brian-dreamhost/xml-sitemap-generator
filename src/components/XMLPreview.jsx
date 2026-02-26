import { useState, useCallback } from 'react';
import { ClipboardIcon, DownloadIcon } from './ui/Icons';
import { Toast } from './ui/Toast';

const PREVIEW_LIMIT = 10;

function colorizeXml(line) {
  if (line.startsWith('<?xml') || line.startsWith('<urlset') || line === '</urlset>') {
    return <span className="text-galactic">{line}</span>;
  }
  if (line.trim() === '<url>' || line.trim() === '</url>') {
    return <span className="text-metal">{line}</span>;
  }
  // Colorize <tag>value</tag>
  const tagMatch = line.match(/^(\s*)(<\w+>)(.*?)(<\/\w+>)(.*)$/);
  if (tagMatch) {
    return (
      <>
        <span>{tagMatch[1]}</span>
        <span className="text-azure">{tagMatch[2]}</span>
        <span className="text-white">{tagMatch[3]}</span>
        <span className="text-azure">{tagMatch[4]}</span>
      </>
    );
  }
  return <span className="text-cloudy">{line}</span>;
}

export function XMLPreview({ xml, urlCount }) {
  const [toastVisible, setToastVisible] = useState(false);

  const lines = xml.split('\n');
  const totalLines = lines.length;

  // Smart truncation: show first PREVIEW_LIMIT url blocks + header/footer
  const shouldTruncate = urlCount > PREVIEW_LIMIT;
  let displayLines = lines;
  let hiddenCount = 0;

  if (shouldTruncate) {
    // Find the boundary after 10 URLs by counting </url> tags
    let urlsCounted = 0;
    let cutLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '</url>') {
        urlsCounted++;
        if (urlsCounted === PREVIEW_LIMIT) {
          cutLine = i + 1;
          break;
        }
      }
    }
    displayLines = lines.slice(0, cutLine);
    hiddenCount = urlCount - PREVIEW_LIMIT;
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(xml).then(() => setToastVisible(true));
  }, [xml]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
  }, [xml]);

  return (
    <div className="card-gradient border border-metal/20 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-metal/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-coral" />
          <div className="w-2.5 h-2.5 rounded-full bg-tangerine" />
          <div className="w-2.5 h-2.5 rounded-full bg-turtle" />
          <span className="ml-2 text-sm text-galactic font-mono">sitemap.xml</span>
          <span className="text-xs text-metal">— {totalLines} lines</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-galactic hover:text-white border border-metal/30 hover:border-metal/60 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-azure"
          >
            <ClipboardIcon className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-azure hover:bg-azure-hover text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-azure focus:ring-offset-2 focus:ring-offset-abyss"
          >
            <DownloadIcon className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
      <div className="p-4 overflow-auto max-h-[500px]">
        {urlCount === 0 ? (
          <p className="text-galactic text-sm text-center py-8">Add URLs to generate your sitemap</p>
        ) : (
          <pre className="text-sm font-mono leading-relaxed">
            {displayLines.map((line, i) => (
              <div key={i} className="flex">
                <span className="w-8 text-right pr-3 text-metal select-none flex-shrink-0 text-xs leading-5">{i + 1}</span>
                <span>{colorizeXml(line)}</span>
              </div>
            ))}
            {shouldTruncate && (
              <div className="flex items-center gap-2 mt-2 py-2 px-10 text-galactic text-xs border-t border-metal/20">
                … {hiddenCount} more URL{hiddenCount !== 1 ? 's' : ''} hidden in preview — download to see full sitemap
              </div>
            )}
          </pre>
        )}
      </div>
      <Toast message="Copied to clipboard!" isVisible={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}
