import { formatCurrency, formatDate, formatRelativeTime, getInvoiceStatusLabel, getQuoteStatusLabel, getQuoteStatusClass } from './formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('returns em dash for empty values', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
    });

    it('formats ISO date strings', () => {
      const result = formatDate('2025-01-15T12:00:00Z');
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/2025/);
    });
  });

  describe('formatRelativeTime', () => {
    it('returns Just now for recent timestamps', () => {
      expect(formatRelativeTime(new Date())).toBe('Just now');
    });

    it('returns em dash for invalid input', () => {
      expect(formatRelativeTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('formatCurrency', () => {
    it('formats numbers as ZAR', () => {
      const result = formatCurrency(1234.5);
      expect(result).toMatch(/^R\s/);
      expect(result).toContain('234');
      expect(result).toContain('50');
    });

    it('returns em dash for null', () => {
      expect(formatCurrency(null)).toBe('—');
    });
  });

  describe('status helpers', () => {
    it('returns quote status label', () => {
      expect(getQuoteStatusLabel('approved')).toBe('Approved');
      expect(getQuoteStatusLabel('pending')).toBe('Pending');
    });

    it('returns invoice status label', () => {
      expect(getInvoiceStatusLabel('paid')).toBe('Paid');
      expect(getInvoiceStatusLabel('overdue')).toBe('Overdue');
    });

    it('returns tailwind class for known quote status', () => {
      expect(getQuoteStatusClass('approved')).toContain('green');
    });
  });
});
