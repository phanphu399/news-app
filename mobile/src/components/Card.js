import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../config/constants';

/**
 * Card dùng chung cho toàn app.
 * - Bề mặt #171B21, viền siêu mỏng rgba(255,255,255,0.07), bo góc 14px.
 * - Khi có onPress tự chuyển thành TouchableOpacity.
 */
export default function Card({ children, style, onPress, borderColor, radius = 16, ...rest }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      activeOpacity={0.8}
      style={[
        styles.card,
        { borderRadius: radius },
        borderColor ? { borderColor } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});