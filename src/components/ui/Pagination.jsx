import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  for (let i = left; i <= right; i++) pages.push(i);
  if (left > 1) pages.unshift('...', 1);
  if (right < totalPages) pages.push('...', totalPages);

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 py-4 sm:px-0" aria-label="Pagination">
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
        </p>
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex items-center rounded-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
        >
          <span className="sr-only">Previous</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="inline-flex items-center px-3 py-2 text-sm text-gray-500">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ring-1 ring-inset ${
                p === page
                  ? 'bg-brand-orange text-white ring-brand-orange'
                  : 'text-gray-700 ring-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="inline-flex items-center rounded-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40"
        >
          <span className="sr-only">Next</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
