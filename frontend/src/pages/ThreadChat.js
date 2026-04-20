/**
 * Single project thread: message timeline + composer (multipart for file attachments).
 *
 * - API: `GET /messaging/threads/:id/`, `POST .../send_message/` (FormData; see `api.js` interceptor).
 * - Attachments: `has_attachment`, media URL for images, download URL for other files (`getMediaUrl`).
 * - Layout: fills `<main>` via `THREAD_CHAT_SHELL_STYLE`; left column = project context, right = chat
 *   (`frontend/src/utils/messagingLayout.js`). Admin vs client inbox link from `location.state` / staff flag.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { getMediaUrl } from '../services/api';
import { THREAD_CHAT_SHELL_STYLE } from '../utils/messagingLayout';

const ThreadChat = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isStaffUser = Boolean(user?.is_staff || user?.is_superuser);
  const inboxPath =
    location.state?.from === 'admin' || isStaffUser ? '/admin/messaging-threads' : '/messages';
  const inboxLabel = isStaffUser ? 'Back to admin inbox' : 'Back to inbox';
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  };

  useEffect(() => {
    if (!isAuthenticated || !threadId) {
      setLoading(false);
      return;
    }
    const fetchThread = async () => {
      try {
        const res = await api.get(`/messaging/threads/${threadId}/`);
        setThread(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.status === 404 ? 'Conversation not found.' : 'Failed to load conversation.');
        setThread(null);
      } finally {
        setLoading(false);
      }
    };
    fetchThread();
  }, [isAuthenticated, threadId]);

  useEffect(() => {
    if (!thread?.messages?.length) {
      scrollToBottom('auto');
      return;
    }
    scrollToBottom('smooth');
  }, [thread?.messages?.length, threadId]);

  /** Poll for new messages while this tab is open (admin ↔ client). */
  useEffect(() => {
    if (!isAuthenticated || !threadId) return;
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      api
        .get(`/messaging/threads/${threadId}/`)
        .then((res) => setThread(res.data))
        .catch(() => {});
    };
    const id = setInterval(poll, 12000);
    return () => clearInterval(id);
  }, [isAuthenticated, threadId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!content.trim() && !file) || sending) return;
    setSending(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', content.trim() || '(attachment)');
      if (file) formData.append('attachment', file);
      await api.post(`/messaging/threads/${threadId}/send_message/`, formData);
      setContent('');
      setFile(null);
      const refreshed = await api.get(`/messaging/threads/${threadId}/`);
      setThread(refreshed.data);
    } catch (err) {
      setError(err.response?.data?.content?.[0] || err.response?.data?.detail || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  const handleDownloadAttachment = async (messageId, fileName) => {
    try {
      const res = await api.get(`/messaging/messages/${messageId}/download_attachment/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'attachment';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed.');
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return isNaN(date.getTime()) ? '' : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (msg) => user && msg.sender && String(msg.sender) === String(user.id);

  const hasAttachment = (msg) =>
    Boolean(
      msg?.has_attachment ||
        msg?.attachment ||
        msg?.attachment_media_url ||
        msg?.attachment_url ||
        msg?.attachment_name
    );

  const isImageAttachment = (msg) => {
    const nameOrUrl =
      msg?.attachment_name ||
      msg?.attachment_media_url ||
      msg?.attachment ||
      '';
    if (!nameOrUrl || typeof nameOrUrl !== 'string') return false;
    const pathOnly = nameOrUrl.split('?')[0];
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(pathOnly);
  };

  /** Inline images only: media URL — never use the download API as `<img src>`. */
  const attachmentImageSrc = (msg) =>
    getMediaUrl(msg?.attachment_media_url || msg?.attachment) || null;

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div
        className="flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
        style={THREAD_CHAT_SHELL_STYLE}
      >
        <div className="flex flex-col items-center text-slate-200">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium tracking-wide">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div
        className="flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
        style={THREAD_CHAT_SHELL_STYLE}
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center shadow-2xl">
          <p className="mb-4 text-sm text-slate-100">{error}</p>
          <Link
            to={inboxPath}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Back to inbox
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
      style={THREAD_CHAT_SHELL_STYLE}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 py-2.5">
        <Link
          to={inboxPath}
          className="inline-flex min-w-0 items-center gap-1.5 text-sm text-slate-300 transition hover:text-white"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
          <span className="truncate">{inboxLabel}</span>
        </Link>
        <Link
          to={inboxPath}
          className="shrink-0 text-xs font-medium text-slate-400 transition hover:text-slate-200"
        >
          All conversations
        </Link>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 sm:gap-5 lg:flex-row lg:items-stretch lg:gap-6">
        {/* Left: project context — desktop left; mobile below chat */}
        <aside className="order-2 flex min-h-0 w-full shrink-0 flex-col gap-4 overflow-y-auto pb-2 lg:order-1 lg:w-[min(380px,34%)] lg:max-w-[40%] lg:pb-0">
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/90 bg-slate-900/50 shadow-xl ring-1 ring-white/5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/15 via-transparent to-violet-600/10" />
            <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]">
              <img
                src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80"
                alt="Colleagues collaborating at a workspace"
                className="h-full w-full object-cover opacity-90"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            </div>
            <div className="relative px-5 pb-5 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/90">Project chat</p>
              <h2 className="mt-1 font-semibold leading-snug text-slate-50 line-clamp-2">
                {thread?.project_name || 'Conversation'}
              </h2>
              <p className="mt-2 text-sm text-slate-400 line-clamp-2">{thread?.client_name}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/40 p-5 shadow-lg ring-1 ring-white/[0.04]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Stay in sync</h3>
                <p className="text-xs text-slate-500">Share updates and files in one thread.</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                Replies usually within one business day.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden />
                Attach screenshots or briefs to give clearer context.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden />
                Keep project questions here so nothing gets lost in email.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/25 px-4 py-4 text-center">
            <p className="text-xs text-slate-500">
              Messages are tied to this project. Need the full list?{' '}
              <Link to={inboxPath} className="font-medium text-blue-400 hover:text-blue-300">
                All conversations
              </Link>
            </p>
          </div>
        </aside>

        {/* Right: tall conversation inbox */}
        <main className="relative isolate order-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 shadow-2xl ring-1 ring-white/[0.06] lg:order-2 lg:min-w-0">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0 z-0 opacity-60">
              <div className="absolute -top-24 -right-16 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
            </div>

            {/* Chat header */}
            <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-slate-700 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-semibold text-white shadow-md">
                  {(thread?.project_name || 'P').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold text-slate-50 sm:text-base">
                    {thread?.project_name}
                  </h1>
                  <p className="truncate text-xs text-slate-300">
                    {thread?.client_name}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-200">
                {isStaffUser ? 'Client conversation' : 'PathyCode team'}
              </span>
            </div>

            {/* Timeline — fills space between header and composer (WhatsApp-style scroll) */}
            <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain bg-slate-950/50 px-3 py-4 sm:px-5">
              {!(Array.isArray(thread?.messages) && thread.messages.length > 0) ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8">
                  <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-600/80 bg-slate-800/90 shadow-inner ring-1 ring-white/5">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10" />
                    <svg
                      className="relative h-10 w-10 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-center font-semibold tracking-tight text-slate-100 sm:text-lg">
                    No messages yet
                  </h2>
                  <p className="mt-2 max-w-sm text-center text-[15px] leading-relaxed text-slate-400">
                    This conversation is empty. Say hello or ask a question—your message will appear here in order.
                  </p>
                  <p className="mt-6 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                    Start below
                  </p>
                  <div className="mt-2 h-px w-16 bg-gradient-to-r from-transparent via-slate-600 to-transparent" aria-hidden />
                </div>
              ) : (
                (thread.messages || []).map((msg) => {
                  const own = isOwnMessage(msg);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[72%] flex ${own ? 'flex-row-reverse' : 'flex-row'} items-end gap-2.5`}>
                        {!own && (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xs font-semibold text-slate-200 shadow-sm">
                            {(msg.sender_name || msg.sender_email || 'T').charAt(0)}
                          </div>
                        )}
                        <div
                          className={`min-w-0 max-w-full rounded-2xl px-4 py-3 shadow-sm ${
                            own
                              ? 'rounded-br-md bg-blue-600 text-white ring-1 ring-blue-500/40'
                              : 'rounded-bl-md border border-slate-700 bg-slate-800/95 text-slate-50 ring-1 ring-slate-700/50'
                          }`}
                        >
                          <div
                            className={`mb-1.5 text-[11px] font-medium uppercase tracking-wide ${
                              own ? 'text-blue-100/90' : 'text-slate-400'
                            }`}
                          >
                            {msg.sender_role === 'admin'
                              ? (msg.sender_name || 'Admin')
                              : (msg.sender_name || msg.sender_email || (own ? 'You' : 'Client'))}{' '}
                            <span className={`font-normal normal-case tracking-normal ${own ? 'text-blue-200/70' : 'text-slate-500'}`}>
                              ·
                            </span>{' '}
                            <span className="font-normal normal-case tracking-normal opacity-90">{formatTime(msg.created_at)}</span>
                          </div>
                          {msg.content && msg.content !== '(attachment)' && (
                            <p
                              className={`whitespace-pre-wrap break-words text-[15px] leading-[1.65] [word-break:break-word] ${
                                own ? 'text-white' : 'text-slate-100'
                              }`}
                            >
                              {msg.content}
                            </p>
                          )}
                          {hasAttachment(msg) && (
                            isImageAttachment(msg) && attachmentImageSrc(msg) ? (
                              <div
                                className={`overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/60 ${
                                  msg.content && msg.content !== '(attachment)' ? 'mt-2' : 'mt-0'
                                }`}
                              >
                                <img
                                  src={attachmentImageSrc(msg)}
                                  alt={msg.attachment_name || 'Attachment image'}
                                  className="max-h-64 w-full object-contain bg-slate-900"
                                />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(msg.id, msg.attachment_name)}
                                className={`text-[11px] underline opacity-90 hover:no-underline ${
                                  msg.content && msg.content !== '(attachment)' ? 'mt-2' : 'mt-0'
                                } ${own ? 'text-blue-100' : 'text-slate-200'}`}
                              >
                                📎 {msg.attachment_name || 'Download attachment'}
                              </button>
                            )
                          )}
                          {msg.content === '(attachment)' && !hasAttachment(msg) && (
                            <p
                              className={`mt-2 text-xs leading-relaxed ${
                                own ? 'text-amber-100/95' : 'text-amber-200/90'
                              }`}
                            >
                              No file was saved with this message. Attach and send again.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send form */}
            <div className="relative z-10 shrink-0 border-t border-slate-700 bg-slate-900/95 px-3 py-3 sm:px-5">
              {error && <p className="mb-1.5 text-xs text-red-400">{error}</p>}
              <form onSubmit={handleSend} className="flex flex-col gap-2">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!sending && (content.trim() || file)) {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                  placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-[15px] leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center text-xs text-slate-300">
                    <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                      <svg className="h-4 w-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828M16 5l3 3m-6.5-5.5L5 10v9a1 1 0 001 1h9l8.5-8.5a3.5 3.5 0 00-4.95-4.95z" />
                      </svg>
                    </span>
                    <span className="mr-1.5">Attach file</span>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {file && (
                    <span className="max-w-[40%] truncate text-xs text-slate-300">
                      {file.name}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={sending || (!content.trim() && !file)}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transition-colors"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ThreadChat;
