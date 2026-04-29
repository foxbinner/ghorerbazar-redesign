import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from './AdminAuth';
import {
  Squares2X2Icon,
  ShoppingBagIcon,
  CubeIcon,
  PhotoIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const nav = [
  { label: 'Dashboard', href: '/admin',          icon: Squares2X2Icon },
  { label: 'Orders',    href: '/admin/orders',    icon: ShoppingBagIcon },
  { label: 'Products',  href: '/admin/products',  icon: CubeIcon },
  { label: 'Banners',   href: '/admin/banners',   icon: PhotoIcon },
  { label: 'Settings',  href: '/admin/settings',  icon: Cog6ToothIcon },
];

function SidebarContent({ onNav }) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">

      {/* Brand */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <img
            src="/logoname.svg"
            alt="GhorerBazar"
            className="h-8 w-auto brightness-0 invert"
          />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            end={href === '/admin'}
            onClick={onNav}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-orange text-white shadow-md shadow-orange-900/20'
                  : 'text-gray-400 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mx-4 border-t border-white/10" />
      <div className="px-3 py-4 space-y-1">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/8 hover:text-white transition-all"
        >
          <BuildingStorefrontIcon className="h-[18px] w-[18px] shrink-0" />
          View Store
        </Link>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/8 hover:text-white transition-all"
        >
          <ArrowRightOnRectangleIcon className="h-[18px] w-[18px] shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('admin-layout');
    return () => document.documentElement.classList.remove('admin-layout');
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex lg:w-60 shrink-0 flex-col bg-[#1a1f2e]">
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-[#1a1f2e] z-50 shadow-2xl">
            <SidebarContent onNav={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <button
            className="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Mobile logo */}
          <img
            src="/logoname.svg"
            alt="GhorerBazar"
            className="h-6 w-auto lg:hidden"
          />

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Online
            </span>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
