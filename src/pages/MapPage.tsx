import {
  LngLatBounds,
  Map as MLMap,
  NavigationControl,
  setWorkerUrl,
  type ExpressionSpecification,
  type GeoJSONSource,
  type LngLatBoundsLike,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 runs its tile parser in a module worker; ship it as a build asset.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { FilterBar } from '../components/FilterBar';
import { PairNames } from '../components/Morphemes';
import { Breadcrumbs } from '../components/Nav';
import { Icon, INK, LINK_COLORS, LinkBadge, OBJ_SHAPES, ObjBadge, ObjShape, SIDE_COLORS, Value } from '../components/ui';
import { entries, getEntry } from '../data/dataset';
import { LINK_TYPES, OBJ_CATS, type Entry, type ObjCat, type SideKey } from '../data/types';
import { useI18n, type Lang } from '../i18n/i18n';
import { draftCount, exportJson, loadDraft, saveDraft, type Draft, type LatLon } from '../lib/coordDraft';
import { downloadText } from '../lib/csv';
import { useEditor } from '../lib/editor';
import { applyFilters, useFilters } from '../lib/filters';
import { usePageMeta } from '../lib/meta';
import { fold, translit } from '../lib/text';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
// Rough extents for the quick-jump buttons (west, south, east, north).
const BOUNDS: Record<'kz' | 'tr' | 'all', LngLatBoundsLike> = {
  kz: [46.4, 40.5, 87.4, 55.5],
  tr: [25.6, 35.8, 44.9, 42.2],
  all: [25.5, 35.5, 87.5, 55.6],
};
const PAPER = '#FAF7F0';

setWorkerUrl(workerUrl);

// ── helpers ──────────────────────────────────────────────────────────────

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** OpenFreeMap Positron; without internet a schematic style from the bundled Natural Earth outlines. */
async function loadStyle(): Promise<{ style: StyleSpecification; offline: boolean }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(STYLE_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(String(res.status));
    return { style: (await res.json()) as StyleSpecification, offline: false };
  } catch {
    const basemap = (await import('../data/basemap.json')).default as unknown as GeoJSON.FeatureCollection;
    return {
      offline: true,
      style: {
        version: 8,
        sources: { countries: { type: 'geojson', data: basemap } },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#dde8ec' } },
          {
            id: 'land',
            type: 'fill',
            source: 'countries',
            paint: { 'fill-color': ['match', ['get', 'name'], 'Kazakhstan', '#f4ecd6', 'Turkey', '#f4e0da', '#f3f1ea'] },
          },
          {
            id: 'focus-outline',
            type: 'line',
            source: 'countries',
            filter: ['in', ['get', 'name'], ['literal', ['Kazakhstan', 'Turkey']]],
            paint: { 'line-color': ['match', ['get', 'name'], 'Kazakhstan', SIDE_COLORS.kz, SIDE_COLORS.tr], 'line-width': 1.2 },
          },
        ],
      },
    };
  }
}

/** Great-circle path between two [lat, lon] points, as [lon, lat] for GeoJSON. */
function greatCircle(a: LatLon, b: LatLon, n = 64): [number, number][] {
  const rad = Math.PI / 180;
  const [p1, l1, p2, l2] = [a[0] * rad, a[1] * rad, b[0] * rad, b[1] * rad];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
  if (d < 1e-9) return [[a[1], a[0]], [b[1], b[0]]];
  return Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
    const y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
    const z = A * Math.sin(p1) + B * Math.sin(p2);
    return [Math.atan2(y, x) / rad, Math.atan2(z, Math.hypot(x, y)) / rad];
  });
}

