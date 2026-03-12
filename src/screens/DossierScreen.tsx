import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { Colors } from '../constants/colors';
import { useInvoiceStore } from '../store/invoiceStore';
import { useVehicleStore } from '../store/vehicleStore';
import { Invoice, InvoiceCategory } from '../types';
import { formatCurrency, formatDate, getCategoryLabel, getCategoryIcon } from '../utils/formatting';

const FILTERS: { key: 'all' | InvoiceCategory; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'maintenance', label: 'Entretien' },
  { key: 'repair', label: 'Réparation' },
  { key: 'fuel', label: 'Carburant' },
  { key: 'insurance', label: 'Assurance' },
  { key: 'other', label: 'Autre' },
];

function InvoiceCard({ invoice, onPress, onDelete, onShare }: {
  invoice: Invoice;
  onPress: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const categoryColors: Record<string, string> = {
    maintenance: Colors.primary,
    repair: Colors.error,
    fuel: Colors.warning,
    insurance: Colors.accent,
    tax: Colors.textMuted,
    other: Colors.textSecondary,
  };
  const color = categoryColors[invoice.category] || Colors.textSecondary;

  return (
    <TouchableOpacity style={styles.invoiceCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.categoryBar, { backgroundColor: color }]} />
      <View style={styles.invoiceContent}>
        <View style={styles.invoiceLeft}>
          {invoice.imageUri ? (
            <Image source={{ uri: invoice.imageUri }} style={styles.invoiceThumb} />
          ) : (
            <View style={[styles.invoiceThumbPlaceholder, { backgroundColor: color + '20' }]}>
              <Ionicons name={getCategoryIcon(invoice.category) as any} size={20} color={color} />
            </View>
          )}
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle} numberOfLines={1}>{invoice.title}</Text>
            <Text style={styles.invoiceDate}>{formatDate(invoice.date)}</Text>
            {invoice.garage && (
              <Text style={styles.invoiceGarage} numberOfLines={1}>📍 {invoice.garage}</Text>
            )}
          </View>
        </View>
        <View style={styles.invoiceRight}>
          <Text style={styles.invoiceAmount}>{formatCurrency(invoice.amount)}</Text>
          <View style={[styles.catBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.catBadgeText, { color }]}>{getCategoryLabel(invoice.category)}</Text>
          </View>
          <View style={styles.invoiceActions}>
            <TouchableOpacity onPress={onShare} style={styles.actionIcon}>
              <Ionicons name="share-outline" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionIcon}>
              <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function DossierScreen({ navigation }: any) {
  const [filter, setFilter] = useState<'all' | InvoiceCategory>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { getActiveVehicle } = useVehicleStore();
  const { getInvoicesByVehicle, deleteInvoice } = useInvoiceStore();

  const vehicle = getActiveVehicle();
  const allInvoices = vehicle ? getInvoicesByVehicle(vehicle.id) : [];
  const filtered = filter === 'all' ? allInvoices : allInvoices.filter((i) => i.category === filter);

  const totalAmount = filtered.reduce((sum, i) => sum + i.amount, 0);

  async function handleShare(invoice: Invoice) {
    if (!invoice.imageUri) {
      Alert.alert('Info', 'Aucune image disponible pour cette facture.');
      return;
    }
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(invoice.imageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Partager la facture',
      });
    }
  }

  async function handleDelete(invoiceId: string) {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette facture ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteInvoice(invoiceId);
          if (selectedInvoice?.id === invoiceId) setSelectedInvoice(null);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Dossier</Text>
          <Text style={styles.screenSubtitle}>{allInvoices.length} facture{allInvoices.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('Scanner', { vehicleId: vehicle?.id })}
        >
          <Ionicons name="scan" size={18} color="#000" />
          <Text style={styles.scanBtnText}>Scanner</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
          <Text style={styles.summaryLabel}>Total {filter === 'all' ? '' : getCategoryLabel(filter)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filtered.length}</Text>
          <Text style={styles.summaryLabel}>Factures</Text>
        </View>
        <View style={styles.summaryDivider} />
        <TouchableOpacity
          style={styles.summaryItem}
          onPress={() => vehicle && navigation.navigate('SaleTransfer', { vehicleId: vehicle.id })}
        >
          <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
          <Text style={[styles.summaryLabel, { color: Colors.primary }]}>Vente sécurisée</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Invoice list */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune facture</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Scanner', { vehicleId: vehicle?.id })}
            >
              <Text style={styles.emptyAction}>Scanner votre première facture</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onPress={() => setSelectedInvoice(invoice)}
                onDelete={() => handleDelete(invoice.id)}
                onShare={() => handleShare(invoice)}
              />
            ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Invoice detail modal */}
      {selectedInvoice && (
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedInvoice.title}</Text>
              <TouchableOpacity onPress={() => setSelectedInvoice(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedInvoice.imageUri && (
              <Image
                source={{ uri: selectedInvoice.imageUri }}
                style={styles.detailImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.detailInfo}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Montant</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedInvoice.amount)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(selectedInvoice.date)}</Text>
              </View>
              {selectedInvoice.garage && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Garage</Text>
                  <Text style={styles.detailValue}>{selectedInvoice.garage}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Catégorie</Text>
                <Text style={styles.detailValue}>{getCategoryLabel(selectedInvoice.category)}</Text>
              </View>
            </View>
            {selectedInvoice.ocrText && (
              <View style={styles.ocrBox}>
                <Text style={styles.ocrBoxTitle}>Texte extrait</Text>
                <Text style={styles.ocrBoxText} numberOfLines={6}>{selectedInvoice.ocrText}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.shareFullBtn}
              onPress={() => handleShare(selectedInvoice)}
            >
              <Ionicons name="share-outline" size={18} color={Colors.primary} />
              <Text style={styles.shareFullBtnText}>Partager la facture</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  screenSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  scanBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary },
  summaryDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  filterBar: { paddingLeft: 16, marginBottom: 8, flexGrow: 0 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  filterTabActive: { backgroundColor: Colors.primary + '20', borderWidth: 1, borderColor: Colors.primary },
  filterTabText: { color: Colors.textSecondary, fontSize: 13 },
  filterTabTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: 16 },
  invoiceCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  categoryBar: { width: 4 },
  invoiceContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-between',
  },
  invoiceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  invoiceThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  invoiceThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceInfo: { flex: 1 },
  invoiceTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  invoiceDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  invoiceGarage: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  catBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  catBadgeText: { fontSize: 10, fontWeight: '600' },
  invoiceActions: { flexDirection: 'row', gap: 8 },
  actionIcon: { padding: 2 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptyAction: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000cc',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  detailImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: 16,
  },
  detailInfo: { gap: 10, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ocrBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  ocrBoxTitle: { fontSize: 11, color: Colors.textMuted, marginBottom: 6, fontWeight: '500' },
  ocrBoxText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  shareFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
  },
  shareFullBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
