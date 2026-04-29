import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { fetchCategories, fetchBrands } from '../../lib/products';

const FLAG_OPTIONS = ['Best Selling', 'New Arrival', 'Offered Items'];

const DEFAULT_HERO = [
  {
    id: 1,
    label: 'Slide 1',
    url: 'https://backoffice.ghorerbazar.com/banner/o1uH11775363016-light.jpg',
    link: '/shop',
    cta: 'Shop Now',
  },
  {
    id: 2,
    label: 'Slide 2',
    url: 'https://backoffice.ghorerbazar.com/banner/sCUkg1774768074-dark.png',
    link: '/collections/dates',
    cta: 'Explore Dates',
  },
  {
    id: 3,
    label: 'Slide 3',
    url: 'https://backoffice.ghorerbazar.com/banner/wvLKI1771837751.jpeg',
    link: '/collections/honey',
    cta: 'Shop Honey',
  },
  {
    id: 4,
    label: 'Slide 4',
    url: 'https://backoffice.ghorerbazar.com/banner/26q3s1771837303.jpeg',
    link: '/collections/oil-ghee',
    cta: 'Oil & Ghee',
  },
];

const DEFAULT_PROMO = [
  {
    id: 1,
    label: 'Promo Left',
    url: 'https://backoffice.ghorerbazar.com/banner/Tyz131763632384.png',
    link: '/collections/dates',
    heading: 'Premium Dates Collection',
    sub: 'Sourced from Medina & Ajwa farms',
  },
  {
    id: 2,
    label: 'Promo Right',
    url: 'https://backoffice.ghorerbazar.com/banner/Wzx451763631917.png',
    link: '/collections/honey',
    heading: 'Pure Honey Varieties',
    sub: 'Mustard, Sundarban & Litchi',
  },
];

function parseLinkType(link) {
  if (!link) return { type: 'custom', value: '' };
  const catMatch = link.match(/^\/collections\/(.+)$/);
  if (catMatch) return { type: 'category', value: catMatch[1] };
  const brandMatch = link.match(/^\/brands\/(.+)$/);
  if (brandMatch) return { type: 'brand', value: brandMatch[1] };
  const flagMatch = link.match(/[?&]flag=([^&]+)/);
  if (flagMatch) return { type: 'flag', value: decodeURIComponent(flagMatch[1]) };
  return { type: 'custom', value: link };
}

function buildLink(type, value) {
  if (type === 'category') return value ? `/collections/${value}` : '/shop';
  if (type === 'brand')    return value ? `/brands/${value}` : '/shop';
  if (type === 'flag')     return value ? `/shop?flag=${encodeURIComponent(value)}` : '/shop';
  return value || '/shop';
}

function LinkPicker({ value, onChange, categories, brands }) {
  const parsed = parseLinkType(value);
  const [type, setType]   = useState(parsed.type);
  const [val, setVal]     = useState(parsed.value);

  const handleType = (t) => {
    setType(t);
    setVal('');
    onChange(buildLink(t, ''));
  };

  const handleVal = (v) => {
    setVal(v);
    onChange(buildLink(type, v));
  };

  const selectCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange';

  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap">
        {['category', 'flag', 'brand', 'custom'].map(t => (
          <button key={t} type="button" onClick={() => handleType(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              type === t ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t === 'category' ? 'Category' : t === 'flag' ? 'Flag' : t === 'brand' ? 'Brand' : 'Custom'}
          </button>
        ))}
      </div>

      {type === 'category' && (
        <select value={val} onChange={e => handleVal(e.target.value)} className={selectCls}>
          <option value="">Select category…</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug || c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {type === 'flag' && (
        <select value={val} onChange={e => handleVal(e.target.value)} className={selectCls}>
          <option value="">Select flag…</option>
          {FLAG_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      )}

      {type === 'brand' && (
        <select value={val} onChange={e => handleVal(e.target.value)} className={selectCls}>
          <option value="">Select brand…</option>
          {brands.map(b => (
            <option key={b.id} value={b.slug || b.name.toLowerCase().replace(/\s+/g, '-')}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      {type === 'custom' && (
        <input value={val} onChange={e => handleVal(e.target.value)}
          placeholder="/shop or https://..."
          className={selectCls} />
      )}

      <p className="text-[11px] text-gray-400 font-mono">{value || '/shop'}</p>
    </div>
  );
}

function BannerCard({ banner, onChange, onSave, saved, categories, brands }) {
  const [form, setForm] = useState({ ...banner });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(banner);

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 p-4 border-b border-gray-100">
        <div className="h-16 w-24 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200">
          {form.url && (
            <img src={form.url} alt={form.label}
              className="h-full w-full object-cover"
              onError={e => { e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; }} />
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 flex-1">{form.label}</p>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <CheckIcon className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
          <input value={form.url} onChange={e => set('url', e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Link</label>
          <LinkPicker
            value={form.link}
            onChange={v => set('link', v)}
            categories={categories}
            brands={brands}
          />
        </div>

        {form.cta !== undefined && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CTA Text</label>
            <input value={form.cta ?? ''} onChange={e => set('cta', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange" />
          </div>
        )}

        {form.heading !== undefined && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CTA Text</label>
            <input value={form.heading} onChange={e => set('heading', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange" />
          </div>
        )}

        <div className="flex justify-end">
          <button disabled={!dirty}
            onClick={() => { onChange(form); onSave(banner.id); }}
            className="rounded-full bg-brand-orange px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const [heroSlides, setHeroSlides]   = useState(DEFAULT_HERO);
  const [promoSlides, setPromoSlides] = useState(DEFAULT_PROMO);
  const [savedIds, setSavedIds]       = useState({});
  const [categories, setCategories]   = useState([]);
  const [brands, setBrands]           = useState([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchBrands().then(setBrands).catch(() => {});
  }, []);

  const markSaved = (id) => {
    setSavedIds(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setSavedIds(prev => ({ ...prev, [id]: false })), 2000);
  };

  const updateHero  = (u) => setHeroSlides(prev => prev.map(s => s.id === u.id ? u : s));
  const updatePromo = (u) => setPromoSlides(prev => prev.map(s => s.id === u.id ? u : s));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Banners</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Hero Slides</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {heroSlides.map(s => (
            <BannerCard key={s.id} banner={s} onChange={updateHero} onSave={markSaved}
              saved={savedIds[s.id]} categories={categories} brands={brands} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Promo Banners</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {promoSlides.map(s => (
            <BannerCard key={s.id} banner={s} onChange={updatePromo} onSave={markSaved}
              saved={savedIds[s.id]} categories={categories} brands={brands} />
          ))}
        </div>
      </section>
    </div>
  );
}
