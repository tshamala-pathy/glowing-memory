import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';

const AdminInvoices = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, invoice: null });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/dashboard');
      return;
    }
    fetchInvoices();
    fetchQuotes();
  }, [isAuthenticated, user, navigate]);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices/');
      const data = response.data.results || response.data;
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await api.get('/quotes/');
      const data = response.data.results || response.data;
      setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const handleCreate = () => {
    setEditingInvoice(null);
    setSelectedInvoice(null);
    setShowForm(true);
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setSelectedInvoice(invoice);
    setShowForm(true);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleDelete = (invoice) => {
    setDeleteDialog({ open: true, invoice });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/invoices/${deleteDialog.invoice.id}/`);
      fetchInvoices();
      setDeleteDialog({ open: false, invoice: null });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const response = await api.get(`/invoices/${invoice.id}/pdf/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handleMarkPaid = async (invoice) => {
    try {
      await api.post(`/invoices/${invoice.id}/mark_paid/`);
      fetchInvoices();
      if (selectedInvoice?.id === invoice.id) {
        fetchInvoices().then(() => {
          const updated = invoices.find((inv) => inv.id === invoice.id);
          if (updated) setSelectedInvoice(updated);
        });
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Failed to update invoice');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { header: 'Invoice #', accessor: 'invoice_number' },
    { header: 'Client', accessor: 'client_name' },
    {
      header: 'Total',
      accessor: 'total_amount',
      render: (value) => `R ${parseFloat(value).toFixed(2)}`,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          value === 'Paid' ? 'bg-green-100 text-green-800' :
          value === 'Sent' ? 'bg-blue-100 text-blue-800' :
          value === 'Overdue' ? 'bg-red-100 text-red-800' :
          value === 'Draft' ? 'bg-gray-100 text-gray-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
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
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 mt-1">Manage invoices and payments</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Invoice
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search invoices..."
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
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${selectedInvoice ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <DataTable
              columns={columns}
              data={filteredInvoices}
              onEdit={handleView}
              onDelete={handleDelete}
              emptyMessage="No invoices found"
            />
          </div>

          {selectedInvoice && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                    <p className="text-gray-900 font-medium">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Client</label>
                    <p className="text-gray-900 font-medium">{selectedInvoice.client_name}</p>
                    <p className="text-gray-600 text-sm">{selectedInvoice.client_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amounts</label>
                    <p className="text-gray-900">Subtotal: R {parseFloat(selectedInvoice.subtotal || 0).toFixed(2)}</p>
                    <p className="text-gray-900">VAT ({selectedInvoice.vat_rate}%): R {parseFloat(selectedInvoice.vat_amount || 0).toFixed(2)}</p>
                    <p className="text-gray-900 font-bold text-lg">Total: R {parseFloat(selectedInvoice.total_amount || 0).toFixed(2)}</p>
                    <p className="text-gray-900">Paid: R {parseFloat(selectedInvoice.amount_paid || 0).toFixed(2)}</p>
                    <p className="text-gray-900 font-semibold">Due: R {parseFloat(selectedInvoice.amount_due || 0).toFixed(2)}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <button
                      onClick={() => handleDownloadPDF(selectedInvoice)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download PDF
                    </button>
                    {selectedInvoice.status !== 'Paid' && (
                      <button
                        onClick={() => handleMarkPaid(selectedInvoice)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Mark as Paid
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(selectedInvoice)}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Edit Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, invoice: null })}
          onConfirm={confirmDelete}
          title="Delete Invoice"
          message={`Are you sure you want to delete invoice "${deleteDialog.invoice?.invoice_number}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminInvoices;

