import { fetchLatestNews, subscribeRealtime } from '../services/SupabaseService';
import { NewsWarningService } from '../services/NewsWarningService';
import { LocalStorageService } from '../services/LocalStorageService';
import NewsModel from '../models/NewsModel';
import { REFRESH_INTERVAL_MS, BACKEND_URL } from '../config/constants';

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
    const cached = await LocalStorageService.getNewsCache();
    if (cached && cached.items.length) {
      this.items = cached.items.map((row) => NewsModel.fromSupabase(row));
      this.importantIds = new Set(
        this.items.filter((item) => item.isImportant).map((item) => item.id)
      );
      this.loading = false;
      this.error = null;
      this.emit();
    } else {
      this.loading = true;
      this.error = null;
      this.emit();
    }

    try {
      this.items = await fetchLatestNews();
      this.importantIds = new Set(
        this.items.filter((item) => item.isImportant).map((item) => item.id)
      );
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
      this.items = await fetchLatestNews();
      this.error = null;
      await LocalStorageService.setNewsCache(this.items);
    } catch (error) {
      this.error = error.message;
    }
    this.emit();
  }

  async purgeOldNews() {
    const results = { deleted: 0, localCleared: false };
    try {
      const res = await fetch(`${BACKEND_URL}/api/cleanup`, { method: 'POST' });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        results.deleted = body.deleted || 0;
      }
    } catch {
      /* backend unreachable — vẫn dọn cache cục bộ */
    }
    await LocalStorageService.clearNewsCache();
    results.localCleared = true;
    await this.refresh();
    return results;
  }
}