export interface Domain {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface MetricDefinition {
  id: string;
  domainId: string;
  code: string;
  name: string;
  unit: string;
  formatType: 'currency' | 'percentage' | 'number' | 'time';
  isHigherBetter: boolean;
}

export interface MetricRecord {
  id: string;
  metricId: string;
  period: string;
  actual: number;
  target: number;
  previousPeriodActual: number;
}

export type Period = string;

export interface MetricWithRecord {
  definition: MetricDefinition;
  record: MetricRecord;
}

export interface EmployeeAttendanceRecord {
  id: string;
  name: string;
  role: string;
  period: string;
  presenceHours: number;
  absenceHours: number;
  absentHours: number;
  permissionHours: number;
  sickLeaveHours: number;
  paidLeaveHours: number;
  rttLeaveHours: number;
  absenteeismRate: number;
  totalTrackedHours: number;
}
