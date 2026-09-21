import { Animated, Platform } from 'react-native';

export function blurWebFocus() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const active = document.activeElement;
  if (active instanceof HTMLElement && active !== document.body && typeof active.blur === 'function') {
    active.blur();
  }
}

function blurFocusedInside(node: Element) {
  if (typeof document === 'undefined') return;
  const active = document.activeElement;
  if (active instanceof HTMLElement && (node === active || node.contains(active))) {
    active.blur();
  }
}

/**
 * Expo web: RN-web deprecated shadow* and pointerEvents-as-prop, and the native
 * Animated driver is missing. Force JS driver for libraries (screens, navigation)
 * and filter leftover deprecation warnings from dependencies that have not migrated.
 */
if (Platform.OS === 'web') {
  const jsDriver = <T extends { useNativeDriver?: boolean }>(config: T): T =>
    ({ ...config, useNativeDriver: false });

  const timing = Animated.timing.bind(Animated);
  Animated.timing = ((value, config) => timing(value, jsDriver(config))) as typeof Animated.timing;

  const spring = Animated.spring.bind(Animated);
  Animated.spring = ((value, config) => spring(value, jsDriver(config))) as typeof Animated.spring;

  const decay = Animated.decay.bind(Animated);
  Animated.decay = ((value, config) => decay(value, jsDriver(config))) as typeof Animated.decay;

  const event = Animated.event.bind(Animated);
  Animated.event = ((mapping, config) =>
    event(mapping, config ? jsDriver(config) : config)) as typeof Animated.event;

  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const first = String(args[0] ?? '');
    if (
      first.includes('"shadow*" style props are deprecated') ||
      first.includes('"textShadow*" style props are deprecated') ||
      first.includes('props.pointerEvents is deprecated')
    ) {
      return;
    }
    origWarn(...args);
  };

  // Native-stack ẩn màn cũ bằng aria-hidden trong khi nút vừa bấm vẫn còn focus (Chrome a11y).
  const origSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name: string, value: string) {
    if (String(name).toLowerCase() === 'aria-hidden' && String(value) === 'true') {
      blurFocusedInside(this);
    }
    return origSetAttribute.call(this, name, value);
  };
}
