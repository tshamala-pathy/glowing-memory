import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  ADMIN_INPUT_CLASS,
  AdminLoadingSkeleton,
  AdminPageBanner,
  AdminStatGrid,
  AdminListSection,
  AdminRefreshButton,
} from '../../components/admin/adminPageUi';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=1920&q=85';

const getProjectInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const parseMessagePreview = (preview) => {
  if (!preview?.trim()) {
    return { kind: 'empty', label: 'No messages yet' };
  }
  const text = preview.trim();
  const isAttachment =
    text.startsWith('📎') ||
    /^Subject[-_]/i.test(text) ||
    /\.(pdf|doc|docx|png|jpg|jpeg|gif|zip)$/i.test(text);
  if (isAttachment) {
    return {
      kind: 'attachment',
      label: text.replace(/^📎\s*/, '').replace(/^Subject[-_]/i, '').trim() || 'File attachment',
    };
  }
  return { kind: 'text', label: text };
};

const ThreadPreview = ({ preview }) => {
  const parsed = parseMessagePreview(preview);
  if (parsed.kind === 'empty') {
    return <p className="text-sm text-slate-400 italic">{parsed.label}</p>;
  }
  if (parsed.kind === 'attachment') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-slate-600 min-w-0">
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </span>
        <span className="truncate font-medium">{parsed.label}</span>
      </span>
    );
  }
  return <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">&ldquo;{parsed.label}&rdquo;</p>;
};

const AdminMessagingThreads = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!user || user.is_superuser !== true) {
      navigate('/profile');
      return;
    }
    fetchThreads();
    fetchProjects();
  }, [isAuthenticated, user, navigate]);

  const threadProjectKey = (t) => {
    const raw = t?.project_id ?? t?.project;
    if (raw == null) return null;
    if (typeof raw === 'object') return raw.id != null ? Number(raw.id) : null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const fetchThreads = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await api.get('/messaging/threads/');
      let data = res.data?.results ?? res.data ?? [];
      data = Array.isArray(data) ? data : [];
      data.sort((a, b) => {
        const ta = new Date(a.last_message_at || a.updated_at || 0).getTime();
        const tb = new Date(b.last_message_at || b.updated_at || 0).getTime();
        return tb - ta;
      });
      setThreads(data);
      setError('');
    } catch {
      setError('Failed to load message threads.');
      setThreads([]);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/clients/projects/');
      const data = res.data?.results ?? res.data ?? [];
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || creating) return;
    setCreating(true);
    try {
      const res = await api.post('/messaging/threads/', { project: selectedProjectId });
      const newThread = res.data;
      if (newThread) {
        setThreads((prev) => {
          const without = prev.filter((t) => t.id !== newThread.id);
          return [newThread, ...without];
        });
      }
      setSelectedProjectId('');
      setError('');
    } catch (err) {
      const msg =
        err.response?.data?.project?.[0] ||
        err.response?.data?.detail ||
        'Failed to create message thread.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const filteredThreads = useMemo(() => {
    if (!searchTerm.trim()) return threads;
    const term = searchTerm.toLowerCase();
    return threads.filter(
      (t) =>
        t.project_name?.toLowerCase().includes(term) ||
        t.client_name?.toLowerCase().includes(term) ||
        String(t.id).includes(term)
    );
  }, [threads, searchTerm]);

  const projectOptionsWithoutThread = projects.filter((p) => {
    const projectId = Number(p.id);
    if (!Number.isFinite(projectId)) return true;
    return !threads.some((t) => threadProjectKey(t) === projectId);
  });

  const totalMessages = threads.reduce((sum, t) => sum + (t.message_count || 0), 0);
  const withRecentActivity = threads.filter((t) => t.last_message_at).length;

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingSkeleton />
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: 'Total threads',
      value: threads.length,
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      tone: 'bg-slate-900 text-white',
      iconBg: 'bg-white/15',
    },
    {
      label: 'Total messages',
      value: totalMessages,
      tone: 'bg-white border border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    },
    {
      label: 'Active threads',
      value: withRecentActivity,
      tone: 'bg-white border border-emerald-100',
      valueClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
    {
      label: 'Showing',
      value: filteredThreads.length,
      tone: 'bg-white border border-blue-100',
      valueClass: 'text-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
    },
  ];

  const listIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
        <AdminPageBanner
          image={HERO_IMAGE}
          eyebrow="Admin · Communication"
          title="Message Threads"
          description="Client–admin conversations organized per project."
          secondaryAction={
            <AdminRefreshButton onClick={() => fetchThreads(true)} refreshing={refreshing} />
          }
        />

        <AdminStatGrid stats={statCards} />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 sm:px-6 py-5">
            <h2 className="text-sm font-bold text-slate-900">Start a new thread</h2>
            <p className="text-xs text-slate-500 mt-0.5">Create a conversation for a project that does not have one yet.</p>
            <form
              onSubmit={handleCreateThread}
              className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center"
            >
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={`${ADMIN_INPUT_CLASS} sm:max-w-md mt-0`}
              >
                <option value="">Select project without a thread</option>
                {projectOptionsWithoutThread.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.quote_project_title || `Project #${p.id}`}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedProjectId || creating}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating…' : 'Add thread'}
              </button>
            </form>
          </div>
        </section>

        <AdminListSection
          title="All threads"
          subtitle="Open a thread to continue the conversation"
          listIcon={listIcon}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by project, client, or ID…"
          showingCount={filteredThreads.length}
          totalCount={threads.length}
          hasActiveFilters={!!searchTerm.trim()}
          onClearFilters={() => setSearchTerm('')}
          emptyTitle="No message threads found"
          emptyDescription={
            searchTerm.trim()
              ? 'Try a different search term.'
              : 'Create a thread for a project to start messaging.'
          }
          emptyActionLabel={searchTerm.trim() ? 'Clear search' : undefined}
          onEmptyAction={searchTerm.trim() ? () => setSearchTerm('') : undefined}
          hideResultCount
        >
          <div className="border-b border-slate-100 bg-white px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">
              <span className="text-slate-800 font-semibold">{filteredThreads.length}</span>
              {filteredThreads.length === 1 ? ' conversation' : ' conversations'}
              {searchTerm.trim() ? ' matching search' : ''}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Sorted by latest activity
            </p>
          </div>

          <ul className="divide-y divide-slate-100">
            {filteredThreads.map((t) => {
              const lastAt = t.last_message_at || t.updated_at;
              const messageCount = t.message_count ?? 0;
              return (
                <li key={t.id}>
                  <article className="group px-5 sm:px-6 py-5 sm:py-6 hover:bg-slate-50/90 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-md ring-2 ring-white"
                          aria-hidden="true"
                        >
                          {getProjectInitials(t.project_name)}
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                {t.project_name || `Thread #${t.id}`}
                              </h3>
                              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="truncate">{t.client_name || 'Unknown client'}</span>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wide">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                              </span>
                              {lastAt && (
                                <time className="text-xs font-medium text-slate-400 whitespace-nowrap">
                                  {formatDateTime(lastAt)}
                                </time>
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Latest message
                            </p>
                            <ThreadPreview preview={t.last_message_preview} />
                          </div>
                        </div>
                      </div>

                      <div className="flex lg:flex-col lg:items-end gap-2 flex-shrink-0 pl-16 lg:pl-0">
                        <Link
                          to={`/messages/${t.id}`}
                          state={{ from: 'admin' }}
                          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto lg:min-w-[140px] px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors"
                        >
                          Open chat
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </AdminListSection>
      </div>
    </AdminLayout>
  );
};

export default AdminMessagingThreads;
