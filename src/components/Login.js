import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Login() {
  const [mobile, setMobile] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { mobile_number: mobile });
      localStorage.setItem('officer_id', res.data.officer_id);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('army_unit_id', res.data.user.army_unit_id);
      localStorage.setItem('mobile_number', res.data.user.mobile_number);
      toast.success('Login successful!', { position: 'top-center', autoClose: 2000 });
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      toast.error('Login failed!', { position: 'top-center', autoClose: 2000 });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-blue-200 to-blue-400">
      <ToastContainer />
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xs animate-fade-in">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-blue-700 tracking-wide">Login</h2>
        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full p-3 mb-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition text-base"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:from-green-700 hover:to-green-500 transition"
        >
          Login
        </button>
      </div>
       <footer className="w-full fixed bottom-0 left-0 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700 text-white text-center py-3 text-base z-50 shadow-lg border-t border-blue-300" style={{letterSpacing: '0.5px'}}>
        <div className="flex flex-col items-center justify-center">
         
          <span className="text-xs mt-1">Copyright © 2025 All Rights Reserved - <span className="font-black text-white drop-shadow-lg tracking-widest uppercase text-base sm:text-md">Jammu & Kashmir e-Governance Agency</span></span>
        </div>
      </footer>
    </div>
  );
}

export default Login;