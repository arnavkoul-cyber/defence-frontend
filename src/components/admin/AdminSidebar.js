import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiUsers, FiMenu } from 'react-icons/fi';

function AdminSidebar({ bgColor, isOpen = true, onToggle }) {
  const location = useLocation();
  const linkClasses = (path) => {
    const isActive = location.pathname === path;
    const active = bgColor ? 'bg-white/20 text-white' : 'bg-gray-700 text-white';
    const inactive = bgColor
      ? 'text-gray-200 hover:bg-white/10 hover:text-white'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white';
    return `flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${isActive ? active : inactive}`;
  };

  return (
    <div
      className={`w-60 bg-[#0b50a2] text-white p-4 shadow-lg fixed top-20 left-0 bottom-0 overflow-y-auto transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Hamburger toggle */}
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={onToggle}
        className="absolute top-2 right-2 p-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
      >
        <FiMenu />
      </button>
      <div className="mb-8 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-center text-white drop-shadow-lg tracking-wide" style={{ letterSpacing: '1px', lineHeight: 1.1 }}>
          Admin
        </span>
        <span className="text-xl font-bold text-center text-white/90 tracking-wide mt-0.5" style={{ letterSpacing: '0.5px' }}>
          Panel
        </span>
      </div>
      <nav className="space-y-2">
        <Link to="/admin/users" className={linkClasses('/admin/users')}>
          <FiUsers />
          <span>Users List</span>
        </Link>
      </nav>
      <nav className="space-y-2">
        <Link to="/admin/sectors" className={linkClasses('/admin/sectors')}>
          <FiUsers />

          <span>Sectors List</span>
        </Link>
      </nav>
    </div>
  );
}

export default AdminSidebar;
