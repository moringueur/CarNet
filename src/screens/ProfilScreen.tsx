import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useVehicleStore } from '../store/vehicleStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function ProfilScreen({ navigation }: any) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { user, signOut } = useAuthStore();
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || '';
  const email = user?.email || '';

  const { vehicles, deleteVehicle, setActiveVehicle, activeVehicleId } = useVehicleStore();
  const { invoices } = useInvoiceStore();
  const { tasks } = useMaintenanceStore();

  const totalExpenses = invoices.reduce((sum, i) => sum + i.amount, 0);

  async function handleClearData() {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous supprimer toutes les données locales ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Succès', 'Les données ont été supprimées. Redémarrez l\'application.');
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  }

  function handleDeleteVehicle(vehicleId: string) {
    Alert.alert(
      'Supprimer le véhicule',
      'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteVehicle(vehicleId) },
      ]
    );
  }

  const menuItems = [
    { icon: 'notifications-outline', label: 'Notifications', hasSwitch: true },
    { icon: 'language-outline', label: 'Langue', value: 'Français' },
    { icon: 'moon-outline', label: 'Thème', value: 'Sombre' },
    { icon: 'help-circle-outline', label: 'Aide & Support' },
    { icon: 'document-text-outline', label: 'Conditions d\'utilisation' },
    { icon: 'shield-outline', label: 'Politique de confidentialité' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Profil</Text>
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.userName}>{name || 'Mon Profil'}</Text>
          <Text style={styles.userEmail}>{email || 'Ajoutez votre email'}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{vehicles.length}</Text>
            <Text style={styles.statLabel}>Véhicules</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{invoices.length}</Text>
            <Text style={styles.statLabel}>Factures</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Entretiens</Text>
          </View>
        </View>

        {/* Vehicles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes véhicules</Text>
            <TouchableOpacity onPress={() => navigation.navigate('VehicleSearch')}>
              <Ionicons name="add-circle" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {vehicles.length === 0 ? (
            <TouchableOpacity
              style={styles.addVehicleCard}
              onPress={() => navigation.navigate('VehicleSearch')}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
              <Text style={styles.addVehicleText}>Ajouter un véhicule</Text>
            </TouchableOpacity>
          ) : (
            vehicles.map((v) => (
              <View key={v.id} style={styles.vehicleItem}>
                <TouchableOpacity
                  style={styles.vehicleInfo}
                  onPress={() => setActiveVehicle(v.id)}
                >
                  <View
                    style={[
                      styles.vehicleIconBox,
                      { backgroundColor: activeVehicleId === v.id ? Colors.primary + '20' : Colors.surface },
                    ]}
                  >
                    <Ionicons
                      name="car-sport"
                      size={18}
                      color={activeVehicleId === v.id ? Colors.primary : Colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>
                      {v.brand} {v.model}
                    </Text>
                    <Text style={styles.vehiclePlate}>{v.plate} · {v.year}</Text>
                  </View>
                  {activeVehicleId === v.id && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Actif</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteVehicle(v.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Profile info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Nom</Text>
                <Text style={styles.infoValue}>{name || '—'}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                {item.hasSwitch ? (
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                ) : item.value ? (
                  <Text style={styles.menuItemValue}>{item.value}</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.primary} />
            <Text style={styles.logoutBtnText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>Zone de danger</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Ionicons name="trash" size={18} color={Colors.error} />
            <Text style={styles.dangerBtnText}>Réinitialiser les données locales</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>CarNet v1.0.0</Text>
          <Text style={styles.appTagline}>Votre carnet d'entretien intelligent</Text>
        </View>

        <View style={{ height: 40 }} />
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
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  userName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  userEmail: { fontSize: 14, color: Colors.textSecondary },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  addVehicleCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  addVehicleText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  vehicleItem: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  vehicleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  vehicleIconBox: {
    borderRadius: 10,
    padding: 8,
  },
  vehicleName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  vehiclePlate: { fontSize: 12, color: Colors.textSecondary, marginTop: 1, fontFamily: 'monospace' },
  activeBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 14 },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemLabel: { fontSize: 14, color: Colors.textPrimary },
  menuItemValue: { fontSize: 13, color: Colors.textMuted },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  infoLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary + '10',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  logoutBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.error + '10',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  dangerBtnText: { color: Colors.error, fontSize: 14, fontWeight: '600' },
  appInfo: { alignItems: 'center', marginTop: 24, gap: 4 },
  appVersion: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  appTagline: { fontSize: 11, color: Colors.textMuted },
});
