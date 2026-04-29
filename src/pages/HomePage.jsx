import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import HeroBanner from '../components/home/HeroBanner';
import IncentivesBar from '../components/home/IncentivesBar';
import CategoryStrip from '../components/home/CategoryStrip';
import PromoGrid from '../components/home/PromoGrid';
import FeaturedTabs from '../components/home/FeaturedTabs';
import BrandsRow from '../components/home/BrandsRow';
import Testimonials from '../components/home/Testimonials';
import ProductGrid from '../components/product/ProductGrid';
import { fetchAllProducts } from '../lib/products';

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { document.title = 'Ghorer Bazar — Fresh from Farm to Your Door'; }, []);

  useEffect(() => {
    Promise.all([
      fetchAllProducts({ flag: 'Best Selling', limit: 8 }),
      fetchAllProducts({ flag: 'New Arrival', limit: 8 }),
    ])
      .then(([bs, na]) => {
        setBestSellers(bs);
        setNewArrivals(na);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <HeroBanner />
      <IncentivesBar />
      <CategoryStrip />

      {/* Best Sellers */}
      <section className="bg-brand-light py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-brand-dark">Best Sellers</h2>
            <Link to="/shop" className="text-sm font-semibold text-brand-orange hover:underline">
              View all &rarr;
            </Link>
          </div>
          {error
            ? <p className="py-8 text-center text-sm text-gray-500">Failed to load products. Try refreshing.</p>
            : <ProductGrid products={bestSellers} loading={loading} />
          }
        </div>
      </section>

      <PromoGrid />
      <FeaturedTabs />
      <BrandsRow />

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="bg-white py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-brand-dark">New Arrivals</h2>
              <Link to="/shop" className="text-sm font-semibold text-brand-orange hover:underline">
                View all &rarr;
              </Link>
            </div>
            <ProductGrid products={newArrivals} loading={loading} />
          </div>
        </section>
      )}

      <Testimonials />
    </Layout>
  );
}
