import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaintenanceTask } from '../types';
import { supabase } from '../lib/supabase';

interface MaintenanceState {
  tasks: MaintenanceTask[];
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<MaintenanceTask, 'id'>) => Promise<MaintenanceTask>;
  updateTask: (id: string, updates: Partial<MaintenanceTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string, completedDate: string, completedMileage?: number) => Promise<void>;
  getTasksByVehicle: (vehicleId: string) => MaintenanceTask[];
  getOverdueTasks: (vehicleId: string) => MaintenanceTask[];
}

const STORAGE_KEY = 'carnet_maintenance';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function computeStatus(task: MaintenanceTask): MaintenanceTask['status'] {
  if (task.completedDate) return 'completed';
  if (task.dueDate && new Date(task.dueDate) < new Date()) return 'overdue';
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  if (task.dueDate && new Date(task.dueDate) <= soon) return 'upcoming';
  return 'pending';
}

function dbToTask(row: any): MaintenanceTask {
  const task: MaintenanceTask = {
    id: row.id,
    vehicleId: row.vehicle_id,
    title: row.title,
    category: row.category,
    dueDate: row.due_date ?? undefined,
    dueMileage: row.due_mileage ?? undefined,
    completedDate: row.completed_date ?? undefined,
    completedMileage: row.completed_mileage ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    cost: row.cost ?? undefined,
    garage: row.garage ?? undefined,
  };
  return { ...task, status: computeStatus(task) };
}

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  tasks: [],

  loadTasks: async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('maintenance_tasks')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          set({ tasks: data.map(dbToTask) });
          return;
        }
      }

      // Fallback: AsyncStorage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const tasks = stored ? JSON.parse(stored) : [];
      set({ tasks: tasks.map((t: MaintenanceTask) => ({ ...t, status: computeStatus(t) })) });
    } catch {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const tasks = stored ? JSON.parse(stored) : [];
      set({ tasks: tasks.map((t: MaintenanceTask) => ({ ...t, status: computeStatus(t) })) });
    }
  },

  addTask: async (taskData) => {
    const session = await getSession();
    const status = computeStatus(taskData as MaintenanceTask);

    if (session?.user) {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert({
          vehicle_id: taskData.vehicleId,
          user_id: session.user.id,
          title: taskData.title,
          category: taskData.category,
          due_date: taskData.dueDate ?? null,
          due_mileage: taskData.dueMileage ?? null,
          completed_date: taskData.completedDate ?? null,
          completed_mileage: taskData.completedMileage ?? null,
          status,
          notes: taskData.notes ?? null,
          cost: taskData.cost ?? null,
          garage: taskData.garage ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      const task = dbToTask(data);
      set({ tasks: [...get().tasks, task] });
      return task;
    }

    // Fallback: AsyncStorage
    const task: MaintenanceTask = { ...taskData, id: generateId(), status };
    const tasks = [...get().tasks, task];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    set({ tasks });
    return task;
  },

  updateTask: async (id, updates) => {
    const session = await getSession();

    if (session?.user) {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.dueMileage !== undefined) dbUpdates.due_mileage = updates.dueMileage;
      if (updates.completedDate !== undefined) dbUpdates.completed_date = updates.completedDate;
      if (updates.completedMileage !== undefined) dbUpdates.completed_mileage = updates.completedMileage;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
      if (updates.garage !== undefined) dbUpdates.garage = updates.garage;

      await supabase.from('maintenance_tasks').update(dbUpdates).eq('id', id).eq('user_id', session.user.id);
    }

    const tasks = get().tasks.map((t) => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      return { ...updated, status: computeStatus(updated) };
    });
    if (!session?.user) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
    set({ tasks });
  },

  deleteTask: async (id) => {
    const session = await getSession();
    if (session?.user) {
      await supabase.from('maintenance_tasks').delete().eq('id', id).eq('user_id', session.user.id);
    } else {
      const tasks = get().tasks.filter((t) => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },

  completeTask: async (id, completedDate, completedMileage) => {
    const session = await getSession();
    if (session?.user) {
      await supabase
        .from('maintenance_tasks')
        .update({ completed_date: completedDate, completed_mileage: completedMileage ?? null, status: 'completed' })
        .eq('id', id)
        .eq('user_id', session.user.id);
    }
    const tasks = get().tasks.map((t) =>
      t.id === id
        ? { ...t, completedDate, completedMileage, status: 'completed' as const }
        : t
    );
    if (!session?.user) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
    set({ tasks });
  },

  getTasksByVehicle: (vehicleId) =>
    get().tasks.filter((t) => t.vehicleId === vehicleId),

  getOverdueTasks: (vehicleId) =>
    get().tasks.filter((t) => t.vehicleId === vehicleId && t.status === 'overdue'),
}));
