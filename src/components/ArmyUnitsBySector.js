import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Header from './Header';
import Footer from './footer';
import Sidebar from './Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ArmyUnitsBySector = () => {
  const LIMIT = 10;
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [armyUnits, setArmyUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSidebarToggle = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchArmyUnits() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        // Get sector_id from user info in localStorage
  const sectorId = localStorage.getItem('sector_id');
        if (!sectorId) {
          setError('No sector assigned to this user.');
          setLoading(false);
          return;
        }
        const res = await api.get(`/army-units/by-sector?sector_id=${sectorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setArmyUnits(res.data.army_units || []);
      } catch (err) {
        setError('Failed to fetch army units for this sector.');
      } finally {
        setLoading(false);
      }
    }
    fetchArmyUnits();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* White emblem watermark background */}
      <div 
        className="fixed inset-0 bg-center bg-no-repeat opacity-[0.12] pointer-events-none z-[1]"
        style={{
          backgroundImage: `url(${require('../assets/white_emb.jpeg')})`,
          backgroundSize: '45%',
        }}
        aria-hidden="true"
      ></div>
      <div className="relative z-10">
        <ToastContainer position="top-right" autoClose={2000} />
        <Header variant="blue" bgColor="#0b50a2">
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
          <Sidebar bgColor="#0b50a2" isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
          {sidebarOpen && window.innerWidth < 768 && (
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={handleSidebarToggle}
              style={{ cursor: 'pointer' }}
            />
          )}
          <main
            className="flex-1 flex flex-col items-center justify-center p-4"
            style={{
              marginLeft: sidebarOpen && window.innerWidth >= 768 ? 240 : 0,
              transition: 'margin-left 0.3s',
              zIndex: 10,
            }}
          >
            <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6 mt-2 flex flex-col items-center">
              <h2 className="text-3xl font-bold text-blue-800 mb-6">Army Units List (Assigned to Your Sector)</h2>
              <div className="overflow-x-auto w-full flex justify-center">
                <table className="min-w-[400px] w-full border border-blue-800 rounded-lg shadow-lg divide-y divide-gray-200">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">S.No</th>
                      <th className="px-6 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Army Unit Name</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-gray-500 font-semibold">Loading...</td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-red-500 font-semibold">{error}</td>
                      </tr>
                    ) : armyUnits.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-gray-500 font-semibold">No army units assigned to your sector.</td>
                      </tr>
                    ) : (
                      armyUnits.slice((page - 1) * LIMIT, page * LIMIT).map((unit, idx) => (
                        <tr key={unit.id} className="transition-colors duration-150 hover:bg-blue-50">
                          <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900 border-b border-blue-100">{(page - 1) * LIMIT + idx + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100">{unit.name}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {armyUnits.length > LIMIT && (
                <div className="flex justify-center items-center mt-6 gap-2">
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-200 transition-colors"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {(() => {
                      const totalPages = Math.ceil(armyUnits.length / LIMIT);
                      const maxPagesToShow = 5;
                      let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
                      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                      
                      if (endPage - startPage < maxPagesToShow - 1) {
                        startPage = Math.max(1, endPage - maxPagesToShow + 1);
                      }
                      
                      const pages = [];
                      
                      // First page button
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            className="px-3 py-2 rounded-lg font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            onClick={() => setPage(1)}
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                        }
                      }
                      
                      // Page number buttons
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                              page === i 
                                ? 'bg-blue-700 text-white shadow-md' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                            onClick={() => setPage(i)}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      // Last page button
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            className="px-3 py-2 rounded-lg font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            onClick={() => setPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                  </div>
                  
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-200 transition-colors"
                    onClick={() => setPage(page + 1)}
                    disabled={page === Math.ceil(armyUnits.length / LIMIT)}
                  >
                    Next
                  </button>
                </div>
              )}
              
              {/* Page info */}
              {armyUnits.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Showing {Math.min((page - 1) * LIMIT + 1, armyUnits.length)} to {Math.min(page * LIMIT, armyUnits.length)} of {armyUnits.length} army units
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

export default ArmyUnitsBySector;
