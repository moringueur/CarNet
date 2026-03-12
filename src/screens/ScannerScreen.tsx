import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { Colors } from '../constants/colors';
import { useInvoiceStore } from '../store/invoiceStore';
import { InvoiceCategory } from '../types';
import { formatCurrency } from '../utils/formatting';

const CATEGORIES: { key: InvoiceCategory; label: string }[] = [
  { key: 'maintenance', label: 'Entretien' },
  { key: 'repair', label: 'Réparation' },
  { key: 'fuel', label: 'Carburant' },
  { key: 'insurance', label: 'Assurance' },
  { key: 'tax', label: 'Taxes' },
  { key: 'other', label: 'Autre' },
];

// Simulated OCR extraction
function mockOCR(imageUri: string): Promise<{ text: string; amount?: number; date?: string; garage?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: 'FACTURE\nGarage Martin - 12 rue de la Paix\nDate : ' + new Date().toLocaleDateString('fr-FR') + '\nTravaux : Vidange + filtre\nPieces : 45.00 EUR\nMO : 60.00 EUR\nTotal TTC : 105.00 EUR',
        amount: 105.0,
        date: new Date().toISOString().split('T')[0],
        garage: 'Garage Martin',
      });
    }, 1500);
  });
}

export function ScannerScreen({ navigation, route }: any) {
  const vehicleId = route?.params?.vehicleId;
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'camera' | 'preview' | 'form'>('camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // OCR/form state
  const [ocrText, setOcrText] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [garage, setGarage] = useState('');
  const [category, setCategory] = useState<InvoiceCategory>('maintenance');

  const { addInvoice, saveImageToDocuments } = useInvoiceStore();

  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setMode('preview');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    }
  }

  async function handlePickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
      setMode('preview');
    }
  }

  async function handleProcessOCR() {
    if (!capturedUri) return;
    setIsProcessing(true);
    try {
      const result = await mockOCR(capturedUri);
      setOcrText(result.text);
      if (result.amount) setAmount(result.amount.toString());
      if (result.date) setDate(result.date);
      if (result.garage) {
        setGarage(result.garage);
        setTitle('Facture ' + result.garage);
      }
      setMode('form');
    } catch {
      Alert.alert('Erreur', "L'extraction OCR a échoué.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !vehicleId) {
      Alert.alert('Erreur', 'Veuillez renseigner un titre.');
      return;
    }
    try {
      let savedUri = capturedUri;
      if (capturedUri) {
        const filename = `invoice_${Date.now()}.jpg`;
        savedUri = await saveImageToDocuments(capturedUri, filename);
      }
      await addInvoice({
        vehicleId,
        title: title.trim(),
        amount: parseFloat(amount) || 0,
        date: date || new Date().toISOString().split('T')[0],
        category,
        garage: garage.trim() || undefined,
        imageUri: savedUri || undefined,
        ocrText: ocrText || undefined,
      });
      Alert.alert('Succès', 'Facture enregistrée !', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer la facture.");
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.permissionTitle}>Accès caméra requis</Text>
          <Text style={styles.permissionText}>
            CarNet a besoin de votre caméra pour scanner les factures.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Autoriser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryFallback} onPress={handlePickFromGallery}>
            <Text style={styles.galleryFallbackText}>Choisir depuis la galerie</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {mode === 'camera' && (
        <View style={{ flex: 1 }}>
          <CameraView style={styles.camera} ref={cameraRef} facing="back">
            {/* Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Scanner une facture</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Document frame overlay */}
            <View style={styles.frameContainer}>
              <View style={styles.frame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.frameHint}>Positionnez la facture dans le cadre</Text>
            </View>

            {/* Bottom controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
                <Ionicons name="images" size={24} color={Colors.white} />
                <Text style={styles.galleryBtnText}>Galerie</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>

              <View style={{ width: 70 }} />
            </View>
          </CameraView>

          {/* Bottom options */}
          <View style={styles.bottomOptions}>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setMode('form')}>
              <Ionicons name="create" size={18} color={Colors.primary} />
              <Text style={styles.optionBtnText}>Saisie manuelle</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {mode === 'preview' && capturedUri && (
        <View style={{ flex: 1 }}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setMode('camera')}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Aperçu</Text>
            <View style={{ width: 22 }} />
          </View>

          <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeBtn} onPress={() => setMode('camera')}>
              <Ionicons name="camera" size={18} color={Colors.textSecondary} />
              <Text style={styles.retakeBtnText}>Reprendre</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ocrBtn}
              onPress={handleProcessOCR}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="text" size={18} color="#000" />
                  <Text style={styles.ocrBtnText}>Recadrage automatique</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.noOcrBtn} onPress={() => setMode('form')}>
            <Text style={styles.noOcrBtnText}>Aucun recadrage</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'form' && (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setMode(capturedUri ? 'preview' : 'camera')}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.formTitle}>Détails de la facture</Text>
            <View style={{ width: 22 }} />
          </View>

          {capturedUri && (
            <Image
              source={{ uri: capturedUri }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          )}

          {ocrText ? (
            <View style={styles.ocrResult}>
              <View style={styles.ocrResultHeader}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.ocrResultTitle}>Texte extrait (OCR)</Text>
              </View>
              <Text style={styles.ocrResultText} numberOfLines={4}>
                {ocrText}
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Titre *</Text>
              <TextInput
                style={styles.fieldInput}
                value={title}
                onChangeText={setTitle}
                placeholder="ex: Vidange + filtres"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Montant (€)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={date}
                  onChangeText={setDate}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Garage / Prestataire</Text>
              <TextInput
                style={styles.fieldInput}
                value={garage}
                onChangeText={setGarage}
                placeholder="Nom du garage"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Catégorie</Text>
              <View style={styles.catGrid}>
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
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="save" size={18} color="#000" />
            <Text style={styles.saveBtnText}>Enregistrer la facture</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  camera: { flex: 1 },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  frameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  frame: {
    width: '100%',
    aspectRatio: 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  frameHint: {
    color: Colors.white,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    backgroundColor: '#00000066',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  galleryBtn: { alignItems: 'center', gap: 4 },
  galleryBtnText: { color: Colors.white, fontSize: 11 },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff40',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
  },
  bottomOptions: {
    backgroundColor: Colors.background,
    padding: 16,
    alignItems: 'center',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  permissionText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  permissionBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  permissionBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  galleryFallback: { marginTop: 8 },
  galleryFallbackText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  previewTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  previewImage: { flex: 1, marginHorizontal: 16, borderRadius: 12 },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 8,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retakeBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  ocrBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 14,
  },
  ocrBtnText: { color: '#000', fontWeight: '700' },
  noOcrBtn: { alignItems: 'center', paddingVertical: 12 },
  noOcrBtnText: { color: Colors.textSecondary, fontSize: 14 },
  formContainer: { flex: 1 },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  thumbnailImage: {
    height: 140,
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    alignSelf: 'stretch',
  } as any,
  ocrResult: {
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  ocrResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  ocrResultTitle: { color: Colors.success, fontSize: 12, fontWeight: '600' },
  ocrResultText: { color: Colors.textSecondary, fontSize: 11, lineHeight: 16 },
  form: { paddingHorizontal: 16, gap: 14 },
  formRow: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBtnActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  catBtnText: { color: Colors.textSecondary, fontSize: 12 },
  catBtnTextActive: { color: Colors.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
