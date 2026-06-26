import { FileSpreadsheet, Presentation } from 'lucide-react';
import { EmployeeAttendanceRecord, MetricWithRecord } from '../types/types';
import { exportReportToExcel, exportReportToPowerPoint } from '../utils/reportExport';

interface ReportExportButtonsProps {
  period: string;
  metrics: MetricWithRecord[];
  employeeAttendance: EmployeeAttendanceRecord[];
}

export function ReportExportButtons({ period, metrics, employeeAttendance }: ReportExportButtonsProps) {
  const hasReportData = metrics.some((item) => item.record.actual !== 0 || item.record.target !== 0) || employeeAttendance.length > 0;

  function exportExcel() {
    exportReportToExcel({ period, metrics, employeeAttendance });
  }

  function exportPowerPoint() {
    exportReportToPowerPoint({ period, metrics, employeeAttendance });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={exportExcel}
        disabled={!hasReportData}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-700/70 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-100 hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        title="Exporter le rapport Excel"
      >
        <FileSpreadsheet size={16} />
        <span className="hidden xl:inline">Excel</span>
      </button>
      <button
        type="button"
        onClick={exportPowerPoint}
        disabled={!hasReportData}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-orange-700/70 bg-orange-500/10 px-3 text-sm font-medium text-orange-100 hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        title="Exporter le rapport PowerPoint"
      >
        <Presentation size={16} />
        <span className="hidden xl:inline">PowerPoint</span>
      </button>
    </div>
  );
}
