export function formatMileage(km: number): string {
  return new Intl.NumberFormat('fr-FR').format(km) + ' km';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `il y a ${Math.abs(diffDays)} jours`;
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return 'demain';
  if (diffDays <= 30) return `dans ${diffDays} jours`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'dans 1 mois';
  if (diffMonths < 12) return `dans ${diffMonths} mois`;
  return `dans ${Math.floor(diffMonths / 12)} an(s)`;
}

export function formatPlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function computeAnnualMileage(mileageEntries: { value: number; date: string }[]): number {
  if (mileageEntries.length < 2) return 0;
  const sorted = [...mileageEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const diffYears = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (diffYears === 0) return 0;
  return Math.round((last.value - first.value) / diffYears);
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    oil_change: 'Vidange',
    tires: 'Pneus',
    brakes: 'Freins',
    technical_inspection: 'Contrôle technique',
    timing_belt: 'Courroie de distribution',
    air_filter: 'Filtre à air',
    battery: 'Batterie',
    coolant: 'Liquide de refroidissement',
    other: 'Autre',
    maintenance: 'Entretien',
    repair: 'Réparation',
    fuel: 'Carburant',
    insurance: 'Assurance',
    tax: 'Taxes',
  };
  return labels[category] || category;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    oil_change: 'water',
    tires: 'refresh-circle',
    brakes: 'stop-circle',
    technical_inspection: 'checkmark-circle',
    timing_belt: 'sync',
    air_filter: 'cloud',
    battery: 'battery-charging',
    coolant: 'thermometer',
    other: 'construct',
    maintenance: 'build',
    repair: 'hammer',
    fuel: 'flame',
    insurance: 'shield-checkmark',
    tax: 'document-text',
  };
  return icons[category] || 'document';
}
