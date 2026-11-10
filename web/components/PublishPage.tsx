'use client';

import { useEffect, useState } from 'react';
import { isAddress, normalizeAddress } from '@/lib/address';
import { api, ApiError } from '@/lib/api';
import type { Page, Person, PublishDraft } from '@/lib/types';
import PageFrame from './PageFrame';

interface Props {
  draft: PublishDraft | null;
  people: Person[];
  personId: string | null;
  onDraft: (draft: PublishDraft) => void;
  onPublished: (page: Page) => void;
}

const TEMPLATE = `<h1>My New Site</h1>
<p>Welcome to my corner of the small web. Here is what I am thinking about today:</p>
<ul>
  <li>First observation</li>
  <li>A link to <a href="tidepool.zz">Notes from the Tide Pool</a></li>
  <li>A link to somewhere new like <a href="my-secret-spot.zz">a secret spot</a></li>
</ul>
<p>Thanks for visiting!</p>
`;

export default function PublishPage({ draft, people, personId, onDraft, onPublished }: Props) {
  const [address, setAddress] = useState(draft?.address || '');
  const [title, setTitle] = useState(draft?.title || '');
  const [authorId, setAuthorId] = useState(draft?.authorId || personId || people[0]?._id || '');
  const [html, setHtml] = useState(draft?.html ?? TEMPLATE);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'editor' | 'preview'>('editor');
  const [preview, setPreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== 'preview') return;
    let active = true;
    setPreview(null);
    setPreviewError(null);
    api.preview(html).then(
      (result) => { if (active) setPreview(result.html); },
      (err) => { if (active) setPreviewError(err instanceof Error ? err.message : 'Could not load preview.'); },
    );
    return () => { active = false; };
  }, [tab, html]);

  const updateDraft = (patch: Partial<PublishDraft>) => {
    const updated: PublishDraft = {
      address: patch.address ?? address,
      title: patch.title ?? title,
      authorId: patch.authorId ?? authorId,
      html: patch.html ?? html,
    };
    onDraft(updated);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const norm = normalizeAddress(address);
    if (!isAddress(norm)) {
      setError(`"${address}" is not a valid address. Addresses must end in .zz (e.g. my-project.zz)`);
      return;
    }
    if (!authorId) {
      setError('Please select an author.');
      return;
    }
    if (!html.trim()) {
      setError('Page HTML cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const page = await api.publish({
        address: norm,
        title: title.trim(),
        authorId,
        html,
      });
      onPublished(page);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="internal publish-page">
      <header className="page-header">
        <p className="eyebrow">The Small Web Publisher</p>
        <h1 className="display">Publish a Site</h1>
        <p className="lede">
          Anyone can add a site: choose an address ending in <code>.zz</code> and write a page of HTML.
        </p>
      </header>

      {error && (
        <div className="banner error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handlePublish} className="publish-form">
        <div className="form-row">
          <label className="form-field field-grow">
            <span className="field-label">Address</span>
            <input
              type="text"
              className="input-text mono"
              placeholder="e.g. telescope.zz"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                updateDraft({ address: e.target.value });
              }}
            />
            <span className="field-hint">Must end in <code>.zz</code>. Addresses belong to the first publisher.</span>
          </label>

          <label className="form-field field-fixed">
            <span className="field-label">Publisher</span>
            <select
              className="input-select"
              value={authorId}
              onChange={(e) => {
                setAuthorId(e.target.value);
                updateDraft({ authorId: e.target.value });
              }}
            >
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="field-hint">Who wrote this page</span>
          </label>
        </div>

        <div className="form-row">
          <label className="form-field">
            <span className="field-label">Title (optional)</span>
            <input
              type="text"
              className="input-text"
              placeholder="Defaults to <h1> or the address"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                updateDraft({ title: e.target.value });
              }}
            />
          </label>
        </div>

        <div className="editor-tabs">
          <button
            type="button"
            className={`tab-btn ${tab === 'editor' ? 'active' : ''}`}
            onClick={() => setTab('editor')}
          >
            HTML Source
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === 'preview' ? 'active' : ''}`}
            onClick={() => setTab('preview')}
          >
            Live Sandboxed Preview
          </button>
        </div>

        {tab === 'editor' ? (
          <div className="form-field">
            <textarea
              className="input-textarea mono"
              rows={14}
              value={html}
              placeholder="Write your HTML here..."
              onChange={(e) => {
                setHtml(e.target.value);
                updateDraft({ html: e.target.value });
              }}
            />
            <span className="field-hint">
              Scripts and external asset fetches are stripped and sandboxed. Semantic HTML, lists, tables,
              and inline styles are preserved.
            </span>
          </div>
        ) : (
          <div className="preview-container">
            {previewError ? <p role="alert">{previewError}</p> : preview === null ? <p role="status">Preparing preview…</p> :
              <PageFrame key={preview} html={preview} title={title || address || 'Preview'} />}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish Site'}
          </button>
        </div>
      </form>
    </div>
  );
}
