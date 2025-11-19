import { FiTrash2, FiEye } from 'react-icons/fi';
  // Delete handler
 
import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Header from '../Header';
import Footer from '../footer';
import AdminSidebar from './AdminSidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SectorDetails from './SectorDetails';

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
  const [selectedSector, setSelectedSector] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewDetails = (sector) => {
    setSelectedSector(sector);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSector(null);
  };

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

  // Filter sectors based on search query
  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSectors.length / SECTORS_PER_PAGE);
  const paginatedSectors = filteredSectors.slice((page - 1) * SECTORS_PER_PAGE, page * SECTORS_PER_PAGE);

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
            <div className="w-full mb-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 rounded text-sm font-semibold">
                <strong>Note:</strong> Before deleting a sector, please delete all labours and army units assigned to that sector. Otherwise, deletion may fail or cause data inconsistency.
              </div>
            </div>
            <div className="w-full mb-6">
              <div className="flex items-center justify-between mb-4">
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
              {/* Search Bar */}
              <div className="w-full max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1); // Reset to first page on search
                    }}
                    placeholder="Search by sector name..."
                    className="w-full pl-10 pr-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setPage(1);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
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
                    ) : filteredSectors.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-gray-500 font-semibold">
                          {searchQuery ? `No sectors found matching "${searchQuery}"` : 'No sectors to display yet.'}
                        </td>
                      </tr>
                    ) : paginatedSectors.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-gray-500 font-semibold">No sectors on this page.</td>
                      </tr>
                    ) : (
                      paginatedSectors.map((sector, idx) => (
                        <tr key={sector.id} className="transition-colors duration-150 hover:bg-blue-50">
                          <td className="px-2 py-2 md:px-4 md:py-4 whitespace-nowrap font-bold text-gray-900 border-b border-blue-100">{(page - 1) * SECTORS_PER_PAGE + idx + 1}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap font-bold border-b border-blue-100">{sector.name}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 whitespace-nowrap font-bold border-b border-blue-100 text-center">
                            <button
                              className="text-blue-600 hover:text-blue-800 p-2 rounded inline-flex items-center"
                              title="View Details"
                              onClick={() => handleViewDetails(sector)}
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 p-2 rounded ml-2"
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
              <div className="flex justify-center items-center mt-4 space-x-2 flex-wrap">
                <button
                  className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold disabled:opacity-50"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Prev
                </button>
                {/* Show first page */}
                {page > 3 && (
                  <>
                    <button
                      className={`px-3 py-1 rounded font-bold ${page === 1 ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}
                      onClick={() => setPage(1)}
                    >
                      1
                    </button>
                    <span className="px-2">...</span>
                  </>
                )}
                {/* Show up to 2 pages before and after current */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p >= page - 2 && p <= page + 2)
                  .map(p => (
                    <button
                      key={p}
                      className={`px-3 py-1 rounded font-bold ${page === p ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                {/* Show last page */}
                {page < totalPages - 2 && (
                  <>
                    <span className="px-2">...</span>
                    <button
                      className={`px-3 py-1 rounded font-bold ${page === totalPages ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
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

      {/* Sector Details Modal */}
      {showDetailsModal && selectedSector && (
        <SectorDetails
          sector={selectedSector}
          onClose={handleCloseDetailsModal}
        />
      )}

      <Footer />
    </div>
  );
};

export default SectorList;
