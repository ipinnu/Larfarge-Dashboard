import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FleetProvider } from './context/FleetContext';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import FleetPage from './pages/FleetPage';
import DispatchPage from './pages/DispatchPage';
import TripsPage from './pages/TripsPage';
import AiInsightsPage from './pages/AiInsightsPage';
import ReportsPage from './pages/ReportsPage';
import DocumentsPage from './pages/DocumentsPage';
import DriverManagement from './pages/DriverManagement';
import IncidentIntelligence from './pages/IncidentIntelligence';
import Safety from './pages/Safety';
import Settings from './pages/Settings';
import Maintenance from './pages/Maintenance';
import Tankers from './pages/Tankers';
import FuelMonitoring from './pages/FuelMonitoring';
import FuelConsumption from './pages/FuelConsumption';
import OperationalKpi from './pages/OperationalKpi';

export default function App() {
  return (
    <FleetProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fleet" element={<FleetPage />} />

            <Route path="/drivers" element={<DriverManagement />} />
            <Route path="/drivers/*" element={<Navigate to="/drivers" replace />} />

            <Route path="/incidents" element={<IncidentIntelligence tab="events" />} />
            <Route path="/incidents/analysis" element={<Navigate to="/incidents" replace />} />
            <Route path="/incidents/response" element={<IncidentIntelligence tab="patterns" />} />

            <Route path="/safety" element={<Safety />} />

            <Route path="/kpi" element={<OperationalKpi />} />

            <Route path="/fuel" element={<Navigate to="/fuel/monitoring" replace />} />
            <Route path="/fuel/monitoring" element={<FuelMonitoring />} />
            <Route path="/fuel/consumption" element={<FuelConsumption />} />
            <Route path="/operations/fuel" element={<Navigate to="/fuel/monitoring" replace />} />
            <Route path="/operations/fuel/consumption" element={<Navigate to="/fuel/consumption" replace />} />

            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/dispatch" element={<DispatchPage />} />
            <Route path="/dispatch" element={<Navigate to="/trips/dispatch" replace />} />
            <Route path="/aria" element={<AiInsightsPage />} />

            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/documents" element={<DocumentsPage />} />
            <Route path="/reports/*" element={<Navigate to="/reports" replace />} />

            <Route path="/operations" element={<Navigate to="/trips" replace />} />
            <Route path="/operations/*" element={<Navigate to="/trips" replace />} />

            <Route path="/tankers" element={<Tankers />} />
            <Route path="/maintenance" element={<Maintenance />} />

            <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
            <Route path="/settings/general" element={<Settings tab="general" />} />
            <Route path="/settings/thresholds" element={<Settings tab="thresholds" />} />
            <Route path="/settings/api" element={<Settings tab="api" />} />
            <Route path="/settings/roles" element={<Settings tab="roles" />} />
          </Route>
        </Routes>
      </HashRouter>
    </FleetProvider>
  );
}
