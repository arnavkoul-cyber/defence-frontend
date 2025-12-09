import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Header from '../Header';
import Footer from '../footer';
import AdminSidebar from './AdminSidebar';
import { FiTrash2, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const REQUESTS_PER_PAGE = 8;

const LabourDeletionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComment, setAdminComment] = useState('');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [viewingReason, setViewingReason] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/labour/pending-requests');
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      toast.error('Failed to fetch deletion requests', { position: 'top-center', autoClose: 1800 });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setAdminComment('');
    setIsApproveModalOpen(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setAdminComment('');
    setIsRejectModalOpen(true);
  };

  const handleViewReason = (request) => {
    setViewingReason(request);
    setIsReasonModalOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;

    try {
      // Delete the labour record
      const token = localStorage.getItem('auth_token');
      await api.delete(`/labour/${selectedRequest.labour_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Delete the request from labour_delete_requests table
      await api.post('/labour/approve-request', {
        request_id: selectedRequest.id,
        admin_id: localStorage.getItem('userId'),
        admin_comment: adminComment.trim() || 'Approved'
      });

      toast.success('Labour deleted successfully', { position: 'top-center', autoClose: 2000 });
      setIsApproveModalOpen(false);
      setSelectedRequest(null);
      setAdminComment('');
      
      // Refresh the requests list after a short delay
      setTimeout(async () => {
        await fetchPendingRequests();
      }, 500);
    } catch (err) {
      console.error('Error deleting labour:', err);
      const apiError = err?.response?.data?.error;
      toast.error(apiError || 'Failed to delete labour', { position: 'top-center', autoClose: 1800 });
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest) return;
    
    if (!adminComment.trim()) {
      toast.error('Please provide a reason for rejection', { position: 'top-center', autoClose: 1800 });
      return;
    }

    try {
      await api.post('/labour/reject-request', {
        request_id: selectedRequest.id,
        admin_id: localStorage.getItem('userId'),
        admin_comment: adminComment
      });

      toast.success('Request rejected', { position: 'top-center', autoClose: 2000 });
      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      setAdminComment('');
      await fetchPendingRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      toast.error('Failed to reject request', { position: 'top-center', autoClose: 1800 });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Pagination
  const totalPages = Math.ceil(requests.length / REQUESTS_PER_PAGE) || 1;
  const paginatedRequests = requests.slice((currentPage - 1) * REQUESTS_PER_PAGE, currentPage * REQUESTS_PER_PAGE);

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
        
        <main className={`flex-1 px-3 sm:px-4 md:px-6 pt-4 pb-24 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'ml-0'}`}>
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 ring-1 ring-red-200 shadow-sm flex items-center justify-center">
                <FiTrash2 className="text-red-600 w-6 h-6" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-800">
                Labour Deletion Requests
              </h1>
            </div>
            <div className="mt-2 h-1.5 w-32 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading requests...</div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {requests.length} pending deletion {requests.length === 1 ? 'request' : 'requests'}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Labour Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Father Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Army Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Officer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Requested On</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center p-6 text-gray-600 italic">
                          No pending deletion requests
                        </td>
                      </tr>
                    ) : (
                      paginatedRequests.map((request, index) => (
                        <tr key={request.id} className="odd:bg-white even:bg-gray-50 hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-800">{(currentPage - 1) * REQUESTS_PER_PAGE + index + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">{request.labour_current_name || request.labour_name || '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{request.father_name || '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{request.contact_number || '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{request.army_unit_name || '—'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{request.officer_mobile || '—'}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewReason(request)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition font-medium"
                            >
                              View
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(request.created_at)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveClick(request)}
                                title="Approve and Delete Labour"
                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition"
                              >
                                <FiCheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRejectClick(request)}
                                title="Reject Request"
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                              >
                                <FiXCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {requests.length === 0 && (
                  <div className="text-center text-gray-500 bg-white border border-gray-200 rounded-lg py-6 shadow">
                    No pending deletion requests
                  </div>
                )}
                {paginatedRequests.map((request, index) => (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{request.labour_current_name || request.labour_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Father: {request.father_name || '—'}</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                        Pending
                      </span>
                    </div>
                    
                    <div className="mt-2 text-xs space-y-1">
                      <div><span className="font-semibold text-gray-700">Contact:</span> {request.contact_number || '—'}</div>
                      <div><span className="font-semibold text-gray-700">Army Unit:</span> {request.army_unit_name || '—'}</div>
                      <div><span className="font-semibold text-gray-700">Officer:</span> {request.officer_mobile || '—'}</div>
                      <div><span className="font-semibold text-gray-700">Requested:</span> {formatDate(request.created_at)}</div>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() => handleViewReason(request)}
                        className="w-full px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition text-sm font-medium"
                      >
                        View Reason
                      </button>
                    </div>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleApproveClick(request)}
                        className="flex-1 px-3 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(request)}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <FiXCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {requests.length > REQUESTS_PER_PAGE && (
                <div className="flex items-center justify-center mt-6 space-x-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded bg-blue-600 text-white font-semibold transition disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    Prev
                  </button>
                  <span className="font-semibold text-gray-700">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded bg-blue-600 text-white font-semibold transition disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Approve Modal */}
          {isApproveModalOpen && selectedRequest && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                  <h2 className="text-xl font-bold">Approve Deletion Request</h2>
                  <button
                    onClick={() => setIsApproveModalOpen(false)}
                    className="p-1 rounded-full hover:bg-white/20 transition"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 font-medium">⚠️ Warning</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will permanently delete the labour record for <span className="font-bold">{selectedRequest.labour_current_name || selectedRequest.labour_name}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold">Officer's Reason:</span> {selectedRequest.comment}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Admin Comment (Optional)
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="Add any additional notes..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex gap-3">
                  <button
                    onClick={() => setIsApproveModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveSubmit}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Approve & Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {isRejectModalOpen && selectedRequest && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                  <h2 className="text-xl font-bold">Reject Deletion Request</h2>
                  <button
                    onClick={() => setIsRejectModalOpen(false)}
                    className="p-1 rounded-full hover:bg-white/20 transition"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-gray-700 mb-2">
                      You are rejecting the deletion request for: <span className="font-bold text-gray-900">{selectedRequest.labour_current_name || selectedRequest.labour_name}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      The labour record will remain in the system.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold">Officer's Reason:</span> {selectedRequest.comment}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason for Rejection <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="Explain why you are rejecting this request..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows="4"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex gap-3">
                  <button
                    onClick={() => setIsRejectModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectSubmit}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Reason Modal */}
          {isReasonModalOpen && viewingReason && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                  <h2 className="text-xl font-bold">Deletion Reason</h2>
                  <button
                    onClick={() => setIsReasonModalOpen(false)}
                    className="p-1 rounded-full hover:bg-white/20 transition"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Labour Name</label>
                    <p className="text-gray-800 font-medium mt-1">{viewingReason.labour_current_name || viewingReason.labour_name || '—'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Officer</label>
                    <p className="text-gray-800 font-medium mt-1">{viewingReason.officer_mobile || '—'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Requested On</label>
                    <p className="text-gray-800 font-medium mt-1">{formatDate(viewingReason.created_at)}</p>
                  </div>

                  <div className="border-t pt-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Reason for Deletion</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <p className="text-gray-800 whitespace-pre-wrap">{viewingReason.comment || 'No reason provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
                  <button
                    onClick={() => setIsReasonModalOpen(false)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      </div>

      <Footer bgColor="#0b50a2" />
    </div>
  );
};

export default LabourDeletionRequests;
