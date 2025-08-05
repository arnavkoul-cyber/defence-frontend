import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LabourForm from './components/LabourForm';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UnitData from './components/unitData';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LabourForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/unitData" element={<UnitData />} />
      </Routes>
    </Router>
  );
}

export default App;