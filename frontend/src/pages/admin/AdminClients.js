import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api, { getMediaUrl } from '../../services/api';

const AdminClients = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientRelated, setClientRelated] = useState({ quotes: [], invoices: [], projects: [] });
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, client: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    internal_notes: '',
    is_public: false,
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);

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
  }, [isAuthenticated, user, navigate]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/clients/');
      const data = response.data?.results ?? response.data;
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Logo',
      accessor: 'logo',
      render: (value, row) => (
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
          {value ? (
            <img src={getMediaUrl(value)} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 text-lg font-medium">
              {(row.name || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (value) => <span className="font-medium text-slate-900">{value}</span>,
    },
    {
      header: 'Industry',
      accessor: 'industry',
      render: (value) => (
        <span className="text-slate-600 text-sm">{value || '—'}</span>
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
      header: 'Projects',
      accessor: 'projects_count',
      render: (value) => (
        <span className="text-slate-600 text-sm">{value ?? 0}</span>
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
            <p className="text-slate-600 font-medium">Loading clients...</p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">Clients</h1>
              </div>
              <p className="text-slate-100 text-sm sm:text-lg">Manage your client portfolio and relationships.</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleCreate}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Client
              </button>
              <button
                onClick={fetchClients}
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
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{clients.length}</div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Public</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-600">
              {clients.filter((c) => c.is_public).length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">With Logo</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
              {clients.filter((c) => c.logo).length}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">Filtered</div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{filteredClients.length}</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200">
          <input
            type="text"
            placeholder="Search by name, industry, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 text-sm"
          />
        </div>

        {/* Table + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={selectedClient ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
              <DataTable
                columns={columns}
                data={filteredClients}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                emptyMessage="No clients found"
              />
            </div>
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
