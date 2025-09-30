import React, { useMemo, useRef, useState } from 'react';

type CardItem = {
  title: string;
  description: string;
  image: string;
  link?: string;
};

type Category = {
  key: string;
  label: string;
  items: CardItem[];
};

// Lightweight, accessible, and responsive slider using CSS scroll-snap
// No external dependencies to keep bundle small and performance high.
const ResponsiveSlider: React.FC = () => {
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
          },
          {
            title: 'Dedicated Freight Corridor',
            description: 'Modern freight corridor to boost logistics efficiency.',
            image: '/projects/dfcc.jpg',
          },
          {
            title: 'Vadodara Mumbai Expressway',
            description: 'Access-controlled expressway reducing travel time.',
            image: '/projects/mumbai-vadodara-highway.jpg',
          },
          {
            title: 'Vadhavan Port Project',
            description: 'Deep-water port initiative to expand trade capacity.',
            image: '/projects/vadhvan-port-project.jpg',
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
            <SliderCard key={`${item.title}-${idx}`} item={item} />
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
    </section>
  );
};

const SliderCard = React.memo(({ item }: { item: CardItem }) => {
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