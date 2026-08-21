import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { RHSColors, borderRadius } from '../lib/theme';

const DEFAULT_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  error?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
  length?: number;
};

/** 6 ô OTP dùng chung — 1 TextInput thật (gõ / xóa / dán), ô kia chỉ hiển thị. */
export function OtpInput({
  value,
  onChange,
  error = false,
  editable = true,
  autoFocus = false,
  length = DEFAULT_LENGTH,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(autoFocus);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const caretIndex = Math.min(value.length, length - 1);

  const handleChange = (text: string) => {
    onChange(text.replace(/\D/g, '').slice(0, length));
  };

  const focusInput = () => {
    if (editable) inputRef.current?.focus();
  };

  return (
    <Pressable style={styles.row} onPress={focusInput}>
      {digits.map((digit, index) => {
        const isCaret = focused && editable && index === caretIndex;
        return (
          <View
            key={index}
            style={[
              styles.box,
              digit ? styles.boxFilled : null,
              isCaret ? styles.boxFocused : null,
              error ? styles.boxError : null,
            ]}
          >
            <Text style={styles.digit}>{digit}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        caretHidden
        autoFocus={autoFocus}
        editable={editable}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        style={styles.hiddenInput}
        accessibilityLabel="Mã xác thực 6 số"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    alignSelf: 'stretch',
    position: 'relative',
  },
  box: {
    flex: 1,
    maxWidth: 38,
    height: 42,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: RHSColors.grey200,
    backgroundColor: RHSColors.grey50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFilled: {
    borderColor: RHSColors.blue700,
    backgroundColor: RHSColors.blue50,
  },
  boxFocused: {
    borderColor: RHSColors.blue700,
    backgroundColor: '#fff',
  },
  boxError: {
    borderColor: RHSColors.red600,
    backgroundColor: '#FFF5F5',
  },
  digit: {
    fontSize: 18,
    fontWeight: '700',
    color: RHSColors.text,
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    color: 'transparent',
    fontSize: 1,
  },
});
