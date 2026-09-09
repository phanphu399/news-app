import { fetchLatestNews, subscribeRealtime } from '../services/SupabaseService';
import { CustomFeedService } from '../services/CustomFeedService';
import { LocalStorageService } from '../services/LocalStorageService';
import { NewsWarningService } from '../services/NewsWarningService';
import { REFRESH_INTERVAL_MS } from '../config/constants';

export default class NewsViewModel {
  constructor() {
    this.items = [];
    this.importantIds = new Set();
    this.listeners = new Set();
    this.newItemListeners = new Set();
    this.loading = false;
    this.error = null;
    this.offRealtime = null;
    this.offTimer = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onNewItem(listener) {
    this.newItemListeners.add(listener);
    return () => this.newItemListeners.delete(listener);
  }

  emit() {
    this.listeners.forEach((listener) => listener({ items: this.items, loading: this.loading, error: this.error }));
  }

  async start() {
    await this.initialLoad();
    this.offRealtime = subscribeRealtime(
      (item) => {
        if (item && this.importantIds.has(item.id)) return;
        this.items = [item, ...this.items].slice(0, 150);
        if (item?.isImportant) {
          this.importantIds.add(item.id);
          NewsWarningService.playBeep();
          NewsWarningService.scheduleLocal(item);
        }
        this.newItemListeners.forEach((listener) => listener(item));
        this.emit();
      },
      () => this.refresh(),
      (updated) => {
        if (!updated) return;
        this.items = this.items.map((existing) =>
          existing.id === updated.id ? updated : existing
        );
        this.emit();
      }
    );

    this.offTimer = setInterval(() => {
      this.refresh().catch(() => {});
    }, REFRESH_INTERVAL_MS);
  }

  stop() {
    this.offRealtime?.();
    this.offTimer && clearInterval(this.offTimer);
  }

  async initialLoad() {
    this.loading = true;
    this.error = null;
    this.emit();
    try {
      const [global, custom] = await Promise.all([
        fetchLatestNews(),
        CustomFeedService.fetchAll(),
      ]);
      const merged = this.merge(global, custom);
      this.items = merged;
      this.importantIds = new Set(
        merged.filter((item) => item.isImportant).map((item) => item.id)
      );
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  async refresh() {
    try {
      const global = await fetchLatestNews();
      const custom = await CustomFeedService.fetchAll();
      this.items = this.merge(global, custom);
      this.error = null;
    } catch (error) {
      this.error = error.message;
    }
    this.emit();
  }

  merge(global, custom) {
    const map = new Map();
    for (const item of global) map.set(item.id, item);
    for (const item of custom) if (!map.has(item.id)) map.set(item.id, item);
    return [...map.values()].sort((a, b) => b.publishedAt - a.publishedAt);
  }

  markAllRead() {
    LocalStorageService.setLastReadAt();
  }

  getUnreadCount() {
    return this.items.length;
  }
}