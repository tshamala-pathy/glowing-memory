/** Shared helpers for the project thread chat page. */

export const getInitials = (value) => {
  if (!value) return '?';
  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return String(value).slice(0, 2).toUpperCase();
};

export const formatMessageTime = (value) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatDateDivider = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
};

export const shouldShowDateDivider = (message, previousMessage) => {
  if (!message?.created_at) return false;
  if (!previousMessage?.created_at) return true;
  return new Date(message.created_at).toDateString() !== new Date(previousMessage.created_at).toDateString();
};

export const messageHasAttachment = (message) =>
  Boolean(
    message?.has_attachment ||
      message?.attachment ||
      message?.attachment_media_url ||
      message?.attachment_url ||
      message?.attachment_name
  );

export const messageIsImageAttachment = (message) => {
  const nameOrUrl = message?.attachment_name || message?.attachment_media_url || message?.attachment || '';
  if (!nameOrUrl || typeof nameOrUrl !== 'string') return false;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(nameOrUrl.split('?')[0]);
};

export const messageAttachmentFileName = (message) => {
  if (message?.attachment_name) return message.attachment_name;
  const content = message?.content?.trim();
  if (content && /^📎\s*/.test(content)) return content.replace(/^📎\s*/, '').trim();
  return 'Attachment';
};

export const messageDisplayContent = (message) => {
  const content = message.content?.trim();
  if (!content || content === '(attachment)') return null;
  if (/^📎/.test(content) && messageHasAttachment(message)) return null;
  return content;
};

export const messageSenderLabel = (message, isOwn) => {
  if (message.sender_role === 'admin') return message.sender_name || 'Admin';
  if (isOwn) return 'You';
  return message.sender_name || message.sender_email || 'Client';
};

export const extractThreadPatchError = (error) => {
  const data = error?.response?.data;
  return (
    data?.background_image?.[0] ||
    data?.wallpaper_image?.[0] ||
    data?.background_preset?.[0] ||
    data?.wallpaper_preset?.[0] ||
    data?.detail ||
    'Failed to update image.'
  );
};
