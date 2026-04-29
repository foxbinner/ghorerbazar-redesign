import { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { ShieldCheckIcon, TruckIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const values = [
  { icon: ShieldCheckIcon, title: '100% Authentic',     desc: 'Every product is sourced directly from verified farmers and trusted suppliers across Bangladesh.' },
  { icon: SparklesIcon,    title: 'Natural & Organic',  desc: 'We prioritize natural, chemical-free products that are safe for your family and the environment.' },
  { icon: TruckIcon,       title: 'Fast Delivery',      desc: 'Reliable delivery across all 64 districts of Bangladesh with real-time order tracking.' },
  { icon: UserGroupIcon,   title: 'Customer First',     desc: 'Your satisfaction is our mission. We stand behind every product we sell with a 7-day return policy.' },
];

export default function AboutPage() {
  useEffect(() => { document.title = 'About Us | Ghorer Bazar'; }, []);
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-brand-dark py-20 px-4 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-brand-orange text-sm font-semibold tracking-widest uppercase mb-3">Our Story</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Bringing nature's best to your doorstep
          </h1>
          <p className="mt-4 text-gray-400 text-sm sm:text-base leading-relaxed">
            GhorerBazar was founded with a simple belief — every Bangladeshi family deserves access to pure, natural, and affordable food products sourced directly from the farms that grow them.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-white py-14 px-4">
        <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Who we are</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              GhorerBazar is a leading e-commerce platform committed to delivering safe, healthy, and organic food products across Bangladesh. We partner with local farmers, beekeepers, and food producers to bring you honey, dates, spices, oils, and more — without any middlemen.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Since our founding, we have served thousands of families who trust us for quality they can taste and purity they can verify. Every product on our platform goes through strict quality checks before reaching your home.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden bg-brand-light border border-orange-100 flex items-center justify-center h-56">
            <img
              src="/logoname.svg"
              alt="GhorerBazar"
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-light py-14 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-brand-dark text-center mb-10">Why choose GhorerBazar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 text-center border border-orange-100">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-light mb-4">
                  <v.icon className="h-6 w-6 text-brand-orange" />
                </div>
                <h3 className="text-sm font-bold text-brand-dark mb-2">{v.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-14 px-4 text-center border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-3">Start shopping with confidence</h2>
        <p className="text-gray-400 text-sm mb-6">Join thousands of happy customers across Bangladesh.</p>
        <a
          href="/shop"
          className="inline-block rounded-full bg-brand-orange px-8 py-3 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
        >
          Shop Now
        </a>
      </section>
    </Layout>
  );
}
