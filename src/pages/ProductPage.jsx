import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { toast } from 'sonner';
import {
  ShoppingCartIcon,
  XMarkIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import Breadcrumb from '../components/ui/Breadcrumb';
import Badge from '../components/ui/Badge';
import ProductGallery from '../components/product/ProductGallery';
import ProductGrid from '../components/product/ProductGrid';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { effectivePrice, getProductImages } from '../utils/productHelpers';
import { fmt } from '../utils/fmt';
import { fetchProductBySlug, fetchRelatedProducts } from '../lib/products';
import collectionConfig from '../data/collectionConfig';
import { brandImageMap, brandSlugMap } from '../data/brands';
import { cn } from '../utils/cn';

const categoryToSlug = Object.fromEntries(
  Object.entries(collectionConfig)
    .filter(([, cfg]) => cfg.field === 'item_category')
    .map(([slug, cfg]) => [cfg.value, slug])
);

function getSlug(url) {
  return url.split('/').pop();
}

function renderDescription(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const clean = line.replace(/\*\*/g, '');
    if (line.startsWith('- ')) {
      listItems.push(<li key={i}>{clean.slice(2)}</li>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      flushList();
      elements.push(
        <p key={i} className="mt-4 text-sm font-semibold text-gray-900">{clean}</p>
      );
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={i} className="mt-2 text-sm text-gray-600">{clean}</p>
      );
    }
  });
  flushList();
  return elements;
}

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { items, dispatch } = useCart();
  const { phone: PHONE_NUMBER, whatsapp: WHATSAPP_NUMBER } = useSettings();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [qty, setQty] = useState(1);

  useEffect(() => {
    setPageLoading(true);
    fetchProductBySlug(slug).then(p => {
      setProduct(p);
      setPageLoading(false);
      if (p) {
        document.title = `${p.product_name} | Ghorer Bazar`;
        fetchRelatedProducts(p.item_category, slug).then(setRelatedProducts);
      }
    });
  }, [slug]);

  if (pageLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="text-xl font-semibold text-gray-900">Product not found</h2>
          <Link to="/shop" className="mt-4 text-sm font-medium text-brand-orange hover:underline">
            Back to Shop &rarr;
          </Link>
        </div>
      </Layout>
    );
  }

  const images = getProductImages(product);
  const hasDiscount = product.discount_price > 0;
  const salePrice = effectivePrice(product);
  const savePct = hasDiscount
    ? Math.round(((product.original_price - product.discount_price) / product.original_price) * 100)
    : 0;

  const collectionSlug = categoryToSlug[product.item_category] ?? null;
  const brandSlug = brandSlugMap[product.item_brand] ?? null;
  const brandImage = brandImageMap[product.item_brand] ?? null;

  const whatsappMsg = encodeURIComponent(
    `Hello GhorerBazar! I'm interested in:\nProduct: ${product.product_name}\nPrice: ${fmt(salePrice)}\nURL: ${product.product_url}`
  );


  const inCart = items.some((i) => i.id === slug);

  function handleAddToCart() {
    if (inCart) {
      dispatch({ type: 'REMOVE', payload: slug });
      toast.error(`${product.product_name} removed from cart`);
    } else {
      dispatch({
        type: 'ADD',
        payload: { id: slug, slug, name: product.product_name, price: salePrice, image: product.image_url, brand: product.item_brand ?? null, qty },
      });
      dispatch({ type: 'OPEN' });
      toast.success(`${product.product_name} added to cart`);
    }
  }

  function handleBuyNow() {
    dispatch({
      type: 'ADD',
      payload: { id: slug, slug, name: product.product_name, price: salePrice, image: product.image_url, brand: product.item_brand ?? null, qty: inCart ? 0 : qty },
    });
    navigate('/checkout');
  }

  const breadcrumbs = [
    { name: 'Shop', href: '/shop' },
    ...(collectionSlug ? [{ name: product.item_category, href: `/collections/${collectionSlug}` }] : []),
    { name: product.product_name },
  ];

  return (
    <Layout>
      <div className="bg-brand-light py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb crumbs={breadcrumbs} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Product hero — 2 column */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
          {/* Gallery */}
          <ProductGallery images={images} name={product.product_name} />

          {/* Details */}
          <div>
            {/* Flag + title */}
            <div className="flex flex-wrap items-start gap-2">
              {product.product_flag && (
                <Badge
                  label={product.product_flag}
                  variant={product.product_flag === 'New Arrival' ? 'green' : 'dark'}
                />
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl leading-snug">
              {product.product_name}
            </h1>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-brand-orange">{fmt(salePrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">{fmt(product.original_price)}</span>
                  <Badge label={`Save ${savePct}%`} variant="orange" />
                </>
              )}
            </div>

            {/* Short description */}
            {(product.short_description || product.description) && (
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                {product.short_description || (() => {
                  const clean = product.description.replace(/\*\*/g, '').replace(/^[-•]\s*/gm, '');
                  const first = clean.split('\n\n')[0].split('\n')[0].trim();
                  return first.length > 160 ? first.slice(0, 157) + '…' : first;
                })()}
              </p>
            )}

            <div className="mt-6 border-t border-gray-200 pt-6">
              {/* Qty selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <div className="flex items-center rounded-full border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-l-full text-gray-500 hover:bg-gray-50"
                    aria-label="Decrease quantity"
                  >
                    &minus;
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(100, q + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-r-full text-gray-500 hover:bg-gray-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart / Remove */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors ${
                    inCart
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200'
                      : 'bg-brand-orange text-white hover:bg-orange-500'
                  }`}
                >
                  {inCart ? (
                    <>
                      <XMarkIcon className="h-5 w-5" />
                      Remove from Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex flex-1 items-center justify-center rounded-full bg-brand-dark py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Buy Now
                </button>
              </div>

              {/* WhatsApp + Call */}
              <div className="mt-3 flex gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-green-500 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`tel:${PHONE_NUMBER}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <PhoneIcon className="h-4 w-4" />
                  Call
                </a>
              </div>
            </div>

            {/* Brand */}
            {product.item_brand && (
              <div className="mt-6 flex items-center gap-3 border-t border-gray-200 pt-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</span>
                {brandSlug ? (
                  <Link to={`/brands/${brandSlug}`} className="flex items-center gap-2 hover:opacity-80">
                    {brandImage ? (
                      <img src={brandImage} alt={product.item_brand} className="h-8 max-w-[80px] object-contain" loading="lazy" />
                    ) : (
                      <span className="text-sm font-semibold text-brand-dark">{product.item_brand}</span>
                    )}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-brand-dark">{product.item_brand}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <Tab.Group>
            <Tab.List className="flex gap-1 border-b border-gray-200">
              {['Description', 'Reviews'].map((tab) => (
                <Tab
                  key={tab}
                  className={({ selected }) =>
                    cn(
                      'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
                      selected
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )
                  }
                >
                  {tab}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="mt-6">
              <Tab.Panel className="prose-sm max-w-none">
                {renderDescription(product.description)}
              </Tab.Panel>

              <Tab.Panel>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-gray-500">No reviews yet for this product.</p>
                  <p className="mt-1 text-xs text-gray-400">Purchase and share your experience!</p>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-brand-dark">Related Products</h2>
              {collectionSlug && (
                <Link
                  to={`/collections/${collectionSlug}`}
                  className="text-sm font-semibold text-brand-orange hover:underline"
                >
                  View all &rarr;
                </Link>
              )}
            </div>
            <ProductGrid products={relatedProducts} />
          </section>
        )}
      </div>
    </Layout>
  );
}
