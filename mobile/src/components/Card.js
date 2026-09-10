import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../config/constants';

/**
 * Card dùng chung cho toàn app.
 * - Bo góc 14px, border mờ rgba(255,255,255,0.08), nền sáng hơn nền app 1 tông.
 * - Khi có onPress tự chuyển thành TouchableOpacity.
 */
export default function Card({ children, style, onPress, borderColor, radius = 14, ...rest }) {
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
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});