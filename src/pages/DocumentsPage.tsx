import { Folder } from 'lucide-react';
import FeatureGate from '../components/FeatureGate';

export default function DocumentsPage() {
  return (
    <FeatureGate featureId="reports">
      <div>
        <div className="bpl-page-header">
          <h1 className="bpl-page-title">Documents</h1>
          <p className="bpl-page-subtitle">Reports repository — connect document storage when ready</p>
        </div>
        <div className="bpl-card">
          <div className="bpl-module-placeholder">
            <Folder size={32} style={{ opacity: 0.25, marginBottom: 12 }} />
            <p style={{ fontSize: 15, marginBottom: 8 }}>Document repository</p>
            <p style={{ fontSize: 13, color: 'var(--cd-text-muted)' }}>
              Upload and archive weekly, monthly, and quarterly reports here.
            </p>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
