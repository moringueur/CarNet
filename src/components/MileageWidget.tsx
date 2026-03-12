import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Vehicle } from '../types';
import { formatMileage, computeAnnualMileage } from '../utils/formatting';
import { useVehicleStore } from '../store/vehicleStore';

interface Props {
  vehicle: Vehicle;
}

export function MileageWidget({ vehicle }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { addMileageEntry } = useVehicleStore();

  const sorted = [...vehicle.mileage].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const latestEntry = sorted[sorted.length - 1];
  const prevEntry = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const annualMileage = computeAnnualMileage(vehicle.mileage);

  const diffLast3Months = latestEntry && prevEntry
    ? latestEntry.value - prevEntry.value
    : null;

  async function handleSave() {
    const value = parseInt(inputValue.replace(/\D/g, ''), 10);
    if (!value || value <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un kilométrage valide.');
      return;
    }
    if (latestEntry && value < latestEntry.value) {
      Alert.alert('Erreur', 'Le kilométrage doit être supérieur au précédent relevé.');
      return;
    }
    await addMileageEntry(vehicle.id, {
      value,
      date: new Date().toISOString(),
    });
    setShowModal(false);
    setInputValue('');
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="speedometer" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Kilométrage Actuel</Text>
          </View>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.updateBtn}>
            <Ionicons name="create-outline" size={14} color={Colors.primary} />
            <Text style={styles.updateText}>Actualiser</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.mileageValue}>
          {latestEntry ? formatMileage(latestEntry.value) : '— km'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Sur 3 mois</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {diffLast3Months !== null ? `+${formatMileage(diffLast3Months)}` : '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Moyenne annuelle</Text>
            <Text style={styles.statValue}>
              {annualMileage > 0 ? formatMileage(annualMileage) + '/an' : '—'}
            </Text>
          </View>
        </View>

        {prevEntry && (
          <Text style={styles.lastEntry}>
            Dernier relevé {formatMileage(prevEntry.value)} il y a{' '}
            {Math.round(
              (new Date().getTime() - new Date(prevEntry.date).getTime()) /
                (1000 * 60 * 60 * 24 * 365)
            )}{' '}
            an(s)
          </Text>
        )}
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouveau relevé kilométrique</Text>
            <TextInput
              style={styles.input}
              placeholder="Kilométrage actuel"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
    padding: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updateText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  mileageValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    marginVertical: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stat: { flex: 1 },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  lastEntry: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: Colors.surfaceElevated },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnText: { color: '#000', fontWeight: '700' },
});
