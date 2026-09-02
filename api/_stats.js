/**
 * /api/_stats.js — Shared analytics module
 * Upstash Redis counters + Telegram message updater with Kyiv timezone
 */

export const BANKS = {
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
  'raif': {
    url: 'https://mrf-static.apps.raiffeisen.ua/v1/member-get-member?adj_t=1s492itc_1szn7s6p&ref_id=15585967&adj_deep_link=app%3A%2F%2Fmember-get-member?label=ref_id15585967',
    label: '💛 Райффайзен (Райф)',
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
};

export const BANK_ORDER = [
  'monobank',
  'privat-gaming',
  'privat-universal',
  'alliance',
  'raif',
  'novapay',
  'obank',
  'abank',
  'bvr',
  'globus',
  'vst',
];

export async function redisCommand(cmd) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const res = await fetch(`${url}/${cmd.join('/')}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.result;
}

export function pluralWord(n, one, few, many) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

export function getKyivTime() {
  const now = new Date();
  return now.toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export async function getStats() {
  const bankKeys = BANK_ORDER.map((b) => `clicks:${b}`);
  const allKeys = ['visits:total', 'visits:unique', ...bankKeys];
  const results = await redisCommand(['MGET', ...allKeys]);

  const totalVisits = parseInt(results?.[0], 10) || 0;
  const uniqueVisits = parseInt(results?.[1], 10) || 0;

  const clicks = {};
  let totalClicks = 0;
  BANK_ORDER.forEach((b, i) => {
    const count = parseInt(results?.[i + 2], 10) || 0;
    clicks[b] = count;
    totalClicks += count;
  });

  return {
    totalVisits,
    uniqueVisits,
    clicks,
    totalClicks,
  };
}

export function buildMessageText(stats) {
  const kyivTime = getKyivTime();
  const vTotal = stats.totalVisits;
  const vUnique = stats.uniqueVisits;

  let text = '📊 <b>BankBonuses.pp.ua — Статистика в реальному часі</b>\n\n';

  text += '👥 <b>Відвідувачі сайту:</b>\n';
  text += `• Всього переглядів: <b>${vTotal}</b> ${pluralWord(vTotal, 'візит', 'візити', 'візитів')}\n`;
  text += `• Унікальних: <b>${vUnique}</b> ${pluralWord(vUnique, 'користувач', 'користувачі', 'користувачів')}\n\n`;

  text += '━━━━━━━━━━━━━━━━━━━━\n';
  text += '💳 <b>Переходи по банках:</b>\n';

  for (const bankId of BANK_ORDER) {
    const bank = BANKS[bankId];
    const count = stats.clicks[bankId] || 0;
    text += `${bank.label} (${bank.bonus}) — <b>${count}</b> ${pluralWord(count, 'перехід', 'переходи', 'переходів')}\n`;
  }

  text += '\n━━━━━━━━━━━━━━━━━━━━\n';
  text += `📈 <b>Всього кліків: ${stats.totalClicks}</b> ${pluralWord(stats.totalClicks, 'клік', 'кліки', 'кліків')}\n`;
  text += `🕐 <b>Час (Київ):</b> ${kyivTime}`;

  return text;
}

export async function updateTelegramMessage() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const messageId = process.env.TELEGRAM_MESSAGE_ID;

  if (!token || !chatId || !messageId) return;

  const stats = await getStats();
  const text = buildMessageText(stats);

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
