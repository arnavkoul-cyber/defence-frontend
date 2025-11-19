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
  // Fetch all sectors and army units for sector name lookup
  const [allSectors, setAllSectors] = useState([]);
  const [allArmyUnits, setAllArmyUnits] = useState([]);

  useEffect(() => {
    async function fetchMeta() {
      try {
        const token = localStorage.getItem('auth_token');
        const [sectorsRes, armyUnitsRes] = await Promise.all([
          api.get('/sectors', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/army-units', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setAllSectors(sectorsRes.data.data || sectorsRes.data.sectors || []);
        setAllArmyUnits(armyUnitsRes.data.army_units || []);
      } catch (err) {
        setAllSectors([]);
        setAllArmyUnits([]);
      }
    }
    fetchMeta();
  }, []);

  // Helper to get sector name for a user
  const getUserSectorName = (user) => {
    if (user.role && user.role.toLowerCase() === 'defence officer') {
      const sector = allSectors.find(s => String(s.id) === String(user.sector_id));
      return sector ? sector.name : user.sector_id ? `Sector ${user.sector_id}` : '-';
    }
    if (user.role && user.role.toLowerCase() === 'army officer') {
      const unit = allArmyUnits.find(u => String(u.id) === String(user.army_unit_id));
      if (unit) {
        const sector = allSectors.find(s => String(s.id) === String(unit.sector_id));
        return sector ? sector.name : unit.sector_id ? `Sector ${unit.sector_id}` : '-';
      }
      return '-';
    }
    return '-';
  };

  // Helper to get army unit name for army officers
  const getUserArmyUnitName = (user) => {
    if (user.role && user.role.toLowerCase() === 'army officer') {
      const unit = allArmyUnits.find(u => String(u.id) === String(user.army_unit_id));
      return unit ? unit.name : '-';
    }
    return '-';
  };
  // Manual refresh handler
  const handleRefresh = async () => {
    await fetchUsers();
    setPage(1);
  };
  // State declarations first
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newUser, setNewUser] = useState({ mobile_number: '', role: '', sector_id: '', army_unit_id: '' });
  const [selectedSectorName, setSelectedSectorName] = useState('');
  const [sectors, setSectors] = useState([]);
  const [armyUnits, setArmyUnits] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchMobile, setSearchMobile] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Delete handler
  const handleDeleteUser = async (mobile_number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await api.delete(`/users/${mobile_number}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('User deleted successfully!');
      // Refresh users list (cache-busted)
      await fetchUsers();
      setPage(1);
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  // Fetch sectors for dropdown
  useEffect(() => {
    if (showModal) {
      const fetchSectors = async () => {
        try {
          const token = localStorage.getItem('auth_token');
          const res = await api.get('/sectors', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Sectors API response:', res.data); // Debug log
          console.log('Total sectors count:', res.data.count || res.data.data?.length); // Debug log
          console.log('Sectors data array length:', res.data.data?.length); // Debug log
          setSectors(res.data.data || res.data.sectors || []);
        } catch (err) {
          console.error('Failed to fetch sectors:', err);
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
    setNewUser({ mobile_number: '', role: '', sector_id: '', army_unit_id: '' });
    setSelectedSectorName('');
    setArmyUnits([]);
    setAddError('');
    setAddSuccess('');
  };
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    // If role is changed to 'army officer', fetch army units
    if (name === 'role' && value.toLowerCase() === 'army officer') {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await api.get('/army-units', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setArmyUnits(res.data.army_units || []);
      } catch (err) {
        setArmyUnits([]);
      }
    }
    // If role is changed to something else, clear army_unit_id
    if (name === 'role' && value.toLowerCase() !== 'army officer') {
      setNewUser((prev) => ({ ...prev, army_unit_id: '' }));
      setArmyUnits([]);
      setSelectedSectorName('');
    }
    // If army_unit_id is changed, update sector_id and sector name
    if (name === 'army_unit_id') {
      const selectedUnit = armyUnits.find(unit => String(unit.id) === String(value));
      if (selectedUnit) {
        setNewUser((prev) => ({ ...prev, sector_id: selectedUnit.sector_id }));
        // Find sector name from sectors list
        const sectorObj = sectors.find(sector => String(sector.id) === String(selectedUnit.sector_id));
        setSelectedSectorName(sectorObj ? sectorObj.name : '');
      } else {
        setSelectedSectorName('');
      }
    }
    // If sector_id is changed (for non-army officer), update sector name
    if (name === 'sector_id' && (!newUser.role || newUser.role.toLowerCase() !== 'army officer')) {
      const sectorObj = sectors.find(sector => String(sector.id) === String(value));
      setSelectedSectorName(sectorObj ? sectorObj.name : '');
    }
  };
  const handleAddUser = async () => {
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    try {
      const token = localStorage.getItem('auth_token');
  // Do not send role_id, keep it null for both roles
  let role_id = null;
      if (!newUser.mobile_number || !newUser.role || !newUser.sector_id ||
        (newUser.role && newUser.role.toLowerCase() === 'army officer' && !newUser.army_unit_id)) {
        setAddError('All fields are required.');
        setAddLoading(false);
        return;
      }
      let sector_id = null;
      if (newUser.role && newUser.role.toLowerCase() === 'army officer') {
        // Find the selected army unit and get its sector_id
        const selectedUnit = armyUnits.find(unit => String(unit.id) === String(newUser.army_unit_id));
        sector_id = selectedUnit ? selectedUnit.sector_id : null;
      } else {
        sector_id = Number(newUser.sector_id);
      }
      const payload = {
        mobile_number: newUser.mobile_number,
        role_id: null,
        is_verified: 0,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        role: newUser.role,
        sector_id,
        army_unit_id: newUser.role && newUser.role.toLowerCase() === 'army officer' ? Number(newUser.army_unit_id) : null,
      };
      const response = await api.post('/users', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Optimistic update: Add new user to the list immediately
      const newUserData = {
        id: response.data.user?.id || Date.now(), // Use response ID or timestamp as fallback
        mobile_number: payload.mobile_number,
        role: payload.role,
        created_at: payload.created_at,
        sector_id: payload.sector_id,
        army_unit_id: payload.army_unit_id,
      };
      
      // Add to the beginning of the list (newest first)
      setUsers((prevUsers) => [newUserData, ...prevUsers]);
      
      // Show success message
      setAddSuccess('User added successfully!');
      toast.success('User added successfully!');
      
      // Close modal and reset form
      setAddLoading(false);
      setTimeout(() => {
        setShowModal(false);
        setNewUser({ mobile_number: '', role: '', sector_id: '', army_unit_id: '' });
        setSelectedSectorName('');
        setArmyUnits([]);
      }, 500); // Small delay to show success message before closing
      
      // Refresh from server in background to ensure consistency
      try {
        const res = await api.get('/users', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data.users || []);
      } catch (refreshErr) {
        console.error('Background refresh failed:', refreshErr);
      }
    } catch (err) {
      let errorMsg = 'Failed to add user.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setAddError(errorMsg);
      toast.error(errorMsg);
      setAddLoading(false);
    }
  };

  // Fetch users on component mount
  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      // Add cache-busting param
      const res = await api.get(`/users?t=${Date.now()}`, {
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
  }
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by date range, mobile number, and role
  useEffect(() => {
    let filtered = users;

    // Filter by mobile number search
    if (searchMobile.trim()) {
      filtered = filtered.filter(user => 
        user.mobile_number && user.mobile_number.includes(searchMobile.trim())
      );
    }

    // Filter by role
    if (filterRole) {
      filtered = filtered.filter(user => 
        user.role && user.role.toLowerCase() === filterRole.toLowerCase()
      );
    }

    // Filter by date range
    if (filterStartDate || filterEndDate) {
      filtered = filtered.filter((user) => {
        if (!user.created_at) return false;
        
        const createdDate = new Date(user.created_at);
        const start = filterStartDate ? new Date(filterStartDate) : null;
        const end = filterEndDate ? new Date(filterEndDate) : null;
        
        // Set time to start of day for comparison
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        createdDate.setHours(0, 0, 0, 0);
        
        if (start && end) {
          return createdDate >= start && createdDate <= end;
        } else if (start) {
          return createdDate >= start;
        } else if (end) {
          return createdDate <= end;
        }
        return true;
      });
    }
    
    setFilteredUsers(filtered);
    setPage(1); // Reset to first page when filter changes
  }, [users, filterStartDate, filterEndDate, searchMobile, filterRole]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* White emblem watermark background */}
      <div 
        className="fixed inset-0 bg-center bg-no-repeat opacity-[0.12] pointer-events-none z-[1]"
        style={{
          backgroundImage: `url(${require('../../assets/white_emb.jpeg')})`,
          backgroundSize: '45%',
        }}
        aria-hidden="true"
      ></div>
      
      <div className="relative z-10">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <Header variant="blue" bgColor="#0b50a2" isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />
      {!isSidebarOpen && (
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-24 z-50 p-2 rounded-md bg-white text-blue-600 ring-1 ring-blue-300 shadow hover:bg-blue-50"
        >
          <span className="font-bold">›</span>
        </button>
      )}
      <div className="flex flex-1">
        <AdminSidebar bgColor="#0b50a2" isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(v => !v)} />
        <main className={`flex-1 flex flex-col items-center justify-center p-3 sm:p-4 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'ml-0'} overflow-x-hidden`}>
          <div className="w-full max-w-4xl bg-white rounded-lg shadow p-4 sm:p-6 mt-2 flex flex-col items-center">
            <div className="w-full mb-4 sm:mb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-blue-800">Users List</h2>
                
                {/* Search, Filter and Action Buttons in one row */}
                <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                  {/* Mobile Search */}
                  <input
                    type="text"
                    placeholder="Search mobile..."
                    value={searchMobile}
                    onChange={(e) => setSearchMobile(e.target.value)}
                    className="border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
                  />
                  
                  {/* Role Filter */}
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[140px]"
                  >
                    <option value="">All Roles</option>
                    <option value="army officer">Army Officer</option>
                    <option value="defence officer">Defence Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  {/* Clear Button */}
                  {(searchMobile || filterRole) && (
                    <button
                      onClick={() => {
                        setSearchMobile('');
                        setFilterRole('');
                      }}
                      className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition"
                    >
                      Clear
                    </button>
                  )}
                  
                  {/* Action Buttons */}
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow flex items-center text-sm"
                    onClick={handleRefresh}
                    title="Refresh Users List"
                  >
                    &#x21bb; Refresh
                  </button>
                  <button
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg shadow flex items-center text-sm"
                    onClick={handleOpenModal}
                  >
                    <span className="text-xl mr-2">+</span> Add User
                  </button>
                </div>
              </div>
            </div>
            {/* Modal for Add New User */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-md relative my-8 max-h-[90vh] overflow-y-auto">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold z-10"
                    onClick={handleCloseModal}
                  >
                    &times;
                  </button>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-blue-800 pr-8">Add New User</h3>
                  {addError && <div className="mb-2 text-red-600 font-semibold text-sm">{addError}</div>}
                  {addSuccess && <div className="mb-2 text-green-600 font-semibold text-sm">{addSuccess}</div>}
                  <div className="mb-4">
                    <label className="block text-blue-800 font-semibold mb-1 text-sm">Mobile Number</label>
                    <input
                      type="text"
                      name="mobile_number"
                      value={newUser.mobile_number}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter mobile number"
                      maxLength={10}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-blue-800 font-semibold mb-1 text-sm">Role</label>
                    <select
                      name="role"
                      value={newUser.role}
                      onChange={handleInputChange}
                      className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select role</option>
                      <option value="army officer">Army Officer</option>
                      <option value="defence officer">Defence Officer</option>
                    </select>
                  </div>
                  {/* Show sector only if Defence Officer is selected */}
                  {newUser.role && newUser.role.toLowerCase() === 'defence officer' && (
                    <div className="mb-4">
                      <label className="block text-blue-800 font-semibold mb-1 text-sm">Sector</label>
                      <select
                        name="sector_id"
                        value={newUser.sector_id}
                        onChange={handleInputChange}
                        className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        size="8"
                        style={{ height: '200px', overflowY: 'scroll' }}
                      >
                        <option value="" className="py-2 hover:bg-blue-50">Select sector</option>
                        {sectors.map((sector) => (
                          <option key={sector.id} value={sector.id} className="py-2 px-2 hover:bg-blue-50 cursor-pointer">
                            {sector.name || `Sector ${sector.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Show army unit and sector name only if Army Officer is selected */}
                  {newUser.role && newUser.role.toLowerCase() === 'army officer' && (
                    <>
                      <div className="mb-4">
                        <label className="block text-blue-800 font-semibold mb-1 text-sm">Army Unit</label>
                        <select
                          name="army_unit_id"
                          value={newUser.army_unit_id}
                          onChange={handleInputChange}
                          className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          size="8"
                          style={{ height: '200px', overflowY: 'scroll' }}
                        >
                          <option value="" className="py-2 hover:bg-blue-50">Select Army Unit</option>
                          {armyUnits.map((unit) => (
                            <option key={unit.id} value={unit.id} className="py-2 px-2 hover:bg-blue-50 cursor-pointer">
                              {unit.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {newUser.army_unit_id && (
                        <div className="mb-6">
                          <label className="block text-blue-800 font-semibold mb-1 text-sm">Sector (Auto-filled)</label>
                          <input
                            type="text"
                            value={selectedSectorName}
                            readOnly
                            className="w-full border border-blue-300 rounded px-3 py-2 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
                          />
                        </div>
                      )}
                    </>
                  )}
                  <button
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded shadow text-sm sm:text-base"
                    onClick={handleAddUser}
                    disabled={addLoading}
                  >
                    {addLoading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </div>
            )}

            {/* Date Filter */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">From:</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">To:</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                {(filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Clear Date Filter
                  </button>
                )}
                <div className="ml-auto text-sm text-gray-600">
                  Showing <span className="font-bold text-blue-600">{filteredUsers.length}</span> of <span className="font-bold">{users.length}</span> users
                </div>
              </div>
            </div>

            <div className="w-full">
              <table className="w-full border border-blue-800 rounded-lg shadow-lg divide-y divide-gray-200">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-2 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800 w-[8%]">S.No</th>
                    <th className="px-3 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800 w-[18%]">Mobile No</th>
                    <th className="px-3 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800 w-[15%] hidden sm:table-cell">Created At</th>
                    <th className="px-3 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800 w-[12%]">Role</th>
                    <th className="px-3 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800 w-[20%]">Army Unit</th>
                    <th className="px-3 py-3 text-left text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800 w-[17%]">Sector</th>
                    <th className="px-3 py-3 text-center text-sm font-extrabold text-blue-800 uppercase tracking-wider border-b border-blue-800 w-[10%]">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500 font-semibold text-base">Loading...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-red-500 font-semibold text-base">{error}</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500 font-semibold text-base">No users to display yet.</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500 font-semibold text-base">No users found for the selected date range.</td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, idx) => (
                      <tr key={user.id} className="transition-colors duration-150 hover:bg-blue-50">
                        <td className="px-2 py-4 text-sm font-bold text-gray-900 border-b border-blue-100">{(page - 1) * USERS_PER_PAGE + idx + 1}</td>
                        <td className="px-3 py-4 text-sm font-bold border-b border-blue-100 break-all">{user.mobile_number}</td>
                        <td className="px-3 py-4 text-sm font-bold border-b border-blue-100 hidden sm:table-cell">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                        <td
                          className={
                            `px-3 py-4 text-sm font-bold border-b border-blue-100 uppercase ` +
                            (user.role && user.role.toUpperCase() === 'DEFENCE OFFICER'
                              ? 'text-blue-700'
                              : user.role && user.role.toUpperCase() === 'ARMY OFFICER'
                                ? 'text-green-700'
                                : 'text-gray-800')
                          }
                        >
                          {user.role ? (user.role.toUpperCase() === 'DEFENCE OFFICER' ? 'DEFENCE' : user.role.toUpperCase() === 'ARMY OFFICER' ? 'ARMY' : user.role.toUpperCase()) : '-'}
                        </td>
                        <td className="px-3 py-4 text-sm font-bold border-b border-blue-100 break-words">{getUserArmyUnitName(user)}</td>
                        <td className="px-3 py-4 text-sm font-bold border-b border-blue-100 break-words">{getUserSectorName(user)}</td>
                        <td className="px-3 py-4 border-b border-blue-100 text-center">
                          {user.role && user.role.toUpperCase() !== 'ADMIN' && (
                            <button
                              className="inline-flex items-center justify-center p-2 rounded hover:bg-red-100"
                              title="Delete"
                              onClick={() => handleDeleteUser(user.mobile_number)}
                            >
                              <FiTrash2 className="text-red-600 w-5 h-5" />
                            </button>
                          )}
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
                  className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-200 transition-colors"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {(() => {
                    const maxPagesToShow = 5;
                    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
                    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                    
                    if (endPage - startPage < maxPagesToShow - 1) {
                      startPage = Math.max(1, endPage - maxPagesToShow + 1);
                    }
                    
                    const pages = [];
                    
                    // First page button
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          className="px-3 py-2 rounded-lg font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          onClick={() => setPage(1)}
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                      }
                    }
                    
                    // Page number buttons
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                            page === i 
                              ? 'bg-blue-700 text-white shadow-md' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                          onClick={() => setPage(i)}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    // Last page button
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          className="px-3 py-2 rounded-lg font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                          onClick={() => setPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                </div>
                
                <button
                  className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-200 transition-colors"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
            
            {/* Page info */}
            {filteredUsers.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Showing {Math.min((page - 1) * USERS_PER_PAGE + 1, filteredUsers.length)} to {Math.min(page * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
              </div>
            )}
          </div>
        </main>
      </div>
      </div>
      <Footer />
    </div>
  );
}

export default UsersList;
