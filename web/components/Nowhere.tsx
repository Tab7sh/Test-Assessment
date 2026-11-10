'use client';

interface Props {
  address: string;
  onPublish: () => void;
  onPublishHere: () => void;
  onSearch: (q: string) => void;
}

export default function Nowhere({ address, onPublish, onPublishHere, onSearch }: Props) {
  const queryWord = address.replace(/\.zz$/, '');

  return (
    <div className="internal nowhere">
      <div className="status-badge error">404 · Nowhere</div>
      <h1 className="display">{address}</h1>
      <p className="lede">
        Nothing has ever been published at this address. It is open water on the small web.
      </p>

      <div className="actions-card">
        <h3>What would you like to do?</h3>
        <ul className="action-list">
          <li>
            <button className="primary-link-btn" onClick={onPublishHere}>
              <strong>Publish this site</strong> — claim <code>{address}</code> and put your own HTML here.
            </button>
          </li>
          <li>
            <button className="primary-link-btn" onClick={() => onSearch(queryWord)}>
              <strong>Search the small web</strong> for &ldquo;{queryWord}&rdquo; to see if it was mentioned elsewhere.
            </button>
          </li>
          <li>
            <button className="primary-link-btn" onClick={onPublish}>
              <strong>Go to publisher</strong> to publish at another address.
            </button>
          </li>
        </ul>
      </div>

      <div className="tip-box">
        <p>
          Tip: Anyone can publish on the small web. If you link to an address that does not exist yet,
          it waits here until someone creates it.
        </p>
      </div>
    </div>
  );
}
