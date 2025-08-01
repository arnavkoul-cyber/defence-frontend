import React, { useState, useEffect } from 'react';
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

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Convert sector_id to number before sending
    const payload = {
      ...formData,
      sector_id: Number(formData.sector_id)
    };

    await api.post('/labour/register', payload);
    alert('Labour registered successfully!');
  } catch (err) {
    console.error('Error:', err);
    alert('Error registering labour');
  }
};


  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-xl font-bold mb-4">Labour Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div>
          <label className="block text-gray-700">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Father Name */}
        <div>
          <label className="block text-gray-700">Father Name:</label>
          <input
            type="text"
            name="father_name"
            value={formData.father_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Sector Dropdown */}
        <div>
          <label className="block text-gray-700">Sector:</label>
          <select
            name="sector_id"
            value={formData.sector_id}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Sector</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-gray-700">Contact Number:</label>
          <input
            type="text"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Aadhaar Number */}
        <div>
          <label className="block text-gray-700">Aadhaar Number:</label>
          <input
            type="text"
            name="aadhaar_number"
            value={formData.aadhaar_number}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="block text-gray-700">Photo (URL or File Path):</label>
          <input
            type="text"
            name="photo_path"
            value={formData.photo_path}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Submit
        </button>
      </form>
    </div>
  );
}

export default LabourForm;
