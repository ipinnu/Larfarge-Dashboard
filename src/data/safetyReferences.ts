export interface SafetyReference {
  fmcsa: string;
  frsc: string;
  coaching: string;
  threshold?: string;
}

const REFERENCES: Record<string, SafetyReference> = {
  'Harsh Braking': {
    fmcsa: 'FMCSA BASIC B1 (Unsafe Driving) — harsh braking frequency is a primary predictor of rear-end collision risk; drivers above 8 events per 30 days require formal intervention.',
    frsc: 'FRSC Highway Code §14(3) — minimum following distances in adverse weather; wet-road stopping distance increases by at least 40%.',
    coaching: 'Schedule defensive driving refresher within 5 days. Emphasise 4-second wet-road following rule. Inspect brake system if maintenance is overdue.',
    threshold: '8 harsh braking events / 30 days',
  },
  'Harsh Acceleration': {
    fmcsa: 'FMCSA BASIC B1 (Unsafe Driving) — harsh acceleration events correlate with loss-of-control and cargo shift incidents in heavy commercial vehicles.',
    frsc: 'FRSC RTSSS §7 — smooth acceleration standards for commercial haulage; aggressive throttle use is a documented unsafe driving behaviour.',
    coaching: 'Review smooth acceleration technique in next coaching session. Check if schedule pressure or dispatch deadlines are causing aggressive driving.',
    threshold: '6 harsh acceleration events / 30 days',
  },
  Overspeeding: {
    fmcsa: 'FMCSA BASIC B1 — speed violations require documentation at first offence; repeat violations within 14 days elevate to formal carrier safety review.',
    frsc: 'FRSC Speed Monitoring Guidelines — urban corridor limits apply on Apapa-Oshodi and Lagos-Ibadan expressways; tiered overspeed triggers graduated enforcement.',
    coaching: 'Document event and conduct pre-shift speed limit briefing. Second event within 14 days triggers formal review with fleet safety officer.',
    threshold: '3 speeding events / 14 days',
  },
  'Overspeed Tiered': {
    fmcsa: 'FMCSA BASIC B1 — tiered overspeed events indicate sustained speed non-compliance beyond momentary lapse.',
    frsc: 'FRSC Speed Monitoring Guidelines — graduated penalties apply for sustained overspeed in commercial fleet operations.',
    coaching: 'Immediate speed compliance coaching required. Review route scheduling to eliminate time-pressure incentives for speeding.',
    threshold: '2 tiered overspeed events / 14 days',
  },
  Panic: {
    fmcsa: 'FMCSA BASIC B2 (Crash Indicator) — panic activations require documented incident review and near-miss classification.',
    frsc: 'FRSC Emergency Response Protocol — panic events mandate supervisor contact within 1 hour and incident filing within 24 hours.',
    coaching: 'Supervisor must contact driver within 1 hour. Conduct incident interview within 24 hours. File record in Safety Vault before next assignment.',
    threshold: 'Any panic event',
  },
  'Excessive Idling': {
    fmcsa: 'FMCSA HOS — engine-on idle periods exceeding 5 minutes should be logged under fuel efficiency and emissions tracking.',
    frsc: 'FRSC RTSSS idle reduction policies — engine-off protocol recommended during stationary queues exceeding 10 minutes where safe.',
    coaching: 'Review operational context before coaching. If port/queue idling, escalate to operations for scheduling optimisation rather than driver sanction.',
    threshold: '20 minutes continuous idle',
  },
};

export function lookupSafetyReference(label?: string, type?: string): SafetyReference | null {
  if (label && REFERENCES[label]) return REFERENCES[label];
  if (type === 'panic') return REFERENCES['Panic'];
  return null;
}

export function formatReferenceForPrompt(ref: SafetyReference): string {
  return `FMCSA: ${ref.fmcsa}\nFRSC: ${ref.frsc}\nStandard coaching baseline: ${ref.coaching}${ref.threshold ? `\nIntervention threshold: ${ref.threshold}` : ''}`;
}
