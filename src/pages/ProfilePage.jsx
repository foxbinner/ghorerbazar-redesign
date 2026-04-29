import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { toast } from 'sonner';
import {
  PhoneIcon, EnvelopeIcon, CalendarIcon,
  ArrowRightOnRectangleIcon, PencilSquareIcon, CheckIcon,
  HeartIcon, ShoppingBagIcon, ChevronDownIcon,
  MapPinIcon, ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/product/ProductCard';
import { useUserAuth } from '../context/UserAuthContext';
import { useWishlist } from '../context/WishlistContext';
import { fetchUserOrders } from '../lib/orders';
import { fetchProductsBySlugs } from '../lib/products';
import { fmt } from '../utils/fmt';
import { cn } from '../utils/cn';
import { DISTRICTS } from '../data/districts';
import { THANAS } from '../data/thanas';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

function Spinner() {
  return <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" /></div>;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5 text-center">
      <p className="text-2xl font-bold text-brand-dark">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function OrderItemsTable({ items }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3 rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-500">Item</th>
            <th className="px-3 py-2 text-center font-medium text-gray-500">Qty</th>
            <th className="px-3 py-2 text-right font-medium text-gray-500">Price</th>
            <th className="px-3 py-2 text-right font-medium text-gray-500">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {items.map((item, i) => (
            <tr key={i}>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="h-9 w-9 rounded-lg object-cover shrink-0" />
                  )}
                  <span className="font-medium text-gray-800 line-clamp-2 max-w-[160px]">{item.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center text-gray-500">×{item.qty}</td>
              <td className="px-3 py-2.5 text-right text-gray-600">{fmt(item.price)}</td>
              <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{fmt(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTab({ orders, loading, error }) {
  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="rounded-2xl bg-white shadow-sm py-16 text-center">
        <p className="text-sm text-red-500">Failed to load orders. Please refresh the page.</p>
      </div>
    );
  }
  if (!orders.length) {
    return (
      <div className="rounded-2xl bg-white shadow-sm py-16 text-center">
        <ShoppingBagIcon className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">No orders yet</p>
        <Link to="/shop" className="mt-4 inline-block rounded-full bg-brand-orange px-5 py-2 text-xs font-semibold text-white hover:bg-orange-500">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const orderNum = o.order_number ?? '#' + o.id.slice(0, 8).toUpperCase();
        const location = [o.thana, o.district].filter(Boolean).join(', ');

        return (
          <div key={o.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-gray-900">{orderNum}</p>
                <p className="text-xs text-gray-400 mt-0.5">{date} · {items.length} item{items.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-brand-orange">{fmt(o.total)}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {o.status}
                </span>
              </div>
            </div>

            <div className="px-5 pt-3 pb-4">
              <OrderItemsTable items={items} />
              {(o.name || o.address || location) && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5" /> Shipping to
                  </p>
                  <p className="text-sm font-medium text-gray-800">{o.name}</p>
                  {o.phone && <p className="text-xs text-gray-500 mt-0.5">{o.phone}</p>}
                  {location && <p className="text-xs text-gray-500">{location}</p>}
                  {o.address && <p className="text-xs text-gray-500 mt-0.5">{o.address}</p>}
                </div>
              )}
              {o.notes && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5" /> Note
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">{o.notes}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WishlistTab() {
  const { slugs } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slugs.length) { setLoading(false); return; }
    fetchProductsBySlugs(slugs).then(data => { setProducts(data); setLoading(false); });
  }, [slugs.join(',')]);

  if (loading) return <Spinner />;
  if (!slugs.length) {
    return (
      <div className="rounded-2xl bg-white shadow-sm py-16 text-center">
        <HeartIcon className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Your wishlist is empty</p>
        <Link to="/shop" className="mt-4 inline-block rounded-full bg-brand-orange px-5 py-2 text-xs font-semibold text-white hover:bg-orange-500">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-px grid grid-cols-2 border-l border-t border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4">
      {products.map(p => (
        <ProductCard key={p.slug ?? p.product_url} product={p} />
      ))}
    </div>
  );
}

function RecentOrders({ orders, onViewAll }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
        {orders.length > 3 && (
          <button onClick={onViewAll} className="text-xs font-medium text-brand-orange hover:underline">
            View all →
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {orders.slice(0, 3).map(o => {
          const items = Array.isArray(o.items) ? o.items : [];
          const isOpen = expandedId === o.id;
          const orderNum = o.order_number ?? '#' + o.id.slice(0, 8).toUpperCase();
          const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
          const location = [o.thana, o.district].filter(Boolean).join(', ');

          return (
            <div key={o.id}>
              <button
                onClick={() => setExpandedId(isOpen ? null : o.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{orderNum}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{date} · {items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
                <p className="text-sm font-semibold text-brand-orange shrink-0">{fmt(o.total)}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0 ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {o.status}
                </span>
                <ChevronDownIcon className={cn('h-4 w-4 text-gray-400 shrink-0 transition-transform', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                  <OrderItemsTable items={items} />
                  {(o.name || o.address || location) && (
                    <div className="mt-3 text-xs text-gray-500">
                      <p className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <MapPinIcon className="h-3.5 w-3.5" /> Shipping to
                      </p>
                      <p>{o.name}{o.phone ? ` · ${o.phone}` : ''}</p>
                      {location && <p>{location}</p>}
                      {o.address && <p>{o.address}</p>}
                    </div>
                  )}
                  {o.notes && (
                    <p className="mt-2 text-xs text-gray-500 italic">"{o.notes}"</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: '', phone: '', avatar: '', district: '', upazilla: '', address: '' };

function formFromUser(user) {
  return {
    name: user.name ?? '',
    phone: user.phone ?? '',
    avatar: user.avatar ?? '',
    district: user.district ?? '',
    upazilla: user.upazilla ?? '',
    address: user.address ?? '',
  };
}

export default function ProfilePage() {
  const { user, logout, update } = useUserAuth();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => { document.title = 'My Account | Ghorer Bazar'; }, []);

  // Sync form from context whenever user updates (e.g. after save) — skip while editing
  useEffect(() => {
    if (user && !editing) setForm(formFromUser(user));
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    fetchUserOrders(user.id)
      .then(data => setOrders(data))
      .catch(() => setOrdersError(true))
      .finally(() => setOrdersLoading(false));
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    toast('Logged out');
    navigate('/');
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await update(form);
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    setEditing(false);
    toast.success('Profile updated');
  };

  const handleCancelEdit = () => {
    setForm(formFromUser(user));
    setEditing(false);
  };

  const delivered = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  const tabs = ['Overview', 'Orders', 'Wishlist'];

  return (
    <Layout>
      <div className="bg-brand-light min-h-screen">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
            <div className="flex items-center justify-between mb-6">
              <Tab.List className="flex gap-1 rounded-xl bg-white shadow-sm p-1">
                {tabs.map(t => (
                  <Tab key={t} className={({ selected }) =>
                    cn(
                      'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                      selected ? 'bg-brand-orange text-white shadow' : 'text-gray-500 hover:text-gray-700'
                    )
                  }>{t}</Tab>
                ))}
              </Tab.List>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </button>
            </div>

            <Tab.Panels className="space-y-5">
              {/* Overview */}
              <Tab.Panel className="space-y-5">
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-brand-dark to-gray-700" />
                  <div className="px-6 pb-6">
                    <div className="flex items-end justify-between -mt-10 mb-4">
                      <div className="h-20 w-20 rounded-full border-4 border-white overflow-hidden bg-brand-light flex items-center justify-center shrink-0">
                        {user.avatar
                          ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                          : <span className="text-3xl font-bold text-brand-orange">{user.name.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex gap-2 mt-10">
                        {editing ? (
                          <>
                            <button
                              onClick={handleCancelEdit}
                              className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="rounded-full bg-brand-orange px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 inline-flex items-center gap-1 disabled:opacity-60"
                            >
                              <CheckIcon className="h-3.5 w-3.5" />
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditing(true)}
                            className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1.5"
                          >
                            <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                          </button>
                        )}
                      </div>
                    </div>

                    {editing ? (
                      <div className="space-y-3 max-w-lg">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                            <input
                              value={form.name}
                              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              value={form.phone}
                              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Profile Picture URL</label>
                          <input
                            type="url"
                            value={form.avatar}
                            onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                          />
                        </div>
                        <div className="pt-1 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <MapPinIcon className="h-3.5 w-3.5" /> Default Address
                          </p>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                                <select
                                  value={form.district}
                                  onChange={e => setForm(f => ({ ...f, district: e.target.value, upazilla: '' }))}
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange bg-white"
                                >
                                  <option value="">Select district</option>
                                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Upazilla</label>
                                <select
                                  value={form.upazilla}
                                  onChange={e => setForm(f => ({ ...f, upazilla: e.target.value }))}
                                  disabled={!form.district}
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="">{form.district ? 'Select upazilla' : 'Select district first'}</option>
                                  {(THANAS[form.district] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                              <textarea
                                rows={2}
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="House, road, area..."
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h1 className="text-xl font-bold text-brand-dark">{user.name}</h1>
                        <div className="mt-3 grid gap-x-6 gap-y-2 text-xs text-gray-500" style={{ gridTemplateColumns: 'auto 1fr' }}>
                          <span className="flex items-center gap-1.5">
                            <PhoneIcon className="h-3.5 w-3.5 shrink-0" /> {user.phone || 'Not set'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" /> {user.email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5 shrink-0" /> Joined {user.joinedAt}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                            {[user.address, user.upazilla, user.district].filter(Boolean).join(', ') || 'No address'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <StatCard label="Total Orders" value={ordersLoading ? '—' : orders.length} />
                  <StatCard label="Delivered" value={ordersLoading ? '—' : delivered} />
                  <StatCard label="Total Spent" value={ordersLoading ? '—' : fmt(totalSpent)} />
                </div>

                {!ordersLoading && orders.length > 0 && (
                  <RecentOrders orders={orders} onViewAll={() => setTabIndex(1)} />
                )}
              </Tab.Panel>

              {/* Orders */}
              <Tab.Panel>
                <OrdersTab orders={orders} loading={ordersLoading} error={ordersError} />
              </Tab.Panel>

              {/* Wishlist */}
              <Tab.Panel>
                <WishlistTab />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Layout>
  );
}