/** Marker icons: shape = object type, fill = side (KZ gold, TR red). */
function addIcons(map: MLMap) {
  const px = 44;
  for (const side of ['kz', 'tr'] as const) {
    for (const cat of OBJ_CATS) {
      const id = `pt-${side}-${cat}`;
      if (map.hasImage(id)) continue;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = px;
      const ctx = canvas.getContext('2d')!;
      const scale = (px - 10) / 12;
      ctx.translate(5, 5);
      ctx.scale(scale, scale);
      const path = new Path2D(OBJ_SHAPES[cat]);
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(31,42,51,0.35)';
      ctx.shadowBlur = 3;
      ctx.lineWidth = 2.4 / scale;
      ctx.strokeStyle = cat === 'unspecified' ? SIDE_COLORS[side] : '#ffffff';
      ctx.fillStyle = cat === 'unspecified' ? PAPER : SIDE_COLORS[side];
      ctx.fill(path);
      ctx.shadowColor = 'transparent';
      ctx.stroke(path);
      if (cat !== 'unspecified') {
        ctx.lineWidth = 0.6 / scale;
        ctx.strokeStyle = 'rgba(31,42,51,0.45)';
        ctx.stroke(path);
      }
      map.addImage(id, ctx.getImageData(0, 0, px, px), { pixelRatio: 2 });
    }
  }
}

const LABEL_FIELD: Record<Lang, ExpressionSpecification> = {
  kk: ['coalesce', ['get', 'name:kk'], ['get', 'name:ru'], ['get', 'name']],
  tr: ['coalesce', ['get', 'name:tr'], ['get', 'name:latin'], ['get', 'name']],
  ru: ['coalesce', ['get', 'name:ru'], ['get', 'name']],
};

/** Place names of the base map in the interface language where OSM has them. */
function localizeLabels(map: MLMap, lang: Lang) {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'symbol' && /^(label_|water_name)/.test(layer.id)) {
      map.setLayoutProperty(layer.id, 'text-field', LABEL_FIELD[lang]);
    }
  }
}

function addLayers(map: MLMap, withText: boolean) {
  map.addSource('arcs', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('points', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterRadius: 34,
    clusterMaxZoom: 6,
  });
  const linkColor = ['match', ['get', 'link'], ...LINK_TYPES.flatMap((k) => [k, LINK_COLORS[k]]), LINK_COLORS.doubtful] as unknown as ExpressionSpecification;
  map.addLayer({
    id: 'arcs-line',
    type: 'line',
    source: 'arcs',
    filter: ['!=', ['get', 'link'], 'doubtful'],
    layout: { 'line-cap': 'round' },
    paint: { 'line-color': linkColor, 'line-width': 2.2, 'line-opacity': 0.85 },
  });
  map.addLayer({
    id: 'arcs-dashed',
    type: 'line',
    source: 'arcs',
    filter: ['==', ['get', 'link'], 'doubtful'],
    paint: { 'line-color': linkColor, 'line-width': 2.2, 'line-opacity': 0.85, 'line-dasharray': [2, 2] },
  });
  map.addLayer({ id: 'arcs-hit', type: 'line', source: 'arcs', paint: { 'line-color': '#000', 'line-width': 14, 'line-opacity': 0 } });
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': INK,
      'circle-opacity': 0.85,
      'circle-radius': ['step', ['get', 'point_count'], 13, 10, 17, 40, 22],
      'circle-stroke-color': PAPER,
      'circle-stroke-width': 2,
    },
  });
  if (withText) {
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'points',
      filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-allow-overlap': true },
      paint: { 'text-color': PAPER },
    });
  }
  map.addLayer({
    id: 'points',
    type: 'symbol',
    source: 'points',
    filter: ['!', ['has', 'point_count']],
    layout: { 'icon-image': ['get', 'icon'], 'icon-allow-overlap': true, 'icon-ignore-placement': true },
  });
}

// ── side panel pieces ────────────────────────────────────────────────────

function PairCard({ entry, located, onClose }: { entry: Entry; located: boolean; onClose: () => void }) {
  const { t, lp } = useI18n();
  return (
    <article className="map-card" aria-label={`${entry.kz.name} — ${entry.tr.name}`}>
      <div className="map-card-head">
        <span className="entry-id">№ {entry.id}</span>
        <LinkBadge type={entry.link} raw={entry.link_type_draft} />
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
          <Icon name="close" />
        </button>
      </div>
      <PairNames entry={entry} />
      <dl className="map-card-sides">
        {(['kz', 'tr'] as const).map((side) => (
          <div key={side} className={`mcs mcs-${side}`}>
            <dt>
              <ObjBadge cat={side === 'kz' ? entry.kzCat : entry.trCat} side={side} />
            </dt>
            <dd lang="kk">
              <Value v={entry[side].location} />
            </dd>
          </div>
        ))}
      </dl>
      {!located && <p className="map-card-note">{t('map.selectedNoCoords')}</p>}
      <Link className="btn btn-primary btn-small" to={lp(`/entry/${entry.id}`)}>
        {t('common.more')}
        <Icon name="arrow-right" />
      </Link>
    </article>
  );
}

