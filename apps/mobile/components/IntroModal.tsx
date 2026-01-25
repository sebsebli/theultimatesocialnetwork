import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, Animated, Dimensions, Image } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, SIZES } from '../constants/theme';
import * as SecureStore from 'expo-secure-store';

const INTRO_SEEN_KEY = 'intro_seen';
const { width, height } = Dimensions.get('window');

// City background images
const cityImages = [
  require('../assets/intro-cities/Bratislava.png'),
  require('../assets/intro-cities/Halle.png'),
  require('../assets/intro-cities/Helsinki.png'),
  require('../assets/intro-cities/Ljubljana.png'),
  require('../assets/intro-cities/Madrid.png'),
  require('../assets/intro-cities/Milano.png'),
  require('../assets/intro-cities/Paris.png'),
  require('../assets/intro-cities/Prag.png'),
];

interface IntroModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FadeInOutTextProps {
  text: string;
  delay: number;
  visibleDuration?: number;
  fadeDuration?: number;
  style?: any;
  isFounder?: boolean;
  isWelcome?: boolean;
  founderName?: string;
}

interface FadeInOutBackgroundProps {
  imageSource: any;
  delay: number;
  visibleDuration?: number;
  fadeDuration?: number;
  isLast?: boolean;
}

function FadeInOutBackground({
  imageSource,
  delay,
  visibleDuration = 2000,
  fadeDuration = 800,
  isLast = false,
}: FadeInOutBackgroundProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start(() => {
        // Stay visible
        if (!isLast) {
          setTimeout(() => {
            // Fade out (unless it's the last item)
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: fadeDuration,
              useNativeDriver: true,
            }).start();
          }, visibleDuration);
        }
        // If last, stay visible forever
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, fadeDuration, visibleDuration, isLast]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: -100,
          left: -100,
          right: -100,
          bottom: -100,
          width: width + 200,
          height: height + 200,
          opacity: fadeAnim,
        },
      ]}
    >
      <Image
        source={imageSource}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.backgroundOverlay} />
    </Animated.View>
  );
}

function FadeInOutText({
  text,
  delay,
  visibleDuration = 2000,
  fadeDuration = 800,
  style,
  isLast = false,
  isFounder = false,
  isWelcome = false,
  founderName,
}: FadeInOutTextProps & { isLast?: boolean }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start(() => {
        // Stay visible
        if (!isLast) {
          setTimeout(() => {
            // Fade out (unless it's the last item - Welcome)
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: fadeDuration,
              useNativeDriver: true,
            }).start();
          }, visibleDuration);
        }
        // If last, stay visible forever
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, fadeDuration, visibleDuration, isLast]);

  // Parse text for highlighting "cite" in founder message
  const renderText = () => {
    if (isFounder) {
      const parts = text.split(/(cite)/i);
      return (
        <View style={styles.founderContainer}>
          <Text style={style}>
            {parts.map((part, index) =>
              part.toLowerCase() === 'cite' ? (
                <Text key={index} style={[style, styles.highlightedCite]}>{part}</Text>
              ) : (
                <Text key={index}>{part}</Text>
              )
            )}
          </Text>
          {founderName && <Text style={styles.founderNameAlways}>{founderName}</Text>}
        </View>
      );
    }
    if (isWelcome) {
      // Just "Welcome" - no special styling needed
      return <Text style={style}>{text}</Text>;
    }
    return <Text style={style}>{text}</Text>;
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          position: 'absolute',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }
      ]}
    >
      <View style={styles.textWrapper}>
        {renderText()}
      </View>
    </Animated.View>
  );
}

interface FadeInButtonProps {
  delay: number;
  duration?: number;
  onPress: () => void;
  text: string;
}

