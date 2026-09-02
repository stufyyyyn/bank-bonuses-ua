/**
 * /api/visit.js — Vercel Serverless Function
 * Трекер відвідувачів сайту (загальні та унікальні)
 */

import { redisCommand, updateTelegramMessage } from './_stats.js';

export default async function handler(req, res) {
  // Allow both GET and POST (for sendBeacon / fetch)
  const isNew = req.query.is_new === '1' || req.body?.is_new === '1' || req.body === '1';

  try {
    // 1. Збільшуємо загальну кількість переглядів
    await redisCommand(['INCR', 'visits:total']);

    // 2. Якщо новий відвідувач — збільшуємо унікальних
    if (isNew) {
      await redisCommand(['INCR', 'visits:unique']);
    }

    // 3. Оновлюємо закріплене повідомлення в Telegram (Kyiv time)
    updateTelegramMessage().catch(console.error);
  } catch (err) {
    console.error('Visit tracking error:', err);
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ ok: true });
}