function Legend() {
  const { t } = useI18n();
  return (
    <details className="map-legend" open={typeof window === 'undefined' || window.innerWidth >= 1100}>
      <summary>{t('map.legend')}</summary>
      <div className="ml-group">
        <span className="ml-title">{t('map.legendSides')}</span>
        <span className="ml-item">
          <span className="ml-dot" style={{ background: SIDE_COLORS.kz }} />
          {t('common.kz')}
        </span>
        <span className="ml-item">
          <span className="ml-dot" style={{ background: SIDE_COLORS.tr }} />
          {t('common.tr')}
        </span>
      </div>
      <div className="ml-group">
        <span className="ml-title">{t('map.legendShapes')}</span>
        {OBJ_CATS.map((c: ObjCat) => (
          <span key={c} className="ml-item">
            <ObjShape cat={c} size={12} />
            {t(`obj.${c}`)}
          </span>
        ))}
      </div>
      <div className="ml-group">
        <span className="ml-title">{t('map.legendArcs')}</span>
        {LINK_TYPES.map((k) => (
          <span key={k} className="ml-item">
            <svg width="22" height="10" aria-hidden="true">
              <path d="M1 8 Q11 0 21 8" fill="none" stroke={LINK_COLORS[k]} strokeWidth="2.5" strokeDasharray={k === 'doubtful' ? '4 3' : undefined} />
            </svg>
            {t(`link.${k}`)}
          </span>
        ))}
      </div>
    </details>
  );
}

// ── page ─────────────────────────────────────────────────────────────────

