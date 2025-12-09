import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../api/api';
import { toast } from 'react-toastify';
import { FiEye, FiDownload } from 'react-icons/fi';
import noPhoto from '../../assets/no_photo.png';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const SectorDetails = ({ sector, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [labours, setLabours] = useState([]);
  const [armyUnits, setArmyUnits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [laboursPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalLabours: 0,
    assignedLabours: 0,
    unassignedLabours: 0,
    totalArmyUnits: 0,
    laboursByType: {},
    laboursByArmyUnit: {},
  });
  
  // Labour details modal state
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [selectedUnitData, setSelectedUnitData] = useState(null);
  const [labourLoading, setLabourLoading] = useState(false);
  const [labourModalPage, setLabourModalPage] = useState(1);
  const [laboursPerPageModal] = useState(10);
  
  // Attendance calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedLabourForCalendar, setSelectedLabourForCalendar] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  
  // Individual labour details modal state
  const [showLabourDetailsModal, setShowLabourDetailsModal] = useState(false);
  const [selectedLabourDetails, setSelectedLabourDetails] = useState(null);
  const [labourDetailsLoading, setLabourDetailsLoading] = useState(false);

  useEffect(() => {
    fetchSectorData();
  }, [sector]);

  const fetchSectorData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Fetch sector details using the new API
      const response = await api.post(
        '/sectors/details',
        { sector_id: sector.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const data = response?.data?.data || {};
      const sectorLabours = data.labourers || [];
      const statistics = data.statistics || {};
      
      // Fetch army units with personnel and mobile numbers
      const unitsRes = await api.get(`/army-units/by-sector-with-personnel?sector_id=${sector.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const sectorUnits = unitsRes?.data?.army_units || [];
      
      setLabours(sectorLabours);
      setArmyUnits(sectorUnits);
      
      // Group by labour type
      const byType = {};
      sectorLabours.forEach(l => {
        const type = l.labour_type || 'Unknown';
        byType[type] = (byType[type] || 0) + 1;
      });
      
      // Group by army unit
      const byUnit = {};
      sectorLabours.forEach(l => {
        if (l.army_unit_name) {
          byUnit[l.army_unit_name] = (byUnit[l.army_unit_name] || 0) + 1;
        }
      });
      
      setStats({
        totalLabours: statistics.total_labours || 0,
        assignedLabours: statistics.assigned_labours || 0,
        unassignedLabours: statistics.unassigned_labours || 0,
        totalArmyUnits: sectorUnits.length,
        laboursByType: byType,
        laboursByArmyUnit: byUnit,
      });
      
    } catch (err) {
      toast.error('Failed to fetch sector data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str) => {
    if (!str || typeof str !== 'string') return str ?? '-';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Fetch labour details for army unit
  const handleViewLabours = async (unit) => {
    setLabourLoading(true);
    setShowLabourModal(true);
    setSelectedUnitData(null);
    setLabourModalPage(1);
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
        ['Sector:', sector.name],
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
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // Group dates by month
  const groupDatesByMonth = (dates) => {
    const monthGroups = {};
    
    dates.forEach(date => {
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          name: monthName,
          dates: [],
          year: date.getFullYear(),
          month: date.getMonth()
        };
      }
      
      monthGroups[monthKey].dates.push(date);
    });
    
    return Object.values(monthGroups);
  };

  // Check if attendance is marked for a specific date
  const isAttendanceMarked = (date) => {
    if (!date || isNaN(date.getTime())) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return attendanceDetails.some(record => {
      if (!record || !record.date) return false;
      try {
        const recordDate = new Date(record.date);
        if (isNaN(recordDate.getTime())) return false;
        return recordDate.toISOString().split('T')[0] === dateStr;
      } catch (err) {
        return false;
      }
    });
  };

  // Handle viewing individual labour details
  const handleViewLabourDetails = async (labour) => {
    setShowLabourDetailsModal(true);
    setLabourDetailsLoading(true);
    setSelectedLabourDetails(null);

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      setSelectedLabourDetails(labour);
      setLabourDetailsLoading(false);
    }, 300);
  };

  const handleCloseLabourDetailsModal = () => {
    setShowLabourDetailsModal(false);
    setSelectedLabourDetails(null);
    setLabourDetailsLoading(false);
  };

  // Chart Data
  const assignmentChartData = {
    labels: ['Assigned', 'Unassigned'],
    datasets: [
      {
        label: 'Labour Assignment Status',
        data: [stats.assignedLabours, stats.unassignedLabours],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderColor: ['#059669', '#d97706'],
        borderWidth: 1,
      },
    ],
  };

  const labourTypeChartData = {
    labels: Object.keys(stats.laboursByType),
    datasets: [
      {
        label: 'Labours by Type',
        data: Object.values(stats.laboursByType),
        backgroundColor: [
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
          '#f59e0b',
          '#10b981',
          '#06b6d4',
        ],
        borderWidth: 1,
      },
    ],
  };

  const armyUnitChartData = {
    labels: Object.keys(stats.laboursByArmyUnit),
    datasets: [
      {
        label: 'Labours per Army Unit',
        data: Object.values(stats.laboursByArmyUnit),
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // Pagination logic for labours
  const indexOfLastLabour = currentPage * laboursPerPage;
  const indexOfFirstLabour = indexOfLastLabour - laboursPerPage;
  const currentLabours = labours.slice(indexOfFirstLabour, indexOfLastLabour);
  const totalPages = Math.ceil(labours.length / laboursPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-2xl font-bold">Sector Details: {sector.name}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 font-semibold">Loading sector data...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                <div className="text-sm font-semibold opacity-90">Total Labours</div>
                <div className="text-4xl font-bold mt-2">{stats.totalLabours}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                <div className="text-sm font-semibold opacity-90">Assigned</div>
                <div className="text-4xl font-bold mt-2">{stats.assignedLabours}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                <div className="text-sm font-semibold opacity-90">Unassigned</div>
                <div className="text-4xl font-bold mt-2">{stats.unassignedLabours}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                <div className="text-sm font-semibold opacity-90">Army Units</div>
                <div className="text-4xl font-bold mt-2">{stats.totalArmyUnits}</div>
              </div>
            </div>

            {/* Charts */}
            {stats.totalLabours > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment Status Pie Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-md">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Assignment Status</h3>
                  <div style={{ height: '300px' }}>
                    <Pie data={assignmentChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Labour Type Distribution */}
                {Object.keys(stats.laboursByType).length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Labours by Type</h3>
                    <div style={{ height: '300px' }}>
                      <Pie data={labourTypeChartData} options={chartOptions} />
                    </div>
                  </div>
                )}

                {/* Labours per Army Unit */}
                {Object.keys(stats.laboursByArmyUnit).length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-md lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Labours per Army Unit</h3>
                    <div style={{ height: '300px' }}>
                      <Bar data={armyUnitChartData} options={chartOptions} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Army Units List */}
            {armyUnits.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                  <h3 className="text-lg font-bold text-blue-800">Army Units in this Sector</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">S.No</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Army Unit Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Assigned Labours</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Officer Mobile Numbers</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {armyUnits.map((unit, idx) => (
                        <tr key={unit.id} className="hover:bg-blue-50">
                          <td className="px-4 py-3 text-sm">{idx + 1}</td>
                          <td className="px-6 py-3 text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <span>{unit.name}</span>
                            <button
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-all"
                              title="View Labourers"
                              onClick={() => handleViewLabours(unit)}
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-all"
                              title="Download Summary Report"
                              onClick={() => handleDownloadSummary(unit)}
                            >
                              <FiDownload size={18} />
                            </button>
                          </div>
                        </td>
                          <td className="px-6 py-3 text-sm">
                            {stats.laboursByArmyUnit[unit.name] || 0}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {unit.mobile_numbers && unit.mobile_numbers.length > 0 ? (
                              <div className="space-y-1">
                                {unit.mobile_numbers.map((number, mobileIdx) => (
                                  <div key={mobileIdx} className="flex items-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                                      📱 {number}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">No mobile numbers</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Labours List */}
            {labours.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                  <h3 className="text-lg font-bold text-blue-800">All Labours in this Sector</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">S.No</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Father Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Labour Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Army Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentLabours.map((labour, idx) => (
                        <tr key={labour.id} className="hover:bg-blue-50">
                          <td className="px-4 py-3 text-sm">{indexOfFirstLabour + idx + 1}</td>
                          <td className="px-6 py-3 text-sm font-semibold">{capitalize(labour.name)}</td>
                          <td className="px-6 py-3 text-sm">{capitalize(labour.father_name)}</td>
                          <td className="px-6 py-3 text-sm">{labour.contact_number}</td>
                          <td className="px-6 py-3 text-sm">{labour.labour_type || '-'}</td>
                          <td className="px-6 py-3 text-sm">{labour.army_unit_name || '-'}</td>
                          <td className="px-6 py-3 text-sm">{formatDate(labour.start_date)}</td>
                          <td className="px-6 py-3 text-sm">{formatDate(labour.end_date)}</td>
                          <td className="px-6 py-3 text-sm">
                            {labour.duration_days ? (
                              <span className="font-semibold text-blue-600">{labour.duration_days} days</span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {labour.status === 'active' || labour.army_unit_name ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                {labour.status === 'active' ? 'Active' : 'Assigned'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <button
                              onClick={() => handleViewLabourDetails(labour)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                              title="View Full Details"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{indexOfFirstLabour + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(indexOfLastLabour, labours.length)}</span> of{' '}
                          <span className="font-medium">{labours.length}</span> labours
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Prev
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
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
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-md p-8 text-center">
                <p className="text-gray-500 font-semibold">No labours assigned to this sector yet.</p>
              </div>
            )}
          </div>
        )}

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
                  <>
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
                          <th className="px-4 py-4 text-left text-xs font-extrabold text-blue-900 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {selectedUnitData.labourers
                          .slice(
                            (labourModalPage - 1) * laboursPerPageModal,
                            labourModalPage * laboursPerPageModal
                          )
                          .map((labour, idx) => (
                          <tr key={labour.id} className="hover:bg-blue-50 transition-all duration-200 hover:shadow-sm">
                            <td className="px-4 py-4 text-sm font-bold text-gray-700">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                                {(labourModalPage - 1) * laboursPerPageModal + idx + 1}
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
                              </button>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {labour.start_date ? formatDate(labour.start_date) : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {labour.end_date ? formatDate(labour.end_date) : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {labour.assigned_date ? formatDate(labour.assigned_date) : 
                                labour.created_at ? formatDate(labour.created_at) : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <button
                                onClick={() => handleViewLabourDetails(labour)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm"
                                title="View Full Details"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {selectedUnitData.labourers.length > laboursPerPageModal && (
                    <div className="flex justify-center items-center mt-6 space-x-2 flex-wrap">
                      <button
                        className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-bold disabled:opacity-50 hover:bg-blue-200 transition-colors"
                        onClick={() => setLabourModalPage(labourModalPage - 1)}
                        disabled={labourModalPage === 1}
                      >
                        Previous
                      </button>
                      
                      {/* Show first page */}
                      {labourModalPage > 3 && (
                        <>
                          <button
                            className="px-3 py-2 rounded-lg font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            onClick={() => setLabourModalPage(1)}
                          >
                            1
                          </button>
                          <span className="px-2 text-gray-500">...</span>
                        </>
                      )}
                      
                      {/* Show pages around current */}
                      {Array.from(
                        { length: Math.ceil(selectedUnitData.labourers.length / laboursPerPageModal) },
                        (_, i) => i + 1
                      )
                        .filter(p => p >= labourModalPage - 2 && p <= labourModalPage + 2)
                        .map(p => (
                          <button
                            key={p}
                            className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                              labourModalPage === p
                                ? 'bg-blue-700 text-white'
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                            onClick={() => setLabourModalPage(p)}
                          >
                            {p}
                          </button>
                        ))}
                      
                      {/* Show last page */}
                      {labourModalPage < Math.ceil(selectedUnitData.labourers.length / laboursPerPageModal) - 2 && (
                        <>
                          <span className="px-2 text-gray-500">...</span>
                          <button
                            className="px-3 py-2 rounded-lg font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            onClick={() => setLabourModalPage(Math.ceil(selectedUnitData.labourers.length / laboursPerPageModal))}
                          >
                            {Math.ceil(selectedUnitData.labourers.length / laboursPerPageModal)}
                          </button>
                        </>
                      )}
                      
                      <button
                        className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-bold disabled:opacity-50 hover:bg-blue-200 transition-colors"
                        onClick={() => setLabourModalPage(labourModalPage + 1)}
                        disabled={labourModalPage === Math.ceil(selectedUnitData.labourers.length / laboursPerPageModal)}
                      >
                        Next
                      </button>
                      
                      <div className="ml-4 text-sm text-gray-600 font-semibold">
                        Showing {(labourModalPage - 1) * laboursPerPageModal + 1} to{' '}
                        {Math.min(labourModalPage * laboursPerPageModal, selectedUnitData.labourers.length)} of{' '}
                        {selectedUnitData.labourers.length} labourers
                      </div>
                    </div>
                  )}
                </>
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

                    {/* Calendar Grids by Month */}
                    {(() => {
                      const allDates = generateCalendarDates(
                        selectedLabourForCalendar.start_date,
                        selectedLabourForCalendar.end_date
                      );
                      const monthGroups = groupDatesByMonth(allDates);

                      return monthGroups.map((monthGroup, monthIdx) => (
                        <div key={monthIdx} className="mb-8">
                          {/* Month Header */}
                          <h4 className="text-xl font-extrabold text-indigo-900 mb-4 text-center bg-indigo-50 py-2 rounded-lg">
                            {monthGroup.name}
                          </h4>
                          
                          <div className="grid grid-cols-7 gap-2">
                            {/* Day headers */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-center font-bold text-indigo-900 py-2 text-sm">
                                {day}
                              </div>
                            ))}

                            {/* Calendar dates */}
                            {(() => {
                              const firstDate = monthGroup.dates[0];
                              const startDay = firstDate.getDay();
                              const emptyCells = Array(startDay).fill(null);

                              return [...emptyCells, ...monthGroup.dates].map((date, idx) => {
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
                        </div>
                      ));
                    })()}

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

        {/* Individual Labour Details Modal */}
        {showLabourDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative animate-fadeIn">
              <div className="sticky top-0 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white p-6 shadow-lg z-10">
                <button
                  className="absolute top-4 right-4 text-white hover:text-gray-200 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all duration-200 transform hover:scale-110"
                  onClick={handleCloseLabourDetailsModal}
                  aria-label="Close modal"
                >
                  &times;
                </button>
                <div className="pr-12">
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center gap-3">
                    👤 Labour Details
                  </h3>
                  <p className="text-white/90 text-sm">
                    {labourDetailsLoading ? 'Loading...' : selectedLabourDetails ? `Complete information for ${capitalize(selectedLabourDetails.name)}` : 'Labour Information'}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-b from-gray-50 to-white overflow-y-auto max-h-[calc(90vh-150px)]">
                {labourDetailsLoading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-700 shadow-lg"></div>
                    <p className="mt-6 text-gray-600 font-semibold text-lg">Loading complete labour details...</p>
                  </div>
                ) : !selectedLabourDetails ? (
                  <div className="text-center py-16 bg-red-50 rounded-xl border-2 border-red-200">
                    <div className="text-red-600 font-bold text-xl">Failed to load labour details</div>
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Photo Section */}
                  <div className="md:col-span-2 flex justify-center">
                    <div className="relative">
                      <img
                        src={selectedLabourDetails.photo_path ? getImageUrl(selectedLabourDetails.photo_path) : noPhoto}
                        alt={selectedLabourDetails.name}
                        className="w-40 h-40 rounded-full object-cover border-4 border-blue-300 shadow-lg"
                        onError={(e) => { e.currentTarget.src = noPhoto; }}
                      />
                      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                        <span className="text-white text-2xl">✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-100">
                    <h4 className="text-lg font-bold text-blue-800 mb-3 border-b pb-2">📝 Personal Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Name</label>
                        <p className="text-sm font-bold text-gray-900">{capitalize(selectedLabourDetails.name) || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Father's Name</label>
                        <p className="text-sm font-bold text-gray-900">{capitalize(selectedLabourDetails.father_name) || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Contact Number</label>
                        <p className="text-sm font-bold text-blue-600">📞 {selectedLabourDetails.contact_number || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Labour Type</label>
                        <p className="text-sm font-bold">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            selectedLabourDetails.labour_type === 'porter' ? 'bg-green-100 text-green-800' :
                            selectedLabourDetails.labour_type === 'pony' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedLabourDetails.labour_type ? capitalize(selectedLabourDetails.labour_type) : '-'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Identity Documents */}
                  <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-100">
                    <h4 className="text-lg font-bold text-blue-800 mb-3 border-b pb-2">🎫 Identity Documents</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Aadhaar Number</label>
                        <p className="text-sm font-mono font-bold text-gray-900">{selectedLabourDetails.aadhaar_number || selectedLabourDetails.adhar_number || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">PAN Card Number</label>
                        <p className="text-sm font-mono font-bold text-gray-900">{selectedLabourDetails.pan_card_number || selectedLabourDetails.pan_number || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Aadhaar Photo</label>
                        {(selectedLabourDetails.aadhaar_photo_path || selectedLabourDetails.adhar_path) ? (
                          <img
                            src={getImageUrl(selectedLabourDetails.aadhaar_photo_path || selectedLabourDetails.adhar_path)}
                            alt="Aadhaar"
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all"
                            onClick={() => window.open(getImageUrl(selectedLabourDetails.aadhaar_photo_path || selectedLabourDetails.adhar_path), '_blank')}
                          />
                        ) : (
                          <p className="text-sm text-gray-400 italic">No photo available</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">PAN Card Photo</label>
                        {(selectedLabourDetails.pan_card_photo_path || selectedLabourDetails.pan_path) ? (
                          <img
                            src={getImageUrl(selectedLabourDetails.pan_card_photo_path || selectedLabourDetails.pan_path)}
                            alt="PAN Card"
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-all"
                            onClick={() => window.open(getImageUrl(selectedLabourDetails.pan_card_photo_path || selectedLabourDetails.pan_path), '_blank')}
                          />
                        ) : (
                          <p className="text-sm text-gray-400 italic">No photo available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assignment Details */}
                  <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-100">
                    <h4 className="text-lg font-bold text-blue-800 mb-3 border-b pb-2">🎯 Assignment Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Army Unit</label>
                        <p className="text-sm font-bold text-gray-900">{selectedLabourDetails.army_unit_name || 'Not Assigned'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Sector</label>
                        <p className="text-sm font-bold text-gray-900">{sector.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Status</label>
                        <p className="text-sm font-bold">
                          {selectedLabourDetails.status === 'active' || selectedLabourDetails.army_unit_name ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              {selectedLabourDetails.status === 'active' ? 'Active' : 'Assigned'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              Unassigned
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Duration Details */}
                  <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-100">
                    <h4 className="text-lg font-bold text-blue-800 mb-3 border-b pb-2">📅 Duration Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Start Date</label>
                        <p className="text-sm font-bold text-gray-900">{formatDate(selectedLabourDetails.start_date)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">End Date</label>
                        <p className="text-sm font-bold text-gray-900">{formatDate(selectedLabourDetails.end_date)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase block">Duration</label>
                        <p className="text-sm font-bold text-blue-600">
                          {selectedLabourDetails.duration_days ? `${selectedLabourDetails.duration_days} days` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(selectedLabourDetails.remarks || selectedLabourDetails.created_at) && (
                    <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-md border-2 border-blue-100">
                      <h4 className="text-lg font-bold text-blue-800 mb-3 border-b pb-2">📌 Additional Information</h4>
                      <div className="space-y-3">
                        {selectedLabourDetails.remarks && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase block">Remarks</label>
                            <p className="text-sm text-gray-900">{selectedLabourDetails.remarks}</p>
                          </div>
                        )}
                        {selectedLabourDetails.created_at && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase block">Created At</label>
                            <p className="text-sm text-gray-900">{formatDate(selectedLabourDetails.created_at)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end rounded-b-2xl border-t">
                <button
                  onClick={handleCloseLabourDetailsModal}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end rounded-b-xl border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectorDetails;
