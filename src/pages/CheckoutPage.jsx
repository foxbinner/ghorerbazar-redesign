import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, CheckCircleIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Layout from '../components/layout/Layout';
import FieldError from '../components/ui/FieldError';
import { useCart } from '../context/CartContext';
import { useUserAuth } from '../context/UserAuthContext';
import { insertOrder } from '../lib/orders';
import { useSettings } from '../context/SettingsContext';
import { fmt } from '../utils/fmt';
import { isBdPhone } from '../utils/validation';
import { DISTRICTS } from '../data/districts';
import { THANAS } from '../data/thanas';
import { DELIVERY_FEE_DHAKA, DELIVERY_FEE_OUTSIDE } from '../config/constants';

const METHOD_LABELS = { bkash: 'bKash', nagad: 'Nagad' };

function getDeliveryFee(district) {
  if (!district) return null;
  return district === 'Dhaka' ? DELIVERY_FEE_DHAKA : DELIVERY_FEE_OUTSIDE;
}

function RadioDot({ selected }) {
  return (
    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
      selected ? 'border-brand-orange' : 'border-gray-300'
    }`}>
      {selected && <span className="h-2 w-2 rounded-full bg-brand-orange" />}
    </span>
  );
}

function TxnField({ txnId, txnPhone, error, onChange, onClearError }) {
  const [mode, setMode] = useState('id');

  function switchMode(next) {
    setMode(next);
    onClearError();
  }

  return (
    <div className="space-y-2">
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
        <button
          type="button"
          onClick={() => switchMode('id')}
          className={`flex-1 py-1.5 transition-colors ${
            mode === 'id' ? 'bg-brand-orange text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Transaction ID
        </button>
        <button
          type="button"
          onClick={() => switchMode('phone')}
          className={`flex-1 py-1.5 border-l border-gray-200 transition-colors ${
            mode === 'phone' ? 'bg-brand-orange text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          Sender&apos;s Number
        </button>
      </div>

      {mode === 'id' ? (
        <input
          id="txnId" name="txnId" type="text" value={txnId}
          onChange={onChange}
          placeholder="Enter your transaction ID"
          className={`form-input ${error ? 'border-red-400 ring-1 ring-red-400' : ''}`}
        />
      ) : (
        <input
          id="txnPhone" name="txnPhone" type="tel" value={txnPhone}
          onChange={onChange}
          placeholder="Number you sent from"
          className={`form-input ${error ? 'border-red-400 ring-1 ring-red-400' : ''}`}
        />
      )}
      <p className="text-xs text-gray-400">At least one is required to confirm your order.</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const { items, totalPrice, discount, discountedTotal, dispatch } = useCart();
  const { user } = useUserAuth();
  const { bkash_number, nagad_number } = useSettings();
  const merchants = { bkash: bkash_number, nagad: nagad_number };

  const [form, setForm] = useState({
    name:            user?.name     ?? '',
    phone:           user?.phone    ?? '',
    district:        user?.district ?? '',
    thana:           user?.upazilla ?? '',
    address:         user?.address  ?? '',
    specialNote:     '',
    billingName:     '',
    billingDistrict: '',
    billingAddress:  '',
    paymentType:     '',
    paymentMethod:   '',
    txnId:           '',
    txnPhone:        '',
  });
  const [showBilling, setShowBilling] = useState(false);
  const [agreed, setAgreed]           = useState(false);
  const [errors, setErrors]           = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => { document.title = 'Checkout | Ghorer Bazar'; }, []);

  // Re-fill once user auth resolves (e.g. slow session load)
  useEffect(() => {
    if (!user) return;
    setForm(prev => ({
      ...prev,
      name:     prev.name     || user.name     || '',
      phone:    prev.phone    || user.phone    || '',
      district: prev.district || user.district || '',
      thana:    prev.thana    || user.upazilla || '',
      address:  prev.address  || user.address  || '',
    }));
  }, [user?.id]);

  const deliveryFee  = getDeliveryFee(form.district);
  const orderTotal   = deliveryFee != null ? discountedTotal + deliveryFee : discountedTotal;
  const amountToSend = form.paymentType === 'full'
    ? (deliveryFee != null ? orderTotal : null)
    : deliveryFee;

  function handleField(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'district' ? { thana: '' } : {}),
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())    errs.name    = 'Full name is required';
    if (!form.phone.trim())   errs.phone   = 'Phone is required';
    else if (!isBdPhone(form.phone)) errs.phone = 'Enter valid BD number (e.g. 01700000000)';
    if (!form.district)       errs.district = 'Select a district';
    if (!form.thana)          errs.thana    = 'Select an upazilla';
    if (!form.address.trim()) errs.address  = 'Address is required';
    if (showBilling) {
      if (!form.billingName.trim())    errs.billingName    = 'Billing name required';
      if (!form.billingDistrict)       errs.billingDistrict = 'Select billing district';
      if (!form.billingAddress.trim()) errs.billingAddress  = 'Billing address required';
    }
    if (!form.paymentType)   errs.paymentType   = 'Select a payment type';
    if (!form.paymentMethod) errs.paymentMethod = 'Select bKash or Nagad';
    if (!form.txnId.trim() && !form.txnPhone.trim()) {
      errs.txnId = 'Enter transaction ID or the number you sent from';
    }
    if (!agreed) errs.agreed = 'You must agree to the terms';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSubmitting(true);
    try {
      const orderPayload = {
        user_id:        user?.id ?? null,
        order_number:   'GB-' + Math.floor(100000 + Math.random() * 900000),
        name:           form.name.trim(),
        phone:          form.phone.trim(),
        district:       form.district,
        thana:          form.thana || null,
        address:        form.address.trim(),
        notes:          form.specialNote.trim() || null,
        items:          items.map(i => ({ slug: i.slug, name: i.name, price: i.price, qty: i.qty, image: i.image, brand: i.brand ?? null })),
        subtotal:       totalPrice,
        discount:       discount,
        delivery_fee:   deliveryFee,
        total:          orderTotal,
        payment_type:   form.paymentType,
        payment_method: form.paymentMethod,
        txn_id:         form.txnId.trim()    || null,
        txn_phone:      form.txnPhone.trim() || null,
        status:         'pending',
      };
      await insertOrder(orderPayload);
      setConfirmedOrder({
        orderNumber: orderPayload.order_number,
        items:       [...items],
        form:        { ...form },
        subtotal:    totalPrice,
        discount,
        deliveryFee,
        total:       orderTotal,
      });
      dispatch({ type: 'CLEAR' });
    } catch {
      setErrors({ general: 'Failed to place order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (confirmedOrder) {
    const { form: f, items: oi, subtotal, discount: disc, deliveryFee: df, total } = confirmedOrder;
    const location = [f.thana, f.district].filter(Boolean).join(', ');
    return (
      <Layout>
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Order Placed!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Order <span className="font-semibold text-brand-dark">#{confirmedOrder.orderNumber}</span>
          </p>
          <p className="mt-4 text-sm text-gray-600">
            Your order will be delivered to <strong>{location}</strong>.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {f.paymentType === 'cod' ? 'Cash on Delivery' : 'Full Payment'}
            {' · '}{METHOD_LABELS[f.paymentMethod] ?? f.paymentMethod}
            {f.txnId && <> &mdash; TXN: {f.txnId}</>}
          </p>

          {oi.length > 0 && (
            <ul className="mt-8 divide-y divide-gray-200 text-left rounded-xl border border-gray-200">
              {oi.map((item, i) => (
                <li key={i} className="flex items-center gap-4 p-4">
                  <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold text-brand-orange shrink-0">{fmt(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 rounded-xl border border-gray-200 text-left px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {disc > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span><span>-{fmt(disc)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery</span><span>{fmt(df)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold text-gray-900">
              <span>Total</span>
              <span className="text-brand-orange">{fmt(total)}</span>
            </div>
          </div>

          <Link
            to="/"
            className="mt-8 inline-flex items-center rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Continue Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  // ── Empty cart ───────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <p className="text-gray-500">Your cart is empty.</p>
          <Link to="/shop" className="mt-4 text-sm font-semibold text-brand-orange hover:underline">
            Shop now &rarr;
          </Link>
        </div>
      </Layout>
    );
  }

  const hasProfileLocation = !!(user?.address || user?.district || user?.upazilla);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-brand-dark mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">

            {/* ── Left column ─────────────────────────────────────────────── */}
            <div className="lg:col-span-7 space-y-8">

              {/* Cart items */}
              <section aria-labelledby="cart-heading">
                <h2 id="cart-heading" className="text-lg font-semibold text-gray-900 mb-4">
                  Items in your cart
                </h2>
                <ul role="list" className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 p-4">
                      <img
                        src={item.image} alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover border border-gray-100 shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                        {item.brand && <p className="text-xs text-gray-400 mt-0.5">{item.brand}</p>}
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => dispatch({ type: 'DECREASE', payload: item.id })}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
                          >
                            &minus;
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => dispatch({ type: 'INCREASE', payload: item.id })}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-brand-orange">{fmt(item.price * item.qty)}</p>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'REMOVE', payload: item.id })}
                          className="mt-1 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Shipping address */}
              <section aria-labelledby="shipping-heading">
                <h2 id="shipping-heading" className="text-lg font-semibold text-gray-900 mb-4">
                  Shipping Address
                </h2>
                {hasProfileLocation && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-4 py-2.5 text-xs text-green-700">
                    <MapPinIcon className="h-4 w-4 shrink-0" />
                    Auto-filled from your saved profile. Edit below to change.
                  </div>
                )}
                <div className="rounded-xl border border-gray-200 p-6 space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="form-label">Full Name *</label>
                      <input
                        id="name" name="name" type="text" value={form.name}
                        onChange={handleField}
                        className={`form-input ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                      />
                      <FieldError msg={errors.name} />
                    </div>
                    <div>
                      <label htmlFor="phone" className="form-label">Phone *</label>
                      <input
                        id="phone" name="phone" type="tel" value={form.phone}
                        onChange={handleField}
                        placeholder="Phone number"
                        className={`form-input ${errors.phone ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                      />
                      <FieldError msg={errors.phone} />
                    </div>
                  </div>

                  {/* District + Upazilla side by side */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="district" className="form-label">District *</label>
                      <select
                        id="district" name="district" value={form.district}
                        onChange={handleField}
                        className={`form-select ${errors.district ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                      >
                        <option value="">Select district</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <FieldError msg={errors.district} />
                    </div>
                    <div>
                      <label htmlFor="thana" className="form-label">Upazilla *</label>
                      <select
                        id="thana" name="thana" value={form.thana}
                        onChange={handleField}
                        disabled={!form.district}
                        className={`form-select disabled:opacity-50 disabled:cursor-not-allowed ${errors.thana ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                      >
                        <option value="">{form.district ? 'Select upazilla' : 'Select district first'}</option>
                        {(THANAS[form.district] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <FieldError msg={errors.thana} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="form-label">Full Address *</label>
                    <textarea
                      id="address" name="address" rows={3} value={form.address}
                      onChange={handleField}
                      placeholder="House no, road, area..."
                      className={`form-input ${errors.address ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                    />
                    <FieldError msg={errors.address} />
                  </div>
                </div>
              </section>

              {/* Billing address toggle */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowBilling(v => {
                    if (v) setForm(prev => ({ ...prev, billingName: '', billingDistrict: '', billingAddress: '' }));
                    return !v;
                  })}
                  className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>Use different billing address?</span>
                  <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${showBilling ? 'rotate-180' : ''}`} />
                </button>
                {showBilling && (
                  <div className="px-6 pb-6 space-y-5 border-t border-gray-200 pt-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="billingName" className="form-label">Billing Name</label>
                        <input
                          id="billingName" name="billingName" type="text" value={form.billingName}
                          onChange={handleField}
                          className={`form-input ${errors.billingName ? 'border-red-400' : ''}`}
                        />
                        <FieldError msg={errors.billingName} />
                      </div>
                      <div>
                        <label htmlFor="billingDistrict" className="form-label">Billing District</label>
                        <select
                          id="billingDistrict" name="billingDistrict" value={form.billingDistrict}
                          onChange={handleField}
                          className={`form-select ${errors.billingDistrict ? 'border-red-400' : ''}`}
                        >
                          <option value="">Select district</option>
                          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <FieldError msg={errors.billingDistrict} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="billingAddress" className="form-label">Billing Address</label>
                      <textarea
                        id="billingAddress" name="billingAddress" rows={3} value={form.billingAddress}
                        onChange={handleField}
                        className={`form-input ${errors.billingAddress ? 'border-red-400' : ''}`}
                      />
                      <FieldError msg={errors.billingAddress} />
                    </div>
                  </div>
                )}
              </div>

              {/* Order notes */}
              <div className="rounded-xl border border-gray-200 p-6">
                <label htmlFor="specialNote" className="form-label">Order Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea
                  id="specialNote" name="specialNote" rows={4} value={form.specialNote}
                  onChange={handleField}
                  placeholder="Any special instructions for your order..."
                  className="form-input mt-1"
                />
              </div>
            </div>

            {/* ── Right column ────────────────────────────────────────────── */}
            <div className="mt-10 lg:col-span-5 lg:mt-0">
              <div className="sticky top-24 space-y-5">

                {/* Payment */}
                <div className="rounded-xl border border-gray-200 p-5 space-y-4">
                  <h2 className="text-base font-semibold text-gray-900">Payment</h2>

                  {/* Payment type */}
                  <div className="space-y-2">
                    {[
                      { value: 'cod',  label: 'Cash on Delivery', desc: 'Pay for items when they arrive. Send only the delivery charge now to confirm.' },
                      { value: 'full', label: 'Full Payment',      desc: 'Pay everything now — items + delivery.' },
                    ].map(({ value, label, desc }) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors ${
                          form.paymentType === value ? 'border-brand-orange bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio" name="paymentType" value={value}
                          checked={form.paymentType === value}
                          onChange={handleField}
                          className="sr-only"
                        />
                        <RadioDot selected={form.paymentType === value} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <FieldError msg={errors.paymentType} />

                  {/* Method + merchant + txn — shown after type selected */}
                  {form.paymentType && (
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <p className="text-xs font-medium text-gray-500">
                        {form.paymentType === 'cod' ? 'Send delivery charge via:' : 'Send full payment via:'}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        {['bkash', 'nagad'].map(method => (
                          <label
                            key={method}
                            className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 p-3 transition-colors ${
                              form.paymentMethod === method ? 'border-brand-orange bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio" name="paymentMethod" value={method}
                              checked={form.paymentMethod === method}
                              onChange={handleField}
                              className="sr-only"
                            />
                            <RadioDot selected={form.paymentMethod === method} />
                            <span className="text-sm font-semibold text-gray-900">{METHOD_LABELS[method]}</span>
                          </label>
                        ))}
                      </div>
                      <FieldError msg={errors.paymentMethod} />

                      {form.paymentMethod && (
                        <>
                          <div className="rounded-lg bg-orange-50 border border-orange-100 px-4 py-3 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Send to {METHOD_LABELS[form.paymentMethod]}</p>
                              <p className="text-base font-bold text-brand-dark tracking-wider">{merchants[form.paymentMethod]}</p>
                            </div>
                            {amountToSend != null ? (
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Amount</p>
                                <p className="text-lg font-bold text-brand-orange">{fmt(amountToSend)}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Select district first</p>
                            )}
                          </div>

                          <TxnField
                            txnId={form.txnId}
                            txnPhone={form.txnPhone}
                            error={errors.txnId}
                            onChange={handleField}
                            onClearError={() => setErrors(prev => ({ ...prev, txnId: '' }))}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Order summary */}
                <div className="rounded-xl border border-gray-200 p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>
                  <dl className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <dt>Subtotal ({totalQty} item{totalQty !== 1 ? 's' : ''})</dt>
                      <dd>{fmt(totalPrice)}</dd>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <dt>
                        {form.district
                          ? form.district === 'Dhaka' ? 'Delivery (Inside Dhaka)' : 'Delivery (Outside Dhaka)'
                          : 'Delivery'}
                      </dt>
                      <dd>
                        {deliveryFee != null
                          ? <span className="font-medium text-gray-900">{fmt(deliveryFee)}</span>
                          : <span className="text-gray-400 italic text-xs">Select district</span>
                        }
                      </dd>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm font-medium text-green-600">
                        <dt>Discount Price</dt>
                        <dd>-{fmt(discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                      <dt>Total</dt>
                      <dd className="text-brand-orange">
                        {deliveryFee != null ? fmt(orderTotal) : fmt(discountedTotal)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Terms + submit */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => {
                        setAgreed(e.target.checked);
                        if (errors.agreed) setErrors(prev => ({ ...prev, agreed: '' }));
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-xs text-gray-500">
                      I agree to the{' '}
                      <a href="#" className="text-brand-orange hover:underline">Terms & Conditions</a>
                      {' '}and{' '}
                      <a href="#" className="text-brand-orange hover:underline">Privacy Policy</a>.
                    </span>
                  </label>
                  <FieldError msg={errors.agreed} />

                  {errors.general && (
                    <p className="text-sm text-red-600 text-center">{errors.general}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center rounded-full bg-brand-orange py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Placing Order...
                      </>
                    ) : 'Place Order'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
