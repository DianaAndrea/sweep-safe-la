# SweepSafe — Product Notes & Memory

A running log of decisions and open items so context isn't lost between sessions
and between machines (this repo gets pulled into the local build on the iMac).

## Open requests / feedback

### 1. Map + cards layout on mobile  ✅ addressed (2026-07)
**Problem:** On mobile the map filled the screen and the status cards were
overlaid on top of it, so pressing around the map made it hard to see whether
parking was safe or what the rules were.

**Fix shipped:**
- Map now lives in a panel that **expands / collapses**. A pill button on the
  map toggles between a compact view (`42vh`, cards visible below) and a
  full-height view. Cards moved *below* the map into a scrollable area instead
  of floating on top of it. See `src/pages/MainView.tsx`.
- Fixed map jank: the map used to be destroyed and rebuilt on every park / move.
  It's now initialized once and updated via `flyTo` + marker moves. Added a
  `ResizeObserver` so the map canvas re-sizes correctly when the panel
  expands/collapses. See `src/components/Map.tsx` and
  `src/components/map/MapMarkers.tsx`.

### 2. Missing street data (esp. Downtown LA)  ⚠️ partially addressed — needs a real pipeline
**Problem:** Streets the user knows in downtown aren't populating. Root cause:
`src/Resources/Assets/simplified_street_cleaning.json` only had **2 streets**,
and `getStreetCleaningGeoJSON()` **fakes** the geometry (draws parallel lines
around wherever you are) instead of using real road coordinates.

**Interim fix shipped:** expanded the seed file to ~30 real downtown LA streets
(Spring, Main, Broadway, Hill, Olive, Grand, Hope, Flower, Figueroa, Los Angeles
St, San Pedro, 1st–9th, Olympic, Alameda, Central, Wilshire, etc.) with
realistic schedules. This makes more data show up in lists, but the map still
doesn't place segments on their true geographic location.

**To actually solve it — real data pipeline (decision needed):**
The City of LA publishes street-sweeping routes as open data (LA GeoHub /
data.lacity.org — the "Street Sweeping Routes" layer, available as GeoJSON).
Options, cheapest → most robust:

- **A. Bundle a real static GeoJSON.** Download the LA street-sweeping GeoJSON
  once, trim to the coverage area, commit it, and drive both the map layer and
  the schedule lookup from it (replaces the faked geometry in
  `getStreetCleaningGeoJSON`). Pros: real road placement, no runtime API, works
  offline. Cons: file can be large (needs trimming / simplification); data goes
  stale until re-pulled.
- **B. Live query at runtime.** Fetch the routes near the user's location from
  the LA open-data API (or a Supabase table we load it into — Supabase is
  already wired up in `src/integrations/supabase`). Pros: always current, small
  bundle. Cons: needs network, needs the data loaded/hosted somewhere.
- **C. Geocode the segments we have.** Keep the current schedule schema but add
  real lat/lng per segment (via Mapbox geocoding of the cross-streets) so the
  map draws them in the right place. Pros: incremental. Cons: geocoding accuracy
  for "from/to street" segments is fiddly.

Recommended: **A** to get real geometry on the map fast, then **B** via Supabase
for freshness once the shape is proven.

## Environment / deploy notes
- This is a Vite + React + TypeScript + Tailwind app (shadcn/ui), Mapbox GL for
  the map, Supabase client present. Originally scaffolded via Lovable/Base44.
- The map requires a **Mapbox public token**, entered at runtime via
  `MapboxTokenForm`. For a real build we should move this to an env var
  (`VITE_MAPBOX_TOKEN`) instead of prompting each session.
- Work for this session lives on branch `claude/parking-map-card-layout-xojq4t`.
  Changes are committed + pushed here; pull this branch into the local iMac build
  to see them. This session does **not** push directly to the iMac.
