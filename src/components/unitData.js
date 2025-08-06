import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import api from '../api/api';

function UnitData() {
  const [labours, setLabours] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [armyUnits, setArmyUnits] = useState([]);

  useEffect(() => {
    api.get('/labour/' + localStorage.getItem('userId'))
      .then(res => setLabours(res.data.labours || []))
      .catch(err => console.error('Error fetching labours:', err));

    api.get('/dynamic/sectors')
      .then(res => setSectors(res.data.data || []))
      .catch(err => console.error('Error fetching sectors:', err));

    api.get('/dynamic/army_units')
      .then(res => setArmyUnits(res.data.data || []))
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Labours & Assigned Units</h1>

        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full table-auto text-base text-gray-800">
            <thead className="bg-gray-200 text-gray-800 uppercase text-sm font-semibold">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Father Name</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Aadhaar</th>
                <th className="px-5 py-3 text-left">Sector</th>
                <th className="px-5 py-3 text-left">Army Unit</th>
              </tr>
            </thead>
            <tbody>
              {labours.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-600 italic">
                    No labours found.
                  </td>
                </tr>
              ) : (
                labours.map(labour => {
                  const capitalize = (str) => str && typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
                  return (
                    <tr
                      key={labour.id}
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">{capitalize(labour.name)}</td>
                      <td className="px-5 py-3">{capitalize(labour.father_name)}</td>
                      <td className="px-5 py-3">{labour.contact_number}</td>
                      <td className="px-5 py-3">{labour.aadhaar_number}</td>
                      <td className="px-5 py-3">{getSectorName(labour.sector_id)}</td>
                      <td className="px-5 py-3">{getArmyUnitName(labour.army_unit_id)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default UnitData;
