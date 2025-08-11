import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './footer';
import api from '../api/api';
import { FiCheckSquare } from 'react-icons/fi';

const Attendance = () => {
  const [labours, setLabours] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const [photoData, setPhotoData] = useState({}); // { [labourId]: base64 }
  const [showCamera, setShowCamera] = useState({}); // { [labourId]: true/false }
  const [submitting, setSubmitting] = useState({}); // { [labourId]: true/false }
  const [marked, setMarked] = useState(() => {
    try {
      const stored = localStorage.getItem('attendance_marked');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }); // { [labourId]: true }
  const [toast, setToast] = useState({ show: false, message: '', success: true });
  const videoRefs = useRef({});
  const canvasRefs = useRef({});
  const [locationData, setLocationData] = useState({}); // { [labourId]: { lat, lng, accuracy, timestamp } }

  useEffect(() => {
    const fetchLabours = async () => {
      try {
        const mobile = localStorage.getItem('mobile_number');
        const res = await api.get(`/labour/assigned/${mobile}`);
  setLabours(res.data.labours || []);
  setCurrentPage(1);
      } catch (err) {
        // handle error
      }
    };
    fetchLabours();
  }, []);

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
        setMarked(prev => {
          const updated = { ...prev, [labourId]: true };
          localStorage.setItem('attendance_marked', JSON.stringify(updated));
          return updated;
        });
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

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().slice(0, 10);

  // Pagination
  const totalPages = Math.ceil(labours.length / entriesPerPage) || 1;
  const paginatedLabours = labours.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header bgColor="#261d1a" />
      {toast.show && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-semibold transition-all duration-300 ${toast.success ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}
      <div className="flex flex-1">
        <Sidebar bgColor="#261d1a" />
        <div className="flex-1 px-6 pt-2 overflow-x-auto pb-24 ml-60 mt-1">
        <div className="mb-5">
          <div className="flex items-end gap-3">
            <span className="h-10 w-10 rounded-full bg-blue-100 ring-1 ring-blue-200 shadow-sm flex items-center justify-center">
              <FiCheckSquare className="text-blue-600 w-6 h-6" />
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 drop-shadow-sm">Attendance</h2>
          </div>
          <div className="mt-2 h-1.5 w-28 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"></div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Name</th>
                <th className="px-4 py-2 text-left font-semibold">Attendance Date</th>
                <th className="px-4 py-2 text-left font-semibold">Photo Upload</th>
                <th className="px-4 py-2 text-left font-semibold">Mark Attendance</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLabours.map(labour => (
                <tr key={labour.id} className="border-b">
                  <td className="px-4 py-2">{labour.name}</td>
                  <td className="px-4 py-2">{today}</td>
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
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleOpenCamera(labour.id)}>Capture Photo</button>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!photoData[labour.id] || submitting[labour.id] || marked[labour.id]}
                      onClick={() => handleMarkAttendance(labour.id)}
                    >
                      {submitting[labour.id] ? 'Submitting...' : 'Submit'}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {marked[labour.id] ? (
                      <span className="text-green-600 font-semibold">Present</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        </div>
      </div>
      <Footer bgColor="#261d1a" />
    </div>
  );
};

export default Attendance;