export default function MapPage() {
  const { t, lang, lp } = useI18n();
  usePageMeta(t('meta.map.title'), t('meta.map.description'));
  const editor = useEditor();
  const { filters, update, toggle, clear, params, setParams } = useFilters();
  const focus = Number(params.get('focus')) || null;

  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [noWebgl, setNoWebgl] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [listQuery, setListQuery] = useState('');
  const [draft, setDraft] = useState<Draft>(() => (editor ? loadDraft() : {}));
  const [target, setTarget] = useState<{ id: number; side: SideKey } | null>(null);

  // Effective coordinates: stored data, plus drafted ones in editor mode.
  const coordsOf = useCallback(
    (e: Entry, side: SideKey): LatLon | null => {
      const d = editor ? draft[e.id]?.[side] : undefined;
      if (d) return d;
      const s = e[side];
      return typeof s.lat === 'number' && typeof s.lon === 'number' ? [s.lat, s.lon] : null;
    },
    [editor, draft],
  );

  const filtered = useMemo(() => applyFilters(entries, filters), [filters]);
  const located = useMemo(() => filtered.filter((e) => coordsOf(e, 'kz') || coordsOf(e, 'tr')), [filtered, coordsOf]);
  const pairedCount = filtered.filter((e) => coordsOf(e, 'kz') && coordsOf(e, 'tr')).length;
  const missing = useMemo(() => filtered.filter((e) => !(coordsOf(e, 'kz') && coordsOf(e, 'tr'))), [filtered, coordsOf]);
  const visibleMissing = useMemo(() => {
    const q = fold(listQuery.trim());
    if (!q) return missing;
    return missing.filter((e) => e.haystack.includes(q) || e.haystack.includes(translit(q)) || e.haystack.includes(translit(q, true)));
  }, [missing, listQuery]);

  const selected = focus ? getEntry(focus) : undefined;
  const selectedLocated = !!selected && !!(coordsOf(selected, 'kz') || coordsOf(selected, 'tr'));

  const select = useCallback(
    (id: number | null) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (id) p.set('focus', String(id));
          else p.delete('focus');
          return p;
        },
        { replace: true },
      ),
    [setParams],
  );

  // Latest values for map event handlers that are registered once.
  const live = useRef({ select, target, setHover });
  live.current = { select, target, setHover };
  const placeRef = useRef<(c: LatLon) => void>(() => {});

  // ── create the map once ──
  useEffect(() => {
    let cancelled = false;
    let map: MLMap | null = null;
    (async () => {
      if (!webglSupported()) {
        setNoWebgl(true);
        return;
      }
      const { style, offline } = await loadStyle();
      if (cancelled || !container.current) return;
      setOffline(offline);
      const touch = window.matchMedia('(pointer: coarse)').matches;
      map = new MLMap({
        container: container.current,
        style,
        bounds: BOUNDS.all,
        fitBoundsOptions: { padding: 30 },
        dragRotate: false,
        pitchWithRotate: false,
        maxPitch: 0,
        cooperativeGestures: touch,
        attributionControl: { compact: true },
        locale: {
          'NavigationControl.ZoomIn': t('map.zoomIn'),
          'NavigationControl.ZoomOut': t('map.zoomOut'),
          'NavigationControl.ResetBearing': t('map.resetBearing'),
          'CooperativeGesturesHandler.MobileHelpText': t('map.coopTouch'),
        },
      });
      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;
      map.on('load', () => {
        if (!map) return;
        addIcons(map);
        addLayers(map, !offline);
        if (!offline) localizeLabels(map, lang);

        const hoverOn = (e: MapLayerMouseEvent) => {
          const pid = e.features?.[0]?.properties?.pid;
          if (!live.current.target) map!.getCanvas().style.cursor = 'pointer';
          live.current.setHover(typeof pid === 'number' ? pid : null);
        };
        const hoverOff = () => {
          if (!live.current.target) map!.getCanvas().style.cursor = '';
          live.current.setHover(null);
        };
        for (const layer of ['points', 'arcs-hit']) {
          map.on('mousemove', layer, hoverOn);
          map.on('mouseleave', layer, hoverOff);
          map.on('click', layer, (e) => {
            if (live.current.target) return; // placing a coordinate
            const pid = e.features?.[0]?.properties?.pid;
            if (typeof pid === 'number') live.current.select(pid);
          });
        }
        map.on('mouseenter', 'clusters', () => (map!.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', 'clusters', () => (map!.getCanvas().style.cursor = ''));
        map.on('click', 'clusters', async (e) => {
          if (live.current.target) return;
          const f = e.features?.[0];
          const id = f?.properties?.cluster_id;
          if (!f || typeof id !== 'number') return;
          const zoom = await (map!.getSource('points') as GeoJSONSource).getClusterExpansionZoom(id);
          map!.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        });
        map.on('click', (e) => {
          if (live.current.target) placeRef.current([e.lngLat.lat, e.lngLat.lng]);
        });
        setReady(true);
      });
    })();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // The map is created once; language and data changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── interface language: base-map labels and control titles ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!offline) localizeLabels(map, lang);
    const root = map.getContainer();
    for (const [sel, key] of [
      ['.maplibregl-ctrl-zoom-in', 'map.zoomIn'],
      ['.maplibregl-ctrl-zoom-out', 'map.zoomOut'],
    ] as const) {
      const btn = root.querySelector<HTMLButtonElement>(sel);
      if (btn) {
        btn.title = t(key);
        btn.setAttribute('aria-label', t(key));
      }
    }
  }, [lang, ready, offline, t]);

  // ── data ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const points: GeoJSON.Feature[] = [];
    const arcs: GeoJSON.Feature[] = [];
    for (const e of located) {
      const kz = coordsOf(e, 'kz');
      const tr = coordsOf(e, 'tr');
      for (const [side, c, cat] of [
        ['kz', kz, e.kzCat],
        ['tr', tr, e.trCat],
      ] as const) {
        if (!c) continue;
        points.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [c[1], c[0]] },
          properties: { pid: e.id, side, icon: `pt-${side}-${cat}`, name: e[side].name },
        });
      }
      if (kz && tr) {
        arcs.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: greatCircle(kz, tr) },
          properties: { pid: e.id, link: e.link ?? 'doubtful' },
        });
      }
    }
    (map.getSource('points') as GeoJSONSource).setData({ type: 'FeatureCollection', features: points });
    (map.getSource('arcs') as GeoJSONSource).setData({ type: 'FeatureCollection', features: arcs });
  }, [located, coordsOf, ready]);

  // ── hover / selection: highlight the pair and its arc, dim the rest ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const hi = hover ?? (selectedLocated ? focus : null);
    const is: ExpressionSpecification = ['==', ['get', 'pid'], hi ?? -1];
    map.setPaintProperty('points', 'icon-opacity', hi == null ? 1 : ['case', is, 1, 0.2]);
    for (const layer of ['arcs-line', 'arcs-dashed']) {
      map.setPaintProperty(layer, 'line-opacity', hi == null ? 0.85 : ['case', is, 1, 0.1]);
      map.setPaintProperty(layer, 'line-width', hi == null ? 2.2 : ['case', is, 4.5, 2]);
    }
    map.setPaintProperty('clusters', 'circle-opacity', hi == null ? 0.85 : 0.3);
  }, [hover, focus, selectedLocated, ready]);

  // ── fly to the selected pair (only when the selection changes) ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selected) return;
    const pts = (['kz', 'tr'] as const).map((s) => coordsOf(selected, s)).filter((c): c is LatLon => !!c);
    if (!pts.length) return;
    const b = new LngLatBounds();
    pts.forEach((c) => b.extend([c[1], c[0]]));
    map.fitBounds(b, { padding: 80, maxZoom: 6, duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, ready]);

  // ── editor: place a coordinate by clicking on the map ──
  placeRef.current = (c: LatLon) => {
    if (!target) return;
    const next: Draft = { ...draft, [target.id]: { ...draft[target.id], [target.side]: c } };
    setDraft(next);
    saveDraft(next);
    const e = getEntry(target.id)!;
    const other: SideKey = target.side === 'kz' ? 'tr' : 'kz';
    const otherDone = !!next[target.id]?.[other] || (typeof e[other].lat === 'number' && typeof e[other].lon === 'number');
    setTarget(otherDone ? null : { id: target.id, side: other });
  };

  useEffect(() => {
    const map = mapRef.current;
    if (map && ready) map.getCanvas().style.cursor = target ? 'crosshair' : '';
  }, [target, ready]);

  const removeDraft = (id: number) => {
    const next = { ...draft };
    delete next[id];
    setDraft(next);
    saveDraft(next);
  };

  const jump = (k: keyof typeof BOUNDS) => mapRef.current?.fitBounds(BOUNDS[k], { padding: 30, duration: 700 });

  const drafted = Object.keys(draft)
    .map(Number)
    .map(getEntry)
    .filter((e): e is Entry => !!e);
  const targetEntry = target ? getEntry(target.id) : undefined;

  return (
    <div className="container-wide page-body map-page">
      <Breadcrumbs items={[{ label: t('nav.map') }]} />
      <header className="page-head">
        <h1>{t('map.title')}</h1>
        <p className="lead">{t('map.lead')}</p>
      </header>

      <FilterBar filters={filters} toggle={toggle} update={update} clear={clear} found={filtered.length} collapsible />

      <div className="map-layout">
        <div className="map-frame">
          <div ref={container} className="map-canvas" role="region" aria-label={t('map.title')} />
          {noWebgl && <div className="map-fallback">{t('map.noWebgl')}</div>}
          <div className="map-jump" role="group" aria-label={t('map.jump')}>
            <button type="button" onClick={() => jump('kz')}>
              <span className="ml-dot" style={{ background: SIDE_COLORS.kz }} />
              {t('map.jumpKz')}
            </button>
            <button type="button" onClick={() => jump('tr')}>
              <span className="ml-dot" style={{ background: SIDE_COLORS.tr }} />
              {t('map.jumpTr')}
            </button>
            <button type="button" onClick={() => jump('all')}>
              {t('map.jumpAll')}
            </button>
          </div>
          <Legend />
          {offline && (
            <div className="map-notice" role="status">
              {t('map.offline')}
            </div>
          )}
          {editor && target && targetEntry && (
            <div className="map-placing" role="status">
              <Icon name="pin" />
              {t('editor.coordClick', { name: `№${target.id} ${targetEntry[target.side].name} (${target.side.toUpperCase()})` })}
            </div>
          )}
        </div>

        <aside className={`map-side${selected ? ' has-card' : ''}`} aria-label={t('map.noCoordsTitle')}>
          {selected && <PairCard entry={selected} located={selectedLocated} onClose={() => select(null)} />}

          {editor && (
            <section className="editor-tool">
              <h2 className="h-small">{t('editor.coordTool')}</h2>
              <p className="small">{t('editor.coordSteps')}</p>
              {target && targetEntry ? (
                <div className="et-target">
                  <span>
                    <strong>{t('editor.coordTarget')}:</strong> №{target.id} {targetEntry.kz.name} — {targetEntry.tr.name}
                  </span>
                  <div className="lang-switch" role="group" aria-label={t('editor.coordSide')}>
                    {(['kz', 'tr'] as const).map((s) => (
                      <button key={s} type="button" aria-pressed={target.side === s} onClick={() => setTarget({ ...target, side: s })}>
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-small btn-ghost" onClick={() => setTarget(null)}>
                    {t('editor.coordCancel')}
                  </button>
                </div>
              ) : (
                <p className="small muted">{t('editor.coordPick')}</p>
              )}
              <p className="small">
                <strong>{t('editor.coordDrafts', { n: draftCount(draft) })}</strong>
              </p>
              {drafted.length > 0 && (
                <ul className="et-drafts">
                  {drafted.map((e) => (
                    <li key={e.id}>
                      <button type="button" className="link-btn" onClick={() => select(e.id)}>
                        №{e.id} {e.kz.name} — {e.tr.name}
                      </button>
                      <span className="nc-flags">
                        {(['kz', 'tr'] as const).map((s) => (
                          <span key={s} className={draft[e.id]?.[s] ? 'on' : undefined}>
                            {s.toUpperCase()}
                          </span>
                        ))}
                      </span>
                      <button type="button" className="icon-btn" onClick={() => removeDraft(e.id)} aria-label={`${t('editor.coordRemove')} №${e.id}`}>
                        <Icon name="close" size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="et-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  disabled={!draftCount(draft)}
                  onClick={() => downloadText('toponyms_kz_tr.json', exportJson(draft), 'application/json;charset=utf-8')}
                >
                  <Icon name="json" />
                  {t('editor.coordExport')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  disabled={!draftCount(draft)}
                  onClick={() => {
                    if (window.confirm(t('editor.coordClearConfirm'))) {
                      setDraft({});
                      saveDraft({});
                      setTarget(null);
                    }
                  }}
                >
                  {t('editor.coordClear')}
                </button>
              </div>
              <p className="small muted">{t('editor.coordStorage')}</p>
            </section>
          )}

          <section className="nocoords">
            <h2 className="h-small">
              {t('map.noCoordsTitle')} <span className="count-pill">{missing.length}</span>
            </h2>
            {missing.length > 0 && <p className="small muted">{t('map.noCoordsNotice')}</p>}
            <input
              type="search"
              className="side-filter"
              placeholder={t('map.filter')}
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              aria-label={t('map.filter')}
            />
            <ul className="nocoords-list">
              {visibleMissing.map((e) => {
                const names = (
                  <>
                    <span className="nc-id">{e.id}</span>
                    <span className="nc-names">
                      <span lang="kk">{e.kz.name}</span> — <span lang="tr">{e.tr.name}</span>
                    </span>
                  </>
                );
                return (
                  <li key={e.id} className={target?.id === e.id ? 'is-target' : undefined}>
                    {editor ? (
                      <button
                        type="button"
                        className="nc-main"
                        aria-pressed={target?.id === e.id}
                        onClick={() => setTarget({ id: e.id, side: coordsOf(e, 'kz') ? 'tr' : 'kz' })}
                      >
                        {names}
                      </button>
                    ) : (
                      <Link className="nc-main" to={lp(`/entry/${e.id}`)}>
                        {names}
                      </Link>
                    )}
                    <span className="nc-flags">
                      {!coordsOf(e, 'kz') && <span title={t('map.missingKz')}>KZ</span>}
                      {!coordsOf(e, 'tr') && <span title={t('map.missingTr')}>TR</span>}
                    </span>
                    <span className="swatch nc-link" style={{ background: e.link ? LINK_COLORS[e.link] : '#ccc' }} title={e.link ? t(`link.${e.link}`) : e.link_type_draft} />
                  </li>
                );
              })}
            </ul>
          </section>
          <p className="map-caption muted small">{t('map.shown', { n: pairedCount })}</p>
        </aside>
      </div>
    </div>
  );
}
