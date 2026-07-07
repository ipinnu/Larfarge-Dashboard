import * as dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';

const IDENTITY_URL = 'https://identity.za.mixtelematics.com/core/connect/token';
const API_BASE = 'https://integrate.za.mixtelematics.com/api';
const ORG_ID = process.env.LAFARGE_ORG_ID;

async function authenticate() {
  const params = new URLSearchParams({
    grant_type: 'password',
    username: process.env.MIX_USERNAME,
    password: process.env.MIX_PASSWORD,
    client_id: process.env.MIX_CLIENT_ID,
    client_secret: process.env.MIX_CLIENT_SECRET,
    scope: 'offline_access MiX.Integrate',
  });

  const res = await fetch(IDENTITY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await res.json();
  if (!data.access_token) {
    console.error('❌ Auth failed:', JSON.stringify(data));
    process.exit(1);
  }
  console.log('✅ Authenticated');
  return data.access_token;
}

function sinceTokenDaysAgo(days) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}000`;
}

async function testTrips(token) {
  // Try 1 day, 3 days, 7 days until we find data
  for (const days of [1, 3, 7]) {
  const sinceToken = sinceTokenDaysAgo(days);
  const url = `${API_BASE}/trips/groups/createdsince/organisation/${ORG_ID}/sincetoken/${sinceToken}/quantity/1000`;
  console.log(`\n🛣️  Trying last ${days} day(s) — sinceToken: ${sinceToken}`);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  console.log(`  Status: ${res.status} ${res.statusText}`);
  console.log(`  GetSinceToken: ${res.headers.get('GetSinceToken') ?? '(none)'}`);

  if (res.status === 204) { console.log('  ℹ️  204 — no content'); continue; }
  if (!res.ok) { console.error('  ❌ Error:', await res.text()); continue; }

  const text = await res.text();
  const safe = text.replace(/:\s*(-?\d{16,})/g, ': "$1"');
  const trips = JSON.parse(safe);

  console.log(`  ✅ Got ${trips.length} trip(s)`);

  if (trips.length > 0) {
    console.log(`\n  First trip keys: ${Object.keys(trips[0]).join(', ')}\n`);
    trips.slice(0, 3).forEach((t, i) => {
      console.log(`  --- Trip ${i + 1} ---`);
      console.log(`    TripId:      ${t.TripId ?? t.TripID ?? t.Id ?? '?'}`);
      console.log(`    AssetId:     ${t.AssetId ?? t.AssetID ?? '?'}`);
      console.log(`    TripStart:   ${t.TripStart ?? t.StartDateTime ?? '?'}`);
      console.log(`    TripEnd:     ${t.TripEnd ?? t.EndDateTime ?? '?'}`);
      console.log(`    Distance km: ${t.DistanceKilometers ?? t.DistanceKilometres ?? '?'}`);
      console.log(`    Fuel L:      ${t.FuelUsedLitres ?? '?'}`);
    });
    break; // found data — no need to try longer ranges
  }
  } // end for
}

(async () => {
  console.log(`ORG_ID: ${ORG_ID}`);
  const token = await authenticate();
  await testTrips(token);
})();
