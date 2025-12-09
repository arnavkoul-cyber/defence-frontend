import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './footer';
import api, { getImageUrl } from '../api/api';
import { FiUsers, FiChevronRight, FiEye, FiTrash2, FiX } from 'react-icons/fi';
import { getThemeColors, getTableHeaderClass, getButtonClass, getGradientTextClass } from '../utils/themeHelper';
import { toast } from 'react-toastify';
import noPhoto from '../assets/no_photo.png';

function UnitData() {
  const [labours, setLabours] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [armyUnits, setArmyUnits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 8;

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteComment, setDeleteComment] = useState('');
  const [labourToDelete, setLabourToDelete] = useState(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isAdminCommentModalOpen, setIsAdminCommentModalOpen] = useState(false);
  const [selectedAdminComment, setSelectedAdminComment] = useState('');
  
  // Delete status for each labour (labour_id -> status object)
  const [deleteStatuses, setDeleteStatuses] = useState({});
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Get current month start and today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const monthStart = `${yyyy}-${mm}-01`;
    const monthEnd = `${yyyy}-${mm}-${dd}`;
    
    setStartDate(monthStart);
    setEndDate(monthEnd);
    
    fetchLabours(monthStart, monthEnd);

    api.get('/dynamic/sectors')
      .then(res => setSectors(res.data.data || []))
      .catch(err => console.error('Error fetching sectors:', err));

    const sectorId = localStorage.getItem('sector_id');
    api.get(`/army-units/by-sector?sector_id=${sectorId}`)
      .then(res => setArmyUnits(res.data.army_units || []))
      .catch(err => console.error('Error fetching army units:', err));
  }, []);

  const getSectorName = (sector_id) => {
    const sector = sectors.find(s => String(s.id) === String(sector_id));
    return sector ? sector.name : <span className="text-gray-500 italic">Not Assigned</span>;
  };

  const getArmyUnitName = (army_unit_id) => {
    const unit = armyUnits.find(u => String(u.id) === String(army_unit_id));
    return unit ? unit.name : <span className="text-gray-500 italic">Not Assigned</span>;
  };

  // Fetch labours based on date range
  const fetchLabours = async (start, end) => {
    try {
      const response = await api.post('/labour/by-officer', {
        officer_id: localStorage.getItem('userId'),
        startDate: start,
        endDate: end
      });
      const fetchedLabours = response.data.labours || [];
      setLabours(fetchedLabours);
      setCurrentPage(1);
      fetchDeleteStatuses(fetchedLabours);
    } catch (err) {
      console.error('Error fetching labours:', err);
      toast.error('Failed to fetch labours', { position: 'top-center', autoClose: 1800 });
    }
  };

  // Handle date filter application
  const handleApplyFilter = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates', { position: 'top-center', autoClose: 1800 });
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date', { position: 'top-center', autoClose: 1800 });
      return;
    }
    fetchLabours(startDate, endDate);
  };

  // Clear filters
  const handleClearFilter = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const monthStart = `${yyyy}-${mm}-01`;
    const monthEnd = `${yyyy}-${mm}-${dd}`;
    
    setStartDate(monthStart);
    setEndDate(monthEnd);
    setSearchQuery('');
    fetchLabours(monthStart, monthEnd);
  };

  // Fetch delete status for all labours
  const fetchDeleteStatuses = async (laboursArray) => {
    const statuses = {};
    for (const labour of laboursArray) {
      try {
        const response = await api.get(`/labour/delete-status/${labour.id}`);
        statuses[labour.id] = response.data;
      } catch (err) {
        console.error(`Error fetching delete status for labour ${labour.id}:`, err);
        statuses[labour.id] = { has_delete_request: false };
      }
    }
    setDeleteStatuses(statuses);
  };

  // Get delete status for a specific labour
  const getDeleteStatus = (labourId) => {
    return deleteStatuses[labourId] || { has_delete_request: false };
  };

  // Check if delete button should be disabled
  const isDeleteDisabled = (labourId) => {
    const status = getDeleteStatus(labourId);
    return status.has_delete_request && status.status === 'pending';
  };

  // Get status badge text and color
  const getStatusBadge = (labourId) => {
    const status = getDeleteStatus(labourId);
    if (!status.has_delete_request) return null;
    
    if (status.status === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          Delete Pending
        </span>
      );
    }
    return null;
  };

  // View labour details handler
  const handleViewLabour = (labour) => {
    setSelectedLabour(labour);
    setIsViewModalOpen(true);
  };

  // Delete labour handler - show confirmation first
  const handleDeleteClick = (labour) => {
    setLabourToDelete(labour);
    setIsConfirmDeleteOpen(true);
  };

  // Proceed to delete comment modal after confirmation
  const handleConfirmDelete = () => {
    setIsConfirmDeleteOpen(false);
    setDeleteComment('');
    setIsDeleteModalOpen(true);
  };

  // Cancel delete operation
  const handleCancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setLabourToDelete(null);
  };

  // Submit delete request with comment
  const handleDeleteSubmit = async () => {
    if (!deleteComment.trim()) {
      toast.error('Please provide a reason for deletion', { position: 'top-center', autoClose: 1800 });
      return;
    }

    try {
      // API call - you'll create this endpoint
      await api.post('/labour/delete-request', {
        labour_id: labourToDelete.id,
        officer_id: localStorage.getItem('userId'),
        comment: deleteComment,
        labour_name: labourToDelete.name,
        army_unit_id: labourToDelete.army_unit_id
      });
      
      toast.success('Delete request sent to admin successfully', { position: 'top-center', autoClose: 2000 });
      setIsDeleteModalOpen(false);
      setLabourToDelete(null);
      setDeleteComment('');
      
      // Refresh delete status for this labour
      await fetchDeleteStatuses(labours);
    } catch (err) {
      console.error('Error submitting delete request:', err);
      toast.error('Failed to submit delete request', { position: 'top-center', autoClose: 1800 });
    }
  };

  // Filter labours by search query
  const filteredLabours = labours.filter(labour => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return labour.name?.toLowerCase().includes(query);
  });

  // Pagination
  const totalPages = Math.ceil(filteredLabours.length / entriesPerPage) || 1;
  const paginatedLabours = filteredLabours.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  // Get theme colors
  const themeColors = getThemeColors();
  const tableHeaderClass = getTableHeaderClass();
  const buttonClass = getButtonClass();
  const gradientTextClass = getGradientTextClass();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 relative">
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
  <Header bgColor={themeColors.headerBg} emblemColor="blue" isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />
      {!isSidebarOpen && (
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-24 z-50 p-2 rounded-md bg-white text-blue-600 ring-1 ring-blue-300 shadow hover:bg-blue-50"
        >
          <FiChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
      <div className="flex flex-1">
  <Sidebar bgColor={themeColors.sidebarBg} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(v => !v)} />
        <main className={`flex-1 px-3 sm:px-4 md:px-6 pt-2 pb-24 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'ml-0'} mt-1 overflow-x-hidden`}>
        <div className="mb-4 sm:mb-5">
          <div className="flex items-end gap-3">
            <span className={`h-10 w-10 rounded-full ${themeColors.primary.includes('059669') ? 'bg-green-100 ring-green-200' : themeColors.primary.includes('1f2937') ? 'bg-gray-100 ring-gray-200' : 'bg-blue-100 ring-blue-200'} ring-1 shadow-sm flex items-center justify-center`}>
              <FiUsers className={`${themeColors.primary.includes('059669') ? 'text-green-600' : themeColors.primary.includes('1f2937') ? 'text-gray-600' : 'text-blue-600'} w-6 h-6`} />
            </span>
            <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight ${gradientTextClass} drop-shadow-sm`}>
              Labours & Assigned Units
            </h1>
          </div>
          <div className={`mt-2 h-1.5 w-28 ${gradientTextClass.includes('green') ? 'bg-gradient-to-r from-green-600 to-emerald-500' : gradientTextClass.includes('gray') ? 'bg-gradient-to-r from-gray-700 to-gray-500' : 'bg-gradient-to-r from-blue-600 to-sky-500'} rounded-full`}></div>
        </div>

        {/* Search and Date Filter Section */}
        <div className="mb-4 bg-white rounded-xl border border-gray-200 shadow p-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            <div className="flex-1 w-full">
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                Search by Labour Name
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                placeholder="Enter labour name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {searchQuery && (
              <div className="w-full sm:w-auto sm:mt-7">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col lg:flex-row items-end gap-3 mb-3">
              <div className="w-full lg:w-auto">
                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full lg:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="w-full lg:w-auto">
                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full lg:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={handleApplyFilter}
                  className="flex-1 lg:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow font-medium"
                >
                  Apply Filter
                </button>
                <button
                  onClick={handleClearFilter}
                  className="flex-1 lg:flex-none px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Showing {filteredLabours.length} of {labours.length} labours
          </p>
        </div>

        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200 text-gray-800">
            <thead className={tableHeaderClass}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Father Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Contact</th>
                {/* <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Aadhaar</th> */}
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Sector</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Army Unit</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Admin Comment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {labours.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-6 text-gray-600 italic">
                    No labours found.
                  </td>
                </tr>
              ) : (
                paginatedLabours.map(labour => {
                  const capitalize = (str) => str && typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
                  const deleteDisabled = isDeleteDisabled(labour.id);
                  return (
                    <tr key={labour.id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">{capitalize(labour.name)}</td>
                      <td className="px-6 py-4">{capitalize(labour.father_name)}</td>
                      <td className="px-6 py-4">{labour.contact_number}</td>
                      {/* <td className="px-6 py-4">{labour.aadhaar_number}</td> */}
                      <td className="px-6 py-4">{getSectorName(labour.sector_id)}</td>
                      <td className="px-6 py-4">{getArmyUnitName(labour.army_unit_id)}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(labour.id) || <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const status = getDeleteStatus(labour.id);
                          if (status.status === 'rejected' && status.admin_comment) {
                            return (
                              <button
                                onClick={() => {
                                  setSelectedAdminComment(status.admin_comment);
                                  setIsAdminCommentModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm font-medium flex items-center gap-1"
                                title="View admin comment"
                              >
                                <FiEye className="w-4 h-4" />
                                View
                              </button>
                            );
                          }
                          return <span className="text-gray-400 text-sm">—</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewLabour(labour)}
                            title="View Labour Details"
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(labour)}
                            disabled={deleteDisabled}
                            title={deleteDisabled ? "Delete request already pending" : "Request Labour Deletion"}
                            className={`p-2 rounded-lg transition ${
                              deleteDisabled 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {labours.length === 0 && (
            <div className="text-center text-gray-500 bg-white border border-gray-200 rounded-lg py-6 shadow">No labours found.</div>
          )}
          {filteredLabours.length === 0 && labours.length > 0 && (
            <div className="text-center text-gray-500 bg-white border border-gray-200 rounded-lg py-6 shadow">No labours match your search.</div>
          )}
          {paginatedLabours.map(labour => {
            const capitalize = (str) => str && typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
            const deleteDisabled = isDeleteDisabled(labour.id);
            return (
              <div key={labour.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow">
                <p className="font-semibold text-gray-800">{capitalize(labour.name)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Father: {capitalize(labour.father_name) || '—'}</p>
                <p className="text-sm text-gray-600 mt-1">📞 {labour.contact_number}</p>
                <div className="mt-2 text-xs space-y-1">
                  <div><span className="font-semibold text-gray-700">Sector:</span> {getSectorName(labour.sector_id)}</div>
                  <div><span className="font-semibold text-gray-700">Army Unit:</span> {getArmyUnitName(labour.army_unit_id)}</div>
                </div>
                {getStatusBadge(labour.id) && (
                  <div className="mt-2">
                    {getStatusBadge(labour.id)}
                  </div>
                )}
                {(() => {
                  const status = getDeleteStatus(labour.id);
                  if (status.status === 'rejected' && status.admin_comment) {
                    return (
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            setSelectedAdminComment(status.admin_comment);
                            setIsAdminCommentModalOpen(true);
                          }}
                          className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <FiEye className="w-4 h-4" />
                          View Admin Comment
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleViewLabour(labour)}
                    className="flex-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <FiEye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteClick(labour)}
                    disabled={deleteDisabled}
                    className={`flex-1 px-3 py-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-1 ${
                      deleteDisabled 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {filteredLabours.length > entriesPerPage && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-white text-sm disabled:bg-gray-300 ${buttonClass}`}
              >Prev</button>
              <span className="text-sm font-medium text-gray-700">{currentPage}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-white text-sm disabled:bg-gray-300 ${buttonClass}`}
              >Next</button>
            </div>
          )}
        </div>
        {filteredLabours.length > entriesPerPage && (
          <div className="flex items-center justify-center mt-6 space-x-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded text-white font-semibold transition disabled:bg-gray-300 disabled:text-gray-500 ${buttonClass}`}
            >
              Prev
            </button>
            <span className="font-semibold text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded text-white font-semibold transition disabled:bg-gray-300 disabled:text-gray-500 ${buttonClass}`}
            >
              Next
            </button>
          </div>
        )}

        {/* View Labour Details Modal */}
        {isViewModalOpen && selectedLabour && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl font-bold">Labour Details</h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Photo Section */}
                <div className="flex justify-center">
                  <img
                    src={selectedLabour.photo_path ? getImageUrl(selectedLabour.photo_path) : noPhoto}
                    alt="Labour"
                    className="w-32 h-32 object-cover rounded-lg shadow-lg border-2 border-gray-200"
                    onError={(e) => { e.currentTarget.src = noPhoto; }}
                  />
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Name</label>
                    <p className="text-gray-800 font-medium mt-1">{selectedLabour.name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Father's Name</label>
                    <p className="text-gray-800 font-medium mt-1">{selectedLabour.father_name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Contact Number</label>
                    <p className="text-gray-800 font-medium mt-1">{selectedLabour.contact_number || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Aadhaar Number</label>
                    <p className="text-gray-800 font-medium mt-1">{selectedLabour.aadhaar_number || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">PAN Number</label>
                    <p className="text-gray-800 font-medium mt-1">{selectedLabour.pan_number || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Sector</label>
                    <p className="text-gray-800 font-medium mt-1">{getSectorName(selectedLabour.sector_id)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Army Unit</label>
                    <p className="text-gray-800 font-medium mt-1">{getArmyUnitName(selectedLabour.army_unit_id)}</p>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Bank Name</label>
                      <p className="text-gray-800 font-medium mt-1">{selectedLabour.bank_name || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Account Number</label>
                      <p className="text-gray-800 font-medium mt-1">{selectedLabour.bank_account_no || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">IFSC Code</label>
                      <p className="text-gray-800 font-medium mt-1">{selectedLabour.bank_ifsc_code || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Aadhaar Photo</label>
                      <div className="mt-2">
                        {selectedLabour.adhar_path || selectedLabour.aadhaar_photo_path ? (
                          <img
                            src={getImageUrl(selectedLabour.adhar_path || selectedLabour.aadhaar_photo_path)}
                            alt="Aadhaar"
                            className="w-full h-32 object-cover rounded-lg shadow border border-gray-200"
                            onError={(e) => { e.currentTarget.src = noPhoto; }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">PAN Photo</label>
                      <div className="mt-2">
                        {selectedLabour.pan_path || selectedLabour.pan_card_photo_path ? (
                          <img
                            src={getImageUrl(selectedLabour.pan_path || selectedLabour.pan_card_photo_path)}
                            alt="PAN"
                            className="w-full h-32 object-cover rounded-lg shadow border border-gray-200"
                            onError={(e) => { e.currentTarget.src = noPhoto; }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {isConfirmDeleteOpen && labourToDelete && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-yellow-600 to-orange-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl font-bold">Confirm Deletion</h2>
                <button
                  onClick={handleCancelDelete}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-700 text-lg mb-2">
                  Are you sure you want to delete <span className="font-bold text-gray-900">{labourToDelete.name}</span>?
                </p>
                <p className="text-sm text-gray-500">
                  This will send a deletion request to the admin. You will need to provide a reason for this action.
                </p>
              </div>

              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-500 text-white rounded-lg hover:from-yellow-700 hover:to-orange-600 transition font-medium shadow"
                >
                  Yes, Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Comment Modal */}
        {isDeleteModalOpen && labourToDelete && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl font-bold">Request Labour Deletion</h2>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-gray-700 mb-2">
                    You are requesting to delete: <span className="font-bold text-gray-900">{labourToDelete.name}</span>
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    This request will be sent to the admin for approval.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Deletion <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={deleteComment}
                    onChange={(e) => setDeleteComment(e.target.value)}
                    placeholder="Please provide a reason why you want to delete this labour..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows="4"
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Comment View Modal */}
        {isAdminCommentModalOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl font-bold">Admin Rejection Comment</h2>
                <button
                  onClick={() => setIsAdminCommentModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-700 text-sm mb-2 font-semibold">Reason for Rejection:</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 whitespace-pre-wrap">{selectedAdminComment}</p>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
                <button
                  onClick={() => setIsAdminCommentModalOpen(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        </main>
      </div>
      </div>
  <Footer bgColor={themeColors.footerBg} />
    </div>
  );
}

export default UnitData;
