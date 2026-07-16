import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const normalizeId = (id) => Number(id);

const idsMatch = (a, b) => normalizeId(a) === normalizeId(b);

const idsEqualSet = (ids) => new Set((ids || []).map(normalizeId));

async function refreshUnreadCount(setUnread) {
  try {
    const countRes = await api.get('/notifications/unread_count/');
    setUnread(countRes.data?.count ?? 0);
  } catch {
    /* keep optimistic count */
  }
}

function broadcastDeleted({ ids, all = false }) {
  window.dispatchEvent(new CustomEvent('notifications-deleted', { detail: { ids, all } }));
}

export async function markNotificationById(id) {
  if (!id) return;
  await api.post(`/notifications/${id}/mark_read/`);
}

/** Mark one unread notification for a route (e.g. one message alert per thread open). */
export async function markOneNotificationForLink(link) {
  if (!link) return;
  await api.post('/notifications/mark_read_by_link/', { link, limit: 1 });
}

export function useNotifications({ enabled = true, pollMs = 60000, limit = 12 } = {}) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applyDeleted = useCallback((ids, all = false) => {
    if (all) {
      setItems([]);
      setUnread(0);
      return;
    }
    const idSet = idsEqualSet(ids);
    if (!idSet.size) return;
    setItems((prev) => {
      let removedUnread = 0;
      const next = prev.filter((n) => {
        if (idSet.has(normalizeId(n.id))) {
          if (!n.is_read) removedUnread += 1;
          return false;
        }
        return true;
      });
      if (removedUnread) {
        setUnread((u) => Math.max(0, u - removedUnread));
      }
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    if (!enabled || !isAuthenticated) {
      setItems([]);
      setUnread(0);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications/'),
        api.get('/notifications/unread_count/'),
      ]);
      const data = listRes.data?.results ?? listRes.data ?? [];
      setItems(Array.isArray(data) ? data.slice(0, limit) : []);
      setUnread(countRes.data?.count ?? 0);
    } catch (err) {
      setItems([]);
      setUnread(0);
      setError(err.response?.data?.detail || 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [enabled, isAuthenticated, limit]);

  useEffect(() => {
    load();
    if (!enabled || !isAuthenticated || !pollMs) return undefined;
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, enabled, isAuthenticated, pollMs]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (/^\/messages\/\d+/.test(location.pathname) || /^\/admin(\/|$)/.test(location.pathname)) {
      load();
    }
  }, [location.pathname, isAuthenticated, load]);

  useEffect(() => {
    const onRefresh = () => load();
    const onDeleted = (event) => {
      const { ids, all } = event.detail || {};
      applyDeleted(ids, all);
      refreshUnreadCount(setUnread);
    };
    window.addEventListener('notifications-changed', onRefresh);
    window.addEventListener('notifications-deleted', onDeleted);
    return () => {
      window.removeEventListener('notifications-changed', onRefresh);
      window.removeEventListener('notifications-deleted', onDeleted);
    };
  }, [load, applyDeleted]);

  const markRead = useCallback(async (id) => {
    if (!id) return;
    setItems((prev) => {
      const target = prev.find((n) => idsMatch(n.id, id));
      if (target && !target.is_read) {
        setUnread((u) => Math.max(0, u - 1));
      }
      return prev.map((n) => (idsMatch(n.id, id) ? { ...n, is_read: true } : n));
    });
    try {
      await api.post(`/notifications/${normalizeId(id)}/mark_read/`);
      await refreshUnreadCount(setUnread);
      window.dispatchEvent(new Event('notifications-changed'));
    } catch {
      await load();
    }
  }, [load]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await api.post('/notifications/mark_all_read/');
      await load();
      window.dispatchEvent(new Event('notifications-changed'));
    } catch {
      await load();
    }
  }, [load]);

  const removeNotifications = useCallback(async (ids, { deleteAll = false } = {}) => {
    const idList = deleteAll ? [] : (Array.isArray(ids) ? ids.filter((id) => id != null) : [ids].filter(Boolean));
    if (!deleteAll && !idList.length) return { ok: false, error: 'No alerts selected.' };

    applyDeleted(idList, deleteAll);

    try {
      const payload = deleteAll ? { delete_all: true } : { ids: idList.map(normalizeId) };
      const res = await api.post('/notifications/bulk_delete/', payload);
      await refreshUnreadCount(setUnread);
      broadcastDeleted({ ids: idList.map(normalizeId), all: deleteAll });
      return { ok: true, deleted: res.data?.deleted ?? idList.length };
    } catch (err) {
      await load();
      const msg = err.response?.data?.detail || 'Failed to delete alerts.';
      return { ok: false, error: typeof msg === 'string' ? msg : 'Failed to delete alerts.' };
    }
  }, [applyDeleted, load]);

  const removeNotification = useCallback(
    (id) => removeNotifications([id]),
    [removeNotifications]
  );

  const removeAllNotifications = useCallback(
    () => removeNotifications([], { deleteAll: true }),
    [removeNotifications]
  );

  return {
    items,
    unread,
    loading,
    error,
    load,
    markRead,
    markAllRead,
    removeNotification,
    removeNotifications,
    removeAllNotifications,
  };
}
