import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MetricWithRecord } from '../types/types';
import { computeHealthScore, formatMetricValue, getHealthLabel } from '../utils/kpi';
import { metricDefinitions, revenueHistory } from '../data/mockData';
import { ProKpiCard } from './ProKpiCard';

interface ExecutiveViewProps {
  items: MetricWithRecord[];
}

const pinnedMetricIds = ['cash-flow', 'turnover', 'arr', 'oee', 'uptime-sla', 'csat'];

export function ExecutiveView({ items }: ExecutiveViewProps) {
  const score = computeHealthScore(items);
  const pinnedItems = pinnedMetricIds
    .map((id) => items.find((item) => item.definition.id === id))
    .filter((item): item is MetricWithRecord => Boolean(item));
  const revenueDefinition = metricDefinitions.find((metric) => metric.id === 'arr') ?? metricDefinitions[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm font-medium text-zinc-400">Santé globale</p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-5xl font-semibold text-white">{score}</span>
            <span className="pb-2 text-sm text-zinc-500">/ 115</span>
          </div>
          <p className="mt-3 text-lg font-medium text-zinc-100">{getHealthLabel(score)}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Score consolidé sur les métriques actives, plafonné pour éviter qu’un domaine masque les signaux faibles.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Revenu vs Objectif</h2>
              <p className="text-sm text-zinc-500">12 derniers mois</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueHistory}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => formatMetricValue(value, revenueDefinition)} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }}
                  formatter={(value: number) => formatMetricValue(value, revenueDefinition)}
                />
                <Bar dataKey="actual" name="Revenu" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="target" name="Objectif" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Pinned KPIs</h2>
          <span className="text-xs text-zinc-500">6 domaines stratégiques</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pinnedItems.map((item) => (
            <ProKpiCard key={item.definition.id} definition={item.definition} record={item.record} />
          ))}
        </div>
      </section>
    </div>
  );
}
