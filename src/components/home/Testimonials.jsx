import { StarIcon } from '@heroicons/react/20/solid';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const testimonials = [
  {
    text: 'Thanks Ghorerbazar for free Honeyraj. Of course, I got it for being a regular customer.',
    img: 'https://backoffice.ghorerbazar.com/testimonial/3qPit1758182893.jpg',
    name: 'Sultana Yesmin',
    role: 'Housewife',
  },
  {
    text: '২য় বার Ghorerbazar থেকে অর্ডার করলাম। আগের মতো এবারও দারুণ কোয়ালিটি আর দ্রুত ডেলিভারি পেয়েছি। একদম সন্তুষ্ট।',
    img: 'https://backoffice.ghorerbazar.com/testimonial/0Jti61758182944.png',
    name: 'Ayesha Khan',
    role: 'Banker',
  },
  {
    text: 'এই অবিশ্বাসের জগতে আস্থাশীল একটি প্রতিষ্ঠান ঘরের বাজার।',
    img: 'https://backoffice.ghorerbazar.com/testimonial/PZDyt1758183005.jpg',
    name: 'Fariha Akter Tumpa',
    role: 'Entrepreneur',
  },
  {
    text: "I don't like ghee, but my father really loves it. So I bought some ghee for him. He said this ghee is the best he has ever had.",
    img: 'https://backoffice.ghorerbazar.com/testimonial/7XD7v1758183150.jpg',
    name: 'Shahriar Khan Abir',
    role: 'Service Holder',
  },
  {
    text: 'আমি অনেক জায়গা থেকে এই প্রোডাক্ট এনেছি। তবে আমার মতে এসব পেজ থেকে ঘরের বাজার সেরা।',
    img: 'https://backoffice.ghorerbazar.com/testimonial/NgeCj1758183204.jpg',
    name: 'Ahmod Al Kamran',
    role: 'Student',
  },
];

function TestimonialCard({ t }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm h-full">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <StarIcon key={s} className="h-4 w-4 text-yellow-400" />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-gray-700">{t.text}</p>
      <div className="mt-6 flex items-center gap-3">
        <img
          src={t.img}
          alt={t.name}
          className="h-10 w-10 rounded-full object-cover shrink-0"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-semibold text-brand-dark">{t.name}</p>
          <p className="text-xs text-gray-500">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-brand-light py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-brand-dark text-center sm:text-3xl mb-10">
          What our customers say
        </h2>

        <Swiper
          modules={[Autoplay, Pagination]}
          loop
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          spaceBetween={24}
          breakpoints={{
            0:    { slidesPerView: 1 },
            640:  { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="testimonial-swiper"
        >
          {testimonials.map((t, i) => (
            <SwiperSlide key={i} className="h-auto">
              <TestimonialCard t={t} />
            </SwiperSlide>
          ))}
        </Swiper>

        <style>{`
          .testimonial-swiper { padding-bottom: 40px !important; }
          .testimonial-swiper .swiper-slide { height: auto; }
          .testimonial-swiper .swiper-pagination { bottom: 0 !important; }
          .testimonial-swiper .swiper-pagination-bullet {
            background: #d1d5db;
            opacity: 1;
          }
          .testimonial-swiper .swiper-pagination-bullet-active {
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
