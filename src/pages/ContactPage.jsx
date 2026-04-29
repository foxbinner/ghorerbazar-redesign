import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { PhoneIcon, EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';

const EMPTY_FORM = { name: '', email: '', phone: '', message: '' };

export default function ContactPage() {
  useEffect(() => { document.title = 'Contact Us | Ghorer Bazar'; }, []);
  const { phone, email, address, whatsapp } = useSettings();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email';
    if (!form.message.trim()) errs.message = 'Message is required';
    return errs;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim(),
    });
    setSubmitting(false);

    if (error) {
      setErrors({ general: 'Failed to send message. Please try again or email us directly.' });
      return;
    }
    setSubmitted(true);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-brand-dark py-16 px-4 text-center">
        <div className="mx-auto max-w-xl">
          <p className="text-brand-orange text-sm font-semibold tracking-widest uppercase mb-3">Get in touch</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Contact Us</h1>
          <p className="mt-3 text-gray-400 text-sm">We're here to help. Reach out anytime.</p>
        </div>
      </section>

      <section className="bg-white py-14 px-4">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Contact info */}
          <div>
            <h2 className="text-xl font-bold text-brand-dark mb-6">Reach us directly</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light">
                  <PhoneIcon className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Phone</p>
                  <a href={`tel:${phone}`} className="text-sm font-medium text-brand-dark hover:text-brand-orange transition-colors">
                    {phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light">
                  <EnvelopeIcon className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</p>
                  <a href={`mailto:${email}`} className="text-sm font-medium text-brand-dark hover:text-brand-orange transition-colors">
                    {email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light">
                  <MapPinIcon className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Address</p>
                  <p className="text-sm font-medium text-brand-dark">{address}</p>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Form */}
          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-2">Message sent!</h3>
                <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); setErrors({}); }}
                  className="mt-6 text-sm text-brand-orange hover:underline font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <h2 className="text-xl font-bold text-brand-dark mb-6">Send a message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Your name"
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="Phone number"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    placeholder="How can we help you?"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange resize-none ${errors.message ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                </div>
                {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-orange-500 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
