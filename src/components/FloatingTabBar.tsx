import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { RHSColors, borderRadius, spacing } from '../lib/theme';

const BAR_GRADIENT = ['#0A3A85', '#1565C0', '#1E88E5'] as const;

type TabItemProps = {
  label: string;
  focused: boolean;
  icon: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

const TabItem: React.FC<TabItemProps> = ({
  label,
  focused,
  icon,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}) => {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [anim, focused]);

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            opacity: anim,
            transform: [
              {
                scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [
            {
              translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }),
            },
          ],
        }}
      >
        {icon}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-2, 0] }),
              },
            ],
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
};

export const FloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // Các màn hình con vẫn ẩn thanh tab qua `setOptions({ tabBarStyle: { display: 'none' } })`.
  const focusedOptions = descriptors[state.routes[state.index].key]?.options;
  const focusedTabBarStyle = StyleSheet.flatten(focusedOptions?.tabBarStyle) as
    | { display?: 'none' | 'flex' }
    | undefined;
  if (focusedTabBarStyle?.display === 'none') return null;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <LinearGradient
        colors={BAR_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bar}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

          const color = focused ? RHSColors.blue700 : 'rgba(255,255,255,0.9)';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              if (Platform.OS !== 'web') {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              label={label}
              focused={focused}
              icon={options.tabBarIcon?.({ focused, color, size: 21 }) ?? null}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
            />
          );
        })}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: RHSColors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    shadowColor: RHSColors.blue800,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    marginHorizontal: spacing.xs,
    backgroundColor: RHSColors.white,
    borderRadius: borderRadius.xl,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: RHSColors.blue700,
    marginTop: 2,
    maxWidth: '100%',
  },
});
