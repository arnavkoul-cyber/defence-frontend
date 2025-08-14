import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './footer';
import api from '../api/api';
import { FiUsers, FiCheckCircle, FiAlertCircle, FiDatabase, FiGrid, FiCreditCard, FiPercent, FiActivity } from 'react-icons/fi';

const StatsCard = ({ title, value, subtitle, icon, color }) => (
  <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatsCard title="Labourers Registered" value={labours.length} icon={<FiUsers className="text-blue-600 w-5 h-5" />} color="bg-blue-50" />
              <StatsCard title="Labourers Assigned" value={assignedCount} subtitle={`${armyUnits.length} Units`} icon={<FiCheckCircle className="text-green-600 w-5 h-5" />} color="bg-green-50" />
              <StatsCard title="Unassigned Labourers (Pending)" value={unassignedCount} icon={<FiAlertCircle className="text-amber-600 w-5 h-5" />} color="bg-amber-50" />
              <StatsCard title="No of Army Units" value={armyUnits.length} icon={<FiDatabase className="text-indigo-600 w-5 h-5" />} color="bg-indigo-50" />
              <StatsCard title="Sectors" value={sectors.length} icon={<FiGrid className="text-purple-600 w-5 h-5" />} color="bg-purple-50" />
              <StatsCard title="Aadhaar Coverage" value={`${coveragePercent}%`} subtitle={`${aadhaarCount}/${labours.length}`} icon={<FiCreditCard className="text-sky-600 w-5 h-5" />} color="bg-sky-50" />
            </div>
          )}
          {isArmyDashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatsCard title="Assigned Labourers" value={labours.length} icon={<FiUsers className="text-blue-600 w-5 h-5" />} color="bg-blue-50" />
              <StatsCard title="Present Today" value={attendanceToday.present} subtitle={todayStr} icon={<FiCheckCircle className="text-green-600 w-5 h-5" />} color="bg-green-50" />
              <StatsCard title="Absent Today" value={attendanceToday.absent} subtitle={todayStr} icon={<FiAlertCircle className="text-red-600 w-5 h-5" />} color="bg-red-50" />
              <StatsCard title="Marked % Today" value={labours.length ? Math.round((attendanceToday.present / labours.length) * 100) + '%' : '0%'} subtitle={`${attendanceToday.present}/${labours.length}`} icon={<FiPercent className="text-indigo-600 w-5 h-5" />} color="bg-indigo-50" />
              <StatsCard title="Attendance Records Today" value={attendanceToday.totalRecords} icon={<FiActivity className="text-purple-600 w-5 h-5" />} color="bg-purple-50" />
              <StatsCard title="Remaining to Mark" value={Math.max(labours.length - attendanceToday.present, 0)} icon={<FiAlertCircle className="text-amber-600 w-5 h-5" />} color="bg-amber-50" />
            </div>
          )}
        </main>
      </div>
      <Footer bgColor="#261d1a" />
    </div>
  );
}

export default Analytics;
