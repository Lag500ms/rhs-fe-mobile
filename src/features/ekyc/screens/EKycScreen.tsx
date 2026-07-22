import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RHSColors, borderRadius, shadows, typography, spacing } from '../../../lib/theme';
import { eKycApi } from '../api/eKycApi';
import { OcrResult } from '../types/ekyc';
import { EKycStepProgress } from '../components/EKycStepProgress';

const VERIFIED_KEY = 'identityVerified';

/**
 * Luồng eKYC VNPT REST:
 * 1. OCR mặt trước CCCD → check CCCD
 * 2. Face-match selfie ↔ CCCD → lưu profile
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

  const shootCccd = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: false,
    });
    if (r.canceled || !r.assets?.length) return;

    setBusy(true);
    try {
      const uri = r.assets[0].uri;
      const o = await eKycApi.ocr(uri);
      setOcr(o);
      setCccdUri(uri);

      if (o.id) {
        const check = await eKycApi.checkCitizenId(o.id);
        if (!check.available) {
          Alert.alert('CCCD không khả dụng', check.message, [
            { text: 'Quay lại', style: 'cancel' },
            {
              text: 'Chụp lại',
              onPress: () => {
                setOcr(null);
                setCccdUri(null);
              },
            },
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

  const verifyFaceMatch = async () => {
    if (!selfieUri) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp ảnh khuôn mặt trước.');
      return;
    }
    if (!cccdUri) {
      Alert.alert('Thiếu ảnh CCCD', 'Vui lòng quay lại bước chụp CCCD.');
      return;
    }

    setBusy(true);
    try {
      const m = await eKycApi.faceMatch(selfieUri, cccdUri);
      if (!m.isMatch) {
        Alert.alert(
          'Khuôn mặt không khớp',
          `Độ tương đồng: ${m.similarity ?? '—'}%. Chụp lại ảnh rõ, đủ ánh sáng.`,
          [{ text: 'Chụp lại', onPress: () => setSelfieUri(null) }],
        );
        return;
      }

      await eKycApi.updateProfileFromOcr(ocr!);
      await AsyncStorage.setItem(VERIFIED_KEY, 'true');
      setStep('complete');
    } catch (e: any) {
      Alert.alert('Lỗi xác minh', e?.message ?? 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (started.current && step !== 'complete') {
      Alert.alert('Dừng xác minh?', 'Tiến trình hiện tại sẽ không được lưu.', [
        { text: 'Tiếp tục', style: 'cancel' },
        {
          text: 'Thoát',
          style: 'destructive',
          onPress: () => {
            started.current = false;
            nav.goBack();
          },
        },
      ]);
    } else {
      nav.goBack();
    }
  };

  const showProgress = step === 'ocr' || step === 'facematch';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={close} style={styles.headerBtn} hitSlop={8}>
          <Feather name={step === 'complete' ? 'x' : 'arrow-left'} size={22} color={RHSColors.blue700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác minh danh tính</Text>
        <View style={styles.headerBtn} />
      </View>

      {showProgress && <EKycStepProgress current={step} />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'welcome' && (
          <View style={styles.panel}>
            <View style={styles.heroIcon}>
              <Feather name="shield" size={36} color={RHSColors.blue700} />
            </View>
            <Text style={styles.title}>Xác thực CCCD điện tử</Text>
            <Text style={styles.desc}>
              Hoàn tất 2 bước với VNPT eKYC để đăng ký nhà ở xã hội.
            </Text>

            <View style={styles.process}>
              <ProcessRow
                index={1}
                icon="credit-card"
                title="Chụp mặt trước CCCD"
                subtitle="Trích xuất thông tin và kiểm tra số CCCD"
                last={false}
              />
              <ProcessRow
                index={2}
                icon="user"
                title="Chụp khuôn mặt"
                subtitle="So khớp với ảnh trên CCCD"
                last
              />
            </View>

            <View style={styles.noteBox}>
              <Feather name="info" size={16} color={RHSColors.blue700} />
              <Text style={styles.noteText}>
                Dùng CCCD gắn chip, ánh sáng đủ, không bị che góc.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                started.current = true;
                setStep('ocr');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Bắt đầu xác minh</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === 'ocr' && (
          <View style={styles.panel}>
            <Text style={styles.title}>Chụp mặt trước CCCD</Text>
            <Text style={styles.desc}>Đặt thẻ trong khung, rõ nét, đủ 4 góc.</Text>

            <CaptureZone
              uri={cccdUri}
              emptyIcon="credit-card"
              emptyLabel="Chưa có ảnh CCCD"
              aspect="card"
            />

            {busy ? (
              <View style={styles.loadBox}>
                <ActivityIndicator size="large" color={RHSColors.blue700} />
                <Text style={styles.loadText}>Đang đọc thông tin CCCD...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.primaryBtn} onPress={shootCccd} activeOpacity={0.88}>
                <Feather name="camera" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {cccdUri ? 'Chụp lại CCCD' : 'Mở camera chụp CCCD'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 'facematch' && (
          <View style={styles.panel}>
            <Text style={styles.title}>Xác minh khuôn mặt</Text>
            <Text style={styles.desc}>
              Chụp selfie rõ mặt, nhìn thẳng camera. Hệ thống sẽ so khớp với CCCD.
            </Text>

            {ocr && (
              <View style={styles.ocrCard}>
                <Text style={styles.ocrHeading}>Thông tin từ CCCD</Text>
                <InfoLine label="Họ tên" value={ocr.name || '—'} />
                <InfoLine label="Số CCCD" value={ocr.id || '—'} />
                {!!ocr.dob && <InfoLine label="Ngày sinh" value={ocr.dob} />}
              </View>
            )}

            <CaptureZone
              uri={selfieUri}
              emptyIcon="user"
              emptyLabel="Chưa có ảnh khuôn mặt"
              aspect="portrait"
            />

            {busy ? (
              <View style={styles.loadBox}>
                <ActivityIndicator size="large" color={RHSColors.blue700} />
                <Text style={styles.loadText}>Đang so khớp khuôn mặt...</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={takeSelfie} activeOpacity={0.88}>
                  <Feather name="camera" size={18} color={RHSColors.blue700} />
                  <Text style={styles.secondaryBtnText}>
                    {selfieUri ? 'Chụp lại' : 'Chụp khuôn mặt'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, !selfieUri && styles.primaryBtnDisabled]}
                  onPress={verifyFaceMatch}
                  disabled={!selfieUri}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>Xác nhận & so khớp</Text>
                  <Feather name="check" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => {
                    setSelfieUri(null);
                    setStep('ocr');
                  }}
                >
                  <Feather name="arrow-left" size={14} color={RHSColors.textMuted} />
                  <Text style={styles.linkBtnText}>Quay lại chụp CCCD</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {step === 'complete' && (
          <View style={styles.panel}>
            <View style={[styles.heroIcon, styles.heroSuccess]}>
              <Feather name="check" size={36} color={RHSColors.green600} />
            </View>
            <Text style={[styles.title, { color: RHSColors.green700 }]}>Xác minh thành công</Text>
            <Text style={styles.desc}>
              Thông tin CCCD đã được lưu và khóa trong hồ sơ. Bạn có thể đăng ký nhà ở xã hội.
            </Text>

            {ocr && (
              <View style={styles.ocrCard}>
                <InfoLine label="Họ tên" value={ocr.name || '—'} />
                <InfoLine label="Số CCCD" value={ocr.id || '—'} />
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={close} activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const ProcessRow = ({
  index,
  icon,
  title,
  subtitle,
  last,
}: {
  index: number;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  last?: boolean;
}) => (
  <View style={styles.processRow}>
    <View style={styles.processLeft}>
      <View style={styles.processIndex}>
        <Text style={styles.processIndexText}>{index}</Text>
      </View>
      {!last && <View style={styles.processRail} />}
    </View>
    <View style={[styles.processBody, last && { marginBottom: 0 }]}>
      <View style={styles.processIcon}>
        <Feather name={icon} size={18} color={RHSColors.blue700} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.processTitle}>{title}</Text>
        <Text style={styles.processSub}>{subtitle}</Text>
      </View>
    </View>
  </View>
);

const CaptureZone = ({
  uri,
  emptyIcon,
  emptyLabel,
  aspect,
}: {
  uri: string | null;
  emptyIcon: keyof typeof Feather.glyphMap;
  emptyLabel: string;
  aspect: 'card' | 'portrait';
}) => (
  <View style={[styles.capture, aspect === 'portrait' && styles.capturePortrait]}>
    {uri ? (
      <Image source={{ uri }} style={styles.captureImage} resizeMode="cover" />
    ) : (
      <View style={styles.captureEmpty}>
        <Feather name={emptyIcon} size={32} color={RHSColors.grey400} />
        <Text style={styles.captureEmptyText}>{emptyLabel}</Text>
      </View>
    )}
  </View>
);

const InfoLine = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoLine}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: RHSColors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: RHSColors.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: RHSColors.text },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },
  panel: { gap: spacing.md },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: RHSColors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  heroSuccess: { backgroundColor: RHSColors.green50 },
  title: {
    ...typography.h2,
    color: RHSColors.text,
    textAlign: 'center',
  },
  desc: {
    ...typography.bodySmall,
    color: RHSColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
  },
  process: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: RHSColors.border,
    marginTop: spacing.sm,
  },
  processRow: { flexDirection: 'row' },
  processLeft: { width: 28, alignItems: 'center' },
  processIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RHSColors.blue700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processIndexText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  processRail: {
    width: 2,
    flex: 1,
    backgroundColor: RHSColors.blue200,
    marginVertical: 4,
    minHeight: 20,
  },
  processBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.md,
    padding: 12,
    marginLeft: 10,
    marginBottom: 12,
  },
  processIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processTitle: { fontSize: 14, fontWeight: '700', color: RHSColors.text },
  processSub: { fontSize: 12, color: RHSColors.textSecondary, marginTop: 2 },
  noteBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.md,
    padding: 12,
  },
  noteText: { flex: 1, fontSize: 12, color: RHSColors.textSecondary, lineHeight: 18 },
  capture: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: RHSColors.border,
    borderStyle: 'dashed',
    backgroundColor: RHSColors.grey100,
    overflow: 'hidden',
  },
  capturePortrait: { height: 220, alignSelf: 'center', width: '72%' },
  captureImage: { width: '100%', height: '100%' },
  captureEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  captureEmptyText: { fontSize: 13, color: RHSColors.textMuted, fontWeight: '500' },
  ocrCard: {
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    gap: 8,
  },
  ocrHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: RHSColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: 13, color: RHSColors.textMuted },
  infoValue: { flex: 1, fontSize: 13, fontWeight: '700', color: RHSColors.text, textAlign: 'right' },
  actions: { gap: 10 },
  primaryBtn: {
    backgroundColor: RHSColors.blue700,
    borderRadius: borderRadius.lg,
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.sm,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { ...typography.button, color: '#fff' },
  secondaryBtn: {
    backgroundColor: RHSColors.blue50,
    borderRadius: borderRadius.lg,
    minHeight: 48,
    borderWidth: 1,
    borderColor: RHSColors.blue200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', color: RHSColors.blue700 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  linkBtnText: { fontSize: 13, color: RHSColors.textMuted, fontWeight: '500' },
  loadBox: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  loadText: { ...typography.bodySmall, color: RHSColors.textMuted },
});
