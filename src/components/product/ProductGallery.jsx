import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0);

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  return (
    <div className="flex gap-3">
      {/* Thumbnail strip */}
      <div className="hidden sm:flex flex-col gap-2 w-20 shrink-0">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                active === i
                  ? 'border-brand-orange'
                  : 'border-transparent hover:border-gray-300'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <img
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
      </div>

      {/* Main image */}
      <div className="relative flex-1 aspect-square overflow-hidden rounded-2xl bg-gray-50">
        <img
          src={images[active]}
          alt={name}
          className="h-full w-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-700" />
            </button>

            {/* Mobile dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    active === i ? 'w-4 bg-brand-orange' : 'w-1.5 bg-white/60'
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
