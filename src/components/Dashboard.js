import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Sidebar from './Sidebar';

function Dashboard() {
  const [labours, setLabours] = useState([]);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [armyUnitId, setArmyUnitId] = useState('');
  const [armyUnits, setArmyUnits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLabours = async () => {
    try {

      const res = await api.get(`/labour/${localStorage.getItem('userId')}`);
      setLabours(res.data.labours || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchArmyUnits = async () => {
    try {
      const res = await api.get('/dynamic/army_units');
      setArmyUnits(res.data.data || []);
    } catch (err) {
      console.error('Error fetching army units:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/labour/${id}`);
      fetchLabours();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (labour) => {
    setSelectedLabour(labour);
    setArmyUnitId('');
    fetchArmyUnits();
    setIsModalOpen(true);
  };

  const handleAssignArmyUnit = async () => {
    if (!armyUnitId || !selectedLabour) {
      return alert('Please select an army unit');
    }
    try {
      await api.post('/labour/assign-army-unit', {
        army_unit_id: Number(armyUnitId),
        labour_ids: [selectedLabour.id],
      });
      setIsModalOpen(false);
      fetchLabours();
      alert(`Army unit assigned successfully to ${selectedLabour.name}`);
    } catch (err) {
      console.error(err);
      alert('Failed to assign army unit');
    }
  };

  useEffect(() => {
    fetchLabours();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-6">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Labour Management</h2>

        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Father Name</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Aadhaar</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labours.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">No labours found.</td>
                </tr>
              ) : (
                labours.map((labour) => {
                  // Capitalize first letter utility
                  const capitalize = (str) => str && typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
                  return (
                    <tr key={labour.id} className="border-t hover:bg-gray-50 transition duration-150">
                      <td className="p-3">{capitalize(labour.name)}</td>
                      <td className="p-3">{capitalize(labour.father_name)}</td>
                      <td className="p-3">{labour.contact_number}</td>
                      <td className="p-3">{labour.aadhaar_number}</td>
                      <td className="p-3 flex space-x-2">
                        <button
                          onClick={() => handleEdit(labour)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleDelete(labour.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Assign Army Unit to {selectedLabour?.name}
              </h3>
              <label className="block mb-2 text-sm font-medium text-gray-700">Select Army Unit:</label>
              <select
                value={armyUnitId}
                onChange={(e) => setArmyUnitId(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Army Unit --</option>
                {armyUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignArmyUnit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
