import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useVehicleStore } from '../store/vehicleStore';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { VehicleCard } from '../components/VehicleCard';
import { MileageWidget } from '../components/MileageWidget';
import { TaskAlertCard } from '../components/TaskAlertCard';
import { formatCurrency } from '../utils/formatting';

export function HomeScreen({ navigation }: any) {
  const { loadVehicles, getActiveVehicle, vehicles } = useVehicleStore();
  const { loadTasks, getTasksByVehicle } = useMaintenanceStore();
  const { loadInvoices, getInvoicesByVehicle, loadTransfers } = useInvoiceStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadVehicles();
    loadTasks();
    loadInvoices();
    loadTransfers();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadVehicles(), loadTasks(), loadInvoices()]);
    setRefreshing(false);
  }

  const vehicle = getActiveVehicle();
  const tasks = vehicle ? getTasksByVehicle(vehicle.id) : [];
  const invoices = vehicle ? getInvoicesByVehicle(vehicle.id) : [];

  const totalExpenses = invoices
    .filter((i) => i.category !== 'fuel')
    .reduce((sum, i) => sum + i.amount, 0);

  const thisMonthExpenses = invoices
    .filter((i) => {
      const d = new Date(i.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerBg} />
      {/* Dark header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.subtitle}>Voici l'état de votre véhicule</Text>
        </View>
        <TouchableOpacity
          style={styles.vehiclesBtn}
          onPress={() => navigation.navigate('VehicleSearch')}
        >
          <Ionicons name="car" size={14} color={Colors.primary} />
          <Text style={styles.vehiclesBtnText}>Mes véhicules</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >

        {vehicle ? (
          <>
            {/* Vehicle Card */}
            <VehicleCard
              vehicle={vehicle}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
            />

            {/* Alerts */}
            <TaskAlertCard
              tasks={tasks}
              onPress={() => navigation.navigate('Agenda')}
            />

            {/* Mileage */}
            <MileageWidget vehicle={vehicle} />

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Dossier')}
              >
                <Ionicons name="document-text" size={24} color={Colors.accent} />
                <Text style={styles.statCardValue}>{invoices.length}</Text>
                <Text style={styles.statCardLabel}>Factures</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Agenda')}
              >
                <Ionicons name="build" size={24} color={Colors.warning} />
                <Text style={styles.statCardValue}>
                  {tasks.filter((t) => t.status !== 'completed').length}
                </Text>
                <Text style={styles.statCardLabel}>Entretiens</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Rapports')}
              >
                <Ionicons name="trending-up" size={24} color={Colors.success} />
                <Text style={styles.statCardValue}>
                  {formatCurrency(thisMonthExpenses)}
                </Text>
                <Text style={styles.statCardLabel}>Ce mois</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions rapides</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('Scanner', { vehicleId: vehicle.id })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
                    <Ionicons name="scan" size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Scanner facture</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('Agenda')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
                    <Ionicons name="add-circle" size={22} color={Colors.warning} />
                  </View>
                  <Text style={styles.actionLabel}>Entretien</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('SaleTransfer', { vehicleId: vehicle.id })}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.accent + '20' }]}>
                    <Ionicons name="share-social" size={22} color={Colors.accent} />
                  </View>
                  <Text style={styles.actionLabel}>Vente sécurisée</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('Assistance')}
                >
                  <View style={[styles.actionIcon, { backgroundColor: Colors.success + '20' }]}>
                    <Ionicons name="shield-checkmark" size={22} color={Colors.success} />
                  </View>
                  <Text style={styles.actionLabel}>Assistance</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={80} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun véhicule</Text>
            <Text style={styles.emptySubtitle}>
              Ajoutez votre premier véhicule pour commencer
            </Text>
            <TouchableOpacity
              style={styles.addVehicleBtn}
              onPress={() => navigation.navigate('VehicleSearch')}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.addVehicleBtnText}>Ajouter un véhicule</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.headerBg,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.headerText,
  },
  subtitle: {
    fontSize: 13,
    color: '#ffffffaa',
    marginTop: 2,
  },
  vehiclesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  vehiclesBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statCardLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    borderRadius: 10,
    padding: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addVehicleBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  addVehicleBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
