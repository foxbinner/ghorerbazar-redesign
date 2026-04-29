import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useUserAuth } from '../context/UserAuthContext';
import FieldError from '../components/ui/FieldError';
import Spinner from '../components/ui/Spinner';
import { isBdPhone } from '../utils/validation';

export default function RegisterPage() {
  const { user, register } = useUserAuth();
  useEffect(() => { document.title = 'Create Account | Ghorer Bazar'; }, []);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');

  if (user) return <Navigate to="/" replace />;

  function handleField(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!isBdPhone(form.phone)) errs.phone = 'Enter a valid BD number (e.g. 01700000000)';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    const result = await register(form.name, form.phone, form.email, form.password);
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ [result.field]: result.message });
      return;
    }
    setVerifyEmail(form.email.trim());
  }

  if (verifyEmail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light">
            <EnvelopeIcon className="h-8 w-8 text-brand-orange" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-3 text-sm text-gray-500">
            We sent a verification link to{' '}
            <span className="font-medium text-gray-900">{verifyEmail}</span>.
            Click the link in the email to activate your account.
          </p>
          <p className="mt-2 text-xs text-gray-400">Don't forget to check your spam folder.</p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-full bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-500"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/">
            <img src="/logoname.svg" alt="GhorerBazar" className="mx-auto h-10 w-auto" />
          </Link>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-10 shadow sm:rounded-2xl sm:px-12">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              <div>
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  id="name" name="name" type="text" value={form.name}
                  onChange={handleField} autoComplete="name"
                  className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                />
                <FieldError msg={errors.name} />
              </div>

              <div>
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <input
                  id="phone" name="phone" type="tel" value={form.phone}
                  onChange={handleField} placeholder="Phone number"
                  className={`form-input ${errors.phone ? 'border-red-400' : ''}`}
                />
                <FieldError msg={errors.phone} />
              </div>

              <div>
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  id="email" name="email" type="email" value={form.email}
                  onChange={handleField} placeholder="you@example.com"
                  autoComplete="email"
                  className={`form-input ${errors.email ? 'border-red-400' : ''}`}
                />
                <FieldError msg={errors.email} />
              </div>

              <div>
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password" name="password" type="password" value={form.password}
                  onChange={handleField} autoComplete="new-password"
                  className={`form-input ${errors.password ? 'border-red-400' : ''}`}
                />
                <FieldError msg={errors.password} />
              </div>

              <div>
                <label htmlFor="confirm" className="form-label">Confirm Password</label>
                <input
                  id="confirm" name="confirm" type="password" value={form.confirm}
                  onChange={handleField} autoComplete="new-password"
                  className={`form-input ${errors.confirm ? 'border-red-400' : ''}`}
                />
                <FieldError msg={errors.confirm} />
              </div>

              {errors.general && (
                <p className="text-sm text-red-600 text-center">{errors.general}</p>
              )}

              <button
                type="submit" disabled={submitting}
                className="flex w-full justify-center items-center gap-2 rounded-full bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
              >
                {submitting && <Spinner size="sm" />}
                Create Account
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-orange hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
