import { ChangeEvent, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { metricDefinitions } from '../data/mockData';
import { EmployeeAttendanceRecord, MetricRecord } from '../types/types';
import { parseMetricFile } from '../utils/importMetrics';

interface MetricImportButtonProps {
  records: MetricRecord[];
  onImport: (records: MetricRecord[], periods: string[], message: string, employeeAttendance?: EmployeeAttendanceRecord[]) => void;
}

export function MetricImportButton({ records, onImport }: MetricImportButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await parseMetricFile(file, metricDefinitions);
      if (result.records.length === 0) {
        onImport(records, [], 'Aucune ligne valide importee.');
        return;
      }

      const importedRecordMap = new Map(result.records.map((record) => [`${record.metricId}:${record.period}`, record]));
      const nextRecords = result.periods.flatMap((period) =>
        metricDefinitions.map((definition) => {
          const imported = importedRecordMap.get(`${definition.id}:${period}`);
          return (
            imported ?? {
              id: `empty-${definition.id}-${period}`,
              metricId: definition.id,
              period,
              actual: 0,
              target: 0,
              previousPeriodActual: 0,
            }
          );
        }),
      );
      const skipped = result.skippedRows > 0 ? `, ${result.skippedRows} ignoree(s)` : '';
      onImport(nextRecords, result.periods, `${result.records.length} ligne(s) importee(s)${skipped}`, result.employeeAttendance);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import impossible.';
      onImport(records, [], message);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 hover:border-sky-400 disabled:cursor-wait disabled:opacity-60"
      >
        <Upload size={16} />
        <span className="hidden md:inline">{isLoading ? 'Import...' : 'Importer'}</span>
      </button>
    </>
  );
}
