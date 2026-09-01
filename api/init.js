/**
 * /api/init.js — One-time setup
 * Відправляє першу статистику у Telegram канал.
 * Запустити ОДИН РАЗ після деплою: GET https://bankbonuses.pp.ua/api/init
 * Зберегти повернутий message_id як TELEGRAM_MESSAGE_ID у Vercel env vars.
 *
 * Env vars required:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 */

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID',
    });
  }

  const text = [
    '📊 <b>BankBonuses.pp.ua — Статистика переходів</b>',
    '',
    '🖤 monobank (100 ₴) — <b>0</b> переходів',
    '🎮 ПриватБанк (Ігрова) (150 ₴) — <b>0</b> переходів',
    '💳 ПриватБанк (Універсальна) (150 ₴) — <b>0</b> переходів',
    '🔵 Alliance Bank (200 ₴) — <b>0</b> переходів',
    '🔴 NovaPay (250 ₴) — <b>0</b> переходів',
    '🟣 O.Bank (400 ₴) — <b>0</b> переходів',
    '🟢 А-Банк (100 ₴) — <b>0</b> переходів',
    '🟠 БВР (Сільпо) (100 ₴) — <b>0</b> переходів',
    '🔷 GlobusPlus (100 ₴) — <b>0</b> переходів',
    '🟪 VST bank (100 ₴) — <b>0</b> переходів',
    '💛 Райффайзен (Райф) (200 ₴) — <b>0</b> переходів',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '📈 <b>Всього: 0</b> переходів',
    '🕐 Ініціалізовано',
  ].join('\n');

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
