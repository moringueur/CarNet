import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, MileageEntry } from '../types';

interface VehicleState {
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  isLoading: boolean;
  loadVehicles: () => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'mileage'>) => Promise<Vehicle>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  setActiveVehicle: (id: string) => void;
  addMileageEntry: (vehicleId: string, entry: Omit<MileageEntry, 'id'>) => Promise<void>;
  getActiveVehicle: () => Vehicle | null;
}

const STORAGE_KEY = 'carnet_vehicles';
const ACTIVE_KEY = 'carnet_active_vehicle';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  activeVehicleId: null,
  isLoading: false,

  loadVehicles: async () => {
    set({ isLoading: true });
    try {
      const [stored, activeId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ACTIVE_KEY),
      ]);
      const vehicles = stored ? JSON.parse(stored) : [];
      set({ vehicles, activeVehicleId: activeId, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addVehicle: async (vehicleData) => {
    const vehicle: Vehicle = {
      ...vehicleData,
      id: generateId(),
      mileage: [],
      createdAt: new Date().toISOString(),
    };
    const vehicles = [...get().vehicles, vehicle];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    const activeVehicleId = get().activeVehicleId || vehicle.id;
    await AsyncStorage.setItem(ACTIVE_KEY, activeVehicleId);
    set({ vehicles, activeVehicleId });
    return vehicle;
  },

  updateVehicle: async (id, updates) => {
    const vehicles = get().vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    set({ vehicles });
  },

  deleteVehicle: async (id) => {
    const vehicles = get().vehicles.filter((v) => v.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    const activeVehicleId =
      get().activeVehicleId === id ? (vehicles[0]?.id || null) : get().activeVehicleId;
    if (activeVehicleId) await AsyncStorage.setItem(ACTIVE_KEY, activeVehicleId);
    set({ vehicles, activeVehicleId });
  },

  setActiveVehicle: async (id) => {
    await AsyncStorage.setItem(ACTIVE_KEY, id);
    set({ activeVehicleId: id });
  },

  addMileageEntry: async (vehicleId, entryData) => {
    const entry: MileageEntry = { ...entryData, id: generateId() };
    const vehicles = get().vehicles.map((v) =>
      v.id === vehicleId ? { ...v, mileage: [...v.mileage, entry] } : v
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    set({ vehicles });
  },

  getActiveVehicle: () => {
    const { vehicles, activeVehicleId } = get();
    return vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;
  },
}));
