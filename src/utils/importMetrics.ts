import readXlsxFile from 'read-excel-file/browser';
import { EmployeeAttendanceRecord, MetricDefinition, MetricRecord } from '../types/types';

export interface MetricImportResult {
  records: MetricRecord[];
  periods: string[];
  skippedRows: number;
  employeeAttendance?: EmployeeAttendanceRecord[];
}

const requiredAliases = {
  metric: ['metricid', 'metric_id', 'metric', 'code', 'metriccode', 'metric_code', 'kpi', 'kpicode'],
  period: ['period', 'periode', 'quarter', 'trimestre'],
  actual: ['actual', 'reel', 'realise', 'value', 'valeur'],
  target: ['target', 'cible', 'objectif'],
  previous: ['previousperiodactual', 'previous_period_actual', 'previous', 'previousactual', 'precedent', 'n-1'],
};

type WorkbookSheet = {
  sheet: string;
  data: unknown[][];
};

type HrMetricId = 'absenteisme' | 'permissions' | 'arret-maladie';

type HrEmployeeTotal = {
  id: string;
  name: string;
  role: string;
  presence: number;
  absence: number;
  paidLeave: number;
  rttLeave: number;
  permission: number;
  sickLeave: number;
};

type HrPeriodTotal = {
  period: string;
  presence: number;
  absence: number;
  paidLeave: number;
  rttLeave: number;
  permission: number;
  sickLeave: number;
  employees: HrEmployeeTotal[];
};

const hrMetricTargets: Record<HrMetricId, number> = {
  absenteisme: 0.03,
  permissions: 0.02,
  'arret-maladie': 0.02,
};
const hoursPerDay = 8;

const monthOrder = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'];
const monthPeriodLabel: Record<string, string> = {
  JANVIER: 'Janvier 2026',
  FEVRIER: 'Fevrier 2026',
  MARS: 'Mars 2026',
  AVRIL: 'Avril 2026',
  MAI: 'Mai 2026',
  JUIN: 'Juin 2026',
  JUILLET: 'Juillet 2026',
  AOUT: 'Aout 2026',
  SEPTEMBRE: 'Septembre 2026',
  OCTOBRE: 'Octobre 2026',
  NOVEMBRE: 'Novembre 2026',
  DECEMBRE: 'Decembre 2026',
};

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '');
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === ',' || char === ';' || char === '\t')) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

function findColumn(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseNumber(value: unknown, definition?: MetricDefinition) {
  if (typeof value === 'number') {
    return normalizePercentage(value, definition);
  }

  const raw = String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/(fcfa|xof|€|\$)/gi, '')
    .replace('%', '')
    .replace(',', '.');

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return normalizePercentage(parsed, definition);
}

function parsePlainNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const parsed = Number(
    String(value ?? '')
      .trim()
      .replace(/\s/g, '')
      .replace(',', '.'),
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function employeeId(name: string, firstName: string) {
  return normalizeText(`${name}-${firstName}`).replace(/[^A-Z0-9]+/g, '-');
}

function addEmployeeTotal(target: Map<string, HrEmployeeTotal>, source: HrEmployeeTotal) {
  const current = target.get(source.id) ?? {
    id: source.id,
    name: source.name,
    role: source.role,
    presence: 0,
    absence: 0,
    paidLeave: 0,
    rttLeave: 0,
    permission: 0,
    sickLeave: 0,
  };

  current.presence += source.presence;
  current.absence += source.absence;
  current.paidLeave += source.paidLeave;
  current.rttLeave += source.rttLeave;
  current.permission += source.permission;
  current.sickLeave += source.sickLeave;
  target.set(source.id, current);
}

function normalizePercentage(value: number, definition?: MetricDefinition) {
  if (definition?.formatType === 'percentage' && Math.abs(value) > 1) {
    return value / 100;
  }
  return value;
}

async function readWorkbook(file: File): Promise<WorkbookSheet[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    return [{ sheet: file.name, data: parseCsv(await file.text()) }];
  }

  if (extension === 'xlsx') {
    const sheets = await readXlsxFile(file);
    return sheets.map((sheet) => ({
      sheet: sheet.sheet,
      data: sheet.data.map((row: unknown[]) => row.map((cell: unknown) => cell ?? '')),
    }));
  }

  throw new Error('Format non supporte. Utilisez un fichier CSV ou XLSX.');
}

