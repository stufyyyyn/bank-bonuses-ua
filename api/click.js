/**
 * /api/click.js — Vercel Serverless Function
 * Трекер кліків на реферальні посилання
 *
 * Env vars required:
 *   TELEGRAM_BOT_TOKEN   — токен бота від @BotFather
 *   TELEGRAM_CHAT_ID     — ID каналу (напр. -1002345678901)
 *   TELEGRAM_MESSAGE_ID  — ID повідомлення для оновлення
 *   UPSTASH_REDIS_REST_URL   — REST URL від Upstash
 *   UPSTASH_REDIS_REST_TOKEN — REST Token від Upstash
 */

const BANKS = {
  'monobank': {
    url: 'https://monobank.ua/r/mXv6sQ',
    label: '🖤 monobank',
    bonus: '100 ₴',
  },
  'privat-gaming': {
    url: 'https://www.privat24.ua/invite/4rxr3',
    label: '🎮 ПриватБанк (Ігрова)',
    bonus: '150 ₴',
  },
  'privat-universal': {
    url: 'https://www.privat24.ua/invite/4t3yk',
    label: '💳 ПриватБанк (Універсальна)',
    bonus: '150 ₴',
  },
  'alliance': {
    url: 'https://alb.ua/r/J1f5MQA',
    label: '🔵 Alliance Bank',
    bonus: '200 ₴',
  },
  'novapay': {
    url: 'https://invite.novapay.ua/6qdCy3v5',
    label: '🔴 NovaPay',
    bonus: '250 ₴',
  },
  'obank': {
    url: 'https://lnk.obank.com.ua/r/SgAgHp?promokod=37390540&referer_id=1445207',
    label: '🟣 O.Bank',
    bonus: '400 ₴',
  },
  'abank': {
    url: 'https://link.a-bank.com.ua/5SdhOPvf',
    label: '🟢 А-Банк',
    bonus: '100 ₴',
  },
  'bvr': {
    url: 'https://go-bvr.onelink.me/yvZl/npd8ndx2',
    label: '🟠 БВР (Сільпо)',
    bonus: '100 ₴',
  },
  'globus': {
    url: 'https://glpls.onelink.me/h7dY/3j5osnqt',
    label: '🔷 GlobusPlus',
    bonus: '100 ₴',
  },
  'vst': {
    url: 'https://bv.onelink.me/clX0/uMreRMuESJ',
    label: '🟪 VST bank',
    bonus: '100 ₴',
  },
  'raif': {
    url: 'https://mrf-static.apps.raiffeisen.ua/v1/member-get-member?adj_t=1s492itc_1szn7s6p&ref_id=15585967&adj_deep_link=app%3A%2F%2Fmember-get-member?label=ref_id15585967',
    label: '💛 Райффайзен (Райф)',
    bonus: '200 ₴',
  },
};

const BANK_ORDER = [
  'monobank', 'privat-gaming', 'privat-universal', 'alliance',
  'novapay', 'obank', 'abank', 'bvr', 'globus', 'vst', 'raif',
];

/* ── Redis helpers (Upstash REST, no SDK) ───────────────── */

async function redisCommand(cmd) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  const res = await fetch(`${url}/${cmd.join('/')}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.result;
}

async function incrementClick(bank) {
  return redisCommand(['INCR', `clicks:${bank}`]);
}

async function getAllClicks() {
  const keys = BANK_ORDER.map((b) => `clicks:${b}`);
  const results = await redisCommand(['MGET', ...keys]);
  const map = {};
  BANK_ORDER.forEach((b, i) => {
    map[b] = parseInt(results[i], 10) || 0;
  });
  return map;
}

/* ── Telegram helper ────────────────────────────────────── */

function pluralClicks(n) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'переходів';
  if (last > 1 && last < 5) return 'переходи';
  if (last === 1) return 'перехід';
  return 'переходів';
}

async function updateTelegramMessage(clicks) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const messageId = process.env.TELEGRAM_MESSAGE_ID;

  if (!token || !chatId || !messageId) return;

  const total = Object.values(clicks).reduce((a, b) => a + b, 0);
  const now = new Date();
  const timeStr = now.toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let text = '📊 <b>BankBonuses.pp.ua — Статистика переходів</b>\n\n';

  for (const bankId of BANK_ORDER) {
    const bank = BANKS[bankId];
    const count = clicks[bankId] || 0;
    text += `${bank.label} (${bank.bonus}) — <b>${count}</b> ${pluralClicks(count)}\n`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📈 <b>Всього: ${total}</b> ${pluralClicks(total)}\n`;
  text += `🕐 Оновлено: ${timeStr}`;

  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: parseInt(messageId, 10),
      text: text,
      parse_mode: 'HTML',
    }),
  });
}

/* ── Main handler ───────────────────────────────────────── */

export default async function handler(req, res) {
  const { bank } = req.query;

  // Validate
  if (!bank || !BANKS[bank]) {
    res.writeHead(302, { Location: '/' });
    return res.end();
  }

  const targetUrl = BANKS[bank].url;

  try {
    // 1. Increment counter in Redis
    await incrementClick(bank);

    // 2. Get all counters
    const clicks = await getAllClicks();

    // 3. Update Telegram message (non-blocking)
    updateTelegramMessage(clicks).catch(console.error);
  } catch (err) {
    console.error('Click tracking error:', err);
    // Don't block redirect on tracking failure
  }

  // 4. Redirect to the actual referral URL
  res.writeHead(302, { Location: targetUrl });
  return res.end();
}
