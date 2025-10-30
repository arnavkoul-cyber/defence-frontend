import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LabourForm from './components/LabourForm';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UnitData from './components/unitData';
import Attendance from './components/attendance';
import AttendanceDetails from './components/attendanceDetails';
import Analytics from './components/Analytics';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UsersList from './components/admin/UsersList';
import SectorList from './components/admin/SectorList';
import ArmyUnitsList from './components/admin/ArmyUnitsList';
import LaboursList from './components/admin/LaboursList';

// Check if user is authenticated
const isAuthenticated = () => {
  return !!(
    localStorage.getItem('auth_token') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('mobile_number')
  );
};

// Check if user is admin
const isAdminUser = () => {
  return localStorage.getItem('role') === 'admin' || localStorage.getItem('userType') === 'admin';
};

// Wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin-only route wrapper
const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdminUser()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Officer-only route wrapper
const OfficerRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (isAdminUser()) {
    return <Navigate to="/admin/users" replace />;
  }
  return children;
};

function App() {
  const [isAdmin, setIsAdmin] = useState(isAdminUser());

  // Listen for storage changes (login/logout events)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAdmin(isAdminUser());
    };

    // Check on mount and when localStorage changes
    setIsAdmin(isAdminUser());
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <ToastContainer position="top-center" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/labourForm" element={<LabourForm />} />
        
        {/* Admin Routes */}
        <Route path="/admin/users" element={<AdminRoute><UsersList /></AdminRoute>} />
        <Route path="/admin/labours" element={<AdminRoute><LaboursList /></AdminRoute>} />
        <Route path="/admin/sectors" element={<AdminRoute><SectorList /></AdminRoute>} />
        <Route path="/admin/army-units" element={<AdminRoute><ArmyUnitsList /></AdminRoute>} />
        
        {/* Officer Routes */}
        <Route path="/dashboard" element={<OfficerRoute><Dashboard /></OfficerRoute>} />
        <Route path="/unitData" element={<OfficerRoute><UnitData /></OfficerRoute>} />
        <Route path="/analytics" element={<OfficerRoute><Analytics /></OfficerRoute>} />
        <Route path="/attendance" element={<OfficerRoute><Attendance /></OfficerRoute>} />
        <Route path="/attendanceDetails" element={<OfficerRoute><AttendanceDetails /></OfficerRoute>} />
        
        {/* Catch-all redirect based on auth status */}
        <Route 
          path="*" 
          element={
            isAuthenticated() 
              ? (isAdmin ? <Navigate to="/admin/users" replace /> : <Navigate to="/dashboard" replace />)
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;