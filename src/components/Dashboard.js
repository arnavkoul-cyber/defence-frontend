import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Sidebar from './Sidebar';

function Dashboard() {
  const [labours, setLabours] = useState([]);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [armyUnitId, setArmyUnitId] = useState('');
  const [armyUnits, setArmyUnits] = useState([]); // store fetched army units
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch labours for a specific officer (example officer_id = 2)
  const fetchLabours = async () => {
    try {
      const res = await api.get(`/labour/3`);
      setLabours(res.data.labours || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch army units for dropdown
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
    setArmyUnitId(''); // reset unit selection
    fetchArmyUnits();  // fetch latest units for dropdown
    setIsModalOpen(true);
  };

  // const handleAssignArmyUnit = async () => {
  //   if (!armyUnitId || !selectedLabour) {
  //     return alert('Please select an army unit');
  //   }
  //   try {
  //     await api.post('/labour/assign-army-unit', {
  //       army_unit_id: Number(armyUnitId),
  //       labour_ids: [selectedLabour.id], // already sending selected labour id
  //     });
  //     setIsModalOpen(false);
  //     fetchLabours(); // refresh list
  //   } catch (err) {
  //     console.error(err);
  //     alert('Failed to assign army unit');
  //   }
  // };
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
    fetchLabours(); // refresh the labour list
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
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-4">Labour List</h2>
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Father Name</th>
              <th className="border p-2">Contact</th>
              <th className="border p-2">Aadhaar</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {labours.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No labours found.
                </td>
              </tr>
            ) : (
              labours.map((labour) => (
                <tr key={labour.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-2">{labour.name}</td>
                  <td className="border p-2">{labour.father_name}</td>
                  <td className="border p-2">{labour.contact_number}</td>
                  <td className="border p-2">{labour.aadhaar_number}</td>
                  <td className="border p-2 space-x-2">
                    <button
                      onClick={() => handleEdit(labour)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(labour.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-md w-96">
              <h3 className="text-lg font-bold mb-4">
                Assign Army Unit to {selectedLabour?.name}
              </h3>
              <label className="block mb-2">Select Army Unit:</label>
              <select
                value={armyUnitId}
                onChange={(e) => setArmyUnitId(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              >
                <option value="">-- Select Army Unit --</option>
                {armyUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignArmyUnit}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
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
