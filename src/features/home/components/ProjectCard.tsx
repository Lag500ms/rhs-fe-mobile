import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RHSColors, borderRadius, shadows, typography, spacing } from '../../../lib/theme';
import { HousingProjectResponse } from '../types/housing';
import { formatPrice, getThumb } from '../utils/format';
import { WishlistHeart } from '../../../components/WishlistHeart';
import { wishlistApi } from '../../saved/api/wishlistApi';
import { getToken } from '../../../lib/tokenStorage';

type Props = {
  project: HousingProjectResponse;
  onPress: () => void;
  /** Hiện nút trái tim yêu thích (cần đăng nhập) */
  showWishlist?: boolean;
};

export const ProjectCard: React.FC<Props> = ({ project, onPress, showWishlist = true }) => {
  const thumb = getThumb(project);
  const [wishlisted, setWishlisted] = useState(false);
  const [heartLoading, setHeartLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!showWishlist) return;
      const token = await getToken();
      if (!token) return;
      try {
        const status = await wishlistApi.checkWishlistStatus(project.id);
        if (mounted) setWishlisted(status);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [project.id, showWishlist]);

  const toggleWishlist = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setHeartLoading(true);
    try {
      if (wishlisted) {
        await wishlistApi.removeFromWishlist(project.id);
        setWishlisted(false);
      } else {
        await wishlistApi.addToWishlist(project.id);
        setWishlisted(true);
      }
    } catch {
      // keep previous state
    } finally {
      setHeartLoading(false);
    }
  }, [wishlisted, project.id]);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
      <View style={styles.imageWrap}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Feather name="home" size={32} color={RHSColors.grey400} />
          </View>
        )}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Đang mở đăng ký</Text>
        </View>
        {showWishlist && (
          <WishlistHeart
            active={wishlisted}
            loading={heartLoading}
            onPress={toggleWishlist}
            onImage
            size={18}
            style={styles.heart}
          />
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{project.projectName}</Text>

        <View style={styles.metaRow}>
          <View style={styles.chip}>
            <Feather name="tag" size={11} color={RHSColors.red600} />
            <Text style={styles.chipText} numberOfLines={1}>
              {formatPrice(project.minPrice, project.maxPrice)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {project.minArea > 0 && (
            <View style={[styles.chip, { backgroundColor: RHSColors.blue50 }]}>
              <Feather name="maximize" size={11} color={RHSColors.blue700} />
              <Text style={[styles.chipText, { color: RHSColors.blue700 }]} numberOfLines={1}>
                {project.minArea === project.maxArea
                  ? `${project.minArea}m²`
                  : `${project.minArea}-${project.maxArea}m²`}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.chip,
              { backgroundColor: project.availableUnits > 0 ? RHSColors.green50 : RHSColors.red50 },
            ]}
          >
            <Feather
              name="home"
              size={11}
              color={project.availableUnits > 0 ? RHSColors.green600 : RHSColors.red600}
            />
            <Text
              style={[
                styles.chipText,
                { color: project.availableUnits > 0 ? RHSColors.green600 : RHSColors.red600 },
              ]}
            >
              {project.availableUnits > 0 ? `Còn ${project.availableUnits}` : 'Hết'}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Feather name="map-pin" size={11} color={RHSColors.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {[project.district, project.province].filter(Boolean).join(', ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: RHSColors.surfaceCard,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: RHSColors.border,
    ...shadows.sm,
  },
  imageWrap: {
    height: 118,
    backgroundColor: RHSColors.grey100,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(46,125,50,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  heart: { position: 'absolute', top: 8, right: 8 },
  body: { padding: spacing.sm, gap: 6 },
  name: { ...typography.bodySmall, fontWeight: '700', color: RHSColors.text, minHeight: 40 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: RHSColors.red50,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    maxWidth: '100%',
  },
  chipText: { fontSize: 10, fontWeight: '600', color: RHSColors.red700, flexShrink: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { ...typography.caption, color: RHSColors.textMuted, flex: 1 },
});
