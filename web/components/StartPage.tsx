'use client';

import { useState } from 'react';
import type { DirectoryEntry, Loc } from '@/lib/types';

interface Props {
  sites: DirectoryEntry[];
  onOpen: (address: string) => void;
  onSearch: (q: string) => void;
  onNavigate: (loc: Loc) => void;
}

export default function StartPage({ sites = [], onOpen, onSearch, onNavigate }: Props) {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="internal start-page">
      <section className="start-hero">
        <p className="eyebrow">The Small Web</p>
        <h1 className="display">Welcome to the Web</h1>
        <p className="lede">
          A collection of one-page websites written by strangers, living in a single database.
          Anyone can explore, wander through links, or publish a new page.
        </p>

        <form onSubmit={handleSearch} className="start-search-box">
          <input
            type="text"
            className="input-text"
            placeholder="Search across all pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="start-quick-links">
          <button className="chip-btn" onClick={() => onNavigate({ kind: 'publish' })}>
            ✍ Publish a site
          </button>
          <button className="chip-btn" onClick={() => onNavigate({ kind: 'history' })}>
            ⏱ View your history
          </button>
        </div>
      </section>

      <section className="start-directory">
        <div className="dir-header">
          <h2>Directory of Published Sites</h2>
          <span className="count-pill">{sites.length} sites active</span>
        </div>

        <div className="directory-grid">
          {sites.map((site) => (
            <article key={site.address} className="site-card">
              <header className="site-card-header">
                <a
                  href={site.address}
                  className="site-card-title"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpen(site.address);
                  }}
                >
                  {site.title || site.address}
                </a>
                <code className="site-card-addr">{site.address}</code>
              </header>
              <footer className="site-card-footer">
                <span>By {site.authorName}</span>
                <span className="dot-sep">·</span>
                <span>Rev {site.revision}</span>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
