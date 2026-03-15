import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle, MileageEntry } from '../types';
import { supabase } from '../lib/supabase';

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

function dbToVehicle(row: any): Vehicle {
  return {
    id: row.id,
    plate: row.plate,
    brand: row.brand,
    model: row.model,
    year: row.year,
    fuel: row.fuel,
    color: row.color ?? undefined,
    vin: row.vin ?? undefined,
    imageUri: row.image_uri ?? undefined,
    createdAt: row.created_at,
    mileage: (row.mileage_entries ?? []).map((m: any) => ({
      id: m.id,
      value: m.value,
      date: m.date,
      note: m.note ?? undefined,
    })),
  };
}

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  activeVehicleId: null,
  isLoading: false,

  loadVehicles: async () => {
    set({ isLoading: true });
    try {
      const session = await getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*, mileage_entries(*)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const vehicles = data.map(dbToVehicle);
          const activeId = await AsyncStorage.getItem(ACTIVE_KEY);
          const activeVehicleId = activeId && vehicles.find(v => v.id === activeId)
            ? activeId
            : vehicles[0]?.id ?? null;
          set({ vehicles, activeVehicleId, isLoading: false });
          return;
        }
      }

      // Fallback: AsyncStorage
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
    const session = await getSession();
    if (session?.user) {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          user_id: session.user.id,
          plate: vehicleData.plate,
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year,
          fuel: vehicleData.fuel,
          color: vehicleData.color ?? null,
          vin: vehicleData.vin ?? null,
          image_uri: vehicleData.imageUri ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      const vehicle: Vehicle = { ...dbToVehicle(data), mileage: [] };
      const vehicles = [...get().vehicles, vehicle];
      const activeVehicleId = get().activeVehicleId || vehicle.id;
      await AsyncStorage.setItem(ACTIVE_KEY, activeVehicleId);
      set({ vehicles, activeVehicleId });
      return vehicle;
    }

    // Fallback: AsyncStorage
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
    const session = await getSession();
    if (session?.user) {
      const dbUpdates: any = {};
      if (updates.plate !== undefined) dbUpdates.plate = updates.plate;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.model !== undefined) dbUpdates.model = updates.model;
      if (updates.year !== undefined) dbUpdates.year = updates.year;
      if (updates.fuel !== undefined) dbUpdates.fuel = updates.fuel;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.vin !== undefined) dbUpdates.vin = updates.vin;
      if (updates.imageUri !== undefined) dbUpdates.image_uri = updates.imageUri;

      await supabase.from('vehicles').update(dbUpdates).eq('id', id).eq('user_id', session.user.id);
    } else {
      const vehicles = get().vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    }
    const vehicles = get().vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v));
    set({ vehicles });
  },

  deleteVehicle: async (id) => {
    const session = await getSession();
    if (session?.user) {
      await supabase.from('vehicles').delete().eq('id', id).eq('user_id', session.user.id);
    } else {
      const vehicles = get().vehicles.filter((v) => v.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    }
    const vehicles = get().vehicles.filter((v) => v.id !== id);
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
    const session = await getSession();
    const entry: MileageEntry = { ...entryData, id: generateId() };

    if (session?.user) {
      await supabase.from('mileage_entries').insert({
        id: entry.id,
        vehicle_id: vehicleId,
        value: entryData.value,
        date: entryData.date,
        note: entryData.note ?? null,
      });
    }

    const vehicles = get().vehicles.map((v) =>
      v.id === vehicleId ? { ...v, mileage: [...v.mileage, entry] } : v
    );
    if (!session?.user) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    }
    set({ vehicles });
  },

  getActiveVehicle: () => {
    const { vehicles, activeVehicleId } = get();
    return vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;
  },
}));
