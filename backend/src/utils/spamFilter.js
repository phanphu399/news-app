/**
 * Bộ lọc tin rác / spam dùng chung cho toàn pipeline.
 * - isJunkItem: gạt bài kiểu quảng cáo, clickbait, betting, listicle vớ vẩn
 *   (áp dụng NGAY khi cào để DB không phình).
 * - dedupeByTitle: bỏ bài trùng title (Google News trả cùng story từ nhiều
 *   query -> nhiều link google redirect khác nhau -> DB phình gấp bội).
 * Tiêu chí giữ khi trùng: bài is_important, nguồn không phải Google News, mới.
 */

/** Cụm từ kiểu quảng cáo / tín hiệu spam / clickbait vô nghĩa với app. */
export const SPAM_REGEX = [
  /\b(top\s+\d+\s+(gainers|losers|movers|stocks|etfs?))\b/i,
  /\b(stocks? to (watch|buy|sell|avoid))\b/i,
  /\b(market movers|market recap|markets wrap|stock picks|buy the dip|sell now)\b/i,
  /\b(pump and dump|moonshot|shill(ing)?|presale|airdropp?|degen)\b/i,
  /\b(free (tokens?|coins?|signals?|tips?)|claim(ing)? (free )?(rewards?|tokens?)|referral (code|bonus)|bonus code)\b/i,
  /\b(get rich|instant profit|guaranteed profit|passive income|work from home|make money fast)\b/i,
  /\b(sign up (now|today)?|register now|limited time( offer)?|act (fast|now)|don'?t miss (out|this)|hot (deal|offer))\b/i,
  /\b(sponsored|advertis|promo(tion)? code?|discount code)\b/i,
  /\b(casino|sportsbook|betting|lottery|slot machines?|real money)\b/i,
  /\b(gold|silver|xau|oil|brent|crypto|bitcoin|btc) (price)? (forecast|prediction|price forecast)\b/i,
  /\b(gold price (today|now))\b/i,
  /\b(\d+)\s+(ways|tips|tricks|mistakes|hacks|reasons)\b/i,
  /\b(things you (should|must) (know|do|avoid))\b/i,
  /\b(the secret|nobody tells you|biggest mistake|surprising stat|unexpected math)\b/i,
  /\b(watch:|watch now|in 60 seconds|3 charts|2 charts)\b/i,
];

/** Nội dung Crypto/Bitcoin — người dùng không muốn cào nữa. */
export const CRYPTO_REGEX = [
  /\b(bitcoin|btc|ethereum|eth|dogecoin|xrp|solana|litecoin|tether|usdt|altcoin|stablecoin)\b/i,
  /\b(crypto|cryptocurrenc(y|ies))\b/i,
  /\bblockchain\b/i,
];

function isBitcoinContent(text) {
  return CRYPTO_REGEX.some((re) => re.test(text));
}

/** Độ dài tiêu đề tối thiểu còn nhận — dưới ngưỡng là rác (fragment, nav). */
export const MIN_TITLE_LENGTH = 16;

/** Tiêu đề dài toàn chữ in hoa (quá 60% chữ cái) với >= 40 ký tự là spam. */
const CAPS_MIN_LENGTH = 40;
const CAPS_RATIO = 0.6;

export function isJunkTitle(title) {
  if (!title || typeof title !== 'string') return true;
  const text = title.trim();
  if (!text || text.length < MIN_TITLE_LENGTH) return true;
  if (SPAM_REGEX.some((re) => re.test(text))) return true;
  if (isBitcoinContent(text)) return true;

  if (text.length >= CAPS_MIN_LENGTH) {
    const letters = text.replace(/[^A-Za-z]/g, '');
    const upper = text.replace(/[^A-Z]/g, '');
    if (letters.length > 0 && upper.length / letters.length > CAPS_RATIO) return true;
  }
  return false;
}

export function isJunkItem(item) {
  return isJunkTitle(item?.title);
}

/** Key so trùng: chữ thường, chỉ giữ chữ & số (bỏ dấu câu, site suffix...). */
export function titleKey(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Ưu tiên giữ khi trùng title: important > nguồn thật (không Google) > mới hơn. */
function isPreferred(candidate, current) {
  if (!current) return true;
  if (candidate.is_important !== current.is_important) return candidate.is_important;
  const candidateGoogle = candidate.source === 'Google News';
  const currentGoogle = current.source === 'Google News';
  if (candidateGoogle !== currentGoogle) return !candidateGoogle;
  const a = new Date(candidate.published_at || 0).getTime();
  const b = new Date(current.published_at || 0).getTime();
  return a > b;
}

/**
 * Dedupe theo title. Trả về { shouldKeep, dropped } — KHÔNG đụng DB,
 * caller quyết định upsert/delete theo danh sách trả về.
 */
export function buildTitleSelection(items) {
  const kept = [];
  const dropped = [];
  const byKey = new Map();
  for (const item of items) {
    const key = titleKey(item.title);
    if (!key) {
      dropped.push(item);
      continue;
    }
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, item);
      kept.push(item);
      continue;
    }
    if (isPreferred(item, current)) {
      dropped.push(current);
      kept[kept.indexOf(current)] = item;
      byKey.set(key, item);
    } else {
      dropped.push(item);
    }
  }
  return { kept, dropped };
}