import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import 'react-toastify/dist/ReactToastify.css';
import Header from './Header';
import Footer from './footer';

function Login() {
  const [mobile, setMobile] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // UI-only user type and dropdown state
  const [userType, setUserType] = useState('');
  const [isUserTypeOpen, setIsUserTypeOpen] = useState(false);

  const SITE_KEY = "6LfN-j0rAAAAAGM6Ol0qBZdu_gkXppd5g5sHTX3s"; 

  const handleCaptcha = (value) => {
    setCaptchaVerified(!!value);
  };

  const isMobileValid = (num) => /^[6-9]\d{9}$/.test(num); // ✅ Simple Indian mobile number validation

  const handleLogin = async () => {
    if (!isMobileValid(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number.', {
        position: 'top-center',
        autoClose: 2000,
      });
      return;
    }

    if (!captchaVerified) {
      toast.error('Please verify the captcha!', {
        position: 'top-center',
        autoClose: 2000,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { mobile_number: mobile });

      localStorage.setItem('officer_id', res.data.officer_id);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('army_unit_id', res.data.user.army_unit_id);
      localStorage.setItem('mobile_number', res.data.user.mobile_number);

      toast.success('Login successful!', {
        position: 'top-center',
        autoClose: 1500,
      });

      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || 'Login failed! Please try again.',
        { position: 'top-center', autoClose: 2000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-200 to-blue-400 flex flex-col">
      <Header />
      <ToastContainer />
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm transition-all duration-500 ease-in-out">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800 tracking-wide">
            Officer Login
          </h2>
          {/* Custom User Type dropdown */}
          <div className="mb-4">
            {/* <label className="block text-sm font-semibold text-gray-700 mb-2">User Type</label> */}
            <div className="relative">
              <button
                type="button"
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={() => setIsUserTypeOpen((o) => !o)}
                onBlur={() => setTimeout(() => setIsUserTypeOpen(false), 150)}
              >
                <span className={`${userType ? 'text-gray-900' : 'text-gray-400'}`}>
                  {userType || 'Select user type'}
                </span>
                <svg className="w-4 h-4 text-gray-500 ml-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>
              {isUserTypeOpen && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {['Director of Defence Labour', 'Army Officer'].map((opt) => (
                    <li
                      key={opt}
                      onMouseDown={() => { setUserType(opt); setIsUserTypeOpen(false); }}
                      className="px-3 py-2 text-gray-800 hover:bg-blue-50 cursor-pointer"
                      role="option"
                      aria-selected={userType === opt}
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Mobile input with user type in placeholder */}
          <input
            type="tel"
            aria-label="Mobile Number"
            placeholder={`Enter registered Mobile Number`}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition text-base shadow-sm"
          />

          <div className="flex justify-center mb-4">
            <ReCAPTCHA sitekey={SITE_KEY} onChange={handleCaptcha} />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={!isMobileValid(mobile) || !captchaVerified || loading}
            className={`w-full px-6 py-3 rounded-xl font-semibold shadow-md transition-all duration-300 ease-in-out ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-400 text-white hover:from-green-700 hover:to-green-500'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
