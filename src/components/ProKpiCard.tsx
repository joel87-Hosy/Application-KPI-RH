import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { MetricDefinition, MetricRecord } from '../types/types';
import { formatDelta, formatMetricValue, getDeltaPercent, getHealthStatus, getTargetGap } from '../utils/kpi';

interface ProKpiCardProps {
  definition: MetricDefinition;
  record: MetricRecord;
  isSelected?: boolean;
  onClick?: () => void;
}

const statusStyles = {
  green: 'border-emerald-500/60 bg-emerald-500/[0.08]',
  orange: 'border-amber-500/70 bg-amber-500/[0.08]',
  red: 'border-red-500/70 bg-red-500/[0.08]',
};

const statusText = {
  green: 'Cible atteinte',
  orange: 'Sous cible',
  red: 'À risque',
};

export function ProKpiCard({ definition, record, isSelected = false, onClick }: ProKpiCardProps) {
  const status = getHealthStatus(definition, record);
  const delta = getDeltaPercent(record);
  const gap = getTargetGap(definition, record);
  const isPositiveEvolution = definition.isHigherBetter ? delta >= 0 : delta <= 0;
  const DeltaIcon = delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-400/70 sm:p-4 ${
        statusStyles[status]
      } ${isSelected ? 'ring-2 ring-sky-400/80' : 'hover:border-zinc-400/50'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{definition.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-zinc-500">{definition.code}</p>
        </div>
        <span className="shrink-0 rounded-md border border-zinc-700/80 bg-zinc-950/70 px-2 py-1 text-xs text-zinc-300">
          {statusText[status]}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-xl font-semibold text-white sm:text-2xl">{formatMetricValue(record.actual, definition)}</p>
          <p className="mt-1 text-xs text-zinc-400">Target {formatMetricValue(record.target, definition)}</p>
        </div>
        <div
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
            isPositiveEvolution ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
          }`}
        >
          <DeltaIcon size={14} />
          {formatDelta(delta)}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
        <span>Écart</span>
        <span className={gap >= 0 ? 'text-emerald-300' : 'text-red-300'}>{formatMetricValue(gap, definition)}</span>
      </div>
    </button>
  );
}
