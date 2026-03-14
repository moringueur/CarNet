import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useInvoiceStore } from '../store/invoiceStore';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, formatDate, getCategoryLabel } from '../utils/formatting';
import { InvoiceCategory } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: Colors.primary,
  repair: Colors.error,
  fuel: Colors.warning,
  insurance: Colors.accent,
  tax: '#8b5cf6',
  other: Colors.textSecondary,
};

const SERVICES = [
  { icon: 'construct', label: 'Garage', color: '#f59e0b', bg: '#f59e0b20' },
  { icon: 'checkmark-shield', label: 'Contrôle technique', color: Colors.accent, bg: Colors.accent + '20' },
  { icon: 'flame', label: 'Carburant', color: Colors.error, bg: Colors.error + '20' },
];

const ASSISTANCE = [
  { icon: 'car', label: 'Dépannage', color: Colors.primary, bg: Colors.primary + '20' },
  { icon: 'shield', label: 'Forces de l\'ordre', color: Colors.accent, bg: Colors.accent + '20' },
  { icon: 'checkmark-circle', label: 'eurofil', color: Colors.success, bg: Colors.success + '20' },
];

export function RapportsScreen({ navigation }: any) {
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('year');
  const { getActiveVehicle } = useVehicleStore();
  const { getInvoicesByVehicle } = useInvoiceStore();

  const vehicle = getActiveVehicle();
  const allInvoices = vehicle ? getInvoicesByVehicle(vehicle.id) : [];

  const now = new Date();
  const filteredInvoices = allInvoices.filter((i) => {
    const d = new Date(i.date);
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'year') return d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalExpenses = filteredInvoices.reduce((sum, i) => sum + i.amount, 0);
  const monthlyAverage = totalExpenses / (period === 'all' ? Math.max(allInvoices.length, 1) : period === 'year' ? 12 : 1);

  // By category
  const byCategory = filteredInvoices.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  // Monthly trend (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthInvoices = allInvoices.filter((inv) => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear();
    });
    return {
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      amount: monthInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    };
  });

  const maxAmount = Math.max(...monthlyData.map((m) => m.amount), 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Rapports</Text>
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Period selector */}
        <View style={styles.periodSelector}>
          {(['month', 'year', 'all'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                {{ month: 'Ce mois', year: 'Cette année', all: 'Tout' }[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main expenses card */}
        <LinearGradient
          colors={[Colors.errorDark + 'cc', Colors.card]}
          style={styles.expensesCard}
        >
          <View style={styles.expensesHeader}>
            <View style={[styles.expensesIconBox, { backgroundColor: Colors.error + '30' }]}>
              <Ionicons name="wallet" size={20} color={Colors.error} />
            </View>
            <View>
              <Text style={styles.expensesLabel}>Dépenses</Text>
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.expensesTotal, { color: Colors.error }]}>
            -{formatCurrency(totalExpenses)}
          </Text>
          <View style={styles.expensesProgressBar}>
            <View style={[styles.expensesProgress, { width: '100%', backgroundColor: Colors.error }]} />
          </View>
          <View style={styles.expensesStats}>
            <View style={styles.expensesStat}>
              <Text style={styles.expensesStatValue}>{filteredInvoices.length}</Text>
              <Text style={styles.expensesStatLabel}>transactions</Text>
            </View>
            <View style={styles.expensesStat}>
              <Text style={styles.expensesStatValue}>{formatCurrency(monthlyAverage)}</Text>
              <Text style={styles.expensesStatLabel}>Par mois</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Category breakdown */}
        {sortedCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Par catégorie</Text>
            <View style={styles.categoryList}>
              {sortedCategories.map(([cat, amount]) => {
                const pct = (amount / totalExpenses) * 100;
                const color = CATEGORY_COLORS[cat] || Colors.textSecondary;
                return (
                  <View key={cat} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: color }]} />
                      <Text style={styles.categoryName}>{getCategoryLabel(cat)}</Text>
                    </View>
                    <View style={styles.categoryBar}>
                      <View
                        style={[
                          styles.categoryBarFill,
                          { width: `${pct}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.categoryAmount, { color }]}>{formatCurrency(amount)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Monthly chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tendance mensuelle</Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {monthlyData.map((m, i) => (
                <View key={i} style={styles.chartBar}>
                  <Text style={styles.chartAmount}>
                    {m.amount > 0 ? formatCurrency(m.amount) : ''}
                  </Text>
                  <View style={styles.chartBarWrapper}>
                    <View
                      style={[
                        styles.chartBarFill,
                        {
                          height: `${Math.max((m.amount / maxAmount) * 100, 4)}%`,
                          backgroundColor: i === 5 ? Colors.primary : Colors.primary + '50',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{m.month}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Services à proximité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services à proximité</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map((s) => (
              <TouchableOpacity key={s.label} style={[styles.serviceCard, { backgroundColor: s.bg }]}>
                <View style={[styles.serviceIconBox, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={26} color={s.color} />
                </View>
                <Text style={[styles.serviceLabel, { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Assistance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assistance</Text>
          <View style={styles.servicesGrid}>
            {ASSISTANCE.map((s) => (
              <TouchableOpacity key={s.label} style={[styles.serviceCard, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={26} color={s.color} />
                <Text style={[styles.serviceLabel, { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent transactions */}
        {filteredInvoices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            {filteredInvoices
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((inv) => (
                <View key={inv.id} style={styles.transactionItem}>
                  <View
                    style={[
                      styles.transactionIcon,
                      { backgroundColor: (CATEGORY_COLORS[inv.category] || Colors.textSecondary) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={inv.category === 'fuel' ? 'flame' : 'build' as any}
                      size={16}
                      color={CATEGORY_COLORS[inv.category] || Colors.textSecondary}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>{inv.title}</Text>
                    <Text style={styles.transactionDate}>{formatDate(inv.date)}</Text>
                  </View>
                  <Text style={styles.transactionAmount}>-{formatCurrency(inv.amount)}</Text>
                </View>
              ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.headerBg },
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.headerBg,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: Colors.headerText },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  periodBtn: { flex: 1, padding: 9, borderRadius: 10, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  periodBtnTextActive: { color: '#fff', fontWeight: '700' },
  expensesCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  expensesHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  expensesIconBox: { borderRadius: 10, padding: 6 },
  expensesLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  expensesTotal: { fontSize: 32, fontWeight: '800', marginVertical: 6 },
  expensesProgressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginVertical: 10,
    overflow: 'hidden',
  },
  expensesProgress: { height: '100%', borderRadius: 2 },
  expensesStats: { flexDirection: 'row', gap: 20 },
  expensesStat: {},
  expensesStatValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  expensesStatLabel: { fontSize: 11, color: Colors.textSecondary },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  categoryList: { gap: 10 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 120 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  categoryBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBarFill: { height: '100%', borderRadius: 3 },
  categoryAmount: { fontSize: 12, fontWeight: '600', width: 70, textAlign: 'right' },
  chartCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
  chartBar: { flex: 1, alignItems: 'center', gap: 4 },
  chartAmount: { fontSize: 8, color: Colors.textMuted, textAlign: 'center' },
  chartBarWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBarFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 10, color: Colors.textSecondary },
  servicesGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  serviceCard: {
    flex: 1,
    minWidth: '28%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  serviceIconBox: { borderRadius: 12, padding: 8 },
  serviceLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionIcon: { borderRadius: 10, padding: 8 },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  transactionDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  transactionAmount: { fontSize: 14, fontWeight: '600', color: Colors.error },
});
