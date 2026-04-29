import { useRef } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const slides = [
  {
    href: "/shop",
    img: "https://backoffice.ghorerbazar.com/banner/o1uH11775363016-light.jpg",
    alt: "Shop all products",
    eager: true,
  },
  {
    href: "/collections/dates",
    img: "https://backoffice.ghorerbazar.com/banner/sCUkg1774768074-dark.png",
    alt: "Premium Dates",
    eager: false,
  },
  {
    href: "/collections/honey",
    img: "https://backoffice.ghorerbazar.com/banner/wvLKI1771837751.jpeg",
    alt: "All Natural Honey",
    eager: false,
  },
  {
    href: "/collections/oil-ghee",
    img: "https://backoffice.ghorerbazar.com/banner/26q3s1771837303.jpeg",
    alt: "Oil and Ghee",
    eager: false,
  },
];

export default function HeroBanner() {
  const swiperRef = useRef(null);

  return (
    <section className="flex gap-3 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 h-[300px] sm:h-[380px] lg:h-[440px] max-w-7xl mx-auto w-full">
      {/* Left — Swiper (70%) */}
      <div className="relative w-full lg:w-[70%] h-full rounded-2xl overflow-hidden">
        <Swiper
          modules={[Autoplay, Pagination]}
          loop
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          pagination={{ clickable: true }}
          className="hero-swiper w-full h-full"
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={i}>
              <Link to={slide.href} className="block w-full h-full">
                <img
                  src={slide.img}
                  alt={slide.alt}
                  loading={slide.eager ? "eager" : "lazy"}
                  fetchPriority={slide.eager ? "high" : "low"}
                  className="w-full h-full object-cover"
                />
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom nav buttons */}
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-brand-orange text-white shadow-md hover:bg-orange-500 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4 stroke-[2.5]" />
        </button>
        <button
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-brand-orange text-white shadow-md hover:bg-orange-500 transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Right — Product spotlight (30%), hidden on mobile */}
      <Link
        to="/products/gawa-ghee-1kg"
        className="hidden lg:block w-[30%] h-full rounded-2xl overflow-hidden group"
      >
        <img
          src="https://backoffice.ghorerbazar.com/banner/9weyd1775362946.jpeg"
          alt="Gawa Ghee 1kg"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.6);
          opacity: 1;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: #f48721;
          width: 20px;
          border-radius: 9999px;
          transition: width 0.3s;
        }
      `}</style>
    </section>
  );
}
