/**
 * Project thread chat: message timeline, composer, and appearance (sidebar cover + chat wallpaper).
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { getMediaUrl } from '../services/api';
import { THREAD_CHAT_SHELL_STYLE } from '../utils/messagingLayout';
import {
  resolveCoverUrl,
  resolveChatWallpaperStyle,
  getActivePresetId,
  validateThreadImageFile,
} from '../constants/threadBackgrounds';
import {
  getInitials,
  formatMessageTime,
  formatDateDivider,
  shouldShowDateDivider,
  messageHasAttachment,
  messageIsImageAttachment,
  messageAttachmentFileName,
  messageDisplayContent,
  messageSenderLabel,
  extractThreadPatchError,
} from '../utils/threadChatHelpers';
import ChatWallpaperBackground from '../components/messaging/ChatWallpaperBackground';
import ThreadImagePickerModal from '../components/messaging/ThreadImagePickerModal';
import { markNotificationById, markOneNotificationForLink } from '../hooks/useNotifications';

const POLL_INTERVAL_MS = 12000;
const SHELL_CLASS = 'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-slate-100';

const AttachmentCard = ({ name, onDownload }) => (
  <button
    type="button"
    onClick={onDownload}
    className="mt-2 flex w-full max-w-xs items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-slate-900">{name || 'Download file'}</span>
      <span className="text-xs text-slate-500">Click to download</span>
    </span>
  </button>
);

const ThreadChat = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const isStaffUser = Boolean(user?.is_staff || user?.is_superuser);
  const inboxPath = location.state?.from === 'admin' || isStaffUser ? '/admin/messaging-threads' : '/messages';
  const inboxLabel = isStaffUser ? 'Back to admin inbox' : 'Back to inbox';

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [pickerMode, setPickerMode] = useState(null);
  const [appearanceSaving, setAppearanceSaving] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);
  const markedNotificationRef = useRef(false);

  const scrollToBottom = (behavior = 'smooth') => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    });
  };

  const refreshThread = async () => {
    const res = await api.get(`/messaging/threads/${threadId}/`);
    setThread(res.data);
    return res.data;
  };

  useEffect(() => {
    if (!isAuthenticated || !threadId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await refreshThread();
        if (!markedNotificationRef.current) {
          markedNotificationRef.current = true;
          const notificationId = location.state?.notificationId;
          if (notificationId) {
            await markNotificationById(notificationId);
          } else {
            await markOneNotificationForLink(`/messages/${threadId}`);
          }
          window.dispatchEvent(new Event('notifications-changed'));
        }
        setError('');
      } catch (err) {
        setError(err.response?.status === 404 ? 'Conversation not found.' : 'Failed to load conversation.');
        setThread(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, threadId, location.state?.notificationId]);

  useEffect(() => {
    scrollToBottom(thread?.messages?.length ? 'smooth' : 'auto');
  }, [thread?.messages?.length, threadId]);

  useEffect(() => {
    if (!isAuthenticated || !threadId) return;
    const poll = () => {
      if (document.visibilityState !== 'visible') return;
      refreshThread().catch(() => {});
    };
    const id = setInterval(poll, POLL_INTERVAL_MS);
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
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshThread();
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
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || 'attachment';
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Download failed.');
    }
  };

  const patchThreadAppearance = async (payload) => {
    setAppearanceSaving(true);
    setError('');
    try {
      const res = await api.patch(`/messaging/threads/${threadId}/`, payload);
      setThread(res.data);
      setPickerMode(null);
    } catch (err) {
      setError(extractThreadPatchError(err));
    } finally {
      setAppearanceSaving(false);
    }
  };

  const handleSelectPreset = (mode, presetId) => {
    if (appearanceSaving) return;
    if (mode === 'cover') {
      patchThreadAppearance({ background_preset: presetId, clear_background_image: true });
    } else {
      patchThreadAppearance({ wallpaper_preset: presetId, clear_wallpaper_image: true });
    }
  };

  const handleImageUpload = (mode) => async (e) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected || appearanceSaving) return;

    const validationError = validateThreadImageFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append(mode === 'cover' ? 'background_image' : 'wallpaper_image', selected);
    await patchThreadAppearance(formData);
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className={`${SHELL_CLASS} items-center justify-center`} style={THREAD_CHAT_SHELL_STYLE}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-300 border-t-slate-900" />
          <p className="text-sm font-medium text-slate-600">Loading conversation…</p>
        </div>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className={`${SHELL_CLASS} items-center justify-center px-4`} style={THREAD_CHAT_SHELL_STYLE}>
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="mb-4 text-sm text-slate-600">{error}</p>
          <Link
            to={inboxPath}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            {inboxLabel}
          </Link>
        </div>
      </div>
    );
  }

  const messages = Array.isArray(thread?.messages) ? thread.messages : [];
  const canEditAppearance = Boolean(thread?.can_edit_background);
  const coverImageUrl = resolveCoverUrl(thread);
  const chatWallpaper = resolveChatWallpaperStyle(thread);

  return (
    <div className={SHELL_CLASS} style={THREAD_CHAT_SHELL_STYLE}>
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to={inboxPath}
            className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span className="truncate">{inboxLabel}</span>
          </Link>
          <span className="hidden text-xs font-medium text-slate-400 sm:inline">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-5 lg:flex-row lg:gap-6">
        {/* Sidebar — project cover + client info + quick tips */}
        <aside className="order-1 flex w-full shrink-0 flex-col gap-4 lg:w-[min(340px,32%)] lg:max-w-sm">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-40 overflow-hidden sm:h-44">
              <img
                src={coverImageUrl}
                alt=""
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              {canEditAppearance && (
                <button
                  type="button"
                  onClick={() => setPickerMode('cover')}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-black/55"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Change cover
                </button>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Project chat</p>
                <h2 className="mt-1 text-lg font-bold text-white line-clamp-2">
                  {thread?.project_name || 'Conversation'}
                </h2>
                <p className="mt-1 text-sm text-slate-300 line-clamp-1">{thread?.client_name}</p>
              </div>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                  {getInitials(thread?.project_name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{thread?.client_name}</p>
                  <p className="text-xs text-slate-500">
                    {isStaffUser ? 'Client conversation' : 'PathyCode team'}
                  </p>
                </div>
              </div>
              {canEditAppearance && (
                <button
                  type="button"
                  onClick={() => setPickerMode('cover')}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Customize cover photo
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Quick tips</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                <span>
                  <strong className="font-semibold text-slate-800">Change cover</strong> (left) and{' '}
                  <strong className="font-semibold text-slate-800">Wallpaper</strong> (chat) are separate
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Replies usually within one business day
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                Attach screenshots or briefs for clearer context
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                Keep project updates here so nothing is lost in email
              </li>
            </ul>
          </div>
        </aside>

        {/* Chat panel */}
        <main className="order-2 flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:min-h-0">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                {getInitials(thread?.project_name)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-slate-900">{thread?.project_name}</h1>
                <p className="truncate text-xs text-slate-500">{thread?.client_name}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {canEditAppearance && (
                <button
                  type="button"
                  onClick={() => setPickerMode('wallpaper')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  title="Change chat wallpaper"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Wallpaper</span>
                </button>
              )}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {isStaffUser ? 'Client chat' : 'Support'}
              </span>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col bg-[#efeae2]">
            <ChatWallpaperBackground wallpaper={chatWallpaper} />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
                {messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
                    <h2 className="text-lg font-bold text-slate-900">No messages yet</h2>
                    <p className="mt-2 max-w-sm text-sm text-slate-500">Start the conversation below.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const own = user && msg.sender && String(msg.sender) === String(user.id);
                    const prev = index > 0 ? messages[index - 1] : null;
                    const text = messageDisplayContent(msg);
                    const imageSrc = getMediaUrl(msg?.attachment_media_url || msg?.attachment);

                    return (
                      <React.Fragment key={msg.id}>
                        {shouldShowDateDivider(msg, prev) && (
                          <div className="my-4 flex justify-center">
                            <span className="rounded-lg bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
                              {formatDateDivider(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`mb-3 flex ${own ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`flex max-w-[88%] items-end gap-2 sm:max-w-[75%] ${own ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {!own && (
                              <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm">
                                {getInitials(msg.sender_name || msg.sender_email)}
                              </div>
                            )}
                            <div
                              className={`min-w-0 rounded-2xl px-4 py-3 shadow-md ${
                                own
                                  ? 'rounded-br-md bg-[#d9fdd3] text-slate-900'
                                  : 'rounded-bl-md border border-slate-200/80 bg-white text-slate-900'
                              }`}
                            >
                              <p className={`mb-1.5 text-[11px] font-medium ${own ? 'text-emerald-800/70' : 'text-slate-500'}`}>
                                <span className="font-semibold">{messageSenderLabel(msg, own)}</span>
                                <span className="mx-1.5 opacity-50">·</span>
                                <span>{formatMessageTime(msg.created_at)}</span>
                              </p>
                              {text && (
                                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{text}</p>
                              )}
                              {messageHasAttachment(msg) &&
                                (messageIsImageAttachment(msg) && imageSrc ? (
                                  <div className={`overflow-hidden rounded-xl border border-slate-200 ${text ? 'mt-2' : ''}`}>
                                    <img src={imageSrc} alt={messageAttachmentFileName(msg)} className="max-h-64 w-full object-contain" />
                                  </div>
                                ) : (
                                  <AttachmentCard
                                    name={messageAttachmentFileName(msg)}
                                    onDownload={() => handleDownloadAttachment(msg.id, messageAttachmentFileName(msg))}
                                  />
                                ))}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-slate-200/80 bg-[#f0f2f5] px-3 py-3 sm:px-5 sm:py-4">
                {error && (
                  <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
                )}
                {file && (
                  <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    aria-label="Attach file"
                  >
                    📎
                  </button>
                  <input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!sending && (content.trim() || file)) e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Write a message…"
                    rows={1}
                    className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!content.trim() && !file)}
                    className="inline-flex h-11 shrink-0 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ThreadImagePickerModal
        mode={pickerMode}
        activePresetId={pickerMode ? getActivePresetId(thread, pickerMode) : 'workspace'}
        saving={appearanceSaving}
        coverInputRef={coverInputRef}
        wallpaperInputRef={wallpaperInputRef}
        onClose={() => setPickerMode(null)}
        onSelectPreset={(presetId) => handleSelectPreset(pickerMode, presetId)}
        onUploadCover={handleImageUpload('cover')}
        onUploadWallpaper={handleImageUpload('wallpaper')}
      />
    </div>
  );
};

export default ThreadChat;
