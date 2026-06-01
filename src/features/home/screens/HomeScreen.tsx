import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export const HomeScreen = () => {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.buildingIllustration}>
            <View style={styles.buildingRed} />
            <View style={styles.buildingGray} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Chung cư Vinhomes 2 phòng ngủ"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>

        {/* Category Cards */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity style={styles.categoryCard}>
            <View style={styles.categoryIconContainer}>
              <View style={styles.houseIcon}>
                <View style={styles.houseRoof} />
                <View style={styles.houseBody} />
              </View>
            </View>
            <Text style={styles.categoryText}>Mua bán</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.categoryCard}>
            <View style={styles.categoryIconContainer}>
              <View style={styles.rentIcon}>
                <View style={styles.rentRoof} />
                <View style={styles.rentBody} />
                <Text style={styles.rentLabel}>THUÊ</Text>
              </View>
            </View>
            <Text style={styles.categoryText}>Cho thuê</Text>
          </TouchableOpacity>
        </View>

        {/* Video Section */}
        <View style={styles.videoSection}>
          <View style={styles.videoHeader}>
            <Feather name="video" size={24} color="#000" />
            <Text style={styles.videoTitle}>Xem nhà trực quan với video</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videoScroll}>
            <View style={styles.videoCard}>
              <View style={styles.videoThumbnail}>
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={12} color="#fff" />
                  <Text style={styles.verifiedText}>XÁC THỰC</Text>
                </View>
              </View>
              <Text style={styles.propertyTitle}>THE RIVER THỦ THIÊM 3PN 139M...</Text>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyPrice}>30 tỷ</Text>
                <Text style={styles.propertyArea}>139 m²</Text>
              </View>
              <Text style={styles.propertyLocation}>Quận 2, Hồ Chí Mi...</Text>
            </View>

            <View style={styles.videoCard}>
              <View style={styles.videoThumbnail} />
              <Text style={styles.propertyTitle}>BIỆT THỰ SỐNG FO, HÒN 8...</Text>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyPrice}>18,56 tỷ</Text>
                <Text style={styles.propertyArea}>225 m²</Text>
              </View>
              <Text style={styles.propertyLocation}>Từ Sơn, Bắc Ninh</Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  logo: {
    width: 150,
    height: 40,
  },
  buildingIllustration: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  buildingRed: {
    width: 60,
    height: 50,
    backgroundColor: '#D93843',
    marginRight: 2,
  },
  buildingGray: {
    width: 60,
    height: 40,
    backgroundColor: '#CCCCCC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 15,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  houseIcon: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  houseRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D93843',
    position: 'absolute',
    top: 0,
  },
  houseBody: {
    width: 40,
    height: 30,
    backgroundColor: '#D93843',
    position: 'absolute',
    bottom: 0,
    left: 5,
  },
  rentIcon: {
    width: 50,
    height: 50,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rentRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D93843',
    position: 'absolute',
    top: 0,
  },
  rentBody: {
    width: 40,
    height: 30,
    backgroundColor: '#D93843',
    position: 'absolute',
    bottom: 0,
  },
  rentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    position: 'absolute',
    bottom: 8,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  videoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  videoScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  videoCard: {
    width: 200,
    marginRight: 15,
  },
  videoThumbnail: {
    width: 200,
    height: 250,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 10,
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D93843',
    marginRight: 10,
  },
  propertyArea: {
    fontSize: 14,
    color: '#666',
  },
  propertyLocation: {
    fontSize: 12,
    color: '#999',
  },
});
