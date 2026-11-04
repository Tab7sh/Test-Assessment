'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { HistoryItem, HistoryPage as HistoryData } from '@/lib/types';

interface Props {
  data: HistoryData;
  personName: string;
  onOpen: (address: string) => void;
  onSnapshot: (snap: HistoryData) => void;
}

export default function HistoryPage({ data, personName, onOpen, onSnapshot }: Props) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = data?.items || [];
  const next = data?.next;

  const loadMore = async () => {
    if (!next || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await api.history(data.personId, next);
      const updated: HistoryData = {
        personId: data.personId,
        items: [...items, ...res.items],
        next: res.next,
      };
      onSnapshot(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load earlier history. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="internal history-page">
      <header className="page-header">
        <p className="eyebrow">Session Records</p>
        <h1 className="display">Browsing History</h1>
        <p className="lede">
          A persistent record of everywhere {personName || 'you'} have been across the small web.
        </p>
      </header>
      {error && <p className="banner error" role="alert">{error}</p>}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No visits recorded yet for {personName || 'this person'}.</p>
          <p className="muted">Follow links or type addresses to start building history.</p>
        </div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Site & Address</th>
                <th>Via</th>
                <th>Destination Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: HistoryItem) => {
                const date = new Date(item.at);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <tr key={item.id} className={!item.found ? 'row-dead' : ''}>
                    <td className="col-time" title={item.at}>
                      <span className="time">{timeStr}</span>
                      <span className="date">{dateStr}</span>
                    </td>
                    <td className="col-site">
                      <a
                        href={item.address}
                        className="history-link"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpen(item.address);
                        }}
                      >
                        {item.title ? <strong>{item.title}</strong> : <code>{item.address}</code>}
                      </a>
                      <div className="history-sub">
                        <code>{item.address}</code>
                        {item.revision ? <span className="tag-rev">rev {item.revision}</span> : null}
                        {item.from && <span className="from-hint">← from {item.from}</span>}
                      </div>
                    </td>
                    <td className="col-via">
                      <span className={`via-chip via-${item.via}`}>{item.via}</span>
                    </td>
                    <td className="col-status">
                      {item.found ? (
                        <span className="badge-ok">Found</span>
                      ) : (
                        <span className="badge-nowhere">Nowhere</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {next && (
            <div className="history-more">
              <button className="btn" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading earlier visits…' : 'Load earlier history'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
