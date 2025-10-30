import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import 'react-toastify/dist/ReactToastify.css';
import Header from './Header';
import Footer from './footer';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [userType, setUserType] = useState('');
  const [touched, setTouched] = useState(false);

  const SITE_KEY = '6LfN-j0rAAAAAGM6Ol0qBZdu_gkXppd5g5sHTX3s';

  // Redirect if already logged in
  React.useEffect(() => {
    const isLoggedIn = !!(
      localStorage.getItem('auth_token') ||
      localStorage.getItem('userId') ||
      localStorage.getItem('mobile_number')
    );
    
    if (isLoggedIn) {
      const role = localStorage.getItem('role') || localStorage.getItem('userType');
      if (role === 'admin') {
        navigate('/admin/users', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleCaptcha = (value) => setCaptchaVerified(!!value);
  const isMobileValid = (num) => /^[6-9]\d{9}$/.test(num);

  const mobileHasError = touched && !isMobileValid(mobile);

  const handleLogin = async () => {
    if (!isMobileValid(mobile)) {
      setTouched(true);
      toast.error('Please enter a valid 10-digit mobile number.', { position: 'top-center', autoClose: 2000 });
      return;
    }
    if (!captchaVerified) {
      toast.error('Please verify the captcha!', { position: 'top-center', autoClose: 2000 });
      return;
    }

    try {
      setLoading(true);
      
      // Clear all previous localStorage data before new login
      localStorage.clear();
      
      const res = await api.post('/auth/login', { mobile_number: mobile });

      // Admin route
      if ((userType === 'Admin' || res?.data?.user?.role === 'admin')) {
        localStorage.setItem('role', 'admin');
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('auth_token', res.data.token);
        toast.success('Login successful!', { position: 'top-center', autoClose: 1200 });
        setTimeout(() => { window.location.href = '/admin/users'; }, 1000);
        return;
      }

      // Officer route
      localStorage.setItem('role', 'officer');
      localStorage.setItem('userType', 'officer');
      localStorage.setItem('officer_id', res.data.officer_id);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('army_unit_id', res.data.user.army_unit_id);
      localStorage.setItem('mobile_number', res.data.user.mobile_number);
      toast.success('Login successful!', { position: 'top-center', autoClose: 1200 });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed! Please try again.', { position: 'top-center', autoClose: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const onEnter = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-white via-blue-50 to-blue-100">
      {/* Decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(60rem 30rem at 120% -10%, rgba(30,64,175,0.45), transparent), radial-gradient(45rem 25rem at -20% 110%, rgba(59,130,246,0.35), transparent)`
        }}
      />

      <div className="relative flex min-h-screen flex-col">
        <Header bgColor="rgb(11,80,162)" />
        <ToastContainer />

        <main className="flex flex-1 items-center justify-center p-3 sm:p-4 md:p-8">
          <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-2xl sm:rounded-3xl bg-white shadow-2xl ring-1 ring-gray-200 overflow-hidden">
            {/* Left panel */}
            <div className="relative hidden md:flex flex-col items-start justify-center gap-6 p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 border-r-2 border-blue-100">
              {/* Watermark emblem background */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.25]"
                   style={{
                     backgroundImage: `url(${require('../assets/white_emb.jpeg')})`,
                     backgroundRepeat: 'no-repeat',
                     backgroundPosition: 'center 35%',
                     backgroundSize: '70%'
                   }}>
              </div>
              
              <div className="relative z-10 pl-4">
                <h1 className="text-xl lg:text-2xl font-extrabold tracking-wide leading-tight text-blue-900">
                  DEFENCE LABOUR LOGIN PORTAL
                </h1>
                <p className="text-sm lg:text-base text-gray-700 font-semibold mt-4">Government of Jammu Kashmir and Ladakh</p>
                <div className="mt-3 w-16 h-1 bg-blue-600 rounded-full"></div>
              </div>
            </div>

            {/* Right panel (form) */}
            <div className="p-6 sm:p-8 md:p-10 flex flex-col bg-white">
              <header className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight">Officer Login</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter your credentials to access the portal</p>
              </header>

              {/* Form */}
              <div className="grid gap-4 sm:gap-5">
                {/* User Type */}
                <div>
                  <label htmlFor="userType" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">User Type</label>
                  <div className="relative">
                    <select
                      id="userType"
                      className="w-full appearance-none rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white p-2.5 sm:p-3.5 pr-10 text-sm sm:text-base text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                    >
                      <option value="" disabled>Choose user type</option>
                      <option>Director of Defence Labour</option>
                      <option>Army Officer</option>
                      <option>Admin</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label htmlFor="mobile" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <div className={`flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-3.5 shadow-sm bg-white ${mobileHasError ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500'}`}>
                    <svg aria-hidden className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="7" y="2" width="10" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12" y2="18"></line>
                    </svg>
                    <input
                      id="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Enter mobile number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      onBlur={() => setTouched(true)}
                      onKeyDown={onEnter}
                      className="w-full outline-none text-sm sm:text-base placeholder-gray-400"
                      aria-invalid={mobileHasError}
                      aria-describedby="mobile-help"
                    />
                  </div>
                  <div id="mobile-help" className="mt-1 flex items-center justify-between">
                    <p className={`text-[10px] sm:text-xs ${mobileHasError ? 'text-red-600' : 'text-gray-500'}`}>
                      {mobileHasError ? 'Invalid number. Use 10-digit mobile.' : 'We will send an OTP to this number.'}
                    </p>
                    <span className={`text-[10px] sm:text-xs ${isMobileValid(mobile) ? 'text-green-600' : 'text-gray-400'}`}>
                      {isMobileValid(mobile) ? '✓ Looks good' : ''}
                    </span>
                  </div>
                </div>

                {/* Captcha */}
                <div className="flex justify-center scale-90 sm:scale-100 origin-center">
                  <ReCAPTCHA sitekey={SITE_KEY} onChange={handleCaptcha} />
                </div>

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={!isMobileValid(mobile) || !captchaVerified || loading}
                  className={`group relative inline-flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl px-4 sm:px-6 py-2.5 sm:py-3.5 text-base sm:text-lg font-bold transition-all shadow-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-800 active:scale-[0.99]'} `}
                >
                  {loading ? (
                    <span className="flex items-center text-sm sm:text-base">
                      <svg className="-ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    <>
                      <span>Login</span>
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] sm:text-xs text-gray-500">Secure Login • Government Portal</p>
              </div>
            </div>
          </section>
        </main>

        <Footer bgColor="rgb(11,80,162)" />
      </div>
    </div>
  );
}
