import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import loginSvg from '../assets/illustrations/login';
import notificationsSvg from '../assets/illustrations/notifications';
import wishlistSvg from '../assets/illustrations/wishlist';
import feedbackSvg from '../assets/illustrations/feedback';

export type EmptyIllustrationName = 'login' | 'notifications' | 'wishlist' | 'feedback';

const ILLUSTRATIONS: Record<EmptyIllustrationName, string> = {
  login: loginSvg,
  notifications: notificationsSvg,
  wishlist: wishlistSvg,
  feedback: feedbackSvg,
};

type Props = {
  name: EmptyIllustrationName;
  size?: number;
};

/** unDraw SVG dùng `class` (HTML). RN Web parse thành DOM React → cần bỏ / đổi className. */
function sanitizeSvgXml(xml: string): string {
  return xml
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/\sclass='[^']*'/g, '');
}

/** unDraw illustrations (Katerina Limpitsouni) — accent #1565C0 */
export function EmptyStateIllustration({ name, size = 220 }: Props) {
  const xml = sanitizeSvgXml(ILLUSTRATIONS[name]);
  return (
    <View style={[styles.wrap, { width: size, height: size * 0.92 }]}>
      <SvgXml xml={xml} width={size} height={size * 0.92} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
