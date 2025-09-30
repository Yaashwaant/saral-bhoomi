import React, { useMemo, useRef, useState } from 'react';

type CardItem = {
  title: string;
  description: string;
  image: string;
  link?: string;
  projectHints?: string[]; // names/keywords to resolve matching project
};

type Category = {
  key: string;
  label: string;
  items: CardItem[];
};

// Lightweight, accessible, and responsive slider using CSS scroll-snap
// No external dependencies to keep bundle small and performance high.
const ResponsiveSlider: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    totalLandToBeAcquired?: number;
    totalBudget?: number;
    totalLandAvailable?: number;
    totalLandRequired?: number;
    budgetSpentToDate?: number;
  } | null>(null);

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const resolveProjectId = async (hints?: string[]): Promise<string | null> => {
    try {
      const resp = await fetch('/api/projects?limit=100');
      if (!resp.ok) return null;
      const json = await resp.json();
      const projects = Array.isArray(json?.data) ? json.data : [];
      if (!hints || hints.length === 0) return null;
      const hintSet = hints.map(normalize);
      // Try exact and contains matches against projectName
      for (const p of projects) {
        const name = normalize(String(p?.projectName || ''));
        if (!name) continue;
        if (hintSet.some(h => name.includes(h))) return String(p.id);
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchOverview = async (projectId?: string | null) => {
    try {
      setLoading(true);
      setError(null);

      let base = {
        totalLandToBeAcquired: 0,
        totalBudget: 0,
        totalLandAvailable: 0,
        totalLandRequired: 0,
      } as any;

      if (projectId) {
        // Fetch specific project and use its fields
        const pResp = await fetch(`/api/projects/${projectId}`);
        if (pResp.ok) {
          const pj = await pResp.json();
          const pd = pj?.data || pj;
          base = {
            totalLandToBeAcquired: Number(pd?.landToBeAcquired || 0),
            totalBudget: Number(pd?.allocatedBudget || 0),
            totalLandAvailable: Number(pd?.landAvailable || 0),
            totalLandRequired: Number(pd?.landRequired || 0),
          };
        }
      }

      if (!projectId || !base.totalLandRequired) {
        // Fallback to public overview stats endpoint to avoid auth on login page
        const resp = await fetch('/api/projects/stats/overview');
        if (resp.ok) {
          const json = await resp.json();
          const data = json?.data?.overview || json?.data || json;
          base = {
            totalLandToBeAcquired: Number(data?.totalLandToBeAcquired || 0),
            totalBudget: Number(data?.totalBudget || 0),
            totalLandAvailable: Number(data?.totalLandAvailable || 0),
            totalLandRequired: Number(data?.totalLandRequired || 0),
          };
        }
      }

      // Attempt to fetch richer KPIs including payments using demo headers (non-auth)
      try {
        const url = projectId ? `/api/insights/overview-kpis?projectId=${encodeURIComponent(projectId)}` : '/api/insights/overview-kpis';
        const kpiResp = await fetch(url, {
          headers: {
            'demo-jwt-token': 'demo',
            'x-demo-role': 'admin',
          },
        });
        if (kpiResp.ok) {
          const kpiJson = await kpiResp.json();
          const kpi = kpiJson?.data || kpiJson;
          setOverview({
            ...base,
            budgetSpentToDate: Number(kpi?.budgetSpentToDate || 0),
            totalLandAvailable: Number(kpi?.totalAcquiredArea ?? base.totalLandAvailable ?? 0),
          });
          return;
        }
      } catch (err) {
        // Ignore and fallback to base overview
      }

      setOverview(base);
    } catch (e: any) {
      setError('Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  const categories: Category[] = useMemo(
    () => [
      {
        key: 'projects',
        label: 'Projects',
        items: [
          {
            title: 'Bullet Train Project',
            description: 'High-speed bullet train corridor enhancing regional connectivity.',
            image: '/projects/bullet-train.jpg',
            projectHints: ['bullet train', 'bullet'],
          },
          {
            title: 'Dedicated Freight Corridor',
            description: 'Modern freight corridor to boost logistics efficiency.',
            image: '/projects/dfcc.jpg',
            projectHints: ['dfc', 'dfcc', 'dedicated freight corridor'],
          },
          {
            title: 'Vadodara Mumbai Expressway',
            description: 'Access-controlled expressway reducing travel time.',
            image: '/projects/mumbai-vadodara-highway.jpg',
            projectHints: ['vadodara mumbai', 'khapoli', 'expressway'],
          },
          {
            title: 'Vadhavan Port Project',
            description: 'Deep-water port initiative to expand trade capacity.',
            image: '/projects/vadhvan-port-project.jpg',
            projectHints: ['vadhavan', 'port'],
          },
        ],
      },
    ],
    []
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const activeItems = useMemo(() => categories[0].items, [categories]);

  const scrollBy = (dir: 'left' | 'right') => {
    const el = viewportRef.current;
    if (!el) return;
    const amount = Math.min(480, el.clientWidth * 0.8);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-dark-blue">
            On going Projects
          </h2>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scrollBy('left')}
              aria-label="Scroll left"
              className="h-9 w-9 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700"
            >
              ‹
            </button>
            <button
              onClick={() => scrollBy('right')}
              aria-label="Scroll right"
              className="h-9 w-9 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700"
            >
              ›
            </button>
          </div>
        </div>

        {/* Category Tabs removed as requested */}

        {/* Slider viewport */}
        <div
          ref={viewportRef}
          className="relative flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 pr-4 -mx-1"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}
        >
          {activeItems.map((item, idx) => (
            <SliderCard
              key={`${item.title}-${idx}`}
              item={item}
              onFindMore={async (e) => {
                e.preventDefault();
                setShowModal(true);
                const projectId = await resolveProjectId(item.projectHints);
                await fetchOverview(projectId);
              }}
            />
          ))}
        </div>

        {/* Mobile arrows */}
        <div className="mt-4 flex md:hidden justify-center gap-3">
          <button
            onClick={() => scrollBy('left')}
            aria-label="Scroll left"
            className="px-4 py-2 rounded-md bg-white border border-gray-200 shadow-sm text-gray-700"
          >
            Prev
          </button>
          <button
            onClick={() => scrollBy('right')}
            aria-label="Scroll right"
            className="px-4 py-2 rounded-md bg-white border border-gray-200 shadow-sm text-gray-700"
          >
            Next
          </button>
        </div>
      </div>

      {/* Overview Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[95%] max-w-3xl rounded-xl bg-white shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-dark-blue">Overview</h3>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {loading && (
              <div className="py-6 text-center text-sm text-gray-600">Loading...</div>
            )}
            {!loading && error && (
              <div className="py-6 text-center text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && overview && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg shadow-sm border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-text-dark-blue">Total Land To Be Acquired (Ha)</div>
                    <span className="material-icons text-orange-600">terrain</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-orange-600">{(overview.totalLandToBeAcquired || 0).toLocaleString()}</div>
                </div>

                <div className="p-5 rounded-lg shadow-sm border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-text-dark-blue">Total Budget Allocated</div>
                    <span className="material-icons text-blue-600">account_balance</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-blue-600">₹{((overview.totalBudget || 0)).toLocaleString('en-IN')}</div>
                </div>

                <div className="p-5 rounded-lg shadow-sm border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-text-dark-blue">Total Acquired Area (Ha)</div>
                    <span className="material-icons text-emerald-600">task_alt</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-emerald-600">{(overview.totalLandAvailable || 0).toLocaleString()}</div>
                </div>

                <div className="p-5 rounded-lg shadow-sm border border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-text-dark-blue">Payments Done To-Date</div>
                    <span className="material-icons text-teal-600">account_balance_wallet</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-teal-600">₹{(overview.budgetSpentToDate || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const SliderCard = React.memo(({ item, onFindMore }: { item: CardItem; onFindMore?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) => {
  const fallbacks: Record<string, string> = {
    'Bullet Train Project':
      'https://images.unsplash.com/photo-1517154421773-0529e4e38bb4?auto=format&fit=crop&w=1600&q=60',
    'Dedicated Freight Corridor':
      'https://images.unsplash.com/photo-1505247964246-1f0a90443c36?auto=format&fit=crop&w=1600&q=60',
    'Vadodara Mumbai Expressway':
      'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1600&q=60',
    'Vadhavan Port Project':
      'https://images.unsplash.com/photo-1505839673365-e3971f8d8b1b?auto=format&fit=crop&w=1600&q=60',
  };
  return (
    <article
      className="snap-start min-w-[260px] md:min-w-[300px] lg:min-w-[340px] bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden"
    >
      <div className="relative h-40 md:h-48 w-full overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          onError={(e) => {
            const fb = fallbacks[item.title] || fallbacks['Bullet Train Project'];
            e.currentTarget.src = fb;
          }}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-semibold">
          {item.title}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-text-dark-blue mb-1">{item.title}</h3>
        <p className="text-sm text-subtext-light mb-3 line-clamp-3">{item.description}</p>
        <a
          href={item.link || '#'}
          onClick={onFindMore}
          className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
        >
          Find out more
          <span className="material-icons text-base ml-1">chevron_right</span>
        </a>
      </div>
    </article>
  );
});

export default ResponsiveSlider;