import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaintenanceTask } from '../types';

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

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  tasks: [],

  loadTasks: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const tasks = stored ? JSON.parse(stored) : [];
    set({ tasks: tasks.map((t: MaintenanceTask) => ({ ...t, status: computeStatus(t) })) });
  },

  addTask: async (taskData) => {
    const task: MaintenanceTask = { ...taskData, id: generateId(), status: computeStatus(taskData as MaintenanceTask) };
    const tasks = [...get().tasks, task];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    set({ tasks });
    return task;
  },

  updateTask: async (id, updates) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      return { ...updated, status: computeStatus(updated) };
    });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    set({ tasks });
  },

  deleteTask: async (id) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    set({ tasks });
  },

  completeTask: async (id, completedDate, completedMileage) => {
    const tasks = get().tasks.map((t) =>
      t.id === id
        ? { ...t, completedDate, completedMileage, status: 'completed' as const }
        : t
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    set({ tasks });
  },

  getTasksByVehicle: (vehicleId) =>
    get().tasks.filter((t) => t.vehicleId === vehicleId),

  getOverdueTasks: (vehicleId) =>
    get().tasks.filter((t) => t.vehicleId === vehicleId && t.status === 'overdue'),
}));
