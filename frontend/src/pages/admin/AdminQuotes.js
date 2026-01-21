import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';

const AdminQuotes = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, quote: null });
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    company_name: '',
    project_title: '',
    project_description: '',
    project_type: '',
    budget_range: '',
    deadline: '',
    estimated_amount: '',
    status: 'Pending',
    notes: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/dashboard');
      return;
    }
    fetchQuotes();
  }, [isAuthenticated, user, navigate]);

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
      budget_range: quote.budget_range || '',
      deadline: quote.deadline || '',
      estimated_amount: quote.estimated_amount || '',
      status: quote.status || 'Pending',
      notes: quote.notes || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuote) {
        await api.put(`/quotes/${editingQuote.id}/`, formData);
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
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { header: 'Project Title', accessor: 'project_title' },
    { header: 'Client', accessor: 'client_name' },
    { header: 'Email', accessor: 'client_email' },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Approved' ? 'bg-green-100 text-green-800' :
          value === 'Rejected' ? 'bg-red-100 text-red-800' :
          value === 'In Progress' ? 'bg-blue-100 text-blue-800' :
          value === 'Completed' ? 'bg-purple-100 text-purple-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      ),
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
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
                  {selectedQuote.estimated_amount && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estimated Amount</label>
                      <p className="text-gray-900 font-bold text-lg">
                        R {parseFloat(selectedQuote.estimated_amount).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    {selectedQuote.status === 'Pending' && (
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
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
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
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        rows={4}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

