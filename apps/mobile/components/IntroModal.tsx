import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Modal, Pressable, Animated, Dimensions, Image, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, FONTS, LAYOUT, HEADER, MODAL, createStyles } from '../constants/theme';
import * as SecureStore from 'expo-secure-store';

const INTRO_SEEN_KEY = 'intro_seen';
const { width, height } = Dimensions.get('window');

const logoSource = require('../assets/logo_transparent.png');

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

  // Parse text for highlighting "Citewalk" in founder message
  const renderText = () => {
    if (isFounder) {
      const parts = text.split(/(Citewalk)/i);
      return (
        <View style={styles.founderContainer}>
          <Text style={style}>
            {parts.map((part, index) =>
              part.toLowerCase() === 'Citewalk' ? (
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
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const allItems = React.useMemo(() => [
    { text: t('intro.founderMessage'), isFounder: true, isQuote: false },
    { text: t('intro.point1'), isFounder: false, isQuote: false },
    { text: t('intro.point2'), isFounder: false, isQuote: false },
    { text: t('intro.point3'), isFounder: false, isQuote: false },
    { text: t('intro.finalMessage'), isWelcome: true, isFounder: false, isQuote: false },
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
        <View style={[styles.topSection, { paddingTop: insets.top + SPACING.l, paddingHorizontal: LAYOUT.contentPaddingHorizontal }]}>
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
          showsVerticalScrollIndicator={false}
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
          const isQuote = item.isQuote;
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
                  {(isFounder || isQuote) ? (
                    <View style={styles.founderContainer}>
                      <MaterialIcons
                        name="format-quote"
                        size={28}
                        color={COLORS.paper}
                        style={styles.quoteIcon}
                      />
                      <Text style={[styles.text, styles.founderText]}>
                        {isFounder
                          ? item.text.split(/(Citewalk)/i).map((part, i) =>
                            part.toLowerCase() === 'Citewalk' ? (
                              <Text key={i} style={[styles.text, styles.founderText, styles.highlightedCite]}>
                                {part}
                              </Text>
                            ) : (
                              <Text key={i}>{part}</Text>
                            )
                          )
                          : item.text}
                      </Text>
                      {isFounder && (
                        <Text style={styles.founderNameAlways}>
                          {t('intro.founderName')}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.welcomePageContent}>
                      {isWelcome && (
                        <Image source={logoSource} style={styles.welcomeLogo} resizeMode="contain" />
                      )}
                      <Text
                        style={[
                          styles.text,
                          isWelcome && styles.welcomeText,
                          item.text === t('intro.finalMessage') && styles.finalText,
                        ]}
                      >
                        {item.text}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          );
        })}

        {/* Navigation Button - Bottom (only on last page) */}
        {isLastPage && (
          <View style={[styles.bottomSection, { bottom: insets.bottom + SPACING.xxl + 56, paddingHorizontal: LAYOUT.contentPaddingHorizontal }]}>
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
        <View style={[styles.indicatorsContainer, { bottom: insets.bottom + SPACING.l }]}>
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

            const onIndicatorPress = () => {
              scrollViewRef.current?.scrollTo({
                x: index * width,
                animated: true,
              });
              setCurrentIndex(index);
            };

            return (
              <Pressable
                key={index}
                onPress={onIndicatorPress}
                style={styles.indicatorPressable}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {/* @ts-expect-error - React 19 compatibility: Animated.View returns ReactNode | Promise<ReactNode> */}
                <Animated.View
                  style={[
                    styles.indicator,
                    {
                      opacity: indicatorOpacity,
                      transform: [{ scale: indicatorScale }],
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

export async function shouldShowIntro(): Promise<boolean> {
  const seen = await SecureStore.getItemAsync(INTRO_SEEN_KEY);
  return seen !== 'true';
}

export async function resetIntro(): Promise<void> {
  await SecureStore.deleteItemAsync(INTRO_SEEN_KEY);
}

const styles = createStyles({
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
    backgroundColor: COLORS.overlay,
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
    alignItems: 'flex-end',
    zIndex: 20,
  },
  indicatorsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.s,
    zIndex: 20,
  },
  indicatorPressable: {
    padding: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.paper,
    marginHorizontal: SPACING.xs,
  },
  bottomSection: {
    position: 'absolute',
    left: 0,
    right: 0,
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
    fontSize: 26,
    lineHeight: 38,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
    textAlign: 'center',
  },
  founderText: {
    fontSize: 26,
    lineHeight: 38,
    color: COLORS.paper,
    fontFamily: FONTS.serifRegular,
    textAlign: 'center',
  },
  highlightedCite: {
    fontFamily: FONTS.serifSemiBold,
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
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.s,
  },
  welcomePageContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.l,
  },
  welcomeLogo: {
    width: 96,
    height: 96,
    marginBottom: SPACING.xs,
  },
  finalText: {
    fontSize: 38,
    lineHeight: 50,
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
  },
  welcomeText: {
    fontSize: 48,
    lineHeight: 60,
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
    marginTop: 0,
  },
  skipButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  beginButton: {
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.paper,
    backgroundColor: 'transparent',
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginButtonText: {
    fontSize: MODAL.buttonFontSize,
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
});
