import { Panel } from "../common/UiPrimitives";
import "./BlockchainView.css";


/**
 * BlockchainView — Immutable audit chain with integrity verification.
 */
export function BlockchainView({ auditChain, blockchainVerify }) {
  return (
    <section className="dashboard-view" aria-label="Blockchain Audit">
      <section className="dashboard-panel" aria-label="Immutable Audit Chain">
        <h2 className="dashboard-panel-title">{"Immutable Audit Chain"}</h2>
        {/* Chain integrity status */}
        {blockchainVerify && (
          <div className={`chain-status ${blockchainVerify.valid ? "valid" : "invalid"}`} role="status" aria-live="polite">
            <strong>{blockchainVerify.valid ? "\u2713 Chain Integrity Verified" : "\u26A0 Tampering Detected"}</strong>
            <span>{blockchainVerify.block_count} blocks • Last hash: <code>{(blockchainVerify.last_block_hash ?? "").slice(0, 16)}...</code></span>
          </div>
        )}

        {/* Block list */}
        <ol className="chain-list" aria-label="Audit blocks" reversed>
          {auditChain.map((b, i) => (
            <li className="chain-block" key={i}>
              <header className="chain-header">
                <span className="chain-index">Block #{b.index}</span>
                <time className="chain-time">{b.timestamp?.slice(0, 19).replace("T", " ")}</time>
              </header>
              <dl className="chain-body">
                <div><dt>Type</dt><dd>{b.decision_type}</dd></div>
                <div><dt>Action</dt><dd>{b.action}</dd></div>
                <div><dt>Entity</dt><dd>{b.entity_id}</dd></div>
                <div><dt>Hash</dt><dd><code className="chain-hash" title={b.hash}>{(b.hash ?? "").slice(0, 20)}...</code></dd></div>
                <div><dt>Prev</dt><dd><code className="chain-prev" title={b.previous_hash}>{b.previous_hash?.slice(0, 20)}...</code></dd></div>
              </dl>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
