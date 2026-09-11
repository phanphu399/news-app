import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS, FONT_FAMILY } from '../config/constants';

/**
 * Logo động thương hiệu "MacroPulse".
 * - Staggered draw: tia chớp được "vẽ" từ dưới lên (strokeDashoffset + fade) ~300ms.
 * - Fade-in tên sau khi bolt xong.
 * - Looping: các data-dot trôi dọc tia chớp + chữ "Pulse" thở (opacity pulse).
 */

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const BOLT_PATH = 'M13 2 L4.5 13.5 H11 L9.5 22 L19.5 9.5 H12.5 L13 2';

function useLoop(toValue, duration, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value, toValue, duration, delay]);
  return value;
}

/** Chấm LIVE xanh với vòng ripple lan tỏa. */
export function LiveDot({ size = 8, color = COLORS.success }) {
  const ripple = useLoop(1, 1500);
  return (
    <View style={[styles.liveWrap, { width: size * 2.6, height: size * 2.6 }]}>
      <Animated.View
        style={[
          styles.rippleRing,
          {
            width: size * 2.4,
            height: size * 2.4,
            borderRadius: size * 1.2,
            borderColor: color,
            opacity: ripple.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.55, 0.1, 0] }),
            transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] }) }],
          },
        ]}
      />
      <View
        style={[
          styles.liveDot,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      />
    </View>
  );
}

/** Logo động: tia chớp vẽ dần + data-dot chảy + tên thở. */
export function PulseLogo({
  size = 30,
  showText = true,
  scale = 1,
  textColor = COLORS.text,
  pulseColor = COLORS.primary,
  onDrawn,
}) {
  const draw = useRef(new Animated.Value(0)).current;
  const nameFade = useRef(new Animated.Value(0)).current;
  const breathe = useLoop(1, 1600, 400);
  const flow = useLoop(1, 2400);

  useEffect(() => {
    const timing = Animated.timing(draw, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    timing.start();
    const nameAnim = Animated.timing(nameFade, {
      toValue: 1,
      duration: 300,
      delay: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    nameAnim.start();
    const done = setTimeout(() => onDrawn?.(), 620);
    return () => {
      timing.stop();
      nameAnim.stop();
      clearTimeout(done);
    };
  }, [draw, nameFade, onDrawn]);

  // Đoạn tia chớp được vẽ từ dưới lên.
  const drawOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const strokeDasharray = 200;

  // Data-dot trôi liên tục từ đáy bolt (y=20) lên đỉnh (y=4).
  const flowY = flow.interpolate({ inputRange: [0, 1], outputRange: [18, 5] });
  const flowX = flow.interpolate({ inputRange: [0, 1], outputRange: [8.5, 14.5] });
  const flowOpacity = flow.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={styles.brand} pointerEvents="none">
      <View style={[styles.markWrap, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" style={[styles.markSvg, { transform: [{ rotate: '0deg' }] }]}>
          <AnimatedPath
            d={BOLT_PATH}
            fill="none"
            stroke={pulseColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={drawOffset.interpolate({
              inputRange: [0, 1],
              outputRange: [strokeDasharray, 0],
            })}
            opacity={drawOffset}
          />
          <AnimatedCircle
            cx={flowX}
            cy={flowY}
            r={1.4}
            fill={pulseColor}
            opacity={flowOpacity}
          />
        </Svg>
      </View>

      {showText && (
        <Animated.View style={[styles.nameWrap, { opacity: nameFade }]}>
          <Text style={[styles.nameThin, { color: textColor, fontSize: 14 * scale }]}>
            Macro
          </Text>
          <Animated.Text
            style={[
              styles.nameBold,
              {
                color: pulseColor,
                fontSize: 14 * scale,
                opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }),
              },
            ]}
          >
            Pulse
          </Animated.Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  markSvg: {
    width: '100%',
    height: '100%',
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  nameThin: {
    fontWeight: '300',
    letterSpacing: 0.4,
    fontFamily: FONT_FAMILY,
  },
  nameBold: {
    fontWeight: '800',
    letterSpacing: 0.4,
    fontFamily: FONT_FAMILY,
  },
  liveWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    borderWidth: 1,
    top: 0,
    left: 0,
  },
  liveDot: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default PulseLogo;