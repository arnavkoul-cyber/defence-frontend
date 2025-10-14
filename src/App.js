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
// Simple auth check: treat presence of any of these as logged in
const isAuthenticated = () => {
  return !!(
    localStorage.getItem('auth_token') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('mobile_number')
  );
};

// Wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


function App() {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('role') === 'admin');
  useEffect(() => {
    const onStorage = () => setIsAdmin(localStorage.getItem('role') === 'admin');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    setIsAdmin(localStorage.getItem('role') === 'admin');
  });
  return (
    <Router>
      <ToastContainer position="top-center" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        {isAdmin ? (
          <>
            <Route path="/admin/users" element={<ProtectedRoute><UsersList /></ProtectedRoute>} />
            <Route path="/admin/sectors" element={<ProtectedRoute><SectorList /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/admin/users" replace />} />
          </>
        ) : (
          <>
            <Route path="/labourForm" element={<ProtectedRoute><LabourForm /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/unitData" element={<ProtectedRoute><UnitData /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/attendanceDetails" element={<ProtectedRoute><AttendanceDetails /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;