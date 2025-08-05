
import React, { useState, useEffect } from 'react';
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
    photo_path: '',
  });
  const [sectors, setSectors] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch sectors list on component mount
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await api.get('/dynamic/sectors');
        setSectors(response.data.data); // sectors array
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
    // Sector selection is now optional; no validation
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
    if (!formData.photo_path.trim()) newErrors.photo_path = 'Photo URL or file path is required.';
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
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
      // Convert sector_id to number before sending
      const payload = {
        ...formData,
        sector_id: Number(formData.sector_id)
      };
      await api.post('/labour/register', payload);
      toast.success('Labour registered successfully!', { position: 'top-center', autoClose: 2500 });
      setFormData({
        name: '',
        father_name: '',
        sector_id: '',
        contact_number: '',
        aadhaar_number: '',
        photo_path: '',
      });
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
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 relative overflow-y-scroll">
      <ToastContainer />
      <div className="flex flex-1 items-center justify-center mt-2">
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
              <select
                name="sector_id"
                value={formData.sector_id}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.sector_id ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Sector</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
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
              <label className="block text-gray-700 font-semibold mb-1">Photo (URL or File Path):</label>
              <input
                type="text"
                name="photo_path"
                value={formData.photo_path}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${errors.photo_path ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Paste image URL or file path"
              />
              {errors.photo_path && <p className="text-red-500 text-xs mt-1">{errors.photo_path}</p>}
            </div>

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
      <footer className="w-full fixed bottom-0 left-0 bg-[#232323] text-white text-center py-1 text-sm z-50" style={{letterSpacing: '0.5px'}}>
        Copyright © 2025 - All Rights Reserved - Jammu & Kashmir e-Governance Agency
      </footer>
    </div>
  );
}

export default LabourForm;
