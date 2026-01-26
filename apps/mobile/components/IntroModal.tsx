import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, Animated, Dimensions, Image, ScrollView } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
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
        toValue: 0.2,
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
    // @ts-expect-error - React 19 compatibility: Animated.View returns ReactNode | Promise<ReactNode>
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
    // @ts-expect-error - React 19 compatibility: Animated.View returns ReactNode | Promise<ReactNode>
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
    // @ts-expect-error - React 19 compatibility: Animated.View returns ReactNode | Promise<ReactNode>
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
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const allItems = React.useMemo(() => [
    { text: "I built cite to challenge a digital order engineered for outrage over truth—where algorithms reward polarization over diversity, rage over logic, and controversy over accuracy.\n\nThe future deserves verification over virality, context over chaos.", isFounder: true, hasAuthor: true },
    { text: t('intro.point1'), isFounder: false, hasAuthor: false },
    { text: t('intro.point2'), isFounder: false, hasAuthor: false },
    { text: t('intro.point3'), isFounder: false, hasAuthor: false },
    { text: t('intro.point4'), isFounder: false, hasAuthor: false },
    { text: t('intro.point5'), isFounder: false, hasAuthor: false },
    { text: t('intro.point6'), isFounder: false, hasAuthor: false },
    { text: t('intro.point7'), isFounder: false, hasAuthor: false },
    { text: t('intro.finalMessage'), isWelcome: true, isFounder: false, hasAuthor: false },
  ], [t]);

  useEffect(() => {
    if (!visible) {
      setCurrentIndex(0);
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [visible]);

  const handleClose = async () => {
    await SecureStore.setItemAsync(INTRO_SEEN_KEY, 'true');
    onClose();
  };

  const handleSkip = () => {
    const lastIndex = allItems.length - 1;
    scrollViewRef.current?.scrollTo({
      x: lastIndex * width,
      animated: false,
    });
    setCurrentIndex(lastIndex);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setCurrentIndex(index);
      },
    }
  );

  const isLastPage = currentIndex === allItems.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={() => { }} // Prevent back button from closing
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Skip Button - Top */}
        <View style={styles.topSection}>
          <Pressable
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>{t('intro.skip')}</Text>
          </Pressable>
        </View>

        {/* Invisible ScrollView for gesture handling */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {allItems.map((_, index) => (
            <View key={index} style={styles.scrollPage} />
          ))}
        </ScrollView>

        {/* Overlapping Pages with Fade Effect */}
        {allItems.map((item, index) => {
          const isFounder = item.isFounder;
          const isWelcome = item.isWelcome;
          const cityIndex = index % cityImages.length;

          // Calculate opacity based on scroll position for smooth fade effect
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          // Smooth fade for text content
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          // Smooth fade for background images
          const backgroundOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 0.2, 0],
            extrapolate: 'clamp',
          });

          // Parallax effect: background moves slower than scroll (creates depth)
          const backgroundTranslateX = scrollX.interpolate({
            inputRange: [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ],
            outputRange: [-width * 0.3, 0, width * 0.3], // Moves 30% of screen width
            extrapolate: 'clamp',
          });

          return (
            <View key={`page-${index}`} style={styles.overlayPage}>
              {/* Background Image with fade and parallax */}
              {/* @ts-expect-error - React 19 compatibility: Animated.View returns ReactNode | Promise<ReactNode> */}
              <Animated.View
                style={[
                  styles.backgroundContainer,
                  {
                    opacity: backgroundOpacity,
                    transform: [
                      { translateX: backgroundTranslateX },
                    ],
                  },
                ]}
              >
                <Image
                  source={cityImages[cityIndex]}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                />
                <View style={styles.backgroundOverlay} />
              </Animated.View>

              {/* Text Content with fade */}
              {/* @ts-expect-error - React 19 compatibility: Animated.View returns ReactNode | Promise<ReactNode> */}
              <Animated.View
                style={[
                  styles.pageContent,
                  { opacity },
                ]}
                pointerEvents="none"
              >
                <View style={styles.textWrapper}>
                  {isFounder ? (
                    <View style={styles.founderContainer}>
                      <MaterialIcons
                        name="format-quote"
                        size={RFValue(32)}
                        color={COLORS.paper}
                        style={styles.quoteIcon}
                      />
                      <Text style={[styles.text, styles.founderText]}>
                        {item.text.split(/(cite)/i).map((part, i) =>
                          part.toLowerCase() === 'cite' ? (
                            <Text key={i} style={[styles.text, styles.founderText, styles.highlightedCite]}>
                              {part}
                            </Text>
                          ) : (
                            <Text key={i}>{part}</Text>
                          )
                        )}
                      </Text>
                      <Text style={styles.founderNameAlways}>
                        {t('intro.founderName')}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.text,
                        isWelcome && styles.welcomeText,
                        item.text === t('intro.finalMessage') && styles.finalText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  )}
                </View>
              </Animated.View>
            </View>
          );
        })}

        {/* Navigation Button - Bottom (only on last page) */}
        {isLastPage && (
          <View style={styles.bottomSection}>
            <Pressable
              style={styles.beginButton}
              onPress={handleClose}
            >
              <Text style={styles.beginButtonText}>
                {t('intro.beginJourney')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Page Indicators */}
        <View style={styles.indicatorsContainer}>
          {allItems.map((_, index) => {
            const indicatorOpacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            const indicatorScale = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.8, 1, 0.8],
              extrapolate: 'clamp',
            });

            return (
              // @ts-expect-error - React 19 compatibility: Animated.View returns ReactNode | Promise<ReactNode>
              <Animated.View
                key={index}
                style={[
                  styles.indicator,
                  {
                    opacity: indicatorOpacity,
                    transform: [{ scale: indicatorScale }],
                  },
                ]}
              />
            );
          })}
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
  },
  scrollView: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  scrollPage: {
    width: width,
    height: '100%',
  },
  overlayPage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    zIndex: 10,
  },
  backgroundContainer: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    width: width + 200,
    height: height + 200,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for text readability
  },
  pageContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.xxl + 40,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: SPACING.xxl + 40, // Position below the button
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.s,
    zIndex: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.paper,
    marginHorizontal: 4,
  },
  bottomSection: {
    position: 'absolute',
    bottom: SPACING.xxl + 100, // Position above the dots
    left: 0,
    right: 0,
    paddingBottom: 0,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    zIndex: 20,
  },
  textWrapper: {
    paddingVertical: SPACING.m,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: RFValue(20),
    lineHeight: RFValue(26),
    color: COLORS.paper,
    fontFamily: 'IBMPlexSerif_400Regular',
    textAlign: 'center',
  },
  founderText: {
    fontSize: RFValue(20),
    lineHeight: RFValue(26),
    color: COLORS.paper,
    fontFamily: 'IBMPlexSerif_400Regular',
    textAlign: 'center',
  },
  highlightedCite: {
    fontFamily: 'IBMPlexSerif_600SemiBold',
    fontWeight: '700',
  },
  founderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteIcon: {
    marginBottom: SPACING.m,
    opacity: 0.8,
  },
  founderNameAlways: {
    fontSize: RFValue(14),
    lineHeight: RFValue(20),
    color: COLORS.paper,
    fontFamily: 'IBMPlexSerif_400Regular',
    textAlign: 'center',
    marginTop: SPACING.s,
    fontStyle: 'normal',
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
    color: COLORS.paper,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
  beginButton: {
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.paper,
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
    color: COLORS.paper,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
});
