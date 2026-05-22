import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';

export const SocialButton = () => {
  return (
    <TouchableOpacity style={styles.socialButton}>
      <Image
        source={require('../../../../assets/google.png')}
        style={styles.socialIcon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
});