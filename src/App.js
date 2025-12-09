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
import ArmyUnitsBySector from './components/ArmyUnitsBySector';
import SectorUnitsPersonnel from './components/SectorUnitsPersonnel';
import LaboursList from './components/admin/LaboursList';
import LabourDeletionRequests from './components/admin/LabourDeletionRequests';

// --- auth helpers ---
const isAuthenticated = () => {
  return !!(
    localStorage.getItem('auth_token') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('mobile_number')
  );
};

const isAdminUser = () => {
  return (
    localStorage.getItem('role') === 'admin' ||
    localStorage.getItem('userType') === 'admin'
  );
};

// --- route guards ---
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isAdminUser()) return <Navigate to="/dashboard" replace />;
  return children;
};

const OfficerRoute = ({ children }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (isAdminUser()) return <Navigate to="/admin/users" replace />;
  return children;
};

function App() {
  const [isAdmin, setIsAdmin] = useState(isAdminUser());

  useEffect(() => {
    const handleStorageChange = () => setIsAdmin(isAdminUser());
    setIsAdmin(isAdminUser());
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/labourForm" element={<LabourForm />} />

        {/* Admin */}
        <Route path="/admin/users" element={<AdminRoute><UsersList /></AdminRoute>} />
        <Route path="/admin/labours" element={<AdminRoute><LaboursList /></AdminRoute>} />
        <Route path="/admin/sectors" element={<AdminRoute><SectorList /></AdminRoute>} />
        <Route path="/admin/army-units" element={<AdminRoute><ArmyUnitsList /></AdminRoute>} />
        <Route path="/admin/deletion-requests" element={<AdminRoute><LabourDeletionRequests /></AdminRoute>} />

        {/* Officer */}
  <Route path="/dashboard" element={<OfficerRoute><Dashboard /></OfficerRoute>} />
  <Route path="/unitData" element={<OfficerRoute><UnitData /></OfficerRoute>} />
  <Route path="/analytics" element={<OfficerRoute><Analytics /></OfficerRoute>} />
  <Route path="/attendance" element={<OfficerRoute><Attendance /></OfficerRoute>} />
  <Route path="/attendanceDetails" element={<OfficerRoute><AttendanceDetails /></OfficerRoute>} />
  <Route path="/army-units-by-sector" element={<OfficerRoute><ArmyUnitsBySector /></OfficerRoute>} />
  <Route path="/sector-units-personnel" element={<OfficerRoute><SectorUnitsPersonnel /></OfficerRoute>} />

        {/* Catch-all */}
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
