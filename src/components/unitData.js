import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './footer';
import api from '../api/api';
import { FiUsers, FiChevronRight } from 'react-icons/fi';
import { getThemeColors, getTableHeaderClass, getButtonClass, getGradientTextClass } from '../utils/themeHelper';

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
        {labours.length > entriesPerPage && (
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
        </main>
      </div>
      </div>
  <Footer bgColor={themeColors.footerBg} />
    </div>
  );
}

export default UnitData;
