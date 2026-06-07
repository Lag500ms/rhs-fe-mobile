import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { RHSColors } from './theme';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

export const RHSLogo: React.FC<LogoProps> = ({ size = 60, style }) => {
  const s = size;
  const scale = s / 64;

  return (
    <View style={[styles.container, { width: s, height: s }, style]}>
      {/* Background circle */}
      <View
        style={[
          styles.circle,
          {
            width: s,
            height: s,
            borderRadius: s / 2,
            backgroundColor: RHSColors.govBlueDark,
          },
        ]}
      />
      {/* Ring */}
      <View
        style={[
          styles.ring,
          {
            width: s * 0.94,
            height: s * 0.94,
            borderRadius: (s * 0.94) / 2,
            borderColor: RHSColors.govRed,
            borderWidth: 1.5 * scale,
          },
        ]}
      />
      {/* White house structure */}
      <View style={[styles.house, { top: s * 0.22 }]}>
        {/* Roof */}
        <View
          style={[
            styles.roof,
            {
              borderLeftWidth: s * 0.17,
              borderRightWidth: s * 0.17,
              borderBottomWidth: s * 0.13,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: RHSColors.white,
            },
          ]}
        />
        {/* Building body */}
        <View
          style={[
            styles.building,
            {
              width: s * 0.38,
              height: s * 0.22,
              backgroundColor: RHSColors.white,
            },
          ]}
        />
        {/* Windows row 1 */}
        <View style={[styles.windowsRow, { marginTop: s * 0.01 }]}>
          <View style={[styles.window, { backgroundColor: '#caf0f8', width: s * 0.08, height: s * 0.12 }]} />
          <View style={[styles.window, { backgroundColor: '#caf0f8', width: s * 0.08, height: s * 0.12 }]} />
        </View>
        {/* Door */}
        <View
          style={[
            styles.door,
            {
              width: s * 0.1,
              height: s * 0.13,
              backgroundColor: '#ffd166',
              bottom: 0,
            },
          ]}
        />
      </View>
      {/* Right building (taller) */}
      <View
        style={[
          styles.rightBuilding,
          {
            width: s * 0.19,
            height: s * 0.16,
            backgroundColor: 'rgba(255,255,255,0.92)',
            right: s * 0.12,
            top: s * 0.28,
          },
        ]}
      >
        <View
          style={[
            styles.rightRoof,
            {
              borderLeftWidth: s * 0.095,
              borderRightWidth: s * 0.095,
              borderBottomWidth: s * 0.08,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: 'rgba(255,255,255,0.92)',
              top: -s * 0.08,
            },
          ]}
        />
        <View style={{ backgroundColor: '#90e0ef', width: s * 0.05, height: s * 0.09, alignSelf: 'center', marginTop: s * 0.02 }} />
      </View>
      {/* Heart/shield icon (red) */}
      <View
        style={[
          styles.heartIcon,
          {
            width: s * 0.31,
            height: s * 0.25,
            backgroundColor: RHSColors.govRed,
            borderRadius: s * 0.05,
            right: s * 0.14,
            top: s * 0.04,
          },
        ]}
      >
        {/* Heart shape approximation */}
        <View
          style={{
            position: 'absolute',
            top: s * 0.03,
            left: s * 0.06,
            width: s * 0.08,
            height: s * 0.08,
            borderRadius: s * 0.04,
            backgroundColor: RHSColors.white,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: s * 0.03,
            right: s * 0.06,
            width: s * 0.08,
            height: s * 0.08,
            borderRadius: s * 0.04,
            backgroundColor: RHSColors.white,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: s * 0.04,
            left: s * 0.12,
            width: s * 0.05,
            height: s * 0.09,
            backgroundColor: RHSColors.white,
            borderRadius: s * 0.01,
            transform: [{ rotate: '45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: s * 0.04,
            right: s * 0.12,
            width: s * 0.05,
            height: s * 0.09,
            backgroundColor: RHSColors.white,
            borderRadius: s * 0.01,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </View>
      {/* Check mark on heart */}
      <View
        style={{
          position: 'absolute',
          right: s * 0.19,
          top: s * 0.1,
          width: s * 0.06,
          height: s * 0.025,
          backgroundColor: RHSColors.white,
          borderRadius: s * 0.01,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: s * 0.15,
          top: s * 0.09,
          width: s * 0.03,
          height: s * 0.06,
          backgroundColor: RHSColors.white,
          borderRadius: s * 0.01,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  house: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  roof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  building: {
    alignItems: 'center',
  },
  windowsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  window: {
    margin: 1,
  },
  door: {
    position: 'absolute',
  },
  rightBuilding: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1,
  },
  rightRoof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    position: 'absolute',
  },
  heartIcon: {
    position: 'absolute',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});