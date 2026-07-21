import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RHSColors, borderRadius, shadows, typography } from '../../../lib/theme';
import { eKycApi } from '../api/eKycApi';
import { OcrResult } from '../types/ekyc';

const VERIFIED_KEY = 'identityVerified';

/**
 * Luồng eKYC theo VNPT eKYC (REST):
 *   1. OCR mặt trước CCCD  -> /EKyc/ocr
 *   2. Kiểm tra CCCD trùng -> /EKyc/check-citizen-id
 *   3. So khớp khuôn mặt   -> /EKyc/face-match
 *   4. Lưu & khóa profile  -> PUT /users/profile
 * (VNPT không hỗ trợ Liveness qua REST nên không có bước quay video.)
 */
type EKycStep = 'welcome' | 'ocr' | 'facematch' | 'complete';

export const EKycScreen = () => {
  const nav = useNavigation<any>();
  const [step, setStep] = useState<EKycStep>('welcome');
  const [busy, setBusy] = useState(false);
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [cccdUri, setCccdUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const started = useRef(false);

  /* Bước 1: Chụp CCCD -> OCR -> kiểm tra CCCD trùng */
  const shootCccd = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8, allowsEditing: false });
    if (r.canceled || !r.assets?.length) return;
    setBusy(true);
    try {
      const o = await eKycApi.ocr(r.assets[0].uri);
      setOcr(o);
      setCccdUri(r.assets[0].uri);

      if (o.id) {
        const check = await eKycApi.checkCitizenId(o.id);
        if (!check.available) {
          setBusy(false);
          Alert.alert('CCCD không khả dụng', check.message, [
            { text: 'Quay lại', style: 'cancel' },
            { text: 'Chụp lại', onPress: () => { setOcr(null); setCccdUri(null); } },
          ]);
          return;
        }
      }

      setStep('facematch');
    } catch (e: any) {
      Alert.alert('Lỗi OCR', e?.message ?? 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  /* Bước 2a: Chụp ảnh khuôn mặt */
  const takeSelfie = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    const p = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.front,
    });
    if (p.canceled || !p.assets?.length) return;
    setSelfieUri(p.assets[0].uri);
  };

  /* Bước 2b: face-match -> nếu khớp: lưu profile & hoàn tất */
  const verifyFaceMatch = async () => {
    if (!selfieUri) { Alert.alert('Chưa chụp ảnh khuôn mặt'); return; }
    if (!cccdUri) { Alert.alert('Thiếu ảnh CCCD'); return; }

    setBusy(true);
    try {
      const m = await eKycApi.faceMatch(selfieUri, cccdUri);
      if (!m.isMatch) {
        setBusy(false);
        Alert.alert(
          'Khuôn mặt không khớp',
          `Độ tương đồng: ${m.similarity ?? ''}%. Vui lòng chụp lại ảnh rõ nét hơn.`,
          [{ text: 'Chụp lại', onPress: () => setSelfieUri(null) }],
        );
        return;
      }

      await eKycApi.updateProfileFromOcr(ocr!);
      await AsyncStorage.setItem(VERIFIED_KEY, 'true');
      setBusy(false);
      setStep('complete');
    } catch (e: any) {
      setBusy(false);
      Alert.alert('Lỗi xác minh', e?.message ?? 'Vui lòng thử lại.');
    }
  };

  const close = () => {
    if (started.current && step !== 'complete') {
      Alert.alert('Dừng?', 'Mất tiến trình xác minh.', [
        { text: 'Tiếp tục', style: 'cancel' },
        { text: 'Thoát', style: 'destructive', onPress: () => { started.current = false; nav.goBack(); } },
      ]);
    } else {
      nav.goBack();
    }
  };

  const steps = [
    { k: 'ocr', l: 'CCCD' },
    { k: 'facematch', l: 'Khuôn mặt' },
  ];
  const stepOrder: EKycStep[] = ['ocr', 'facematch'];
  const completedCount = stepOrder.findIndex((s) => s === step);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.bar}>
        <View style={[st.stripe, { flex: 2, backgroundColor: RHSColors.red600 }]} />
        <View style={[st.stripe, { flex: 0.4, backgroundColor: RHSColors.amber600 }]} />
        <View style={[st.stripe, { flex: 2, backgroundColor: RHSColors.blue700 }]} />
      </View>
      <LinearGradient colors={['#0A3A85', '#1565C0', '#1E88E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.header}>
        <TouchableOpacity onPress={close} style={st.closeBtn}><Feather name="x" size={22} color="#fff" /></TouchableOpacity>
        <Text style={st.headerTitle}>Xác minh danh tính</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {step !== 'welcome' && step !== 'complete' && (
        <View style={st.stepBar}>
          {steps.map((stp, i) => {
            const isActive = completedCount >= 0 && i <= completedCount;
            const isDone = completedCount >= 0 && i < completedCount;
            return (
              <View key={stp.k} style={st.stepItem}>
                <View style={[st.stepDot, isActive && st.stepDotActive]}>
                  {isDone
                    ? <Feather name="check" size={12} color="#fff" />
                    : <Text style={[st.stepDotNum, isActive && { color: '#fff' }]}>{i + 1}</Text>}
                </View>
                <Text style={[st.stepLabel, isActive && st.stepLabelActive]}>{stp.l}</Text>
                {i < steps.length - 1 && <View style={[st.stepLine, isDone && st.stepLineActive]} />}
              </View>
            );
          })}
        </View>
      )}

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        {step === 'welcome' && (
          <View style={st.stepContent}>
            <View style={st.iconCircle}><Feather name="shield" size={52} color={RHSColors.blue700} /></View>
            <Text style={st.stepTitle}>Xác minh danh tính</Text>
            <Text style={st.stepDesc}>Xác thực điện tử qua VNPT eKYC — 2 bước:</Text>
            <View style={st.infoList}>
              <View style={st.infoItem}><Feather name="camera" size={18} color={RHSColors.blue700} /><Text style={st.infoText}>Chụp mặt trước CCCD gắn chip</Text></View>
              <View style={st.infoItem}><Feather name="user-check" size={18} color={RHSColors.blue700} /><Text style={st.infoText}>Chụp ảnh khuôn mặt & so khớp với CCCD</Text></View>
            </View>
            <TouchableOpacity style={st.primaryBtn} onPress={() => { started.current = true; setStep('ocr'); }} activeOpacity={0.85}>
              <Text style={st.primaryBtnText}>Bắt đầu</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'ocr' && (
          <View style={st.stepContent}>
            <View style={st.iconCircle}><Feather name="camera" size={46} color={RHSColors.blue700} /></View>
            <Text style={st.stepTitle}>Bước 1: Chụp CCCD</Text>
            <Text style={st.stepDesc}>Mặt trước CCCD, rõ nét, đủ 4 góc.</Text>
            {busy
              ? <View style={st.loadBox}><ActivityIndicator size="large" color={RHSColors.blue700} /><Text style={st.loadText}>Đang trích xuất thông tin...</Text></View>
              : (
                <TouchableOpacity style={st.primaryBtn} onPress={shootCccd} activeOpacity={0.85}>
                  <Feather name="camera" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={st.primaryBtnText}>Chụp CCCD</Text>
                </TouchableOpacity>
              )
            }
          </View>
        )}

        {step === 'facematch' && (
          <View style={st.stepContent}>
            <Text style={st.stepTitle}>Bước 2: Xác minh khuôn mặt</Text>
            <Text style={st.stepDesc}>Chụp ảnh khuôn mặt để so khớp với ảnh trên CCCD.</Text>

            {ocr && (
              <View style={st.ocrCard}>
                <View style={st.ocrRow}><Text style={st.ocrLabel}>Họ tên</Text><Text style={st.ocrValue}>{ocr.name || '—'}</Text></View>
                <View style={st.ocrRow}><Text style={st.ocrLabel}>Số CCCD</Text><Text style={st.ocrValue}>{ocr.id || '—'}</Text></View>
                {!!ocr.dob && <View style={st.ocrRow}><Text style={st.ocrLabel}>Ngày sinh</Text><Text style={st.ocrValue}>{ocr.dob}</Text></View>}
              </View>
            )}

            {busy ? (
              <View style={st.loadBox}>
                <ActivityIndicator size="large" color={RHSColors.blue700} />
                <Text style={st.loadText}>Đang so khớp & lưu hồ sơ...</Text>
              </View>
            ) : (
              <View style={st.sectionCard}>
                <View style={st.sectionHeader}>
                  <View style={[st.sectionBadge, selfieUri && { backgroundColor: RHSColors.green600 }]}>
                    {selfieUri ? <Feather name="check" size={14} color="#fff" /> : <Text style={st.sectionBadgeNum}>1</Text>}
                  </View>
                  <Text style={st.sectionTitle}>Chụp ảnh khuôn mặt</Text>
                </View>

                {selfieUri ? (
                  <>
                    <View style={st.doneRow}>
                      <Feather name="check-circle" size={20} color={RHSColors.green600} />
                      <Text style={st.doneText}>Ảnh đã chụp xong</Text>
                      <TouchableOpacity onPress={() => setSelfieUri(null)} style={st.retakeBtn}>
                        <Feather name="refresh-cw" size={14} color={RHSColors.blue700} />
                        <Text style={st.retakeText}>Chụp lại</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[st.primaryBtn, { marginTop: 14, width: '100%' }]} onPress={verifyFaceMatch}>
                      <Text style={st.primaryBtnText}>Xác nhận & So khớp</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={[st.primaryBtn, { marginTop: 8 }]} onPress={takeSelfie} activeOpacity={0.85}>
                    <Feather name="camera" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={st.primaryBtnText}>Chụp ảnh khuôn mặt</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {step === 'complete' && (
          <View style={st.stepContent}>
            <View style={[st.iconCircle, { backgroundColor: RHSColors.green50 }]}>
              <Feather name="check-circle" size={52} color={RHSColors.green600} />
            </View>
            <Text style={[st.stepTitle, { color: RHSColors.green600 }]}>Thành công!</Text>
            <Text style={st.stepDesc}>Xác minh danh tính hoàn tất. Thông tin CCCD đã được lưu và khóa trong hồ sơ.</Text>
            <TouchableOpacity style={st.primaryBtn} onPress={close}>
              <Text style={st.primaryBtnText}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  bar: { flexDirection: 'row', height: 4 },
  stripe: { height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  closeBtn: { padding: 4, marginRight: 10 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  stepBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', marginHorizontal: 14, marginTop: 14, borderRadius: borderRadius.lg, ...shadows.sm },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: RHSColors.grey200, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: RHSColors.grey300 },
  stepDotActive: { backgroundColor: RHSColors.blue700, borderColor: RHSColors.blue700 },
  stepDotNum: { fontSize: 11, fontWeight: '700', color: RHSColors.textMuted },
  stepLabel: { fontSize: 10, color: RHSColors.textMuted, marginLeft: 4 },
  stepLabelActive: { color: RHSColors.blue700, fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: RHSColors.grey200, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: RHSColors.blue700 },
  stepContent: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 12 },
  iconCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: RHSColors.blue50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  stepTitle: { ...typography.h2, color: RHSColors.text, marginBottom: 8, textAlign: 'center' },
  stepDesc: { ...typography.bodySmall, color: RHSColors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 10 },
  infoList: { width: '100%', marginBottom: 28 },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 18, backgroundColor: RHSColors.blue50, borderRadius: borderRadius.md, marginBottom: 10 },
  infoText: { ...typography.bodySmall, color: RHSColors.text, marginLeft: 12, fontWeight: '500', flex: 1 },
  primaryBtn: { backgroundColor: RHSColors.blue700, paddingHorizontal: 24, paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', ...shadows.md },
  primaryBtnText: { ...typography.button, color: '#fff' },
  loadBox: { alignItems: 'center', paddingVertical: 36 },
  loadText: { marginTop: 10, ...typography.bodySmall, color: RHSColors.textMuted },
  ocrCard: { width: '100%', backgroundColor: RHSColors.blue50, borderRadius: borderRadius.lg, padding: 14, marginBottom: 14 },
  ocrRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  ocrLabel: { ...typography.bodySmall, color: RHSColors.textMuted },
  ocrValue: { ...typography.bodySmall, color: RHSColors.text, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  sectionCard: { width: '100%', backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: 14, ...shadows.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: RHSColors.blue700, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sectionBadgeNum: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: RHSColors.text },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  doneText: { flex: 1, fontSize: 13, color: RHSColors.green600, fontWeight: '500' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: RHSColors.blue50 },
  retakeText: { fontSize: 12, color: RHSColors.blue700, fontWeight: '600' },
});
