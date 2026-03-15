import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Invoice, SaleTransfer } from '../types';
import { supabase } from '../lib/supabase';

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

function dbToInvoice(row: any): Invoice {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    title: row.title,
    amount: row.amount,
    date: row.date,
    category: row.category,
    garage: row.garage ?? undefined,
    imageUri: row.image_url ?? undefined,
    pdfUri: row.pdf_url ?? undefined,
    ocrText: row.ocr_text ?? undefined,
    maintenanceTaskId: row.maintenance_task_id ?? undefined,
    tags: row.tags ?? undefined,
    createdAt: row.created_at,
  };
}

function dbToTransfer(row: any): SaleTransfer {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    code: row.code,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    used: row.used,
    buyerEmail: row.buyer_email ?? undefined,
  };
}

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  saleTransfers: [],

  loadInvoices: async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          set({ invoices: data.map(dbToInvoice) });
          return;
        }
      }
    } catch {}

    const stored = await AsyncStorage.getItem(INVOICES_KEY);
    set({ invoices: stored ? JSON.parse(stored) : [] });
  },

  addInvoice: async (invoiceData) => {
    const session = await getSession();

    if (session?.user) {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          vehicle_id: invoiceData.vehicleId,
          user_id: session.user.id,
          title: invoiceData.title,
          amount: invoiceData.amount,
          date: invoiceData.date,
          category: invoiceData.category,
          garage: invoiceData.garage ?? null,
          image_url: invoiceData.imageUri ?? null,
          pdf_url: invoiceData.pdfUri ?? null,
          ocr_text: invoiceData.ocrText ?? null,
          maintenance_task_id: invoiceData.maintenanceTaskId ?? null,
          tags: invoiceData.tags ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      const invoice = dbToInvoice(data);
      set({ invoices: [...get().invoices, invoice] });
      return invoice;
    }

    // Fallback: AsyncStorage
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
    const session = await getSession();

    if (session?.user) {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.garage !== undefined) dbUpdates.garage = updates.garage;
      if (updates.imageUri !== undefined) dbUpdates.image_url = updates.imageUri;
      if (updates.pdfUri !== undefined) dbUpdates.pdf_url = updates.pdfUri;
      if (updates.ocrText !== undefined) dbUpdates.ocr_text = updates.ocrText;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

      await supabase.from('invoices').update(dbUpdates).eq('id', id).eq('user_id', session.user.id);
    }

    const invoices = get().invoices.map((i) => (i.id === id ? { ...i, ...updates } : i));
    if (!session?.user) {
      await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    }
    set({ invoices });
  },

  deleteInvoice: async (id) => {
    const invoice = get().invoices.find((i) => i.id === id);
    const session = await getSession();

    if (session?.user) {
      await supabase.from('invoices').delete().eq('id', id).eq('user_id', session.user.id);
    } else {
      if (invoice?.imageUri) {
        const info = await FileSystem.getInfoAsync(invoice.imageUri);
        if (info.exists) await FileSystem.deleteAsync(invoice.imageUri);
      }
    }

    const invoices = get().invoices.filter((i) => i.id !== id);
    if (!session?.user) {
      await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    }
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
    const session = await getSession();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (session?.user) {
      const { data, error } = await supabase
        .from('sale_transfers')
        .insert({
          vehicle_id: vehicleId,
          user_id: session.user.id,
          code,
          expires_at: expiresAt,
          used: false,
          buyer_email: buyerEmail ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      const transfer = dbToTransfer(data);
      set({ saleTransfers: [...get().saleTransfers, transfer] });
      return transfer;
    }

    // Fallback: AsyncStorage
    const transfer: SaleTransfer = {
      id: generateId(),
      vehicleId,
      code,
      expiresAt,
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
    const session = await getSession();
    if (session?.user) {
      await supabase.from('sale_transfers').update({ used: true }).eq('id', id).eq('user_id', session.user.id);
    }
    const saleTransfers = get().saleTransfers.map((t) =>
      t.id === id ? { ...t, used: true } : t
    );
    if (!session?.user) {
      await AsyncStorage.setItem(TRANSFERS_KEY, JSON.stringify(saleTransfers));
    }
    set({ saleTransfers });
  },

  loadTransfers: async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('sale_transfers')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          set({ saleTransfers: data.map(dbToTransfer) });
          return;
        }
      }
    } catch {}

    const stored = await AsyncStorage.getItem(TRANSFERS_KEY);
    set({ saleTransfers: stored ? JSON.parse(stored) : [] });
  },
}));
