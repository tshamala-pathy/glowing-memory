import React from 'react';
import { formatDate, formatCurrency, getInvoiceStatusClass, getInvoiceStatusLabel } from '../utils/formatters';

/**
 * Modal that displays full invoice content for the client (line items, amounts, dates).
 * Used on Profile and Client Portal so clients can view their invoice on the website.
 */
const InvoiceDetailModal = ({ invoice, onClose, onDownloadPDF, isDownloading }) => {
  if (!invoice) return null;

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = invoice.subtotal != null ? parseFloat(invoice.subtotal) : 0;
  const vatRate = invoice.vat_rate != null ? parseFloat(invoice.vat_rate) : 0;
  const vatAmount = invoice.vat_amount != null ? parseFloat(invoice.vat_amount) : 0;
  const totalAmount = invoice.total_amount != null ? parseFloat(invoice.total_amount) : 0;
  const amountPaid = invoice.amount_paid != null ? parseFloat(invoice.amount_paid) : 0;
  const amountDue = invoice.amount_due != null ? parseFloat(invoice.amount_due) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} aria-hidden="true" />
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Invoice {invoice.invoice_number || `#${invoice.id}`}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Issued {formatDate(invoice.issue_date)} · Due {formatDate(invoice.due_date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getInvoiceStatusClass(invoice.status)}`}>
                {getInvoiceStatusLabel(invoice.status)}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Provider (optional) */}
            {invoice.provider_name && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-medium text-gray-900">{invoice.provider_name}</span>
                {invoice.provider_email && <span className="ml-2">{invoice.provider_email}</span>}
              </div>
            )}

            {/* Line items */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Items</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-sm text-gray-500 text-center">
                        No line items
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const qty = Number(item.quantity) || 1;
                      const price = parseFloat(item.price) || 0;
                      const amount = qty * price;
                      return (
                        <tr key={idx}>
                          <td className="py-3 text-sm text-gray-900">{item.description || '—'}</td>
                          <td className="py-3 text-sm text-gray-600 text-right">{qty}</td>
                          <td className="py-3 text-sm text-gray-600 text-right">{formatCurrency(price)}</td>
                          <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(amount)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              {vatRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT ({vatRate}%)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
              {amountPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount paid</span>
                  <span className="text-green-700 font-medium">{formatCurrency(amountPaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount due</span>
                <span className="font-semibold text-gray-900">{formatCurrency(amountDue)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer: Download PDF */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            {onDownloadPDF && (
              <button
                type="button"
                onClick={() => onDownloadPDF(invoice)}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isDownloading ? 'Downloading...' : 'Download PDF'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2.5 bg-gray-200 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;
