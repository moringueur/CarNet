import { MaintenanceCategory } from '../types';

export interface MaintenanceScheduleItem {
  title: string;
  category: MaintenanceCategory;
  intervalKm?: number;
  intervalMonths?: number;
  description?: string;
}

export interface ManufacturerSchedule {
  brand: string;
  fuelType?: string;
  items: MaintenanceScheduleItem[];
}

// Common maintenance schedule applicable to most vehicles
const COMMON_SCHEDULE: MaintenanceScheduleItem[] = [
  {
    title: 'Vidange moteur + filtre à huile',
    category: 'oil_change',
    intervalKm: 15000,
    intervalMonths: 12,
    description: 'Remplacement de l\'huile moteur et du filtre à huile',
  },
  {
    title: 'Contrôle technique',
    category: 'technical_inspection',
    intervalMonths: 24,
    description: 'Contrôle technique obligatoire tous les 2 ans',
  },
  {
    title: 'Remplacement plaquettes de frein avant',
    category: 'brakes',
    intervalKm: 30000,
    description: 'Vérification et remplacement si nécessaire',
  },
  {
    title: 'Remplacement filtre à air',
    category: 'air_filter',
    intervalKm: 30000,
    intervalMonths: 24,
    description: 'Remplacement du filtre à air moteur',
  },
  {
    title: 'Remplacement filtre habitacle',
    category: 'air_filter',
    intervalKm: 15000,
    intervalMonths: 12,
    description: 'Remplacement du filtre d\'habitacle (pollen)',
  },
  {
    title: 'Vérification batterie',
    category: 'battery',
    intervalMonths: 24,
    description: 'Test de charge et vérification état batterie',
  },
  {
    title: 'Liquide de refroidissement',
    category: 'coolant',
    intervalKm: 60000,
    intervalMonths: 48,
    description: 'Remplacement du liquide de refroidissement',
  },
  {
    title: 'Rotation/Permutation des pneus',
    category: 'tires',
    intervalKm: 10000,
    description: 'Permutation et vérification usure des pneus',
  },
];

