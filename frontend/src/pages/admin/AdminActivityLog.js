import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminListSection,
  AdminTableWrap,
  AdminRefreshButton,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';

const AdminActivityLog = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/users/admin/activity-log/');
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
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

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (a) =>
        (a.action_display || a.action || '').toLowerCase().includes(q)
        || (a.user_email || '').toLowerCase().includes(q)
        || (a.details || '').toLowerCase().includes(q),
    );
  }, [items, search]);

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
        title="Activity Log"
        description="System-wide audit trail of user and staff actions."
        actions={<AdminRefreshButton onClick={fetchData} />}
      />
      <AdminListSection
        title="Recent activity"
        toolbar={
          <input
            type="search"
            placeholder="Search action, user, details…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-full max-w-sm"
          />
        }
      >
        <AdminTableWrap>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b">
                <th className="py-3 pr-4">When</th>
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">{formatDateTime(a.timestamp)}</td>
                  <td className="py-3 pr-4">{a.user_email || a.user_name}</td>
                  <td className="py-3 pr-4 font-medium">{a.action_display || a.action}</td>
                  <td className="py-3 text-slate-600">{a.details || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No activity found.</td></tr>
              )}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminListSection>
    </AdminLayout>
  );
};

export default AdminActivityLog;
