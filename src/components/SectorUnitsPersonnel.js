import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Header from './Header';
import Footer from './footer';
import Sidebar from './Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import { FiPhone, FiUsers, FiMapPin } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

const SectorUnitsPersonnel = () => {
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [armyUnits, setArmyUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectorInfo, setSectorInfo] = useState(null);

  const LIMIT = 10;

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
    async function fetchSectorData() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        const sectorId = localStorage.getItem('sector_id');
        
        if (!sectorId) {
          setError('No sector assigned to this user.');
          setLoading(false);
          return;
        }

        // Fetch army units with personnel data using the new API
        const unitsRes = await api.get(`/army-units/by-sector-with-personnel?sector_id=${sectorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Full API Response:', unitsRes.data); // Debug log
        console.log('Army Units Array:', unitsRes.data.army_units); // Debug log
        
        // Log each unit's mobile numbers specifically
        if (unitsRes.data.army_units) {
          unitsRes.data.army_units.forEach((unit, index) => {
            console.log(`Unit ${index + 1} - ${unit.name}:`, {
              id: unit.id,
              name: unit.name,
              officer_count: unit.officer_count,
              mobile_numbers: unit.mobile_numbers,
              mobile_numbers_length: unit.mobile_numbers?.length
            });
          });
        }

        // Set sector info from context (no need for separate API call)
        setSectorInfo({ id: sectorId, name: `Sector ${sectorId}` });

        setArmyUnits(unitsRes.data.army_units || []);
      } catch (err) {
        console.error('Error fetching sector data:', err);
        setError('Failed to fetch sector data.');
      } finally {
        setLoading(false);
      }
    }
    fetchSectorData();
  }, []);

  // Calculate totals from the army units data
  const totalPersonnel = armyUnits.reduce((total, unit) => total + (unit.officer_count || 0), 0);
  const totalMobileNumbers = armyUnits.reduce((total, unit) => total + (unit.mobile_numbers?.length || 0), 0);

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
            className="flex-1 flex flex-col items-center justify-start p-4"
            style={{
              marginLeft: sidebarOpen && window.innerWidth >= 768 ? 240 : 0,
              transition: 'margin-left 0.3s',
              zIndex: 10,
            }}
          >
            <div className="w-full max-w-6xl bg-white rounded-lg shadow p-6 mt-2">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-blue-800 mb-2">Sector Units & Personnel</h2>
                {sectorInfo && (
                  <div className="flex items-center text-gray-600">
                    <FiMapPin className="mr-2" />
                    <span className="text-lg font-semibold">
                      Sector: {sectorInfo.name || `Sector ${sectorInfo.id}`}
                    </span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500 font-semibold">Loading...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500 font-semibold">{error}</div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Army Units</h3>
                          <p className="text-3xl font-bold">{armyUnits.length}</p>
                        </div>
                        <FiUsers className="text-4xl opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Army Officers</h3>
                          <p className="text-3xl font-bold">{totalPersonnel}</p>
                        </div>
                        <FiUsers className="text-4xl opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Mobile Numbers</h3>
                          <p className="text-3xl font-bold">{totalMobileNumbers}</p>
                        </div>
                        <FiPhone className="text-4xl opacity-80" />
                      </div>
                    </div>
                  </div>

                  {/* Army Units Table */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-blue-800 mb-4">Army Units & Personnel Contact Details</h3>
                    
                    {armyUnits.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No army units assigned to this sector.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border border-blue-800 rounded-lg shadow-lg divide-y divide-gray-200">
                          <thead className="bg-blue-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">S.No</th>
                              <th className="px-4 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Army Unit Name</th>
                              <th className="px-4 py-3 text-center text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Officer Count</th>
                              <th className="px-4 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Mobile Numbers</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {armyUnits.slice((page - 1) * LIMIT, page * LIMIT).map((unit, idx) => {
                              console.log(`Unit ${unit.name}:`, unit); // Debug log
                              return (
                              <tr key={unit.id} className="transition-colors duration-150 hover:bg-blue-50">
                                <td className="px-4 py-4 text-sm font-bold text-gray-900 border-b border-blue-100">
                                  {(page - 1) * LIMIT + idx + 1}
                                </td>
                                <td className="px-4 py-4 text-sm font-bold border-b border-blue-100">
                                  <div className="flex items-center">
                                    <FiMapPin className="mr-2 text-blue-600" />
                                    {unit.name}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center border-b border-blue-100">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                    <FiUsers className="mr-1" />
                                    {unit.officer_count || 0}
                                  </span>
                                </td>
                                <td className="px-4 py-4 border-b border-blue-100">
                                  {unit.mobile_numbers && unit.mobile_numbers.length > 0 ? (
                                    <div className="space-y-1">
                                      {unit.mobile_numbers.map((number, mobileIdx) => (
                                        <div key={mobileIdx} className="flex items-center text-sm">
                                          <FiPhone className="mr-2 text-green-600" />
                                          <span className="font-mono font-semibold text-gray-700">{number}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 italic text-sm">No mobile numbers assigned</span>
                                  )}
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
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
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SectorUnitsPersonnel;