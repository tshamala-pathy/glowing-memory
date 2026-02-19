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

/** Format amount as South African Rand (e.g. "R 1,234.56") */
export const formatCurrency = (amount) => {
  if (amount == null) return '—';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(n) ? amount : `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
};

/** Tailwind classes for quote status badges */
export const quoteStatusColors = {
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Replied: 'bg-blue-100 text-blue-800',
  Reviewed: 'bg-gray-100 text-gray-800',
};

/** Tailwind classes for invoice status badges */
export const invoiceStatusColors = {
  Paid: 'bg-green-100 text-green-800',
  Sent: 'bg-blue-100 text-blue-800',
  Draft: 'bg-gray-100 text-gray-800',
  Overdue: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-800',
};

/** Tailwind classes for project status badges */
export const projectStatusColors = {
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

/** Get status badge class for quote, invoice, or project */
export const getQuoteStatusClass = (status) => quoteStatusColors[status] || 'bg-gray-100 text-gray-800';
export const getInvoiceStatusClass = (status) => invoiceStatusColors[status] || 'bg-gray-100 text-gray-800';
export const getProjectStatusClass = (status) => projectStatusColors[status] || 'bg-gray-100 text-gray-800';
