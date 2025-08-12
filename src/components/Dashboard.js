import React, { useEffect, useState } from 'react';
import api from '../api/api';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './footer';
import { FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';

function Dashboard() {
  // Determine if this is the Army Dashboard
  const isArmyDashboard = (() => {
    const armyUnitId = localStorage.getItem('army_unit_id');
    return !!armyUnitId && armyUnitId !== "null";
  })();
  const [labours, setLabours] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const [selectedLabour, setSelectedLabour] = useState(null);
  const [armyUnitId, setArmyUnitId] = useState('');
  const [armyUnits, setArmyUnits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState('');

  const fetchLabours = async () => {
    try {
      const armyUnitId = localStorage.getItem('army_unit_id');
      let tableTile;
      if (!armyUnitId || armyUnitId === "null") {
        tableTile = "Labours Management";
        const res = await api.get(`/labour/${localStorage.getItem('userId')}`);
        setLabours(res.data.labours || []);
      } 
      else {  
        tableTile = "Labours Details";
        const res = await api.get(`/labour/assigned/${localStorage.getItem('mobile_number')}`);
        setLabours(res.data.labours || []);
      }
      setCurrentPage(1); // Reset to first page on fetch
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
    console.log('Deleting labour with ID:', id);
    try {
      await api.delete(`/labour/${id}`);
    } catch (err) {
      console.error('Delete failed, falling back to refresh:', err?.response?.status || err?.message);
      // If API returns 404, treat as already removed from server and optimistically update UI
      
    } finally {
      // Always refresh the list from server as requested
      fetchLabours();
    }
  };

  const handleEdit = (labour) => {
    // kept for backward compatibility if needed elsewhere
    setSelectedLabour(labour);
    setArmyUnitId('');
    fetchArmyUnits();
    setIsModalOpen(true);
  };

  // Open decision (View) modal
  const handleView = (labour) => {
    setSelectedLabour(labour);
    setDecisionRemarks('');
    setIsDecisionModalOpen(true);
  };

  // Accept -> close decision modal and open assign modal
  const handleAccept = () => {
    if (!selectedLabour) return;
    setIsDecisionModalOpen(false);
    setArmyUnitId('');
    fetchArmyUnits();
    setIsModalOpen(true);
  };

  // Reject -> delete entry (optionally could send remarks if backend supports)
  const handleReject = async () => {
    if (!selectedLabour) return;
    try {
      // Log remarks locally for now
      console.log('Rejecting labour', selectedLabour.id, 'remarks:', decisionRemarks);
      // Close the modal immediately for snappier UX
      setIsDecisionModalOpen(false);
      const id = selectedLabour.id;
      setSelectedLabour(null);
      setDecisionRemarks('');

  // Remove entry
  await handleDelete(id);
  toast.success('Labour entry removed', { position: 'top-center', autoClose: 1600 });
    } catch (err) {
      console.error(err);
  toast.error('Failed to remove entry', { position: 'top-center', autoClose: 1800 });
    }
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
  // Cards moved to Analytics page; keep base fetch only
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(labours.length / entriesPerPage);
  const paginatedLabours = labours.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header bgColor="#261d1a" />
      <div className="flex flex-1">
        <Sidebar bgColor="#261d1a" />
    <main className="flex-1 px-6 pt-2 pb-24 ml-60 mt-1">
          <div className="mb-5">
            <div className="flex items-end gap-3">
              <span className="h-10 w-10 rounded-full bg-blue-100 ring-1 ring-blue-200 shadow-sm flex items-center justify-center">
                <FiUsers className="text-blue-600 w-6 h-6" />
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 drop-shadow-sm">
                {isArmyDashboard ? 'Labourers Details' : 'Labour Management'}
              </h2>
            </div>
            <div className="mt-2 h-1.5 w-28 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"></div>
          </div>
            {/* Defence analytics cards moved to Analytics page */}
  

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Name</th>
                {!isArmyDashboard && <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Father Name</th>}
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Aadhaar</th>
                {!isArmyDashboard && (
                  <>
                    
                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Actions</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Remarks</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {labours.length === 0 ? (
                <tr>
                  <td colSpan={isArmyDashboard ? 3 : 6} className="text-center py-4 text-gray-500">No labours found.</td>
                </tr>
              ) : (
                paginatedLabours.map((labour) => {
                  // Capitalize first letter utility
                  const capitalize = (str) => str && typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
                  return (
                    <tr key={labour.id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">{capitalize(labour.name)}</td>
                      {!isArmyDashboard && <td className="px-6 py-4">{capitalize(labour.father_name)}</td>}
                      <td className="px-6 py-4">{labour.contact_number}</td>
                      <td className="px-6 py-4">{labour.aadhaar_number}</td>
                      {!isArmyDashboard && (
                        <>
                      
                          <td className="px-6 py-4 flex space-x-2">
                            <button
                              onClick={() => handleView(labour)}
                              disabled={!!labour.army_unit_id}
                              title={labour.army_unit_id ? 'Already assigned to an Army Unit' : 'Review and assign'}
                              className={`px-3 py-1 rounded-full shadow-sm transition text-white ${labour.army_unit_id ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                              View
                            </button>
                          </td>
                              <td className="px-6 py-4">
                            {labour.army_unit_id ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Assigned</span>
                            ) : (
                              <span className="text-gray-400">{/* empty when not assigned */}</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

  {/* Pagination Controls */}
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

        {/* Assign Army Unit Modal */}
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

        {/* Decision Modal: Accept or Reject with Remarks */}
        {isDecisionModalOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Review Entry</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedLabour?.name} — {selectedLabour?.contact_number}</p>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
              <textarea
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add remarks for acceptance/rejection"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Reject
                </button>
                <button
                  onClick={handleAccept}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
  <Footer bgColor="#261d1a" />
    </div>
  );
}

export default Dashboard;
