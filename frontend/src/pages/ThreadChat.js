/**
 * Chat view for one thread: message timeline + send form (with optional attachment).
 * Only participants (client or admin) can access.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ThreadChat = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    scrollToBottom();
  }, [thread?.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!content.trim() && !file) || sending) return;
    setSending(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', content.trim() || '(attachment)');
      if (file) formData.append('attachment', file);
      await api.post(`/messaging/threads/${threadId}/send_message/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setContent('');
      setFile(null);
      const res = await api.get(`/messaging/threads/${threadId}/`);
      setThread(res.data);
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

  const isImageAttachment = (msg) => {
    const nameOrUrl =
      msg?.attachment_name ||
      msg?.attachment_media_url ||
      msg?.attachment ||
      '';
    if (!nameOrUrl || typeof nameOrUrl !== 'string') return false;
    return /\.(png|jpe?g|gif|webp|bmp)$/i.test(nameOrUrl);
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-slate-200">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium tracking-wide">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900/70 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
          <p className="text-slate-100 mb-4 text-sm">{error}</p>
          <Link
            to="/messages"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors"
          >
            Back to messages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col">
      <div className="container-fluid flex-1 d-flex flex-column">
        <div className="row justify-content-center flex-1">
          <div className="col-12 col-md-10 col-lg-8 d-flex flex-column max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex items-center gap-4">
              <Link
                to="/messages"
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-sm"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 border border-slate-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
                Back
              </Link>
            </div>

            <div className="px-4 sm:px-6 pb-4">
              <div
                className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 shadow-xl d-flex flex-column"
                style={{ height: '90vh', maxHeight: '90vh', minHeight: '70vh' }}
              >
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -top-24 -right-16 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -left-20 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl" />
            </div>

            {/* Chat header */}
            <div className="relative px-4 sm:px-6 py-4 border-b border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold shadow-md flex-shrink-0">
                  {(thread?.project_name || 'P').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold text-slate-50 text-sm sm:text-base truncate">
                    {thread?.project_name}
                  </h1>
                  <p className="text-xs text-slate-300 truncate">
                    {thread?.client_name}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online support
              </span>
            </div>

            {/* Timeline */}
                <div className="relative flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-3">
              {!(Array.isArray(thread?.messages) && thread.messages.length > 0) ? (
                <p className="text-center text-slate-300/80 text-sm py-10">
                  No messages yet. Start the conversation below.
                </p>
              ) : (
                (thread.messages || []).map((msg) => {
                  const own = isOwnMessage(msg);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[70%] flex ${own ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                        {!own && (
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[11px] font-semibold text-slate-200 flex-shrink-0">
                            {(msg.sender_name || msg.sender_email || 'T').charAt(0)}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                            own
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-slate-800/90 text-slate-50 border border-slate-700 rounded-bl-sm'
                          }`}
                        >
                          <div className="text-[11px] opacity-80 mb-0.5">
                            {msg.sender_role === 'admin'
                              ? (msg.sender_name || 'Admin')
                              : (msg.sender_name || msg.sender_email || (own ? 'You' : 'Client'))}{' '}
                            · {formatTime(msg.created_at)}
                          </div>
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                          {msg.attachment_url && (
                            isImageAttachment(msg) ? (
                              <div className="mt-2 rounded-xl overflow-hidden border border-slate-700/70 bg-slate-900/60">
                                <img
                                  src={msg.attachment_media_url || msg.attachment_url}
                                  alt={msg.attachment_name || 'Attachment image'}
                                  className="max-h-64 w-full object-contain bg-slate-900"
                                />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(msg.id, msg.attachment_name)}
                                className={`mt-2 text-[11px] underline opacity-90 hover:no-underline ${
                                  own ? 'text-blue-100' : 'text-slate-200'
                                }`}
                              >
                                📎 {msg.attachment_name || 'Download attachment'}
                              </button>
                            )
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
                <div className="relative border-t border-slate-700 bg-slate-900/95 px-3 sm:px-5 py-3">
              {error && <p className="text-red-400 text-xs mb-1.5">{error}</p>}
              <form onSubmit={handleSend} className="flex flex-col gap-2">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center text-xs text-slate-300 cursor-pointer">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 mr-2">
                      <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <span className="text-xs text-slate-300 truncate max-w-[40%]">
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
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadChat;
