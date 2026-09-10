import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../config/constants';

/**
 * Card dùng chung cho toàn app.
 * - Bề mặt #151921, viền siêu mỏng rgba(255,255,255,0.07), bo góc 14px.
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
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});