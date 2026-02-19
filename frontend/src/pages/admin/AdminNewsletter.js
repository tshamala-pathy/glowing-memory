import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';

const AdminNewsletter = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, subscription: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchSubscriptions();
  }, [isAuthenticated, user, navigate]);

  const fetchSubscriptions = async () => {
    try {
      setError(null);
      // Try to fetch from a list endpoint - this may need to be created on backend
      const response = await api.get('/newsletter/subscriptions/').catch(() => {
        // If endpoint doesn't exist, show message
        throw new Error('List endpoint not available');
      });
      const data = response.data.results || response.data;
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching newsletter subscriptions:', err);
      setError('Newsletter list endpoint not available. Please add a list ViewSet to the newsletter app.');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (subscription) => {
    setDeleteDialog({ open: true, subscription });
  };

  const confirmDelete = async () => {
    try {
      // This would require a delete endpoint
      await api.delete(`/newsletter/subscriptions/${deleteDialog.subscription.id}/`).catch(() => {
        throw new Error('Delete endpoint not available');
      });
      fetchSubscriptions();
      setDeleteDialog({ open: false, subscription: null });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      alert('Delete endpoint not available. Please add a delete endpoint to the newsletter app.');
    }
  };

  const filteredSubscriptions = subscriptions.filter((subscription) =>
    subscription.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Email', accessor: 'email' },
    { header: 'Name', accessor: 'name' },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'IP Address',
      accessor: 'subscribed_ip',
      render: (value) => value || 'N/A',
    },
    {
      header: 'Subscribed',
      accessor: 'subscribed_at',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A',
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
          <h1 className="text-3xl font-bold text-gray-900">Newsletter Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage newsletter subscribers</p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">{error}</p>
                <p className="mt-2 text-sm text-yellow-700">
                  To enable this feature, add a ViewSet to <code className="bg-yellow-100 px-1 rounded">newsletter/views.py</code> with list and retrieve actions.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredSubscriptions}
          onDelete={subscriptions.length > 0 ? handleDelete : undefined}
          emptyMessage={error ? "Endpoint not available" : "No newsletter subscriptions found"}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{subscriptions.length}</div>
              <div className="text-sm text-blue-700">Total Subscriptions</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {subscriptions.filter((s) => s.is_active).length}
              </div>
              <div className="text-sm text-green-700">Active Subscriptions</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {subscriptions.filter((s) => !s.is_active).length}
              </div>
              <div className="text-sm text-gray-700">Inactive Subscriptions</div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, subscription: null })}
          onConfirm={confirmDelete}
          title="Delete Subscription"
          message={`Are you sure you want to delete the subscription for "${deleteDialog.subscription?.email}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletter;

