import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

interface ServiceContact {
  id: string;
  title: string;
  subtitle: string;
  phone?: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
  emergency?: boolean;
}

interface InsuranceProvider {
  name: string;
  phone: string;
  available: string;
  icon: string;
  color: string;
}

const EMERGENCY_SERVICES: ServiceContact[] = [
  {
    id: 'police',
    title: 'Forces de l\'ordre',
    subtitle: 'Police / Gendarmerie',
    phone: '17',
    icon: 'shield',
    color: '#1d4ed8',
    bg: '#1d4ed820',
    description: 'Police nationale, gendarmerie. Urgence, accident, vol de véhicule.',
    emergency: true,
  },
  {
    id: 'depannage',
    title: 'Dépannage',
    subtitle: 'Assistance routière',
    phone: '3222',
    icon: 'car',
    color: Colors.warning,
    bg: Colors.warning + '20',
    description: 'Remorquage, panne, crevaison. Disponible 24h/24 sur autoroute.',
    emergency: false,
  },
];

const ASSISTANCE_SERVICES: ServiceContact[] = [
  {
    id: 'samu',
    title: 'SAMU',
    subtitle: 'Urgences médicales',
    phone: '15',
    icon: 'medkit',
    color: Colors.error,
    bg: Colors.error + '20',
    description: 'Service d\'aide médicale urgente. Accident corporel, malaise.',
    emergency: true,
  },
  {
    id: 'pompiers',
    title: 'Pompiers',
    subtitle: 'Secours & incendie',
    phone: '18',
    icon: 'flame',
    color: '#dc2626',
    bg: '#dc262620',
    description: 'Incendie, secours routier, désincarcération.',
    emergency: true,
  },
  {
    id: 'europe',
    title: 'Numéro d\'urgence européen',
    subtitle: 'Tous pays UE',
    phone: '112',
    icon: 'globe',
    color: '#7c3aed',
    bg: '#7c3aed20',
    description: 'Numéro unique d\'urgence valable dans toute l\'Union Européenne.',
    emergency: true,
  },
  {
    id: 'bison',
    title: 'Bison Futé',
    subtitle: 'Infos trafic',
    phone: '3114',
    icon: 'navigate',
    color: Colors.primary,
    bg: Colors.primary + '20',
    description: 'Informations sur le trafic routier et les conditions de circulation.',
    emergency: false,
  },
];

const INSURANCE_PROVIDERS: InsuranceProvider[] = [
  { name: 'AXA Assistance', phone: '01 55 92 26 26', available: '24h/24', icon: 'shield-checkmark', color: '#0066cc' },
  { name: 'MAIF Assistance', phone: '05 49 73 73 73', available: '24h/24', icon: 'shield-checkmark', color: '#e30613' },
  { name: 'MACIF Assistance', phone: '05 49 32 82 82', available: '24h/24', icon: 'shield-checkmark', color: '#ff6600' },
  { name: 'MAAF Assistance', phone: '05 49 33 33 33', available: '24h/24', icon: 'shield-checkmark', color: '#007dc5' },
  { name: 'Groupama Assistance', phone: '05 62 88 40 40', available: '24h/24', icon: 'shield-checkmark', color: '#00813e' },
  { name: 'Eurofil Assistance', phone: '01 40 25 52 52', available: '24h/24', icon: 'shield-checkmark', color: '#0055a4' },
];

function ServiceCard({ service, onCall }: { service: ServiceContact; onCall: (s: ServiceContact) => void }) {
  return (
    <View style={[styles.serviceCard, service.emergency && styles.serviceCardEmergency]}>
      <LinearGradient
        colors={[service.bg, service.bg + '05']}
        style={styles.serviceCardGradient}
      >
        <View style={styles.serviceCardLeft}>
          <View style={[styles.serviceIconBox, { backgroundColor: service.color + '25', borderColor: service.color + '40' }]}>
            <Ionicons name={service.icon as any} size={28} color={service.color} />
          </View>
          <View style={styles.serviceInfo}>
            <View style={styles.serviceTitleRow}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              {service.emergency && (
                <View style={styles.emergencyBadge}>
                  <Text style={styles.emergencyBadgeText}>URGENCE</Text>
                </View>
              )}
            </View>
            <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {service.description}
            </Text>
          </View>
        </View>

        {service.phone && (
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: service.color }]}
            onPress={() => onCall(service)}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.callBtnNumber}>{service.phone}</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

