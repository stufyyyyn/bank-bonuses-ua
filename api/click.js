/**
 * /api/click.js — Vercel Serverless Function
 * Трекер кліків на реферальні посилання
 */

import { BANKS, redisCommand, updateTelegramMessage } from './_stats.js';

export default async function handler(req, res) {
  const { bank } = req.query;

  // Validate
  if (!bank || !BANKS[bank]) {
    res.writeHead(302, { Location: '/' });
    return res.end();
  }

  const targetUrl = BANKS[bank].url;

  try {
    // 1. Збільшуємо лічильник переходів у Redis
    await redisCommand(['INCR', `clicks:${bank}`]);

    // 2. Оновлюємо закріплене повідомлення в Telegram (Kyiv time)
    updateTelegramMessage().catch(console.error);
  } catch (err) {
    console.error('Click tracking error:', err);
  }

  // 3. 302-редирект на справжнє партнерське посилання
  res.writeHead(302, { Location: targetUrl });
  return res.end();
}
