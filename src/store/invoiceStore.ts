import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Invoice, SaleTransfer } from '../types';

interface InvoiceState {
  invoices: Invoice[];
  saleTransfers: SaleTransfer[];
  loadInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoicesByVehicle: (vehicleId: string) => Invoice[];
  saveImageToDocuments: (uri: string, filename: string) => Promise<string>;
  createSaleTransfer: (vehicleId: string, buyerEmail?: string) => Promise<SaleTransfer>;
  verifySaleCode: (code: string) => SaleTransfer | null;
  markTransferUsed: (id: string) => Promise<void>;
  loadTransfers: () => Promise<void>;
}

const INVOICES_KEY = 'carnet_invoices';
const TRANSFERS_KEY = 'carnet_transfers';
const DOCS_DIR = FileSystem.documentDirectory + 'invoices/';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DOCS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
  }
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  saleTransfers: [],

  loadInvoices: async () => {
    const stored = await AsyncStorage.getItem(INVOICES_KEY);
    set({ invoices: stored ? JSON.parse(stored) : [] });
  },

  addInvoice: async (invoiceData) => {
    const invoice: Invoice = {
      ...invoiceData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const invoices = [...get().invoices, invoice];
    await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    set({ invoices });
    return invoice;
  },

  updateInvoice: async (id, updates) => {
    const invoices = get().invoices.map((i) => (i.id === id ? { ...i, ...updates } : i));
    await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    set({ invoices });
  },

  deleteInvoice: async (id) => {
    const invoice = get().invoices.find((i) => i.id === id);
    if (invoice?.imageUri) {
      const info = await FileSystem.getInfoAsync(invoice.imageUri);
      if (info.exists) await FileSystem.deleteAsync(invoice.imageUri);
    }
    const invoices = get().invoices.filter((i) => i.id !== id);
    await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    set({ invoices });
  },

  getInvoicesByVehicle: (vehicleId) =>
    get().invoices.filter((i) => i.vehicleId === vehicleId),

  saveImageToDocuments: async (uri, filename) => {
    await ensureDir();
    const dest = DOCS_DIR + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  },

  createSaleTransfer: async (vehicleId, buyerEmail) => {
    const transfer: SaleTransfer = {
      id: generateId(),
      vehicleId,
      code: generateCode(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      used: false,
      buyerEmail,
    };
    const transfers = [...get().saleTransfers, transfer];
    await AsyncStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
    set({ saleTransfers: transfers });
    return transfer;
  },

  verifySaleCode: (code) => {
    const transfer = get().saleTransfers.find(
      (t) => t.code === code.toUpperCase() && !t.used && new Date(t.expiresAt) > new Date()
    );
    return transfer || null;
  },

  markTransferUsed: async (id) => {
    const saleTransfers = get().saleTransfers.map((t) =>
      t.id === id ? { ...t, used: true } : t
    );
    await AsyncStorage.setItem(TRANSFERS_KEY, JSON.stringify(saleTransfers));
    set({ saleTransfers });
  },

  loadTransfers: async () => {
    const stored = await AsyncStorage.getItem(TRANSFERS_KEY);
    set({ saleTransfers: stored ? JSON.parse(stored) : [] });
  },
}));
