/**
 * Client messaging inbox: lists `MessageThread` rows (one per project).
 *
 * Layout: intro column (left) + scrollable inbox panel (right) on `lg+`; stacked on small screens.
 * Uses `getMessagesPageStyle()` from `../utils/messagingLayout` so the page fills `<main>` below
 * the navbar and respects safe areas.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDateTime } from '../utils/formatters';
import { getMessagesPageStyle } from '../utils/messagingLayout';

/** Stable numeric project id from API thread (list vs detail shapes). */
function threadProjectId(t) {
  if (t == null) return null;
  const raw = t.project_id ?? t.project;
  if (raw == null) return null;
  if (typeof raw === 'object') return raw.id != null ? Number(raw.id) : null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const Messages = () => {
  const { isAuthenticated } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchThreads = async () => {
      try {
        const res = await api.get('/messaging/threads/');
        let data = res.data?.results ?? res.data ?? [];
        data = Array.isArray(data) ? data : [];
        // Ensure a thread exists for each of the user's projects (create if missing)
        try {
          const projectsRes = await api.get('/clients/projects/my_projects/');
          const projects = projectsRes.data?.results ?? projectsRes.data ?? [];
          const projectIds = (Array.isArray(projects) ? projects : []).map((p) => Number(p.id)).filter((n) => Number.isFinite(n));
          const threadProjectIds = new Set(data.map(threadProjectId).filter((n) => n != null));
          for (const pid of projectIds) {
            if (threadProjectIds.has(pid)) continue;
            const createRes = await api.post('/messaging/threads/', { project: pid });
            const newThread = createRes.data;
            if (newThread) {
              data = [newThread, ...data];
              const np = threadProjectId(newThread);
              if (np != null) threadProjectIds.add(np);
            }
          }
        } catch (_) {
          // ignore: my_projects or create may fail
        }
        // Dedupe by thread id (e.g. if backend returned existing thread twice)
        const byId = new Map();
        for (const t of data) {
          if (t && t.id != null && !byId.has(t.id)) byId.set(t.id, t);
        }
        data = Array.from(byId.values());
        // Newest activity first
        data.sort((a, b) => {
          const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return tb - ta;
        });
        setThreads(data);
        setError('');
      } catch (err) {
        setError('Failed to load conversations.');
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900/70 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Sign in to view messages</h1>
          <p className="text-slate-300 mb-6 text-center text-sm">
            Your secure conversations with the team live here. Please log in to access them.
          </p>
          <div className="flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-slate-200">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium tracking-wide">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
      style={getMessagesPageStyle()}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5 py-4 sm:gap-6 sm:py-5 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
        {/* Left: title + copy + optional API error */}
        <div className="flex shrink-0 flex-col justify-start lg:w-[min(380px,36%)] lg:max-w-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-start">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-400/80 mb-1">
                Messaging
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Messages</h1>
              <p className="text-sm text-slate-300 mt-2">
                One conversation per project. Chat with the team, share files, and keep everything in one place.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300/80 bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Secure, private client portal messaging</span>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-lg border border-red-800/60 bg-red-950/50 text-red-200 text-sm">{error}</div>
          )}
        </div>

        {/* Right: tall scrollable thread list */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700/90 bg-slate-900/50 shadow-xl ring-1 ring-white/5">
          <div className="shrink-0 border-b border-slate-700/80 px-4 py-3 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/90">Inbox</p>
            <p className="text-xs text-slate-500 mt-0.5">Open a project thread to continue the conversation</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
            {threads.length === 0 ? (
              <div className="relative flex min-h-[min(280px,40vh)] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-16 w-52 h-52 bg-violet-500/10 rounded-full blur-3xl" />
                <p className="text-slate-200 text-sm max-w-md mx-auto relative">
                  No conversations yet. Once a project is active, a dedicated thread with our team will appear here.
                </p>
                <Link
                  to="/my-projects"
                  className="relative mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
                >
                  View my projects
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {threads.map((t) => (
                  <Link
                    key={t.id}
                    to={`/messages/${t.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-blue-500/70 transition-all"
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute -top-16 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                      <div className="absolute -bottom-20 -left-10 w-44 h-44 bg-violet-500/10 rounded-full blur-3xl" />
                    </div>
                    <div className="relative">
                      <h2 className="font-semibold text-slate-50 text-base sm:text-lg line-clamp-1">
                        {t.project_name}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.client_name}
                      </p>
                      {t.last_message_preview && (
                        <p className="text-sm text-slate-200/90 mt-2 line-clamp-2">
                          {t.last_message_preview}
                        </p>
                      )}
                    </div>
                    <div className="relative flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="inline-flex h-6 px-2 items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-medium">
                          {formatDateTime(t.last_message_at)}
                        </span>
                      </div>
                      {t.message_count > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-500/15 text-blue-200 text-xs font-semibold px-2.5 py-1 border border-blue-500/40">
                          {t.message_count} msg{t.message_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
