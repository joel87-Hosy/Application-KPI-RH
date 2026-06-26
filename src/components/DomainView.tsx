import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Domain, EmployeeAttendanceRecord, MetricWithRecord } from '../types/types';
import { getMetricHistory } from '../data/mockData';
import { formatMetricValue } from '../utils/kpi';
import { ProKpiCard } from './ProKpiCard';

interface DomainViewProps {
  domain: Domain;
  items: MetricWithRecord[];
  period: string;
  employeeAttendance: EmployeeAttendanceRecord[];
}

function formatHours(value: number) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)} h`;
}

function formatDaysFromHours(value: number) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value / 8)} j`;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

function EmployeeAttendanceSection({ rows, period }: { rows: EmployeeAttendanceRecord[]; period: string }) {
  const topAbsences = useMemo(
    () => [...rows].sort((a, b) => b.absenceHours - a.absenceHours).slice(0, 10),
    [rows],
  );
  const presenceRows = useMemo(
    () => [...rows].sort((a, b) => b.presenceHours - a.presenceHours || a.name.localeCompare(b.name)),
    [rows],
  );
  const sickLeaveRows = useMemo(
    () => rows.filter((employee) => employee.sickLeaveHours > 0).sort((a, b) => b.sickLeaveHours - a.sickLeaveHours || a.name.localeCompare(b.name)),
    [rows],
  );
  const absentRows = useMemo(
    () => rows.filter((employee) => employee.absentHours > 0).sort((a, b) => b.absentHours - a.absentHours || a.name.localeCompare(b.name)),
    [rows],
  );
  const monthTotals = useMemo(
    () =>
      rows.reduce(
        (sum, employee) => ({
          presenceHours: sum.presenceHours + employee.presenceHours,
          sickLeaveHours: sum.sickLeaveHours + employee.sickLeaveHours,
          permissionHours: sum.permissionHours + employee.permissionHours,
        }),
        { presenceHours: 0, sickLeaveHours: 0, permissionHours: 0 },
      ),
    [rows],
  );
  const distributionData = useMemo(
    () => [
      { name: 'Presence', value: monthTotals.presenceHours, color: '#34d399' },
      { name: 'Arret maladie', value: monthTotals.sickLeaveHours, color: '#f59e0b' },
      { name: 'Permission', value: monthTotals.permissionHours, color: '#38bdf8' },
      { name: 'Absence', value: absentRows.reduce((sum, employee) => sum + employee.absentHours, 0), color: '#f87171' },
    ].filter((item) => item.value > 0),
    [absentRows, monthTotals],
  );
  const monthlyBarData = useMemo(
    () => [
      { label: 'Presence', heures: monthTotals.presenceHours, jours: monthTotals.presenceHours / 8 },
      { label: 'Arret maladie', heures: monthTotals.sickLeaveHours, jours: monthTotals.sickLeaveHours / 8 },
      { label: 'Permissions', heures: monthTotals.permissionHours, jours: monthTotals.permissionHours / 8 },
      { label: 'Absences', heures: absentRows.reduce((sum, employee) => sum + employee.absentHours, 0), jours: absentRows.reduce((sum, employee) => sum + employee.absentHours, 0) / 8 },
    ],
    [absentRows, monthTotals],
  );
  const topAbsenceChartData = useMemo(
    () =>
      topAbsences
        .filter((employee) => employee.absenceHours > 0)
        .slice(0, 8)
        .map((employee) => ({
          name: employee.name.length > 18 ? `${employee.name.slice(0, 18)}...` : employee.name,
          heures: employee.absenceHours,
          jours: employee.absenceHours / 8,
        }))
        .reverse(),
    [topAbsences],
  );
  const sickLeaveChartData = useMemo(
    () =>
      sickLeaveRows
        .slice(0, 8)
        .map((employee) => ({
          name: employee.name.length > 18 ? `${employee.name.slice(0, 18)}...` : employee.name,
          jours: employee.sickLeaveHours / 8,
        }))
        .reverse(),
    [sickLeaveRows],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-semibold text-white">Suivi par employe</h2>
          <p className="text-sm text-zinc-500">Absenteisme et heures de presence pour {period}</p>
        </div>
        <span className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
          {rows.length} employe(s)
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">
          Importez le fichier RH pour afficher les absences et presences par employe.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Synthese du mois</h3>
              <p className="text-xs text-zinc-500">Totaux de la periode selectionnee</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Periode</th>
                    <th className="px-4 py-3 font-medium">Total heures presence</th>
                    <th className="px-4 py-3 font-medium">Total jours arret maladie</th>
                    <th className="px-4 py-3 font-medium">Total jours permissions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-zinc-800 text-zinc-200">
                    <td className="px-4 py-3 font-medium text-white">{period}</td>
                    <td className="px-4 py-3 text-emerald-200">{formatHours(monthTotals.presenceHours)}</td>
                    <td className="px-4 py-3 text-amber-200">{formatDaysFromHours(monthTotals.sickLeaveHours)}</td>
                    <td className="px-4 py-3 text-sky-200">{formatDaysFromHours(monthTotals.permissionHours)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">Repartition globale</h3>
                <p className="text-xs text-zinc-500">Presence, absences, arrets et permissions</p>
              </div>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2}>
                      {distributionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatHours(value)} contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#d4d4d8', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">Totaux de la periode</h3>
                <p className="text-xs text-zinc-500">Comparaison en heures</p>
              </div>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => formatHours(value)} contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="heures" name="Heures" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:p-4 lg:col-span-2 2xl:col-span-1">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">Top absences</h3>
                <p className="text-xs text-zinc-500">Absence + arret maladie, en jours</p>
              </div>
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAbsenceChartData} layout="vertical" margin={{ left: 18 }}>
                    <CartesianGrid stroke="#27272a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={118} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => formatDaysFromHours(value * 8)} contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="jours" name="Jours" fill="#f87171" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {sickLeaveChartData.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">Arrets maladie par agent</h3>
                <p className="text-xs text-zinc-500">Classement des agents concernes, en jours</p>
              </div>
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sickLeaveChartData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid stroke="#27272a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={128} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)} j`} contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="jours" name="Jours arret maladie" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="border-b border-zinc-800 px-4 py-3">
                <h3 className="text-sm font-semibold text-white">Agents en arret maladie</h3>
                <p className="text-xs text-zinc-500">Nombre de jours par agent</p>
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-950 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Agent</th>
                      <th className="px-4 py-3 font-medium">Fonction</th>
                      <th className="px-4 py-3 font-medium">Jours</th>
                      <th className="px-4 py-3 font-medium">Heures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {sickLeaveRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-5 text-sm text-zinc-500">Aucun arret maladie sur cette periode.</td>
                      </tr>
                    ) : (
                      sickLeaveRows.map((employee) => (
                        <tr key={employee.id} className="text-zinc-200">
                          <td className="px-4 py-3 font-medium text-white">{employee.name}</td>
                          <td className="px-4 py-3 text-zinc-400">{employee.role}</td>
                          <td className="px-4 py-3 text-amber-200">{formatDaysFromHours(employee.sickLeaveHours)}</td>
                          <td className="px-4 py-3">{formatHours(employee.sickLeaveHours)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="border-b border-zinc-800 px-4 py-3">
                <h3 className="text-sm font-semibold text-white">Agents absents</h3>
                <p className="text-xs text-zinc-500">Absences hors arret maladie</p>
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-950 text-xs uppercase text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Agent</th>
                      <th className="px-4 py-3 font-medium">Fonction</th>
                      <th className="px-4 py-3 font-medium">Jours</th>
                      <th className="px-4 py-3 font-medium">Heures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {absentRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-5 text-sm text-zinc-500">Aucune absence sur cette periode.</td>
                      </tr>
                    ) : (
                      absentRows.map((employee) => (
                        <tr key={employee.id} className="text-zinc-200">
                          <td className="px-4 py-3 font-medium text-white">{employee.name}</td>
                          <td className="px-4 py-3 text-zinc-400">{employee.role}</td>
                          <td className="px-4 py-3 text-red-200">{formatDaysFromHours(employee.absentHours)}</td>
                          <td className="px-4 py-3">{formatHours(employee.absentHours)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {absentRows.length > 0 && (
                    <tfoot className="border-t border-zinc-700 text-sm font-semibold text-white">
                      <tr>
                        <td className="px-4 py-3" colSpan={2}>Total</td>
                        <td className="px-4 py-3 text-red-200">{formatDaysFromHours(absentRows.reduce((sum, employee) => sum + employee.absentHours, 0))}</td>
                        <td className="px-4 py-3">{formatHours(absentRows.reduce((sum, employee) => sum + employee.absentHours, 0))}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Top 10 heures d'absence</h3>
              <p className="text-xs text-zinc-500">Absence + arret maladie</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Employe</th>
                    <th className="px-4 py-3 font-medium">Absence</th>
                    <th className="px-4 py-3 font-medium">Taux</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {topAbsences.map((employee, index) => (
                    <tr key={employee.id} className="text-zinc-200">
                      <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span className="block font-medium text-white">{employee.name}</span>
                        <span className="block text-xs text-zinc-500">{employee.role}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-red-200">{formatHours(employee.absenceHours)}</td>
                      <td className="px-4 py-3">{formatPercent(employee.absenteeismRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Total heures de presence</h3>
              <p className="text-xs text-zinc-500">Tous les employes de la periode selectionnee</p>
            </div>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="sticky top-0 bg-zinc-950 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Employe</th>
                    <th className="px-4 py-3 font-medium">Fonction</th>
                    <th className="px-4 py-3 font-medium">Presence</th>
                    <th className="px-4 py-3 font-medium">Absence</th>
                    <th className="px-4 py-3 font-medium">Permission</th>
                    <th className="px-4 py-3 font-medium">Taux abs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {presenceRows.map((employee) => (
                    <tr key={employee.id} className="text-zinc-200">
                      <td className="px-4 py-3 font-medium text-white">{employee.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{employee.role}</td>
                      <td className="px-4 py-3 text-emerald-200">{formatHours(employee.presenceHours)}</td>
                      <td className="px-4 py-3">{formatHours(employee.absenceHours)}</td>
                      <td className="px-4 py-3">{formatHours(employee.permissionHours)}</td>
                      <td className="px-4 py-3">{formatPercent(employee.absenteeismRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function DomainView({ domain, items, period, employeeAttendance }: DomainViewProps) {
  const [selectedMetricId, setSelectedMetricId] = useState(items[0]?.definition.id ?? '');
  const selectedItem = items.find((item) => item.definition.id === selectedMetricId) ?? items[0];
  const history = useMemo(() => getMetricHistory(selectedItem?.definition.id ?? ''), [selectedItem?.definition.id]);
  const employeeRows = useMemo(
    () => employeeAttendance.filter((employee) => employee.period === period),
    [employeeAttendance, period],
  );

  return (
    <div className="space-y-6">
      <section className="border-b border-zinc-800 pb-5">
        <p className="text-sm font-semibold uppercase tracking-normal text-sky-300">Vue Domaine</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{domain.name}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{domain.description}</p>
      </section>

      <section className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ProKpiCard
            key={item.definition.id}
            definition={item.definition}
            record={item.record}
            isSelected={selectedItem?.definition.id === item.definition.id}
            onClick={() => setSelectedMetricId(item.definition.id)}
          />
        ))}
      </section>

      {domain.id === 'rh' && <EmployeeAttendanceSection rows={employeeRows} period={period} />}

      {selectedItem && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">{selectedItem.definition.name}</h2>
              <p className="text-sm text-zinc-500">Historique détaillé sur 6 périodes</p>
            </div>
            <span className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">{selectedItem.definition.code}</span>
          </div>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="metricActual" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="period" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => formatMetricValue(Number(value), selectedItem.definition)} />
                <Tooltip
                  contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fff' }}
                  formatter={(value: number) => formatMetricValue(value, selectedItem.definition)}
                />
                <Area type="monotone" dataKey="actual" name="Réel" stroke="#38bdf8" strokeWidth={2.5} fill="url(#metricActual)" />
                <Area type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
