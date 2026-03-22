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
        api.get('/clients/clients/?page_size=500'),
      ]);
      const csData = caseStudiesRes.data?.results ?? caseStudiesRes.data ?? [];
      const clData = clientsRes.data?.results ?? clientsRes.data ?? [];
      setCaseStudies(Array.isArray(csData) ? csData : []);
      setClients(Array.isArray(clData) ? clData : []);
    } catch {
      setCaseStudies([]);
      setClients([]);
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
    const clientId = caseStudy.client_id ?? caseStudy.client?.id ?? caseStudy.client ?? '';
    setFormData({
      title: caseStudy.title || '',
      client: String(clientId),
      problem: caseStudy.problem || '',
      solution: caseStudy.solution || '',
      result: caseStudy.result || '',
      metrics:
        typeof caseStudy.metrics === 'object' && caseStudy.metrics !== null
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
    } catch {
      alert('Failed to delete case study');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let metricsObj = {};
    if (formData.metrics?.trim()) {
      try {
        metricsObj = JSON.parse(formData.metrics.trim());
      } catch {
        alert('Invalid JSON format for metrics. Please check your syntax (e.g. {"revenue": "+50%", "users": "10K"}).');
        return;
      }
    }

    const payload = {
      title: formData.title,
      client: formData.client ? parseInt(formData.client, 10) : null,
      problem: formData.problem,
      solution: formData.solution,
      result: formData.result,
      metrics: metricsObj,
      testimonial: formData.testimonial || '',
      is_public: formData.is_public,
    };

    try {
      if (editingCaseStudy) {
        await api.patch(`/clients/case-studies/${editingCaseStudy.id}/`, payload);
      } else {
        await api.post('/clients/case-studies/', payload);
      }
      fetchData();
      setShowForm(false);
      setEditingCaseStudy(null);
    } catch (err) {
      const msg =
        err.response?.data?.client?.[0] ||
        err.response?.data?.title?.[0] ||
        err.response?.data?.detail ||
        err.message;
      alert('Failed to save case study: ' + msg);
    }
  };

  const filteredCaseStudies = caseStudies.filter(
    (cs) =>
      cs.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.problem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.solution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.result?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (value, row) => (
        <div className="min-w-0">
          <span className="font-medium text-slate-900 block truncate max-w-[200px]" title={value}>
            {value}
          </span>
          {row.client_name && (
            <span className="text-xs text-slate-500 truncate block max-w-[200px]">{row.client_name}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Problem snippet',
      accessor: 'problem',
      render: (value) => (
        <div className="max-w-xs text-slate-600 text-sm line-clamp-2 truncate" title={value}>
          {value || '—'}
        </div>
      ),
    },
    {
      header: 'Public',
      accessor: 'is_public',
      render: (value) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (value) => (
        <span className="text-slate-600 text-sm">{value ? new Date(value).toLocaleDateString() : '—'}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-medium">Loading case studies...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-6xl mx-auto min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="p-2 sm:p-2.5 bg-white/20 rounded-lg sm:rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Case Studies</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage client case studies and success stories for your portfolio.</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleCreate}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Case Study
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-lg sm:rounded-xl font-semibold transition-colors text-sm sm:text-base"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Total</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{caseStudies.length}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Public</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-600">
              {caseStudies.filter((cs) => cs.is_public).length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">With Metrics</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
              {caseStudies.filter((cs) => cs.metrics && Object.keys(cs.metrics || {}).length > 0).length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Filtered</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{filteredCaseStudies.length}</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
          <input
            type="text"
            placeholder="Search by title, client, problem, solution, result..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm"
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredCaseStudies}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage="No case studies found"
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setShowForm(false)}
              />
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-slate-200 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">
                    {editingCaseStudy ? 'Edit Case Study' : 'Create Case Study'}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Title *</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. E-commerce Platform Redesign"
                          className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Client *</label>
                        <select
                          required
                          value={formData.client}
                          onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
                          className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                        >
                          <option value="">Select a client</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center pt-8">
                        <input
                          type="checkbox"
                          id="is_public"
                          checked={formData.is_public}
                          onChange={(e) => setFormData((prev) => ({ ...prev, is_public: e.target.checked }))}
                          className="rounded border-slate-300 text-slate-600 focus:ring-slate-400"
                        />
                        <label htmlFor="is_public" className="ml-2 text-sm font-medium text-slate-700">
                          Make public (visible on website)
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700">Problem *</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.problem}
                        onChange={(e) => setFormData((prev) => ({ ...prev, problem: e.target.value }))}
                        placeholder="Describe the challenge or problem the client faced..."
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Solution *</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.solution}
                        onChange={(e) => setFormData((prev) => ({ ...prev, solution: e.target.value }))}
                        placeholder="Describe the solution that was implemented..."
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Result *</label>
                      <textarea
                        required
                        rows={3}
                        value={formData.result}
                        onChange={(e) => setFormData((prev) => ({ ...prev, result: e.target.value }))}
                        placeholder="Describe the results and outcomes achieved..."
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        Metrics (JSON)
                        <span className="text-slate-500 font-normal ml-1">
                          Optional. e.g. {`{"revenue": "+50%", "users": "10K"}`}
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.metrics}
                        onChange={(e) => setFormData((prev) => ({ ...prev, metrics: e.target.value }))}
                        placeholder='{"revenue": "+50%", "users": "10K", "efficiency": "+30%"}'
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 font-mono text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Testimonial</label>
                      <textarea
                        rows={2}
                        value={formData.testimonial}
                        onChange={(e) => setFormData((prev) => ({ ...prev, testimonial: e.target.value }))}
                        placeholder="Optional client quote or testimonial..."
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
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
