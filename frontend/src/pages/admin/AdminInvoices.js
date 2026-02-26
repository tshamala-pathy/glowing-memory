import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';
import { getInvoiceStatusClass, getInvoiceStatusLabel } from '../../utils/formatters';

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
  const [clientFilter, setClientFilter] = useState('');
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    quote: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    client_company: '',
    client_vat_number: '',
    provider_name: 'PathyCode',
    provider_address: '',
    provider_phone: '',
    provider_email: '',
    provider_vat_number: '',
    items: [],
    subtotal: '0.00',
    vat_rate: '15.00',
    vat_amount: '0.00',
    total_amount: '0.00',
    amount_paid: '0.00',
    amount_due: '0.00',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    paid_date: '',
    status: 'draft',
    payment_method: '',
    payment_reference: '',
    notes: '',
    created_by: '',
  });
  const [currentItem, setCurrentItem] = useState({ description: '', quantity: '1', price: '0.00' });
  const [createFromQuoteModal, setCreateFromQuoteModal] = useState(false);
  const [createFromQuoteData, setCreateFromQuoteData] = useState({
    quote_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
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
    fetchInvoices();
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

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/admin/');
      const data = response.data.results || response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreate = () => {
    setEditingInvoice(null);
    setSelectedInvoice(null);
    setFormData({
      quote: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      client_address: '',
      client_company: '',
      client_vat_number: '',
      provider_name: 'PathyCode',
      provider_address: '',
      provider_phone: '',
      provider_email: '',
      provider_vat_number: '',
      items: [],
      subtotal: '0.00',
      vat_rate: '15.00',
      vat_amount: '0.00',
      total_amount: '0.00',
      amount_paid: '0.00',
      amount_due: '0.00',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      paid_date: '',
      status: 'draft',
      payment_method: '',
      payment_reference: '',
      notes: '',
      created_by: user?.id || '',
    });
    setCurrentItem({ description: '', quantity: '1', price: '0.00' });
    setShowForm(true);
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setSelectedInvoice(invoice);
    setFormData({
      quote: invoice.quote || '',
      client_name: invoice.client_name || '',
      client_email: invoice.client_email || '',
      client_phone: invoice.client_phone || '',
      client_address: invoice.client_address || '',
      client_company: invoice.client_company || '',
      client_vat_number: invoice.client_vat_number || '',
      provider_name: invoice.provider_name || 'PathyCode',
      provider_address: invoice.provider_address || '',
      provider_phone: invoice.provider_phone || '',
      provider_email: invoice.provider_email || '',
      provider_vat_number: invoice.provider_vat_number || '',
      items: Array.isArray(invoice.items) ? invoice.items : [],
      subtotal: invoice.subtotal || '0.00',
      vat_rate: invoice.vat_rate || '15.00',
      vat_amount: invoice.vat_amount || '0.00',
      total_amount: invoice.total_amount || '0.00',
      amount_paid: invoice.amount_paid || '0.00',
      amount_due: invoice.amount_due || '0.00',
      issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
      due_date: invoice.due_date || '',
      paid_date: invoice.paid_date || '',
      status: invoice.status || 'draft',
      payment_method: invoice.payment_method || '',
      payment_reference: invoice.payment_reference || '',
      notes: invoice.notes || '',
      created_by: invoice.created_by || user?.id || '',
    });
    setCurrentItem({ description: '', quantity: '1', price: '0.00' });
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

  const handleCreateFromQuote = () => {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setCreateFromQuoteData({
      quote_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: due.toISOString().split('T')[0],
      status: 'draft',
    });
    setCreateFromQuoteModal(true);
  };

  const handleSubmitCreateFromQuote = async (e) => {
    e.preventDefault();
    if (!createFromQuoteData.quote_id) {
      alert('Please select a quote');
      return;
    }
    try {
      await api.post('/invoices/create_from_quote/', {
        quote_id: parseInt(createFromQuoteData.quote_id, 10),
        issue_date: createFromQuoteData.issue_date,
        due_date: createFromQuoteData.due_date || undefined,
        status: createFromQuoteData.status,
      });
      fetchInvoices();
      setCreateFromQuoteModal(false);
    } catch (error) {
      const msg = error.response?.data?.error || 
        Object.values(error.response?.data || {}).flat().join(', ') ||
        'Failed to create invoice from quote';
      alert(msg);
    }
  };

  const approvedQuotesWithoutInvoice = quotes.filter((q) => {
    if (q.status !== 'Approved') return false;
    return !invoices.some((inv) => inv.quote === q.id || inv.quote?.id === q.id);
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      // Convert empty strings to null for optional fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });
      // Ensure items is an array
      if (!Array.isArray(submitData.items)) {
        submitData.items = [];
      }
      // Convert quote and created_by to null if empty
      if (submitData.quote === '') submitData.quote = null;
      if (submitData.created_by === '') submitData.created_by = null;

      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.id}/`, submitData);
      } else {
        await api.post('/invoices/', submitData);
      }
      fetchInvoices();
      setShowForm(false);
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error saving invoice:', error);
      const errorMsg = error.response?.data?.detail || 
                       Object.values(error.response?.data || {}).flat().join(', ') ||
                       'Failed to save invoice';
      alert(errorMsg);
    }
  };

  const calculateTotals = (items, vatRate, amountPaid) => {
    const itemsArray = items || [];
    const subtotal = itemsArray.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0));
    }, 0);
    const vat = parseFloat(vatRate || 15);
    const vatAmount = subtotal * (vat / 100);
    const totalAmount = subtotal + vatAmount;
    const paid = parseFloat(amountPaid || 0);
    const amountDue = totalAmount - paid;

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      vat_amount: vatAmount.toFixed(2),
      total_amount: totalAmount.toFixed(2),
      amount_due: amountDue.toFixed(2),
    }));
  };

  const addItem = () => {
    if (currentItem.description && currentItem.quantity && currentItem.price) {
      const newItems = [...formData.items, {
        description: currentItem.description,
        quantity: parseFloat(currentItem.quantity),
        price: parseFloat(currentItem.price),
      }];
      setFormData(prev => ({ ...prev, items: newItems }));
      setCurrentItem({ description: '', quantity: '1', price: '0.00' });
      calculateTotals(newItems, formData.vat_rate, formData.amount_paid);
    }
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
    calculateTotals(newItems, formData.vat_rate, formData.amount_paid);
  };


  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesClient = !clientFilter || String(invoice.client) === String(clientFilter);
    return matchesSearch && matchesStatus && matchesClient;
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
        <span className={`px-2 py-1 text-xs rounded-full ${getInvoiceStatusClass(value)}`}>
          {getInvoiceStatusLabel(value)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search invoices..."
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
              <option value="draft">Draft</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
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
                    {selectedInvoice.status !== 'paid' && (
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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Invoice Details */}
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Quote (Optional)</label>
                          <select
                            value={formData.quote || ''}
                            onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">-- No Quote --</option>
                            {quotes.map((quote) => (
                              <option key={quote.id} value={quote.id}>
                                {quote.project_title} - {quote.client_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                          <input
                            type="date"
                            required
                            value={formData.issue_date}
                            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Due Date</label>
                          <input
                            type="date"
                            required
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Client Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Client Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Client Name *</label>
                          <input
                            type="text"
                            required
                            value={formData.client_name}
                            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Client Email *</label>
                          <input
                            type="email"
                            required
                            value={formData.client_email}
                            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Client Phone</label>
                          <input
                            type="text"
                            value={formData.client_phone}
                            onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Client Company</label>
                          <input
                            type="text"
                            value={formData.client_company}
                            onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Client Address</label>
                          <textarea
                            rows={2}
                            value={formData.client_address}
                            onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Client VAT Number</label>
                          <input
                            type="text"
                            value={formData.client_vat_number}
                            onChange={(e) => setFormData({ ...formData, client_vat_number: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Provider Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Provider Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Provider Name</label>
                          <input
                            type="text"
                            value={formData.provider_name}
                            onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Provider Email</label>
                          <input
                            type="email"
                            value={formData.provider_email}
                            onChange={(e) => setFormData({ ...formData, provider_email: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Provider Phone</label>
                          <input
                            type="text"
                            value={formData.provider_phone}
                            onChange={(e) => setFormData({ ...formData, provider_phone: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Provider VAT Number</label>
                          <input
                            type="text"
                            value={formData.provider_vat_number}
                            onChange={(e) => setFormData({ ...formData, provider_vat_number: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Provider Address</label>
                          <textarea
                            rows={2}
                            value={formData.provider_address}
                            onChange={(e) => setFormData({ ...formData, provider_address: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Invoice Items</h4>
                      <div className="space-y-3">
                        {formData.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <span className="font-medium">{item.description}</span>
                              <span className="text-gray-600 ml-2">
                                Qty: {item.quantity} × R {parseFloat(item.price).toFixed(2)} = R {(parseFloat(item.quantity) * parseFloat(item.price)).toFixed(2)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="text"
                            placeholder="Description"
                            value={currentItem.description}
                            onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="number"
                            step="1"
                            placeholder="Quantity"
                            value={currentItem.quantity}
                            onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={currentItem.price}
                            onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })}
                            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={addItem}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Add Item
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Financial Details */}
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Financial Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">VAT Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.vat_rate}
                            onChange={(e) => {
                              const newVatRate = e.target.value;
                              setFormData(prev => ({ ...prev, vat_rate: newVatRate }));
                              calculateTotals(formData.items, newVatRate, formData.amount_paid);
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                          <input
                            type="text"
                            readOnly
                            value={`R ${parseFloat(formData.subtotal).toFixed(2)}`}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">VAT Amount</label>
                          <input
                            type="text"
                            readOnly
                            value={`R ${parseFloat(formData.vat_amount).toFixed(2)}`}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                          <input
                            type="text"
                            readOnly
                            value={`R ${parseFloat(formData.total_amount).toFixed(2)}`}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.amount_paid}
                            onChange={(e) => {
                              const newAmountPaid = e.target.value;
                              setFormData(prev => ({ ...prev, amount_paid: newAmountPaid }));
                              calculateTotals(formData.items, formData.vat_rate, newAmountPaid);
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount Due</label>
                          <input
                            type="text"
                            readOnly
                            value={`R ${parseFloat(formData.amount_due).toFixed(2)}`}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="border-b pb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                          <select
                            value={formData.payment_method || ''}
                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">-- Select Method --</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="PayPal">PayPal</option>
                            <option value="Cash">Cash</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Payment Reference</label>
                          <input
                            type="text"
                            value={formData.payment_reference}
                            onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Paid Date</label>
                          <input
                            type="date"
                            value={formData.paid_date}
                            onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Created By</label>
                          <select
                            value={formData.created_by || ''}
                            onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">-- Select User --</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.username || u.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                      <textarea
                        rows={4}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional notes or comments..."
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
                      {editingInvoice ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create from Quote Modal */}
        {createFromQuoteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setCreateFromQuoteModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <form onSubmit={handleSubmitCreateFromQuote} className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Create Invoice from Approved Quote</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select an approved quote that does not yet have an invoice. Client and project details will be copied automatically.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quote *</label>
                      <select
                        required
                        value={createFromQuoteData.quote_id}
                        onChange={(e) => setCreateFromQuoteData({ ...createFromQuoteData, quote_id: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Quote --</option>
                        {approvedQuotesWithoutInvoice.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.project_title} - {q.client_name} (Approved)
                          </option>
                        ))}
                      </select>
                      {approvedQuotesWithoutInvoice.length === 0 && (
                        <p className="mt-1 text-sm text-amber-600">No approved quotes without an invoice.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                      <input
                        type="date"
                        required
                        value={createFromQuoteData.issue_date}
                        onChange={(e) => setCreateFromQuoteData({ ...createFromQuoteData, issue_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        value={createFromQuoteData.due_date}
                        onChange={(e) => setCreateFromQuoteData({ ...createFromQuoteData, due_date: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={createFromQuoteData.status}
                        onChange={(e) => setCreateFromQuoteData({ ...createFromQuoteData, status: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setCreateFromQuoteModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={approvedQuotesWithoutInvoice.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Invoice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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

