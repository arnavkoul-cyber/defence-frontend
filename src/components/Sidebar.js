import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiUsers, FiDatabase, FiLogOut, FiHome } from 'react-icons/fi'; // Feather icons from react-icons
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Sidebar() {
  const location = useLocation();

  const linkClasses = (path) =>
    `flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
      location.pathname === path
        ? 'bg-gray-700 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully!', { position: 'top-center', autoClose: 2000 });
    setTimeout(() => navigate('/login'), 1200);
  };

  return (
    <div className="w-60 bg-gray-900 text-white h-screen p-4 shadow-lg">
      <ToastContainer />
      <h3 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
        <FiHome className="inline-block mb-1 text-3xl" />
        <span>Dashboard</span>
      </h3>
      <nav className="space-y-2">
        <Link to="/dashboard" className={linkClasses('/dashboard')}>
          <FiUsers />
          <span>Users</span>
        </Link>
        <Link to="/unitData" className={linkClasses('/unitData')}>
          <FiDatabase />
          <span>Army Unit Data</span>
        </Link>
        <button
          onClick={handleLogout}
          className={linkClasses('/login') + ' w-full text-left flex items-center'}
          style={{ background: 'none', border: 'none', outline: 'none', cursor: 'pointer' }}
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;
