import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LabourForm from './components/LabourForm';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UnitData from './components/unitData';
import Attendance from './components/attendance';
import AttendanceDetails from './components/attendanceDetails';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        <Route path="/" element={<LabourForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/unitData" element={<UnitData />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/attendanceDetails" element={<AttendanceDetails />} />
      </Routes>
    </Router>
  );
}

export default App;