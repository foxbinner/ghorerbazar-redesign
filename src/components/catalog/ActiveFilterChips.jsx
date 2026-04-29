import { XMarkIcon } from '@heroicons/react/20/solid';

export default function ActiveFilterChips({
  selectedCategories, onCategoriesChange,
  selectedBrands,     onBrandsChange,
  selectedFlags,      onFlagsChange,
}) {
  const all = [
    ...selectedCategories.map((v) => ({ label: v, remove: () => onCategoriesChange(selectedCategories.filter((x) => x !== v)) })),
    ...selectedBrands.map((v) => ({ label: v, remove: () => onBrandsChange(selectedBrands.filter((x) => x !== v)) })),
    ...selectedFlags.map((v) => ({ label: v, remove: () => onFlagsChange(selectedFlags.filter((x) => x !== v)) })),
  ];

  if (all.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {all.map(({ label, remove }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full bg-brand-light border border-orange-200 px-3 py-1 text-xs font-medium text-brand-dark"
        >
          {label}
          <button
            type="button"
            onClick={remove}
            className="ml-0.5 text-gray-400 hover:text-brand-orange"
            aria-label={`Remove ${label} filter`}
          >
            <XMarkIcon className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}
