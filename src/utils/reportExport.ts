import { domains } from '../data/mockData';
import { EmployeeAttendanceRecord, MetricWithRecord } from '../types/types';
import { computeHealthScore, formatMetricValue, getHealthLabel } from './kpi';

interface ReportData {
  period: string;
  metrics: MetricWithRecord[];
  employeeAttendance: EmployeeAttendanceRecord[];
}

const hoursPerDay = 8;

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
  const blob = new Blob([content], { type });
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

function getDomainName(domainId: string) {
  return domains.find((domain) => domain.id === domainId)?.name ?? domainId;
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

function metricRows(metrics: MetricWithRecord[]) {
  return metrics.map(({ definition, record }) => [
    getDomainName(definition.domainId),
    definition.code,
    definition.name,
    formatMetricValue(record.actual, definition),
    formatMetricValue(record.target, definition),
    formatMetricValue(record.previousPeriodActual, definition),
  ]);
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

function reportStyles() {
  return `
    <style>
      body { margin: 0; background: #09090b; color: #f4f4f5; font-family: Arial, Helvetica, sans-serif; }
      .report { padding: 24px; }
      .slide { width: 960px; min-height: 540px; padding: 32px; page-break-after: always; background: #09090b; color: #f4f4f5; box-sizing: border-box; }
      h1 { margin: 0 0 8px; font-size: 28px; color: #ffffff; }
      h2 { margin: 26px 0 12px; font-size: 18px; color: #ffffff; }
      h3 { margin: 0 0 12px; font-size: 14px; color: #ffffff; }
      p { color: #a1a1aa; margin: 0 0 14px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0 22px; font-size: 12px; background: #09090b; }
      th { background: #18181b; color: #a1a1aa; text-transform: uppercase; font-size: 11px; text-align: left; }
      th, td { border: 1px solid #27272a; padding: 8px 10px; vertical-align: top; }
      td { color: #e4e4e7; }
      tfoot td { font-weight: 700; color: #ffffff; background: #18181b; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0 24px; }
      .summary-card { border: 1px solid #27272a; border-radius: 8px; padding: 14px; background: #0f172a; }
      .summary-card span { display: block; color: #a1a1aa; font-size: 12px; }
      .summary-card strong { display: block; margin-top: 8px; color: #ffffff; font-size: 22px; }
      .summary-card small { display: block; margin-top: 5px; color: #38bdf8; }
      .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0 24px; }
      .chart-card { border: 1px solid #27272a; border-radius: 8px; padding: 14px; background: #09090b; }
      .bar-row { display: grid; grid-template-columns: 150px 1fr 70px; gap: 10px; align-items: center; margin: 8px 0; font-size: 12px; }
      .bar-label { color: #d4d4d8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bar-track { height: 14px; background: #27272a; border-radius: 999px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 999px; }
      .bar-value { color: #f4f4f5; text-align: right; }
      .note { color: #71717a; font-size: 11px; margin-top: 14px; }
    </style>
  `;
}

function buildReportHtml(data: ReportData, mode: 'excel' | 'powerpoint') {
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

  const kpiTable = table(['Domaine', 'Code', 'KPI', 'Reel', 'Objectif', 'Periode precedente'], metricRows(data.metrics));
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

  if (mode === 'powerpoint') {
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${reportStyles()}
        </head>
        <body>
          <section class="slide">
            <h1>Rapport KPI RH</h1>
            <p>Periode: ${escapeHtml(data.period)}</p>
            ${summaryCards(data)}
            ${charts}
          </section>
          <section class="slide">
            <h2>Tableaux de synthese</h2>
            ${summaryTable}
            ${kpiTable}
          </section>
          <section class="slide">
            <h2>Arrets maladie et absences</h2>
            ${sickLeaveTable}
            ${absentTable}
          </section>
          <section class="slide">
            <h2>Presence par agent</h2>
            ${presenceTable}
          </section>
        </body>
      </html>
    `;
  }

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${reportStyles()}
      </head>
      <body>
        <div class="report">
          <h1>Rapport KPI RH</h1>
          <p>Periode: ${escapeHtml(data.period)}</p>
          ${summaryCards(data)}
          ${charts}
          <h2>Synthese</h2>
          ${summaryTable}
          <h2>KPI</h2>
          ${kpiTable}
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

export function exportReportToExcel(data: ReportData) {
  const fileName = `rapport-kpi-rh-${safeFileName(data.period)}.xls`;
  downloadFile(buildReportHtml(data, 'excel'), fileName, 'application/vnd.ms-excel;charset=utf-8');
}

export function exportReportToPowerPoint(data: ReportData) {
  const fileName = `rapport-kpi-rh-${safeFileName(data.period)}.ppt`;
  downloadFile(buildReportHtml(data, 'powerpoint'), fileName, 'application/vnd.ms-powerpoint;charset=utf-8');
}
