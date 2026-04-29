import { Link } from 'react-router-dom';

const brands = [
  { slug: 'ghorerbazar', src: 'https://backoffice.ghorerbazar.com/brand_images/7hNKq1768887947.png', label: 'GhorerBazar' },
  { slug: 'glarvest',    src: 'https://backoffice.ghorerbazar.com/brand_images/RNTIU1763611802.png', label: 'Glarvest' },
  { slug: 'khejuri',     src: 'https://backoffice.ghorerbazar.com/brand_images/8Gpl21757919440.png', label: 'Khejuri' },
  { slug: 'shosti-food', src: 'https://backoffice.ghorerbazar.com/brand_images/8matO1757919401.png', label: 'Shosti food' },
  { slug: 'honeyraj',    src: 'https://backoffice.ghorerbazar.com/brand_images/lCfRt1759553456.png', label: 'Honeyraj' },
];

export default function BrandsRow() {
  return (
    <section className="bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-brand-dark">Our Brands</h2>
          <Link to="/shop" className="text-sm font-semibold text-brand-orange hover:underline">
            See all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {brands.map((b) => (
            <Link
              key={b.slug}
              to={`/brands/${b.slug}`}
              className="flex items-center justify-center rounded-2xl border border-orange-100 bg-brand-light p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-24 sm:h-28"
            >
              <img
                src={b.src}
                alt={b.label}
                className="max-h-14 max-w-full object-contain drop-shadow-sm"
                loading="lazy"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
