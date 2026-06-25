import { Domain, MetricDefinition, MetricRecord, Period } from '../types/types';

export const periods: Period[] = ['Q1 2026', 'Q2 2026', 'Année Glissante'];

export const domains: Domain[] = [
  { id: 'finance', name: 'Finance', slug: 'finance', icon: 'Landmark', description: 'Pilotage des marges, liquidités, rentabilité et cycles de trésorerie.' },
  { id: 'rh', name: 'RH', slug: 'rh', icon: 'Users', description: 'Suivi de l’engagement, de la stabilité sociale et de la disponibilité des équipes.' },
  { id: 'commercial', name: 'Commercial', slug: 'commercial', icon: 'BriefcaseBusiness', description: 'Mesure de la croissance, du coût d’acquisition et de l’efficacité commerciale.' },
  { id: 'production', name: 'Production', slug: 'production', icon: 'Factory', description: 'Supervision de la performance industrielle, fiabilité machine et rendement.' },
  { id: 'supply-chain', name: 'Supply Chain', slug: 'supply-chain', icon: 'Truck', description: 'Contrôle de la livraison, du stock et de la fluidité opérationnelle.' },
  { id: 'it-cloud', name: 'IT & Cloud', slug: 'it-cloud', icon: 'CloudCog', description: 'Disponibilité des plateformes, qualité des déploiements et continuité digitale.' },
  { id: 'marketing', name: 'Marketing', slug: 'marketing', icon: 'Megaphone', description: 'Lecture du rendement média, de la génération de leads et du coût d’acquisition.' },
  { id: 'service-client', name: 'Service Client', slug: 'service-client', icon: 'Headphones', description: 'Évaluation de la satisfaction, recommandation et qualité du support.' },
  { id: 'gestion-projet', name: 'Gestion de Projet', slug: 'gestion-projet', icon: 'KanbanSquare', description: 'Suivi des écarts délais, coûts et exécution des programmes stratégiques.' },
  { id: 'qualite', name: 'Qualité', slug: 'qualite', icon: 'ShieldCheck', description: 'Détection des rebuts, non-conformités et risques de qualité opérationnelle.' },
  { id: 'rse', name: 'RSE', slug: 'rse', icon: 'Leaf', description: 'Trajectoire carbone, inclusion et indicateurs ESG prioritaires.' },
  { id: 'immobilier', name: 'Immobilier', slug: 'immobilier', icon: 'Building2', description: 'Occupation des surfaces, efficacité immobilière et optimisation des actifs.' },
];

