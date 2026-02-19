import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import api from '../../services/api';

const AdminContact = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, message: null });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.is_superuser !== true) {
      navigate('/admin');
      return;
    }
    fetchMessages();
  }, [isAuthenticated, user, navigate]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/contact/');
      const data = response.data.results || response.data;
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (message) => {
    setSelectedMessage(message);
  };

  const handleDelete = (message) => {
    setDeleteDialog({ open: true, message });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/contact/${deleteDialog.message.id}/`);
      fetchMessages();
      setDeleteDialog({ open: false, message: null });
      if (selectedMessage?.id === deleteDialog.message.id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter((message) =>
    message.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Subject',
      accessor: 'subject',
      render: (value) => <div className="max-w-md truncate">{value}</div>,
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
          <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-600 mt-1">View and manage contact form submissions</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 ${selectedMessage ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((column, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column.header}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMessages.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                          No contact messages found
                        </td>
                      </tr>
                    ) : (
                      filteredMessages.map((message) => (
                        <tr key={message.id} className="hover:bg-gray-50">
                          {columns.map((column, colIndex) => (
                            <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {column.render
                                ? column.render(message[column.accessor], message)
                                : message[column.accessor]}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleView(message)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(message)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {selectedMessage && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Message Details</h3>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">From</label>
                    <p className="text-gray-900 font-medium">{selectedMessage.name}</p>
                    <p className="text-gray-600 text-sm">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subject</label>
                    <p className="text-gray-900">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Message</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Received</label>
                    <p className="text-gray-900">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Reply via Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, message: null })}
          onConfirm={confirmDelete}
          title="Delete Message"
          message={`Are you sure you want to delete the message from "${deleteDialog.message?.name}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminContact;

