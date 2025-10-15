import { FiTrash2 } from 'react-icons/fi';

import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import Header from '../Header';
import Footer from '../footer';
import AdminSidebar from './AdminSidebar';

const ArmyUnitsList = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const handleSidebarToggle = () => setSidebarOpen((prev) => !prev);
  const [armyUnits, setArmyUnits] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: '', sector_id: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const LIMIT = 10;
  // Delete handler
  const handleDeleteArmyUnit = async (unitName) => {
    if (!window.confirm(`Are you sure you want to delete army unit "${unitName}"?`)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      await api.delete(`/army-units/name/${encodeURIComponent(unitName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Always refresh both lists after delete
      const [unitsRes, sectorsRes] = await Promise.all([
        api.get('/army-units', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/dynamic/sectors', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setArmyUnits(unitsRes.data.army_units || []);
      setSectors(sectorsRes.data.data || []);
    } catch (err) {
      alert('Failed to delete army unit.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        const [unitsRes, sectorsRes] = await Promise.all([
          api.get('/army-units', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/dynamic/sectors', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setArmyUnits(unitsRes.data.army_units || []);
        setSectors(sectorsRes.data.data || []);
      } catch (err) {
        setError('Failed to fetch army units or sectors');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSectorName = (sector_id) => {
    const sector = sectors.find(s => String(s.id) === String(sector_id));
    return sector ? sector.name : `Sector ${sector_id}`;
  };

  // Pagination logic
  const totalPages = Math.ceil(armyUnits.length / LIMIT);
  const paginatedUnits = armyUnits.slice((page - 1) * LIMIT, page * LIMIT);

  // Modal handlers
  const handleOpenModal = () => {
    setShowModal(true);
    setNewUnit({ name: '', sector_id: '' });
    setAddError('');
    setAddSuccess('');
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUnit((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddArmyUnit = async () => {
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    try {
      const token = localStorage.getItem('auth_token');
      if (!newUnit.name || !newUnit.sector_id) {
        setAddError('All fields are required.');
        setAddLoading(false);
        return;
      }
      const payload = {
        name: newUnit.name,
        sector_id: Number(newUnit.sector_id),
      };
      await api.post('/army-units', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setAddSuccess('Army unit added successfully!');
      setShowModal(false);
      // Refresh both army units and sectors
      setLoading(true);
      try {
        const [unitsRes, sectorsRes] = await Promise.all([
          api.get('/army-units', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/dynamic/sectors', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setArmyUnits(unitsRes.data.army_units || []);
        setSectors(sectorsRes.data.data || []);
      } catch (err) {
        // Optionally handle error
      }
    } catch (err) {
      let errorMsg = 'Failed to add army unit.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setAddError(errorMsg);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="blue" bgColor="#0b50a2" />
      <div className="flex flex-1">
        <AdminSidebar bgColor="#0b50a2" isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
        <main className="flex-1 flex flex-col items-center justify-center p-4" style={{ marginLeft: sidebarOpen ? 240 : 0, transition: 'margin-left 0.3s' }}>
          <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mt-2 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-blue-800">Army Units List</h2>
              <button
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow flex items-center text-base"
                onClick={handleOpenModal}
              >
                <span className="text-xl mr-2">+</span> Army Unit
              </button>
            </div>
            {/* Add Army Unit Modal */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    onClick={handleCloseModal}
                  >
                    &times;
                  </button>
                  <h3 className="text-2xl font-bold mb-4 text-blue-800">Add Army Unit</h3>
                  {addError && <div className="mb-2 text-red-600 font-semibold">{addError}</div>}
                  {addSuccess && <div className="mb-2 text-green-600 font-semibold">{addSuccess}</div>}
                  <div className="mb-4">
                    <label className="block text-blue-800 font-semibold mb-1">Army Unit Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newUnit.name}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter army unit name"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-blue-800 font-semibold mb-1">Choose Sector</label>
                    <select
                      name="sector_id"
                      value={newUnit.sector_id}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select sector</option>
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>{sector.name || `Sector ${sector.id}`}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow"
                    onClick={handleAddArmyUnit}
                    disabled={addLoading}
                  >
                    {addLoading ? 'Adding...' : 'Add Army Unit'}
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto w-full flex justify-center">
              <table className="min-w-[600px] w-full border border-blue-800 rounded-lg shadow-lg divide-y divide-gray-200">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">S.No</th>
                    <th className="px-6 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Army Unit Name</th>
                    <th className="px-6 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Mapped Sector</th>
                    <th className="px-6 py-3 text-center text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500 font-semibold">Loading...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-red-500 font-semibold">{error}</td>
                    </tr>
                  ) : paginatedUnits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500 font-semibold">No army units to display yet.</td>
                    </tr>
                  ) : (
                    paginatedUnits.map((unit, idx) => (
                      <tr key={unit.id} className="transition-colors duration-150 hover:bg-blue-50">
                        <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900 border-b border-blue-100">{(page - 1) * LIMIT + idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100">{unit.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100">{getSectorName(unit.sector_id)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100 text-center">
                          <button
                            className="text-red-600 hover:text-red-800 p-2 rounded"
                            title="Delete Army Unit"
                            onClick={() => handleDeleteArmyUnit(unit.name)}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                  className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold disabled:opacity-50"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1 rounded font-bold ${page === i + 1 ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold disabled:opacity-50"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ArmyUnitsList;
