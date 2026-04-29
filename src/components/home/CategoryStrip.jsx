import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import categories from '../../data/categories.json';

export default function CategoryStrip() {
  return (
    <section className="bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark">Shop by Category</h2>
          <Link to="/shop" className="text-sm font-semibold text-brand-orange hover:underline">
            Browse all &rarr;
          </Link>
        </div>

        <Swiper
          modules={[Autoplay, Pagination]}
          rewind
          slidesPerGroup={1}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          spaceBetween={16}
          breakpoints={{
            0:    { slidesPerView: 3 },
            480:  { slidesPerView: 4 },
            768:  { slidesPerView: 5 },
            1024: { slidesPerView: 7 },
          }}
          className="category-swiper"
        >
          {categories.map((cat) => (
            <SwiperSlide key={cat.href}>
              <Link
                to={cat.href}
                className="flex flex-col items-center gap-3 group py-2"
              >
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-brand-light border-2 border-orange-100 overflow-hidden flex items-center justify-center group-hover:border-brand-orange group-hover:shadow-md transition-all duration-200 shrink-0">
                  <img
                    src={cat.img}
                    alt={cat.label}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-brand-dark text-center leading-tight group-hover:text-brand-orange transition-colors">
                  {cat.label}
                </span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        <style>{`
          .category-swiper { padding-bottom: 40px !important; }
          .category-swiper .swiper-pagination { bottom: 0 !important; }
          .category-swiper .swiper-pagination-bullet {
            background: #d1d5db;
            opacity: 1;
          }
          .category-swiper .swiper-pagination-bullet-active {
            background: #f48721;
            width: 20px;
            border-radius: 9999px;
            transition: width 0.3s;
          }
        `}</style>
      </div>
    </section>
  );
}
