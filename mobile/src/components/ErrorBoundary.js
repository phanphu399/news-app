import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY } from '../config/constants';

/**
 * Bẫy lỗi render: nếu một màn hình bị lỗi runtime sẽ hiện khung hướng dẫn
 * thay vì để trắng trang. Nhấn "Thử lại" để mount lại toàn bộ tree con.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('[ErrorBoundary]', error?.message || error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>⚠</Text>
        <Text style={styles.title}>Có lỗi hiển thị màn hình này</Text>
        <Text style={styles.body} numberOfLines={3}>
          {this.state.error?.message || 'Lỗi không xác định.'}
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => this.setState({ error: null })}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    backgroundColor: COLORS.background,
  },
  icon: {
    color: COLORS.important,
    fontSize: 34,
    fontWeight: '700',
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    fontFamily: FONT_FAMILY,
  },
  body: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    fontFamily: FONT_FAMILY,
  },
  btn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnText: {
    color: COLORS.primaryText,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: FONT_FAMILY,
  },
});