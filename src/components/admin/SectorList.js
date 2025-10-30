import { FiTrash2 } from 'react-icons/fi';
  // Delete handler
 
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Header from '../Header';
import Footer from '../footer';
import AdminSidebar from './AdminSidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SECTORS_PER_PAGE = 10;

const SectorList = () => {
  // Responsive: show sidebar open arrow when closed on mobile
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Sidebar responsive state
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const handleSidebarToggle = () => setSidebarOpen((prev) => !prev);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Manual refresh handler
  const handleRefresh = async () => {
    await fetchSectors();
    setPage(1);
  };
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
      toast.success('Sector deleted successfully!');
      await fetchSectors();
      setPage(1); // Reset to first page after deletion
    } catch (err) {
      // Show API error message if available
      const apiError = err?.response?.data?.error;
      toast.error(apiError || 'Failed to delete sector.');
    }
  };

  // Make sure fetchSectors is defined at the top level so it's in scope for all functions
  async function fetchSectors() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      // Add cache-busting param
      const res = await api.get(`/sectors?t=${Date.now()}`, {
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
      toast.success('Sector added successfully!');
      setAddLoading(false);
      setShowModal(false);
      setNewSectorName('');
      await fetchSectors();
    } catch (err) {
      toast.error('Failed to add sector.');
      setAddLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(sectors.length / SECTORS_PER_PAGE);
  const paginatedSectors = sectors.slice((page - 1) * SECTORS_PER_PAGE, page * SECTORS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* White emblem watermark background */}
      <div 
        className="fixed inset-0 bg-center bg-no-repeat opacity-[0.12] pointer-events-none z-[1]"
        style={{
          backgroundImage: `url(${require('../../assets/white_emb.jpeg')})`,
          backgroundSize: '45%',
        }}
        aria-hidden="true"
      ></div>
      
      <div className="relative z-10">
      <ToastContainer position="top-right" autoClose={2000} />
      <Header variant="blue" bgColor="#0b50a2">
        {/* Hamburger for mobile */}
        <button
          type="button"
          aria-label="Open sidebar"
          className="md:hidden absolute left-2 top-2 z-50 p-2 rounded-md bg-blue-700 text-white shadow"
          onClick={handleSidebarToggle}
        >
          <span style={{fontSize: '1.5rem'}}>&#9776;</span>
        </button>
      </Header>
      <div className="flex flex-1 relative">
        {/* Sidebar overlays on mobile, pushes on desktop */}
        <AdminSidebar bgColor="#0b50a2" isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && windowWidth < 768 && (
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={handleSidebarToggle}
            style={{ cursor: 'pointer' }}
          />
        )}
        {/* Show sidebar open arrow on mobile when sidebar is closed */}
        {!sidebarOpen && windowWidth < 768 && (
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={handleSidebarToggle}
            className="fixed left-2 top-20 z-50 p-2 rounded-md bg-blue-700 text-white shadow"
          >
            <span style={{fontSize: '1.5rem'}}>&#8250;</span>
          </button>
        )}
        <main
          className="flex-1 flex flex-col items-center justify-center p-4"
          style={{
            marginLeft: sidebarOpen && windowWidth >= 768 ? 240 : 0,
            transition: 'margin-left 0.3s',
            zIndex: 10,
          }}
        >
          <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mt-2 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-blue-800">Sectors List</h2>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow flex items-center text-base"
                  onClick={handleRefresh}
                  title="Refresh Sectors List"
                >
                  &#x21bb; Refresh
                </button>
                <button
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow flex items-center text-base"
                  onClick={handleOpenModal}
                >
                  <span className="text-xl mr-2">+</span> Add Sector
                </button>
              </div>
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
              <div className="w-full" style={{ minWidth: 0 }}>
                <table className="w-full border border-blue-800 rounded-lg shadow-lg divide-y divide-gray-200 text-sm md:text-base">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-2 py-2 md:px-4 md:py-3 text-left font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">S.No</th>
                      <th className="px-2 py-2 md:px-6 md:py-3 text-left font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Sector Name</th>
                      <th className="px-2 py-2 md:px-6 md:py-3 text-center font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Action</th>
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
                          <td className="px-2 py-2 md:px-4 md:py-4 whitespace-nowrap font-bold text-gray-900 border-b border-blue-100">{(page - 1) * SECTORS_PER_PAGE + idx + 1}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap font-bold border-b border-blue-100">{sector.name}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap font-bold border-b border-blue-100 text-center">
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
      </div>
      <Footer />
    </div>
  );
};

export default SectorList;
