import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './footer';
import api, { getImageUrl } from '../api/api';
import { FiFileText, FiChevronRight } from 'react-icons/fi';
import { getThemeColors, getTableHeaderClass, getButtonClass, getGradientTextClass } from '../utils/themeHelper';


const AttendanceDetails = () => {
  const [attendances, setAttendances] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterLabourId, setFilterLabourId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const totalPages = Math.ceil(attendances.length / entriesPerPage);
  const paginatedAttendances = attendances.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  // CSV Download
  const downloadCSV = () => {
    // Columns: Labour Name, Attendance Date, Attendance Time, Photo URL
    const headers = ['Labour Name', 'Attendance Date', 'Attendance Time', 'Photo URL'];
    const rows = paginatedAttendances.map(a => [
      a.labour_name,
      formatDate(a.attendance_date),
      formatTime(a.attendance_time),
      a.photo_path ? (a.photo_path.startsWith('http') ? a.photo_path : getImageUrl(a.photo_path)) : ''
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendance_details.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        const army_unit_id = localStorage.getItem('army_unit_id');
        let res;
        if (filterDate && filterLabourId) {
          res = await api.get(`/attendance/filter?army_unit_id=${army_unit_id}&date=${filterDate}&labour_id=${filterLabourId}`);
        } else if (filterDate) {
          res = await api.get(`/attendance/filter?army_unit_id=${army_unit_id}&date=${filterDate}`);
        } else if (filterLabourId) {
          res = await api.get(`/attendance/labour/${filterLabourId}`);
        } else {
          res = await api.get(`/attendance/army/${army_unit_id}`);
        }
        setAttendances(res.data.attendances || []);
        console.log(res.data.attendances);
      } catch (err) {
        // handle error
      }
    };
    fetchAttendances();
  }, [filterDate, filterLabourId]);

  // Helper to format date and time
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString();
  };
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

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
  <div className={`flex-1 px-3 sm:px-4 md:px-6 pt-2 overflow-x-auto pb-24 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'ml-0'} mt-1`}>
  <div className="mb-4 sm:mb-5">
          <div className="flex items-end gap-3">
            <span className={`h-10 w-10 rounded-full ${themeColors.primary.includes('059669') ? 'bg-green-100 ring-green-200' : themeColors.primary.includes('1f2937') ? 'bg-gray-100 ring-gray-200' : 'bg-blue-100 ring-blue-200'} ring-1 shadow-sm flex items-center justify-center`}>
              <FiFileText className={`${themeColors.primary.includes('059669') ? 'text-green-600' : themeColors.primary.includes('1f2937') ? 'text-gray-600' : 'text-blue-600'} w-6 h-6`} />
            </span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight ${gradientTextClass} drop-shadow-sm`}>Attendance Details</h2>
          </div>
          <div className={`mt-2 h-1.5 w-28 ${gradientTextClass.includes('green') ? 'bg-gradient-to-r from-green-600 to-emerald-500' : gradientTextClass.includes('gray') ? 'bg-gradient-to-r from-gray-700 to-gray-500' : 'bg-gradient-to-r from-blue-600 to-sky-500'} rounded-full`}></div>
        </div>
  <div className="mb-4 flex flex-wrap gap-4 items-center">
        {/* Download CSV Button */}
        <div className="mb-4">
          <button
            className={`px-4 py-2 rounded font-semibold shadow ${buttonClass}`}
            onClick={downloadCSV}
          >
            Download CSV
          </button>
        </div>
          <div>
            <label className="font-semibold mr-2">Filter by Date:</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="border rounded px-2 py-1"
              max={new Date().toISOString().slice(0, 10)}
            />
            {filterDate && (
              <button
                className="ml-2 px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setFilterDate('')}
              >
                Clear
              </button>
            )}
          </div>
          <div>
            <label className="font-semibold mr-2">Filter by Labour ID:</label>
            <input
              type="number"
              min="1"
              value={filterLabourId}
              onChange={e => setFilterLabourId(e.target.value)}
              className="border rounded px-2 py-1 w-28"
              placeholder="Enter ID"
            />
            {filterLabourId && (
              <button
                className="ml-2 px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setFilterLabourId('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="px-4 py-2 text-left font-semibold">Labour Name</th>
                <th className="px-4 py-2 text-left font-semibold">Attendance Date</th>
                <th className="px-4 py-2 text-left font-semibold">Attendance Time</th>
                <th className="px-4 py-2 text-left font-semibold">Photo</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">No attendance records found.</td></tr>
              ) : (
                paginatedAttendances.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="px-4 py-2">{a.labour_name}</td>
                    <td className="px-4 py-2">{formatDate(a.attendance_date)}</td>
                    <td className="px-4 py-2">{formatTime(a.attendance_time)}</td>
                    <td className="px-4 py-2">
                      {a.photo_path ? (
                        <img
                          src={a.photo_path.startsWith('http')
                            ? a.photo_path
                            : getImageUrl(a.photo_path)}
                          alt="Attendance"
                          className="w-16 h-16 object-cover rounded shadow border border-gray-200"
                          onError={e => { e.target.onerror = null; e.target.src = 'https://img.icons8.com/fluency/48/no-image.png'; }}
                        />
                      ) : (
                        <img
                          src="https://img.icons8.com/fluency/48/no-image.png"
                          alt="No Photo"
                          className="w-16 h-16 object-cover rounded shadow border border-gray-200"
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              className={`px-3 py-1 rounded font-semibold disabled:opacity-50 ${buttonClass}`}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span className="mx-2 text-base font-medium">Page {currentPage} of {totalPages}</span>
            <button
              className={`px-3 py-1 rounded font-semibold disabled:opacity-50 ${buttonClass}`}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
            </tbody>
          </table>
        </div>
        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {attendances.length === 0 && (
            <div className="text-center text-gray-500 bg-white border border-gray-200 rounded-lg py-6 shadow">No attendance records found.</div>
          )}
          {paginatedAttendances.map(a => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow flex gap-4">
              <div className="flex-shrink-0">
                <img
                  src={a.photo_path ? (a.photo_path.startsWith('http') ? a.photo_path : getImageUrl(a.photo_path)) : 'https://img.icons8.com/fluency/48/no-image.png'}
                  alt="Attendance"
                  className="w-16 h-16 object-cover rounded border"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://img.icons8.com/fluency/48/no-image.png'; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{a.labour_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Date: {formatDate(a.attendance_date)} | {formatTime(a.attendance_time)}</p>
              </div>
            </div>
          ))}
          {totalPages > 1 && (
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
      </div>
      </div>
      </div>
  <Footer bgColor={themeColors.footerBg} />
    </div>
  );
}

export default AttendanceDetails
