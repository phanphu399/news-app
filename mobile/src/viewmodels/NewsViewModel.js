import { fetchLatestNews, subscribeRealtime } from '../services/SupabaseService';
import { NewsWarningService } from '../services/NewsWarningService';
import { LocalStorageService } from '../services/LocalStorageService';
import NewsModel from '../models/NewsModel';
import { REFRESH_INTERVAL_MS } from '../config/constants';

function sortByTime(items) {
  return items
    .slice()
    .sort((a, b) => {
      const byPublish = new Date(b.publishedAt) - new Date(a.publishedAt);
      if (byPublish !== 0) return byPublish;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

const NEW_ITEM_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export default class NewsViewModel {
  constructor() {
    this.items = [];
    this.importantIds = new Set();
    this.knownIds = new Set();
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
        if (!item) return;
        if (this.knownIds.has(item.id)) return;
        this.knownIds.add(item.id);

        const ageMs = Date.now() - new Date(item.publishedAt).getTime();
        const isFresh = ageMs >= 0 && ageMs <= NEW_ITEM_MAX_AGE_MS;

        this.items = sortByTime([item, ...this.items]).slice(0, 150);
        if (item?.isImportant) {
          this.importantIds.add(item.id);
          NewsWarningService.playBeep();
          NewsWarningService.scheduleLocal(item);
        }
        if (isFresh) {
          this.newItemListeners.forEach((listener) => listener(item));
        }
        this.emit();
      },
      () => this.refresh(),
      (updated) => {
        if (!updated) return;
        this.items = this.items.map((existing) =>
          existing.id === updated.id ? updated : existing
        );
        if (updated?.isImportant) this.importantIds.add(updated.id);
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
    const cached = await LocalStorageService.getNewsCache();
    if (cached && cached.items.length) {
      this.items = sortByTime(cached.items.map((row) => NewsModel.fromSupabase(row)));
      this.importantIds = new Set(
        this.items.filter((item) => item.isImportant).map((item) => item.id)
      );
      this.knownIds = new Set(this.items.map((item) => item.id));
      this.loading = false;
      this.error = null;
      this.emit();
    } else {
      this.loading = true;
      this.error = null;
      this.emit();
    }

    try {
      this.items = sortByTime(await fetchLatestNews());
      this.importantIds = new Set(
        this.items.filter((item) => item.isImportant).map((item) => item.id)
      );
      this.knownIds = new Set(this.items.map((item) => item.id));
      this.error = null;
      await LocalStorageService.setNewsCache(this.items);
    } catch (error) {
      if (!this.items.length) this.error = error.message;
    } finally {
      this.loading = false;
      this.emit();
    }
  }

  async refresh() {
    try {
      this.items = sortByTime(await fetchLatestNews());
      this.importantIds = new Set(
        this.items.filter((item) => item.isImportant).map((item) => item.id)
      );
      this.knownIds = new Set(this.items.map((item) => item.id));
      this.error = null;
      await LocalStorageService.setNewsCache(this.items);
    } catch (error) {
      this.error = error.message;
    }
    this.emit();
  }
}