import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useInvoiceStore } from '../store/invoiceStore';
import { useVehicleStore } from '../store/vehicleStore';
import { formatDate, formatCurrency } from '../utils/formatting';
import { SaleTransfer } from '../types';

export function SaleTransferScreen({ navigation, route }: any) {
  const vehicleId = route?.params?.vehicleId;
  const [tab, setTab] = useState<'generate' | 'verify'>('generate');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [generatedTransfer, setGeneratedTransfer] = useState<SaleTransfer | null>(null);
  const [verifiedTransfer, setVerifiedTransfer] = useState<SaleTransfer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { createSaleTransfer, verifySaleCode, markTransferUsed, saleTransfers, getInvoicesByVehicle } =
    useInvoiceStore();
  const { getActiveVehicle, vehicles } = useVehicleStore();

  const vehicle = vehicleId
    ? vehicles.find((v) => v.id === vehicleId) || getActiveVehicle()
    : getActiveVehicle();

  const existingTransfers = saleTransfers.filter((t) => t.vehicleId === vehicleId && !t.used);
  const invoices = vehicle ? getInvoicesByVehicle(vehicle.id) : [];

  async function handleGenerateCode() {
    if (!vehicle) return;
    setIsLoading(true);
    try {
      const transfer = await createSaleTransfer(vehicle.id, buyerEmail.trim() || undefined);
      setGeneratedTransfer(transfer);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyCode() {
    if (!generatedTransfer) return;
    Clipboard.setString(generatedTransfer.code);
    Alert.alert('Copié !', 'Le code a été copié dans le presse-papiers.');
  }

  async function handleShareCode() {
    if (!generatedTransfer || !vehicle) return;
    const message =
      `🚗 Historique d'entretien - ${vehicle.brand} ${vehicle.model}\n\n` +
      `Code de transfert sécurisé : ${generatedTransfer.code}\n\n` +
      `Ce code vous permet d'accéder à l'historique complet d'entretien du véhicule.\n` +
      `Valide jusqu'au : ${formatDate(generatedTransfer.expiresAt)}\n\n` +
      `📱 Utilisez l'application CarNet pour vérifier ce code.`;
    await Share.share({ message });
  }

  function handleVerifyCode() {
    const code = verifyCode.trim().toUpperCase();
    if (code.length < 6) {
      Alert.alert('Erreur', 'Veuillez entrer un code valide.');
      return;
    }
    const transfer = verifySaleCode(code);
    if (transfer) {
      setVerifiedTransfer(transfer);
    } else {
      Alert.alert('Code invalide', 'Ce code est invalide, expiré ou déjà utilisé.');
    }
  }

  async function handleConfirmTransfer() {
    if (!verifiedTransfer) return;
    Alert.alert(
      'Confirmer',
      'Voulez-vous marquer ce transfert comme utilisé ? Le dossier sera déverrouillé pour l\'acheteur.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await markTransferUsed(verifiedTransfer.id);
            Alert.alert('Succès', 'Le dossier a été transféré avec succès !');
            setVerifiedTransfer(null);
            setVerifyCode('');
          },
        },
      ]
    );
  }

  const verifiedVehicle = verifiedTransfer
    ? vehicles.find((v) => v.id === verifiedTransfer.vehicleId)
    : null;

  const verifiedInvoices = verifiedTransfer
    ? getInvoicesByVehicle(verifiedTransfer.vehicleId)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Vente sécurisée</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tab selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'generate' && styles.tabBtnActive]}
          onPress={() => setTab('generate')}
        >
          <Ionicons name="key" size={16} color={tab === 'generate' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabBtnText, tab === 'generate' && styles.tabBtnTextActive]}>
            Générer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'verify' && styles.tabBtnActive]}
          onPress={() => setTab('verify')}
        >
          <Ionicons name="shield-checkmark" size={16} color={tab === 'verify' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabBtnText, tab === 'verify' && styles.tabBtnTextActive]}>
            Vérifier
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'generate' ? (
          <>
            {/* Info card */}
            <LinearGradient
              colors={[Colors.primary + '20', Colors.card]}
              style={styles.infoCard}
            >
              <View style={styles.infoIconRow}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.infoTitle}>Transfert sécurisé du dossier</Text>
              <Text style={styles.infoText}>
                Générez un code unique à partager avec l'acheteur. Ce code lui donnera accès à
                l'historique complet d'entretien et toutes les factures du véhicule.
              </Text>
            </LinearGradient>

            {/* Vehicle summary */}
            {vehicle && (
              <View style={styles.vehicleSummary}>
                <Ionicons name="car-sport" size={22} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehicleName}>
                    {vehicle.brand} {vehicle.model} {vehicle.year}
                  </Text>
                  <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
                </View>
                <View style={styles.invoiceCount}>
                  <Text style={styles.invoiceCountValue}>{invoices.length}</Text>
                  <Text style={styles.invoiceCountLabel}>factures</Text>
                </View>
              </View>
            )}

            {/* Generate form */}
            {!generatedTransfer ? (
              <View style={styles.generateForm}>
                <Text style={styles.fieldLabel}>Email de l'acheteur (optionnel)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={buyerEmail}
                  onChangeText={setBuyerEmail}
                  placeholder="acheteur@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.generateBtn, isLoading && styles.generateBtnDisabled]}
                  onPress={handleGenerateCode}
                  disabled={isLoading || !vehicle}
                >
                  <Ionicons name="key" size={20} color="#000" />
                  <Text style={styles.generateBtnText}>Générer le code de vente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Code de transfert</Text>
                <View style={styles.codeDisplay}>
                  {generatedTransfer.code.split('').map((char, i) => (
                    <View key={i} style={styles.codeChar}>
                      <Text style={styles.codeCharText}>{char}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.codeExpiry}>
                  Valide jusqu'au {formatDate(generatedTransfer.expiresAt)}
                </Text>

                <View style={styles.codeActions}>
                  <TouchableOpacity style={styles.codeActionBtn} onPress={handleCopyCode}>
                    <Ionicons name="copy" size={18} color={Colors.primary} />
                    <Text style={styles.codeActionText}>Copier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.codeActionBtn, styles.shareCodeBtn]} onPress={handleShareCode}>
                    <Ionicons name="share-social" size={18} color="#000" />
                    <Text style={[styles.codeActionText, { color: '#000' }]}>Partager</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.newCodeBtn}
                  onPress={() => setGeneratedTransfer(null)}
                >
                  <Text style={styles.newCodeBtnText}>Générer un nouveau code</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Existing codes */}
            {existingTransfers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Codes actifs</Text>
                {existingTransfers.map((t) => (
                  <View key={t.id} style={styles.existingCode}>
                    <Text style={styles.existingCodeText}>{t.code}</Text>
                    <Text style={styles.existingCodeExpiry}>
                      Expire le {formatDate(t.expiresAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Verify tab */}
            <LinearGradient
              colors={[Colors.accent + '20', Colors.card]}
              style={styles.infoCard}
            >
              <View style={styles.infoIconRow}>
                <Ionicons name="search" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.infoTitle}>Vérifier un dossier</Text>
              <Text style={styles.infoText}>
                En tant qu'acheteur, entrez le code fourni par le vendeur pour accéder à
                l'historique complet du véhicule.
              </Text>
            </LinearGradient>

            <View style={styles.generateForm}>
              <Text style={styles.fieldLabel}>Code de vérification</Text>
              <TextInput
                style={[styles.fieldInput, styles.codeInput]}
                value={verifyCode}
                onChangeText={(t) => setVerifyCode(t.toUpperCase())}
                placeholder="XXXXXXXX"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity style={styles.generateBtn} onPress={handleVerifyCode}>
                <Ionicons name="search" size={20} color="#000" />
                <Text style={styles.generateBtnText}>Vérifier le code</Text>
              </TouchableOpacity>
            </View>

            {verifiedTransfer && verifiedVehicle && (
              <View style={styles.verifiedCard}>
                <View style={styles.verifiedHeader}>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                  <Text style={styles.verifiedTitle}>Code valide !</Text>
                </View>
                <View style={styles.vehicleSummary}>
                  <Ionicons name="car-sport" size={20} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>
                      {verifiedVehicle.brand} {verifiedVehicle.model} {verifiedVehicle.year}
                    </Text>
                    <Text style={styles.vehiclePlate}>{verifiedVehicle.plate}</Text>
                  </View>
                </View>

                <View style={styles.invoicesList}>
                  <Text style={styles.sectionTitle}>
                    {verifiedInvoices.length} facture{verifiedInvoices.length !== 1 ? 's' : ''} incluses
                  </Text>
                  {verifiedInvoices.slice(0, 5).map((inv) => (
                    <View key={inv.id} style={styles.invoiceItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.invoiceItemTitle}>{inv.title}</Text>
                        <Text style={styles.invoiceItemDate}>{formatDate(inv.date)}</Text>
                      </View>
                      <Text style={styles.invoiceItemAmount}>{formatCurrency(inv.amount)}</Text>
                    </View>
                  ))}
                  {verifiedInvoices.length > 5 && (
                    <Text style={styles.moreInvoices}>
                      +{verifiedInvoices.length - 5} autres factures...
                    </Text>
                  )}
                </View>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmTransfer}>
                  <Ionicons name="checkmark" size={20} color="#000" />
                  <Text style={styles.confirmBtnText}>Confirmer la réception</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  screenTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: Colors.primary + '20', borderWidth: 1, borderColor: Colors.primary + '40' },
  tabBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  tabBtnTextActive: { color: Colors.primary, fontWeight: '700' },
  content: { flex: 1 },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  infoIconRow: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 16,
    padding: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  vehicleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  vehicleName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  vehiclePlate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontFamily: 'monospace' },
  invoiceCount: { alignItems: 'center' },
  invoiceCountValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  invoiceCountLabel: { fontSize: 11, color: Colors.textSecondary },
  generateForm: { paddingHorizontal: 16, gap: 12 },
  fieldLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  codeCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  codeLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  codeDisplay: { flexDirection: 'row', gap: 6 },
  codeChar: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
    width: 36,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  codeCharText: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  codeExpiry: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  codeActions: { flexDirection: 'row', gap: 10, width: '100%' },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  shareCodeBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  codeActionText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  newCodeBtn: { marginTop: 4 },
  newCodeBtnText: { color: Colors.textMuted, fontSize: 13 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  existingCode: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  existingCodeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 3,
  },
  existingCodeExpiry: { color: Colors.textMuted, fontSize: 11 },
  verifiedCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.success + '30',
    gap: 14,
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifiedTitle: { fontSize: 18, fontWeight: '700', color: Colors.success },
  invoicesList: { gap: 8 },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  invoiceItemTitle: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  invoiceItemDate: { fontSize: 11, color: Colors.textSecondary },
  invoiceItemAmount: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  moreInvoices: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  confirmBtn: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
