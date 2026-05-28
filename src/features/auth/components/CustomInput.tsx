import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CustomInputProps {
  iconName: keyof typeof Feather.glyphMap;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  errorMessage?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

export const CustomInput = ({ 
  iconName, 
  placeholder, 
  secureTextEntry = false, 
  value, 
  onChangeText,
  errorMessage,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines,
}: CustomInputProps) => {
  return (
    <View style={styles.container}>
      <View style={[
        styles.inputWrapper, 
        errorMessage ? styles.inputWrapperError : null
      ]}>
        <Feather name={iconName} color={errorMessage ? "#D93843" : "#000000"} size={20} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#A0A0A0"
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
      </View>
     
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperError: {
    borderColor: '#D93843',
    backgroundColor: '#FDF2F2', // Màu nền hồng nhạt khi lỗi
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  errorText: {
    color: '#D93843',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  }
});