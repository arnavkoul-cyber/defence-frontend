import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar';
import api from '../api/api';


const AttendanceDetails = () => {
  const [attendances, setAttendances] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterLabourId, setFilterLabourId] = useState('');

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
                attendances.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="px-4 py-2">{a.labour_name}</td>
                    <td className="px-4 py-2">{formatDate(a.attendance_date)}</td>
                    <td className="px-4 py-2">{formatTime(a.attendance_time)}</td>
                    <td className="px-4 py-2">
                      {a.photo_path ? (
                        <img
                          src={a.photo_path.startsWith('http') ? a.photo_path : `/` + a.photo_path.replace(/\\/g, '/')}
                          alt="Attendance"
                          className="rounded border w-20 h-16 object-cover"
                        />
                      ) : (
                        <span className="text-gray-400">No Photo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceDetails
