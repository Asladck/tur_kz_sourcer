/**
 * Builds src/data/basemap.json — an offline base map for the region between
 * Turkey and Kazakhstan from Natural Earth 1:50m country polygons (public
 * domain, via the world-atlas package). Run once: `node scripts/make-basemap.mjs`.
 * The output is committed, so the map works without internet access.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const topo = JSON.parse(await readFile(join(root, 'node_modules/world-atlas/countries-50m.json'), 'utf8'));
const world = feature(topo, topo.objects.countries);

// [west, south, east, north] — wider than the visible area so clip edges stay off-screen.
const BBOX = [8, 22, 108, 64];
const round = (n) => Math.round(n * 100) / 100; // ~1 km, plenty for zoom ≤ 8

/** Sutherland–Hodgman clipping of a closed ring against an axis-aligned box. */
function clipRing(ring) {
  const edges = [
    (p) => p[0] >= BBOX[0], (p) => p[0] <= BBOX[2], (p) => p[1] >= BBOX[1], (p) => p[1] <= BBOX[3],
  ];
  const cut = [
    (a, b) => [BBOX[0], a[1] + ((b[1] - a[1]) * (BBOX[0] - a[0])) / (b[0] - a[0])],
    (a, b) => [BBOX[2], a[1] + ((b[1] - a[1]) * (BBOX[2] - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (BBOX[1] - a[1])) / (b[1] - a[1]), BBOX[1]],
    (a, b) => [a[0] + ((b[0] - a[0]) * (BBOX[3] - a[1])) / (b[1] - a[1]), BBOX[3]],
  ];
  let pts = ring.slice(0, -1);
  for (let e = 0; e < 4 && pts.length; e++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i];
      const prev = pts[(i + pts.length - 1) % pts.length];
      const inCur = edges[e](cur);
      const inPrev = edges[e](prev);
      if (inCur) {
        if (!inPrev) out.push(cut[e](prev, cur));
        out.push(cur);
      } else if (inPrev) out.push(cut[e](prev, cur));
    }
    pts = out;
  }
  if (pts.length < 3) return null;
  const r = pts.map(([x, y]) => [round(x), round(y)]);
  r.push(r[0]);
  return r;
}

const features = [];
for (const f of world.features) {
  if (!f.geometry) continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const clipped = polys
    .map((poly) => {
      const outer = clipRing(poly[0]);
      if (!outer) return null;
      return [outer, ...poly.slice(1).map(clipRing).filter(Boolean)];
    })
    .filter(Boolean);
  if (!clipped.length) continue;
  features.push({
    type: 'Feature',
    id: f.id,
    properties: { name: f.properties.name },
    geometry: { type: 'MultiPolygon', coordinates: clipped },
  });
}

const out = { type: 'FeatureCollection', bbox: BBOX, source: 'Natural Earth 1:50m (public domain) via world-atlas', features };
await writeFile(join(root, 'src/data/basemap.json'), JSON.stringify(out));
console.log(`basemap: ${features.length} countries, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
