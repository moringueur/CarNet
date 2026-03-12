import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useVehicleStore } from '../store/vehicleStore';

const FUEL_TYPES = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];

function formatPlateDisplay(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return clean.slice(0, 2) + '-' + clean.slice(2);
  return clean.slice(0, 2) + '-' + clean.slice(2, 5) + '-' + clean.slice(5, 7);
}

export function VehicleSearchScreen({ navigation }: any) {
  const [plate, setPlate] = useState('');
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuel, setFuel] = useState('Diesel');
  const { addVehicle } = useVehicleStore();

  function handlePlateChange(text: string) {
    const clean = text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setPlate(clean);
  }

  function validatePlate(p: string): boolean {
    const clean = p.replace(/-/g, '');
    return /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(clean) || /^[0-9]{1,4}[A-Z]{1,3}[0-9]{2}$/.test(clean);
  }

  function handleSearch() {
    if (!plate.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une plaque d\'immatriculation.');
      return;
    }
    setStep('form');
  }

  async function handleSave() {
    if (!brand.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Erreur', 'Veuillez entrer une année valide.');
      return;
    }
    await addVehicle({
      plate: plate.replace(/-/g, '').toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      year: yearNum,
      fuel,
    });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          {step === 'search' ? (
            <>
              <Text style={styles.title}>Trouver votre véhicule</Text>
              <Text style={styles.subtitle}>Entrez votre plaque d'immatriculation</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.plateInput}
                  value={plate}
                  onChangeText={handlePlateChange}
                  placeholder="AB-123-CD"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={9}
                />
                <Text style={styles.plateHint}>Format français : 2 lettres, 3 chiffres, 2 lettres</Text>
              </View>

              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={18} color={Colors.primary} />
                <Text style={styles.infoBannerText}>
                  Accédez instantanément à toutes les spécifications techniques
                </Text>
              </View>

              <View style={{ flex: 1 }} />

              <Text style={styles.readyText}>Prêt à découvrir votre véhicule ?</Text>
              <TouchableOpacity style={styles.mainBtn} onPress={handleSearch}>
                <Text style={styles.mainBtnText}>Trouver mon véhicule</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Informations véhicule</Text>
              <Text style={styles.subtitle}>Plaque : {formatPlateDisplay(plate)}</Text>

              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Marque *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={brand}
                    onChangeText={setBrand}
                    placeholder="ex: Peugeot"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Modèle *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={model}
                    onChangeText={setModel}
                    placeholder="ex: 208 1.5 BlueHDI 100"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Année *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={year}
                    onChangeText={setYear}
                    placeholder="ex: 2022"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Carburant</Text>
                  <View style={styles.fuelGrid}>
                    {FUEL_TYPES.map((f) => (
                      <TouchableOpacity
                        key={f}
                        style={[styles.fuelBtn, fuel === f && styles.fuelBtnActive]}
                        onPress={() => setFuel(f)}
                      >
                        <Text style={[styles.fuelBtnText, fuel === f && styles.fuelBtnTextActive]}>
                          {f}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.mainBtn} onPress={handleSave}>
                <Text style={styles.mainBtnText}>Ajouter le véhicule</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  plateInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  plateHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  infoBanner: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoBannerText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  readyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 32,
  },
  mainBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  form: { gap: 16, marginBottom: 24 },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fuelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fuelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fuelBtnActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  fuelBtnText: { color: Colors.textSecondary, fontSize: 13 },
  fuelBtnTextActive: { color: Colors.primary, fontWeight: '600' },
});
