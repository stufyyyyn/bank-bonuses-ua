/**
 * /api/init.js — One-time setup
 * Відправляє початкове повідомлення зі статистикою у Telegram канал.
 * Запустити ОДИН РАЗ: GET https://bankbonuses.pp.ua/api/init
 * Зберегти повернутий message_id як TELEGRAM_MESSAGE_ID у Vercel env vars.
 */

import { getStats, buildMessageText } from './_stats.js';

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID',
    });
  }

  const stats = await getStats();
  const text = buildMessageText(stats);

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    }
  );

  const data = await response.json();

  if (!data.ok) {
    return res.status(500).json({ error: 'Telegram API error', details: data });
  }

  const messageId = data.result.message_id;

  return res.status(200).json({
    success: true,
    message_id: messageId,
    instruction: `Збережіть це значення як TELEGRAM_MESSAGE_ID у Vercel Environment Variables: ${messageId}`,
  });
}
