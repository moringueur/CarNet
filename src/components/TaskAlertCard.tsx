import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { MaintenanceTask } from '../types';
import { getCategoryLabel, formatRelativeDate } from '../utils/formatting';

interface Props {
  tasks: MaintenanceTask[];
  onPress?: () => void;
}

export function TaskAlertCard({ tasks, onPress }: Props) {
  const overdue = tasks.filter((t) => t.status === 'overdue');
  const upcoming = tasks.filter((t) => t.status === 'upcoming');

  if (overdue.length === 0 && upcoming.length === 0) return null;

  const isAlert = overdue.length > 0;

  return (
    <TouchableOpacity
      style={[styles.container, isAlert ? styles.alertBorder : styles.warningBorder]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: isAlert ? Colors.error + '20' : Colors.warning + '20' }]}>
        <Ionicons
          name={isAlert ? 'warning' : 'time'}
          size={20}
          color={isAlert ? Colors.error : Colors.warning}
        />
      </View>
      <View style={styles.content}>
        {overdue.length > 0 && (
          <Text style={styles.alertText}>
            {overdue.length} tâche{overdue.length > 1 ? 's' : ''} en retard
          </Text>
        )}
        {upcoming.length > 0 && (
          <Text style={styles.upcomingText}>
            {upcoming.length} échéance{upcoming.length > 1 ? 's' : ''} prochaine{upcoming.length > 1 ? 's' : ''}
          </Text>
        )}
        {overdue.length > 0 && (
          <Text style={styles.taskName}>{getCategoryLabel(overdue[0].category)}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 3,
  },
  alertBorder: { borderLeftColor: Colors.error },
  warningBorder: { borderLeftColor: Colors.warning },
  iconBox: {
    borderRadius: 8,
    padding: 6,
  },
  content: { flex: 1 },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  upcomingText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500',
  },
  taskName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