export function AssistanceScreen() {
  const [showInsurance, setShowInsurance] = useState(false);

  function handleCall(service: ServiceContact) {
    if (!service.phone) return;
    Alert.alert(
      `Appeler ${service.title}`,
      `Composer le ${service.phone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: `Appeler le ${service.phone}`,
          onPress: () => Linking.openURL(`tel:${service.phone}`),
        },
      ]
    );
  }

  function handleCallInsurance(provider: InsuranceProvider) {
    Alert.alert(
      `Appeler ${provider.name}`,
      `Composer le ${provider.phone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appeler',
          onPress: () => Linking.openURL(`tel:${provider.phone.replace(/\s/g, '')}`),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Assistance</Text>
        <View style={styles.sosIndicator}>
          <View style={styles.sosDot} />
          <Text style={styles.sosText}>Disponible 24h/24</Text>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Main emergency services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services principaux</Text>
          {EMERGENCY_SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} onCall={handleCall} />
          ))}
        </View>

        {/* SOS banner */}
        <LinearGradient
          colors={[Colors.error, Colors.errorDark]}
          style={styles.sosBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="warning" size={24} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sosBannerTitle}>En cas d'accident</Text>
            <Text style={styles.sosBannerText}>
              Sécurisez les lieux, appelez le 15 (SAMU) ou le 18 (pompiers)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sosBannerBtn}
            onPress={() => Linking.openURL('tel:15')}
          >
            <Ionicons name="call" size={18} color={Colors.error} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Other services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autres services</Text>
          {ASSISTANCE_SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} onCall={handleCall} />
          ))}
        </View>

        {/* Insurance section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeaderBtn}
            onPress={() => setShowInsurance(!showInsurance)}
          >
            <Text style={styles.sectionTitle}>Assistance assurance</Text>
            <Ionicons
              name={showInsurance ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={styles.sectionSubtitle}>
            Numéros d'urgence des principales assurances
          </Text>

          {showInsurance && (
            <View style={styles.insuranceList}>
              {INSURANCE_PROVIDERS.map((provider) => (
                <TouchableOpacity
                  key={provider.name}
                  style={styles.insuranceCard}
                  onPress={() => handleCallInsurance(provider)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.insuranceIcon, { backgroundColor: provider.color + '20' }]}>
                    <Ionicons name={provider.icon as any} size={18} color={provider.color} />
                  </View>
                  <View style={styles.insuranceInfo}>
                    <Text style={styles.insuranceName}>{provider.name}</Text>
                    <Text style={styles.insuranceAvailable}>{provider.available}</Text>
                  </View>
                  <View style={styles.insuranceRight}>
                    <Text style={styles.insurancePhone}>{provider.phone}</Text>
                    <Ionicons name="call-outline" size={16} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick tip */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Conseil en cas de panne</Text>
            <Text style={styles.tipText}>
              Activez vos feux de détresse, placez le triangle de signalisation à 30m
              minimum et mettez votre gilet de sécurité avant de sortir du véhicule.
            </Text>
          </View>
        </View>

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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.headerBg,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: Colors.headerText },
  sosIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff15',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sosDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  sosText: { color: '#ffffffcc', fontSize: 11, fontWeight: '500' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  sectionSubtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },

  serviceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceCardEmergency: {
    shadowOpacity: 0.1,
    elevation: 4,
  },
  serviceCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: Colors.card,
  },
  serviceCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  serviceIconBox: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: { flex: 1 },
  serviceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  emergencyBadge: {
    backgroundColor: Colors.error,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  emergencyBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  serviceSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  serviceDescription: { fontSize: 11, color: Colors.textMuted, marginTop: 4, lineHeight: 15 },

  callBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
  },
  callBtnNumber: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },

  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  sosBannerTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sosBannerText: { color: '#ffffffcc', fontSize: 12, marginTop: 2, lineHeight: 16 },
  sosBannerBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },

  insuranceList: { gap: 8 },
  insuranceCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  insuranceIcon: { borderRadius: 10, padding: 8 },
  insuranceInfo: { flex: 1 },
  insuranceName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  insuranceAvailable: { fontSize: 11, color: Colors.success, marginTop: 1 },
  insuranceRight: { alignItems: 'flex-end', gap: 4 },
  insurancePhone: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },

  tipCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.accent + '10',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.accent + '25',
    alignItems: 'flex-start',
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  tipText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
});
