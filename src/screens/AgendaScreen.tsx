import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { useVehicleStore } from '../store/vehicleStore';
import { MaintenanceTask, MaintenanceCategory } from '../types';
import { getCategoryLabel, getCategoryIcon, formatDate, formatMileage } from '../utils/formatting';

const CATEGORIES: { key: MaintenanceCategory; label: string }[] = [
  { key: 'oil_change', label: 'Vidange' },
  { key: 'tires', label: 'Pneus' },
  { key: 'brakes', label: 'Freins' },
  { key: 'technical_inspection', label: 'Contrôle technique' },
  { key: 'timing_belt', label: 'Courroie' },
  { key: 'air_filter', label: 'Filtre air' },
  { key: 'battery', label: 'Batterie' },
  { key: 'other', label: 'Autre' },
];

function TaskItem({ task, onComplete, onDelete }: { task: MaintenanceTask; onComplete: () => void; onDelete: () => void }) {
  const statusColor = {
    overdue: Colors.error,
    upcoming: Colors.warning,
    pending: Colors.textMuted,
    completed: Colors.success,
  }[task.status];

  return (
    <View style={[styles.taskItem, { borderLeftColor: statusColor }]}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <Ionicons
            name={getCategoryIcon(task.category) as any}
            size={18}
            color={statusColor}
          />
          <Text style={styles.taskTitle}>{task.title}</Text>
        </View>
        <View style={styles.taskActions}>
          {task.status !== 'completed' && (
            <TouchableOpacity onPress={onComplete} style={styles.completeBtn}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.taskMeta}>
        {task.dueDate && (
          <View style={styles.metaTag}>
            <Ionicons name="calendar" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(task.dueDate)}</Text>
          </View>
        )}
        {task.dueMileage && (
          <View style={styles.metaTag}>
            <Ionicons name="speedometer" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatMileage(task.dueMileage)}</Text>
          </View>
        )}
        {task.cost && (
          <View style={styles.metaTag}>
            <Ionicons name="cash" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{task.cost}€</Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {{ overdue: 'En retard', upcoming: 'Bientôt', pending: 'Planifié', completed: 'Terminé' }[task.status]}
          </Text>
        </View>
      </View>
      {task.garage && (
        <Text style={styles.garageText}>📍 {task.garage}</Text>
      )}
    </View>
  );
}

export function AgendaScreen({ navigation }: any) {
  const { getActiveVehicle } = useVehicleStore();
  const { getTasksByVehicle, addTask, deleteTask, completeTask } = useMaintenanceStore();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming' | 'completed'>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('oil_change');
  const [dueDate, setDueDate] = useState('');
  const [dueMileage, setDueMileage] = useState('');
  const [cost, setCost] = useState('');
  const [garage, setGarage] = useState('');

  const vehicle = getActiveVehicle();
  const allTasks = vehicle ? getTasksByVehicle(vehicle.id) : [];

  const filteredTasks = allTasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const counts = {
    all: allTasks.length,
    overdue: allTasks.filter((t) => t.status === 'overdue').length,
    upcoming: allTasks.filter((t) => t.status === 'upcoming').length,
    completed: allTasks.filter((t) => t.status === 'completed').length,
  };

  async function handleAddTask() {
    if (!title.trim() || !vehicle) return;
    await addTask({
      vehicleId: vehicle.id,
      title: title.trim(),
      category,
      dueDate: dueDate || undefined,
      dueMileage: dueMileage ? parseInt(dueMileage, 10) : undefined,
      cost: cost ? parseFloat(cost) : undefined,
      garage: garage.trim() || undefined,
      status: 'pending',
    });
    setShowModal(false);
    setTitle('');
    setDueDate('');
    setDueMileage('');
    setCost('');
    setGarage('');
  }

  async function handleComplete(taskId: string) {
    await completeTask(taskId, new Date().toISOString());
  }

  async function handleDelete(taskId: string) {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette tâche ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteTask(taskId) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>Agenda</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {(['all', 'overdue', 'upcoming', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {{ all: 'Tous', overdue: 'En retard', upcoming: 'Bientôt', completed: 'Terminés' }[f]}
            </Text>
            {counts[f] > 0 && (
              <View style={[styles.badge, filter === f && styles.badgeActive]}>
                <Text style={[styles.badgeText, filter === f && styles.badgeTextActive]}>
                  {counts[f]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredTasks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune tâche</Text>
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Text style={styles.emptyAction}>Ajouter une tâche d'entretien</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={() => handleComplete(task.id)}
              onDelete={() => handleDelete(task.id)}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle tâche</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Titre *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="ex: Vidange moteur"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Catégorie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {CATEGORIES.map((c) => (
                      <TouchableOpacity
                        key={c.key}
                        style={[styles.catBtn, category === c.key && styles.catBtnActive]}
                        onPress={() => setCategory(c.key)}
                      >
                        <Text style={[styles.catBtnText, category === c.key && styles.catBtnTextActive]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Date d'échéance</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="AAAA-MM-JJ"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Kilométrage</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={dueMileage}
                    onChangeText={setDueMileage}
                    placeholder="ex: 90000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Coût (€)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={cost}
                    onChangeText={setCost}
                    placeholder="ex: 120"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Garage</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={garage}
                    onChangeText={setGarage}
                    placeholder="ex: Garage Dupont"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddTask}>
                <Text style={styles.saveBtnText}>Ajouter la tâche</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
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
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 8,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: { paddingLeft: 16, marginBottom: 8, flexGrow: 0 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  badge: {
    backgroundColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeActive: { backgroundColor: Colors.primary + '30' },
  badgeText: { color: Colors.textSecondary, fontSize: 11 },
  badgeTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: 16 },
  taskItem: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  taskActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  completeBtn: {},
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' },
  metaTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.textSecondary, fontSize: 12 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '600' },
  garageText: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptyAction: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  formField: { marginBottom: 14 },
  formRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  fieldInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBtnActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  catBtnText: { color: Colors.textSecondary, fontSize: 12 },
  catBtnTextActive: { color: Colors.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
