import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import {
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminListSection,
  AdminTableWrap,
  AdminRefreshButton,
  AdminActionButtons,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';

const AdminFiles = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('shared');
  const [sharedFiles, setSharedFiles] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null, type: 'shared' });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [sharedRes, projectRes] = await Promise.all([
        api.get('/files/'),
        api.get('/clients/project-files/'),
      ]);
      setSharedFiles(Array.isArray(sharedRes.data) ? sharedRes.data : sharedRes.data?.results || []);
      setProjectFiles(Array.isArray(projectRes.data) ? projectRes.data : projectRes.data?.results || []);
    } catch {
      setSharedFiles([]);
      setProjectFiles([]);
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
    if (user && !user.is_superuser) {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, navigate, fetchData]);

  const rows = useMemo(() => (tab === 'shared' ? sharedFiles : projectFiles), [tab, sharedFiles, projectFiles]);

  const toggleVisibility = async (file) => {
    try {
      await api.patch(`/files/${file.id}/`, { is_client_visible: !file.is_client_visible });
      fetchData(true);
    } catch {
      alert('Failed to update visibility');
    }
  };

  const confirmDelete = async () => {
    const { item, type } = deleteDialog;
    if (!item) return;
    try {
      const url = type === 'shared' ? `/files/${item.id}/` : `/clients/project-files/${item.id}/`;
      await api.delete(url);
      setDeleteDialog({ open: false, item: null, type: 'shared' });
      fetchData(true);
    } catch {
      alert('Failed to delete file');
    }
  };

  const downloadFile = async (file) => {
    const url = tab === 'shared'
      ? `/files/${file.id}/download/`
      : `/clients/project-files/${file.id}/download/`;
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name || file.file_name || `file-${file.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Failed to download file');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageBanner
        title="Files"
        description="Shared client files and project delivery files (Django admin: Files + Project files)."
        actions={<AdminRefreshButton onClick={() => fetchData(true)} loading={refreshing} />}
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'shared', label: `Shared files (${sharedFiles.length})` },
          { id: 'project', label: `Project files (${projectFiles.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === t.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <AdminListSection title={tab === 'shared' ? 'Shared files' : 'Project files'}>
        <AdminTableWrap>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Project</th>
                <th className="py-3 pr-4">Uploaded by</th>
                {tab === 'shared' && <th className="py-3 pr-4">Client visible</th>}
                <th className="py-3 pr-4">Uploaded</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={`${tab}-${f.id}`} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">{f.name || f.file_name || `File #${f.id}`}</td>
                  <td className="py-3 pr-4 text-slate-600">{f.project_name || f.project || '—'}</td>
                  <td className="py-3 pr-4 text-slate-600">{f.uploaded_by_email || f.uploaded_by_name || '—'}</td>
                  {tab === 'shared' && (
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleVisibility(f)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                          f.is_client_visible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {f.is_client_visible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                  )}
                  <td className="py-3 pr-4 text-slate-500">{formatDateTime(f.uploaded_at)}</td>
                  <td className="py-3">
                    <AdminActionButtons
                      actions={[
                        {
                          label: 'Download',
                          onClick: () => downloadFile(f),
                        },
                        {
                          label: 'Delete',
                          tone: 'danger',
                          onClick: () => setDeleteDialog({ open: true, item: f, type: tab }),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={tab === 'shared' ? 6 : 5} className="py-8 text-center text-slate-500">
                    No files found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminListSection>
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete file?"
        message="This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, item: null, type: 'shared' })}
      />
    </AdminLayout>
  );
};

export default AdminFiles;
