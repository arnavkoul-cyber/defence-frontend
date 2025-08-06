import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../api/api';

function LabourForm() {
  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    sector_id: '',
    contact_number: '',
    aadhaar_number: '',
  });
  const [sectors, setSectors] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  // Camera logic
  const handleOpenCamera = async () => {
    setShowCamera(true);
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
        } catch (err) {
          toast.error('Camera access denied');
        }
      }
    }, 100);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedPhoto(dataUrl);
      // Stop camera
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Fetch sectors list
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await api.get('/dynamic/sectors');
        setSectors(response.data.data);
      } catch (err) {
        console.error('Error fetching sectors:', err);
      }
    };
    fetchSectors();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.father_name.trim()) newErrors.father_name = 'Father name is required.';
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required.';
    } else if (!/^\d{10}$/.test(formData.contact_number.trim())) {
      newErrors.contact_number = 'Contact number must be 10 digits.';
    }
    if (!formData.aadhaar_number.trim()) {
      newErrors.aadhaar_number = 'Aadhaar number is required.';
    } else if (!/^\d{12}$/.test(formData.aadhaar_number.trim())) {
      newErrors.aadhaar_number = 'Aadhaar number must be 12 digits.';
    }
    if (!capturedPhoto) newErrors.capturedPhoto = 'Photo capture is required.';
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSectorChange = (selectedOption) => {
    setFormData({ ...formData, sector_id: selectedOption ? selectedOption.value : '' });
    setErrors({ ...errors, sector_id: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        sector_id: Number(formData.sector_id),
        photo_base64: capturedPhoto || undefined,
      };
      await api.post('/labour/register', payload);
      toast.success('Labour registered successfully!', { position: 'top-center', autoClose: 2500 });
      setFormData({
        name: '',
        father_name: '',
        sector_id: '',
        contact_number: '',
        aadhaar_number: '',
      });
      setCapturedPhoto(null);
      setErrors({});
    } catch (err) {
      console.error('Error:', err);
      let errorMsg = 'Error registering labour';
      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
        toast.error(errorMsg, { position: 'top-center', autoClose: 2500 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 relative">
      <ToastContainer />
      <div className="flex flex-1 items-center justify-center mt-2 pb-32"> {/* Add bottom padding for footer */}
        <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-fade-in mb-0">
          <h2 className="text-2xl font-extrabold mb-6 text-center text-blue-700 tracking-wide" style={{marginTop: '2px'}}>Labour Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Father Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Father Name:</label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.father_name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter father's name"
              />
              {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name}</p>}
            </div>

            {/* Sector Dropdown */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Sector:</label>
              <Select
                name="sector_id"
                value={
                  sectors
                    .map(sector => ({ value: sector.id, label: sector.name }))
                    .find(option => option.value === Number(formData.sector_id)) || null
                }
                onChange={handleSectorChange}
                options={sectors.map(sector => ({ value: sector.id, label: sector.name }))}
                placeholder="Select Sector"
                isClearable
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '2.2rem',
                    borderColor: errors.sector_id ? '#f87171' : base.borderColor,
                    boxShadow: state.isFocused ? '0 0 0 2px #60a5fa' : base.boxShadow,
                  }),
                  menu: base => ({
                    ...base,
                    maxHeight: 120,   // limit dropdown height
                    overflowY: 'auto', // enable scrolling
                    zIndex: 9999,
                    position: 'relative',
                  }),
                  menuList: base => ({
                     ...base,
              maxHeight: 120,
            overflowY: 'auto'
}),
                  option: (base, state) => ({
                    ...base,
                    paddingTop: 6,
                    paddingBottom: 6,
                    fontSize: '0.95rem',
                  }),
                }}
              />
              {errors.sector_id && <p className="text-red-500 text-xs mt-1">{errors.sector_id}</p>}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Contact Number:</label>
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.contact_number ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {errors.contact_number && <p className="text-red-500 text-xs mt-1">{errors.contact_number}</p>}
            </div>

            {/* Aadhaar Number */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Aadhaar Number:</label>
              <input
                type="text"
                name="aadhaar_number"
                value={formData.aadhaar_number}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.aadhaar_number ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="12-digit Aadhaar number"
                maxLength={12}
              />
              {errors.aadhaar_number && <p className="text-red-500 text-xs mt-1">{errors.aadhaar_number}</p>}
            </div>

            {/* Photo */}
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Photo (Capture Required):</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded w-fit"
                  onClick={handleOpenCamera}
                  disabled={showCamera}
                >
                  Capture Photo
                </button>
                {showCamera && (
                  <div className="flex flex-col items-center gap-2 mt-2">
                    <video ref={videoRef} autoPlay className="rounded border w-48 h-36 object-cover" />
                    <div className="flex gap-2">
                      <button type="button" className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleCapturePhoto}>Take Photo</button>
                      <button type="button" className="bg-gray-400 text-white px-3 py-1 rounded" onClick={handleCloseCamera}>Cancel</button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {capturedPhoto && (
                  <div className="mt-2 flex flex-col items-center">
                    <img src={capturedPhoto} alt="Captured" className="rounded border w-32 h-24 object-cover" />
                    <span className="text-xs text-gray-500 mt-1">Photo will be submitted</span>
                  </div>
                )}
                {errors.capturedPhoto && <p className="text-red-500 text-xs mt-1">{errors.capturedPhoto}</p>}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:from-blue-700 hover:to-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
      <footer className="w-full fixed bottom-0 left-0 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700 text-white text-center py-3 text-base z-50 shadow-lg border-t border-blue-300" style={{letterSpacing: '0.5px'}}>
        <div className="flex flex-col items-center justify-center">
         
          <span className="text-xs mt-1">Copyright © 2025 All Rights Reserved - <span className="font-black text-white drop-shadow-lg tracking-widest uppercase text-base sm:text-md">Jammu & Kashmir e-Governance Agency</span></span>
        </div>
      </footer>
    </div>
  );
}

export default LabourForm;
