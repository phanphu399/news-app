import { createSign } from 'node:crypto';

const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
const FCM_V1_ENDPOINT = 'https://fcm.googleapis.com/v1/projects/__PROJECT_ID__/messages:send';

const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || '';
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';
const FCM_CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL || '';
const FCM_PRIVATE_KEY = (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const TOPIC = process.env.FCM_TOPIC || 'market_alerts';

let cachedAccessToken = null;
let cachedTokenExpiry = 0;

function base64UrlEncode(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function signJwt(header, payload, secret) {
  const unsigned = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .sign({ key: secret, padding: 1 });
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < cachedTokenExpiry) {
    return cachedAccessToken;
  }

  if (!FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY || !FCM_PROJECT_ID) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' })
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: FCM_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: GOOGLE_TOKEN_URI,
      iat: now,
      exp: now + 3600,
    })
  );

  const assertion = signJwt(header, payload, FCM_PRIVATE_KEY);

  const response = await fetch(GOOGLE_TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  cachedTokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
  return cachedAccessToken;
}

export async function sendImportanceNotification(newsItem) {
  if (!FCM_PROJECT_ID || !newsItem?.title) {
    return { sent: false, reason: 'FCM_PROJECT_ID missing or empty payload' };
  }

  let accessToken = await getAccessToken();

  if (!accessToken && FCM_SERVER_KEY) {
    accessToken = FCM_SERVER_KEY;
  }

  if (!accessToken) {
    return { sent: false, reason: 'No FCM credentials configured' };
  }

  const endpoint = FCM_V1_ENDPOINT.replace('__PROJECT_ID__', FCM_PROJECT_ID);
  const body = {
    message: {
      topic: TOPIC,
      android: {
        priority: 'high',
        notification: {
          title: `\u26A0 ${newsItem.title}`,
          body: newsItem.source ? `Source: ${newsItem.source}` : 'Market alert',
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      webpush: {
        notification: {
          title: newsItem.title,
          body: newsItem.source ? `Source: ${newsItem.source}` : 'Market alert',
          icon: 'https://img.icons8.com/color/96/chart.png',
        },
      },
      data: {
        title: newsItem.title,
        url: newsItem.url,
        category: newsItem.category ?? 'Macro',
        sound: 'default',
      },
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  return { sent: response.ok, status: response.status };
}

export async function notifyImportantNews(items) {
  const important = items.filter((item) => item.is_important);
  if (important.length === 0) {
    return [];
  }

  await Promise.all(important.map((item) => sendImportanceNotification(item)));
  return important.map(() => ({ sent: true }));
}