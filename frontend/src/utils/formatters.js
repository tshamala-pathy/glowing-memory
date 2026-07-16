/**
 * Shared formatters and status helpers for client-facing pages.
 * Used by Profile, ClientPortal, and other components that display
 * quotes, invoices, projects, and messages.
 */

/** Format date as "Jan 20, 2025" */
export const formatDate = (d) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return isNaN(date.getTime()) ? d : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Format date and time as "Jan 20, 2025, 2:30 PM" */
export const formatDateTime = (d) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return isNaN(date.getTime()) ? d : date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** Relative time: "Just now", "5 min ago", "2 hours ago", "Yesterday", "Jan 15" */
export const formatRelativeTime = (d) => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return d;
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(d);
};

/** Format amount as South African Rand (e.g. "R 1,234.56") */
export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(n) ? amount : `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
};

/** Tailwind classes for quote status badges (lowercase to match API) */
const quoteStatusColors = {
  pending: 'bg-amber-100 text-amber-800',
  replied: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  changes_requested: 'bg-amber-100 text-amber-800',
  invoiced: 'bg-indigo-100 text-indigo-800',
  paid: 'bg-green-100 text-green-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Changes_requested: 'bg-amber-100 text-amber-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Replied: 'bg-blue-100 text-blue-800',
  Reviewed: 'bg-gray-100 text-gray-800',
};

/** Tailwind classes for invoice status badges (backend uses lowercase: draft, unpaid, paid, overdue, cancelled) */
const invoiceStatusColors = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  // legacy (backend now uses lowercase)
  Paid: 'bg-green-100 text-green-800',
  Sent: 'bg-blue-100 text-blue-800',
  Draft: 'bg-gray-100 text-gray-800',
  Overdue: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-800',
};

/** Display label for invoice status */
export const getInvoiceStatusLabel = (status) => {
  const labels = { draft: 'Draft', unpaid: 'Unpaid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' };
  return labels[status] || (status && status.charAt(0).toUpperCase() + status.slice(1)) || status;
};

/** Tailwind classes for project status badges (planning, design, development, testing, completed) */
const projectStatusColors = {
  planning: 'bg-amber-100 text-amber-800',
  design: 'bg-blue-100 text-blue-800',
  development: 'bg-indigo-100 text-indigo-800',
  testing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

/** Display label for quote status */
export const getQuoteStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    replied: 'Replied',
    reviewed: 'Reviewed',
    approved: 'Approved',
    declined: 'Declined',
    rejected: 'Rejected',
    changes_requested: 'Changes requested',
    invoiced: 'Invoiced',
    paid: 'Paid',
  };
  return labels[status] || (status && status.charAt(0).toUpperCase() + status.slice(1)) || status;
};

/** Get status badge class for quote, invoice, or project */
export const getQuoteStatusClass = (status) => quoteStatusColors[status] || 'bg-gray-100 text-gray-800';
export const getInvoiceStatusClass = (status) => invoiceStatusColors[status] || 'bg-gray-100 text-gray-800';
export const getProjectStatusClass = (status) => projectStatusColors[status] || 'bg-gray-100 text-gray-800';

/** Turn DRF/axios error payloads into a readable message for alerts and forms. */
export const formatApiError = (err, fallback = 'Something went wrong.') => {
  const data = err?.response?.data;
  if (!data) {
    return err?.message || fallback;
  }
  if (typeof data === 'string') return data;
  if (data.detail) {
    return typeof data.detail === 'string' ? data.detail : String(data.detail);
  }
  if (data.error) {
    return typeof data.error === 'string' ? data.error : String(data.error);
  }
  if (Array.isArray(data.errors)) {
    return data.errors.join('\n');
  }
  const parts = [];
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'detail' || key === 'error') return;
    const label = key.replace(/_/g, ' ');
    if (Array.isArray(value)) {
      parts.push(`${label}: ${value.join(', ')}`);
    } else if (typeof value === 'string') {
      parts.push(`${label}: ${value}`);
    }
  });
  return parts.length ? parts.join('\n') : fallback;
};
