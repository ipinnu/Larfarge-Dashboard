import XLSX from 'xlsx-js-style';
import { displayDriverName } from './driverUtils';

export interface LogEntry {
  timestamp: string;
  assetId: string;
  regNo?: string;
  assetName?: string;
  site?: string;
  transporter?: string;
  driverName?: string;
  driverPhone?: string;
  address?: string;
  eventId: string;
  label?: string;
  eventTime: string;
  type: 'panic' | 'warning';
}

export type ExportFormat = 'csv' | 'excel' | 'pdf';

const COLUMNS = [
  { header: 'Asset Name', get: (e: LogEntry) => e.assetName || 'N/A' },
  { header: 'Reg No', get: (e: LogEntry) => e.regNo || 'N/A' },
  { header: 'Site', get: (e: LogEntry) => e.site || 'N/A' },
  { header: 'Transporter', get: (e: LogEntry) => e.transporter || 'N/A' },
  { header: 'Driver', get: (e: LogEntry) => displayDriverName(e.driverName, 'N/A') },
  { header: 'Phone', get: (e: LogEntry) => e.driverPhone || 'N/A' },
  { header: 'Event', get: (e: LogEntry) => e.label || 'Unknown' },
  { header: 'Event Time', get: (e: LogEntry) => (e.eventTime ? new Date(e.eventTime).toLocaleString('en-GB') : 'N/A') },
  {
    header: 'Location',
    get: (e: LogEntry) => {
      if (e.address && e.address !== 'N/A' && e.address !== 'null') return e.address;
      return 'N/A';
    },
  },
];

const TEXT_FORCE_COLUMNS = ['Phone', 'Reg No'];
const COL_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

function fileStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadCSV(entries: LogEntry[], reportTitle: string) {
  const headers = COLUMNS.map(c => `"${c.header}"`);
  const rows = entries.map(e =>
    COLUMNS.map(c => {
      const val = String(c.get(e));
      const escaped = val.replace(/"/g, '""');
      if (TEXT_FORCE_COLUMNS.includes(c.header) && val !== 'N/A') return `"=""${escaped}"""`;
      return `"${escaped}"`;
    }),
  );
  const csv = '\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${fileStamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(entries: LogEntry[], reportTitle: string, meta: string) {
  const wb = XLSX.utils.book_new();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ws: any = {};

  const setCell = (col: string, row: number, value: string, style: object) => {
    ws[`${col}${row}`] = { v: value, t: 's', s: style };
  };

  let rowIdx = 1;
  setCell('A', rowIdx, reportTitle, {
    font: { bold: true, color: { rgb: '0078D4' }, sz: 14 },
  });
  rowIdx++;
  setCell('A', rowIdx, `Generated: ${new Date().toLocaleString('en-GB')}  ·  ${entries.length} event${entries.length !== 1 ? 's' : ''}`, {
    font: { color: { rgb: '64748B' }, sz: 10 },
  });
  rowIdx++;
  setCell('A', rowIdx, meta, { font: { color: { rgb: '64748B' }, sz: 10 } });
  rowIdx += 2;

  COLUMNS.forEach((col, i) => {
    setCell(COL_KEYS[i], rowIdx, col.header, {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E293B' } },
      alignment: { horizontal: 'left' },
    });
  });
  rowIdx++;

  entries.forEach(e => {
    const isPanic = e.type === 'panic';
    const bgColor = isPanic ? 'FFF1F2' : 'FFFBEB';
    const borderColor = isPanic ? 'FECDD3' : 'FDE68A';
    COLUMNS.forEach((col, i) => {
      setCell(COL_KEYS[i], rowIdx, String(col.get(e)), {
        font: { color: { rgb: '1E293B' } },
        fill: { fgColor: { rgb: bgColor } },
        border: { bottom: { style: 'thin', color: { rgb: borderColor } } },
      });
    });
    rowIdx++;
  });

  ws['!ref'] = `A1:I${rowIdx}`;
  ws['!cols'] = [
    { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
    { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Fleet Report');
  XLSX.writeFile(wb, `${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${fileStamp()}.xlsx`);
}

async function downloadPDF(entries: LogEntry[], reportTitle: string, meta: string) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(16);
  doc.setTextColor(0, 120, 212);
  doc.text(reportTitle, 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')} • ${entries.length} event${entries.length !== 1 ? 's' : ''}`, 14, 23);
  doc.text(meta, 14, 29);

  autoTable(doc, {
    head: [COLUMNS.map(c => c.header)],
    body: entries.map(e => COLUMNS.map(c => String(c.get(e)))),
    startY: 34,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const isPanic = entries[data.row.index]?.type === 'panic';
        data.cell.styles.textColor = isPanic ? [200, 16, 46] : [133, 79, 11];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`${reportTitle.toLowerCase().replace(/\s+/g, '-')}-${fileStamp()}.pdf`);
}

export async function exportReport(
  entries: LogEntry[],
  format: ExportFormat,
  reportTitle: string,
  meta: string,
) {
  if (format === 'csv') downloadCSV(entries, reportTitle);
  else if (format === 'excel') downloadExcel(entries, reportTitle, meta);
  else await downloadPDF(entries, reportTitle, meta);
}
