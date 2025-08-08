import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar';
import api from '../api/api';


const AttendanceDetails = () => {
  const [attendances, setAttendances] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterLabourId, setFilterLabourId] = useState('');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const totalPages = Math.ceil(attendances.length / entriesPerPage);
  const paginatedAttendances = attendances.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-1 p-6 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Attendance Details</h2>
        <div className="mb-4 flex flex-wrap gap-4 items-center">
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
        <div className="bg-white rounded-xl shadow-lg p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
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
                            : `http://10.149.84.153:5000/${a.photo_path}`}
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
              className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span className="mx-2 text-base font-medium">Page {currentPage} of {totalPages}</span>
            <button
              className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
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
      </div>
    </div>
  );
}

export default AttendanceDetails
