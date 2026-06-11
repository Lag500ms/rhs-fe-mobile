import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { RHSColors } from '../../../lib/theme';
import { eKycApi, OcrResult, FaceMatchResult, LivenessResult } from '../api/eKycApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFIED_KEY = 'identityVerified';
const SCREEN_WIDTH = Dimensions.get('window').width;

type EKycStep = 'welcome' | 'ocr' | 'faceMatch' | 'liveness' | 'complete' | 'failed';

export const EKycScreen = () => {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState<EKycStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [cccdImageUri, setCccdImageUri] = useState<string | null>(null);
  const [faceMatchResult, setFaceMatchResult] = useState<FaceMatchResult | null>(null);
  const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(null);

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập camera để chụp ảnh CCCD và selfie.');
        return false;
      }
    }
    return true;
  };

  const pickImageFromCamera = async (): Promise<string | null> => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    return result.assets[0].uri;
  };

  const handleSelectImage = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const uri = await pickImageFromCamera();
    if (uri) {
      handleOcr(uri);
    }
  };

  const handleOcr = async (imageUri: string) => {
    setLoading(true);
    try {
      const result = await eKycApi.ocr(imageUri);
      setOcrResult(result);
      setCccdImageUri(imageUri);
      setCurrentStep('faceMatch');
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể trích xuất thông tin CCCD');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceMatch = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const uri = await pickImageFromCamera();
    if (!uri) return;

    setLoading(true);
    try {
      if (!cccdImageUri) {
        Alert.alert('Lỗi', 'Không tìm thấy ảnh CCCD. Vui lòng thử lại từ đầu.');
        setLoading(false);
        return;
      }
      const result = await eKycApi.faceMatch(uri, cccdImageUri);
      setFaceMatchResult(result);
      if (result.isMatch) {
        setCurrentStep('liveness');
      } else {
        Alert.alert('Không khớp', 'Khuôn mặt không khớp với ảnh CCCD. Vui lòng thử lại.');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể so khớp khuôn mặt');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveness = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const uri = await pickImageFromCamera();
    if (!uri) return;

    setLoading(true);
    try {
      const result = await eKycApi.liveness(uri);
      setLivenessResult(result);
      if (result.isLive) {
        await AsyncStorage.setItem(VERIFIED_KEY, 'true');
        setCurrentStep('complete');
      } else {
        Alert.alert('Phát hiện giả mạo', 'Ảnh selfie không phải người thật. Vui lòng thử lại.');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xác minh người thật');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'welcome', label: 'Bắt đầu' },
      { key: 'ocr', label: 'CCCD' },
      { key: 'faceMatch', label: 'Khuôn mặt' },
      { key: 'liveness', label: 'Người thật' },
      { key: 'complete', label: 'Hoàn tất' },
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              index <= currentIndex && styles.stepDotActive,
            ]}>
              {index < currentIndex ? (
                <Feather name="check" size={12} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepDotText,
                  index <= currentIndex && { color: '#fff' },
                ]}>{index + 1}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              index <= currentIndex && styles.stepLabelActive,
            ]}>{step.label}</Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                index < currentIndex && styles.stepLineActive,
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Feather name="shield" size={60} color={RHSColors.govBlue} />
      </View>
      <Text style={styles.stepTitle}>Xác minh danh tính</Text>
      <Text style={styles.stepDesc}>
        Để đăng ký nhà ở xã hội, bạn cần xác thực danh tính qua 3 bước:
      </Text>
      <View style={styles.infoList}>
        <View style={styles.infoItem}>
          <Feather name="camera" size={20} color={RHSColors.govBlue} />
          <Text style={styles.infoText}>Chụp ảnh CCCD gắn chip</Text>
        </View>
        <View style={styles.infoItem}>
          <Feather name="smile" size={20} color={RHSColors.govBlue} />
          <Text style={styles.infoText}>So khớp khuôn mặt với CCCD</Text>
        </View>
        <View style={styles.infoItem}>
          <Feather name="eye" size={20} color={RHSColors.govBlue} />
          <Text style={styles.infoText}>Xác minh người thật</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.startBtn} onPress={handleSelectImage}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.startBtnText}>Bắt đầu xác minh</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOcrStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Feather name="camera" size={50} color={RHSColors.govBlue} />
      </View>
      <Text style={styles.stepTitle}>Chụp ảnh CCCD</Text>
      <Text style={styles.stepDesc}>
        Chụp ảnh mặt trước của Căn cước công dân gắn chip để hệ thống trích xuất thông tin.
      </Text>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={RHSColors.govBlue} />
          <Text style={styles.loadingText}>Đang trích xuất thông tin...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.startBtn} onPress={handleSelectImage}>
          <Text style={styles.startBtnText}>Chụp ảnh CCCD</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFaceMatchStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Feather name="smile" size={50} color={RHSColors.govBlue} />
      </View>
      <Text style={styles.stepTitle}>So khớp khuôn mặt</Text>
      <Text style={styles.stepDesc}>
        Chụp ảnh selfie để hệ thống so sánh với ảnh trên CCCD.
      </Text>
      {ocrResult && (
        <View style={styles.ocrPreview}>
          <Text style={styles.ocrLabel}>Thông tin từ CCCD:</Text>
          <Text style={styles.ocrText}>Họ tên: {ocrResult.name || 'Đang xử lý...'}</Text>
          <Text style={styles.ocrText}>Số CCCD: {ocrResult.id || 'Đang xử lý...'}</Text>
        </View>
      )}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={RHSColors.govBlue} />
          <Text style={styles.loadingText}>Đang so khớp khuôn mặt...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.startBtn} onPress={handleFaceMatch}>
          <Text style={styles.startBtnText}>Chụp ảnh selfie</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLivenessStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Feather name="eye" size={50} color={RHSColors.govBlue} />
      </View>
      <Text style={styles.stepTitle}>Xác minh người thật</Text>
      <Text style={styles.stepDesc}>
        Chụp ảnh selfie lần nữa để kiểm tra bạn là người thật, không phải ảnh in hay ảnh trên màn hình.
      </Text>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={RHSColors.govBlue} />
          <Text style={styles.loadingText}>Đang kiểm tra...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.startBtn} onPress={handleLiveness}>
          <Text style={styles.startBtnText}>Chụp ảnh xác minh</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
        <Feather name="check-circle" size={60} color={RHSColors.govGreen} />
      </View>
      <Text style={[styles.stepTitle, { color: RHSColors.govGreen }]}>
        Xác minh thành công!
      </Text>
      <Text style={styles.stepDesc}>
        Danh tính của bạn đã được xác thực. Bạn có thể tiến hành đăng ký nhà ở xã hội.
      </Text>
      <View style={styles.summaryBox}>
        {ocrResult && (
          <>
            <Text style={styles.summaryTitle}>Thông tin đã xác thực:</Text>
            <Text style={styles.summaryText}>Họ tên: {ocrResult.name}</Text>
            <Text style={styles.summaryText}>Số CCCD: {ocrResult.id}</Text>
          </>
        )}
        {faceMatchResult && (
          <Text style={styles.summaryText}>
            So khớp khuôn mặt: {Math.round(faceMatchResult.similarity * 100)}%
          </Text>
        )}
        {livenessResult && (
          <Text style={styles.summaryText}>
            Người thật: {Math.round(livenessResult.livenessScore * 100)}%
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.startBtn} onPress={handleClose}>
        <Text style={styles.startBtnText}>Hoàn tất</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFailed = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: '#ffebee' }]}>
        <Feather name="x-circle" size={60} color={RHSColors.govRed} />
      </View>
      <Text style={[styles.stepTitle, { color: RHSColors.govRed }]}>
        Xác minh thất bại
      </Text>
      <Text style={styles.stepDesc}>
        Không thể xác thực danh tính của bạn. Vui lòng thử lại hoặc liên hệ hỗ trợ.
      </Text>
      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: RHSColors.govRed }]}
        onPress={() => setCurrentStep('welcome')}
      >
        <Text style={styles.startBtnText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.brandBar}>
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.govRed }]} />
        <View style={[styles.stripe, { flex: 0.4, backgroundColor: RHSColors.govGold }]} />
        <View style={[styles.stripe, { flex: 2, backgroundColor: RHSColors.govBlue }]} />
      </View>
      <LinearGradient
        colors={[RHSColors.govBlueDark, RHSColors.govBlue, RHSColors.govTeal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác minh danh tính</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {currentStep !== 'welcome' && currentStep !== 'complete' && currentStep !== 'failed' && (
        renderStepIndicator()
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 'welcome' && renderWelcome()}
        {currentStep === 'ocr' && renderOcrStep()}
        {currentStep === 'faceMatch' && renderFaceMatchStep()}
        {currentStep === 'liveness' && renderLivenessStep()}
        {currentStep === 'complete' && renderComplete()}
        {currentStep === 'failed' && renderFailed()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: RHSColors.surface,
  },
  brandBar: {
    flexDirection: 'row',
    height: 4,
  },
  stripe: {
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RHSColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: RHSColors.border,
  },
  stepDotActive: {
    backgroundColor: RHSColors.govBlue,
    borderColor: RHSColors.govBlue,
  },
  stepDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: RHSColors.textMuted,
  },
  stepLabel: {
    fontSize: 10,
    color: RHSColors.textMuted,
    marginLeft: 4,
  },
  stepLabelActive: {
    color: RHSColors.govBlue,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: RHSColors.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: RHSColors.govBlue,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: RHSColors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 14,
    color: RHSColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  infoList: {
    width: '100%',
    marginBottom: 32,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: RHSColors.text,
    marginLeft: 14,
    fontWeight: '500',
  },
  startBtn: {
    backgroundColor: RHSColors.govBlue,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: RHSColors.textMuted,
  },
  ocrPreview: {
    width: '100%',
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ocrLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: RHSColors.govBlue,
    marginBottom: 8,
  },
  ocrText: {
    fontSize: 14,
    color: RHSColors.text,
    marginBottom: 4,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: RHSColors.govBlue,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: RHSColors.text,
    marginBottom: 4,
  },
});