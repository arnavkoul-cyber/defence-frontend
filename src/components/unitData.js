import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './footer';
import api from '../api/api';
import { FiUsers, FiChevronRight } from 'react-icons/fi';

function UnitData() {
  const [labours, setLabours] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [armyUnits, setArmyUnits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;

  useEffect(() => {
    api.get('/labour/' + localStorage.getItem('userId'))
      .then(res => { setLabours(res.data.labours || []); setCurrentPage(1); })
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

  // Pagination
  const totalPages = Math.ceil(labours.length / entriesPerPage) || 1;
  const paginatedLabours = labours.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
  <Header bgColor="rgb(11,80,162)" emblemColor="blue" isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />
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
  <Sidebar bgColor="rgb(11,80,162)" isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(v => !v)} />
        <main className={`flex-1 px-6 pt-2 pb-24 transition-all duration-300 ${isSidebarOpen ? 'ml-60' : 'ml-0'} mt-1`}>
        <div className="mb-5">
          <div className="flex items-end gap-3">
            <span className="h-10 w-10 rounded-full bg-blue-100 ring-1 ring-blue-200 shadow-sm flex items-center justify-center">
              <FiUsers className="text-blue-600 w-6 h-6" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 drop-shadow-sm">
              Labours & Assigned Units
            </h1>
          </div>
          <div className="mt-2 h-1.5 w-28 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"></div>
        </div>

        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200 text-gray-800">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Father Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Contact</th>
                {/* <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Aadhaar</th> */}
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Sector</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Army Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {labours.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-600 italic">
                    No labours found.
                  </td>
                </tr>
              ) : (
                paginatedLabours.map(labour => {
                  const capitalize = (str) => str && typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
                  return (
                    <tr key={labour.id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">{capitalize(labour.name)}</td>
                      <td className="px-6 py-4">{capitalize(labour.father_name)}</td>
                      <td className="px-6 py-4">{labour.contact_number}</td>
                      {/* <td className="px-6 py-4">{labour.aadhaar_number}</td> */}
                      <td className="px-6 py-4">{getSectorName(labour.sector_id)}</td>
                      <td className="px-6 py-4">{getArmyUnitName(labour.army_unit_id)}</td>
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
          {paginatedLabours.map(labour => {
            const capitalize = (str) => str && typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
            return (
              <div key={labour.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow">
                <p className="font-semibold text-gray-800">{capitalize(labour.name)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Father: {capitalize(labour.father_name) || '—'}</p>
                <p className="text-sm text-gray-600 mt-1">📞 {labour.contact_number}</p>
                <div className="mt-2 text-xs space-y-1">
                  <div><span className="font-semibold text-gray-700">Sector:</span> {getSectorName(labour.sector_id)}</div>
                  <div><span className="font-semibold text-gray-700">Army Unit:</span> {getArmyUnitName(labour.army_unit_id)}</div>
                </div>
              </div>
            );
          })}
          {labours.length > entriesPerPage && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:bg-gray-300"
              >Prev</button>
              <span className="text-sm font-medium text-gray-700">{currentPage}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:bg-gray-300"
              >Next</button>
            </div>
          )}
        </div>
        {labours.length > entriesPerPage && (
          <div className="flex items-center justify-center mt-6 space-x-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold transition disabled:bg-gray-300 disabled:text-gray-500`}
            >
              Prev
            </button>
            <span className="font-semibold text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold transition disabled:bg-gray-300 disabled:text-gray-500`}
            >
              Next
            </button>
          </div>
        )}
        </main>
      </div>
  <Footer bgColor="rgb(11,80,162)" />
    </div>
  );
}

export default UnitData;
