import React, { useEffect, useState } from 'react';
import api from '../api/api';

function getMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: first.toISOString().slice(0, 10),
    end: last.toISOString().slice(0, 10),
  };
}

function downloadCSV(data) {
  const header = ['Labour Name', 'Labour Type', 'Working Days'];
  const rows = data.map(r => [r.labour_name, r.labour_type || '', r.working_days]);
  const csv = [header, ...rows].map(row => row.map(String).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'labour_working_days.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const LabourWorkingDays = () => {
  const army_unit_id = localStorage.getItem('army_unit_id');
  const { start, end } = getMonthRange();
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/attendance/report/range`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          army_unit_id,
        },
      });
      setData(res.data.report || []);
    } catch (err) {
      setError('Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [data]);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6 w-full mx-auto drop-shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Labour Working Days</h2>
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <label className="font-semibold">Start Date:
            <input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} className="ml-2 border rounded px-2 py-1" />
          </label>
          <label className="font-semibold">End Date:
            <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className="ml-2 border rounded px-2 py-1" />
          </label>
          <button onClick={fetchData} className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">Refresh</button>
          <button onClick={() => downloadCSV(data)} className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold">Download CSV</button>
        </div>
        {loading ? (
          <div className="text-blue-600 font-semibold">Loading...</div>
        ) : error ? (
          <div className="text-red-600 font-semibold">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto" style={{ minHeight: 400, maxHeight: 600 }}>
              <table className="w-full min-w-[700px] divide-y divide-gray-200" style={{ minHeight: 400 }}>
                <thead>
                  <tr>
                    <th className="px-3 py-1 text-left font-semibold w-12">S.No.</th>
                    <th className="px-4 py-1 text-left font-semibold">Labour Name</th>
                    <th className="px-4 py-1 text-left font-semibold">Labour Type</th>
                    <th className="px-4 py-1 text-left font-semibold">Working Days</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-2">No records found.</td></tr>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <tr
                        key={row.labour_id || idx}
                        className="border-b"
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="px-1 py-0.5">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                        <td className="px-1 py-0.5">{row.labour_name}</td>
                        <td className="px-1 py-0.5">{row.labour_type || '-'}</td>
                        <td className="px-1 py-0.5">{row.working_days}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-end items-center mt-4 gap-2">
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
          </>
        )}
      </div>
    </>
  );
};

export default LabourWorkingDays;
