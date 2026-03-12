export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  fuel: string;
  color?: string;
  vin?: string;
  imageUri?: string;
  mileage: MileageEntry[];
  createdAt: string;
}

export interface MileageEntry {
  id: string;
  value: number;
  date: string;
  note?: string;
}

export interface MaintenanceTask {
  id: string;
  vehicleId: string;
  title: string;
  category: MaintenanceCategory;
  dueDate?: string;
  dueMileage?: number;
  completedDate?: string;
  completedMileage?: number;
  status: 'pending' | 'overdue' | 'completed' | 'upcoming';
  notes?: string;
  invoiceIds?: string[];
  cost?: number;
  garage?: string;
}

export type MaintenanceCategory =
  | 'oil_change'
  | 'tires'
  | 'brakes'
  | 'technical_inspection'
  | 'timing_belt'
  | 'air_filter'
  | 'battery'
  | 'coolant'
  | 'other';

export interface Invoice {
  id: string;
  vehicleId: string;
  title: string;
  amount: number;
  date: string;
  category: InvoiceCategory;
  garage?: string;
  imageUri?: string;
  pdfUri?: string;
  ocrText?: string;
  maintenanceTaskId?: string;
  tags?: string[];
  createdAt: string;
}

export type InvoiceCategory =
  | 'maintenance'
  | 'repair'
  | 'fuel'
  | 'insurance'
  | 'tax'
  | 'other';

export interface Expense {
  id: string;
  vehicleId: string;
  type: 'expense' | 'revenue';
  amount: number;
  category: InvoiceCategory;
  description: string;
  date: string;
  invoiceId?: string;
}

export interface SaleTransfer {
  id: string;
  vehicleId: string;
  code: string;
  expiresAt: string;
  createdAt: string;
  used: boolean;
  buyerEmail?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatarUri?: string;
  notificationsEnabled: boolean;
  defaultVehicleId?: string;
}
