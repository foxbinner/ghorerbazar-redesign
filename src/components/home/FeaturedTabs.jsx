import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { fetchAllProducts } from '../../lib/products';
import { cn } from '../../utils/cn';
import ProductGrid from '../product/ProductGrid';

const tabs = [
  { label: 'Honey',      category: 'Honey' },
  { label: 'Dates',      category: 'Dates' },
  { label: 'Oil & Ghee', category: 'Oil & Ghee' },
];

export default function FeaturedTabs() {
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.allSettled(
      tabs.map(tab => fetchAllProducts({ category: tab.category, limit: 8 }))
    )
      .then(results => {
        const map = {};
        tabs.forEach((tab, i) => {
          map[tab.label] = results[i].status === 'fulfilled' ? results[i].value : [];
        });
        const anyData = Object.values(map).some(arr => arr.length > 0);
        if (!anyData) setError(true);
        setProductMap(map);
      })
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <section className="bg-brand-light py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">Failed to load featured products. Try refreshing.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-brand-light py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark">Featured Products</h2>
          <Link to="/shop" className="text-sm font-semibold text-brand-orange hover:underline">
            View all &rarr;
          </Link>
        </div>

        <Tab.Group>
          <Tab.List className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 sm:w-fit">
            {tabs.map((tab) => (
              <Tab
                key={tab.label}
                className={({ selected }) =>
                  cn(
                    'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                    selected
                      ? 'bg-brand-orange text-white shadow'
                      : 'text-gray-600 hover:text-brand-orange'
                  )
                }
              >
                {tab.label}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6">
            {tabs.map((tab) => (
              <Tab.Panel key={tab.label}>
                <ProductGrid products={productMap[tab.label] ?? []} loading={loading} />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </section>
  );
}
