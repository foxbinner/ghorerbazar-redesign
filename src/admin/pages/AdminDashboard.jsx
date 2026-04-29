import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CubeIcon, ShoppingBagIcon, CurrencyDollarIcon, UserGroupIcon,
  ArrowTrendingUpIcon, ClockIcon, CheckCircleIcon, TruckIcon,
  XCircleIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { fetchAllOrders } from '../../lib/orders';
import { adminFetchAllProducts } from '../../lib/products';
import { fmt } from '../../utils/fmt';

const STATUS_META = {
  pending:   { label: 'Pending',   color: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50',  icon: ClockIcon },
  confirmed: { label: 'Confirmed', color: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50',    icon: CheckCircleIcon },
  shipped:   { label: 'Shipped',   color: 'bg-purple-400', text: 'text-purple-700', bg: 'bg-purple-50',  icon: TruckIcon },
  delivered: { label: 'Delivered', color: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-50',   icon: CheckCircleIcon },
  cancelled: { label: 'Cancelled', color: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50',     icon: XCircleIcon },
};

function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

function StatCard({ label, value, sub, icon: Icon, gradient, loading }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          {loading
            ? <Skeleton className="h-8 w-24 bg-white/30" />
            : <p className="text-3xl font-bold tracking-tight">{value}</p>
          }
          <p className="mt-1 text-sm font-medium text-white/80">{label}</p>
          {sub && !loading && <p className="mt-0.5 text-xs text-white/60">{sub}</p>}
        </div>
        <div className="rounded-xl bg-white/20 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {/* decorative circle */}
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10" />
    </div>
  );
}

function StatusPill({ status, count, total }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  const pct = total ? Math.round((count / total) * 100) : 0;
  const Icon = meta.icon;
  return (
    <div className={`flex items-center justify-between rounded-xl ${meta.bg} px-4 py-3`}>
      <div className="flex items-center gap-2.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${meta.color}`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${meta.text}`}>{count}</span>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([fetchAllOrders(), adminFetchAllProducts()])
      .then(([o, p]) => { setOrders(o); setProductCount(p.length); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.created_at?.slice(0, 10) === today).length;
  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total ?? 0), 0);
  const customers = new Set(orders.map(o => o.phone)).size;

  const statusCounts = Object.fromEntries(
    Object.keys(STATUS_META).map(s => [s, orders.filter(o => o.status === s).length])
  );

  const recent = orders.slice(0, 6);

  const stats = [
    { label: 'Total Revenue',  value: fmt(revenue),     sub: 'Excl. cancelled',       icon: CurrencyDollarIcon, gradient: 'bg-gradient-to-br from-orange-500 to-orange-400' },
    { label: 'Total Orders',   value: orders.length,    sub: todayOrders ? `+${todayOrders} today` : 'All time', icon: ShoppingBagIcon,    gradient: 'bg-gradient-to-br from-blue-600 to-blue-500' },
    { label: 'Products',       value: productCount,     sub: 'Active in catalog',      icon: CubeIcon,           gradient: 'bg-gradient-to-br from-purple-600 to-purple-500' },
    { label: 'Customers',      value: customers,         sub: 'Unique phone numbers',  icon: UserGroupIcon,      gradient: 'bg-gradient-to-br from-green-600 to-green-500' },
  ];

  return (
    <div className="space-y-6">

      {loadError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Failed to load dashboard data. Check your connection and refresh.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
        >
          <ArrowTrendingUpIcon className="h-4 w-4" />
          View Orders
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(s => (
          <StatCard key={s.label} loading={loading} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Recent orders — 2/3 */}
        <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last {recent.length} orders</p>
            </div>
            <Link to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange hover:underline">
              View all <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBagIcon className="mx-auto h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map(o => {
                const meta = STATUS_META[o.status];
                return (
                  <div key={o.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    {/* Order ID */}
                    <div className="w-20 shrink-0">
                      <p className="text-xs font-mono font-semibold text-gray-700">
                        {o.order_number ?? '#' + o.id.slice(0, 6).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{o.created_at?.slice(0, 10)}</p>
                    </div>

                    {/* Customer */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{o.name}</p>
                      <p className="text-xs text-gray-400">{o.phone}</p>
                    </div>

                    {/* Total */}
                    <p className="text-sm font-bold text-gray-900 shrink-0">{fmt(o.total)}</p>

                    {/* Status */}
                    {meta && (
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order status breakdown — 1/3 */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Order Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">{orders.length} total orders</p>
          </div>

          {loading ? (
            <div className="p-5 space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400">No data</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {Object.keys(STATUS_META).map(s => (
                <StatusPill key={s} status={s} count={statusCounts[s] ?? 0} total={orders.length} />
              ))}
            </div>
          )}

          {/* Stacked bar */}
          {!loading && orders.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex h-2 w-full overflow-hidden rounded-full gap-px">
                {Object.entries(STATUS_META).map(([s, meta]) => {
                  const pct = (statusCounts[s] ?? 0) / orders.length * 100;
                  return pct > 0 ? (
                    <div key={s} style={{ width: `${pct}%` }} className={`${meta.color}`} title={`${meta.label}: ${pct.toFixed(0)}%`} />
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { href: '/admin/orders',   label: 'Manage Orders',   desc: 'Update status, view details', icon: ShoppingBagIcon, color: 'text-blue-600 bg-blue-50' },
          { href: '/admin/products', label: 'Manage Products', desc: 'Add, edit or deactivate',     icon: CubeIcon,        color: 'text-purple-600 bg-purple-50' },
          { href: '/',               label: 'View Store',      desc: 'Open storefront in new tab',  icon: ArrowTrendingUpIcon, color: 'text-orange-600 bg-orange-50', external: true },
        ].map(item => (
          <Link
            key={item.href}
            to={item.href}
            target={item.external ? '_blank' : undefined}
            className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-orange transition-colors">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-gray-300 group-hover:text-brand-orange transition-colors shrink-0" />
          </Link>
        ))}
      </div>

    </div>
  );
}
