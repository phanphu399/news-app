import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { translateToVietnamese } from '../services/TranslationService';

export default function TranslatedText({ text, ...rest }) {
  const [translated, setTranslated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setTranslated(null);
    translateToVietnamese(text)
      .then((value) => {
        if (!cancelled) setTranslated(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [text]);

  const shown = translated || text;
  return <Text {...rest}>{shown}</Text>;
}