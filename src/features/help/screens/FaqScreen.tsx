import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { RHSColors, borderRadius, typography } from '../../../lib/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    q: 'Ai được mua nhà ở xã hội theo Nghị định 100/2024/NĐ-CP?',
    a: 'Theo Điều 76 Luật Nhà ở: người có công; hộ nghèo/cận nghèo (nông thôn, đô thị, vùng thiên tai); thu nhập thấp đô thị; công nhân; lực lượng vũ trang; cán bộ công chức; trả lại nhà công vụ; bị thu hồi đất/giải tỏa; học sinh sinh viên… kèm điều kiện nhà ở (Đ29) và thu nhập/chuẩn nghèo (Đ30).',
  },
  {
    q: 'Cần chuẩn bị những giấy tờ gì?',
    a: 'Theo NĐ 261/2025 và TT 05/2024: (1) Đơn mua Mẫu 01 NĐ 261; (2) Giấy chứng minh đối tượng (khác nhau theo nhóm Điều 76 — hộ nghèo, người có công, Mẫu 01 TT 05, LLVT…); (3) Giấy điều kiện nhà ở Mẫu 02/03 (vợ/chồng cũng kê Mẫu 02 nếu đã kết hôn); (4) Với nhóm (5)(6)(7)(8): giấy thu nhập Mẫu 04/05 (vợ/chồng cũng kê nếu đã kết hôn). App hiện đúng danh sách theo hồ sơ của bạn.',
  },
  {
    q: 'Điều kiện về thu nhập được xác định thế nào?',
    a: 'Thuộc diện không phải nộp thuế thu nhập cá nhân thường xuyên theo quy định, hoặc thuộc hộ nghèo/cận nghèo theo chuẩn của Thành phố. Mức cụ thể tham chiếu theo hướng dẫn hiện hành.',
  },
  {
    q: 'Xin giấy xác nhận về nhà ở ở đâu?',
    a: 'Dùng Mẫu số 02 (chưa có nhà) hoặc Mẫu số 03 (đã có nhà) Phụ lục I TT 05/2024/TT-BXD, kê khai theo hướng dẫn và xác nhận tại địa phương / cơ quan có thẩm quyền rồi upload PDF lên app.',
  },
  {
    q: 'Bốc thăm được tổ chức khi nào?',
    a: 'Sau khi hồ sơ được Sở phê duyệt và người dân đã thanh toán tiền đặt cọc, nếu số hồ sơ đã cọc vượt số căn, chủ đầu tư tổ chức bốc thăm công khai để chọn người mua.',
  },
  {
    q: 'Thanh toán diễn ra theo thứ tự nào?',
    a: 'Theo hệ thống hiện tại: (1) Sở duyệt hồ sơ → (2) thanh toán đặt cọc qua VNPay → (3) tham gia bốc thăm nếu vượt số căn → (4) ký hợp đồng nguyên tắc → (5) thanh toán các đợt tiếp theo theo lịch. Có thể thanh toán trực tuyến qua VNPay.',
  },
];

export const FaqScreen = () => {
  const [open, setOpen] = useState<number | null>(0);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(open === i ? null : i);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Trợ giúp & FAQ" isWhite />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Feather name="book-open" size={22} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Hướng dẫn mua nhà ở xã hội</Text>
            <Text style={styles.bannerSub}>Theo Nghị định 100/2024/NĐ-CP</Text>
          </View>
        </View>

        {FAQS.map((f, i) => (
          <TouchableOpacity key={i} style={styles.item} activeOpacity={0.8} onPress={() => toggle(i)}>
            <View style={styles.qRow}>
              <View style={styles.qIcon}><Feather name="help-circle" size={16} color={RHSColors.blue700} /></View>
              <Text style={styles.q}>{f.q}</Text>
              <Feather name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={RHSColors.textMuted} />
            </View>
            {open === i && <Text style={styles.a}>{f.a}</Text>}
          </TouchableOpacity>
        ))}

        <View style={styles.contactBox}>
          <Feather name="phone-call" size={16} color={RHSColors.blue700} />
          <Text style={styles.contactText}>Tổng đài hỗ trợ: 1900 1234 (giờ hành chính)</Text>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RHSColors.surface },
  scroll: { padding: 16 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: RHSColors.blue700, borderRadius: borderRadius.xl, padding: 18, marginBottom: 16 },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 3 },
  item: { backgroundColor: '#fff', borderRadius: borderRadius.lg, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: RHSColors.border },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: RHSColors.blue50, alignItems: 'center', justifyContent: 'center' },
  q: { flex: 1, ...typography.bodySmall, fontWeight: '700', color: RHSColors.text },
  a: { ...typography.bodySmall, color: RHSColors.textSecondary, marginTop: 12, lineHeight: 21, paddingLeft: 40 },
  contactBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: RHSColors.blue50, borderRadius: borderRadius.lg, padding: 14, marginTop: 8 },
  contactText: { flex: 1, fontSize: 13.5, color: RHSColors.blue700, fontWeight: '600' },
});
