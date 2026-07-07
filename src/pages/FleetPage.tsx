import { useState } from 'react';
import { LayoutGrid, Map, Table } from 'lucide-react';
import { useFleet, type StatusFilter } from '../context/FleetContext';
import AnomaliesTable from '../components/AnomaliesTable';
import MapView from '../components/MapView';
import GroupedView from '../components/GroupedView';

type ViewMode = 'table' | 'map' | 'grouped';

export default function FleetPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { authFetch, metadata, vehicles } = useFleet();

  const handleMapAcknowledge = async (id: string) => {
    try {
      await authFetch('/api/acknowledged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {}
  };

  return (
    <div>
      <div className="bpl-page-header">
        <h1 className="bpl-page-title">Live Fleet</h1>
        <p className="bpl-page-subtitle">
          {vehicles.length} assets · {metadata.moving} moving · table, grouped, and map views
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        {(['table', 'grouped', 'map'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setViewMode(v)}
            className="bpl-btn-secondary"
            style={{
              padding: '5px 12px', fontSize: 12,
              background: viewMode === v ? 'var(--bpl-blue-soft)' : undefined,
              borderColor: viewMode === v ? 'var(--bpl-blue)' : undefined,
              color: viewMode === v ? 'var(--bpl-blue)' : undefined,
            }}
          >
            {v === 'table' && <><Table size={12} /> Table</>}
            {v === 'grouped' && <><LayoutGrid size={12} /> Grouped</>}
            {v === 'map' && <><Map size={12} /> Map</>}
          </button>
        ))}
      </div>

      {viewMode === 'table' && (
        <AnomaliesTable
          statusFilter={statusFilter}
          onFilterChange={f => setStatusFilter(f as StatusFilter)}
          authFetch={authFetch}
        />
      )}
      {viewMode === 'grouped' && (
        <GroupedView statusFilter={statusFilter} authFetch={authFetch} />
      )}
      {viewMode === 'map' && (
        <MapView
          authFetch={authFetch}
          statusFilter={statusFilter}
          onAcknowledge={handleMapAcknowledge}
        />
      )}
    </div>
  );
}
