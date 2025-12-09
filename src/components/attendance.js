import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './footer';
import api from '../api/api';
import { FiCheckSquare, FiChevronRight } from 'react-icons/fi';
import { getThemeColors, getTableHeaderClass, getButtonClass, getGradientTextClass } from '../utils/themeHelper';

const Attendance = () => {
  const [labours, setLabours] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const [photoData, setPhotoData] = useState({}); // { [labourId]: base64 }
  const [showCamera, setShowCamera] = useState({}); // { [labourId]: true/false }
  const [submitting, setSubmitting] = useState({}); // { [labourId]: true/false }
  // Map of labourId -> boolean (present today). Derived from backend attendance API.
  const [attendanceMap, setAttendanceMap] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', success: true });
  const videoRefs = useRef({});
  const canvasRefs = useRef({});
  const [locationData, setLocationData] = useState({}); // { [labourId]: { lat, lng, accuracy, timestamp } }

  // Date filter state for attendance fetch
  const todayObj = new Date();
  const yyyy = todayObj.getFullYear();
  const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
  const dd = String(todayObj.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const [filterStartDate, setFilterStartDate] = useState(todayStr);
  const [filterEndDate, setFilterEndDate] = useState(todayStr);
  // Today's date (local) string YYYY-MM-DD used for filtering
  const today = new Date().toISOString().slice(0, 10);

  // Fetch labours then today's attendance statuses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const mobile = localStorage.getItem('mobile_number');
        const unitId = localStorage.getItem('army_unit_id');
        // Use POST for attendance fetch
        const [labourRes, attendanceRes] = await Promise.all([
          api.get(`/labour/assigned/${mobile}`),
          api.post('/attendance/army', {
            army_unit_id: unitId,
            startDate: filterStartDate,
            endDate: filterEndDate
          })
        ]);
        const labourList = labourRes.data.labours || [];
        setLabours(labourList);
        setCurrentPage(1);
        // Build attendance map for today (show present/absent for each day in range)
        const list = (attendanceRes.data && attendanceRes.data.attendances) || [];
        const map = {};
        list.forEach(rec => {
          if (!rec || !rec.attendance_date) return;
          const recDate = new Date(rec.attendance_date);
          const recDateStr = new Date(recDate.getTime() - recDate.getTimezoneOffset()*60000).toISOString().slice(0,10);
          // status 1 => present, 0 => absent; if multiple records for same labour, last one wins
          map[rec.labour_id] = rec.status === 1;
        });
        setAttendanceMap(map);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Fetch data error', err);
      }
    };
    fetchData();
  }, [filterStartDate, filterEndDate]);

  const handleOpenCamera = (labourId) => {
    setShowCamera(prev => ({ ...prev, [labourId]: true }));
  // Try to fetch location early so it's ready by the time of capture
  getLocationForLabour(labourId);
    setTimeout(async () => {
      if (videoRefs.current[labourId]) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRefs.current[labourId].srcObject = stream;
        } catch (err) {
          // handle error
        }
      }
    }, 100);
  };

  const handleCapturePhoto = (labourId) => {
    const video = videoRefs.current[labourId];
    const canvas = canvasRefs.current[labourId];
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setPhotoData(prev => ({ ...prev, [labourId]: dataUrl }));
      // Stop camera
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      setShowCamera(prev => ({ ...prev, [labourId]: false }));
    }
  };

  const handleCloseCamera = (labourId) => {
    setShowCamera(prev => ({ ...prev, [labourId]: false }));
    const video = videoRefs.current[labourId];
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Helper to convert base64 dataURL to Blob
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
  }

  // Get device geolocation and cache per labour
  const getLocationForLabour = (labourId) => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: Date.now(),
          };
          setLocationData((prev) => ({ ...prev, [labourId]: coords }));
          resolve(coords);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    });
  };

  const handleMarkAttendance = async (labourId) => {
    setSubmitting(prev => ({ ...prev, [labourId]: true }));
    try {
      const army_unit_id = localStorage.getItem('army_unit_id');
      const date = today;
      const formData = new FormData();
      formData.append('labour_id', labourId);
      formData.append('army_unit_id', army_unit_id);
      formData.append('attendance_date', date);
      // For testing: log geolocation and DO NOT send to API
      let coords = locationData[labourId] || await getLocationForLabour(labourId);
      if (coords) {
        // eslint-disable-next-line no-console
        console.log('Attendance Geo:', {
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: Math.round(coords.accuracy || 0),
        });
      } else {
        // eslint-disable-next-line no-console
        console.log('Attendance Geo: unavailable');
      }
      // Convert base64 to Blob and append as file
      const base64 = photoData[labourId];
      if (base64) {
        const blob = dataURLtoBlob(base64);
        formData.append('photo', blob, 'photo.png');
      }
      formData.append('status', 1);
      const res = await api.post('/attendance/mark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data && res.data.message === 'Attendance marked successfully') {
        setToast({ show: true, message: 'Attendance marked', success: true });
  // Update local present map optimistically
  setAttendanceMap(prev => ({ ...prev, [labourId]: true }));
      } else {
        setToast({ show: true, message: 'Attendance not marked', success: false });
      }
    } catch (err) {
      setToast({ show: true, message: 'Attendance not marked', success: false });
    } finally {
      setSubmitting(prev => ({ ...prev, [labourId]: false }));
      setTimeout(() => setToast({ show: false, message: '', success: true }), 2500);
    }
  };

  // 'today' defined above

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
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-semibold transition-all duration-300 ${toast.success ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}
      <div className="flex flex-1">
  <Sidebar bgColor={themeColors.sidebarBg} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(v => !v)} />
  <div className={`flex-1 px-3 sm:px-4 md:px-6 pt-2 overflow-x-auto pb-24 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'ml-0'} mt-1`}>
        <div className="mb-4 sm:mb-5">
          <div className="flex items-end gap-3">
            <span className={`h-10 w-10 rounded-full ${themeColors.primary.includes('059669') ? 'bg-green-100 ring-green-200' : themeColors.primary.includes('1f2937') ? 'bg-gray-100 ring-gray-200' : 'bg-blue-100 ring-blue-200'} ring-1 shadow-sm flex items-center justify-center`}>
              <FiCheckSquare className={`${themeColors.primary.includes('059669') ? 'text-green-600' : themeColors.primary.includes('1f2937') ? 'text-gray-600' : 'text-blue-600'} w-6 h-6`} />
            </span>
            <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight ${gradientTextClass} drop-shadow-sm`}>Attendance</h2>
          </div>
          <div className={`mt-2 h-1.5 w-28 ${gradientTextClass.includes('green') ? 'bg-gradient-to-r from-green-600 to-emerald-500' : gradientTextClass.includes('gray') ? 'bg-gradient-to-r from-gray-700 to-gray-500' : 'bg-gradient-to-r from-blue-600 to-sky-500'} rounded-full`}></div>
        </div>
        {/* Date Filter Row */}
        <div className="flex flex-wrap gap-2 items-center mt-2 mb-4">
          <label className="font-medium text-gray-600">From:</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={filterStartDate}
            max={filterEndDate}
            onChange={e => setFilterStartDate(e.target.value)}
          />
          <label className="font-medium text-gray-600 ml-2">To:</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={filterEndDate}
            min={filterStartDate}
            max={todayStr}
            onChange={e => setFilterEndDate(e.target.value)}
          />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className={tableHeaderClass}>
                <th className="px-4 py-2 text-left font-semibold">Name</th>
                <th className="px-4 py-2 text-left font-semibold">Contact Number</th>
                <th className="px-4 py-2 text-left font-semibold">PAN Number</th>
                <th className="px-4 py-2 text-left font-semibold">Attendance Date</th>
                <th className="px-4 py-2 text-left font-semibold">Start Date</th>
                <th className="px-4 py-2 text-left font-semibold">End Date</th>
                <th className="px-4 py-2 text-left font-semibold">Photo Upload</th>
                <th className="px-4 py-2 text-left font-semibold">Mark Attendance</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLabours.map(labour => (
                <tr key={labour.id} className="border-b">
                  <td className="px-4 py-2">{labour.name}</td>
                  <td className="px-4 py-2">{labour.contact_number || '-'}</td>
                  <td className="px-4 py-2">{labour.pan_number || '-'}</td>
                  <td className="px-4 py-2">{today}</td>
                  <td className="px-4 py-2">{filterStartDate}</td>
                  <td className="px-4 py-2">{filterEndDate}</td>
                  <td className="px-4 py-2">
                    {photoData[labour.id] ? (
                      <div className="flex flex-col items-center gap-1">
                        <img src={photoData[labour.id]} alt="Captured" className="rounded border w-20 h-16 object-cover" />
                        <button
                          className="text-xs text-blue-600 underline"
                          onClick={() => {
                            setPhotoData(prev => {
                              const newData = { ...prev };
                              delete newData[labour.id];
                              return newData;
                            });
                            handleOpenCamera(labour.id);
                          }}
                        >
                          Retake
                        </button>
                      </div>
                    ) : showCamera[labour.id] ? (
                      <div className="flex flex-col items-center gap-2">
                        <video ref={el => (videoRefs.current[labour.id] = el)} autoPlay className="rounded border w-32 h-24 object-cover" />
                        <div className="flex gap-2">
                          <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => handleCapturePhoto(labour.id)}>Take Photo</button>
                          <button className="bg-gray-400 text-white px-3 py-1 rounded" onClick={() => handleCloseCamera(labour.id)}>Cancel</button>
                        </div>
                        <canvas ref={el => (canvasRefs.current[labour.id] = el)} style={{ display: 'none' }} />
                      </div>
                    ) : (
                      <button className={buttonClass} onClick={() => handleOpenCamera(labour.id)}>Capture Photo</button>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={submitting[labour.id] || attendanceMap[labour.id]}
                      onClick={() => handleMarkAttendance(labour.id)}
                    >
                      {submitting[labour.id] ? 'Submitting...' : 'Submit'}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {attendanceMap[labour.id] === true ? (
                      <span className="text-green-600 font-semibold">Present</span>
                    ) : attendanceMap[labour.id] === false ? (
                      <span className="text-red-600 font-semibold">Absent</span>
                    ) : (
                      <span className="text-gray-400">-</span> // No record yet
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {paginatedLabours.map(labour => (
            <div key={labour.id} className="border border-gray-200 rounded-lg p-4 shadow bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{labour.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Contact: {labour.contact_number || '-'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">PAN: {labour.pan_number || '-'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Date: {today}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Start: {filterStartDate}</p>
                  <p className="text-xs text-gray-500 mt-0.5">End: {filterEndDate}</p>
                  <div className="mt-2">
                    {attendanceMap[labour.id] === true ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Present</span>
                    ) : attendanceMap[labour.id] === false ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">Absent</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Pending</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {photoData[labour.id] ? (
                    <>
                      <img src={photoData[labour.id]} alt="Captured" className="rounded border w-20 h-16 object-cover" />
                      <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => {
                          setPhotoData(prev => { const d = { ...prev }; delete d[labour.id]; return d; });
                          handleOpenCamera(labour.id);
                        }}
                      >Retake</button>
                    </>
                  ) : showCamera[labour.id] ? (
                    <>
                      <video ref={el => (videoRefs.current[labour.id] = el)} autoPlay className="rounded border w-28 h-20 object-cover" />
                      <div className="flex gap-2">
                        <button className="bg-green-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleCapturePhoto(labour.id)}>Snap</button>
                        <button className="bg-gray-400 text-white px-2 py-1 rounded text-xs" onClick={() => handleCloseCamera(labour.id)}>X</button>
                      </div>
                      <canvas ref={el => (canvasRefs.current[labour.id] = el)} style={{ display: 'none' }} />
                    </>
                  ) : (
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" onClick={() => handleOpenCamera(labour.id)}>Photo</button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting[labour.id] || attendanceMap[labour.id]}
                  onClick={() => handleMarkAttendance(labour.id)}
                >{submitting[labour.id] ? 'Saving...' : 'Submit'}</button>
              </div>
            </div>
          ))}
          {labours.length === 0 && (
            <div className="text-center text-gray-500 py-8 bg-white rounded-md border">No labours found.</div>
          )}
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
        </div>
      </div>
      </div>
  <Footer bgColor={themeColors.footerBg} />
    </div>
  );
};

export default Attendance;
