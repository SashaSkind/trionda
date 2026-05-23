// Trionda Assist — wireframes
// Sketchy low-fi using the Trionda ball palette (blue / green / red on cream).
//
// Components exported on window:
//   MapHoverDrawer, StadiumStacked,
//   ChatFloating, ChatReddit, ChatMaps, ChatStates,
//   Storyboard

const TRI = {
  ink: '#15171a', inkSoft: '#4a4a4a', inkFaint: '#8b8b8b',
  paper: '#fbf7ee', paper2: '#f3eeda', paper3: '#e8e1c8',
  red: '#E1252C', green: '#009A4E', blue: '#0061B2',
  redSoft: '#fde2e3', greenSoft: '#d7f0e1', blueSoft: '#d4e6f7',
};

// 16 World Cup 2026 host stadiums with real lon/lat
const STADIUMS = [
  { id: 'van', city: 'Vancouver',     name: 'BC Place',          c: 'can', flag: '🇨🇦', lon: -123.112, lat: 49.277, matches: 7,  cap: 54500 },
  { id: 'sea', city: 'Seattle',       name: 'Lumen Field',       c: 'usa', flag: '🇺🇸', lon: -122.332, lat: 47.595, matches: 6,  cap: 68740 },
  { id: 'sfo', city: 'Bay Area',      name: "Levi's Stadium",    c: 'usa', flag: '🇺🇸', lon: -121.970, lat: 37.404, matches: 6,  cap: 68500 },
  { id: 'lax', city: 'Los Angeles',   name: 'SoFi Stadium',      c: 'usa', flag: '🇺🇸', lon: -118.339, lat: 33.953, matches: 8,  cap: 70240 },
  { id: 'kc',  city: 'Kansas City',   name: 'GEHA Arrowhead',    c: 'usa', flag: '🇺🇸', lon: -94.484,  lat: 39.049, matches: 6,  cap: 76416 },
  { id: 'dal', city: 'Dallas',        name: 'AT&T Stadium',      c: 'usa', flag: '🇺🇸', lon: -97.093,  lat: 32.747, matches: 9,  cap: 80000 },
  { id: 'hou', city: 'Houston',       name: 'NRG Stadium',       c: 'usa', flag: '🇺🇸', lon: -95.411,  lat: 29.685, matches: 7,  cap: 72220 },
  { id: 'atl', city: 'Atlanta',       name: 'Mercedes-Benz',     c: 'usa', flag: '🇺🇸', lon: -84.401,  lat: 33.755, matches: 8,  cap: 71000 },
  { id: 'mia', city: 'Miami',         name: 'Hard Rock',         c: 'usa', flag: '🇺🇸', lon: -80.239,  lat: 25.958, matches: 7,  cap: 65326 },
  { id: 'phi', city: 'Philadelphia',  name: 'Lincoln Financial', c: 'usa', flag: '🇺🇸', lon: -75.168,  lat: 39.901, matches: 6,  cap: 67594 },
  { id: 'nyc', city: 'New York / NJ', name: 'MetLife',           c: 'usa', flag: '🇺🇸', lon: -74.074,  lat: 40.814, matches: 8,  cap: 82500 },
  { id: 'bos', city: 'Boston',        name: 'Gillette',          c: 'usa', flag: '🇺🇸', lon: -71.264,  lat: 42.091, matches: 7,  cap: 65878 },
  { id: 'tor', city: 'Toronto',       name: 'BMO Field',         c: 'can', flag: '🇨🇦', lon: -79.418,  lat: 43.633, matches: 6,  cap: 45500 },
  { id: 'mex', city: 'Mexico City',   name: 'Estadio Azteca',    c: 'mex', flag: '🇲🇽', lon: -99.150,  lat: 19.303, matches: 5,  cap: 87000 },
  { id: 'gdl', city: 'Guadalajara',   name: 'Estadio Akron',     c: 'mex', flag: '🇲🇽', lon: -103.463, lat: 20.682, matches: 4,  cap: 49850 },
  { id: 'mty', city: 'Monterrey',     name: 'Estadio BBVA',      c: 'mex', flag: '🇲🇽', lon: -100.244, lat: 25.669, matches: 4,  cap: 53500 },
];

