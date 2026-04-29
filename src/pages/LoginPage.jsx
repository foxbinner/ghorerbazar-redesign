import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserAuth } from '../context/UserAuthContext';
import { cn } from '../utils/cn';
import FieldError from '../components/ui/FieldError';
import Spinner from '../components/ui/Spinner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/profile';
  const { user, login, sendOtp, verifyOtp } = useUserAuth();

  useEffect(() => { document.title = 'Sign In | Ghorer Bazar'; }, []);

  // Password tab
  const [pwForm, setPwForm] = useState({ phoneOrEmail: '', password: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  // Tab control
  const [activeTab, setActiveTab] = useState(0);

  // OTP tab
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpErrors, setOtpErrors] = useState({});
  const [otpLoading, setOtpLoading] = useState(false);

  if (user) return <Navigate to={redirectTo} replace />;

  async function handlePasswordLogin(e) {
    e.preventDefault();
    const errs = {};
    if (!pwForm.phoneOrEmail.trim()) errs.phoneOrEmail = 'Phone or email is required';
    if (!pwForm.password.trim()) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwLoading(true);
    const result = await login(pwForm.phoneOrEmail, pwForm.password);
    setPwLoading(false);

    if (!result.ok) {
      setPwErrors({ [result.field]: result.message });
      return;
    }
    toast.success('Logged in successfully');
    navigate(redirectTo, { replace: true });
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!otpIdentifier.trim()) { setOtpErrors({ identifier: 'Phone or email is required' }); return; }

    setOtpLoading(true);
    const result = await sendOtp(otpIdentifier);
    setOtpLoading(false);

    if (!result.ok) { setOtpErrors({ identifier: result.message }); return; }
    setOtpEmail(result.email);
    setOtpSent(true);
    toast('OTP sent to your email');
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otpCode.trim()) { setOtpErrors({ code: 'Enter the OTP code' }); return; }

    setOtpLoading(true);
    const result = await verifyOtp(otpIdentifier, otpCode.trim());
    setOtpLoading(false);

    if (!result.ok) { setOtpErrors({ code: result.message }); return; }
    toast.success('Logged in successfully');
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/">
            <img src="/logoname.svg" alt="GhorerBazar" className="mx-auto h-10 w-auto" />
          </Link>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-10 shadow sm:rounded-2xl sm:px-12">
            <div>
              <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-8">
                {['Password', 'OTP'].map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-sm font-medium transition-colors focus:outline-none',
                      activeTab === i ? 'bg-white text-brand-dark shadow' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div>
                {/* Password */}
                {activeTab === 0 && <div>
                  <form onSubmit={handlePasswordLogin} noValidate className="space-y-5">
                    <div>
                      <label htmlFor="phoneOrEmail" className="form-label">Phone or Email</label>
                      <input
                        id="phoneOrEmail" name="phoneOrEmail" type="text"
                        value={pwForm.phoneOrEmail}
                        onChange={e => { setPwForm(f => ({ ...f, phoneOrEmail: e.target.value })); setPwErrors({}); }}
                        placeholder="Phone number or email"
                        className={`form-input ${pwErrors.phoneOrEmail ? 'border-red-400' : ''}`}
                      />
                      <FieldError msg={pwErrors.phoneOrEmail} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="pw-password" className="form-label">Password</label>
                        <button type="button" onClick={() => setActiveTab(1)}
                          className="text-xs text-brand-orange hover:underline">
                          Forgot password?
                        </button>
                      </div>
                      <input
                        id="pw-password" name="password" type="password"
                        value={pwForm.password}
                        onChange={e => { setPwForm(f => ({ ...f, password: e.target.value })); setPwErrors({}); }}
                        autoComplete="current-password"
                        className={`form-input ${pwErrors.password ? 'border-red-400' : ''}`}
                      />
                      <FieldError msg={pwErrors.password} />
                    </div>
                    <button type="submit" disabled={pwLoading}
                      className="flex w-full justify-center items-center gap-2 rounded-full bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60">
                      {pwLoading && <Spinner size="sm" />} Sign In
                    </button>
                  </form>
                </div>}

                {/* OTP */}
                {activeTab === 1 && <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} noValidate className="space-y-5">
                      <div>
                        <label htmlFor="otp-identifier" className="form-label">Phone or Email</label>
                        <input
                          id="otp-identifier" type="text"
                          value={otpIdentifier}
                          onChange={e => { setOtpIdentifier(e.target.value); setOtpErrors({}); }}
                          placeholder="Phone number or email"
                          className={`form-input ${otpErrors.identifier ? 'border-red-400' : ''}`}
                        />
                        <FieldError msg={otpErrors.identifier} />
                      </div>
                      <button type="submit" disabled={otpLoading}
                        className="flex w-full justify-center items-center gap-2 rounded-full bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60">
                        {otpLoading && <Spinner size="sm" />} Send OTP
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
                      <p className="text-sm text-gray-500">
                        OTP sent to <span className="font-medium text-gray-900">{otpEmail}</span>
                      </p>
                      <div>
                        <label htmlFor="otp-code" className="form-label">Enter OTP</label>
                        <input
                          id="otp-code" type="text" inputMode="numeric" maxLength={6}
                          value={otpCode}
                          onChange={e => { setOtpCode(e.target.value); setOtpErrors({}); }}
                          placeholder="6-digit code"
                          className={`form-input tracking-widest text-center text-lg ${otpErrors.code ? 'border-red-400' : ''}`}
                        />
                        <FieldError msg={otpErrors.code} />
                      </div>
                      <button type="submit" disabled={otpLoading}
                        className="flex w-full justify-center items-center gap-2 rounded-full bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60">
                        {otpLoading && <Spinner size="sm" />} Verify & Sign In
                      </button>
                      <button type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(''); setOtpErrors({}); }}
                        className="w-full text-xs text-gray-500 hover:text-brand-orange">
                        Back / Resend OTP
                      </button>
                    </form>
                  )}
                </div>}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-orange hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
