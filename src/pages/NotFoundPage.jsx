import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-24 text-center">
      <img
        src="/logoname.svg"
        alt="GhorerBazar"
        className="h-12 w-auto mb-8 opacity-60"
      />
      <p className="text-5xl font-bold text-brand-orange">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-3 text-sm text-gray-500 max-w-sm">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-white hover:bg-orange-500"
        >
          Back to Home
        </Link>
        <Link
          to="/shop"
          className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}
