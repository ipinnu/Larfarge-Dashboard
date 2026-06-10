import * as dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';

const IDENTITY_URL = 'https://identity.za.mixtelematics.com/core/connect/token';
const API_BASE = 'https://integrate.za.mixtelematics.com/api';
const LAFARGE_ORG_ID = process.env.LAFARGE_ORG_ID;

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
  if (!data.access_token) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  console.log('✅ Authenticated\n');
  return data.access_token;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function tryEndpoint(token, url, label) {
  console.log(`🔍 Trying: ${label}`);
  console.log(`   ${url}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  console.log(`   Status: ${res.status}`);
  if (res.status === 200) {
    const text = await res.text();
    const safe = text.replace(/:\s*(-?\d{16,})/g, ': "$1"');
    try {
      const data = JSON.parse(safe);
      console.log(`   ✅ Got ${Array.isArray(data) ? data.length + ' items' : 'object'}\n`);
      return data;
    } catch {
      console.log(`   ⚠️ Could not parse JSON\n`);
      return null;
    }
  }
  console.log('');
  return null;
}

async function main() {
  const token = await authenticate();

  const endpoints = [
    [`${API_BASE}/eventtypes`, 'Event Types (global)'],
    [`${API_BASE}/eventtypes/organisation/${LAFARGE_ORG_ID}`, 'Event Types (by org)'],
    [`${API_BASE}/eventtypes/group/${LAFARGE_ORG_ID}`, 'Event Types (by group)'],
    [`${API_BASE}/events/types`, 'Events/Types'],
    [`${API_BASE}/events/types/organisation/${LAFARGE_ORG_ID}`, 'Events/Types (by org)'],
    [`${API_BASE}/eventdefinitions`, 'Event Definitions (global)'],
    [`${API_BASE}/eventdefinitions/organisation/${LAFARGE_ORG_ID}`, 'Event Definitions (by org)'],
    [`${API_BASE}/eventcategories`, 'Event Categories'],
    [`${API_BASE}/triggeredevents/organisation/${LAFARGE_ORG_ID}`, 'Triggered Events (by org)'],
  ];

  let found = null;
  for (const [url, label] of endpoints) {
    const result = await tryEndpoint(token, url, label);
    if (result && !found) found = result;
    await sleep(1500);
  }

  if (found) {
    const list = Array.isArray(found) ? found : [found];
    console.log('='.repeat(70));
    console.log('EVENT TYPES FOUND:');
    console.log('='.repeat(70));
    list.forEach(et => {
      const id = et.EventTypeId ?? et.Id ?? et.id ?? 'N/A';
      const name = et.Name ?? et.EventTypeName ?? et.Description ?? et.name ?? 'N/A';
      console.log(`  ID: ${id}`);
      console.log(`  Name: ${name}`);
      if (et.Category) console.log(`  Category: ${et.Category}`);
      console.log('');
    });

    // Cross-check against our hardcoded constants
    const KNOWN = {
      '-4444421556390778105': 'PANIC_EVENT_TYPE_ID',
      '-3393530750645328945': 'IDLE_EVENT_TYPE_ID',
      '4650840888823746894': 'EXCESSIVE_IDLE_EVENT_TYPE_ID',
      '4750800303282680186': 'Harsh Braking',
      '6454149451280645233': 'Harsh Acceleration',
      '-3890646499157906515': 'Overspeeding',
      '-4596269900191457380': 'Overspeed Tiered',
      '4291175374538259638': 'Harsh Cornering',
    };

    console.log('='.repeat(70));
    console.log('CROSS-CHECK vs HARDCODED CONSTANTS:');
    console.log('='.repeat(70));
    Object.entries(KNOWN).forEach(([id, label]) => {
      const match = list.find(et => (et.EventTypeId ?? et.Id ?? et.id)?.toString() === id);
      const status = match ? `✅ CONFIRMED — "${match.Name ?? match.EventTypeName ?? match.Description}"` : '❌ NOT FOUND in response';
      console.log(`  ${label} (${id}): ${status}`);
    });
  } else {
    console.log('❌ No event type endpoint returned data.\n');
  }

  // Fallback: dump raw active events so we can read EventTypeId values directly
  console.log('='.repeat(70));
  console.log('RAW ACTIVE EVENTS (last 1000 — reading EventTypeId from live data):');
  console.log('='.repeat(70));
  const sinceToken = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14) + '000';
  // Use a wide since window — go back 24h
  const since24h = (() => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}000`;
  })();

  const evRes = await fetch(
    `${API_BASE}/activeevents/groups/createdsince/entitytype/Asset/sincetoken/${since24h}/quantity/1000`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: `[${LAFARGE_ORG_ID}]`,
    }
  );
  console.log(`Active events endpoint status: ${evRes.status}`);
  if (evRes.status === 200) {
    const text = await evRes.text();
    const safe = text.replace(/:\s*(-?\d{16,})/g, ': "$1"');
    const events = JSON.parse(safe);
    console.log(`Total events returned: ${events.length}\n`);

    // Aggregate unique EventTypeIds
    const typeMap = new Map();
    events.forEach(e => {
      const id = e.EventTypeId?.toString();
      const name = e.EventTypeName ?? e.EventType ?? e.Description ?? null;
      if (id) {
        if (!typeMap.has(id)) typeMap.set(id, { count: 0, name });
        typeMap.get(id).count++;
      }
    });

    console.log(`Unique EventTypeIds seen (${typeMap.size}):`);
    [...typeMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([id, { count, name }]) => {
        console.log(`  EventTypeId: ${id}  |  Count: ${count}  |  Name: ${name ?? 'N/A'}`);
      });
  } else {
    console.log('Could not fetch live active events.');
  }
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
