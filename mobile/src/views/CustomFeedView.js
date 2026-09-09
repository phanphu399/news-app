import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CustomFeedService } from '../services/CustomFeedService';
import { CARD_BACKGROUND, BACKGROUND_COLOR } from '../config/constants';

export default function CustomFeedView({ onAdded }) {
  const [name, setName] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [feeds, setFeeds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    CustomFeedService.getUserFeeds().then(setFeeds).catch(() => setFeeds([]));
    setLoaded(true);
  }, []);

  async function addFeed() {
    if (!name.trim() || !rssUrl.trim()) return;
    const feed = await CustomFeedService.addUserFeed({
      name: name.trim(),
      rssUrl: rssUrl.trim(),
      source: 'Custom',
    });
    setFeeds((prev) => [feed, ...prev]);
    setName('');
    setRssUrl('');
    onAdded?.();
  }

  async function removeFeed(id) {
    const next = await CustomFeedService.removeUserFeed(id);
    setFeeds(next);
    onAdded?.();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.label}>Tên nguồn tin</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: FxStreet KR"
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>RSS URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/rss"
          placeholderTextColor="#475569"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={rssUrl}
          onChangeText={setRssUrl}
        />
        <TouchableOpacity style={styles.addButton} onPress={addFeed}>
          <Text style={styles.addButtonText}>Thêm nguồn tin</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Nguồn tin cá nhân chỉ lưu trên thiết bị của bạn. Không bao giờ được gửi lên server.
        </Text>
      </View>

      {loaded && feeds.length === 0 && (
        <Text style={styles.empty}>Chưa có nguồn tin cá nhân nào.</Text>
      )}

      <FlatList
        data={feeds}
        keyExtractor={(feed) => feed.id}
        renderItem={({ item }) => (
          <View style={styles.feedItem}>
            <View style={styles.feedMeta}>
              <Text style={styles.feedName}>{item.name}</Text>
              <Text style={styles.feedUrl} numberOfLines={1}>
                {item.rssUrl}
              </Text>
            </View>
            <TouchableOpacity style={styles.removeButton} onPress={() => removeFeed(item.id)}>
              <Text style={styles.removeButtonText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    paddingTop: 16,
  },
  form: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f1f5f9',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  addButton: {
    marginTop: 16,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#082f49',
    fontWeight: '700',
    fontSize: 14,
  },
  hint: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 10,
    lineHeight: 15,
  },
  empty: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 24,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  feedMeta: {
    flex: 1,
    marginRight: 12,
  },
  feedName: {
    color: '#f1f5f9',
    fontWeight: '600',
    fontSize: 14,
  },
  feedUrl: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
});