function FadeInButton({ delay, duration = 1000, onPress, text, currentIndex, totalItems }: FadeInButtonProps & { currentIndex: number; totalItems: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration]);

  // Show button for all items except the last (Welcome)
  const buttonText = currentIndex < totalItems - 1
    ? `${currentIndex + 1} / ${totalItems - 1}`
    : text;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Pressable
        style={styles.beginButton}
        onPress={onPress}
      >
        <Text style={styles.beginButtonText}>
          {buttonText}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function IntroModal({ visible, onClose }: IntroModalProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const allItems = [
    { text: t('intro.founderMessage'), isFounder: true, hasAuthor: true },
    { text: t('intro.point1'), isFounder: false, hasAuthor: false },
    { text: t('intro.point2'), isFounder: false, hasAuthor: false },
    { text: t('intro.point3'), isFounder: false, hasAuthor: false },
    { text: t('intro.point4'), isFounder: false, hasAuthor: false },
    { text: t('intro.point5'), isFounder: false, hasAuthor: false },
    { text: t('intro.point6'), isFounder: false, hasAuthor: false },
    { text: t('intro.point7'), isFounder: false, hasAuthor: false },
    { text: t('intro.finalMessage'), isFounder: false, hasAuthor: false },
    { text: `Welcome`, isWelcome: true, hasAuthor: false },
  ];

  // Auto-advance through items
  useEffect(() => {
    if (!visible) {
      setCurrentIndex(0);
      return;
    }

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    const scheduleNext = (current: number) => {
      if (current >= allItems.length - 1) return;
      const delay = current === 0 ? 12000 : 6000; // Founder takes 12s, others 6s
      const timeoutId = setTimeout(() => {
        setCurrentIndex((prev) => {
          if (prev < allItems.length - 1) {
            const next = prev + 1;
            scheduleNext(next);
            return next;
          }
          return prev;
        });
      }, delay);
      timeoutIds.push(timeoutId);
    };
    scheduleNext(0);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [visible, allItems.length]);

  const handleClose = async () => {
    await SecureStore.setItemAsync(INTRO_SEEN_KEY, 'true');
    onClose();
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync(INTRO_SEEN_KEY, 'true');
    onClose();
  };

  const handleDotPress = (index: number) => {
    setCurrentIndex(index);
    // Note: This would require more complex state management to actually jump
    // For now, dots are visual indicators only
  };

  // Calculate delay for each item - each fades in, stays, then fades out (except Welcome)
  // Founder: fade in (1000ms) + visible (10000ms) + fade out (1000ms) = 12000ms
  // Others: fade in (1000ms) + visible (4000ms) + fade out (1000ms) = 6000ms
  const getItemDelay = (index: number) => {
    if (index === 0) {
      // Founder message takes 12 seconds
      return 0;
    }
    // After founder (12s), each subsequent item starts 6 seconds after the previous
    return 12000 + (index - 1) * 6000;
  };

  // Button appears after welcome fades in (last item)
  // Founder takes 12s, others take 6s each
  const buttonDelay = 12000 + (allItems.length - 2) * 6000 + 1000 + 500; // founder (12s) + others (6s each) + fade in + small delay

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={() => { }} // Prevent back button from closing
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Background Images - Fullscreen behind safe area */}
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFounder = index === 0;
          const cityIndex = index % cityImages.length;
          return (
            <FadeInOutBackground
              key={`bg-${index}`}
              imageSource={cityImages[cityIndex]}
              delay={getItemDelay(index)}
              visibleDuration={isLast ? 999999 : (isFounder ? 10000 : 4000)} // Founder background stays 10s, others 4s
              fadeDuration={1000}
              isLast={isLast}
            />
          );
        })}

        {/* Skip Button - Top */}
        <View style={styles.topSection}>
          <Pressable
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>{t('intro.skip')}</Text>
          </Pressable>
        </View>

        {/* Text Container - Center */}
        <View style={styles.textContainer}>
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            const isFounder = item.isFounder;
            const isWelcome = item.isWelcome;
            return (
              <FadeInOutText
                key={index}
                text={item.text}
                delay={getItemDelay(index)}
                visibleDuration={isWelcome ? 999999 : (isFounder ? 10000 : 4000)} // Founder stays 10 seconds, welcome forever, others 4 seconds
                fadeDuration={1000}
                isLast={isLast}
                isFounder={isFounder}
                isWelcome={isWelcome}
                founderName={isFounder ? t('intro.founderName') : undefined}
                style={[
                  styles.text,
                  isFounder && styles.founderText,
                  isWelcome && styles.welcomeText + ".",
                  item.text === t('intro.finalMessage') && styles.finalText,
                ]}
              />
            );
          })}
        </View>

        {/* Navigation Button - Bottom */}
        <View style={styles.bottomSection}>
          <FadeInButton
            delay={getItemDelay(0) + 1000} // Show from first item
            duration={500}
            onPress={currentIndex < allItems.length - 1 ? () => {
              // Could advance to next item here if needed
            } : handleClose}
            text={t('intro.beginJourney')}
            currentIndex={currentIndex}
            totalItems={allItems.length}
          />
        </View>
      </View>
    </Modal>
  );
}

export async function shouldShowIntro(): Promise<boolean> {
  // In dev mode, always show intro
  if (__DEV__) {
    return true;
  }
  const seen = await SecureStore.getItemAsync(INTRO_SEEN_KEY);
  return seen !== 'true';
}

export async function resetIntro(): Promise<void> {
  await SecureStore.deleteItemAsync(INTRO_SEEN_KEY);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.ink,
    justifyContent: 'space-between',
    padding: SPACING.xs,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for text readability
  },
  topSection: {
    paddingTop: SPACING.xxl + 40,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  bottomSection: {
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    zIndex: 10,
  },
  textWrapper: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: RFValue(18),
    lineHeight: RFValue(24),
    color: COLORS.paper,
    fontFamily: 'IBMPlexSerif_400Regular',
    textAlign: 'center',
    maxWidth: width - SPACING.xxl * 2,
  },
  founderText: {
    fontSize: RFValue(18),
    lineHeight: RFValue(24),
    color: COLORS.paper,
    fontFamily: 'IBMPlexSerif_400Regular',
    textAlign: 'center',
    maxWidth: width - SPACING.xxl * 2,
  },
  highlightedCite: {
    fontFamily: 'IBMPlexSerif_600SemiBold',
    fontWeight: '700',
  },
  founderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  founderNameAlways: {
    fontSize: RFValue(10),
    lineHeight: RFValue(14),
    color: COLORS.secondary,
    fontFamily: 'IBMPlexSerif_400Regular',
    textAlign: 'center',
    marginTop: SPACING.s,
    fontStyle: 'normal',
    opacity: 0.7,
  },
  finalText: {
    fontSize: RFValue(32),
    lineHeight: RFValue(48),
    color: COLORS.paper,
    fontFamily: 'IBMPlexSerif_400Regular',
  },
  welcomeText: {
    fontSize: RFValue(48),
    lineHeight: RFValue(64),
    color: COLORS.paper,
    fontFamily: 'IBMPlexSerif_400Regular',
    marginTop: SPACING.xl,
  },
  skipButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
  },
  skipButtonText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
  beginButton: {
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    paddingVertical: SPACING.m + 2,
    paddingHorizontal: SPACING.xxl + 4,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
});
