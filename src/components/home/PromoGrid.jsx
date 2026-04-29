import { Link } from 'react-router-dom';

const promos = [
  {
    href: '/collections/dates',
    img: 'https://backoffice.ghorerbazar.com/banner/Tyz131763632384.png',
    alt: 'Premium Dates',
  },
  {
    href: '/collections/honey',
    img: 'https://backoffice.ghorerbazar.com/banner/Wzx451763631917.png',
    alt: 'All Natural Honey',
  },
];

export default function PromoGrid() {
  return (
    <section className="bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {promos.map((p) => (
            <Link
              key={p.href}
              to={p.href}
              className="group overflow-hidden rounded-2xl"
            >
              <img
                src={p.img}
                alt={p.alt}
                loading="lazy"
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
