import { MetricDefinition, MetricRecord } from '../types/types';

export type HealthStatus = 'green' | 'orange' | 'red';

export function getAchievement(definition: MetricDefinition, record: MetricRecord) {
  if (record.target === 0) return 0;
  return definition.isHigherBetter ? record.actual / record.target : record.target / record.actual;
}

export function getHealthStatus(definition: MetricDefinition, record: MetricRecord): HealthStatus {
  const achievement = getAchievement(definition, record);
  if (achievement >= 1) return 'green';
  if (achievement >= 0.9) return 'orange';
  return 'red';
}

export function getDeltaPercent(record: MetricRecord) {
  if (record.previousPeriodActual === 0) return 0;
  return ((record.actual - record.previousPeriodActual) / Math.abs(record.previousPeriodActual)) * 100;
}

export function getTargetGap(definition: MetricDefinition, record: MetricRecord) {
  return definition.isHigherBetter ? record.actual - record.target : record.target - record.actual;
}

export function formatMetricValue(value: number, definition: MetricDefinition) {
  const locale = 'fr-FR';
  if (definition.formatType === 'currency') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'XOF',
      notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 1,
    }).format(value);
  }

  if (definition.formatType === 'percentage') {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      maximumFractionDigits: value < 0.1 ? 1 : 0,
    }).format(value);
  }

  if (definition.formatType === 'time') {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${definition.unit}`;
  }

  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${definition.unit}`;
}

export function formatDelta(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)}%`;
}

export function computeHealthScore(items: Array<{ definition: MetricDefinition; record: MetricRecord }>) {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + Math.min(getAchievement(item.definition, item.record), 1.15), 0);
  return Math.round((total / items.length) * 100);
}

export function getHealthLabel(score: number) {
  if (score >= 100) return 'Entreprise saine';
  if (score >= 92) return 'Sous contrôle';
  return 'Attention requise';
}
