import React, { memo } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, HEADER, createStyles, toDimensionValue } from '../constants/theme';
import { HeaderIconButton } from './HeaderIconButton';

export interface ProfileHeaderSectionProps {
  headerImageUrl: string | null;
  isSelf: boolean;
  safeAreaTop: number;
  onBack: () => void;
  onEditHeader: () => void;
  onOptions: () => void;
  editHeaderA11yLabel: string;
  optionsA11yLabel: string;
}

function ProfileHeaderSectionInner({
  headerImageUrl,
  isSelf,
  safeAreaTop,
  onBack,
  onEditHeader,
  onOptions,
  editHeaderA11yLabel,
  optionsA11yLabel,
}: ProfileHeaderSectionProps) {
  return (
    <View style={styles.container}>
      {headerImageUrl ? (
        <Image
          source={{ uri: headerImageUrl }}
          style={styles.background}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.backgroundBlack} />
      )}
      <View style={styles.overlay} />
      <View style={[styles.bar, { paddingTop: safeAreaTop }]}>
        {!isSelf ? (
          <HeaderIconButton onPress={onBack} icon="arrow-back" accessibilityLabel="Go back" />
        ) : (
          <HeaderIconButton onPress={onEditHeader} icon="edit" accessibilityLabel={editHeaderA11yLabel} />
        )}
        <HeaderIconButton onPress={onOptions} icon="more-horiz" accessibilityLabel={optionsA11yLabel} />
      </View>
    </View>
  );
}

export const ProfileHeaderSection = memo(ProfileHeaderSectionInner as React.FunctionComponent<ProfileHeaderSectionProps>) as (props: ProfileHeaderSectionProps) => React.ReactElement | null;

const styles = createStyles({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundBlack: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.ink,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingTop: 0,
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
    zIndex: 10,
    position: 'relative',
  },
});