// ============================================================
// SKETCHY REAL MAP (d3-geo + topojson + rough.js, pannable)
// ============================================================
function SketchyMap({ width = 1640, height = 980, highlightId = 'nyc', onHover }) {
  const svgRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [hoveredId, setHoveredId] = React.useState(highlightId);
  const [projected, setProjected] = React.useState(null);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function build() {
      try {
        const data = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json').then(r => r.json());
        if (cancelled) return;
        if (!window.topojson || !window.d3 || !window.rough) {
          setLoadError(true); return;
        }
        const countries = window.topojson.feature(data, data.objects.countries);
        // USA=840, CAN=124, MEX=484
        const NA = countries.features.filter(f => ['840','124','484'].includes(String(f.id)));
        // Albers USA-friendly projection covering all 3 host nations
        const projection = window.d3.geoAlbers()
          .rotate([96, 0])
          .center([0, 38])
          .parallels([25, 50])
          .scale(width * 1.0)
          .translate([width / 2, height / 2 + 40]);
        const geoPath = window.d3.geoPath(projection);

        const svg = svgRef.current;
        if (!svg) return;
        // wipe (in case of HMR-ish)
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // Ocean background (subtle paper tone, no fill rect — keeps paper texture)
        const rc = window.rough.svg(svg, { options: { fontFamily: 'Caveat' } });

        // Per-country fills
        const fill = { '840': '#e5edf6', '124': '#f5dfe1', '484': '#dff0e6' };
        NA.forEach(f => {
          const d = geoPath(f);
          if (!d) return;
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          // soft drop offset
          const back = rc.path(d, {
            roughness: 2.4, bowing: 1.8, strokeWidth: 0,
            fill: fill[String(f.id)] || '#f1ece0',
            fillStyle: 'solid',
          });
          back.setAttribute('transform', 'translate(2.5,3)');
          back.setAttribute('opacity', '0.45');
          g.appendChild(back);
          // main shape
          const node = rc.path(d, {
            roughness: 2.2, bowing: 1.5,
            stroke: TRI.ink, strokeWidth: 1.8,
            fill: fill[String(f.id)] || '#f1ece0',
            fillStyle: 'solid',
            fillWeight: 1.4,
          });
          g.appendChild(node);
          // a second pass for extra sketch
          const pass2 = rc.path(d, {
            roughness: 3.4, bowing: 1.1,
            stroke: TRI.ink, strokeWidth: 0.9,
            fill: 'none',
          });
          pass2.setAttribute('opacity', '0.55');
          g.appendChild(pass2);
          svg.appendChild(g);
        });

        // Hand-lettered country labels
        const labels = [
          ['CANADA', -100, 60],
          ['UNITED STATES', -98, 39],
          ['MEXICO', -102, 23.5],
        ];
        labels.forEach(([name, lon, lat]) => {
          const [x, y] = projection([lon, lat]);
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          t.setAttribute('x', x); t.setAttribute('y', y);
          t.setAttribute('text-anchor', 'middle');
          t.setAttribute('font-family', 'Caveat');
          t.setAttribute('font-size', '34');
          t.setAttribute('letter-spacing', '4');
          t.setAttribute('fill', TRI.ink);
          t.setAttribute('opacity', '0.32');
          t.textContent = name;
          svg.appendChild(t);
        });

        // Some scribbled ocean swells for character
        for (let i = 0; i < 18; i++) {
          const cx = (i % 6) * (width / 6) + 40;
          const cy = (i < 6 ? 50 : i < 12 ? height - 110 : height - 50) + (i % 2) * 14;
          const node = rc.path(
            `M ${cx} ${cy} q 14 -8 28 0 t 28 0 t 28 0`,
            { roughness: 2.2, bowing: 2, stroke: TRI.blue, strokeWidth: 0.9 }
          );
          node.setAttribute('opacity', '0.35');
          svg.appendChild(node);
        }

        // Project pins
        const stops = STADIUMS.map(s => {
          const [x, y] = projection([s.lon, s.lat]);
          return { ...s, x, y };
        });
        if (!cancelled) setProjected(stops);
      } catch (err) {
        console.error('map build failed', err);
        if (!cancelled) setLoadError(true);
      }
    }
    build();
    return () => { cancelled = true; };
  }, [width, height]);

  // Mouse-drag pan
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let dragging = false, startX = 0, startY = 0, sl = 0, st = 0;
    function down(e) {
      if (e.target.closest('.pin') || e.target.closest('.preview-card')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      sl = el.scrollLeft; st = el.scrollTop;
      el.style.cursor = 'grabbing';
    }
    function move(e) {
      if (!dragging) return;
      el.scrollLeft = sl - (e.clientX - startX);
      el.scrollTop  = st - (e.clientY - startY);
    }
    function up() { dragging = false; el.style.cursor = 'grab'; }
    el.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      el.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  // Center scroll on first paint roughly on the US middle
  React.useEffect(() => {
    if (!projected || !containerRef.current) return;
    const el = containerRef.current;
    el.scrollLeft = Math.max(0, (width - el.clientWidth) / 2);
    el.scrollTop  = Math.max(0, (height - el.clientHeight) / 2 - 20);
  }, [projected, width, height]);

  const hovered = projected?.find(s => s.id === hoveredId);

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%', overflow: 'auto', cursor: 'grab',
      background: '#fbf7ee',
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)',
      backgroundSize: '24px 24px',
      position: 'relative',
    }}>
      <div style={{ width, height, position: 'relative' }}>
        <svg ref={svgRef} width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        {loadError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caveat', fontSize: 22, color: TRI.red }}>
            (offline preview — connect to load the sketchy map)
          </div>
        )}
        {/* Pins */}
        {projected?.map(s => {
          const active = s.id === hoveredId;
          return (
            <div
              key={s.id}
              className={`pin ${active ? 'big' : ''} ${s.c}`}
              style={{ left: s.x, top: s.y }}
              onMouseEnter={() => { setHoveredId(s.id); onHover?.(s); }}
              onClick={() => { setHoveredId(s.id); onHover?.(s); }}
            >
              <div className="dot" style={active ? { boxShadow: `0 0 0 8px ${s.c === 'usa' ? 'rgba(0,97,178,0.18)' : s.c === 'mex' ? 'rgba(0,154,78,0.18)' : 'rgba(225,37,44,0.18)'}` } : {}}/>
              <div className="stick"/>
              {active && (
                <div className="hand" style={{
                  position: 'absolute', top: 18, left: 16,
                  fontSize: 16, color: TRI.ink, whiteSpace: 'nowrap',
                  background: 'white', padding: '1px 6px', borderRadius: 4,
                  border: `1.4px solid ${TRI.ink}`,
                }}>{s.city}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* HUD: legend + zoom hint */}
      <div style={{
        position: 'sticky', left: 16, bottom: 16, marginTop: -64, width: 'fit-content',
        background: 'white', border: `1.8px solid ${TRI.ink}`, borderRadius: 10, padding: '8px 12px',
        fontFamily: 'Caveat', fontSize: 16, boxShadow: '3px 3px 0 ' + TRI.ink,
        display: 'flex', gap: 12, alignItems: 'center', zIndex: 3,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: TRI.blue,  borderRadius: '50%', border: '1.2px solid ' + TRI.ink }}/> USA
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: TRI.red,   borderRadius: '50%', border: '1.2px solid ' + TRI.ink }}/> Canada
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: TRI.green, borderRadius: '50%', border: '1.2px solid ' + TRI.ink }}/> Mexico
        </div>
        <div style={{ color: TRI.inkFaint, marginLeft: 8 }}>· drag to pan</div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED CHROME
// ============================================================
function Logo({ size = 22 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {/* Trionda ball: tri-color spherical mark */}
      <svg width={size + 6} height={size + 6} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="13" fill="white" stroke={TRI.ink} strokeWidth="1.8"/>
        <path d="M 16 3 A 13 13 0 0 1 28.3 19.5 Q 22 16 16 16 Z" fill={TRI.red}/>
        <path d="M 16 3 A 13 13 0 0 0 3.7 19.5 Q 10 16 16 16 Z" fill={TRI.blue}/>
        <path d="M 3.7 19.5 A 13 13 0 0 0 28.3 19.5 Q 22 17 16 17 Q 10 17 3.7 19.5 Z" fill={TRI.green}/>
        <circle cx="16" cy="16" r="13" fill="none" stroke={TRI.ink} strokeWidth="1.8"/>
      </svg>
      <span className="hand" style={{ fontSize: size + 8, fontWeight: 700, letterSpacing: -0.5 }}>
        trionda <span style={{ color: TRI.red }}>assist</span>
      </span>
    </div>
  );
}

function ChatFab({ side = 'left', label = 'Ask Trionda', tone = 'ink' }) {
  const bg = tone === 'red' ? TRI.red : TRI.ink;
  return (
    <div style={{
      position: 'absolute', bottom: 26, [side]: 26, zIndex: 6,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div className="chat-fab" style={{ background: bg, color: 'white' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 3 6 Q 3 3 6 3 L 18 3 Q 21 3 21 6 L 21 14 Q 21 17 18 17 L 11 17 L 6 21 L 6 17 Q 3 17 3 14 Z"/>
          <circle cx="8" cy="10" r="0.8" fill="white"/>
          <circle cx="12" cy="10" r="0.8" fill="white"/>
          <circle cx="16" cy="10" r="0.8" fill="white"/>
        </svg>
      </div>
      <div style={{
        background: 'white', border: `1.8px solid ${TRI.ink}`, borderRadius: 999,
        padding: '6px 14px', fontFamily: 'Caveat', fontSize: 20,
        boxShadow: '2px 2px 0 ' + TRI.ink,
      }}>{label}</div>
    </div>
  );
}

function TopBar({ title, right }) {
  return (
    <div style={{
      position: 'absolute', top: 22, left: 26, right: 26, zIndex: 5,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <Logo />
      {title && <div className="hand squiggle" style={{ fontSize: 22 }}>{title}</div>}
      <div style={{ display: 'flex', gap: 12 }}>
        {right || (
          <>
            <button className="btn-sketch">🇬🇧 EN</button>
            <button className="btn-sketch solid">Sign in</button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 01 — MAP LANDING (Option D · chosen)
// ============================================================
function MapHoverDrawer() {
  const [stop, setStop] = React.useState(STADIUMS.find(s => s.id === 'nyc'));
  return (
    <div className="ab" data-screen-label="01 Map landing">
      <TopBar title="16 stadiums. 3 countries. 1 tournament."/>
      <div style={{
        position: 'absolute', inset: '70px 26px 220px 26px',
        border: `2.4px solid ${TRI.ink}`, borderRadius: 12,
        overflow: 'hidden', background: '#fbf7ee',
      }}>
        <SketchyMap highlightId={stop.id} onHover={s => setStop(s)}/>
      </div>

      {/* Bottom drawer with preview of hovered/tapped stadium */}
      <div className="preview-card" style={{
        position: 'absolute', bottom: 26, left: 26, right: 26, height: 180,
        background: 'white', border: `2.4px solid ${TRI.ink}`, borderRadius: 12,
        boxShadow: `5px 5px 0 ${TRI.ink}`,
        display: 'flex', gap: 18, padding: 18, alignItems: 'stretch',
      }}>
        <div style={{
          width: 280, borderRadius: 8, overflow: 'hidden',
          border: `1.6px solid ${TRI.ink}`,
          background: 'repeating-linear-gradient(135deg, #ece6d3, #ece6d3 8px, #e5dec4 8px, #e5dec4 16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Caveat', fontSize: 18, color: TRI.inkSoft,
        }}>
          bird's-eye photo →
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="hand" style={{ fontSize: 36, fontWeight: 700 }}>{stop.name}</span>
            <span className="print" style={{ fontSize: 16, color: TRI.inkSoft }}>{stop.flag} {stop.city}</span>
          </div>
          <div className="print" style={{ fontSize: 14, color: TRI.inkSoft, marginBottom: 10 }}>
            capacity {stop.cap.toLocaleString()} · {stop.matches} matches
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {['Group stage','Round of 32','Round of 16', stop.id === 'nyc' ? '🏆 FINAL' : 'Quarter-final'].map((m,i)=>(
              <span key={i} className="ink-box" style={{ padding: '3px 10px', fontFamily: 'Caveat', fontSize: 15, background: i === 3 && stop.id === 'nyc' ? '#fef4a8' : 'white' }}>{m}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button className="btn-sketch red">Explore stadium →</button>
          </div>
        </div>
      </div>

      <ChatFab/>
      <div className="note" style={{ top: 92, right: 50 }}>
        <span className="arrow">↘</span>
        hand-drawn over real geo<br/>
        (d3-geo + rough.js) · drag to pan
      </div>
      <div className="note" style={{ bottom: 230, left: 50 }}>
        ← hover/tap a pin →<br/>
        drawer previews that stadium
      </div>
    </div>
  );
}

// ============================================================
// 02 — STADIUM PAGE (Option A · stacked, spots BELOW about)
// ============================================================
function StadiumNav({ stadium = "Levi's Stadium" }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, padding: '18px 32px', zIndex: 5,
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'linear-gradient(180deg, rgba(252,247,238,0.95), rgba(252,247,238,0))',
    }}>
      <button className="btn-sketch" style={{ padding: '4px 14px' }}>← Map</button>
      <Logo />
      <div className="hand" style={{ fontSize: 18, color: TRI.inkSoft }}>/ {stadium}</div>
      <div style={{ flex: 1 }}/>
      <button className="btn-sketch">Share</button>
      <button className="btn-sketch solid">Save trip</button>
    </div>
  );
}

function ScheduleCard({ teams = '🇧🇷 Brazil  vs  🇦🇷 Argentina', date = 'Sat Jun 13', time = '8:00 PM PT', stage = 'Group A · Match 8', highlight = false }) {
  return (
    <div className="ink-box" style={{ padding: '14px 16px', background: highlight ? '#fef4a8' : 'white', boxShadow: highlight ? '3px 3px 0 ' + TRI.ink : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div className="hand" style={{ fontSize: 14, color: TRI.red, minWidth: 70 }}>{stage.split('·')[0]}</div>
      <div style={{ flex: 1 }}>
        <div className="hand" style={{ fontSize: 22, fontWeight: 600 }}>{teams}</div>
        <div className="print" style={{ fontSize: 13, color: TRI.inkSoft }}>{date} · {time} · {stage.split('·')[1]?.trim()}</div>
      </div>
      <button className="btn-sketch" style={{ fontSize: 14, padding: '3px 10px' }}>tickets ↗</button>
    </div>
  );
}

function SpotsSection() {
  const [active, setActive] = React.useState('Food');
  const cats = [
    { name: 'Food',       emoji: '🍴', n: 5 },
    { name: 'Coffee',     emoji: '☕', n: 5 },
    { name: 'Shopping',   emoji: '🛍', n: 5 },
    { name: 'Nightlife',  emoji: '🍺', n: 5 },
    { name: 'Activities', emoji: '✨', n: 5 },
  ];
  const data = {
    Food: [
      { name: 'La Taqueria',           meta: '4.8 · $$ · Tacos · 0.8 mi',           why: 'best al pastor in the bay' },
      { name: 'Mi Pueblo Food Center', meta: '4.7 · $ · Mexican · 1.1 mi',          why: 'walkable from VTA' },
      { name: 'Sundance the Steakhouse', meta: '4.6 · $$$ · Steakhouse · 0.4 mi',   why: 'pre-game staple' },
      { name: 'Pho Hanoi',             meta: '4.6 · $ · Vietnamese · 1.0 mi',        why: 'kitchen open late' },
      { name: 'Birrieria El Padrino',  meta: '4.8 · $ · Birria · 1.4 mi',           why: 'locals only' },
    ],
    Coffee: [
      { name: 'Chromatic Coffee',  meta: '4.7 · $ · 2.9 mi',  why: 'roasts on-site, opens 6am' },
      { name: 'Voyager Craft Coffee', meta: '4.6 · $ · 1.1 mi', why: 'cortado is the move' },
      { name: 'Academic Coffee',  meta: '4.7 · $ · 5.0 mi',  why: 'study + match prep' },
      { name: 'Caffe Frascati',   meta: '4.5 · $ · 4.8 mi',  why: 'historic + outdoor seats' },
      { name: 'Hub Coffee',       meta: '4.6 · $ · 0.7 mi',  why: 'closest to gate F' },
    ],
    Shopping: [], Nightlife: [], Activities: [],
  };
  const list = data[active] || data.Food;
  return (
    <section>
      <div className="hand" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
        Spots <span className="squiggle">nearby</span>
      </div>
      <div className="print" style={{ fontSize: 14, color: TRI.inkFaint, marginBottom: 18 }}>
        top 5 per category · via Google Maps Places, sorted by ★
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'flex-start' }}>
        {/* Category filter — sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'sticky', top: 80 }}>
          {cats.map(c => {
            const on = c.name === active;
            return (
              <button
                key={c.name}
                onClick={() => setActive(c.name)}
                className="ink-box"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: 'pointer',
                  background: on ? TRI.ink : 'white',
                  color: on ? 'white' : TRI.ink,
                  boxShadow: on ? '3px 3px 0 ' + TRI.red : 'none',
                  fontFamily: 'Caveat', fontSize: 22, fontWeight: 600,
                  textAlign: 'left',
                }}>
                <span style={{ fontSize: 22 }}>{c.emoji}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                <span className="print" style={{ fontSize: 13, opacity: on ? 0.8 : 0.5 }}>{c.n}</span>
              </button>
            );
          })}
          <div className="print" style={{ fontSize: 12, color: TRI.inkFaint, padding: '12px 4px', lineHeight: 1.4 }}>
            need something specific?<br/>
            ask the agent ↘
          </div>
        </aside>

        {/* Result list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.length === 0 ? (
            <div className="ink-box" style={{ padding: 18, background: 'white', color: TRI.inkFaint, fontFamily: 'Patrick Hand' }}>
              (loading top {active.toLowerCase()} spots via Google Maps Places…)
            </div>
          ) : list.map((s, i) => (
            <div key={i} className="ink-box" style={{
              padding: '14px 18px', background: 'white',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: i === 0 ? TRI.red : i === 1 ? TRI.blue : i === 2 ? TRI.green : '#fef4a8',
                color: i < 3 ? 'white' : TRI.ink,
                border: `1.6px solid ${TRI.ink}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Caveat', fontWeight: 700, fontSize: 20,
                flexShrink: 0,
              }}>{i+1}</div>
              <div style={{ flex: 1 }}>
                <div className="hand" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>{s.name}</div>
                <div className="print" style={{ fontSize: 13, color: TRI.inkSoft }}>{s.meta}</div>
                <div className="print" style={{ fontSize: 13, color: TRI.red, fontStyle: 'italic' }}>“{s.why}”</div>
              </div>
              <button className="btn-sketch" style={{ fontSize: 14, padding: '3px 10px' }}>open in maps ↗</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StadiumStacked() {
  return (
    <div className="ab" data-screen-label="02 Stadium page">
      <StadiumNav/>

      {/* HERO — image slot user fills in later */}
      <div style={{ position: 'relative', width: '100%', height: 640 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <image-slot
            id="hero-levis"
            placeholder="drop the Levi's Stadium bird's-eye photo here"
            shape="rect"
            style={{ width: '100%', height: '100%', display: 'block' }}
          ></image-slot>
        </div>
        {/* Color-wash + ink overlay so text reads on any photo */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,97,178,0.0) 0%, rgba(0,97,178,0.0) 40%, rgba(21,23,26,0.55) 100%)',
        }}/>
        {/* hero copy */}
        <div style={{ position: 'absolute', left: 32, bottom: 32, right: 32, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="print" style={{ fontSize: 14, letterSpacing: 3, color: 'white', opacity: 0.85 }}>HOST CITY · 06 OF 16</div>
            <div className="hand" style={{ fontSize: 84, fontWeight: 700, lineHeight: 0.95, textShadow: '2px 2px 0 ' + TRI.ink }}>Levi's Stadium</div>
            <div className="hand" style={{ fontSize: 30, opacity: 0.95, textShadow: '1px 1px 0 ' + TRI.ink }}>🇺🇸 Santa Clara, California · 68,500 seats</div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
            <div style={{ textShadow: '1px 1px 0 ' + TRI.ink }}>
              <div className="hand" style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>6</div>
              <div className="print" style={{ fontSize: 14 }}>matches</div>
            </div>
            <div style={{ textShadow: '1px 1px 0 ' + TRI.ink }}>
              <div className="hand" style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>SJC</div>
              <div className="print" style={{ fontSize: 14 }}>4 mi · nearest airport</div>
            </div>
            <div style={{ textShadow: '1px 1px 0 ' + TRI.ink }}>
              <div className="hand" style={{ fontSize: 56, fontWeight: 700, lineHeight: 1 }}>PT</div>
              <div className="print" style={{ fontSize: 14 }}>UTC −7</div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY — stacked sections, one column */}
      <div style={{ padding: '48px 80px 120px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 56 }}>
        {/* 1 · Matches */}
        <section>
          <div className="hand" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>Match <span className="squiggle">schedule</span></div>
          <div className="print" style={{ fontSize: 14, color: TRI.inkFaint, marginBottom: 18 }}>all kickoff times in Pacific Time</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ScheduleCard highlight stage="Group A · Match 8"/>
            <ScheduleCard teams="🇪🇸 Spain  vs  🇲🇽 Mexico" date="Mon Jun 15" time="5:00 PM PT" stage="Group B · Match 12"/>
            <ScheduleCard teams="🇯🇵 Japan  vs  🇩🇪 Germany" date="Thu Jun 18" time="2:00 PM PT" stage="Group D · Match 19"/>
            <ScheduleCard teams="🇫🇷 France  vs  🇧🇪 Belgium" date="Sun Jun 21" time="11:00 AM PT" stage="Group F · Match 27"/>
            <ScheduleCard teams="TBD  vs  TBD" date="Sat Jun 27" time="11:00 AM PT" stage="Round of 32 · Match 41"/>
            <ScheduleCard teams="TBD  vs  TBD" date="Wed Jul 01" time="2:00 PM PT" stage="Round of 16 · Match 53"/>
          </div>
        </section>

        {/* 2 · About the city */}
        <section>
          <div className="hand" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>About Santa Clara <span className="squiggle">&amp; the Bay</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'flex-start', marginTop: 14 }}>
            <p className="print" style={{ fontSize: 18, lineHeight: 1.7, color: TRI.ink, margin: 0 }}>
              Santa Clara sits in the geographic heart of Silicon Valley, 45 minutes south of San Francisco by car or Caltrain. Mediterranean climate, walkable downtowns in San Jose and SF, English widely spoken with strong Spanish and Mandarin presence. The stadium is car-accessible but VTA light rail drops you 200 metres from gate F — much easier on match days. Tipping 18–20% is standard at restaurants, and Pacific Time means kickoffs late morning to early evening for European fans.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['NEAREST AIRPORT','SJC · 4 mi', TRI.blue],
                ['FROM SFO','40 mi · 45 min', TRI.blue],
                ['GET TO STADIUM','VTA light rail', TRI.green],
                ['LANGUAGE','EN · ES · 中文', TRI.green],
                ['TIME ZONE','PT (UTC −7)', TRI.red],
                ['JUNE WEATHER','78°F · 26°C', TRI.red],
              ].map(([k,v,col])=>(
                <div key={k} className="ink-box" style={{ padding: '10px 14px', background: 'white' }}>
                  <div className="print" style={{ fontSize: 11, letterSpacing: 1.5, color: col }}>{k}</div>
                  <div className="hand" style={{ fontSize: 20, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · Spots nearby (was sidebar — now its own section, sidebar only for filters) */}
        <SpotsSection/>
      </div>

      <ChatFab label="ask about Levi's"/>

      <div className="note" style={{ top: 180, right: 40 }}>
        <span className="arrow">↗</span>
        hero = real photo<br/>
        drop one in via the slot
      </div>
      <div className="note" style={{ top: 1620, left: 24 }}>
        <span className="arrow">↘</span>
        spots is its own section now<br/>
        sidebar = category filter only
      </div>
    </div>
  );
}

// ============================================================
// 03 — CHAT AGENT (floating modal, single source line)
// ============================================================
function ChatShell({ children, headerCity = "Levi's Stadium · Santa Clara" }) {
  return (
    <div style={{
      width: 420, height: 540,
      background: 'white', border: `2.4px solid ${TRI.ink}`, borderRadius: 14,
      boxShadow: `6px 6px 0 ${TRI.ink}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
        borderBottom: `2px solid ${TRI.ink}`, background: TRI.paper,
      }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: TRI.red, border: `1.8px solid ${TRI.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 3 6 Q 3 3 6 3 L 18 3 Q 21 3 21 6 L 21 14 Q 21 17 18 17 L 11 17 L 6 21 L 6 17 Q 3 17 3 14 Z"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hand" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>trionda assist</div>
          <div className="print" style={{ fontSize: 11, color: TRI.inkSoft }}>
            <span style={{ color: TRI.green }}>●</span> on {headerCity}
          </div>
        </div>
        <button className="btn-sketch" style={{ padding: '0 8px', fontSize: 14, height: 26 }}>—</button>
        <button className="btn-sketch" style={{ padding: '0 8px', fontSize: 14, height: 26 }}>✕</button>
      </div>
      <div style={{ flex: 1, padding: 14, background: '#fbf7ee', overflow: 'hidden' }}>
        {children}
      </div>
      <div style={{ padding: 12, borderTop: `2px solid ${TRI.ink}`, background: TRI.paper, display: 'flex', gap: 8 }}>
        <div className="ink-box" style={{ flex: 1, padding: '8px 12px', background: 'white', fontFamily: 'Kalam', fontSize: 15, color: TRI.inkFaint }}>
          ask anything about this city…
        </div>
        <button className="btn-sketch solid" style={{ width: 44, justifyContent: 'center' }}>→</button>
      </div>
    </div>
  );
}

function Bubble({ from = 'agent', children, source }) {
  const isUser = from === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div className="ink-box" style={{
        maxWidth: '85%',
        padding: '10px 14px',
        background: isUser ? TRI.ink : '#fff',
        color: isUser ? '#fff' : TRI.ink,
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        fontFamily: 'Kalam', fontSize: 16, lineHeight: 1.45,
      }}>
        <div>{children}</div>
        {source && (
          <div className="print" style={{
            fontSize: 11, marginTop: 8, paddingTop: 6,
            borderTop: '1px dashed ' + (isUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'),
            opacity: 0.8, fontStyle: 'italic',
          }}>
            via {source}
          </div>
        )}
      </div>
    </div>
  );
}

function StageWithPage({ children, label = 'stadium page in background' }) {
  return (
    <div className="ab beige" data-screen-label={label} style={{ position: 'relative' }}>
      {/* faded page shadow */}
      <div style={{ position: 'absolute', inset: 20, border: `1.4px dashed ${TRI.inkFaint}`, borderRadius: 10, background: 'rgba(255,255,255,0.5)' }}/>
      <div style={{ position: 'absolute', top: 30, left: 36 }}>
        <Logo size={18}/>
      </div>
      <div style={{ position: 'absolute', top: 78, left: 36, right: 36, height: 200, borderRadius: 10, overflow: 'hidden', border: `1.4px dashed ${TRI.inkFaint}`, background: 'repeating-linear-gradient(135deg, #ece6d3, #ece6d3 6px, #e5dec4 6px, #e5dec4 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caveat', fontSize: 18, color: TRI.inkFaint }}>
        hero image
      </div>
      <div style={{ position: 'absolute', left: 36, top: 300, right: 36 }}>
        <div className="hand" style={{ fontSize: 32, fontWeight: 700, color: TRI.inkSoft }}>Levi's Stadium</div>
        <div className="print" style={{ fontSize: 13, color: TRI.inkFaint }}>matches · about · spots ↓</div>
      </div>
      {children}
    </div>
  );
}

function ChatFloating() {
  return (
    <StageWithPage label="03a Chat floating modal">
      <div style={{ position: 'absolute', left: 24, bottom: 24 }}>
        <ChatShell>
          <Bubble>
            hi! I know you're on the <b>Levi's Stadium</b> page. ask me anything about Santa Clara — matches, food, transit, hidden gems.
          </Bubble>
          <div className="print" style={{ fontSize: 12, color: TRI.inkFaint, margin: '4px 0 8px' }}>try:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['where do locals get coffee?',     TRI.red],
              ['best bar after Mexico match?',    TRI.green],
              ['how to get there without a car?', TRI.blue],
            ].map(([q,col])=>(
              <div key={q} className="ink-box" style={{ padding: '6px 10px', background: 'white', fontFamily: 'Caveat', fontSize: 16, borderLeft: `4px solid ${col}` }}>{q}</div>
            ))}
          </div>
        </ChatShell>
      </div>
      <div className="note" style={{ top: 60, right: 36 }}>
        modal floats above page<br/>
        page stays interactive<br/>
        <span className="arrow">↙</span>
      </div>
    </StageWithPage>
  );
}

function ChatReddit() {
  return (
    <StageWithPage label="03b Chat Reddit answer">
      <div style={{ position: 'absolute', left: 24, bottom: 24 }}>
        <ChatShell>
          <Bubble from="user">
            where do locals get coffee that isn't touristy?
          </Bubble>
          <div className="print" style={{ fontSize: 11, color: TRI.red, textAlign: 'center', margin: '0 0 6px', letterSpacing: 1 }}>
            · qualitative → searching Reddit ·
          </div>
          <Bubble source="r/AskNYC">
            <b>Chromatic Coffee</b> on S Bascom is the local pick — 3 mi west of the stadium, roasts on-site, opens 6am. Multiple threads call out their cortado.
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="btn-sketch" style={{ fontSize: 13, padding: '2px 8px' }}>📍 directions</span>
              <span className="btn-sketch" style={{ fontSize: 13, padding: '2px 8px' }}>save</span>
              <span className="btn-sketch" style={{ fontSize: 13, padding: '2px 8px' }}>more like this</span>
            </div>
          </Bubble>
        </ChatShell>
      </div>
      <div className="note" style={{ top: 60, right: 36 }}>
        ↓ source = one line<br/>
        “via r/AskNYC” · clickable
      </div>
    </StageWithPage>
  );
}

function ChatMaps() {
  return (
    <StageWithPage label="03c Chat Maps answer">
      <div style={{ position: 'absolute', left: 24, bottom: 24 }}>
        <ChatShell>
          <Bubble from="user">best pizza near the stadium?</Bubble>
          <div className="print" style={{ fontSize: 11, color: TRI.green, textAlign: 'center', margin: '0 0 6px', letterSpacing: 1 }}>
            · generic → Google Maps ·
          </div>
          <Bubble source="Google Maps">
            here are 3 well-reviewed spots within 1.5 mi:
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['A Slice of New York', '★ 4.7', '0.6 mi · $'],
                ['Pizz\u2019A Chicago',  '★ 4.5', '0.9 mi · $$'],
                ['Tony & Alba\u2019s',   '★ 4.6', '1.2 mi · $$'],
              ].map(([n,r,m],i)=>(
                <div key={i} className="ink-box" style={{ padding: '6px 10px', background: '#fbf7ee', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: TRI.blue, color: 'white', border: `1.4px solid ${TRI.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caveat', fontWeight: 700, fontSize: 13 }}>{i+1}</div>
                  <div style={{ flex: 1 }}>
                    <div className="hand" style={{ fontSize: 16, fontWeight: 600 }}>{n}</div>
                    <div className="print" style={{ fontSize: 11, color: TRI.inkSoft }}>{r} · {m}</div>
                  </div>
                  <span className="hand" style={{ fontSize: 16 }}>↗</span>
                </div>
              ))}
            </div>
          </Bubble>
        </ChatShell>
      </div>
      <div className="note" style={{ top: 60, right: 36 }}>
        same shape, different source:<br/>
        “via Google Maps” at the foot
      </div>
    </StageWithPage>
  );
}

function ChatStates() {
  const states = [
    { label: 'collapsed', body: (
      <div className="chat-fab" style={{ background: TRI.ink, color: 'white' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4"><path d="M 3 6 Q 3 3 6 3 L 18 3 Q 21 3 21 6 L 21 14 Q 21 17 18 17 L 11 17 L 6 21 L 6 17 Q 3 17 3 14 Z"/></svg>
      </div>
    )},
    { label: 'with hint', body: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="chat-fab" style={{ background: TRI.ink, color: 'white' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4"><path d="M 3 6 Q 3 3 6 3 L 18 3 Q 21 3 21 6 L 21 14 Q 21 17 18 17 L 11 17 L 6 21 L 6 17 Q 3 17 3 14 Z"/></svg>
        </div>
        <div style={{ background: 'white', border: `1.8px solid ${TRI.ink}`, borderRadius: 999, padding: '6px 14px', fontFamily: 'Caveat', fontSize: 20, boxShadow: '2px 2px 0 ' + TRI.ink }}>ask about Levi's</div>
      </div>
    )},
    { label: 'thinking', body: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="chat-fab" style={{ background: TRI.red, color: 'white' }}>
          <span className="hand" style={{ fontSize: 22, color: 'white' }}>...</span>
        </div>
        <div style={{ background: TRI.redSoft, border: `1.8px solid ${TRI.ink}`, borderRadius: 999, padding: '6px 14px', fontFamily: 'Caveat', fontSize: 18, boxShadow: '2px 2px 0 ' + TRI.ink }}>searching r/sanjose…</div>
      </div>
    )},
    { label: 'has answer', body: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="chat-fab" style={{ background: TRI.green, color: 'white', position: 'relative' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4"><path d="M 3 6 Q 3 3 6 3 L 18 3 Q 21 3 21 6 L 21 14 Q 21 17 18 17 L 11 17 L 6 21 L 6 17 Q 3 17 3 14 Z"/></svg>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: TRI.red, border: `1.6px solid ${TRI.ink}`, fontSize: 11, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Kalam', fontWeight: 700 }}>1</div>
        </div>
        <div style={{ background: 'white', border: `1.8px solid ${TRI.ink}`, borderRadius: 12, padding: '8px 12px', fontFamily: 'Kalam', fontSize: 14, boxShadow: '2px 2px 0 ' + TRI.ink, maxWidth: 220 }}>
          <b>Chromatic Coffee</b> · 3 mi west, opens 6am
          <div className="print" style={{ fontSize: 10, color: TRI.inkFaint, marginTop: 4, fontStyle: 'italic' }}>via r/AskNYC</div>
        </div>
      </div>
    )},
  ];
  return (
    <div className="ab cream" data-screen-label="03d FAB states">
      <div style={{ padding: 24 }}>
        <div className="print" style={{ fontSize: 12, color: TRI.inkFaint, letterSpacing: 2 }}>FAB · MICRO STATES</div>
        <div className="hand" style={{ fontSize: 26, fontWeight: 700 }}>How the bottom-left button breathes</div>
      </div>
      <div style={{ position: 'absolute', inset: '90px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: 26, justifyContent: 'center' }}>
        {states.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div className="print" style={{ width: 100, fontSize: 14, color: TRI.inkFaint, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ flex: 1 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 04 — STORYBOARD
// ============================================================
function StoryFrame({ n, title, children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: TRI.ink, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Kalam', fontWeight: 700, fontSize: 14 }}>{n}</div>
        <div className="hand" style={{ fontSize: 22, fontWeight: 700 }}>{title}</div>
      </div>
      <div className="ink-box" style={{ flex: 1, background: 'white', overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

function Storyboard() {
  return (
    <div className="ab" data-screen-label="04 Storyboard" style={{ padding: 24 }}>
      <div className="hand" style={{ fontSize: 34, fontWeight: 700 }}>map → stadium → ask → answer</div>
      <div className="print" style={{ fontSize: 14, color: TRI.inkSoft, marginBottom: 16 }}>the demo, in four frames · under 30 seconds</div>
      <div style={{ display: 'flex', gap: 16, height: 400 }}>
        <StoryFrame n="1" title="opens the app">
          <div style={{ position: 'absolute', inset: 0 }}>
            <SketchyMap width={900} height={560} highlightId="lax"/>
          </div>
        </StoryFrame>
        <StoryFrame n="2" title="taps MetLife">
          <div style={{ position: 'absolute', inset: 0 }}>
            <SketchyMap width={900} height={560} highlightId="nyc"/>
          </div>
        </StoryFrame>
        <StoryFrame n="3" title="stadium page">
          <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(135deg, #ece6d3, #ece6d3 8px, #e5dec4 8px, #e5dec4 16px)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, bottom: 12, color: 'white', textShadow: '2px 2px 0 ' + TRI.ink }}>
              <div className="hand" style={{ fontSize: 32, fontWeight: 700 }}>MetLife</div>
              <div className="print" style={{ fontSize: 12 }}>NJ · 8 matches · 🏆 FINAL</div>
            </div>
            <div style={{ position: 'absolute', left: 12, top: 12 }}>
              <ChatFab label="ask about MetLife"/>
            </div>
          </div>
        </StoryFrame>
        <StoryFrame n="4" title="asks the agent">
          <div style={{ width: '100%', height: '100%', background: '#fbf7ee', padding: 10, position: 'relative' }}>
            <Bubble from="user">where for coffee that isn't Starbucks?</Bubble>
            <Bubble source="r/AskNYC">
              <b>Devoción</b> in Williamsburg — locals' pick. Walkable from Penn after the match.
            </Bubble>
          </div>
        </StoryFrame>
      </div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================
Object.assign(window, {
  MapHoverDrawer,
  StadiumStacked,
  ChatFloating, ChatReddit, ChatMaps, ChatStates,
  Storyboard,
});
