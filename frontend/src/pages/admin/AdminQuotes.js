import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';

// Backend uses lowercase status; display labels in UI
const QUOTE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'replied', label: 'Replied' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
];

const AdminQuotes = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, quote: null });
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    company_name: '',
    project_title: '',
    project_description: '',
    project_type: '',
    service_type: '',
    budget_range: '',
    deadline: '',
    timeline: '',
    estimated_amount: '',
    status: 'pending',
    notes: '',
    admin_response: '',
    assigned_to: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchQuotes();
    fetchUsers();
    fetchClients();
  }, [isAuthenticated, user, navigate]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/clients/');
      const data = response.data.results || response.data;
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await api.get('/quotes/');
      const data = response.data.results || response.data;
      setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/list/');
      const data = response.data.results || response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEdit = (quote) => {
    setEditingQuote(quote);
    setFormData({
      client_name: quote.client_name || '',
      client_email: quote.client_email || '',
      client_phone: quote.client_phone || '',
      company_name: quote.company_name || '',
      project_title: quote.project_title || '',
      project_description: quote.project_description || '',
      project_type: quote.project_type || '',
      service_type: quote.service_type || '',
      budget_range: quote.budget_range || '',
      deadline: quote.deadline || '',
      timeline: quote.timeline || '',
      estimated_amount: quote.estimated_amount || '',
      status: quote.status || 'pending',
      notes: quote.notes || '',
      admin_response: quote.admin_response || '',
      assigned_to: quote.assigned_to || '',
    });
    setShowForm(true);
  };

  const handleView = (quote) => {
    setSelectedQuote(quote);
  };

  const handleDelete = (quote) => {
    setDeleteDialog({ open: true, quote });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/quotes/${deleteDialog.quote.id}/`);
      fetchQuotes();
      setDeleteDialog({ open: false, quote: null });
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    }
  };

  const handleApprove = async (quote) => {
    try {
      await api.post(`/quotes/${quote.id}/approve/`);
      fetchQuotes();
    } catch (error) {
      console.error('Error approving quote:', error);
      alert('Failed to approve quote');
    }
  };

  const handleReject = async (quote) => {
    try {
      await api.post(`/quotes/${quote.id}/reject/`);
      fetchQuotes();
    } catch (error) {
      console.error('Error rejecting quote:', error);
      alert('Failed to reject quote');
    }
  };

  const handleSendResponse = async (quote) => {
    if (!quote.admin_response || quote.admin_response.trim() === '') {
      alert('Please add an admin response before sending the email.');
      return;
    }
    
    if (!window.confirm(`Send response email to ${quote.client_email}?`)) {
      return;
    }
    
    try {
      await api.post(`/quotes/${quote.id}/send_response/`);
      alert('Response email sent successfully!');
      fetchQuotes();
      if (selectedQuote && selectedQuote.id === quote.id) {
        setSelectedQuote({ ...selectedQuote, status: 'replied' });
      }
    } catch (error) {
      console.error('Error sending response email:', error);
      alert(error.response?.data?.error || 'Failed to send response email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      // Convert empty string to null for assigned_to (ForeignKey field)
      if (submitData.assigned_to === '') {
        submitData.assigned_to = null;
      }
      if (editingQuote) {
        const { data } = await api.put(`/quotes/${editingQuote.id}/`, submitData);
        if (selectedQuote && selectedQuote.id === editingQuote.id) {
          setSelectedQuote(data);
        }
      }
      fetchQuotes();
      setShowForm(false);
      setEditingQuote(null);
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote');
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const matchesClient = !clientFilter || String(quote.client) === String(clientFilter);
    return matchesSearch && matchesStatus && matchesClient;
  });

  const columns = [
    { header: 'Project Title', accessor: 'project_title' },
    { header: 'Client', accessor: 'client_name' },
    { header: 'Email', accessor: 'client_email' },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => {
        const opt = QUOTE_STATUS_OPTIONS.find((o) => o.value === value);
        const label = opt ? opt.label : value;
        const style = value === 'approved' || value === 'paid' ? 'bg-green-100 text-green-800' :
          value === 'declined' ? 'bg-red-100 text-red-800' :
          value === 'replied' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800';
        return <span className={`px-2 py-1 text-xs rounded-full ${style}`}>{label}</span>;
      },
    },
    {
      header: 'Estimated',
      accessor: 'estimated_amount',
      render: (value) => value ? `R ${parseFloat(value).toFixed(2)}` : 'N/A',
    },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes & Estimates</h1>
          <p className="text-gray-600 mt-1">Manage client quote requests and estimates</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {QUOTE_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${selectedQuote ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <DataTable
              columns={columns}
              data={filteredQuotes}
              onEdit={handleView}
              onDelete={handleDelete}
              emptyMessage="No quotes found"
            />
          </div>

          {selectedQuote && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Quote Details</h3>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Client</label>
                    <p className="text-gray-900 font-medium">{selectedQuote.client_name}</p>
                    <p className="text-gray-600 text-sm">{selectedQuote.client_email}</p>
                    {selectedQuote.client_phone && (
                      <p className="text-gray-600 text-sm">{selectedQuote.client_phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project</label>
                    <p className="text-gray-900 font-medium">{selectedQuote.project_title}</p>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedQuote.project_description}</p>
                  </div>
                  {selectedQuote.service_type && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service Type</label>
                      <p className="text-gray-900">{selectedQuote.service_type}</p>
                    </div>
                  )}
                  {selectedQuote.timeline && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Timeline</label>
                      <p className="text-gray-900">{selectedQuote.timeline}</p>
                    </div>
                  )}
                  {selectedQuote.estimated_amount && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estimated Amount</label>
                      <p className="text-gray-900 font-bold text-lg">
                        R {parseFloat(selectedQuote.estimated_amount).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {selectedQuote.admin_response && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Admin Response</label>
                      {selectedQuote.responded_at && (
                        <p className="text-xs text-gray-500 mb-1">
                          Replied at {new Date(selectedQuote.responded_at).toLocaleString()}
                        </p>
                      )}
                      <p className="text-gray-900 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {selectedQuote.admin_response}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    {selectedQuote.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedQuote)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(selectedQuote)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {selectedQuote.admin_response && selectedQuote.status !== 'replied' && (
                      <button
                        onClick={() => handleSendResponse(selectedQuote)}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        📧 Send Response Email
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(selectedQuote)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Quote</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {QUOTE_STATUS_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estimated Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.estimated_amount}
                          onChange={(e) => setFormData({ ...formData, estimated_amount: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                      <select
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Unassigned --</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name && user.last_name
                              ? `${user.first_name} ${user.last_name} (${user.email})`
                              : user.username || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Admin Response (Sent to Client)
                      </label>
                      <textarea
                        rows={6}
                        value={formData.admin_response}
                        onChange={(e) => setFormData({ ...formData, admin_response: e.target.value })}
                        placeholder="Enter your response to the client. Saving with status 'Replied' will set the reply and send the email."
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This response will be emailed to the client. Set status to "Replied" or use the "Send Response Email" button.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
                      <textarea
                        rows={4}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Internal notes (not visible to client)"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, quote: null })}
          onConfirm={confirmDelete}
          title="Delete Quote"
          message={`Are you sure you want to delete the quote for "${deleteDialog.quote?.project_title}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminQuotes;

