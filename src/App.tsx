import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FleetProvider } from './context/FleetContext';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import DriverManagement from './pages/DriverManagement';
import IncidentIntelligence from './pages/IncidentIntelligence';
import SafetyVault from './pages/SafetyVault';
import ReportsReviews from './pages/ReportsReviews';
import Operations from './pages/Operations';
import Settings from './pages/Settings';
import Maintenance from './pages/Maintenance';

export default function App() {
  return (
    <FleetProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Driver Management */}
            <Route path="/drivers" element={<DriverManagement tab="drivers" />} />
            <Route path="/drivers/coaching" element={<DriverManagement tab="coaching" />} />
            <Route path="/drivers/training" element={<DriverManagement tab="training" />} />
            <Route path="/drivers/certifications" element={<DriverManagement tab="certifications" />} />

            {/* Incident Intelligence */}
            <Route path="/incidents" element={<IncidentIntelligence tab="events" />} />
            <Route path="/incidents/analysis" element={<IncidentIntelligence tab="by-driver" />} />
            <Route path="/incidents/response" element={<IncidentIntelligence tab="patterns" />} />

            {/* Safety Vault */}
            <Route path="/vault" element={<SafetyVault tab="records" />} />
            <Route path="/vault/safeiq" element={<SafetyVault tab="safeiq" />} />
            <Route path="/vault/investigations" element={<SafetyVault tab="investigations" />} />
            <Route path="/vault/actions" element={<SafetyVault tab="actions" />} />
            <Route path="/vault/acknowledgements" element={<SafetyVault tab="acknowledgements" />} />
            <Route path="/vault/audit" element={<SafetyVault tab="audit" />} />


            {/* Reports & Reviews */}
            <Route path="/reports" element={<Navigate to="/reports/weekly" replace />} />
            <Route path="/reports/weekly" element={<ReportsReviews tab="weekly" />} />
            <Route path="/reports/monthly" element={<ReportsReviews tab="monthly" />} />
            <Route path="/reports/quarterly" element={<ReportsReviews tab="quarterly" />} />
            <Route path="/reports/actions" element={<ReportsReviews tab="actions" />} />
            <Route path="/reports/documents" element={<ReportsReviews tab="documents" />} />

            {/* Operations */}
            <Route path="/operations" element={<Navigate to="/operations/utilization" replace />} />
            <Route path="/operations/utilization" element={<Operations tab="utilization" />} />
            <Route path="/operations/productivity" element={<Operations tab="productivity" />} />
            <Route path="/operations/economics" element={<Operations tab="economics" />} />

            {/* Maintenance */}
            <Route path="/maintenance" element={<Maintenance />} />

            {/* Settings */}
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
