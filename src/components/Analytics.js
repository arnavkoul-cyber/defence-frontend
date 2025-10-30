import React, { useEffect, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, ChartTitle);
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './footer';
import api from '../api/api';
import { FiUsers, FiCheckCircle, FiAlertCircle, FiDatabase, FiGrid, FiCreditCard, FiPercent, FiActivity } from 'react-icons/fi';
import LabourWorkingDays from './LabourWorkingDays';
import { getThemeColors, getGradientTextClass } from '../utils/themeHelper';

const StatsCard = ({ title, value, subtitle, icon, color }) => (
  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 drop-shadow-xl transition-shadow duration-200 hover:shadow-2xl hover:drop-shadow-2xl">
    <div>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {subtitle ? <div className="text-xs text-gray-500 mt-1">{subtitle}</div> : null}
    </div>
    <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${color}`}>{icon}</div>
  </div>
);

function Analytics() {
  const [labours, setLabours] = useState([]); // generic or assigned list
  const [armyUnits, setArmyUnits] = useState([]); // defence only
  const [sectors, setSectors] = useState([]); // defence only
  const [attendanceToday, setAttendanceToday] = useState({ present: 0, absent: 0, totalRecords: 0 }); // army only
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Donut chart data (attendance distribution)
  const donutData = isArmyDashboard
    ? {
        labels: ['Present', 'Absent'],
        datasets: [
          {
            data: [attendanceToday.present, attendanceToday.absent],
            backgroundColor: ['#22c55e', '#ef4444'],
            borderWidth: 1,
          },
        ],
      }
    : {
        labels: ['Assigned', 'Unassigned'],
        datasets: [
          {
            data: [assignedCount, unassignedCount],
            backgroundColor: ['#2563eb', '#f59e42'],
            borderWidth: 1,
          },
        ],
      };

  // Line chart data (attendance trend for Army, registration trend for Defence)
  const [trendLabels, setTrendLabels] = useState([]);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    // For Army: show attendance records per day for last 7 days
    // For Defence: show registrations per day for last 7 days
    async function fetchTrend() {
      if (isArmyDashboard) {
        try {
          const armyUnitId = localStorage.getItem('army_unit_id');
          const res = await api.get(`/attendance/army/${armyUnitId}`);
          const records = (res.data && res.data.attendances) || [];
          // Group by date
          const map = {};
          records.forEach(r => {
            if (!r || !r.attendance_date) return;
            const d = new Date(r.attendance_date);
            const dStr = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
            map[dStr] = (map[dStr] || 0) + 1;
          });
          // Get last 7 days
          const days = [];
          const vals = [];
          for (let i = 6; i >= 0; i--) {
            const dt = new Date();
            dt.setDate(dt.getDate() - i);
            const dStr = dt.toISOString().slice(0,10);
            days.push(dStr);
            vals.push(map[dStr] || 0);
          }
          setTrendLabels(days);
          setTrendData(vals);
        } catch {}
      } else {
        try {
          const userId = localStorage.getItem('userId');
          const res = await api.get(`/labour/${userId}`);
          const labours = res.data.labours || [];
          // Group by registration date
          const map = {};
          labours.forEach(l => {
            if (!l.created_at) return;
            const d = new Date(l.created_at);
            const dStr = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
            map[dStr] = (map[dStr] || 0) + 1;
          });
          // Get last 7 days
          const days = [];
          const vals = [];
          for (let i = 6; i >= 0; i--) {
            const dt = new Date();
            dt.setDate(dt.getDate() - i);
            const dStr = dt.toISOString().slice(0,10);
            days.push(dStr);
            vals.push(map[dStr] || 0);
          }
          setTrendLabels(days);
          setTrendData(vals);
        } catch {}
      }
    }
    fetchTrend();
  }, [isArmyDashboard]);

  const lineData = {
    labels: trendLabels,
    datasets: [
      {
        label: isArmyDashboard ? 'Attendance Records' : 'Registrations',
        data: trendData,
        fill: false,
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        tension: 0.3,
      },
    ],
  };

  const donutOptions = { plugins: { legend: { position: 'bottom' } } };
  const lineOptions = { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

  // Get theme colors
  const themeColors = getThemeColors();
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
          {/* open */}
          <span className="font-bold">›</span>
        </button>
      )}
      <div className="flex flex-1">
  <Sidebar bgColor={themeColors.sidebarBg} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(v => !v)} />
        <main className={`flex-1 px-3 sm:px-4 md:px-6 pt-2 pb-24 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'ml-0'} mt-1 overflow-x-hidden`}>
          <div className="mb-4 sm:mb-5">
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight ${gradientTextClass} drop-shadow-sm`}>{isArmyDashboard ? 'Unit Analytics' : 'Analytics'}</h2>
            <div className={`mt-2 h-1.5 w-28 ${gradientTextClass.includes('green') ? 'bg-gradient-to-r from-green-600 to-emerald-500' : gradientTextClass.includes('gray') ? 'bg-gradient-to-r from-gray-700 to-gray-500' : 'bg-gradient-to-r from-blue-600 to-sky-500'} rounded-full`}></div>
          </div>
          {/* Analytics Cards */}
          {!isArmyDashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatsCard title="Labourers Registered" value={labours.length} icon={<FiUsers className="text-blue-600 w-5 h-5" />} color="bg-blue-50" />
              <StatsCard title="Labourers Assigned" value={assignedCount} subtitle={`${armyUnits.length} Units`} icon={<FiCheckCircle className="text-green-600 w-5 h-5" />} color="bg-green-50" />
              <StatsCard title="Unassigned Labourers (Pending)" value={unassignedCount} icon={<FiAlertCircle className="text-amber-600 w-5 h-5" />} color="bg-amber-50" />
              <StatsCard title="No of Army Units" value={armyUnits.length} icon={<FiDatabase className="text-indigo-600 w-5 h-5" />} color="bg-indigo-50" />
              <StatsCard title="Sectors" value={sectors.length} icon={<FiGrid className="text-purple-600 w-5 h-5" />} color="bg-purple-50" />
              <StatsCard title="Aadhaar Coverage" value={`${coveragePercent}%`} subtitle={`${aadhaarCount}/${labours.length}`} icon={<FiCreditCard className="text-sky-600 w-5 h-5" />} color="bg-sky-50" />
            </div>
          )}
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg drop-shadow-xl p-4 flex flex-col items-center transition-shadow duration-200 hover:shadow-2xl hover:drop-shadow-2xl">
              <h3 className="font-semibold text-lg mb-2 text-blue-700">{isArmyDashboard ? 'Attendance Distribution' : 'Labour Assignment'}</h3>
              <Doughnut data={donutData} options={donutOptions} style={{ maxHeight: 260 }} />
            </div>
            <div className="bg-white rounded-xl shadow-lg drop-shadow-xl p-4 flex flex-col items-center transition-shadow duration-200 hover:shadow-2xl hover:drop-shadow-2xl">
              <h3 className="font-semibold text-lg mb-2 text-blue-700">{isArmyDashboard ? 'Attendance Trend (Last 7 Days)' : 'Registrations Trend (Last 7 Days)'}</h3>
              <Line data={lineData} options={lineOptions} style={{ maxHeight: 260 }} />
            </div>
          </div>
          {/* Army Analytics Cards and LabourWorkingDays */}
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
              <LabourWorkingDays />
            </>
          )}
        </main>
      </div>
      </div>
  <Footer bgColor={themeColors.footerBg} />
    </div>
  );
}

export default Analytics;