// Manufacturer-specific schedules
const MANUFACTURER_SCHEDULES: ManufacturerSchedule[] = [
  // PEUGEOT
  {
    brand: 'Peugeot',
    fuelType: 'Diesel',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 20000, intervalMonths: 12, description: 'Huile 0W-30 ou 5W-30 selon motorisation' },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à carburant', category: 'other', intervalKm: 60000, description: 'Remplacement filtre à gasoil' },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 40000, intervalMonths: 24 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 20000, intervalMonths: 12 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 30000 },
      { title: 'Plaquettes de frein arrière', category: 'brakes', intervalKm: 60000 },
      { title: 'Disques de frein avant', category: 'brakes', intervalKm: 60000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 180000, intervalMonths: 120, description: 'Remplacement impératif selon préconisation constructeur' },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24, description: 'Purge et remplacement liquide de frein' },
      { title: 'Liquide de refroidissement', category: 'coolant', intervalKm: 120000, intervalMonths: 60 },
      { title: 'Bougies de préchauffage', category: 'other', intervalKm: 120000, description: 'Remplacement bougies de préchauffage (diesel)' },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
      { title: 'Pneus (vérification usure)', category: 'tires', intervalKm: 15000 },
    ],
  },
  {
    brand: 'Peugeot',
    fuelType: 'Essence',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12, description: 'Huile 0W-30 ou 5W-30' },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000, intervalMonths: 24 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Bougies d\'allumage', category: 'other', intervalKm: 60000, description: 'Remplacement bougies d\'allumage' },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 30000 },
      { title: 'Plaquettes de frein arrière', category: 'brakes', intervalKm: 60000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 120000, intervalMonths: 120, description: 'Remplacement courroie de distribution + pompe à eau' },
      { title: 'Courroie d\'accessoires', category: 'other', intervalKm: 80000, description: 'Remplacement courroie d\'accessoires' },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Liquide de refroidissement', category: 'coolant', intervalKm: 120000, intervalMonths: 60 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
      { title: 'Pneus (vérification usure)', category: 'tires', intervalKm: 15000 },
    ],
  },

  // RENAULT
  {
    brand: 'Renault',
    fuelType: 'Diesel',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 20000, intervalMonths: 12, description: 'Huile RN0720 ou RN17' },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à gasoil', category: 'other', intervalKm: 60000 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 45000, intervalMonths: 36 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 160000, intervalMonths: 96, description: 'Remplacement avec pompe à eau recommandé' },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Liquide de refroidissement', category: 'coolant', intervalKm: 90000, intervalMonths: 60 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
      { title: 'Pneus (vérification usure)', category: 'tires', intervalKm: 15000 },
    ],
  },
  {
    brand: 'Renault',
    fuelType: 'Essence',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000, intervalMonths: 24 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Bougies d\'allumage', category: 'other', intervalKm: 30000 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 120000, intervalMonths: 72 },
      { title: 'Courroie d\'accessoires', category: 'other', intervalKm: 80000 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
      { title: 'Pneus (vérification usure)', category: 'tires', intervalKm: 15000 },
    ],
  },

  // CITROËN
  {
    brand: 'Citroën',
    fuelType: 'Diesel',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 20000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à gasoil', category: 'other', intervalKm: 60000 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 40000, intervalMonths: 24 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 20000, intervalMonths: 12 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 180000, intervalMonths: 120 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Liquide de refroidissement', category: 'coolant', intervalKm: 120000, intervalMonths: 60 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
    ],
  },
  {
    brand: 'Citroën',
    fuelType: 'Essence',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000, intervalMonths: 24 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Bougies d\'allumage', category: 'other', intervalKm: 60000 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 120000, intervalMonths: 120 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
    ],
  },

  // VOLKSWAGEN
  {
    brand: 'Volkswagen',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12, description: 'Service Oil / Longlife selon véhicule' },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 40000, intervalMonths: 48 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 20000, intervalMonths: 24 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 30000 },
      { title: 'Plaquettes de frein arrière', category: 'brakes', intervalKm: 50000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 150000, intervalMonths: 96 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Bougies d\'allumage', category: 'other', intervalKm: 60000 },
      { title: 'Liquide de refroidissement', category: 'coolant', intervalKm: 120000, intervalMonths: 60 },
      { title: 'Batterie', category: 'battery', intervalMonths: 60 },
    ],
  },

  // BMW
  {
    brand: 'BMW',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 20000, intervalMonths: 24, description: 'Huile BMW Longlife-01 ou Longlife-04' },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 40000, intervalMonths: 48 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 20000, intervalMonths: 24 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 40000 },
      { title: 'Plaquettes de frein arrière', category: 'brakes', intervalKm: 60000 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Bougies d\'allumage', category: 'other', intervalKm: 60000 },
      { title: 'Batterie', category: 'battery', intervalMonths: 60 },
    ],
  },

  // MERCEDES
  {
    brand: 'Mercedes',
    items: [
      { title: 'Service A - Vidange + filtres', category: 'oil_change', intervalKm: 25000, intervalMonths: 12, description: 'Service A Mercedes-Benz' },
      { title: 'Service B - Révision complète', category: 'other', intervalKm: 25000, intervalMonths: 24, description: 'Service B Mercedes-Benz (en alternance avec Service A)' },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 40000 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 60 },
    ],
  },

  // AUDI
  {
    brand: 'Audi',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12, description: 'Huile Audi Longlife III ou IV' },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 40000 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 20000 },
      { title: 'Plaquettes de frein avant', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 150000, intervalMonths: 96 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Bougies d\'allumage', category: 'other', intervalKm: 60000 },
      { title: 'Batterie', category: 'battery', intervalMonths: 60 },
    ],
  },

  // TOYOTA
  {
    brand: 'Toyota',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 40000, intervalMonths: 48 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Bougies d\'allumage', category: 'other', intervalKm: 60000 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
      { title: 'Courroie de distribution (si applicable)', category: 'timing_belt', intervalKm: 150000, intervalMonths: 120 },
    ],
  },

  // FORD
  {
    brand: 'Ford',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000, intervalMonths: 36 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 150000, intervalMonths: 120 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Liquide de refroidissement', category: 'coolant', intervalKm: 100000, intervalMonths: 60 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
    ],
  },

  // DACIA
  {
    brand: 'Dacia',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000, intervalMonths: 24 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 120000, intervalMonths: 72 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
    ],
  },

  // FIAT
  {
    brand: 'Fiat',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 120000, intervalMonths: 60 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
    ],
  },

  // HYUNDAI
  {
    brand: 'Hyundai',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000, intervalMonths: 36 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 120000, intervalMonths: 120 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 60 },
    ],
  },

  // KIA
  {
    brand: 'Kia',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000, intervalMonths: 36 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 120000, intervalMonths: 120 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 60 },
    ],
  },

  // NISSAN
  {
    brand: 'Nissan',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000, intervalMonths: 36 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 120000, intervalMonths: 120 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
    ],
  },

  // OPEL
  {
    brand: 'Opel',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 30000 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 15000 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 150000, intervalMonths: 120 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 48 },
    ],
  },

  // SEAT
  {
    brand: 'Seat',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 40000 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 20000 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 150000, intervalMonths: 96 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 60 },
    ],
  },

  // SKODA
  {
    brand: 'Skoda',
    items: [
      { title: 'Vidange moteur + filtre à huile', category: 'oil_change', intervalKm: 15000, intervalMonths: 12 },
      { title: 'Contrôle technique', category: 'technical_inspection', intervalMonths: 24 },
      { title: 'Filtre à air', category: 'air_filter', intervalKm: 40000 },
      { title: 'Filtre habitacle', category: 'air_filter', intervalKm: 20000 },
      { title: 'Plaquettes de frein', category: 'brakes', intervalKm: 30000 },
      { title: 'Courroie de distribution', category: 'timing_belt', intervalKm: 150000, intervalMonths: 96 },
      { title: 'Liquide de frein', category: 'other', intervalMonths: 24 },
      { title: 'Batterie', category: 'battery', intervalMonths: 60 },
    ],
  },
];

/**
 * Get the maintenance schedule for a given brand and fuel type.
 * Falls back to common schedule if brand not found.
 */
export function getMaintenanceSchedule(
  brand: string,
  fuelType?: string
): MaintenanceScheduleItem[] {
  const normalizedBrand = brand.trim().toLowerCase();
  const normalizedFuel = fuelType?.trim().toLowerCase();

  // Try exact brand + fuel match first
  let match = MANUFACTURER_SCHEDULES.find(
    (s) =>
      s.brand.toLowerCase() === normalizedBrand &&
      s.fuelType &&
      normalizedFuel &&
      s.fuelType.toLowerCase() === normalizedFuel
  );

  // Try brand only
  if (!match) {
    match = MANUFACTURER_SCHEDULES.find(
      (s) => s.brand.toLowerCase() === normalizedBrand && !s.fuelType
    );
  }

  // Try brand partial match
  if (!match) {
    match = MANUFACTURER_SCHEDULES.find(
      (s) => s.brand.toLowerCase() === normalizedBrand
    );
  }

  return match ? match.items : COMMON_SCHEDULE;
}

/**
 * Get the list of supported brands
 */
export function getSupportedBrands(): string[] {
  const brands = new Set(MANUFACTURER_SCHEDULES.map((s) => s.brand));
  return Array.from(brands).sort();
}
