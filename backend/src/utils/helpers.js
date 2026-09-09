import { createHash, randomUUID } from 'node:crypto';
import { RED_ALERT_KEYWORDS } from '../config/constants.js';

export function hashUrl(url) {
  return createHash('sha256').update(url.trim()).digest('base64url');
}

export function isRedAlert(title) {
  const upper = title.toUpperCase();
  return RED_ALERT_KEYWORDS.some((keyword) => upper.includes(keyword));
}

export function normalizeUrl(url) {
  if (!url) return '';
  let result = url.trim();
  result = result.replace(/^https?:\/\//, '');
  result = result.replace(/^www\./i, '');
  result = result.replace(/\/$/, '');
  return result.toLowerCase();
}

export function sanitizeTitle(title) {
  return title
    .replace(/\s+/g, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export function parseIsoDate(value) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function generateRunId() {
  return randomUUID();
}
