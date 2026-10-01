import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import { COLORS, FONT_MONO } from '../config/constants';

export default function LiveTicker() {
  const [data, setData] = useState([]);
  const animX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    const fetchPrices = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,ripple,solana&vs_currencies=usd&include_24hr_change=true');
        const json = await res.json();
        if (!active) return;
        const formatted = [
          { symbol: 'BTC', price: json.bitcoin?.usd, change: json.bitcoin?.usd_24h_change },
          { symbol: 'ETH', price: json.ethereum?.usd, change: json.ethereum?.usd_24h_change },
          { symbol: 'SOL', price: json.solana?.usd, change: json.solana?.usd_24h_change },
          { symbol: 'XRP', price: json.ripple?.usd, change: json.ripple?.usd_24h_change },
          { symbol: 'USDT', price: json.tether?.usd, change: json.tether?.usd_24h_change },
        ];
        // Duplicate 4 times for infinite scroll seamless loop
        setData([...formatted, ...formatted, ...formatted, ...formatted]);
      } catch (e) {}
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000); // 15s update
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    
    // We animate from 0 to -1000 pixels (roughly the width of one set of items)
    // then loop. 
    animX.setValue(0);
    Animated.loop(
      Animated.timing(animX, {
        toValue: -1500, // scroll left
        duration: 35000, // 35 seconds per loop
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [data, animX]);

  if (data.length === 0) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.tickerRow, { transform: [{ translateX: animX }] }]}>
        {data.map((item, i) => {
          const isUp = item.change >= 0;
          return (
            <View key={i} style={styles.item}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={styles.price}>{item.price ? item.price.toLocaleString() : '---'}</Text>
              <Text style={[styles.change, { color: isUp ? COLORS.success : COLORS.danger }]}>
                {isUp ? '+' : ''}{item.change ? item.change.toFixed(2) : '0.00'}%
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 28,
    backgroundColor: '#030406',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 3000, 
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 40,
    gap: 8,
  },
  symbol: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  price: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT_MONO,
  },
  change: {
    fontSize: 10,
    fontFamily: FONT_MONO,
    fontWeight: '600',
  }
});
