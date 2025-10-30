import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiUsers, FiDatabase, FiLogOut, FiHome, FiCheckSquare, FiFileText, FiBarChart2, FiMenu } from 'react-icons/fi'; // Feather icons from react-icons
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Sidebar({ bgColor, isOpen = true, onToggle }) {
  const location = useLocation();
  let dashboardTitle;
  const armyUnitId = localStorage.getItem('army_unit_id');
  const isArmyDashboard = !!armyUnitId && armyUnitId !== "null";
  if (!isArmyDashboard) {
    dashboardTitle = "Defence Dashboard";
  } else {
    dashboardTitle = "Army Dashboard";
  }
  const isAdmin = localStorage.getItem('role') === 'admin';
  
  const linkClasses = (path) => {
    const isActive = location.pathname === path;
    const active = bgColor ? 'bg-white/20 text-white' : 'bg-gray-700 text-white';
    const inactive = bgColor
      ? 'text-gray-200 hover:bg-white/10 hover:text-white'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white';
    return `flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${isActive ? active : inactive}`;
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    toast.success('Logged out successfully!', { position: 'top-center', autoClose: 1500 });
    // Force a full page reload to reset app state
    setTimeout(() => {
      window.location.href = '/login';
    }, 1200);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}
      
      <div
        className={`w-60 ${bgColor ? '' : 'bg-gray-900'} text-white p-4 shadow-lg fixed top-16 sm:top-20 left-0 bottom-0 overflow-y-auto transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <ToastContainer />
        {/* Hamburger toggle */}
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggle}
          className="absolute top-2 right-2 p-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
        >
          <FiMenu />
        </button>
        <div className="mb-6 sm:mb-8 flex flex-col items-center justify-center">
          {/* <FiHome className="text-4xl mb-2" /> */}
          <span
            className="text-2xl sm:text-3xl font-extrabold text-center text-white drop-shadow-lg tracking-wide"
            style={{ letterSpacing: '1px', lineHeight: 1.1 }}
          >
            {dashboardTitle.split(' ')[0]}
          </span>
          <span
            className="text-lg sm:text-xl font-bold text-center text-white/90 tracking-wide mt-0.5"
            style={{ letterSpacing: '0.5px' }}
          >
            {dashboardTitle.split(' ')[1]}
          </span>
        </div>
        <nav className="space-y-2">
          {isAdmin ? (
            <Link to="/admin/users" className={linkClasses('/admin/users')} onClick={() => window.innerWidth < 768 && onToggle()}>
              <FiUsers />
              <span>Users List</span>
            </Link>
          ) : (
            <>
              <Link to="/analytics" className={linkClasses('/analytics')} onClick={() => window.innerWidth < 768 && onToggle()}>
                <FiBarChart2 />
                <span>Analytics</span>
              </Link>
              <Link to="/dashboard" className={linkClasses('/dashboard')} onClick={() => window.innerWidth < 768 && onToggle()}>
                <FiUsers />
                <span>{isArmyDashboard ? 'Labourers Details' : 'Assign Labourers'}</span>
              </Link>
              {isArmyDashboard ? (
                <Link to="/attendance" className={linkClasses('/attendance')} onClick={() => window.innerWidth < 768 && onToggle()}>
                  <FiCheckSquare />
                  <span>Mark Attendance</span>
                </Link>
              ) : (
                <Link to="/unitData" className={linkClasses('/unitData')} onClick={() => window.innerWidth < 768 && onToggle()}>
                  <FiDatabase />
                  <span>Army Unit Data</span>
                </Link>
              )}
              {isArmyDashboard && (
                <Link to="/attendanceDetails" className={linkClasses('/attendanceDetails')} onClick={() => window.innerWidth < 768 && onToggle()}>
                  <FiFileText />
                  <span>Attendance Details</span>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </>
  );
}

export default Sidebar;
