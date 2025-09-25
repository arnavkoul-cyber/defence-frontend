import React, { useEffect, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './footer';
import api from '../api/api';
import { FiUsers, FiCheckCircle, FiAlertCircle, FiDatabase, FiGrid, FiCreditCard, FiPercent, FiActivity } from 'react-icons/fi';

const StatsCard = ({ title, value, subtitle, icon, color }) => (
  <div className={`flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow transition-transform duration-200 hover:scale-105 hover:shadow-xl cursor-pointer ${color}`}>
    <div>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {subtitle ? <div className="text-xs text-gray-500 mt-1">{subtitle}</div> : null}
    </div>
    <div className={`h-10 w-10 flex items-center justify-center rounded-lg`}>{icon}</div>
  </div>
);

function Analytics() {
  const [labours, setLabours] = useState([]); // generic or assigned list
  const [armyUnits, setArmyUnits] = useState([]); // defence only
  const [sectors, setSectors] = useState([]); // defence only
  const [attendanceToday, setAttendanceToday] = useState({ present: 0, absent: 0, totalRecords: 0 }); // army only
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Example monthly registrations for line chart (replace with API data if available)
  const [monthlyRegistrations, setMonthlyRegistrations] = useState([
    { month: 'Apr', count: 2 },
    { month: 'May', count: 1 },
    { month: 'Jun', count: 0 },
    { month: 'Jul', count: 1 },
    { month: 'Aug', count: 0 },
    { month: 'Sep', count: labours.length },
  ]);

  const armyUnitId = localStorage.getItem('army_unit_id');
  const isArmyDashboard = !!armyUnitId && armyUnitId !== 'null';
  const today = new Date();
  const todayStr = new Date(today.getTime() - today.getTimezoneOffset()*60000).toISOString().slice(0,10);

  useEffect(() => {
    const init = async () => {
      if (isArmyDashboard) {
        try {
          const mobile = localStorage.getItem('mobile_number');
          const [labourRes, attendanceRes] = await Promise.all([
            api.get(`/labour/assigned/${mobile}`),
            api.get(`/attendance/army/${armyUnitId}`)
          ]);
            const assigned = labourRes.data.labours || [];
            setLabours(assigned);
            const records = (attendanceRes.data && attendanceRes.data.attendances) || [];
            // Build present set for today
            const presentSet = new Set();
            const statusMap = {}; // labour_id -> last status
            let todayCount = 0;
            records.forEach(r => {
              if (!r || !r.attendance_date) return;
              const d = new Date(r.attendance_date);
              const dStr = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
              if (dStr === todayStr) {
                todayCount++;
                statusMap[r.labour_id] = r.status; // keep last
              }
            });
            Object.entries(statusMap).forEach(([lid, st]) => { if (st === 1) presentSet.add(lid); });
            const present = presentSet.size;
            const absent = Math.max(assigned.length - present, 0);
            setAttendanceToday({ present, absent, totalRecords: todayCount });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Army analytics fetch error', e);
        }
      } else {
        try {
          const userId = localStorage.getItem('userId');
          const labRes = await api.get(`/labour/${userId}`);
          setLabours(labRes.data.labours || []);
        } catch {}
        try {
          const res = await api.get('/dynamic/army_units');
          setArmyUnits(res.data.data || []);
        } catch {}
        try {
          const res = await api.get('/dynamic/sectors');
          setSectors(res.data.data || []);
        } catch {}
      }
    };
    init();
  }, [isArmyDashboard, armyUnitId, todayStr]);

  // Defence metrics
  const assignedCount = !isArmyDashboard ? labours.filter((l) => !!l.army_unit_id).length : 0;
  const unassignedCount = !isArmyDashboard ? Math.max(labours.length - assignedCount, 0) : 0;
  const aadhaarCount = !isArmyDashboard ? labours.filter((l) => (l.aadhaar_number || '').toString().replace(/\D/g, '').length >= 12).length : 0;
  const coveragePercent = !isArmyDashboard && labours.length ? Math.round((aadhaarCount / labours.length) * 100) : 0;

  // Donut chart data (assigned/unassigned)
  const donutData = {
    labels: ['Assigned', 'Unassigned'],
    datasets: [
      {
        data: [assignedCount, unassignedCount],
        backgroundColor: ['#3b82f6', '#f59e42'],
        borderWidth: 2,
      },
    ],
  };

  // Line chart data (registrations over months)
  const lineData = {
    labels: monthlyRegistrations.map(m => m.month),
    datasets: [
      {
        label: 'Labourers Registered',
        data: monthlyRegistrations.map(m => m.count),
        fill: false,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const donutOptions = {
    plugins: {
      legend: { display: true, position: 'bottom' },
    },
    cutout: '70%',
  };

  const lineOptions = {
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { color: '#f3f4f6' } },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header bgColor="#261d1a" isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />
      {!isSidebarOpen && (
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-24 z-50 p-2 rounded-md bg-white text-blue-600 ring-1 ring-blue-300 shadow hover:bg-blue-50"
        >
          {/* open */}
          <span className="font-bold">›</span>
        </button>
      )}
      <div className="flex flex-1">
        <Sidebar bgColor="#261d1a" isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(v => !v)} />
        <main className={`flex-1 px-6 pt-2 pb-24 transition-all duration-300 ${isSidebarOpen ? 'ml-60' : 'ml-0'} mt-1`}>
          <div className="mb-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 drop-shadow-sm">{isArmyDashboard ? 'Unit Analytics' : 'Analytics'}</h2>
            <div className="mt-2 h-1.5 w-28 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"></div>
          </div>
          {!isArmyDashboard && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatsCard title="Labourers Registered" value={labours.length} icon={<FiUsers className="text-blue-600 w-5 h-5" />} color="bg-blue-50" />
                <StatsCard title="Labourers Assigned" value={assignedCount} subtitle={`${armyUnits.length} Units`} icon={<FiCheckCircle className="text-green-600 w-5 h-5" />} color="bg-green-50" />
                <StatsCard title="Unassigned Labourers (Pending)" value={unassignedCount} icon={<FiAlertCircle className="text-amber-600 w-5 h-5" />} color="bg-amber-50" />
                <StatsCard title="No of Army Units" value={armyUnits.length} icon={<FiDatabase className="text-indigo-600 w-5 h-5" />} color="bg-indigo-50" />
                <StatsCard title="Sectors" value={sectors.length} icon={<FiGrid className="text-purple-600 w-5 h-5" />} color="bg-purple-50" />
                <StatsCard title="Aadhaar Coverage" value={`${coveragePercent}%`} subtitle={`${aadhaarCount}/${labours.length}`} icon={<FiCreditCard className="text-sky-600 w-5 h-5" />} color="bg-sky-50" />
              </div>
              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-xl cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-blue-600">Labour Assignment</h3>
                  <Doughnut data={donutData} options={donutOptions} style={{ maxHeight: 260 }} />
                  <div className="mt-4 text-center">
                    <span className="font-semibold text-gray-700">Assigned: </span>
                    <span className="text-blue-600 font-bold">{assignedCount}</span>
                    <span className="mx-2">|</span>
                    <span className="font-semibold text-gray-700">Unassigned: </span>
                    <span className="text-yellow-600 font-bold">{unassignedCount}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-xl cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-green-600">Registrations Over Time</h3>
                  <Line data={lineData} options={lineOptions} style={{ maxHeight: 260 }} />
                  <div className="mt-4 text-center">
                    <span className="font-semibold text-gray-700">Total Registered: </span>
                    <span className="text-green-600 font-bold">{labours.length}</span>
                  </div>
                </div>
              </div>
            </>
          )}
          {isArmyDashboard && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatsCard title="Assigned Labourers" value={labours.length} icon={<FiUsers className="text-blue-600 w-5 h-5" />} color="bg-blue-50" />
                <StatsCard title="Present Today" value={attendanceToday.present} subtitle={todayStr} icon={<FiCheckCircle className="text-green-600 w-5 h-5" />} color="bg-green-50" />
                <StatsCard title="Absent Today" value={attendanceToday.absent} subtitle={todayStr} icon={<FiAlertCircle className="text-red-600 w-5 h-5" />} color="bg-red-50" />
                <StatsCard title="Marked % Today" value={labours.length ? Math.round((attendanceToday.present / labours.length) * 100) + '%' : '0%'} subtitle={`${attendanceToday.present}/${labours.length}`} icon={<FiPercent className="text-indigo-600 w-5 h-5" />} color="bg-indigo-50" />
                <StatsCard title="Attendance Records Today" value={attendanceToday.totalRecords} icon={<FiActivity className="text-purple-600 w-5 h-5" />} color="bg-purple-50" />
                <StatsCard title="Remaining to Mark" value={Math.max(labours.length - attendanceToday.present, 0)} icon={<FiAlertCircle className="text-amber-600 w-5 h-5" />} color="bg-amber-50" />
              </div>
              {/* Charts Section for Army Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-xl cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-blue-600">Attendance Status</h3>
                  <Doughnut
                    data={{
                      labels: ['Present', 'Absent'],
                      datasets: [
                        {
                          data: [attendanceToday.present, attendanceToday.absent],
                          backgroundColor: ['#3b82f6', '#ef4444'],
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: true, position: 'bottom' } },
                      cutout: '70%',
                    }}
                    style={{ maxHeight: 260 }}
                  />
                  <div className="mt-4 text-center">
                    <span className="font-semibold text-gray-700">Present: </span>
                    <span className="text-blue-600 font-bold">{attendanceToday.present}</span>
                    <span className="mx-2">|</span>
                    <span className="font-semibold text-gray-700">Absent: </span>
                    <span className="text-red-600 font-bold">{attendanceToday.absent}</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-xl cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-green-600">Attendance Records Over Time</h3>
                  <Line
                    data={{
                      labels: [todayStr],
                      datasets: [
                        {
                          label: 'Attendance Records',
                          data: [attendanceToday.totalRecords],
                          fill: false,
                          borderColor: '#10b981',
                          backgroundColor: '#10b981',
                          tension: 0.3,
                          pointRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                        x: { grid: { color: '#f3f4f6' } },
                      },
                    }}
                    style={{ maxHeight: 260 }}
                  />
                  <div className="mt-4 text-center">
                    <span className="font-semibold text-gray-700">Total Records: </span>
                    <span className="text-green-600 font-bold">{attendanceToday.totalRecords}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <Footer bgColor="#261d1a" />
    </div>
  );
}

export default Analytics;
