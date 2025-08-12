import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './footer';
import api from '../api/api';
import { FiUsers, FiCheckCircle, FiAlertCircle, FiDatabase, FiGrid, FiCreditCard } from 'react-icons/fi';

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
  const [labours, setLabours] = useState([]);
  const [armyUnits, setArmyUnits] = useState([]);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    const init = async () => {
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
    };
    init();
  }, []);

  const assignedCount = labours.filter((l) => !!l.army_unit_id).length;
  const unassignedCount = Math.max(labours.length - assignedCount, 0);
  const aadhaarCount = labours.filter((l) => (l.aadhaar_number || '').toString().replace(/\D/g, '').length >= 12).length;
  const coveragePercent = labours.length ? Math.round((aadhaarCount / labours.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header bgColor="#261d1a" />
      <div className="flex flex-1">
        <Sidebar bgColor="#261d1a" />
        <main className="flex-1 px-6 pt-2 pb-24 ml-60 mt-1">
          <div className="mb-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 drop-shadow-sm">Analytics</h2>
            <div className="mt-2 h-1.5 w-28 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatsCard title="Labourers Registered" value={labours.length} icon={<FiUsers className="text-blue-600 w-5 h-5" />} color="bg-blue-50" />
            <StatsCard title="Labourers Assigned" value={assignedCount} subtitle={`${armyUnits.length} Units`} icon={<FiCheckCircle className="text-green-600 w-5 h-5" />} color="bg-green-50" />
            <StatsCard title="Unassigned Labourers (Pending)" value={unassignedCount} icon={<FiAlertCircle className="text-amber-600 w-5 h-5" />} color="bg-amber-50" />
            <StatsCard title="No of Army Units" value={armyUnits.length} icon={<FiDatabase className="text-indigo-600 w-5 h-5" />} color="bg-indigo-50" />
            <StatsCard title="Sectors" value={sectors.length} icon={<FiGrid className="text-purple-600 w-5 h-5" />} color="bg-purple-50" />
            <StatsCard title="Aadhaar Coverage" value={`${coveragePercent}%`} subtitle={`${aadhaarCount}/${labours.length}`} icon={<FiCreditCard className="text-sky-600 w-5 h-5" />} color="bg-sky-50" />
          </div>
        </main>
      </div>
      <Footer bgColor="#261d1a" />
    </div>
  );
}

export default Analytics;
