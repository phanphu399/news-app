import { useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

const SWIPE_THRESHOLD = 90;
const SWIPE_FLING = 420;

/**
 * Cho phép vuốt ngang (trái/phải) để đóng một phần tử toast.
 * Trả về { panHandlers, drag } — attach panHandlers vào Animated.View,
 * thêm `translateX: drag` vào transform.
 */
export default function useSwipeDismiss({ onDismiss }) {
  const drag = useRef(new Animated.Value(0)).current;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => drag.setValue(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) {
          Animated.timing(drag, {
            toValue: gesture.dx > 0 ? SWIPE_FLING : -SWIPE_FLING,
            duration: 160,
            useNativeDriver: true,
          }).start(() => onDismiss?.());
        } else {
          Animated.spring(drag, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 40,
          }).start();
        }
      },
    })
  ).current;

  return { panHandlers: pan.panHandlers, drag };
}