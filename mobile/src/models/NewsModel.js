export default class NewsModel {
  constructor({ id, title, source, url, category, is_important, published_at }) {
    this.id = id;
    this.title = title;
    this.source = source ?? 'Unknown';
    this.url = url;
    this.category = category ?? 'Macro';
    this.isImportant = Boolean(is_important);
    this.publishedAt = published_at ? new Date(published_at) : new Date();
  }

  static fromSupabase(row) {
    return new NewsModel(row);
  }

  static fromCustomFeed({ title, url, source, publishedAt, category = 'Custom' }) {
    return new NewsModel({
      id: `custom_${url}`,
      title,
      source: source || 'Custom',
      url,
      category,
      is_important: false,
      published_at: (publishedAt || new Date()).toISOString(),
    });
  }
}