import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiUsers, FiDatabase, FiLogOut, FiHome, FiCheckSquare } from 'react-icons/fi'; // Feather icons from react-icons
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Sidebar() {
  const location = useLocation();
  let dashboardTitle;
  const armyUnitId = localStorage.getItem('army_unit_id');
  const isArmyDashboard = !!armyUnitId && armyUnitId !== "null";
  if (!isArmyDashboard) {
    dashboardTitle = "Defence Dashboard";
  } else {
    dashboardTitle = "Army Dashboard";
  }
  

  const linkClasses = (path) =>
    `flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
      location.pathname === path
        ? 'bg-gray-700 text-white'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`;

  const navigate = useNavigate();

  const handleLogout = () => {
    // Only remove authentication-related keys, not attendance_marked
    localStorage.removeItem('mobile_number');
    localStorage.removeItem('army_unit_id');
    localStorage.removeItem('auth_token');
    // Add/remove other keys as needed, but keep attendance_marked
    toast.success('Logged out successfully!', { position: 'top-center', autoClose: 2000 });
    setTimeout(() => navigate('/login'), 1200);
  };

  return (
    <div className="w-60 bg-gray-900 text-white h-screen p-4 shadow-lg">
      <ToastContainer />
      <div className="mb-8 flex flex-col items-center justify-center">
        <FiHome className="text-4xl mb-2" />
        <span
          className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 bg-clip-text text-transparent drop-shadow-lg tracking-wide"
          style={{ letterSpacing: '1px', lineHeight: 1.1 }}
        >
          {dashboardTitle.split(' ')[0]}
        </span>
        <span
          className="text-xl font-bold text-center text-gray-200 tracking-wide mt-0.5"
          style={{ letterSpacing: '0.5px' }}
        >
          {dashboardTitle.split(' ')[1]}
        </span>
      </div>
      <nav className="space-y-2">
        <Link to="/dashboard" className={linkClasses('/dashboard')}>
          <FiUsers />
          <span>{isArmyDashboard ? 'Labourers Details' : 'Users'}</span>
        </Link>
        {isArmyDashboard ? (
          <Link to="/attendance" className={linkClasses('/attendance')}>
            <FiCheckSquare />
            <span>Attendance</span>
          </Link>
        ) : (
          <Link to="/unitData" className={linkClasses('/unitData')}>
            <FiDatabase />
            <span>Army Unit Data</span>
          </Link>
        )}
        {isArmyDashboard && (
          <Link to="/attendanceDetails" className={linkClasses('/attendanceDetails')}>
            <FiCheckSquare />
            <span>Attendance Details</span>
          </Link>
        )}
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
