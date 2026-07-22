# Week seed data

Git-friendly MiX history (≤6 days — API lookback limit) for:

- Incident Intelligence → `events.jsonl`
- Utilization & KPIs → `kpi-events.jsonl` + `trips.jsonl.gz`
- Fuel pages → `fuel-history.jsonl`

## Refresh from local logs (no MiX call)

```bash
npm run seed:pack
git add seed/week
git commit -m "Refresh week MiX seed"
git push
```

## Or pull fresh from MiX (needs working auth)

```bash
npm run backfill:week
```

## On the droplet

After `git pull`, restart PM2 (`server.js` auto-imports seed) or:

```bash
npm run seed:import
pm2 restart larfarge-dashboard --update-env
```
