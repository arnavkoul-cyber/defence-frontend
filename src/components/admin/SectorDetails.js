import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { toast } from 'react-toastify';
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
                          <td className="px-6 py-3 text-sm font-semibold">{unit.name}</td>
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
