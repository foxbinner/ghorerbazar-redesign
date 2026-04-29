import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], loading = false, skeletonCount = 8 }) {
  const items = loading
    ? Array.from({ length: skeletonCount }, (_, i) => i)
    : products;

  return (
    <div className="-mx-px grid grid-cols-2 border-l border-t border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, idx) =>
        loading ? (
          <ProductCard key={idx} skeleton />
        ) : (
          <ProductCard key={item.product_url ?? idx} product={item} />
        )
      )}
    </div>
  );
}
