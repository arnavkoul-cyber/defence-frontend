import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="w-60 bg-gray-900 text-white h-screen p-4">
      <h3 className="text-2xl font-bold mb-6">Dashboard</h3>
      <nav className="space-y-3">
        <Link to="/dashboard" className="block hover:text-gray-300">Users</Link>
        <Link to="/" className="block hover:text-gray-300">Logout</Link>
      </nav>
    </div>
  );
}

export default Sidebar;