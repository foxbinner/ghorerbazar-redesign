import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
} from '@heroicons/react/24/solid';
import { useCart } from '../../context/CartContext';

export default function StickyFooter() {
  const { pathname } = useLocation();
  const { totalQty, dispatch } = useCart();

  const tabs = [
    {
      label: 'Home',
      href: '/',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      active: pathname === '/',
    },
    {
      label: 'Shop',
      href: '/shop',
      icon: MagnifyingGlassIcon,
      activeIcon: MagnifyingGlassIcon,
      active: pathname.startsWith('/shop') || pathname.startsWith('/collections') || pathname.startsWith('/brands'),
    },
    {
      label: 'Cart',
      href: null,
      icon: ShoppingBagIcon,
      activeIcon: ShoppingBagIconSolid,
      active: false,
      onClick: () => dispatch({ type: 'OPEN' }),
      badge: totalQty,
    },
    {
      label: 'Account',
      href: '/login',
      icon: UserIcon,
      activeIcon: UserIcon,
      active: pathname === '/login' || pathname === '/register',
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white pb-safe sm:hidden">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.active ? tab.activeIcon : tab.icon;
          const inner = (
            <>
              <div className="relative">
                <Icon className={`h-6 w-6 ${tab.active ? 'text-brand-orange' : 'text-gray-500'}`} aria-hidden="true" />
                {tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`mt-1 text-[10px] ${tab.active ? 'font-semibold text-brand-orange' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </>
          );

          if (tab.onClick) {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={tab.onClick}
                className="flex flex-1 flex-col items-center justify-center py-2 focus:outline-none"
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={tab.label}
              to={tab.href}
              className="flex flex-1 flex-col items-center justify-center py-2"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
