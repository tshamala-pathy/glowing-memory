export const BRAND_NAME = 'PathyCode';
export const COMPANY_TAGLINE = 'Business & financial operations';

const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

/**
 * Build CSV text with branded header rows (company name, tagline, title, description).
 */
export function buildBrandedCsvContent(exportTitle, description, headers, rows) {
  const generated = new Date().toLocaleString();
  const brandLines = [
    ['Company', BRAND_NAME],
    ['Tagline', COMPANY_TAGLINE],
    ['Export', exportTitle],
    description ? ['Description', description] : null,
    ['Generated', generated],
    [],
  ]
    .filter((line) => line !== null)
    .map((line) => (line.length === 0 ? '' : line.map(escapeCell).join(',')));

  const dataLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  return [...brandLines, ...dataLines].join('\r\n');
}

/**
 * Trigger a branded CSV file download in the browser.
 */
export function downloadBrandedCsv(filename, exportTitle, description, headers, rows) {
  const BOM = '\uFEFF';
  const csvContent = buildBrandedCsvContent(exportTitle, description, headers, rows);
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}
