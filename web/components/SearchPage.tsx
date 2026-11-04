'use client';

import { useState } from 'react';
import type { SearchHit, SearchResponse } from '@/lib/types';

interface Props {
  data: SearchResponse;
  onOpen: (address: string) => void;
  onSearch: (query: string) => void;
}

export default function SearchPage({ data, onOpen, onSearch }: Props) {
  const [query, setQuery] = useState(data?.q || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const results = data?.results || [];
  const terms = data?.terms || [];

  return (
    <div className="internal search-page">
      <div className="search-header">
        <p className="eyebrow">Search the Small Web</p>
        <form onSubmit={handleSubmit} className="inline-search-form">
          <input
            type="text"
            className="input-text"
            value={query}
            placeholder="Search all sites by what is written in them..."
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      <div className="search-stats">
        {data?.q ? (
          <span>
            {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;
            <strong>{data.q}</strong>&rdquo;
          </span>
        ) : (
          <span>Enter terms to search across every published site.</span>
        )}
      </div>

      <div className="search-results">
        {results.map((hit: SearchHit) => (
          <article key={hit.address} className="result-card">
            <header className="result-header">
              <a
                href={hit.address}
                className="result-title"
                onClick={(e) => {
                  e.preventDefault();
                  onOpen(hit.address);
                }}
              >
                {hit.title || hit.address}
              </a>
              <span className="result-address">{hit.address}</span>
            </header>
            <p className="result-snippet">
              <HighlightSnippet text={hit.snippet} terms={terms} />
            </p>
            <footer className="result-meta">
              <span>Author: {hit.authorName}</span>
              <span className="dot-sep">·</span>
              <span>Relevance: {hit.score}</span>
            </footer>
          </article>
        ))}

        {data?.q && results.length === 0 && (
          <div className="empty-state">
            <p>No sites match your query.</p>
            <p className="muted">Try different keywords or check spelling.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightSnippet({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length || !text) return <>{text}</>;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
