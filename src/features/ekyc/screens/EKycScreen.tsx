import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RHSColors, borderRadius, shadows, typography } from '../../../lib/theme';
import { eKycApi, OcrResult } from '../api/eKycApi';

const VERIFIED_KEY = 'identityVerified';
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_FILE_SIZE_BYTES = 8_000_000;
const RECORD_DURATION_SEC = 4; // giây

type EKycStep = 'welcome' | 'ocr' | 'facematch' | 'liveness' | 'complete' | 'failed';

/* ── Component chính ──────────────────────────────────────── */
export const EKycScreen = () => {
  const nav = useNavigation<any>();
  const [step, setStep] = useState<EKycStep>('welcome');
  const [busy, setBusy] = useState(false);
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [cccdUri, setCccdUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const started = useRef(false);
  const cam = useRef<CameraView>(null);
  const [camReady, setCamReady] = useState(false);
  const [camPerm, setCamPerm] = useState<boolean | null>(null);

  useEffect(() => { if ((step === 'liveness') && camPerm === null) reqPerm(); }, [step, camPerm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cam.current) { try { cam.current.stopRecording(); } catch {} }
    };
  }, []);

  const reqPerm = async () => {
    const c = await Camera.requestCameraPermissionsAsync();
    if (c.status !== 'granted') { Alert.alert('Cần quyền camera'); setCamPerm(false); return; }
    const m = await Camera.requestMicrophonePermissionsAsync();
    if (m.status !== 'granted') { Alert.alert('Cần quyền ghi âm'); setCamPerm(false); return; }
    setCamPerm(true);
  };

  /* 1. Chụp CCCD + OCR → Kiểm tra CCCD trùng → Qua bước facematch */
  const shootCccd = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8, allowsEditing: false });
    if (r.canceled || !r.assets?.length) return;
    setBusy(true);
    try {
      // B1: OCR
      const o = await eKycApi.ocr(r.assets[0].uri);
      setOcr(o);
      setCccdUri(r.assets[0].uri);

      // B2: Kiểm tra CCCD đã tồn tại trong hệ thống chưa
      if (o.id) {
        const check = await eKycApi.checkCitizenId(o.id);
        if (!check.available) {
          setBusy(false);
          Alert.alert(
            'CCCD không khả dụng',
            check.message,
            [
              { text: 'Quay lại', style: 'cancel' },
              { text: 'Chụp lại', onPress: () => { setOcr(null); setCccdUri(null); } },
            ]
          );
          return;
        }
      }

      setStep('facematch');
    } catch (e: any) {
      Alert.alert('Lỗi OCR', e?.message ?? 'Vui lòng thử lại.');
    }
    finally { setBusy(false); }
  };

  /* 2a. Chụp ảnh khuôn mặt */
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

  /* 2b. Gọi face-match so sánh selfie với CCCD */
  const verifyFaceMatch = async () => {
    if (!selfieUri) { Alert.alert('Chưa chụp ảnh khuôn mặt'); return; }
    if (!cccdUri || cccdUri === 'skip') { Alert.alert('Thiếu ảnh CCCD'); return; }

    setBusy(true);
    try {
      const m = await eKycApi.faceMatch(selfieUri, cccdUri);
      setBusy(false);
      if (!m.isMatch) {
        Alert.alert('Khuôn mặt không khớp', `Similarity: ${m.similarity ?? ''}`, [
          { text: 'Chụp lại', onPress: () => setSelfieUri(null) },
        ]);
        return;
      }
      setStep('liveness');
    } catch (e: any) {
      setBusy(false);
      Alert.alert('Lỗi face-match', e?.message ?? 'Vui lòng thử lại.');
    }
  };

  /* 3. Quay video 5s → gọi liveness luôn */
  const startRecording = async () => {
    if (!cam.current || !camReady || isRecording) return;

    setVideoUri(null);
    setIsRecording(true);

    try {
      // Sử dụng maxDuration để tự động dừng sau RECORD_DURATION_SEC (5s)
      const v = await cam.current.recordAsync({
        maxDuration: RECORD_DURATION_SEC,
      });

      setIsRecording(false);
      if (!v?.uri) { Alert.alert('Không lấy được file video'); return; }
      setVideoUri(v.uri);

      // Quay xong → tự động gửi lên liveness API (kèm ảnh selfie từ bước 2)
      uploadLiveness(v.uri, selfieUri!);
    } catch (e: any) {
      setIsRecording(false);
      if (e?.message !== 'Recording cancelled') {
        Alert.alert('Không quay được video', e?.message ?? '');
      }
    }
  };

  /* Gửi video + ảnh selfie lên API liveness */
  const uploadLiveness = async (videoUri: string, cmndImageUri: string) => {
    setBusy(true);
    try {
      const live = await eKycApi.liveness(videoUri, cmndImageUri);
      if (!live.isLive) {
        setBusy(false);
        Alert.alert('Không phải người thật', `Spoof probability: ${live.spoofProbability ?? ''}`, [
          { text: 'Quay lại', onPress: () => setVideoUri(null) },
        ]);
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

  const reset = (s: EKycStep) => {
    if (s === 'welcome') { setOcr(null); setCccdUri(null); setVideoUri(null); setSelfieUri(null); started.current = false; }
    setStep(s);
  };

  const close = () => {
    if (started.current && step !== 'complete' && step !== 'failed')
      Alert.alert('Dừng?', 'Mất tiến trình.', [
        { text: 'Tiếp tục', style: 'cancel' },
        { text: 'Thoát', style: 'destructive', onPress: () => { started.current = false; nav.goBack(); } },
      ]);
    else nav.goBack();
  };

  /* ── Step indicator ── */
  const steps = [
    { k: 'ocr', l: 'CCCD' },
    { k: 'facematch', l: 'Khuôn mặt' },
    { k: 'liveness', l: 'Liveness' },
  ];

  const stepOrder: EKycStep[] = ['ocr', 'facematch', 'liveness'];
  const completedCount = stepOrder.findIndex(s => s === step);

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

      {step !== 'welcome' && step !== 'complete' && step !== 'failed' && (
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
                {i < 2 && <View style={[st.stepLine, isDone && st.stepLineActive]} />}
              </View>
            );
          })}
        </View>
      )}

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Welcome ── */}
        {step === 'welcome' && (
          <View style={st.stepContent}>
            <View style={st.iconCircle}><Feather name="shield" size={52} color={RHSColors.blue700} /></View>
            <Text style={st.stepTitle}>Xác minh danh tính</Text>
            <Text style={st.stepDesc}>3 bước:</Text>
            <View style={st.infoList}>
              <View style={st.infoItem}><Feather name="camera" size={18} color={RHSColors.blue700} /><Text style={st.infoText}>Chụp CCCD</Text></View>
              <View style={st.infoItem}><Feather name="user-check" size={18} color={RHSColors.blue700} /><Text style={st.infoText}>Chụp ảnh khuôn mặt & so sánh với CCCD</Text></View>
              <View style={st.infoItem}><Feather name="video" size={18} color={RHSColors.blue700} /><Text style={st.infoText}>Quay video 4s — tự động gửi xác minh</Text></View>
            </View>
            <TouchableOpacity style={st.primaryBtn} onPress={() => { started.current = true; setStep('ocr'); }} activeOpacity={0.85}>
              <Text style={st.primaryBtnText}>Bắt đầu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 1: OCR ── */}
        {step === 'ocr' && (
          <View style={st.stepContent}>
            <View style={st.iconCircle}><Feather name="camera" size={46} color={RHSColors.blue700} /></View>
            <Text style={st.stepTitle}>Bước 1: Chụp CCCD</Text>
            <Text style={st.stepDesc}>Mặt trước CCCD, rõ nét.</Text>
            {busy
              ? <View style={st.loadBox}><ActivityIndicator size="large" color={RHSColors.blue700} /><Text style={st.loadText}>Đang trích xuất...</Text></View>
              : <>
                  <TouchableOpacity style={st.primaryBtn} onPress={shootCccd} activeOpacity={0.85}>
                    <Text style={st.primaryBtnText}>Chụp CCCD</Text>
                  </TouchableOpacity>
                </>
            }
          </View>
        )}

        {/* ── Step 2: Face Match ── */}
        {step === 'facematch' && (
          <View style={st.stepContent}>
            <Text style={st.stepTitle}>Bước 2: Xác minh khuôn mặt</Text>
            <Text style={st.stepDesc}>Chụp ảnh khuôn mặt để so sánh với CCCD</Text>

            {busy ? (
              <View style={st.loadBox}>
                <ActivityIndicator size="large" color={RHSColors.blue700} />
                <Text style={st.loadText}>Đang kiểm tra...</Text>
              </View>
            ) : (
              <View style={st.sectionCard}>
                <View style={st.sectionHeader}>
                  <View style={[st.sectionBadge, selfieUri && { backgroundColor: RHSColors.green600 }]}>
                    {selfieUri
                      ? <Feather name="check" size={14} color="#fff" />
                      : <Text style={st.sectionBadgeNum}>1</Text>}
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
                      <Text style={st.primaryBtnText}>Xác nhận & So sánh</Text>
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

        {/* ── Step 3: Liveness ── */}
        {step === 'liveness' && (
          <View style={[st.stepContent, { paddingHorizontal: 0, paddingTop: 0 }]}>
            {busy ? (
              <View style={st.loadBox}>
                <ActivityIndicator size="large" color={RHSColors.blue700} />
                <Text style={st.loadText}>Đang xử lý</Text>
              </View>
            ) : videoUri ? (
              <View style={[st.sectionCard, { alignSelf: 'center', width: '90%', marginTop: 24 }]}>
                <View style={st.doneRow}>
                  <Feather name="check-circle" size={20} color={RHSColors.green600} />
                  <Text style={st.doneText}>Video đã quay — đang xử lý</Text>
                  <TouchableOpacity onPress={() => setVideoUri(null)} style={st.retakeBtn}>
                    <Feather name="refresh-cw" size={14} color={RHSColors.blue700} />
                    <Text style={st.retakeText}>Quay lại</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={st.cameraWrap}>
                <CameraView
                  ref={cam}
                  style={st.camera}
                  facing="front"
                  mode="video"  /* ĐÃ THÊM MODE VIDEO VÀO ĐÂY */
                  onCameraReady={() => setCamReady(true)}
                />
                <View style={st.cameraOverlay} pointerEvents="box-none">
                  <View style={st.faceGuide}>
                    <View style={[st.faceOval, isRecording && st.faceOvalRecording]} />
                  </View>
                  <Text style={st.cameraHint}>
                    {isRecording ? 'Đang quay — giữ nguyên khuôn mặt...' : 'Nhấn nút — tự quay 4 giây'}
                  </Text>
                  <TouchableOpacity
                    style={[st.recordBtn, isRecording && st.recordBtnActive]}
                    onPress={startRecording}
                    disabled={!camReady || isRecording}
                  >
                    <View style={[st.recordInner, isRecording && st.recordInnerActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Complete ── */}
        {step === 'complete' && (
          <View style={st.stepContent}>
            <View style={[st.iconCircle, { backgroundColor: RHSColors.green50 }]}>
              <Feather name="check-circle" size={52} color={RHSColors.green600} />
            </View>
            <Text style={[st.stepTitle, { color: RHSColors.green600 }]}>Thành công!</Text>
            <Text style={st.stepDesc}>Xác minh danh tính hoàn tất.</Text>
            <TouchableOpacity style={st.primaryBtn} onPress={close}>
              <Text style={st.primaryBtnText}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Failed ── */}
        {step === 'failed' && (
          <View style={st.stepContent}>
            <View style={[st.iconCircle, { backgroundColor: RHSColors.red50 }]}>
              <Feather name="x-circle" size={52} color={RHSColors.red600} />
            </View>
            <Text style={[st.stepTitle, { color: RHSColors.red600 }]}>Thất bại</Text>
            <Text style={st.stepDesc}>Thử lại nhé.</Text>
            <TouchableOpacity style={[st.primaryBtn, { backgroundColor: RHSColors.red600 }]} onPress={() => reset('welcome')}>
              <Text style={st.primaryBtnText}>Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.primaryBtn, { backgroundColor: RHSColors.grey400, marginTop: 12 }]} onPress={close}>
              <Text style={st.primaryBtnText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

/* ── Styles ─────────────────────────────────────────────────── */
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
  sectionCard: { width: '100%', backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: 14, ...shadows.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: RHSColors.blue700, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sectionBadgeNum: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: RHSColors.text },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  doneText: { flex: 1, fontSize: 13, color: RHSColors.green600, fontWeight: '500' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: RHSColors.blue50 },
  retakeText: { fontSize: 12, color: RHSColors.blue700, fontWeight: '600' },
  cameraWrap: { width: '100%', height: SCREEN_WIDTH * 1.35, overflow: 'hidden' },
  camera: { flex: 1 },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, paddingTop: 16 },
  faceGuide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  faceOval: { width: 220, height: 280, borderRadius: 110, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)', borderStyle: 'dashed' },
  faceOvalRecording: { borderColor: RHSColors.red400, borderWidth: 3, borderStyle: 'solid' },
  cameraHint: { color: '#fff', fontSize: 12, textAlign: 'center', fontWeight: '500', marginBottom: 10, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  recordBtn: { width: 60, height: 60, borderRadius: 30, borderWidth: 4, borderColor: '#fff', backgroundColor: 'rgba(211,47,47,0.75)', justifyContent: 'center', alignItems: 'center' },
  recordBtnActive: { backgroundColor: 'rgba(211,47,47,0.95)', borderColor: RHSColors.red400 },
  recordInner: { width: 20, height: 20, borderRadius: 4, backgroundColor: '#fff' },
  recordInnerActive: { width: 14, height: 14, borderRadius: 2, backgroundColor: RHSColors.red400 },
});