function findHrColumn(headers: string[], aliases: string[]) {
  return headers.findIndex((header) => aliases.some((alias) => header.includes(alias)));
}

function findHrHeaderRow(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return (
      findHrColumn(headers, ['presence']) >= 0 &&
      findHrColumn(headers, ['absence']) >= 0 &&
      findHrColumn(headers, ['permission']) >= 0 &&
      findHrColumn(headers, ['arretmal']) >= 0
    );
  });
}

function periodForMonth(sheetName: string) {
  const normalized = normalizeText(sheetName);
  const month = monthOrder.find((item) => normalized.includes(item));
  return month ? monthPeriodLabel[month] : null;
}

function periodForHrSheet(sheetName: string) {
  const monthlyPeriod = periodForMonth(sheetName);
  if (monthlyPeriod) return monthlyPeriod;

  const normalized = normalizeText(sheetName);
  if (normalized.includes('Q1') || normalized.includes('T1')) return 'Q1 2026';
  if (normalized.includes('Q2') || normalized.includes('T2')) return 'Q2 2026';
  if (normalized.includes('Q3') || normalized.includes('T3')) return 'Q3 2026';
  if (normalized.includes('Q4') || normalized.includes('T4')) return 'Q4 2026';
  if (normalized.includes('ANNEE') || normalized.includes('ANNUEL') || normalized.includes('GLISSANTE')) return 'Annee Glissante';
  return null;
}

function quarterForMonthPeriod(period: string) {
  if (['Janvier 2026', 'Fevrier 2026', 'Mars 2026'].includes(period)) return 'Q1 2026';
  if (['Avril 2026', 'Mai 2026', 'Juin 2026'].includes(period)) return 'Q2 2026';
  if (['Juillet 2026', 'Aout 2026', 'Septembre 2026'].includes(period)) return 'Q3 2026';
  if (['Octobre 2026', 'Novembre 2026', 'Decembre 2026'].includes(period)) return 'Q4 2026';
  return null;
}

function isHrWorkbook(sheets: WorkbookSheet[]) {
  return sheets.some((sheet) => periodForHrSheet(sheet.sheet) && findHrHeaderRow(sheet.data) >= 0);
}

function buildHrRecords(periodTotals: HrPeriodTotal[]) {
  const records: MetricRecord[] = [];
  const previousByMetric = new Map<HrMetricId, number>();

  periodTotals.forEach((total) => {
    const denominator = total.presence + total.absence + total.paidLeave + total.rttLeave + total.permission + total.sickLeave;
    if (denominator <= 0) return;

    const values: Record<HrMetricId, number> = {
      absenteisme: (total.absence + total.sickLeave) / denominator,
      permissions: total.permission / denominator,
      'arret-maladie': total.sickLeave / denominator,
    };

    (Object.keys(values) as HrMetricId[]).forEach((metricId) => {
      const actual = Number(values[metricId].toFixed(4));
      records.push({
        id: `import-${metricId}-${total.period}`,
        metricId,
        period: total.period,
        actual,
        target: hrMetricTargets[metricId],
        previousPeriodActual: previousByMetric.get(metricId) ?? actual,
      });
      previousByMetric.set(metricId, actual);
    });
  });

  return records;
}

function buildEmployeeAttendance(periodTotals: HrPeriodTotal[]): EmployeeAttendanceRecord[] {
  return periodTotals.flatMap((total) =>
    total.employees
      .map((employee) => {
        const presenceHours = employee.presence * hoursPerDay;
        const absentHours = employee.absence * hoursPerDay;
        const absenceHours = (employee.absence + employee.sickLeave) * hoursPerDay;
        const permissionHours = employee.permission * hoursPerDay;
        const sickLeaveHours = employee.sickLeave * hoursPerDay;
        const paidLeaveHours = employee.paidLeave * hoursPerDay;
        const rttLeaveHours = employee.rttLeave * hoursPerDay;
        const totalTrackedHours =
          (employee.presence + employee.absence + employee.paidLeave + employee.rttLeave + employee.permission + employee.sickLeave) * hoursPerDay;

        return {
          id: `${employee.id}-${total.period}`,
          name: employee.name,
          role: employee.role,
          period: total.period,
          presenceHours,
          absenceHours,
          absentHours,
          permissionHours,
          sickLeaveHours,
          paidLeaveHours,
          rttLeaveHours,
          totalTrackedHours,
          absenteeismRate: totalTrackedHours > 0 ? absenceHours / totalTrackedHours : 0,
        };
      })
      .filter((employee) => employee.totalTrackedHours > 0),
  );
}

