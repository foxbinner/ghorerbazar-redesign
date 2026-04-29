import { Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';

export default function Breadcrumb({ crumbs = [] }) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center gap-2">
        <li>
          <Link to="/" className="text-gray-400 hover:text-gray-500">
            <HomeIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {crumbs.map((crumb, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
            {crumb.href ? (
              <Link to={crumb.href} className="text-sm text-gray-500 hover:text-gray-700">
                {crumb.name}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-900">{crumb.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
