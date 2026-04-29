import { Fragment, useMemo } from 'react';
import { Dialog, Disclosure, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronDownIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { effectivePrice } from '../../utils/productHelpers';

function FilterSection({ title, options, selected, onChange }) {
  if (options.length === 0) return null;

  const toggle = (val) => {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  };

  return (
    <Disclosure as="div" className="border-b border-gray-200 py-4" defaultOpen>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full items-center justify-between py-1 text-sm text-gray-400 hover:text-gray-500">
            <span className="font-medium text-gray-900">{title}</span>
            {open ? (
              <MinusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <PlusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
          </Disclosure.Button>
          <Disclosure.Panel className="pt-3 space-y-2">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

function SidebarContent({
  scopedProducts,
  filterMode,
  selectedCategories,
  selectedBrands,
  selectedFlags,
  priceAbsRange,
  onCategoriesChange,
  onBrandsChange,
  onFlagsChange,
  onPriceRangeChange,
  localPrice,
  setLocalPrice,
  hasActiveFilters,
  onClearAll,
}) {
  const catField = filterMode === 'shop' ? 'item_category' : 'item_category2';
  const categories = useMemo(
    () => [...new Set(scopedProducts.map((p) => p[catField]).filter(Boolean))].sort(),
    [scopedProducts, catField]
  );
  const brands = useMemo(
    () => [...new Set(scopedProducts.map((p) => p.item_brand).filter(Boolean))].sort(),
    [scopedProducts]
  );
  const flags = useMemo(
    () => [...new Set(scopedProducts.map((p) => p.product_flag).filter(Boolean))].sort(),
    [scopedProducts]
  );

  return (
    <form>
      <FilterSection
        title={filterMode === 'shop' ? 'Category' : 'Sub-category'}
        options={categories}
        selected={selectedCategories}
        onChange={onCategoriesChange}
      />

      <FilterSection
        title="Brand"
        options={brands}
        selected={selectedBrands}
        onChange={onBrandsChange}
      />

      <FilterSection
        title="Product Type"
        options={flags}
        selected={selectedFlags}
        onChange={onFlagsChange}
      />

      {/* Price range */}
      <Disclosure as="div" className="border-b border-gray-200 py-4" defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex w-full items-center justify-between py-1 text-sm text-gray-400 hover:text-gray-500">
              <span className="font-medium text-gray-900">Price Range</span>
              {open ? (
                <MinusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <PlusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </Disclosure.Button>
            <Disclosure.Panel className="pt-3">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Min</label>
                  <input
                    type="number"
                    value={localPrice[0]}
                    min={priceAbsRange[0]}
                    max={localPrice[1]}
                    onChange={(e) => setLocalPrice([Number(e.target.value), localPrice[1]])}
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-brand-orange focus:ring-brand-orange"
                  />
                </div>
                <span className="text-gray-400 mt-4">&ndash;</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Max</label>
                  <input
                    type="number"
                    value={localPrice[1]}
                    min={localPrice[0]}
                    max={priceAbsRange[1]}
                    onChange={(e) => setLocalPrice([localPrice[0], Number(e.target.value)])}
                    className="w-full rounded-lg border-gray-300 text-sm focus:border-brand-orange focus:ring-brand-orange"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => { if (localPrice[0] <= localPrice[1]) onPriceRangeChange(localPrice); }}
                className="mt-3 w-full rounded-full bg-brand-dark px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              >
                Apply
              </button>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="mt-4 w-full rounded-full border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          Clear All Filters
        </button>
      )}
    </form>
  );
}

export default function FilterSidebar({
  mobileOpen,
  onMobileClose,
  scopedProducts,
  filterMode,
  selectedCategories,
  selectedBrands,
  selectedFlags,
  priceAbsRange,
  onCategoriesChange,
  onBrandsChange,
  onFlagsChange,
  onPriceRangeChange,
  localPrice,
  setLocalPrice,
  hasActiveFilters,
  onClearAll,
}) {
  const sharedProps = {
    scopedProducts,
    filterMode,
    selectedCategories,
    selectedBrands,
    selectedFlags,
    priceAbsRange,
    onCategoriesChange,
    onBrandsChange,
    onFlagsChange,
    onPriceRangeChange,
    localPrice,
    setLocalPrice,
    hasActiveFilters,
    onClearAll,
  };

  return (
    <>
      {/* Mobile filter Dialog */}
      <Transition.Root show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onMobileClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl">
                <div className="flex items-center justify-between px-4 mb-4">
                  <Dialog.Title className="text-base font-semibold text-gray-900">Filters</Dialog.Title>
                  <button
                    type="button"
                    onClick={onMobileClose}
                    className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md p-2 text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="px-4">
                  <SidebarContent {...sharedProps} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 pb-4 border-b border-gray-200">Filters</h2>
        <SidebarContent {...sharedProps} />
      </div>
    </>
  );
}
