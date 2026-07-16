import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminListSection,
  AdminTableWrap,
  AdminActionButtons,
  AdminRefreshButton,
  AdminPrimaryBannerButton,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1920&q=85';

const AdminCaseStudies = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [caseStudies, setCaseStudies] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
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

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
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
      if (isRefresh) setRefreshing(false);
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

  const filteredCaseStudies = useMemo(() => {
    return caseStudies.filter((cs) => {
      const matchesSearch =
        !searchTerm ||
        cs.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cs.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cs.problem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cs.solution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cs.result?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        statusFilter === 'all' ||
        (statusFilter === 'public' && cs.is_public) ||
        (statusFilter === 'private' && !cs.is_public);
      return matchesSearch && matchesFilter;
    });
  }, [caseStudies, searchTerm, statusFilter]);

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  const publicCount = caseStudies.filter((cs) => cs.is_public).length;
  const withMetricsCount = caseStudies.filter(
    (cs) => cs.metrics && Object.keys(cs.metrics || {}).length > 0
  ).length;

  const statCards = [
    {
      label: 'Total studies',
      value: caseStudies.length,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Public',
      value: publicCount,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    },
    {
      label: 'With metrics',
      value: withMetricsCount,
      tone: 'bg-white border border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      label: 'Showing',
      value: filteredCaseStudies.length,
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    },
  ];

  const statusFilters = [
    { id: 'all', label: 'All', count: caseStudies.length },
    { id: 'public', label: 'Public', count: publicCount },
    { id: 'private', label: 'Private', count: caseStudies.length - publicCount },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Portfolio"
          title="Case Studies"
          description="Manage client case studies and success stories for your portfolio."
          primaryAction={
            <AdminPrimaryBannerButton onClick={handleCreate}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add case study
            </AdminPrimaryBannerButton>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchData(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        <AdminListSection
          title="All case studies"
          subtitle="Browse and manage portfolio success stories"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search title, client, problem, solution…"
          filters={statusFilters}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          showingCount={filteredCaseStudies.length}
          totalCount={caseStudies.length}
          hasActiveFilters={!!searchTerm.trim() || statusFilter !== 'all'}
          onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}
          onCreate={handleCreate}
          createLabel="New case study"
          emptyTitle="No case studies found"
          emptyDescription={
            searchTerm.trim() || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add your first case study to showcase client success.'
          }
          emptyActionLabel={searchTerm.trim() || statusFilter !== 'all' ? 'Clear filters' : 'Add first case study'}
          onEmptyAction={
            searchTerm.trim() || statusFilter !== 'all'
              ? () => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }
              : handleCreate
          }
        >
          <AdminTableWrap>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Study</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Problem</th>
                  <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Status</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCaseStudies.map((cs) => (
                  <tr key={cs.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 sm:px-6 py-4">
                      <p className="font-semibold text-slate-900 truncate max-w-xs">{cs.title}</p>
                      {cs.client_name && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{cs.client_name}</p>
                      )}
                    </td>
                    <td className="px-5 sm:px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-600 line-clamp-2 max-w-md">{cs.problem || '—'}</p>
                    </td>
                    <td className="px-5 sm:px-6 py-4 hidden lg:table-cell">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          cs.is_public ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cs.is_public ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-right">
                      <AdminActionButtons onEdit={() => handleEdit(cs)} onDelete={() => handleDelete(cs)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        </AdminListSection>

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
