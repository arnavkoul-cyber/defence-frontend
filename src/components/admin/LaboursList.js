import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../api/api';
import Header from '../Header';
import Footer from '../footer';
import AdminSidebar from './AdminSidebar';
import { FiUsers, FiEye, FiTrash2 } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LABOURS_PER_PAGE = 10;

const LaboursList = () => {
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
  // Sector search state
  const [sectorSearch, setSectorSearch] = useState('');

  // Delete handler
  const handleDeleteLabour = async (labourId) => {
    if (!window.confirm('Are you sure you want to delete this labourer?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      await api.delete(`/labour/${labourId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Labourer deleted successfully!');
      // Add small delay to ensure backend update
      setTimeout(async () => {
        await fetchLabours();
        setLoading(false);
      }, 500);
    } catch (err) {
      const apiError = err?.response?.data?.error;
      toast.error(apiError || 'Failed to delete labourer.');
      setLoading(false);
    }
  };
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Date filter state
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filteredLabours, setFilteredLabours] = useState([]);

  useEffect(() => {
    fetchLabours();
  }, []);

  // Filter labours by date range
  useEffect(() => {
    let filtered = labours;
    // Date filter
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter((labour) => {
        if (!labour.created_at) return false;
        const createdDate = new Date(labour.created_at);
        const start = filterStartDate ? new Date(filterStartDate) : null;
        const end = filterEndDate ? new Date(filterEndDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        createdDate.setHours(0, 0, 0, 0);
        if (start && end) {
          return createdDate >= start && createdDate <= end;
        } else if (start) {
          return createdDate >= start;
        } else if (end) {
          return createdDate <= end;
        }
        return true;
      });
    }
    // Sector search filter
    if (sectorSearch.trim()) {
      filtered = filtered.filter(labour =>
        (labour.sector_name || '').toLowerCase().includes(sectorSearch.trim().toLowerCase())
      );
    }
    setFilteredLabours(filtered);
    setPage(1); // Reset to first page when filter changes
  }, [labours, filterStartDate, filterEndDate, sectorSearch]);

  const fetchLabours = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await api.get('/labour/all/admin', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLabours(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch labourers');
      toast.error('Failed to fetch labourers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (labour) => {
    setSelectedLabour(labour);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLabour(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const capitalize = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const totalPages = Math.ceil(filteredLabours.length / LABOURS_PER_PAGE);
  const paginatedLabours = filteredLabours.slice((page - 1) * LABOURS_PER_PAGE, page * LABOURS_PER_PAGE);

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
        <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
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
            className="flex-1 p-6"
            style={{
              marginLeft: sidebarOpen && windowWidth >= 768 ? 240 : 0,
              transition: 'margin-left 0.3s',
              zIndex: 10,
            }}
          >
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="h-12 w-12 rounded-full bg-blue-100 ring-1 ring-blue-200 shadow-sm flex items-center justify-center">
                    <FiUsers className="text-blue-600 w-6 h-6" />
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 drop-shadow-sm">
                    All Labourers
                  </h2>
                </div>
                <div className="h-1.5 w-28 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"></div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Labourers</p>
                    <p className="text-3xl font-bold text-blue-600">{labours.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm font-medium">Assigned</p>
                    <p className="text-2xl font-bold text-green-600">
                      {labours.filter(l => l.army_unit_id).length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm font-medium">Unassigned</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {labours.filter(l => !l.army_unit_id).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Filter */}
              <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-200">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-700">From:</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-700">To:</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {(filterStartDate || filterEndDate) && (
                    <button
                      onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition"
                    >
                      Clear Filter
                    </button>
                  )}
                  <div className="ml-auto text-sm text-gray-600">
                    Showing <span className="font-bold text-blue-600">{filteredLabours.length}</span> of <span className="font-bold">{labours.length}</span> labourers
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  {/* Sector search bar above table */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-200">
                    <label className="font-semibold text-blue-700">Search Sector:</label>
                    <input
                      type="text"
                      value={sectorSearch}
                      onChange={e => setSectorSearch(e.target.value)}
                      placeholder="Type sector name..."
                      className="border rounded px-2 py-1 text-sm w-48"
                    />
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">S.No</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Father Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Labour Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Sector</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Army Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-gray-500 font-semibold">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              <span className="ml-3">Loading labourers...</span>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-red-500 font-semibold">{error}</td>
                        </tr>
                      ) : labours.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-gray-500 font-semibold">No labourers found.</td>
                        </tr>
                      ) : filteredLabours.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-gray-500 font-semibold">No labourers found for the selected date range.</td>
                        </tr>
                      ) : (
                        paginatedLabours.map((labour, idx) => (
                          <tr key={labour.id} className="transition-colors duration-150 hover:bg-blue-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {(page - 1) * LABOURS_PER_PAGE + idx + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {capitalize(labour.name)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {capitalize(labour.father_name)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {labour.contact_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {labour.labour_type || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {labour.sector_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {labour.army_unit_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {labour.army_unit_id ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                  Assigned
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleViewDetails(labour)}
                                className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-blue-100 transition-colors"
                                title="View Details"
                              >
                                <FiEye className="text-blue-600 w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLabour(labour.id)}
                                className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-red-100 transition-colors ml-2"
                                title="Delete Labourer"
                              >
                                <FiTrash2 className="text-red-600 w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(page - 1) * LABOURS_PER_PAGE + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(page * LABOURS_PER_PAGE, filteredLabours.length)}</span> of{' '}
                          <span className="font-medium">{filteredLabours.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Prev
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pageNum
                                    ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedLabour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-2xl font-bold">Labourer Details</h3>
              <button
                onClick={handleCloseModal}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="border-b pb-4">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{capitalize(selectedLabour.name)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Father's Name</p>
                    <p className="font-semibold text-gray-900">{capitalize(selectedLabour.father_name)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact Number</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.contact_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Aadhaar Number</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.aadhaar_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Labour Type</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.labour_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">PAN Number</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.pan_number || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-b pb-4">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.bank_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.bank_account_no || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IFSC Code</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.bank_ifsc_code || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div className="border-b pb-4">
                <h4 className="text-lg font-bold text-gray-800 mb-3">Assignment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Sector</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.sector_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Army Unit</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.army_unit_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned By</p>
                    <p className="font-semibold text-gray-900">{selectedLabour.assigned_by_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    {selectedLabour.army_unit_id ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedLabour.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedLabour.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created At</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedLabour.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Photo</p>
                    {selectedLabour.photo_path ? (
                      <img
                        src={getImageUrl(selectedLabour.photo_path)}
                        alt="Labour Photo"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => { e.currentTarget.src = 'https://img.icons8.com/fluency/48/no-image.png'; }}
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        No Photo
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Aadhaar Card</p>
                    {selectedLabour.adhar_path ? (
                      <a
                        href={getImageUrl(selectedLabour.adhar_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={getImageUrl(selectedLabour.adhar_path)}
                          alt="Aadhaar"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition-opacity"
                          onError={(e) => { e.currentTarget.src = 'https://img.icons8.com/fluency/48/no-image.png'; }}
                        />
                      </a>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        No Aadhaar
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">PAN Card</p>
                    {selectedLabour.pan_path ? (
                      <a
                        href={getImageUrl(selectedLabour.pan_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={getImageUrl(selectedLabour.pan_path)}
                          alt="PAN"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition-opacity"
                          onError={(e) => { e.currentTarget.src = 'https://img.icons8.com/fluency/48/no-image.png'; }}
                        />
                      </a>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        No PAN
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedLabour.remarks && (
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Remarks</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedLabour.remarks}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end rounded-b-xl border-t">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default LaboursList;
