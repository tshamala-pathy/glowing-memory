import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';

const AdminCaseStudies = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [caseStudies, setCaseStudies] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, caseStudy: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    problem: '',
    solution: '',
    result: '',
    metrics: '',
    testimonial: '',
    is_public: false,
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
    fetchData();
  }, [isAuthenticated, user, navigate]);

  const fetchData = async () => {
    try {
      const [caseStudiesRes, clientsRes] = await Promise.all([
        api.get('/clients/case-studies/'),
        api.get('/clients/clients/'),
      ]);
      const caseStudiesData = caseStudiesRes.data.results || caseStudiesRes.data;
      const clientsData = clientsRes.data.results || clientsRes.data;
      setCaseStudies(Array.isArray(caseStudiesData) ? caseStudiesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCaseStudy(null);
    setFormData({
      title: '',
      client: '',
      problem: '',
      solution: '',
      result: '',
      metrics: '',
      testimonial: '',
      is_public: false,
    });
    setShowForm(true);
  };

  const handleEdit = (caseStudy) => {
    setEditingCaseStudy(caseStudy);
    setFormData({
      title: caseStudy.title || '',
      client: caseStudy.client || '',
      problem: caseStudy.problem || '',
      solution: caseStudy.solution || '',
      result: caseStudy.result || '',
      metrics: typeof caseStudy.metrics === 'object' 
        ? JSON.stringify(caseStudy.metrics, null, 2) 
        : caseStudy.metrics || '',
      testimonial: caseStudy.testimonial || '',
      is_public: caseStudy.is_public || false,
    });
    setShowForm(true);
  };

  const handleDelete = (caseStudy) => {
    setDeleteDialog({ open: true, caseStudy });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/clients/case-studies/${deleteDialog.caseStudy.id}/`);
      fetchData();
      setDeleteDialog({ open: false, caseStudy: null });
    } catch (error) {
      console.error('Error deleting case study:', error);
      alert('Failed to delete case study');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let metricsObj = {};
      if (formData.metrics.trim()) {
        try {
          metricsObj = JSON.parse(formData.metrics);
        } catch (err) {
          alert('Invalid JSON format for metrics. Please check your syntax.');
          return;
        }
      }

      const submitData = {
        ...formData,
        metrics: metricsObj,
      };

      if (editingCaseStudy) {
        await api.put(`/clients/case-studies/${editingCaseStudy.id}/`, submitData);
      } else {
        await api.post('/clients/case-studies/', submitData);
      }
      fetchData();
      setShowForm(false);
      setEditingCaseStudy(null);
    } catch (error) {
      console.error('Error saving case study:', error);
      alert('Failed to save case study');
    }
  };

  const filteredCaseStudies = caseStudies.filter((cs) =>
    cs.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Client', accessor: 'client_name' },
    {
      header: 'Public',
      accessor: 'is_public',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case Studies</h1>
            <p className="text-gray-600 mt-1">Manage client case studies and success stories</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Case Study
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <input
            type="text"
            placeholder="Search case studies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredCaseStudies}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No case studies found"
        />

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingCaseStudy ? 'Edit Case Study' : 'Create Case Study'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client *</label>
                      <select
                        required
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Problem *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.problem}
                        onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                        placeholder="Describe the challenge or problem the client faced..."
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Solution *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.solution}
                        onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                        placeholder="Describe the solution that was implemented..."
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Result *</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.result}
                        onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                        placeholder="Describe the results and outcomes achieved..."
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Metrics (JSON format)
                        <span className="text-xs text-gray-500 ml-2">
                          Example: {"{"}"revenue": "+50%", "users": "10K", "efficiency": "+30%"{"}"}
                        </span>
                      </label>
                      <textarea
                        rows={4}
                        value={formData.metrics}
                        onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                        placeholder='{"revenue": "+50%", "users": "10K"}'
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 font-mono text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Testimonial</label>
                      <textarea
                        rows={3}
                        value={formData.testimonial}
                        onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                        placeholder="Optional client testimonial..."
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                        Make public (visible on website)
                      </label>
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
                      {editingCaseStudy ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, caseStudy: null })}
          onConfirm={confirmDelete}
          title="Delete Case Study"
          message={`Are you sure you want to delete "${deleteDialog.caseStudy?.title}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminCaseStudies;
