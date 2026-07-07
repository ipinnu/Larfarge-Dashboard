import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

const IDENTITY_URL = 'https://identity.za.mixtelematics.com/core/connect/token';
const API_BASE = 'https://integrate.za.mixtelematics.com/api';
const ORG_ID = process.env.LAFARGE_ORG_ID;
const OVERSPEED_ID = '-3890646499157906515';

async function authenticate() {
  const params = new URLSearchParams({
    grant_type: 'password',
    username: process.env.MIX_USERNAME,
    password: process.env.MIX_PASSWORD,
    client_id: process.env.MIX_CLIENT_ID,
    client_secret: process.env.MIX_CLIENT_SECRET,
    scope: 'offline_access MiX.Integrate',
  });
  const res = await fetch(IDENTITY_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
  const data = await res.json();
  if (!data.access_token) { console.error('Auth failed:', data); process.exit(1); }
  console.log('✅ Authenticated');
  return data.access_token;
}

(async () => {
  const token = await authenticate();

  // Fetch active events filtered to overspeeding type
  const url = `${API_BASE}/activeevents/groups/createdsince/entitytype/Asset/sincetoken/NEW/quantity/10`;
  console.log(`\nGET ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: `[${ORG_ID}]`,
  });

  console.log(`Status: ${res.status}`);
  if (!res.ok) { console.error(await res.text()); process.exit(1); }

  const text = await res.text();
  const safe = text.replace(/:\s*(-?\d{16,})/g, ': "$1"');
  const events = JSON.parse(safe);

  const overspeed = events.filter(e => e.EventTypeId === OVERSPEED_ID);
  console.log(`\nTotal events: ${events.length} | Overspeeding: ${overspeed.length}`);

  if (overspeed.length === 0) {
    console.log('\nNo live overspeeding events right now. Dumping first event of any type instead:');
    if (events[0]) console.log(JSON.stringify(events[0], null, 2));
    return;
  }

  console.log('\n--- First overspeeding event (full raw) ---');
  console.log(JSON.stringify(overspeed[0], null, 2));

  console.log('\n--- Speed-related fields ---');
  const e = overspeed[0];
  console.log('e.Speed:', e.Speed);
  console.log('e.SpeedKilometresPerHour:', e.SpeedKilometresPerHour);
  console.log('e.Value:', e.Value);
  console.log('e.EventValue:', e.EventValue);
  console.log('e.Position?.SpeedKilometresPerHour:', e.Position?.SpeedKilometresPerHour);
  console.log('e.SpeedLimit:', e.SpeedLimit);
  console.log('e.ZoneSpeedLimit:', e.ZoneSpeedLimit);
  console.log('e.SpeedLimitKilometresPerHour:', e.SpeedLimitKilometresPerHour);
})();
