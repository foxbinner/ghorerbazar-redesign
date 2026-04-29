export function effectivePrice(p) {
  if (!p) return 0;
  return p.discount_price > 0 ? p.discount_price : p.original_price;
}

// Returns ordered image URLs — prefers new array column, falls back to old fixed columns
export function getProductImages(product) {
  if (product.product_images?.length) return product.product_images;
  return [product.image_url, product.image_url_02, product.image_url_03].filter(Boolean);
}

const FLAG_PRIORITY = ['New Arrival', 'Offered Items', 'Best Selling'];

// Returns the highest-priority flag for badge display
export function getDisplayFlag(product) {
  const flags = product.product_flags?.length
    ? product.product_flags
    : product.product_flag ? [product.product_flag] : [];
  return FLAG_PRIORITY.find(f => flags.includes(f)) ?? null;
}

// Returns all flags as an array (compat with both old and new schema)
export function getProductFlags(product) {
  if (product.product_flags?.length) return product.product_flags;
  return product.product_flag ? [product.product_flag] : [];
}

export function adaptProduct(p) {
  const slug = (p?.product_url ?? '').split('/').pop();
  const price = effectivePrice(p);
  return {
    href: `/products/${slug}`,
    imgSrc: p.image_url,
    imgAlt: p.product_name,
    name: p.product_name,
    newPrice: `৳${price.toLocaleString('en-IN')}`,
    oldPrice: p.discount_price > 0 ? `৳${p.original_price.toLocaleString('en-IN')}` : null,
    saveLabel: p.save_label || null,
    flagName: getDisplayFlag(p),
    dataId: slug,
    discountPriceVal: String(price),
    priceVal: String(p.original_price),
  };
}
