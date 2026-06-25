import { useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  CloudCog,
  Factory,
  Gauge,
  Headphones,
  KanbanSquare,
  Landmark,
  Leaf,
  LucideIcon,
  Megaphone,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { domains, metricDefinitions, metricRecords, periods } from '../data/mockData';
import { Domain, EmployeeAttendanceRecord, MetricWithRecord, Period } from '../types/types';
import { computeHealthScore, getHealthLabel } from '../utils/kpi';
import { DomainView } from './DomainView';
import { ExecutiveView } from './ExecutiveView';
import { MetricImportButton } from './MetricImportButton';

const iconMap: Record<string, LucideIcon> = {
  Landmark,
  Users,
  BriefcaseBusiness,
  Factory,
  Truck,
  CloudCog,
  Megaphone,
  Headphones,
  KanbanSquare,
  ShieldCheck,
  Leaf,
  Building2,
};

function buildMetricItems(period: Period, records: typeof metricRecords): MetricWithRecord[] {
  return metricDefinitions
    .map((definition) => {
      const record = records.find((item) => item.metricId === definition.id && item.period === period);
      return record ? { definition, record } : null;
    })
    .filter((item): item is MetricWithRecord => Boolean(item));
}

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSlug, setActiveSlug] = useState<'executive' | string>('executive');
  const [period, setPeriod] = useState<Period>('Q2 2026');
  const [records, setRecords] = useState(metricRecords);
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>(periods);
  const [importMessage, setImportMessage] = useState('');
  const [employeeAttendance, setEmployeeAttendance] = useState<EmployeeAttendanceRecord[]>([]);

  const metricItems = useMemo(() => buildMetricItems(period, records), [period, records]);
  const activeDomain = domains.find((domain) => domain.slug === activeSlug);
  const activeDomainItems = activeDomain
    ? metricItems.filter((item) => item.definition.domainId === activeDomain.id)
    : [];
  const healthScore = computeHealthScore(metricItems);
  const healthTone = healthScore >= 100 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' : healthScore >= 92 ? 'border-amber-500/50 bg-amber-500/10 text-amber-200' : 'border-red-500/50 bg-red-500/10 text-red-200';

  function handleImport(nextRecords: typeof metricRecords, importedPeriods: string[], message: string, importedEmployeeAttendance?: EmployeeAttendanceRecord[]) {
    setRecords(nextRecords);
    setImportMessage(message);
    if (importedEmployeeAttendance) {
      setEmployeeAttendance(importedEmployeeAttendance);
    }
    if (importedPeriods.length > 0) {
      setAvailablePeriods((current) => Array.from(new Set([...current, ...importedPeriods])));
      setPeriod(importedPeriods[0]);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 border-r border-zinc-800 bg-zinc-950 transition-all duration-200 ${
          isCollapsed ? 'w-[76px]' : 'w-72'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
          <button
            type="button"
            onClick={() => setActiveSlug('executive')}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Nexus-KPI Enterprise"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-500 text-sm font-bold text-zinc-950">
              NX
            </span>
            {!isCollapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">Nexus-KPI</span>
                <span className="block truncate text-xs text-zinc-500">Enterprise Hypervisor</span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
            aria-label={isCollapsed ? 'Étendre la navigation' : 'Rétracter la navigation'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="space-y-2 px-3 py-4">
          <button
            type="button"
            onClick={() => setActiveSlug('executive')}
            className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
              activeSlug === 'executive' ? 'bg-sky-500 text-zinc-950' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Gauge size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Vue Executive</span>}
          </button>

          <div className="my-3 border-t border-zinc-800" />

          {domains.map((domain: Domain) => {
            const Icon = iconMap[domain.icon] ?? Gauge;
            const isActive = activeSlug === domain.slug;
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => setActiveSlug(domain.slug)}
                className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
                title={isCollapsed ? domain.name : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{domain.name}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className={`min-h-screen transition-all duration-200 ${isCollapsed ? 'pl-[76px]' : 'pl-72'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/95 px-6 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-sm text-zinc-500">Nexus-KPI Enterprise</p>
            <h1 className="truncate text-lg font-semibold text-white">{activeDomain?.name ?? 'Vue Executive'}</h1>
          </div>

          <div className="flex items-center gap-3">
            {importMessage && (
              <span className="hidden max-w-64 truncate text-xs text-zinc-400 lg:inline">{importMessage}</span>
            )}
            <MetricImportButton records={records} onImport={handleImport} />
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
              className="h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-sky-400"
              aria-label="Période"
            >
              {availablePeriods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <span className={`hidden rounded-md border px-3 py-2 text-sm font-medium sm:inline-flex ${healthTone}`}>
              {getHealthLabel(healthScore)} · {healthScore}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-6 py-6">
          {activeDomain ? (
            <DomainView
              key={`${activeDomain.id}-${period}`}
              domain={activeDomain}
              items={activeDomainItems}
              period={period}
              employeeAttendance={employeeAttendance}
            />
          ) : (
            <ExecutiveView items={metricItems} />
          )}
        </main>
      </div>
    </div>
  );
}
