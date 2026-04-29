import React, { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { fetchAllOrders, updateOrderStatus } from '../../lib/orders';
import { fmt } from '../../utils/fmt';
import { toast } from 'sonner';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const STATUSES = ['All', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function Spinner() {
  return <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" /></div>;
}

function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = React.useRef(null);
  const options = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(o => !o);
  };

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[current] ?? 'bg-gray-100 text-gray-600'}`}
      >
        {current}<ChevronDownIcon className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 w-32 rounded-xl bg-white shadow-xl border border-gray-100 py-1 text-xs"
            style={{ top: pos.top, left: pos.left }}
          >
            {options.map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 capitalize hover:bg-gray-50 ${s === current ? 'font-semibold' : ''}`}>
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  const items = Array.isArray(order.items) ? order.items : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{order.created_at?.slice(0, 10)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 text-xs font-medium">
            Close
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-gray-400">Customer</p><p className="font-medium text-gray-900 mt-0.5">{order.name}</p></div>
            <div><p className="text-gray-400">Phone</p><p className="font-medium text-gray-900 mt-0.5">{order.phone}</p></div>
            <div>
              <p className="text-gray-400">District</p>
              <p className="font-medium text-gray-900 mt-0.5">
                {order.district}{order.thana ? `, ${order.thana}` : ''}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize mt-0.5 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {order.status}
              </span>
            </div>
            {order.address && (
              <div className="col-span-2">
                <p className="text-gray-400">Address</p>
                <p className="font-medium text-gray-900 mt-0.5">{order.address}</p>
              </div>
            )}
            {order.notes && (
              <div className="col-span-2">
                <p className="text-gray-400">Note</p>
                <p className="font-medium text-gray-900 mt-0.5">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Payment info */}
          {order.payment_method && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-xs space-y-1.5">
              <p className="text-gray-400 font-medium uppercase tracking-wide text-[10px]">Payment</p>
              <div className="flex items-center gap-2 flex-wrap">
                {order.payment_type && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {order.payment_type === 'cod' ? 'Cash on Delivery' : 'Full Payment'}
                  </span>
                )}
                <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-xs font-semibold capitalize text-brand-orange">
                  {order.payment_method}
                </span>
              </div>
              {order.txn_id && (
                <p className="text-gray-600">TXN ID: <span className="font-medium text-gray-900">{order.txn_id}</span></p>
              )}
              {order.txn_phone && (
                <p className="text-gray-600">Sender: <span className="font-medium text-gray-900">{order.txn_phone}</span></p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 mb-2">Items</p>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  {item.image && <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-gray-100 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 shrink-0">{fmt(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1">
            {order.delivery_fee != null && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Delivery</span>
                <span>{fmt(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <p className="text-sm font-semibold text-gray-900">Total</p>
              <p className="text-sm font-bold text-brand-orange">{fmt(order.total)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const PER_PAGE = 10;

  useEffect(() => {
    fetchAllOrders().then(data => { setOrders(data); setLoading(false); });
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    try {
      await updateOrderStatus(id, newStatus);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
      fetchAllOrders().then(setOrders);
    }
  };

  const filtered = useMemo(() => orders.filter(o => {
    const q = query.toLowerCase();
    const matchQ = !query ||
      o.id.toLowerCase().includes(q) ||
      o.name?.toLowerCase().includes(q) ||
      o.phone?.includes(q);
    const matchS = statusFilter === 'All' || o.status === statusFilter;
    return matchQ && matchS;
  }), [orders, query, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = useMemo(() => {
    const c = { All: orders.length };
    ['pending','confirmed','shipped','delivered','cancelled'].forEach(s => {
      c[s] = orders.filter(o => o.status === s).length;
    });
    return c;
  }, [orders]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Orders <span className="text-sm font-normal text-gray-400">({filtered.length})</span>
        </h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-brand-orange text-white'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}>
            {s} <span className="opacity-70">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by order ID, customer name or phone..."
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Order</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">District</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Payment</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">No orders found</td></tr>
              )}
              {paged.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900 text-xs">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-5 py-3">
                    <p className="text-gray-900 font-medium">{o.name}</p>
                    <p className="text-xs text-gray-400">{o.phone}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{o.district}</td>
                  <td className="px-5 py-3">
                    {o.payment_method ? (
                      <div>
                        <span className="inline-flex rounded-full bg-brand-orange/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-brand-orange">
                          {o.payment_method}
                        </span>
                        {(o.txn_id || o.txn_phone) && (
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[100px]">
                            {o.txn_id || o.txn_phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{o.created_at?.slice(0, 10)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(o.total)}</td>
                  <td className="px-5 py-3">
                    <StatusDropdown current={o.status} onChange={s => handleStatusChange(o.id, s)} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => setViewing(o)}
                      className="text-xs font-medium text-brand-orange hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-xs font-medium text-gray-500 hover:text-brand-orange disabled:opacity-40">
              ← Prev
            </button>
            <span className="text-xs text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-xs font-medium text-gray-500 hover:text-brand-orange disabled:opacity-40">
              Next →
            </button>
          </div>
        )}
      </div>

      {viewing && <OrderDetailModal order={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
