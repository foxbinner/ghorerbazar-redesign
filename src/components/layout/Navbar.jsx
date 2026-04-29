import { Fragment, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Transition, Dialog, Menu } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "../../context/CartContext";
import { useUserAuth } from "../../context/UserAuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { useSettings } from "../../context/SettingsContext";

const navLinks = [
  { name: "All Products", href: "/shop" },
  { name: "New Arrivals", href: "/shop?flag=New+Arrival" },
  { name: "Offered Items", href: "/shop?flag=Offered+Items" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function useIsActive() {
  const { pathname, search } = useLocation();
  return (href) => {
    const [hrefPath, hrefQuery] = href.split("?");
    if (pathname !== hrefPath) return false;
    if (!hrefQuery) {
      if (hrefPath === "/shop") {
        return !new URLSearchParams(search).has("flag");
      }
      return true;
    }
    const hrefParams = new URLSearchParams(hrefQuery);
    const current = new URLSearchParams(search);
    for (const [key, val] of hrefParams) {
      if (current.get(key) !== val) return false;
    }
    return true;
  };
}

export default function Navbar() {
  const { totalQty, dispatch } = useCart();
  const { user, logout } = useUserAuth();
  const { slugs } = useWishlist();
  const { announcement, announcement_on } = useSettings();
  const isActive = useIsActive();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  return (
    <>
      {/* Announcement bar */}
      {announcement_on === 'true' && (
        <div className="bg-brand-orange px-4 py-2 text-center text-xs font-medium text-white">
          {announcement}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <nav
          aria-label="Top"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="flex h-16 items-center justify-between gap-6">
            {/* Mobile hamburger */}
            <button
              type="button"
              className="-ml-2 p-2 text-gray-600 sm:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <span className="sr-only">Open menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center">
              <img
                src="/logoname.svg"
                alt="GhorerBazar"
                className="h-9 w-auto"
              />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:gap-x-6 sm:ml-8">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`relative whitespace-nowrap text-sm font-medium transition-colors ${
                      active
                        ? "text-brand-orange after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-brand-orange"
                        : "text-gray-700 hover:text-brand-orange"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <button
                type="button"
                className="p-2 text-gray-600 hover:text-brand-orange transition-colors"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
              </button>

              {/* Wishlist */}
              <Link
                to="/profile"
                className="relative p-2 text-gray-600 hover:text-brand-orange transition-colors"
                aria-label="Wishlist"
              >
                <HeartIcon className="h-5 w-5" aria-hidden="true" />
                {slugs.length > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white">
                    {slugs.length > 9 ? "9+" : slugs.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                type="button"
                className="relative p-2 text-gray-600 hover:text-brand-orange transition-colors"
                onClick={() => dispatch({ type: "OPEN" })}
                aria-label="Open cart"
              >
                <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />
                {totalQty > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white">
                    {totalQty > 9 ? "9+" : totalQty}
                  </span>
                )}
              </button>

              {/* Divider */}
              <span
                className="hidden sm:block h-5 w-px bg-gray-200 ml-1 mr-3"
                aria-hidden="true"
              />

              {/* Profile / Auth — desktop only */}
              <div className="hidden sm:flex sm:items-center sm:gap-3">
                {user ? (
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white hover:bg-orange-500 transition-colors overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="opacity-0 scale-95"
                      enterTo="opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="opacity-100 scale-100"
                      leaveTo="opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none py-1 z-50">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={`block mx-1 rounded-lg px-3 py-2 text-sm ${active ? "bg-gray-50 text-brand-orange" : "text-gray-700"}`}
                            >
                              My Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                logout();
                                navigate("/");
                              }}
                              className={`block w-[calc(100%-0.5rem)] mx-1 rounded-lg text-left px-3 py-2 text-sm ${active ? "bg-gray-50 text-red-600" : "text-gray-700"}`}
                            >
                              Logout
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-sm font-medium text-gray-700 hover:text-brand-orange transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-full border border-brand-orange px-4 py-1.5 text-sm font-semibold text-brand-orange hover:bg-brand-orange hover:text-white transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Expandable search bar */}
          <Transition
            show={searchOpen}
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <div className="border-t border-gray-100 py-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
                <button
                  type="submit"
                  className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white hover:bg-orange-500"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="rounded-full px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            </div>
          </Transition>
        </nav>
      </header>

      {/* Mobile menu */}
      <Dialog
        as="div"
        className="relative z-50 sm:hidden"
        open={mobileOpen}
        onClose={setMobileOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-dark/60" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl">
              <div className="flex items-center justify-between px-4 pb-4 pt-5">
                <Link to="/" onClick={() => setMobileOpen(false)}>
                  <img
                    src="/logoname.svg"
                    alt="GhorerBazar"
                    className="h-8 w-auto"
                  />
                </Link>
                <button
                  type="button"
                  className="-mr-2 p-2 text-gray-600"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Nav links */}
              <div className="border-t border-gray-200 px-4 py-6 space-y-1">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-orange-50 text-brand-orange font-semibold"
                          : "text-gray-900 hover:bg-gray-50 hover:text-brand-orange"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              {/* Auth links */}
              <div className="border-t border-gray-200 px-4 py-6 space-y-3">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="block text-sm font-medium text-gray-900 hover:text-brand-orange"
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                        setMobileOpen(false);
                      }}
                      className="block w-full rounded-full border border-red-200 py-2.5 text-center text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block text-sm font-medium text-gray-900 hover:text-brand-orange"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full rounded-full bg-brand-orange py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-500"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </>
  );
}