export const metricDefinitions: MetricDefinition[] = [
  { id: 'cash-flow', domainId: 'finance', code: 'FIN-CF', name: 'Cash-Flow Opérationnel', unit: 'FCFA', formatType: 'currency', isHigherBetter: true },
  { id: 'bfr', domainId: 'finance', code: 'FIN-BFR', name: 'Besoin en Fonds de Roulement', unit: 'FCFA', formatType: 'currency', isHigherBetter: false },
  { id: 'ebitda', domainId: 'finance', code: 'FIN-EBITDA', name: 'EBITDA', unit: 'FCFA', formatType: 'currency', isHigherBetter: true },
  { id: 'turnover', domainId: 'rh', code: 'RH-TURN', name: 'Turnover', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'enps', domainId: 'rh', code: 'RH-ENPS', name: 'Employee NPS', unit: 'pts', formatType: 'number', isHigherBetter: true },
  { id: 'absenteisme', domainId: 'rh', code: 'RH-ABS', name: 'Absentéisme', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'permissions', domainId: 'rh', code: 'RH-PERM', name: 'Permissions', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'arret-maladie', domainId: 'rh', code: 'RH-AM', name: 'Arrets maladie', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'arr', domainId: 'commercial', code: 'COM-ARR', name: 'ARR', unit: 'FCFA', formatType: 'currency', isHigherBetter: true },
  { id: 'cac', domainId: 'commercial', code: 'COM-CAC', name: 'CAC', unit: 'FCFA', formatType: 'currency', isHigherBetter: false },
  { id: 'win-rate', domainId: 'commercial', code: 'COM-WIN', name: 'Win-Rate', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'oee', domainId: 'production', code: 'PROD-OEE', name: 'TRS / OEE', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'mtbf', domainId: 'production', code: 'PROD-MTBF', name: 'MTBF', unit: 'h', formatType: 'time', isHigherBetter: true },
  { id: 'scrap-prod', domainId: 'production', code: 'PROD-SCRAP', name: 'Pertes de Production', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'otif', domainId: 'supply-chain', code: 'SC-OTIF', name: 'OTIF', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'stock-rotation', domainId: 'supply-chain', code: 'SC-ROT', name: 'Rotation Stock', unit: 'x', formatType: 'number', isHigherBetter: true },
  { id: 'backorder', domainId: 'supply-chain', code: 'SC-BO', name: 'Backorders', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'uptime-sla', domainId: 'it-cloud', code: 'IT-SLA', name: 'Uptime SLA', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'build-fail', domainId: 'it-cloud', code: 'IT-BUILD', name: 'Taux d’échec de build', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'cloud-cost', domainId: 'it-cloud', code: 'IT-COST', name: 'Coût Cloud Mensuel', unit: 'FCFA', formatType: 'currency', isHigherBetter: false },
  { id: 'roas', domainId: 'marketing', code: 'MKT-ROAS', name: 'ROAS', unit: 'x', formatType: 'number', isHigherBetter: true },
  { id: 'cpl', domainId: 'marketing', code: 'MKT-CPL', name: 'Coût par Lead', unit: 'FCFA', formatType: 'currency', isHigherBetter: false },
  { id: 'mql-rate', domainId: 'marketing', code: 'MKT-MQL', name: 'Taux MQL', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'csat', domainId: 'service-client', code: 'CX-CSAT', name: 'CSAT', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'nps', domainId: 'service-client', code: 'CX-NPS', name: 'NPS Client', unit: 'pts', formatType: 'number', isHigherBetter: true },
  { id: 'first-response', domainId: 'service-client', code: 'CX-FRT', name: 'Temps de 1ère réponse', unit: 'min', formatType: 'time', isHigherBetter: false },
  { id: 'spi', domainId: 'gestion-projet', code: 'PM-SPI', name: 'Schedule Performance Index', unit: 'idx', formatType: 'number', isHigherBetter: true },
  { id: 'cpi', domainId: 'gestion-projet', code: 'PM-CPI', name: 'Cost Performance Index', unit: 'idx', formatType: 'number', isHigherBetter: true },
  { id: 'late-milestones', domainId: 'gestion-projet', code: 'PM-LATE', name: 'Jalons en retard', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'scrap-rate', domainId: 'qualite', code: 'QA-SCRAP', name: 'Taux de rebut', unit: '%', formatType: 'percentage', isHigherBetter: false },
  { id: 'nonconformities', domainId: 'qualite', code: 'QA-NC', name: 'Non-conformités', unit: 'cas', formatType: 'number', isHigherBetter: false },
  { id: 'audit-score', domainId: 'qualite', code: 'QA-AUDIT', name: 'Score Audit Qualité', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'carbon-t1', domainId: 'rse', code: 'ESG-CO2-T1', name: 'Bilan Carbone T1', unit: 'tCO2e', formatType: 'number', isHigherBetter: false },
  { id: 'parity-index', domainId: 'rse', code: 'ESG-PAR', name: 'Index Parité', unit: 'pts', formatType: 'number', isHigherBetter: true },
  { id: 'renewable-share', domainId: 'rse', code: 'ESG-REN', name: 'Énergie Renouvelable', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'occupancy', domainId: 'immobilier', code: 'RE-OCC', name: 'Taux occupation m²', unit: '%', formatType: 'percentage', isHigherBetter: true },
  { id: 'cost-sqm', domainId: 'immobilier', code: 'RE-COST', name: 'Coût par m²', unit: 'FCFA', formatType: 'currency', isHigherBetter: false },
  { id: 'vacancy', domainId: 'immobilier', code: 'RE-VAC', name: 'Vacance Locative', unit: '%', formatType: 'percentage', isHigherBetter: false },
];

export const metricRecords: MetricRecord[] = periods.flatMap((period) =>
  metricDefinitions.map((metric) => ({
    id: `${metric.id}-${period.toLowerCase().replace(/\s/g, '-')}`,
    metricId: metric.id,
    period,
    actual: 0,
    target: 0,
    previousPeriodActual: 0,
  })),
);

export const revenueHistory = [
  { month: 'Juil.', actual: 0, target: 0 },
  { month: 'Août', actual: 0, target: 0 },
  { month: 'Sept.', actual: 0, target: 0 },
  { month: 'Oct.', actual: 0, target: 0 },
  { month: 'Nov.', actual: 0, target: 0 },
  { month: 'Déc.', actual: 0, target: 0 },
  { month: 'Janv.', actual: 0, target: 0 },
  { month: 'Févr.', actual: 0, target: 0 },
  { month: 'Mars', actual: 0, target: 0 },
  { month: 'Avr.', actual: 0, target: 0 },
  { month: 'Mai', actual: 0, target: 0 },
  { month: 'Juin', actual: 0, target: 0 },
];

export function getMetricHistory(metricId: string) {
  const definition = metricDefinitions.find((metric) => metric.id === metricId);
  if (!definition) return [];

  return ['P-5', 'P-4', 'P-3', 'P-2', 'P-1', 'P'].map((period) => ({
    period,
    actual: 0,
    target: 0,
  }));
}
