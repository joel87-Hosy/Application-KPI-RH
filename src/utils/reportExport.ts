import type ExcelJS from 'exceljs';
import pptxgen from 'pptxgenjs';
import { EmployeeAttendanceRecord, MetricWithRecord } from '../types/types';
import { computeHealthScore, getHealthLabel } from './kpi';

interface ReportData {
  period: string;
  metrics: MetricWithRecord[];
  employeeAttendance: EmployeeAttendanceRecord[];
}

const hoursPerDay = 8;
const pptColors = {
  background: '09090B',
  panel: '18181B',
  border: '3F3F46',
  text: 'F4F4F5',
  muted: 'A1A1AA',
  green: '34D399',
  amber: 'F59E0B',
  red: 'F87171',
  blue: '38BDF8',
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits }).format(value);
}

function formatHours(value: number) {
  return `${formatNumber(value)} h`;
}

function formatDays(value: number) {
  return `${formatNumber(value / hoursPerDay)} j`;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

function downloadFile(content: string, fileName: string, type: string) {
  downloadBlob(new Blob([content], { type }), fileName);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function getEmployeeRows(data: ReportData) {
  return data.employeeAttendance.filter((employee) => employee.period === data.period);
}

function getReportModel(data: ReportData) {
  const employeeRows = getEmployeeRows(data);
  const absentRows = employeeRows
    .filter((employee) => employee.absentHours > 0)
    .sort((a, b) => b.absentHours - a.absentHours || a.name.localeCompare(b.name));
  const sickLeaveRows = employeeRows
    .filter((employee) => employee.sickLeaveHours > 0)
    .sort((a, b) => b.sickLeaveHours - a.sickLeaveHours || a.name.localeCompare(b.name));
  const topAbsences = [...employeeRows]
    .filter((employee) => employee.absenceHours > 0)
    .sort((a, b) => b.absenceHours - a.absenceHours || a.name.localeCompare(b.name))
    .slice(0, 10);
  const presenceRows = [...employeeRows].sort((a, b) => b.presenceHours - a.presenceHours || a.name.localeCompare(b.name));
  const totals = employeeRows.reduce(
    (sum, employee) => ({
      presenceHours: sum.presenceHours + employee.presenceHours,
      absentHours: sum.absentHours + employee.absentHours,
      sickLeaveHours: sum.sickLeaveHours + employee.sickLeaveHours,
      permissionHours: sum.permissionHours + employee.permissionHours,
    }),
    { presenceHours: 0, absentHours: 0, sickLeaveHours: 0, permissionHours: 0 },
  );
  const score = computeHealthScore(data.metrics);

  return {
    employeeRows,
    absentRows,
    sickLeaveRows,
    topAbsences,
    presenceRows,
    totals,
    score,
  };
}

function table(headers: string[], rows: Array<Array<string | number>>, footer?: Array<string | number>) {
  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
      </tbody>
      ${
        footer
          ? `<tfoot><tr>${footer.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr></tfoot>`
          : ''
      }
    </table>
  `;
}

function barChart(title: string, rows: Array<{ label: string; value: number; color?: string; display?: string }>) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return `
    <div class="chart-card">
      <h3>${escapeHtml(title)}</h3>
      <div class="bars">
        ${rows
          .map((row) => {
            const width = Math.max((row.value / maxValue) * 100, row.value > 0 ? 3 : 0);
            return `
              <div class="bar-row">
                <div class="bar-label">${escapeHtml(row.label)}</div>
                <div class="bar-track">
                  <div class="bar-fill" style="width:${width}%;background:${row.color ?? '#38bdf8'}"></div>
                </div>
                <div class="bar-value">${escapeHtml(row.display ?? formatNumber(row.value))}</div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function addPptTitle(slide: pptxgen.Slide, title: string, subtitle?: string) {
  slide.background = { color: pptColors.background };
  slide.addText(title, { x: 0.45, y: 0.32, w: 12.4, h: 0.35, fontFace: 'Arial', fontSize: 19, bold: true, color: pptColors.text, margin: 0 });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.45, y: 0.72, w: 12.4, h: 0.22, fontFace: 'Arial', fontSize: 9, color: pptColors.muted, margin: 0 });
  }
}

function addPptMetricCard(slide: pptxgen.Slide, label: string, value: string, detail: string, x: number, color: string) {
  slide.addShape('roundRect', {
    x,
    y: 1.12,
    w: 2.95,
    h: 0.95,
    rectRadius: 0.06,
    fill: { color: pptColors.panel },
    line: { color: pptColors.border, transparency: 10 },
  });
  slide.addText(label, { x: x + 0.16, y: 1.28, w: 2.6, h: 0.16, fontFace: 'Arial', fontSize: 8, color: pptColors.muted, margin: 0 });
  slide.addText(value, { x: x + 0.16, y: 1.5, w: 2.6, h: 0.27, fontFace: 'Arial', fontSize: 16, bold: true, color: pptColors.text, margin: 0, fit: 'shrink' });
  slide.addText(detail, { x: x + 0.16, y: 1.82, w: 2.6, h: 0.16, fontFace: 'Arial', fontSize: 8, color, margin: 0, fit: 'shrink' });
}

function addPptBarBlock(
  slide: pptxgen.Slide,
  title: string,
  rows: Array<{ label: string; value: number; color: string; display: string }>,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  slide.addShape('roundRect', {
    x,
    y,
    w,
    h,
    rectRadius: 0.06,
    fill: { color: pptColors.background },
    line: { color: pptColors.border, transparency: 10 },
  });
  slide.addText(title, { x: x + 0.14, y: y + 0.12, w: w - 0.28, h: 0.18, fontFace: 'Arial', fontSize: 9, bold: true, color: pptColors.text, margin: 0 });

  const visibleRows = rows.slice(0, 6);
  const maxValue = Math.max(...visibleRows.map((row) => row.value), 1);
  visibleRows.forEach((row, index) => {
    const rowY = y + 0.48 + index * 0.29;
    const barWidth = Math.max((row.value / maxValue) * (w - 2.45), row.value > 0 ? 0.08 : 0);
    slide.addText(row.label, { x: x + 0.14, y: rowY, w: 1.15, h: 0.15, fontFace: 'Arial', fontSize: 7, color: pptColors.muted, margin: 0, fit: 'shrink' });
    slide.addShape('rect', { x: x + 1.36, y: rowY + 0.02, w: w - 2.45, h: 0.1, fill: { color: '27272A' }, line: { color: '27272A' } });
    slide.addShape('rect', { x: x + 1.36, y: rowY + 0.02, w: barWidth, h: 0.1, fill: { color: row.color }, line: { color: row.color } });
    slide.addText(row.display, { x: x + w - 0.86, y: rowY, w: 0.7, h: 0.15, fontFace: 'Arial', fontSize: 7, color: pptColors.text, align: 'right', margin: 0, fit: 'shrink' });
  });
}

function addPptTable(slide: pptxgen.Slide, title: string, headers: string[], rows: string[][], x: number, y: number, w: number, h: number) {
  slide.addText(title, { x, y, w, h: 0.24, fontFace: 'Arial', fontSize: 12, bold: true, color: pptColors.text, margin: 0 });

  const tableRows = [
    headers.map((header) => ({ text: header, options: { bold: true, color: pptColors.muted, fill: { color: pptColors.panel } } })),
    ...rows.map((row) => row.map((cell) => ({ text: cell, options: { color: pptColors.text, fill: { color: pptColors.background } } }))),
  ];

  slide.addTable(tableRows, {
    x,
    y: y + 0.36,
    w,
    h: Math.max(h - 0.36, 0.4),
    border: { color: '27272A', pt: 0.5 },
    fontFace: 'Arial',
    fontSize: 7,
    margin: 0.05,
    valign: 'middle',
  });
}

function addPptFooter(slide: pptxgen.Slide, page: string) {
  slide.addText('Rapport genere depuis Nexus-KPI', { x: 0.45, y: 7.08, w: 4, h: 0.16, fontFace: 'Arial', fontSize: 7, color: '71717A', margin: 0 });
  slide.addText(page, { x: 12.1, y: 7.08, w: 0.8, h: 0.16, fontFace: 'Arial', fontSize: 7, color: '71717A', align: 'right', margin: 0 });
}

function summaryCards(data: ReportData) {
  const model = getReportModel(data);
  return `
    <div class="summary-grid">
      <div class="summary-card"><span>Sante globale</span><strong>${model.score}</strong><small>${escapeHtml(getHealthLabel(model.score))}</small></div>
      <div class="summary-card"><span>Presence</span><strong>${escapeHtml(formatHours(model.totals.presenceHours))}</strong><small>${escapeHtml(data.period)}</small></div>
      <div class="summary-card"><span>Arrets maladie</span><strong>${escapeHtml(formatDays(model.totals.sickLeaveHours))}</strong><small>${escapeHtml(formatHours(model.totals.sickLeaveHours))}</small></div>
      <div class="summary-card"><span>Permissions</span><strong>${escapeHtml(formatDays(model.totals.permissionHours))}</strong><small>${escapeHtml(formatHours(model.totals.permissionHours))}</small></div>
    </div>
  `;
}

function excelReportStyles() {
  return `
    <style>
      body { margin: 0; background: #ffffff; color: #1f2937; font-family: Arial, Helvetica, sans-serif; }
      .report { padding: 18px; background: #ffffff; }
      h1 { margin: 0 0 6px; font-size: 22px; color: #111827; }
      h2 { margin: 24px 0 8px; font-size: 15px; color: #1f2937; border-bottom: 1px solid #9ca3af; padding-bottom: 4px; }
      h3 { margin: 0 0 10px; font-size: 12px; color: #1f2937; }
      p { color: #4b5563; margin: 0 0 12px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0 18px; font-size: 11px; background: #ffffff; mso-border-alt: solid #d1d5db .5pt; }
      th { background: #d9eaf7; color: #111827; font-weight: 700; text-transform: uppercase; font-size: 10px; text-align: left; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; vertical-align: top; }
      td { color: #1f2937; background: #ffffff; }
      tbody tr:nth-child(even) td { background: #f8fafc; }
      tfoot td { font-weight: 700; color: #111827; background: #e5e7eb; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0 24px; }
      .summary-card { border: 1px solid #d1d5db; padding: 12px; background: #f8fafc; }
      .summary-card span { display: block; color: #4b5563; font-size: 11px; }
      .summary-card strong { display: block; margin-top: 6px; color: #111827; font-size: 18px; }
      .summary-card small { display: block; margin-top: 4px; color: #0369a1; }
      .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0 24px; }
      .chart-card { border: 1px solid #d1d5db; padding: 12px; background: #ffffff; }
      .bar-row { display: grid; grid-template-columns: 150px 1fr 70px; gap: 10px; align-items: center; margin: 8px 0; font-size: 12px; }
      .bar-label { color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bar-track { height: 14px; background: #e5e7eb; overflow: hidden; }
      .bar-fill { height: 100%; }
      .bar-value { color: #111827; text-align: right; }
      .note { color: #6b7280; font-size: 10px; margin-top: 14px; }
    </style>
  `;
}

function buildReportHtml(data: ReportData) {
  const model = getReportModel(data);
  const totalAbsentHours = model.absentRows.reduce((sum, employee) => sum + employee.absentHours, 0);
  const charts = `
    <div class="charts">
      ${barChart('Totaux de la periode', [
        { label: 'Presence', value: model.totals.presenceHours, display: formatHours(model.totals.presenceHours), color: '#34d399' },
        { label: 'Arrets maladie', value: model.totals.sickLeaveHours, display: formatDays(model.totals.sickLeaveHours), color: '#f59e0b' },
        { label: 'Permissions', value: model.totals.permissionHours, display: formatDays(model.totals.permissionHours), color: '#38bdf8' },
        { label: 'Absences', value: totalAbsentHours, display: formatDays(totalAbsentHours), color: '#f87171' },
      ])}
      ${barChart(
        'Top absences',
        model.topAbsences.map((employee) => ({
          label: employee.name,
          value: employee.absenceHours,
          display: formatDays(employee.absenceHours),
          color: '#f87171',
        })),
      )}
      ${barChart(
        'Arrets maladie par agent',
        model.sickLeaveRows.slice(0, 10).map((employee) => ({
          label: employee.name,
          value: employee.sickLeaveHours,
          display: formatDays(employee.sickLeaveHours),
          color: '#f59e0b',
        })),
      )}
      ${barChart(
        'Presences par agent',
        model.presenceRows.slice(0, 10).map((employee) => ({
          label: employee.name,
          value: employee.presenceHours,
          display: formatHours(employee.presenceHours),
          color: '#34d399',
        })),
      )}
    </div>
  `;

  const summaryTable = table(
    ['Periode', 'Total heures presence', 'Total jours arret maladie', 'Total jours permissions', 'Total jours absences'],
    [[data.period, formatHours(model.totals.presenceHours), formatDays(model.totals.sickLeaveHours), formatDays(model.totals.permissionHours), formatDays(totalAbsentHours)]],
  );

  const sickLeaveTable = table(
    ['Agent', 'Fonction', 'Jours arret maladie', 'Heures'],
    model.sickLeaveRows.map((employee) => [employee.name, employee.role, formatDays(employee.sickLeaveHours), formatHours(employee.sickLeaveHours)]),
  );
  const absentTable = table(
    ['Agent', 'Fonction', 'Jours absence', 'Heures'],
    model.absentRows.map((employee) => [employee.name, employee.role, formatDays(employee.absentHours), formatHours(employee.absentHours)]),
    ['Total', '', formatDays(totalAbsentHours), formatHours(totalAbsentHours)],
  );
  const presenceTable = table(
    ['Agent', 'Fonction', 'Presence', 'Absence + arret', 'Permission', 'Taux absence'],
    model.presenceRows.map((employee) => [
      employee.name,
      employee.role,
      formatHours(employee.presenceHours),
      formatHours(employee.absenceHours),
      formatHours(employee.permissionHours),
      formatPercent(employee.absenteeismRate),
    ]),
  );

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${excelReportStyles()}
      </head>
      <body>
        <div class="report">
          <h1>Rapport KPI RH</h1>
          <p>Periode: ${escapeHtml(data.period)}</p>
          ${summaryCards(data)}
          ${charts}
          <h2>Synthese</h2>
          ${summaryTable}
          <h2>Agents en arret maladie</h2>
          ${sickLeaveTable}
          <h2>Agents absents</h2>
          ${absentTable}
          <h2>Total heures de presence</h2>
          ${presenceTable}
          <p class="note">Rapport genere depuis Nexus-KPI. Les graphiques sont integres sous forme de visuels HTML compatibles Office.</p>
        </div>
      </body>
    </html>
  `;
}

function styleExcelCell(cell: ExcelJS.Cell, fill?: string, bold = false) {
  cell.font = { name: 'Arial', size: 10, bold, color: { argb: 'FF111827' } };
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  };
  if (fill) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  }
}

function addExcelSection(
  worksheet: ExcelJS.Worksheet,
  title: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  footer?: Array<string | number>,
) {
  const startRow = worksheet.rowCount + 1;
  worksheet.mergeCells(startRow, 1, startRow, 6);
  const titleCell = worksheet.getCell(startRow, 1);
  titleCell.value = title;
  titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF111827' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(startRow).height = 22;

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => styleExcelCell(cell, 'FFD9EAF7', true));
  headerRow.height = 24;

  rows.forEach((row, index) => {
    const excelRow = worksheet.addRow(row);
    const fill = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
    excelRow.eachCell({ includeEmpty: true }, (cell) => styleExcelCell(cell, fill));
    excelRow.height = 22;
  });

  if (footer) {
    const footerRow = worksheet.addRow(footer);
    footerRow.eachCell({ includeEmpty: true }, (cell) => styleExcelCell(cell, 'FFE5E7EB', true));
    footerRow.height = 22;
  }

  worksheet.addRow([]);
}

export async function exportReportToExcel(data: ReportData) {
  const ExcelJSModule = await import('exceljs');
  const model = getReportModel(data);
  const totalAbsentHours = model.absentRows.reduce((sum, employee) => sum + employee.absentHours, 0);
  const fileName = `rapport-kpi-rh-${safeFileName(data.period)}.xlsx`;
  const workbook = new ExcelJSModule.default.Workbook();
  workbook.creator = 'Nexus-KPI';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Rapport RH', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: true }],
    properties: { defaultRowHeight: 18 },
  });

  worksheet.columns = [
    { width: 26 },
    { width: 28 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 18 },
  ];

  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'Rapport KPI RH';
  worksheet.getCell('A1').font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF111827' } };
  worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(1).height = 28;
  worksheet.mergeCells('A2:F2');
  worksheet.getCell('A2').value = `Periode: ${data.period}`;
  worksheet.getCell('A2').font = { name: 'Arial', size: 11, color: { argb: 'FF4B5563' } };
  worksheet.addRow([]);

  addExcelSection(
    worksheet,
    'Synthese',
    ['Periode', 'Total heures presence', 'Total jours arret maladie', 'Total jours permissions', 'Total jours absences'],
    [[data.period, formatHours(model.totals.presenceHours), formatDays(model.totals.sickLeaveHours), formatDays(model.totals.permissionHours), formatDays(totalAbsentHours)]],
  );
  addExcelSection(
    worksheet,
    'Agents en arret maladie',
    ['Agent', 'Fonction', 'Jours arret maladie', 'Heures'],
    model.sickLeaveRows.map((employee) => [employee.name, employee.role, formatDays(employee.sickLeaveHours), formatHours(employee.sickLeaveHours)]),
  );
  addExcelSection(
    worksheet,
    'Agents absents',
    ['Agent', 'Fonction', 'Jours absence', 'Heures'],
    model.absentRows.map((employee) => [employee.name, employee.role, formatDays(employee.absentHours), formatHours(employee.absentHours)]),
    ['Total', '', formatDays(totalAbsentHours), formatHours(totalAbsentHours)],
  );
  addExcelSection(
    worksheet,
    'Total heures de presence',
    ['Agent', 'Fonction', 'Presence', 'Absence + arret', 'Permission', 'Taux absence'],
    model.presenceRows.map((employee) => [
      employee.name,
      employee.role,
      formatHours(employee.presenceHours),
      formatHours(employee.absenceHours),
      formatHours(employee.permissionHours),
      formatPercent(employee.absenteeismRate),
    ]),
  );

  worksheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: 5 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
}

export function exportReportToPowerPoint(data: ReportData) {
  const model = getReportModel(data);
  const totalAbsentHours = model.absentRows.reduce((sum, employee) => sum + employee.absentHours, 0);
  const fileName = `rapport-kpi-rh-${safeFileName(data.period)}.pptx`;
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Nexus-KPI';
  pptx.company = 'Nexus-KPI';
  pptx.subject = `Rapport KPI RH - ${data.period}`;
  pptx.title = `Rapport KPI RH - ${data.period}`;
  pptx.theme = {
    headFontFace: 'Arial',
    bodyFontFace: 'Arial',
  };

  const summarySlide = pptx.addSlide();
  addPptTitle(summarySlide, 'Rapport KPI RH', `Periode: ${data.period}`);
  addPptMetricCard(summarySlide, 'Sante globale', String(model.score), getHealthLabel(model.score), 0.45, pptColors.blue);
  addPptMetricCard(summarySlide, 'Presence', formatHours(model.totals.presenceHours), data.period, 3.62, pptColors.green);
  addPptMetricCard(summarySlide, 'Arrets maladie', formatDays(model.totals.sickLeaveHours), formatHours(model.totals.sickLeaveHours), 6.79, pptColors.amber);
  addPptMetricCard(summarySlide, 'Permissions', formatDays(model.totals.permissionHours), formatHours(model.totals.permissionHours), 9.96, pptColors.blue);
  addPptBarBlock(
    summarySlide,
    'Totaux de la periode',
    [
      { label: 'Presence', value: model.totals.presenceHours, display: formatHours(model.totals.presenceHours), color: pptColors.green },
      { label: 'Arrets maladie', value: model.totals.sickLeaveHours, display: formatDays(model.totals.sickLeaveHours), color: pptColors.amber },
      { label: 'Permissions', value: model.totals.permissionHours, display: formatDays(model.totals.permissionHours), color: pptColors.blue },
      { label: 'Absences', value: totalAbsentHours, display: formatDays(totalAbsentHours), color: pptColors.red },
    ],
    0.45,
    2.42,
    6.05,
    2.35,
  );
  addPptBarBlock(
    summarySlide,
    'Top absences',
    model.topAbsences.map((employee) => ({
      label: employee.name,
      value: employee.absenceHours,
      display: formatDays(employee.absenceHours),
      color: pptColors.red,
    })),
    6.9,
    2.42,
    5.98,
    2.35,
  );
  addPptTable(
    summarySlide,
    'Synthese',
    ['Periode', 'Presence', 'Arret maladie', 'Permissions', 'Absences'],
    [[data.period, formatHours(model.totals.presenceHours), formatDays(model.totals.sickLeaveHours), formatDays(model.totals.permissionHours), formatDays(totalAbsentHours)]],
    0.45,
    5.12,
    12.43,
    1.15,
  );
  addPptFooter(summarySlide, '1/4');

  const sickSlide = pptx.addSlide();
  addPptTitle(sickSlide, 'Arrets maladie et absences', `Periode: ${data.period}`);
  addPptBarBlock(
    sickSlide,
    'Arrets maladie par agent',
    model.sickLeaveRows.slice(0, 8).map((employee) => ({
      label: employee.name,
      value: employee.sickLeaveHours,
      display: formatDays(employee.sickLeaveHours),
      color: pptColors.amber,
    })),
    0.45,
    1.1,
    6.05,
    2.7,
  );
  addPptBarBlock(
    sickSlide,
    'Absences par agent',
    model.absentRows.slice(0, 8).map((employee) => ({
      label: employee.name,
      value: employee.absentHours,
      display: formatDays(employee.absentHours),
      color: pptColors.red,
    })),
    6.9,
    1.1,
    5.98,
    2.7,
  );
  addPptTable(
    sickSlide,
    'Agents en arret maladie',
    ['Agent', 'Fonction', 'Jours', 'Heures'],
    model.sickLeaveRows.slice(0, 9).map((employee) => [employee.name, employee.role, formatDays(employee.sickLeaveHours), formatHours(employee.sickLeaveHours)]),
    0.45,
    4.18,
    6.05,
    2.45,
  );
  addPptTable(
    sickSlide,
    'Agents absents',
    ['Agent', 'Fonction', 'Jours', 'Heures'],
    model.absentRows.slice(0, 9).map((employee) => [employee.name, employee.role, formatDays(employee.absentHours), formatHours(employee.absentHours)]),
    6.9,
    4.18,
    5.98,
    2.45,
  );
  addPptFooter(sickSlide, '2/4');

  const presenceSlide = pptx.addSlide();
  addPptTitle(presenceSlide, 'Presence par agent', `Periode: ${data.period}`);
  addPptBarBlock(
    presenceSlide,
    'Presences par agent',
    model.presenceRows.slice(0, 10).map((employee) => ({
      label: employee.name,
      value: employee.presenceHours,
      display: formatHours(employee.presenceHours),
      color: pptColors.green,
    })),
    0.45,
    1.1,
    12.43,
    2.7,
  );
  addPptTable(
    presenceSlide,
    'Total heures de presence',
    ['Agent', 'Fonction', 'Presence', 'Absence + arret', 'Permission', 'Taux absence'],
    model.presenceRows.slice(0, 12).map((employee) => [
      employee.name,
      employee.role,
      formatHours(employee.presenceHours),
      formatHours(employee.absenceHours),
      formatHours(employee.permissionHours),
      formatPercent(employee.absenteeismRate),
    ]),
    0.45,
    4.16,
    12.43,
    2.48,
  );
  addPptFooter(presenceSlide, '3/4');

  const detailSlide = pptx.addSlide();
  addPptTitle(detailSlide, 'Detail RH', `Periode: ${data.period}`);
  addPptTable(
    detailSlide,
    'Suivi des agents',
    ['Agent', 'Fonction', 'Presence', 'Absence + arret', 'Permission', 'Taux absence'],
    model.presenceRows.slice(12, 26).map((employee) => [
      employee.name,
      employee.role,
      formatHours(employee.presenceHours),
      formatHours(employee.absenceHours),
      formatHours(employee.permissionHours),
      formatPercent(employee.absenteeismRate),
    ]),
    0.45,
    1.08,
    12.43,
    5.55,
  );
  addPptFooter(detailSlide, '4/4');

  pptx.writeFile({ fileName, compression: true });
}
