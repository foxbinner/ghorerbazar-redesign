import { useMemo, useState, useEffect } from 'react';
import { useParams, useLocation, useSearchParams, Link } from 'react-router-dom';
import { FunnelIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import FilterSidebar from '../components/catalog/FilterSidebar';
import ActiveFilterChips from '../components/catalog/ActiveFilterChips';
import SortMenu from '../components/catalog/SortMenu';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/ui/Pagination';
import Breadcrumb from '../components/ui/Breadcrumb';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { fetchAllProducts } from '../lib/products';
import collectionConfig from '../data/collectionConfig';
import { effectivePrice, getProductFlags } from '../utils/productHelpers';

const ITEMS_PER_PAGE = 16;

function slugifyBrand(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function CatalogPage() {
  const params = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetchAllProducts()
      .then(data => setAllProducts(data))
      .catch(() => setFetchError(true))
      .finally(() => setProductsLoading(false));
  }, []);

  const isShop = location.pathname === '/shop';
  const slug = params.slug;
  const brandParam = params.brand;

  const { scopedProducts, pageTitle, breadcrumbs, filterMode } = useMemo(() => {
    if (isShop) {
      return {
        scopedProducts: allProducts,
        pageTitle: 'All Products',
        breadcrumbs: [{ name: 'All Products' }],
        filterMode: 'shop',
      };
    }
    if (slug) {
      const config = collectionConfig[slug];
      if (!config) {
        return {
          scopedProducts: [],
          pageTitle: 'Not Found',
          breadcrumbs: [{ name: slug }],
          filterMode: 'collection',
        };
      }
      const products = allProducts.filter((p) => p[config.field] === config.value);
      return {
        scopedProducts: products,
        pageTitle: config.label,
        breadcrumbs: [{ name: 'Shop', href: '/shop' }, { name: config.label }],
        filterMode: 'collection',
      };
    }
    if (brandParam) {
      const products = allProducts.filter(
        (p) => p.item_brand && slugifyBrand(p.item_brand) === brandParam.toLowerCase()
      );
      const brandName = products[0]?.item_brand ?? brandParam;
      return {
        scopedProducts: products,
        pageTitle: brandName,
        breadcrumbs: [{ name: 'Shop', href: '/shop' }, { name: brandName }],
        filterMode: 'collection',
      };
    }
    return { scopedProducts: [], pageTitle: 'Products', breadcrumbs: [], filterMode: 'collection' };
  }, [isShop, slug, brandParam, allProducts]);

  const priceAbsRange = useMemo(() => {
    if (scopedProducts.length === 0) return [0, 10000];
    const prices = scopedProducts.map(effectivePrice);
    return [Math.min(...prices), Math.max(...prices)];
  }, [scopedProducts]);

  const initialSub = searchParams.get('sub') ?? '';
  const initialQ = searchParams.get('q') ?? '';
  const initialFlag = searchParams.get('flag') ?? '';

  const [selectedCategories, setSelectedCategories] = useState(initialSub ? [initialSub] : []);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedFlags, setSelectedFlags] = useState(initialFlag ? [initialFlag] : []);
  const [priceRange, setPriceRange] = useState(priceAbsRange);
  const [localPrice, setLocalPrice] = useState(priceAbsRange);
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [gridLoading, setGridLoading] = useState(false);
  const [searchQuery] = useState(initialQ);

  useEffect(() => {
    document.title = `${pageTitle} | Ghorer Bazar`;
  }, [pageTitle]);

  useEffect(() => {
    const sub = searchParams.get('sub') ?? '';
    const flag = searchParams.get('flag') ?? '';
    setSelectedCategories(sub ? [sub] : []);
    setSelectedBrands([]);
    setSelectedFlags(flag ? [flag] : []);
    setSortBy('default');
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, brandParam, location.pathname, location.search]);

  useEffect(() => {
    setPriceRange(priceAbsRange);
    setLocalPrice(priceAbsRange);
  }, [priceAbsRange]);

  useEffect(() => {
    setPage(1);
    setGridLoading(true);
    const t = setTimeout(() => setGridLoading(false), 200);
    return () => clearTimeout(t);
  }, [selectedCategories, selectedBrands, selectedFlags, sortBy, priceRange, searchQuery]);

  const catField = filterMode === 'shop' ? 'item_category' : 'item_category2';

  const filteredProducts = useMemo(() => {
    return scopedProducts.filter((p) => {
      const price = effectivePrice(p);
      if (searchQuery && !p.product_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p[catField])) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.item_brand)) return false;
      if (selectedFlags.length > 0 && !selectedFlags.some(f => getProductFlags(p).includes(f))) return false;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      return true;
    });
  }, [scopedProducts, selectedCategories, selectedBrands, selectedFlags, priceRange, catField, searchQuery]);

  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    switch (sortBy) {
      case 'price-asc':  return arr.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      case 'price-desc': return arr.sort((a, b) => effectivePrice(b) - effectivePrice(a));
      case 'name-asc':   return arr.sort((a, b) => a.product_name.localeCompare(b.product_name));
      default:           return arr;
    }
  }, [filteredProducts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedProducts = sortedProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const showingFrom = sortedProducts.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(safePage * ITEMS_PER_PAGE, sortedProducts.length);

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedBrands.length > 0 || selectedFlags.length > 0;

  function clearAll() {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedFlags([]);
    setPriceRange(priceAbsRange);
    setLocalPrice(priceAbsRange);
  }

  function handlePageChange(n) {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Layout>
      {/* Page header */}
      <div className="bg-brand-light py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumb crumbs={breadcrumbs} />
          <h1 className="mt-2 text-2xl font-bold text-brand-dark sm:text-3xl">{pageTitle}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <FilterSidebar
            mobileOpen={mobileFiltersOpen}
            onMobileClose={() => setMobileFiltersOpen(false)}
            scopedProducts={scopedProducts}
            filterMode={filterMode}
            selectedCategories={selectedCategories}
            selectedBrands={selectedBrands}
            selectedFlags={selectedFlags}
            priceAbsRange={priceAbsRange}
            onCategoriesChange={setSelectedCategories}
            onBrandsChange={setSelectedBrands}
            onFlagsChange={setSelectedFlags}
            onPriceRangeChange={setPriceRange}
            localPrice={localPrice}
            setLocalPrice={setLocalPrice}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAll}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 lg:hidden"
                >
                  <FunnelIcon className="h-4 w-4" aria-hidden="true" />
                  Filters
                </button>
                <p className="text-sm text-gray-500">
                  {sortedProducts.length > 0
                    ? `Showing ${showingFrom}–${showingTo} of ${sortedProducts.length}`
                    : '0 results'}
                </p>
              </div>
              <SortMenu value={sortBy} onChange={setSortBy} />
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="mb-4">
                <ActiveFilterChips
                  selectedCategories={selectedCategories}
                  onCategoriesChange={setSelectedCategories}
                  selectedBrands={selectedBrands}
                  onBrandsChange={setSelectedBrands}
                  selectedFlags={selectedFlags}
                  onFlagsChange={setSelectedFlags}
                />
              </div>
            )}

            {/* Grid */}
            {fetchError ? (
              <p className="py-16 text-center text-sm text-gray-500">Failed to load products. Try refreshing the page.</p>
            ) : !gridLoading && !productsLoading && sortedProducts.length === 0 ? (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters or clearing them all."
                action={
                  hasActiveFilters ? (
                    <Button variant="ghost" onClick={clearAll} size="sm">
                      Clear Filters
                    </Button>
                  ) : null
                }
              />
            ) : !fetchError ? (
              <ProductGrid products={pagedProducts} loading={gridLoading || productsLoading} />
            ) : null}

            {/* Pagination */}
            {!gridLoading && sortedProducts.length > ITEMS_PER_PAGE && (
              <div className="mt-6">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
