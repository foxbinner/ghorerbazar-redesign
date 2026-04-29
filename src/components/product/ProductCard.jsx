import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCartIcon, CheckIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useUserAuth } from '../../context/UserAuthContext';
import { fmt } from '../../utils/fmt';
import { effectivePrice, getDisplayFlag } from '../../utils/productHelpers';
import Badge from '../ui/Badge';
import { ProductCardSkeleton } from '../ui/Skeleton';

function ProductCard({ product, skeleton = false }) {
  if (skeleton) return <ProductCardSkeleton />;

  const { items, dispatch } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const slug = product.slug ?? (product.product_url ?? '').split('/').pop();
  const price = effectivePrice(product);
  const inCart = items.some((i) => i.id === slug);

  const wishlisted = isWishlisted(slug);

  const handleCart = (e) => {
    e.preventDefault();
    if (inCart) {
      dispatch({ type: 'REMOVE', payload: slug });
      toast.error(`${product.product_name} removed from cart`);
    } else {
      dispatch({
        type: 'ADD',
        payload: {
          id: slug,
          slug,
          name: product.product_name,
          brand: product.item_brand ?? null,
          category: product.item_category,
          price,
          image: product.image_url,
        },
      });
      toast.success(`${product.product_name} added to cart`);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    toggle(slug);
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const hasDiscount = product.discount_price > 0;
  const savePct = hasDiscount && product.original_price > 0
    ? Math.round(((product.original_price - product.discount_price) / product.original_price) * 100)
    : 0;

  return (
    <div className="group relative border-b border-r border-gray-200 p-4 sm:p-6">
      <Link to={`/products/${slug}`} className="block">
        {/* Flag — top left, outside image */}
        {getDisplayFlag(product) && (
          <div className="absolute top-5 left-5 z-10">
            <Badge
              label={getDisplayFlag(product)}
              variant={getDisplayFlag(product) === 'New Arrival' ? 'green' : 'dark'}
            />
          </div>
        )}
        {/* Discount — top right, outside image */}
        {savePct >= 5 && (
          <div className="absolute top-5 right-5 z-10">
            <Badge label={`-${savePct}%`} variant="orange" />
          </div>
        )}

        <div className="relative overflow-hidden rounded-lg bg-gray-50 pt-[100%] group-hover:opacity-90 transition-opacity">
          <img
            src={product.image_url}
            alt={product.product_name}
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="lazy"
          />
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
            {product.product_name}
          </h3>
          {product.item_brand && (
            <p className="mt-1 text-xs text-gray-400">{product.item_brand}</p>
          )}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-base font-semibold text-brand-orange">{fmt(price)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">{fmt(product.original_price)}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCart}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-colors ${
            inCart
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-brand-orange text-white hover:bg-orange-500'
          }`}
        >
          {inCart ? (
            <>
              <CheckIcon className="h-4 w-4" />
              In Cart
            </>
          ) : (
            <>
              <ShoppingCartIcon className="h-4 w-4" />
              Add to Cart
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
            wishlisted
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted
            ? <HeartSolid className="h-4 w-4" />
            : <HeartIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default memo(ProductCard);
