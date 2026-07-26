import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
import api, { getMediaUrl } from '../../services/api';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1920&q=85';

const AdminClients = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientRelated, setClientRelated] = useState({ quotes: [], invoices: [], projects: [] });
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, client: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    internal_notes: '',
    is_public: false,
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);

  const fetchClients = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const response = await api.get('/clients/clients/');
      const data = response.data?.results ?? response.data;
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchClients();
  }, [isAuthenticated, user, navigate, fetchClients]);

  const handleCreate = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      industry: '',
      description: '',
      internal_notes: '',
      is_public: false,
      logo: null,
    });
    setLogoPreview(null);
    setShowForm(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      industry: client.industry || '',
      description: client.description || '',
      internal_notes: client.internal_notes || '',
      is_public: client.is_public || false,
      logo: null,
    });
    setLogoPreview(client.logo ? getMediaUrl(client.logo) : null);
    setSelectedClient(null);
    setShowForm(true);
  };

  const handleView = async (client) => {
    setSelectedClient(client);
    setLoadingRelated(true);
    setClientRelated({ quotes: [], invoices: [], projects: [] });
    try {
      const [quotesRes, invoicesRes, projectsRes] = await Promise.all([
        api.get(`/quotes/?client=${client.id}`),
        api.get(`/invoices/?client=${client.id}`),
        api.get(`/clients/clients/${client.id}/projects/`),
      ]);
      setClientRelated({
        quotes: quotesRes.data?.results ?? quotesRes.data ?? [],
        invoices: invoicesRes.data?.results ?? invoicesRes.data ?? [],
        projects: Array.isArray(projectsRes.data) ? projectsRes.data : [],
      });
    } catch {
      setClientRelated({ quotes: [], invoices: [], projects: [] });
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleDelete = (client) => {
    setDeleteDialog({ open: true, client });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/clients/clients/${deleteDialog.client.id}/`);
      fetchClients();
      setDeleteDialog({ open: false, client: null });
      setSelectedClient(null);
    } catch {
      alert('Failed to delete client');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        industry: formData.industry || '',
        description: formData.description || '',
        internal_notes: formData.internal_notes || '',
        is_public: formData.is_public,
      };

      if (formData.logo) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          fd.append(k, v === true ? 'true' : v === false ? 'false' : String(v));
        });
        fd.append('logo', formData.logo);

        if (editingClient) {
          await api.patch(`/clients/clients/${editingClient.id}/`, fd);
        } else {
          await api.post('/clients/clients/', fd);
        }
      } else {
        if (editingClient) {
          await api.patch(`/clients/clients/${editingClient.id}/`, payload);
        } else {
          await api.post('/clients/clients/', payload);
        }
      }
      fetchClients();
      setShowForm(false);
      setEditingClient(null);
    } catch (err) {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || err.message;
      alert('Failed to save client: ' + msg);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return clients.filter((c) => {
      const matchesSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q);
      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'public' && c.is_public) ||
        (visibilityFilter === 'private' && !c.is_public);
      return matchesSearch && matchesVisibility;
    });
  }, [clients, searchTerm, visibilityFilter]);

  const statCards = [
    {
      label: 'Total',
      value: clients.length,
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      label: 'Public',
      value: clients.filter((c) => c.is_public).length,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'With Logo',
      value: clients.filter((c) => c.logo).length,
      tone: 'bg-white border border-slate-100',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'Filtered',
      value: filteredClients.length,
      tone: 'bg-white border border-slate-100',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    },
  ];

  const visibilityFilters = [
    { id: 'all', label: 'All', count: clients.length },
    { id: 'public', label: 'Public', count: clients.filter((c) => c.is_public).length },
    { id: 'private', label: 'Private', count: clients.filter((c) => !c.is_public).length },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Clients & Users"
          title="Clients"
          description="Manage your client portfolio and relationships."
          primaryAction={
            <div className="flex flex-wrap gap-2">
              <AdminPrimaryBannerButton onClick={handleCreate}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add client
              </AdminPrimaryBannerButton>
              <Link
                to="/admin/client-projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Projects
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          }
          secondaryAction={<AdminRefreshButton onClick={() => fetchClients(true)} refreshing={refreshing} />}
        />

        <AdminStatGrid stats={statCards} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={selectedClient ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <AdminListSection
              title="All clients"
              subtitle="Browse, search, and manage client records"
              listIcon={listIcon}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search by name, industry, description…"
              filters={visibilityFilters}
              activeFilter={visibilityFilter}
              onFilterChange={setVisibilityFilter}
              showingCount={filteredClients.length}
              totalCount={clients.length}
              hasActiveFilters={!!searchTerm.trim() || visibilityFilter !== 'all'}
              onClearFilters={() => {
                setSearchTerm('');
                setVisibilityFilter('all');
              }}
              onCreate={handleCreate}
              createLabel="Add client"
              emptyTitle="No clients found"
              emptyDescription={
                searchTerm.trim() || visibilityFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first client to get started.'
              }
              emptyActionLabel={searchTerm.trim() || visibilityFilter !== 'all' ? 'Clear filters' : 'Add client'}
              onEmptyAction={
                searchTerm.trim() || visibilityFilter !== 'all'
                  ? () => {
                      setSearchTerm('');
                      setVisibilityFilter('all');
                    }
                  : handleCreate
              }
            >
              <AdminTableWrap>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white">
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 w-16">Logo</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Name</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Industry</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell">Public</th>
                      <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:table-cell">Projects</th>
                      <th className="px-5 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className={`hover:bg-slate-50/80 transition-colors ${selectedClient?.id === client.id ? 'bg-slate-50' : ''}`}
                      >
                        <td className="px-5 sm:px-6 py-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {client.logo ? (
                              <img src={getMediaUrl(client.logo)} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-slate-400 text-sm font-semibold">
                                {(client.name || '?').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm font-semibold text-slate-900">{client.name}</td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-slate-600 hidden sm:table-cell">{client.industry || '—'}</td>
                        <td className="px-5 sm:px-6 py-4 hidden md:table-cell">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              client.is_public ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {client.is_public ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-5 sm:px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">{client.projects_count ?? 0}</td>
                        <td className="px-5 sm:px-6 py-4 text-right">
                          <AdminActionButtons
                            onEdit={() => handleEdit(client)}
                            onDelete={() => handleDelete(client)}
                            extra={
                              <button
                                type="button"
                                onClick={() => handleView(client)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                              >
                                View
                              </button>
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminTableWrap>
            </AdminListSection>
          </div>

          {selectedClient && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Client Details</h3>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    {selectedClient.logo ? (
                      <img
                        src={getMediaUrl(selectedClient.logo)}
                        alt={selectedClient.name}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-xl font-medium">
                        {(selectedClient.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{selectedClient.name}</p>
                      <p className="text-sm text-slate-600">{selectedClient.industry || 'No industry'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
                    <p className="text-slate-700 text-sm mt-0.5 line-clamp-4">{selectedClient.description || '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(selectedClient)}
                      className="flex-1 px-3 py-2 bg-slate-700 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Edit
                    </button>
                    <Link
                      to="/admin/quotes"
                      className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 text-center transition-colors"
                    >
                      Quotes
                    </Link>
                    <Link
                      to="/admin/invoices"
                      className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 text-center transition-colors"
                    >
                      Invoices
                    </Link>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <h4 className="font-medium text-slate-900 text-sm">Related Items</h4>
                  {loadingRelated ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Quotes ({clientRelated.quotes.length})
                        </label>
                        <ul className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                          {clientRelated.quotes.length === 0 ? (
                            <li className="text-sm text-slate-500">No quotes</li>
                          ) : (
                            clientRelated.quotes.map((q) => (
                              <li key={q.id} className="text-sm">
                                <Link
                                  to="/admin/quotes"
                                  className="text-slate-700 hover:text-slate-900 hover:underline truncate block"
                                >
                                  {q.project_title || `Quote #${q.id}`} — {q.status}
                                </Link>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Invoices ({clientRelated.invoices.length})
                        </label>
                        <ul className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                          {clientRelated.invoices.length === 0 ? (
                            <li className="text-sm text-slate-500">No invoices</li>
                          ) : (
                            clientRelated.invoices.map((inv) => (
                              <li key={inv.id} className="text-sm">
                                <Link
                                  to="/admin/invoices"
                                  className="text-slate-700 hover:text-slate-900 hover:underline truncate block"
                                >
                                  {inv.invoice_number || `Inv #${inv.id}`} — R{' '}
                                  {parseFloat(inv.total_amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}{' '}
                                  ({inv.status})
                                </Link>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Projects ({clientRelated.projects.length})
                        </label>
                        <ul className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                          {clientRelated.projects.length === 0 ? (
                            <li className="text-sm text-slate-500">No projects</li>
                          ) : (
                            clientRelated.projects.map((p) => (
                              <li key={p.id} className="text-sm">
                                <Link
                                  to="/admin/client-projects"
                                  className="text-slate-700 hover:text-slate-900 hover:underline truncate block"
                                >
                                  {p.name || `Project #${p.id}`} — {p.status}
                                </Link>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setShowForm(false)}
              />
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-200 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">
                    {editingClient ? 'Edit Client' : 'Create Client'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Company or contact name"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Industry</label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                        placeholder="e.g. Technology, Healthcare, Finance"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Description</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the client"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Internal notes (admin only)</label>
                      <textarea
                        rows={2}
                        value={formData.internal_notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, internal_notes: e.target.value }))}
                        placeholder="Notes visible only to staff"
                        className="mt-1 block w-full border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                      {logoPreview && (
                        <img
                          src={logoPreview}
                          alt="Preview"
                          className="mt-2 h-24 w-24 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={formData.is_public}
                        onChange={(e) => setFormData((prev) => ({ ...prev, is_public: e.target.checked }))}
                        className="rounded border-slate-300 text-slate-600 focus:ring-slate-400"
                      />
                      <label htmlFor="is_public" className="text-sm font-medium text-slate-700">
                        Make public (visible on website)
                      </label>
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
                      {editingClient ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, client: null })}
          onConfirm={confirmDelete}
          title="Delete Client"
          message={`Are you sure you want to delete "${deleteDialog.client?.name}"? This will also delete all associated projects and case studies. This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
