import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Vehicle } from '../types';

interface Props {
  vehicle: Vehicle;
  onPress?: () => void;
}

export function VehicleCard({ vehicle, onPress }: Props) {
  const latestMileage = vehicle.mileage.length > 0
    ? Math.max(...vehicle.mileage.map((m) => m.value))
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <LinearGradient
        colors={['#1e2d40', '#0f1923']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.vehicleName}>
              {vehicle.brand} {vehicle.model}
            </Text>
            <Text style={styles.plate}>{vehicle.plate}</Text>
          </View>
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{vehicle.year}</Text>
          </View>
        </View>

        {vehicle.imageUri ? (
          <Image source={{ uri: vehicle.imageUri }} style={styles.vehicleImage} resizeMode="contain" />
        ) : (
          <View style={styles.vehicleImagePlaceholder}>
            <Ionicons name="car-sport" size={80} color={Colors.primary} />
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.fuelBadge}>
            <Ionicons name="flame" size={12} color={Colors.primary} />
            <Text style={styles.fuelText}>{vehicle.fuel}</Text>
          </View>
          {latestMileage && (
            <Text style={styles.mileageText}>
              {new Intl.NumberFormat('fr-FR').format(latestMileage)} km
            </Text>
          )}
          <TouchableOpacity style={styles.detailsBtn} onPress={onPress}>
            <Text style={styles.detailsBtnText}>Voir les détails</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    padding: 16,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  plate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  yearBadge: {
    backgroundColor: Colors.primary + '30',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  yearText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  vehicleImage: {
    width: '100%',
    height: 110,
    marginVertical: 8,
  },
  vehicleImagePlaceholder: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  fuelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fuelText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '500',
  },
  mileageText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  detailsBtn: {
    backgroundColor: Colors.primary + '25',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  detailsBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
});