function parseHrWorkbook(sheets: WorkbookSheet[]): MetricImportResult {
  const monthlyTotals: HrPeriodTotal[] = sheets
    .map((sheet) => {
      const period = periodForHrSheet(sheet.sheet);
      if (!period) return null;

      const headerRowIndex = findHrHeaderRow(sheet.data);
      if (headerRowIndex < 0) return null;

      const headers = sheet.data[headerRowIndex].map(normalizeHeader);
      const nameColumn = findHrColumn(headers, ['noms', 'nom']);
      const firstNameColumn = findHrColumn(headers, ['prenoms', 'premons', 'prenom']);
      const functionColumn = findHrColumn(headers, ['fonction']);
      const presenceColumn = findHrColumn(headers, ['presence']);
      const absenceColumn = findHrColumn(headers, ['absence']);
      const paidLeaveColumn = findHrColumn(headers, ['congepaye']);
      const rttLeaveColumn = findHrColumn(headers, ['congertt']);
      const permissionColumn = findHrColumn(headers, ['permission']);
      const sickLeaveColumn = findHrColumn(headers, ['arretmal']);

      const employees = new Map<string, HrEmployeeTotal>();
      const totals: HrPeriodTotal = { period, presence: 0, absence: 0, paidLeave: 0, rttLeave: 0, permission: 0, sickLeave: 0, employees: [] };

      sheet.data.slice(headerRowIndex + 1).forEach((row) => {
        const lastName = String(row[nameColumn] ?? '').trim();
        const firstName = String(row[firstNameColumn] ?? '').trim();
        const role = String(row[functionColumn] ?? '').trim();
        const hasEmployeeIdentity =
          lastName !== '' &&
          firstName !== '' &&
          role !== '';

        if (!hasEmployeeIdentity) return;

        const employee: HrEmployeeTotal = {
          id: employeeId(lastName, firstName),
          name: `${lastName} ${firstName}`.trim(),
          role,
          presence: parsePlainNumber(row[presenceColumn]),
          absence: parsePlainNumber(row[absenceColumn]),
          paidLeave: paidLeaveColumn >= 0 ? parsePlainNumber(row[paidLeaveColumn]) : 0,
          rttLeave: rttLeaveColumn >= 0 ? parsePlainNumber(row[rttLeaveColumn]) : 0,
          permission: parsePlainNumber(row[permissionColumn]),
          sickLeave: parsePlainNumber(row[sickLeaveColumn]),
        };

        totals.presence += employee.presence;
        totals.absence += employee.absence;
        totals.paidLeave += employee.paidLeave;
        totals.rttLeave += employee.rttLeave;
        totals.permission += employee.permission;
        totals.sickLeave += employee.sickLeave;
        addEmployeeTotal(employees, employee);
      });

      totals.employees = Array.from(employees.values());
      return totals;
    })
    .filter((total): total is NonNullable<typeof total> => Boolean(total))
    .filter((total) => total.presence + total.absence + total.paidLeave + total.rttLeave + total.permission + total.sickLeave > 0)
    .sort((a, b) => {
      const periodA = Object.entries(monthPeriodLabel).find(([, label]) => label === a.period)?.[0] ?? a.period;
      const periodB = Object.entries(monthPeriodLabel).find(([, label]) => label === b.period)?.[0] ?? b.period;
      const indexA = monthOrder.includes(periodA) ? monthOrder.indexOf(periodA) : monthOrder.length;
      const indexB = monthOrder.includes(periodB) ? monthOrder.indexOf(periodB) : monthOrder.length;
      return indexA - indexB || a.period.localeCompare(b.period);
    });

  const quarterTotals = new Map<string, HrPeriodTotal>();
  const quarterEmployees = new Map<string, Map<string, HrEmployeeTotal>>();

  monthlyTotals.forEach((total) => {
    const quarter = quarterForMonthPeriod(total.period);
    if (!quarter) return;

    const current = quarterTotals.get(quarter) ?? { period: quarter, presence: 0, absence: 0, paidLeave: 0, rttLeave: 0, permission: 0, sickLeave: 0, employees: [] };
    const employees = quarterEmployees.get(quarter) ?? new Map<string, HrEmployeeTotal>();
    current.presence += total.presence;
    current.absence += total.absence;
    current.paidLeave += total.paidLeave;
    current.rttLeave += total.rttLeave;
    current.permission += total.permission;
    current.sickLeave += total.sickLeave;
    total.employees.forEach((employee) => addEmployeeTotal(employees, employee));
    current.employees = Array.from(employees.values());
    quarterTotals.set(quarter, current);
    quarterEmployees.set(quarter, employees);
  });

  const rollingEmployees = new Map<string, HrEmployeeTotal>();
  monthlyTotals.forEach((total) => {
    total.employees.forEach((employee) => addEmployeeTotal(rollingEmployees, employee));
  });

  const rollingTotal = monthlyTotals.reduce(
    (sum, total) => ({
      period: 'Annee Glissante',
      presence: sum.presence + total.presence,
      absence: sum.absence + total.absence,
      paidLeave: sum.paidLeave + total.paidLeave,
      rttLeave: sum.rttLeave + total.rttLeave,
      permission: sum.permission + total.permission,
      sickLeave: sum.sickLeave + total.sickLeave,
      employees: [],
    }),
    { period: 'Annee Glissante', presence: 0, absence: 0, paidLeave: 0, rttLeave: 0, permission: 0, sickLeave: 0, employees: [] },
  );
  rollingTotal.employees = Array.from(rollingEmployees.values());

  const periodTotals = [
    ...Array.from(quarterTotals.values()).sort((a, b) => a.period.localeCompare(b.period)),
    ...monthlyTotals,
    rollingTotal,
  ].filter((total) => total.presence + total.absence + total.paidLeave + total.rttLeave + total.permission + total.sickLeave > 0);

  const records = buildHrRecords(periodTotals);
  const employeeAttendance = buildEmployeeAttendance(periodTotals);

  return {
    records,
    periods: Array.from(new Set(records.map((record) => record.period))),
    skippedRows: 0,
    employeeAttendance,
  };
}

