import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Header from '../Header';
import Footer from '../footer';
import AdminSidebar from './AdminSidebar';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const USERS_PER_PAGE = 6;

const UsersList = () => {
  const handleDeleteUser = async (mobile_number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await api.delete(`/users/${mobile_number}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('User deleted successfully!');
      // Refresh users list
      const res = await api.get('/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ mobile_number: '', role: '', sector_id: '', });
  const [sectors, setSectors] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Fetch sectors for dropdown
  useEffect(() => {
    if (showModal) {
      const fetchSectors = async () => {
        try {
          const res = await api.get('/dynamic/sectors');
          setSectors(res.data.data || []);
        } catch (err) {
          setSectors([]);
        }
      };
      fetchSectors();
    }
  }, [showModal]);

  const handleOpenModal = () => {
    setShowModal(true);
    setNewUser({ mobile_number: '', role: '', sector_id: '' });
    setAddError('');
    setAddSuccess('');
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddUser = async () => {
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    try {
      const token = localStorage.getItem('auth_token');
      // Map role to role_id (example: 1 for army officer, 2 for defence officer)
      let role_id = null;
      if (newUser.role && newUser.role.toLowerCase() === 'army officer') role_id = 1;
      else if (newUser.role && newUser.role.toLowerCase() === 'defence officer') role_id = 2;
      if (!newUser.mobile_number || !newUser.role || !newUser.sector_id) {
        setAddError('All fields are required.');
        setAddLoading(false);
        return;
      }
      const payload = {
        mobile_number: newUser.mobile_number,
        role_id,
        is_verified: 0,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        role: newUser.role,
        sector_id: Number(newUser.sector_id),
        army_unit_id: newUser.role && newUser.role.toLowerCase() === 'army officer' ? 1 : null,
      };
      await api.post('/users', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setAddSuccess('User added successfully!');
      toast.success('User added successfully!');
      setAddLoading(false);
      setShowModal(false);
      setNewUser({ mobile_number: '', role: '', sector_id: '' });
      // Optionally, refresh users list
      const res = await api.get('/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data.users || []);
    } catch (err) {
      setAddError('Failed to add user.');
      setAddLoading(false);
    }
  };
    console.log("UsersList component rendered");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await api.get('/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(res.data.users || []);
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const paginatedUsers = users.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <Header variant="blue" bgColor="#0b50a2" />
      <div className="flex flex-1">
        <AdminSidebar bgColor="#0b50a2" />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mt-2 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-blue-800">Users List</h2>
              <button
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow flex items-center text-base"
                onClick={handleOpenModal}
              >
                <span className="text-xl mr-2">+</span> Add New User
              </button>
            </div>
            {/* Modal for Add New User */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    onClick={handleCloseModal}
                  >
                    &times;
                  </button>
                  <h3 className="text-2xl font-bold mb-4 text-blue-800">Add New User</h3>
                  {addError && <div className="mb-2 text-red-600 font-semibold">{addError}</div>}
                  {addSuccess && <div className="mb-2 text-green-600 font-semibold">{addSuccess}</div>}
                  <div className="mb-4">
                    <label className="block text-blue-800 font-semibold mb-1">Mobile Number</label>
                    <input
                      type="text"
                      name="mobile_number"
                      value={newUser.mobile_number}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter mobile number"
                      maxLength={10}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-blue-800 font-semibold mb-1">Role</label>
                    <select
                      name="role"
                      value={newUser.role}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select role</option>
                      <option value="army officer">Army Officer</option>
                      <option value="defence officer">Defence Officer</option>
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="block text-blue-800 font-semibold mb-1">Sector</label>
                    <select
                      name="sector_id"
                      value={newUser.sector_id}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select sector</option>
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>{sector.name || `Sector ${sector.id}`}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow"
                    onClick={handleAddUser}
                    disabled={addLoading}
                  >
                    {addLoading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto w-full flex justify-center">
              <table className="min-w-[800px] w-full border border-blue-800 rounded-lg shadow-lg divide-y divide-gray-200">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">S.No</th>
                    <th className="px-6 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Mobile No</th>
                    <th className="px-6 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Created At</th>
                    <th className="px-6 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Role</th>
                    <th className="px-6 py-3 text-center text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-semibold">Loading...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-red-500 font-semibold">{error}</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 font-semibold">No users to display yet.</td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, idx) => (
                      <tr key={user.id} className="transition-colors duration-150 hover:bg-blue-50">
                        <td className="px-4 py-4 whitespace-nowrap font-bold text-gray-900 border-b border-blue-100">{(page - 1) * USERS_PER_PAGE + idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100">{user.mobile_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100">{user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</td>
                        <td
                          className={
                            `px-6 py-4 whitespace-nowrap font-bold border-b border-blue-100 uppercase ` +
                            (user.role && user.role.toUpperCase() === 'DEFENCE OFFICER'
                              ? 'text-blue-700'
                              : user.role && user.role.toUpperCase() === 'ARMY OFFICER'
                                ? 'text-green-700'
                                : 'text-gray-800')
                          }
                        >
                          {user.role ? user.role.toUpperCase() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-b border-blue-100 text-center">
                          {/* <button className="inline-flex items-center justify-center p-2 rounded hover:bg-blue-100 mr-2" title="Edit">
                            <FiEdit className="text-blue-700 w-5 h-5" />
                          </button> */}
                          <button
                            className="inline-flex items-center justify-center p-2 rounded hover:bg-red-100"
                            title="Delete"
                            onClick={() => handleDeleteUser(user.mobile_number)}
                          >
                            <FiTrash2 className="text-red-600 w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <button
                  className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1 rounded font-bold ${page === i + 1 ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default UsersList;
