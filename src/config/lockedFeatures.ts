/**
 * Features locked behind the current package.
 * Pages wrapped in <FeatureGate featureId="..."> will blur and show an upgrade message.
 */
export type LockedFeatureId = 'dispatch' | 'reports' | 'aria' | 'maintenance';

/** Feature IDs that are not part of the current package */
export const LOCKED_FEATURES: ReadonlySet<LockedFeatureId> = new Set([
  'dispatch',
  'reports',
  'aria',
  'maintenance',
]);

export function isFeatureLocked(featureId?: string): boolean {
  if (!featureId) return false;
  return LOCKED_FEATURES.has(featureId as LockedFeatureId);
}

/** Sidebar entries shown under "Upcoming features" */
export const UPCOMING_FEATURES = [
  { path: '/trips', label: 'Trips', featureId: 'dispatch' as LockedFeatureId },
  { path: '/trips/dispatch', label: 'Dispatch', featureId: 'dispatch' as LockedFeatureId },
  { path: '/reports', label: 'Reports', featureId: 'reports' as LockedFeatureId },
  { path: '/reports/documents', label: 'Documents', featureId: 'reports' as LockedFeatureId },
  { path: '/maintenance', label: 'Maintenance', featureId: 'maintenance' as LockedFeatureId },
  { path: '/aria', label: 'AI Insights', featureId: 'aria' as LockedFeatureId },
] as const;