export async function parseMetricFile(file: File, definitions: MetricDefinition[]): Promise<MetricImportResult> {
  const sheets = await readWorkbook(file);
  if (isHrWorkbook(sheets)) {
    return parseHrWorkbook(sheets);
  }

  const rows = sheets[0]?.data ?? [];
  if (rows.length < 2) {
    throw new Error('Le fichier doit contenir une ligne d en-tetes et au moins une ligne de donnees.');
  }

  const headers = rows[0].map(normalizeHeader);
  const metricColumn = findColumn(headers, requiredAliases.metric);
  const periodColumn = findColumn(headers, requiredAliases.period);
  const actualColumn = findColumn(headers, requiredAliases.actual);
  const targetColumn = findColumn(headers, requiredAliases.target);
  const previousColumn = findColumn(headers, requiredAliases.previous);

  if ([metricColumn, periodColumn, actualColumn, targetColumn].some((index) => index < 0)) {
    throw new Error('Colonnes requises: metricId ou code, period, actual, target. previousPeriodActual est recommande.');
  }

  const byIdOrCode = new Map<string, MetricDefinition>();
  definitions.forEach((definition) => {
    byIdOrCode.set(definition.id.toLowerCase(), definition);
    byIdOrCode.set(definition.code.toLowerCase(), definition);
  });

  const records: MetricRecord[] = [];
  let skippedRows = 0;

  rows.slice(1).forEach((row: unknown[], index: number) => {
    const metricKey = String(row[metricColumn] ?? '').trim().toLowerCase();
    const definition = byIdOrCode.get(metricKey);
    const period = String(row[periodColumn] ?? '').trim();
    const actual = parseNumber(row[actualColumn], definition);
    const target = parseNumber(row[targetColumn], definition);
    const previous = previousColumn >= 0 ? parseNumber(row[previousColumn], definition) : actual;

    if (!definition || !period || actual === null || target === null || previous === null) {
      skippedRows += 1;
      return;
    }

    records.push({
      id: `import-${definition.id}-${period}-${index}`,
      metricId: definition.id,
      period,
      actual,
      target,
      previousPeriodActual: previous,
    });
  });

  return {
    records,
    periods: Array.from(new Set(records.map((record) => record.period))),
    skippedRows,
  };
}

export function mergeMetricRecords(current: MetricRecord[], imported: MetricRecord[]) {
  const merged = new Map<string, MetricRecord>();
  current.forEach((record) => merged.set(`${record.metricId}:${record.period}`, record));
  imported.forEach((record) => merged.set(`${record.metricId}:${record.period}`, record));
  return Array.from(merged.values());
}
