import { FiTrash2, FiEye, FiDownload, FiX } from 'react-icons/fi';

import React, { useEffect, useState } from 'react';
import api, { getImageUrl } from '../../api/api';
import Header from '../Header';
import Footer from '../footer';
import AdminSidebar from './AdminSidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import noPhoto from '../../assets/no_photo.png';

const ArmyUnitsList = () => {
  // Manual refresh handler
  const handleRefresh = async () => {
    await fetchData();
    setPage(1);
  };
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const handleSidebarToggle = () => setSidebarOpen((prev) => !prev);
  // Responsive: close sidebar on resize to mobile, open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  
  // Labour details modal state
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [selectedUnitData, setSelectedUnitData] = useState(null);
  const [labourLoading, setLabourLoading] = useState(false);
  
  // Search state
  const [searchUnitName, setSearchUnitName] = useState('');
  const [searchSectorName, setSearchSectorName] = useState('');
  const [filteredUnits, setFilteredUnits] = useState([]);
  
  // Attendance calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedLabourForCalendar, setSelectedLabourForCalendar] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  // Delete handler
  const handleDeleteArmyUnit = (unit) => {
    setUnitToDelete(unit);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!unitToDelete) return;
    setIsConfirmDeleteOpen(false);
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      await api.delete(`/army-units/id/${unitToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Army unit deleted successfully!');
      setTimeout(async () => {
        const [unitsRes, sectorsRes] = await Promise.all([
          api.get(`/army-units?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/sectors?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setArmyUnits(unitsRes.data.army_units || []);
        setSectors(sectorsRes.data.data || sectorsRes.data.sectors || []);
        setLoading(false);
        setUnitToDelete(null);
      }, 500);
    } catch (err) {
      let errorMsg = 'Failed to delete army unit.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      toast.error(errorMsg);
      setLoading(false);
      setUnitToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setUnitToDelete(null);
  };
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        // Fetch all army units for admin
        const [unitsRes, sectorsRes] = await Promise.all([
          api.get(`/army-units?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/sectors?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setArmyUnits(unitsRes.data.army_units || []);
        setSectors(sectorsRes.data.data || sectorsRes.data.sectors || []);
      } catch (err) {
        setError('Failed to fetch army units or sectors');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getSectorName = (sector_id) => {
    const sector = sectors.find(s => String(s.id) === String(sector_id));
    return sector ? sector.name : `Sector ${sector_id}`;
  };

  // Filter army units based on search
  useEffect(() => {
    let filtered = armyUnits;

    if (searchUnitName.trim()) {
      filtered = filtered.filter(unit =>
        unit.name.toLowerCase().includes(searchUnitName.toLowerCase())
      );
    }

    if (searchSectorName.trim()) {
      filtered = filtered.filter(unit => {
        const sectorName = getSectorName(unit.sector_id);
        return sectorName.toLowerCase().includes(searchSectorName.toLowerCase());
      });
    }

    setFilteredUnits(filtered);
    setPage(1); // Reset to first page when search changes
  }, [armyUnits, searchUnitName, searchSectorName, sectors]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUnits.length / LIMIT);
  const paginatedUnits = filteredUnits.slice((page - 1) * LIMIT, page * LIMIT);

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
      toast.success('Army unit added successfully!');
      setShowModal(false);
          toast.error(data.error ? data.error : "Failed to delete army unit.");
      setLoading(true);
      setTimeout(async () => {
        try {
          const [unitsRes, sectorsRes] = await Promise.all([
            api.get(`/army-units?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } }),
            api.get(`/sectors?t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          setArmyUnits(unitsRes.data.army_units || []);
          setSectors(sectorsRes.data.data || sectorsRes.data.sectors || []);
        } catch (err) {
          toast.error('Failed to refresh list after adding.');
        }
        setLoading(false);
      }, 500);
    } catch (err) {
      let errorMsg = 'Failed to add army unit.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setAddError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setAddLoading(false);
    }
  };

  // Fetch labour details for army unit
  const handleViewLabours = async (unit) => {
    setLabourLoading(true);
    setShowLabourModal(true);
    setSelectedUnitData(null);
    try {
      const [labourRes, attendanceRes] = await Promise.all([
        api.get(`/labour/army-unit/${unit.id}`),
        api.get(`/attendance/report/range`, {
          params: {
            start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
            end_date: new Date().toISOString().split('T')[0], // Today
            army_unit_id: unit.id,
          },
        }).catch(() => ({ data: { report: [] } })) // Fallback if attendance API fails
      ]);

      const labourData = labourRes.data;
      const attendanceData = attendanceRes.data.report || [];

      // Create a map of labour_id to working_days
      const attendanceMap = {};
      attendanceData.forEach(record => {
        attendanceMap[record.labour_id] = record.working_days || 0;
      });

      // Add attendance to each labourer
      const laboursWithAttendance = (labourData.labourers || []).map(labour => ({
        ...labour,
        working_days: attendanceMap[labour.id] || 0
      }));

      setSelectedUnitData({
        unit,
        ...labourData,
        labourers: laboursWithAttendance
      });
    } catch (err) {
      toast.error('Failed to fetch labour details');
      console.error(err);
      setSelectedUnitData({
        unit,
        total_labourers: 0,
        labourers: [],
        type_breakdown: {},
        error: 'Failed to load data'
      });
    } finally {
      setLabourLoading(false);
    }
  };

  const handleCloseLabourModal = () => {
    setShowLabourModal(false);
    setSelectedUnitData(null);
  };

  // Handle opening calendar modal for a specific labourer
  const handleOpenCalendar = async (labour) => {
    setSelectedLabourForCalendar(labour);
    setShowCalendarModal(true);
    setCalendarLoading(true);
    setAttendanceDetails([]);

    try {
      // Fetch attendance details for this specific labourer
      const res = await api.get(`/attendance/labour/${labour.id}`);
      setAttendanceDetails(res.data.attendances || []);
    } catch (err) {
      console.error('Failed to fetch attendance details', err);
      setAttendanceDetails([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleCloseCalendar = () => {
    setShowCalendarModal(false);
    setSelectedLabourForCalendar(null);
    setAttendanceDetails([]);
  };

  // Generate calendar dates between start and end date
  const generateCalendarDates = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // Check if attendance is marked for a specific date
  const isAttendanceMarked = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceDetails.some(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr;
    });
  };

  // Download summary report for army unit
  const handleDownloadSummary = async (unit) => {
    try {
      const res = await api.get(`/labour/army-unit/${unit.id}`);
      const data = res.data;
      
      // Create CSV content
      const headers = ['S.No', 'Name', 'Father Name', 'Contact', 'Type', 'Aadhaar', 'Working Days', 'Start Date', 'End Date', 'Assigned Date'];
      const rows = (data.labourers || []).map((labour, idx) => [
        idx + 1,
        labour.name || '-',
        labour.father_name || '-',
        labour.contact_number || '-',
        labour.labour_type || '-',
        labour.aadhaar_number || '-',
        labour.working_days || 0,
        labour.start_date ? new Date(labour.start_date).toLocaleDateString('en-GB') : '-',
        labour.end_date ? new Date(labour.end_date).toLocaleDateString('en-GB') : '-',
        labour.assigned_date ? new Date(labour.assigned_date).toLocaleDateString('en-GB') : 
          labour.created_at ? new Date(labour.created_at).toLocaleDateString('en-GB') : '-'
      ]);

      // Add summary header
      const summaryInfo = [
        ['Army Unit Summary Report'],
        [''],
        ['Army Unit Name:', unit.name],
        ['Sector:', getSectorName(unit.sector_id)],
        ['Total Labourers:', data.total_labourers || 0],
        ['Report Period:', `${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} (Current Month)`],
        [''],
        ['Type Breakdown:'],
      ];

      if (data.type_breakdown) {
        Object.entries(data.type_breakdown).forEach(([type, count]) => {
          summaryInfo.push([`  ${type.charAt(0).toUpperCase() + type.slice(1)}:`, count]);
        });
      }

      if (data.officer) {
        summaryInfo.push([''], ['Officer:', `${data.officer.role} (${data.officer.mobile})`]);
      }

      if (data.assign_dates) {
        summaryInfo.push(['']);
        if (data.assign_dates.first_assigned) {
          summaryInfo.push(['First Assigned:', new Date(data.assign_dates.first_assigned).toLocaleDateString('en-GB')]);
        }
        if (data.assign_dates.last_assigned) {
          summaryInfo.push(['Last Assigned:', new Date(data.assign_dates.last_assigned).toLocaleDateString('en-GB')]);
        }
      }

      summaryInfo.push([''], ['Generated on:', new Date().toLocaleString('en-GB')]);
      summaryInfo.push([''], ['Labourers Details:'], []);

      // Combine summary + table
      const csvContent = [
        ...summaryInfo.map(row => row.join(',')),
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${unit.name.replace(/\s+/g, '_')}_Summary_Report.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Summary report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download summary report');
      console.error(err);
    }
  };

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
          <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mt-2 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-blue-800">Army Units List</h2>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow flex items-center text-base"
                  onClick={handleRefresh}
                  title="Refresh Army Units List"
                >
                  &#x21bb; Refresh
                </button>
                <button
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow flex items-center text-base"
                  onClick={handleOpenModal}
                >
                  <span className="text-xl mr-2">+</span> Army Unit
                </button>
              </div>
            </div>

            {/* Search Filters */}
            <div className="w-full mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-2">Search by Army Unit Name</label>
                <input
                  type="text"
                  value={searchUnitName}
                  onChange={(e) => setSearchUnitName(e.target.value)}
                  placeholder="Enter army unit name..."
                  className="w-full border border-blue-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-2">Search by Sector Name</label>
                <input
                  type="text"
                  value={searchSectorName}
                  onChange={(e) => setSearchSectorName(e.target.value)}
                  placeholder="Enter sector name..."
                  className="w-full border border-blue-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Search Results Info */}
            {(searchUnitName || searchSectorName) && (
              <div className="w-full mb-4 flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-800 font-semibold">
                  Showing {filteredUnits.length} of {armyUnits.length} army units
                </span>
                {(searchUnitName || searchSectorName) && (
                  <button
                    onClick={() => {
                      setSearchUnitName('');
                      setSearchSectorName('');
                    }}
                    className="text-sm text-red-600 hover:text-red-800 font-semibold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Add Army Unit Modal */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-md relative my-8 max-h-[90vh] overflow-y-auto">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
                    onClick={handleCloseModal}
                  >
                    &times;
                  </button>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-blue-800 pr-8">Add Army Unit</h3>
                  {addError && <div className="mb-2 text-red-600 font-semibold text-sm">{addError}</div>}
                  {addSuccess && <div className="mb-2 text-green-600 font-semibold text-sm">{addSuccess}</div>}
                  <div className="mb-4">
                    <label className="block text-blue-800 font-semibold mb-1 text-sm">Army Unit Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newUnit.name}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter army unit name"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-blue-800 font-semibold mb-1 text-sm">Choose Sector</label>
                    <select
                      name="sector_id"
                      value={newUnit.sector_id}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      size="8"
                      style={{ height: '200px', overflowY: 'scroll' }}
                    >
                      <option value="" className="py-2 hover:bg-blue-50">Select sector</option>
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id} className="py-2 px-2 hover:bg-blue-50 cursor-pointer">
                          {sector.name || `Sector ${sector.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow text-sm sm:text-base"
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
                    <th className="px-6 py-3 text-center text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500 font-semibold">Loading...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-red-500 font-semibold">{error}</td>
                    </tr>
                  ) : paginatedUnits.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 font-semibold">No army units to display yet.</td>
                    </tr>
                  ) : (
                    paginatedUnits.map((unit, idx) => (
                      <tr key={unit.id} className="transition-colors duration-150 hover:bg-blue-50">
                        <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900 border-b border-blue-100">{(page - 1) * LIMIT + idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100">
                          {unit.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100">{getSectorName(unit.sector_id)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100 text-center">
                          <button
                            className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                            title="Delete Army Unit"
                            onClick={() => handleDeleteArmyUnit(unit)}
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

      {/* Labour Details Modal */}
      {showLabourModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative animate-fadeIn">
            <div className="sticky top-0 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white p-6 shadow-lg z-10">
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-200 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all duration-200 transform hover:scale-110"
                onClick={handleCloseLabourModal}
                aria-label="Close modal"
              >
                &times;
              </button>
              <div className="pr-12">
                <h3 className="text-2xl md:text-3xl font-extrabold mb-3 flex items-center gap-3">
                  <span className="bg-white/20 p-2 rounded-lg">
                    <FiEye className="w-6 h-6" />
                  </span>
                  {selectedUnitData?.unit?.name || 'Army Unit'} - Labour Details
                </h3>
                {selectedUnitData && !labourLoading && (
                  <div className="flex flex-wrap gap-3 text-sm mt-4">
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 backdrop-blur-sm px-4 py-2 rounded-lg border border-emerald-300 shadow-lg">
                      <span className="font-bold text-white">Total Labourers:</span>{' '}
                      <span className="font-extrabold text-lg text-white">{selectedUnitData.total_labourers || 0}</span>
                    </div>
                    {selectedUnitData.type_breakdown && Object.keys(selectedUnitData.type_breakdown).length > 0 && (
                      <div className="bg-gradient-to-br from-purple-400 to-purple-500 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-300 shadow-lg flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">Types:</span>
                        {Object.entries(selectedUnitData.type_breakdown).map(([type, count]) => (
                          <span key={type} className="bg-white/90 px-2 py-1 rounded-md font-semibold text-sm text-purple-700">
                            {type.charAt(0).toUpperCase() + type.slice(1)}: <span className="font-bold">{count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedUnitData.officer && (
                      <div className="bg-gradient-to-br from-orange-400 to-orange-500 backdrop-blur-sm px-4 py-2 rounded-lg border border-orange-300 shadow-lg">
                        <span className="font-bold text-white">Officer:</span>{' '}
                        <span className="font-semibold text-white">{selectedUnitData.officer.role}</span> <span className="text-white/90">({selectedUnitData.officer.mobile})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gradient-to-b from-gray-50 to-white overflow-y-auto max-h-[calc(90vh-200px)]">
              {labourLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-700 shadow-lg"></div>
                  <p className="mt-6 text-gray-600 font-semibold text-lg">Loading labour details...</p>
                </div>
              ) : selectedUnitData?.error ? (
                <div className="text-center py-16 bg-red-50 rounded-xl border-2 border-red-200">
                  <div className="text-red-600 font-bold text-xl">{selectedUnitData.error}</div>
                </div>
              ) : !selectedUnitData?.labourers || selectedUnitData.labourers.length === 0 ? (
                <div className="text-center py-16 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="text-gray-500 font-semibold text-lg">No labourers assigned to this army unit yet.</div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-100 to-blue-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">S.No</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Photo</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Father Name</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Contact</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Aadhaar</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Working Days</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Start Date</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">End Date</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Assigned Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {selectedUnitData.labourers.map((labour, idx) => (
                        <tr key={labour.id} className="hover:bg-blue-50 transition-all duration-200 hover:shadow-sm">
                          <td className="px-4 py-4 text-sm font-bold text-gray-700">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                              {idx + 1}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="relative">
                              <img
                                src={labour.photo_path ? getImageUrl(labour.photo_path) : noPhoto}
                                alt={labour.name}
                                className="w-14 h-14 rounded-full object-cover border-3 border-blue-300 shadow-md hover:scale-110 transition-transform duration-200"
                                onError={(e) => { e.currentTarget.src = noPhoto; }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-900">
                            {labour.name ? labour.name.charAt(0).toUpperCase() + labour.name.slice(1) : '-'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                            {labour.father_name ? labour.father_name.charAt(0).toUpperCase() + labour.father_name.slice(1) : '-'}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-700">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">📞</span>
                              {labour.contact_number || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full shadow-sm border-2 ${
                              labour.labour_type === 'porter' ? 'bg-green-50 text-green-700 border-green-300' :
                              labour.labour_type === 'pony' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                              'bg-gray-50 text-gray-700 border-gray-300'
                            }`}>
                              {labour.labour_type ? labour.labour_type.charAt(0).toUpperCase() + labour.labour_type.slice(1) : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-gray-700">{labour.aadhaar_number || '-'}</td>
                          <td className="px-4 py-4 text-sm font-bold text-center">
                            <button
                              onClick={() => handleOpenCalendar(labour)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-300 hover:from-indigo-100 hover:to-indigo-200 transition-all cursor-pointer"
                              title="View Attendance Calendar"
                            >
                              <span className="text-indigo-600">📊</span>
                              <span className="text-indigo-800 font-extrabold">{labour.working_days || 0}</span>
                              <span className="text-indigo-600 text-xs">days</span>
                            </button>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">📅</span>
                              {labour.start_date ? new Date(labour.start_date).toLocaleDateString('en-GB') : '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-red-500">📅</span>
                              {labour.end_date ? new Date(labour.end_date).toLocaleDateString('en-GB') : '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500">📅</span>
                              {labour.assigned_date ? new Date(labour.assigned_date).toLocaleDateString('en-GB') : 
                               labour.created_at ? new Date(labour.created_at).toLocaleDateString('en-GB') : '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Section */}
                  {selectedUnitData.assign_dates && (
                    <div className="mt-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-6 rounded-xl border-2 border-blue-200 shadow-md">
                      <h4 className="font-extrabold text-blue-900 mb-4 text-lg flex items-center gap-2">
                        <span className="bg-blue-200 p-2 rounded-lg">📊</span>
                        Assignment Timeline
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUnitData.assign_dates.first_assigned && (
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                            <span className="font-bold text-gray-600 block text-xs uppercase tracking-wide mb-1">First Assigned</span>
                            <span className="text-blue-800 font-extrabold text-lg">
                              {new Date(selectedUnitData.assign_dates.first_assigned).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                        {selectedUnitData.assign_dates.last_assigned && (
                          <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                            <span className="font-bold text-gray-600 block text-xs uppercase tracking-wide mb-1">Last Assigned</span>
                            <span className="text-blue-800 font-extrabold text-lg">
                              {new Date(selectedUnitData.assign_dates.last_assigned).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Calendar Modal */}
      {showCalendarModal && selectedLabourForCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative animate-fadeIn">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-800 via-indigo-700 to-indigo-600 text-white p-6 shadow-lg z-10">
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-200 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all duration-200 transform hover:scale-110"
                onClick={handleCloseCalendar}
                aria-label="Close calendar"
              >
                &times;
              </button>
              <div className="pr-12">
                <h3 className="text-2xl md:text-3xl font-extrabold mb-2">
                  📅 Attendance Calendar
                </h3>
                <p className="text-white/90 text-sm">
                  {selectedLabourForCalendar.name} - Working Days: <span className="font-bold">{selectedLabourForCalendar.working_days || 0}</span>
                </p>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-b from-gray-50 to-white overflow-y-auto max-h-[calc(90vh-150px)]">
              {calendarLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-700 shadow-lg"></div>
                  <p className="mt-6 text-gray-600 font-semibold text-lg">Loading calendar...</p>
                </div>
              ) : !selectedLabourForCalendar.start_date || !selectedLabourForCalendar.end_date ? (
                <div className="text-center py-16 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                  <div className="text-yellow-700 font-bold text-lg">No start/end date assigned for this labourer</div>
                </div>
              ) : (
                <>
                  {/* Legend */}
                  <div className="mb-6 flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border-2 border-green-300">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm font-semibold text-green-800">Attendance Marked</span>
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border-2 border-red-300">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm font-semibold text-red-800">Attendance Not Marked</span>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-bold text-indigo-900 py-2 text-sm">
                        {day}
                      </div>
                    ))}

                    {/* Calendar dates */}
                    {(() => {
                      const dates = generateCalendarDates(
                        selectedLabourForCalendar.start_date,
                        selectedLabourForCalendar.end_date
                      );

                      // Add empty cells for starting day
                      const firstDate = dates[0];
                      const startDay = firstDate ? firstDate.getDay() : 0;
                      const emptyCells = Array(startDay).fill(null);

                      return [...emptyCells, ...dates].map((date, idx) => {
                        if (!date) {
                          return <div key={`empty-${idx}`} className="p-2"></div>;
                        }

                        const isMarked = isAttendanceMarked(date);
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                          <div
                            key={date.toISOString()}
                            className={`p-3 text-center rounded-lg border-2 transition-all ${
                              isMarked
                                ? 'bg-green-100 border-green-400 text-green-900'
                                : 'bg-red-100 border-red-400 text-red-900'
                            } ${isToday ? 'ring-4 ring-blue-400' : ''}`}
                            title={`${date.toLocaleDateString('en-GB')} - ${isMarked ? 'Present' : 'Absent'}`}
                          >
                            <div className="font-bold text-lg">{date.getDate()}</div>
                            <div className="text-xs mt-1">
                              {date.toLocaleDateString('en-GB', { month: 'short' })}
                            </div>
                            {isMarked && (
                              <div className="mt-1 text-xl">✓</div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 p-4 rounded-xl border-2 border-indigo-200">
                    <h4 className="font-extrabold text-indigo-900 mb-3 text-lg">Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-gray-600 block text-xs uppercase">Start Date</span>
                        <span className="text-indigo-800 font-bold">
                          {new Date(selectedLabourForCalendar.start_date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-gray-600 block text-xs uppercase">End Date</span>
                        <span className="text-indigo-800 font-bold">
                          {new Date(selectedLabourForCalendar.end_date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <span className="font-bold text-gray-600 block text-xs uppercase">Working Days</span>
                        <span className="text-green-600 font-bold text-lg">
                          {selectedLabourForCalendar.working_days || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmDeleteOpen && unitToDelete && (
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
                Are you sure you want to delete army unit <span className="font-bold text-gray-900">"{unitToDelete.name}"</span>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone. All data associated with this army unit will be affected.
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
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition font-medium shadow"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ArmyUnitsList;
