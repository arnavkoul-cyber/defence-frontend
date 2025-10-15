import { FiTrash2 } from 'react-icons/fi';
  // Delete handler
 
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Header from '../Header';
import Footer from '../footer';
import AdminSidebar from './AdminSidebar';

const SECTORS_PER_PAGE = 10;

const SectorList = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [page, setPage] = useState(1);
   const handleDeleteSector = async (sectorName) => {
    if (!window.confirm(`Are you sure you want to delete sector "${sectorName}"?`)) return;
    try {
      const token = localStorage.getItem('auth_token');
      await api.delete(`/sectors/name/${encodeURIComponent(sectorName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSectors();
    } catch (err) {
      alert('Failed to delete sector.');
    }
  };

  // Make sure fetchSectors is defined at the top level so it's in scope for all functions
  async function fetchSectors() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await api.get('/sectors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSectors(res.data.data || res.data.sectors || []);
    } catch (err) {
      setError('Failed to fetch sectors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSectors();
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
    setNewSectorName('');
    setAddError('');
    setAddSuccess('');
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleAddSector = async () => {
    if (!newSectorName.trim()) {
      setAddError('Sector name is required.');
      return;
    }
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    try {
      const token = localStorage.getItem('auth_token');
      await api.post('/sectors', { name: newSectorName.trim() }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setAddSuccess('Sector added successfully!');
      setAddLoading(false);
      setShowModal(false);
      setNewSectorName('');
      await fetchSectors();
    } catch (err) {
      setAddError('Failed to add sector.');
      setAddLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(sectors.length / SECTORS_PER_PAGE);
  const paginatedSectors = sectors.slice((page - 1) * SECTORS_PER_PAGE, page * SECTORS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="blue" bgColor="#0b50a2" />
      <div className="flex flex-1">
        <AdminSidebar bgColor="#0b50a2" />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mt-2 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-blue-800">Sectors List</h2>
              <button
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow flex items-center text-base"
                onClick={handleOpenModal}
              >
                <span className="text-xl mr-2">+</span> Add Sector
              </button>
            </div>
            {/* Modal for Add New Sector */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    onClick={handleCloseModal}
                  >
                    &times;
                  </button>
                  <h3 className="text-2xl font-bold mb-4 text-blue-800">Add New Sector</h3>
                  {addError && <div className="mb-2 text-red-600 font-semibold">{addError}</div>}
                  {addSuccess && <div className="mb-2 text-green-600 font-semibold">{addSuccess}</div>}
                  <div className="mb-6">
                    <label className="block text-blue-800 font-semibold mb-1">Sector Name</label>
                    <input
                      type="text"
                      value={newSectorName}
                      onChange={e => setNewSectorName(e.target.value)}
                      className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter sector name"
                    />
                  </div>
                  <button
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow"
                    onClick={handleAddSector}
                    disabled={addLoading}
                  >
                    {addLoading ? 'Adding...' : 'Add Sector'}
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto w-full flex justify-center">
              <table className="min-w-[500px] w-full border border-blue-800 rounded-lg shadow-lg divide-y divide-gray-200">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">S.No</th>
                    <th className="px-6 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Sector Name</th>
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
                  ) : paginatedSectors.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500 font-semibold">No sectors to display yet.</td>
                    </tr>
                  ) : (
                    paginatedSectors.map((sector, idx) => (
                      <tr key={sector.id} className="transition-colors duration-150 hover:bg-blue-50">
                        <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900 border-b border-blue-100">{(page - 1) * SECTORS_PER_PAGE + idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100">{sector.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100 text-center">
                          <button
                            className="text-red-600 hover:text-red-800 p-2 rounded"
                            title="Delete Sector"
                            onClick={() => handleDeleteSector(sector.name)}
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
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <button
                  className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1 rounded font-bold ${page === i + 1 ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

export default SectorList;
