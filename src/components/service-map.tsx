import { useEffect, useMemo, useRef, useState } from 'react';
import { ClientOnly, Link } from '@tanstack/react-router';
import { ArrowUpRight, MapPin, Search } from 'lucide-react';
import { suburbs } from '@/lib/site-data';
import { T } from '@/lib/site-content';
import { Button } from '@/components/ui/button';

type LeafletMap = import('leaflet').Map;


function MapCanvas({ selected, onSelect }: { selected: string | null; onSelect: (name: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, import('leaflet').CircleMarker>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        center: [-38.32, 145.02],
        zoom: 10,
        scrollWheelZoom: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);
      const style = getComputedStyle(document.documentElement);
      const primary = style.getPropertyValue('--primary').trim() || 'oklch(0.43 0.067 162)';
      suburbs.forEach((s) => {
        const marker = L.circleMarker([s.lat, s.lng], {
          radius: 7,
          color: primary,
          weight: 2,
          fillColor: primary,
          fillOpacity: 0.55,
        })
          .addTo(map)
          .bindTooltip(s.name, { direction: 'top', offset: [0, -6] });
        marker.on('click', () => onSelect(s.name));
        markersRef.current.set(s.name, marker);
      });
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [onSelect]);

  useEffect(() => {
    if (!selected || !mapRef.current) return;
    const s = suburbs.find((x) => x.name === selected);
    if (!s) return;
    mapRef.current.flyTo([s.lat, s.lng], 12, { duration: 0.8 });
    markersRef.current.get(selected)?.openTooltip();
  }, [selected]);

  return <div ref={containerRef} className="h-[320px] w-full md:h-[440px]" aria-label="Map of suburbs Fyson Tiling services" />;
}

export function ServiceMapSection() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement | null>>(new Map());

  useEffect(() => {
    if (!selected) return;
    const item = itemRefs.current.get(selected);
    item?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suburbs;
    return suburbs.filter((s) => s.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <section className="border-b border-border py-16 md:py-24">
      <div className="site-width">
        <p className="eyebrow mb-3 text-primary"><T k="map.eyebrow" /></p>
        <h2 className="section-title mb-4"><T k="map.title" /></h2>
        <p className="mb-8 max-w-xl text-sm leading-7 text-muted-foreground"><T k="map.intro" /></p>
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div>
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your suburb…"
                aria-label="Search suburbs"
                className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm outline-none focus:border-primary"
              />
            </label>
            <ul className="mt-4 grid max-h-[360px] grid-cols-2 gap-1 overflow-y-auto pr-1">
              {filtered.map((s) => (
                <li
                  key={s.name}
                  ref={(el) => {
                    itemRefs.current.set(s.name, el);
                  }}
                >
                  <Button
                    asChild
                    variant="ghost"
                    className={`group flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-full px-3 py-2 text-left text-sm transition-colors ${
                      selected === s.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <Link
                      to="/contact"
                      search={{ suburb: s.name }}
                      aria-label={`Send an enquiry about ${s.name}`}
                      title={`Enquire about ${s.name}`}
                      onClick={() => setSelected(s.name)}
                      className="flex w-full min-w-0 items-center gap-2"
                    >
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{s.name}</span>
                      <ArrowUpRight size={14} className="ml-auto shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </Button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="col-span-2 px-3 py-4 text-sm text-muted-foreground">
                  No matching suburb — we may still cover your area.
                  <Button asChild variant="link" className="mt-2 block h-auto px-0"><Link to="/contact" search={{ suburb: query.trim() }}>Enquire about your area <ArrowUpRight className="inline" /></Link></Button>
                </li>
              )}
            </ul>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border">
            <ClientOnly fallback={<div className="flex h-[320px] items-center justify-center bg-muted text-sm text-muted-foreground md:h-[440px]">Loading map…</div>}>
              <MapCanvas selected={selected} onSelect={setSelected} />
            </ClientOnly>
          </div>
        </div>
      </div>
    </section>
  );
}
