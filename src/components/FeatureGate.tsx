import type { ReactNode } from 'react';

interface Props {
  featureId?: string;
  children: ReactNode;
}

export default function FeatureGate({ children }: Props) {
  return <>{children}</>;
}
