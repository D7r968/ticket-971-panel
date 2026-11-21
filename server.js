'use strict';

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const BOT_KEY = process.env.BOT_KEY === 'ticket' ? 'ticket' : 'security';
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = process.env.GH_OWNER || 'D7r968';
const GH_REPO = process.env.GH_REPO || '';
const RENDER_KEY = process.env.RENDER_KEY || '';
const LOG_TOKEN = process.env.LOG_TOKEN || 'change-me';
const PORT = Number(process.env.PORT) || 3000;
const LINK_TTL = 12 * 60 * 1000;
const linkSessions = new Map();

const CLIENTS = {
  security: { id: '1572299572229840978', name: 'حماية فورية (971)' },
  ticket: { id: '1573686274420769012', name: 'Ticket 971' }
};
const clientId = CLIENTS[BOT_KEY].id;

const META = {
  security: {
    fixedName: 'حماية فورية (971)',
    fixedNameEn: 'Instant Protection (971)',
    avatar: 'https://cdn.discordapp.com/avatars/1572299572229840978/7efb4de0096209ab14454c0a752bd0a9.png?size=256',
    invite: 'https://discord.com/oauth2/authorize?client_id=1572299572229840978&scope=bot%20applications.commands&permissions=8',
    health: process.env.BOT_HEALTH || 'https://abuabdulaziz-security-bot.onrender.com/',
    service: process.env.SERVICE_ID || 'srv-dc0rc0avcj2c73bhkucg',
    accent: '#ed4245',
    taglineAr: 'درع سيرفرك — استجابة فورية قبل ما التخريب يبدأ',
    taglineEn: 'Your server shield — instant response before damage happens',
    descAr: 'يكتشف الحذف والسبام والرايد والتلاعب بالصلاحيات ويرجع كل شي خلال ثواني. تحكم كامل من نفس الموقع.',
    descEn: 'Detects deletion, spam, raids and permission tampering — restores everything in seconds. Full control from one place.',
    featuresAr: [
      { icon: '🛡️', title: 'استجابة فورية', desc: 'حذف رومين ورا بعض → سحب رتب + باي + إرجاع فوري لكل الرومات والرتب.', target: 'secDelete' },
      { icon: '💬', title: 'مكافحة السبام', desc: '١٠ رسائل/٥ ثواني أو ٢٠/٦٠ ثانية → تايم أوت ومسح تلقائي.', target: 'secSpam' },
      { icon: '🚨', title: 'منع الرايد', desc: 'أي بوت غريب يدخل أو ٣ قنوات تنشأ بسرعة → طرد فوري واستعادة.', target: 'secRaid' },
      { icon: '🔑', title: 'صلاحيات محمية', desc: '/protect add و remove و list محفوظة برول دائم داخل السيرفر.', target: 'perms' },
      { icon: '🔄', title: 'نسخة احتياطية', desc: 'نسخة لكل سيرفر على حدة تتحدث تلقائياً كل ساعة وعند التشغيل.', target: 'secBackup' },
      { icon: '📜', title: 'سجل الأحداث', desc: 'كل تحذير وعقوبة تظهر لك في تبويب السجل داخل الموقع.', target: 'log' }
    ],
    featuresEn: [
      { icon: '🛡️', title: 'Instant response', desc: 'Two deleted channels → strip roles + ban + instant restore of everything.', target: 'secDelete' },
      { icon: '💬', title: 'Anti-spam', desc: '10 msgs/5s or 20/60s → instant timeout and message purge.', target: 'secSpam' },
      { icon: '🚨', title: 'Anti-raid', desc: 'Any bot joins or 3 channels created fast → instant kick and restore.', target: 'secRaid' },
      { icon: '🔑', title: 'Protected permissions', desc: '/protect add, remove and list stored in a persistent Discord role.', target: 'perms' },
      { icon: '🔄', title: 'Backups', desc: 'Per-server snapshot refreshed hourly and on startup.', target: 'secBackup' },
      { icon: '📜', title: 'Event log', desc: 'Every warning and punishment appears in the site log tab.', target: 'log' }
    ],
    stepsAr: ['ضيف البوت لسيرفرك بصلاحيات إدارية', 'ارفع رول البوت لأعلى ترتيب ممكن', 'اضبط الأرقام من تبويب السيطرة — التغيير يوصل خلال ٣٠ ثانية'],
    stepsEn: ['Invite the bot with admin permissions', 'Move its role near the top of the hierarchy', 'Tune the limits in the Control tab — applied within 30 seconds']
  },
  ticket: {
    fixedName: 'Ticket 971',
    fixedNameEn: 'Ticket 971',
    avatar: 'https://cdn.discordapp.com/avatars/1573686274420769012/5062523997a590a6f08e1dfd2f449fd4.png?size=256',
    invite: 'https://discord.com/oauth2/authorize?client_id=1573686274420769012&scope=bot%20applications.commands&permissions=8',
    health: process.env.BOT_HEALTH || 'https://discord-ticket-bot-v2-3uzx.onrender.com/',
    service: process.env.SERVICE_ID || 'srv-dc0qicuc6qcc73f5m0tg',
    accent: '#5865f2',
    taglineAr: 'تذاكر منظمة — زر واحد وفريق الدعم يجيك',
    taglineEn: 'Tickets made simple — one button and support is on the way',
    descAr: 'زر واحد يفتح قائمة: شراء من متجر / استفسار / حل مشكلة، وبعدها قناة خاصة. تحكم كامل بالنصوص والألوان من نفس الموقع.',
    descEn: 'One button opens a menu: buy / question / problem, then a private channel. Edit all texts and colors from one place.',
    featuresAr: [
      { icon: '🎫', title: 'زر واحد', desc: 'لوحة بسيطة تفتح قائمة الأنواع ثم قناة خاصة بالمستخدم وفريق الدعم.', target: 'tickPanel' },
      { icon: '🛒', title: 'أنواع جاهزة', desc: 'شراء من متجر، استفسار، حل مشكلة — عدّل أسماء البانل والنصوص من هنا.', target: 'tickPanel' },
      { icon: '👋', title: 'رسائل جاهزة', desc: 'عنوان البانل ورسالة الترحيب تتعدل من تبويب التذاكر وتوصل فوراً.', target: 'tickWelcome' },
      { icon: '⏰', title: 'منشن محسوب', desc: 'أول منشن تحذير، والثاني خلال ٢٤ ساعة تايم أوت ٣ ساعات.', target: 'tickMention' },
      { icon: '🎨', title: 'ألوانك أنت', desc: 'لون البانل والمظاهر كلها من حقل واحد في اللوحة.', target: 'tickColor' },
      { icon: '📊', title: 'حد التذاكر', desc: 'تحكم بعدد التذاكر المسموحة لكل عضو في نفس الوقت.', target: 'tickIds' }
    ],
    featuresEn: [
      { icon: '🎫', title: 'One button', desc: 'Clean panel opens a type menu then a private support channel.', target: 'tickPanel' },
      { icon: '🛒', title: 'Ready types', desc: 'Buy, question, problem — edit panel titles and texts right here.', target: 'tickPanel' },
      { icon: '👋', title: 'Ready texts', desc: 'Panel title and welcome message editable in the Tickets tab, applied instantly.', target: 'tickWelcome' },
      { icon: '⏰', title: 'Mention rules', desc: 'First mention warns, second within 24h gives a 3 hour timeout.', target: 'tickMention' },
      { icon: '🎨', title: 'Your colors', desc: 'Panel color and embeds controlled from a single field.', target: 'tickColor' },
      { icon: '📊', title: 'Ticket limit', desc: 'Control how many open tickets each member can have.', target: 'tickIds' }
    ],
    stepsAr: ['ضيف البوت لسيرفرك بصلاحيات إدارية', 'حدد رول الدعم والكاتيجوري من تبويب التذاكر', 'اعمل Panel من الأمر الخاص بالبوت — التعديلات توصل خلال ٣٠ ثانية'],
    stepsEn: ['Invite the bot with admin permissions', 'Set the support role and category in the Tickets tab', 'Send the panel command — changes apply within 30 seconds']
  }
};

const meta = META[BOT_KEY];
meta.clientId = clientId;
meta.supportBackup = BOT_KEY === 'security';
meta.dmUrl = `https://discord.com/channels/@me/${clientId}`;
meta.securitySite = 'https://security-971-panel.onrender.com';

const DEFAULTS = {
  security: {
    ownerId: '', guildId: '', logChannelId: '',
    backupEnabled: true, autoBackupInterval: 3600000,
    instantResponse: {
      enabled: true, alertEnabled: true, deleteWindowMs: 60000, deleteThreshold: 2,
      spamWindowMs: 5000, spamThreshold: 10, spamTimeoutMinutes: 10,
      channelCreateWindowMs: 10000, channelCreateThreshold: 3, kickBotsOnJoin: true,
      slowSpamWindowMs: 60000, slowSpamThreshold: 20,
      massBanThreshold: 2, massBanWindowMs: 60000, massKickThreshold: 3, massKickWindowMs: 60000,
      webhookStrikes: 1, emojiStrikes: 1, permissionEditStrikes: 1
    },
    protectionSettings: {
      roleProtection: true, channelProtection: true, memberProtection: true,
      messageProtection: true, emojiProtection: true, webhookProtection: true,
      banProtection: true, kickProtection: true
    },
    protectAllowed: []
  },
  ticket: {
    supportRoleId: '', categoryId: '', logChannelId: '', ticketLimit: 1, color: '#5865F2',
    panelTitle: '🎫 الدعم الفني',
    panelDescription: 'اضغط على الزر بالأسفل عشان تفتح تذكرة،\nوبيرد عليك فريق الدعم في أقرب وقت ممكن.',
    panelButtonLabel: 'افتح تذكرة',
    ticketWelcomeTitle: '🎫 تذكرتك جاهزة',
    ticketWelcomeDescription: 'اكتب تفاصيلك هنا، وأرفق أي صور أو ملفات تساعدنا نفهم طلبك.\nفريق الدعم بيوصلك قريب إن شاء الله.',
    mentionWarnHours: 24, mentionTimeoutHours: 3, mentionTimeoutEnabled: true
  }
};

let settings = JSON.parse(JSON.stringify(DEFAULTS[BOT_KEY]));
const events = [];
const MAX_EVENTS = 200;

const ghHeaders = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'bot-panel',
  'X-GitHub-Api-Version': '2022-11-28'
};
const settingsUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/settings.json`;

async function loadSettings() {
  if (!GH_TOKEN || !GH_REPO) return;
  try {
    const res = await fetch(settingsUrl, { headers: ghHeaders, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const json = await res.json();
    const parsed = JSON.parse(Buffer.from(json.content, 'base64').toString('utf8'));
    settings = { ...DEFAULTS[BOT_KEY], ...(parsed.settings || parsed) };
    console.log('[i] تم تحميل إعدادات ' + BOT_KEY);
  } catch (err) {
    console.error('[!] فشل تحميل الإعدادات:', err.message);
  }
}

async function saveSettings() {
  if (!GH_TOKEN || !GH_REPO) return;
  try {
    let sha;
    const current = await fetch(settingsUrl, { headers: ghHeaders, signal: AbortSignal.timeout(10000) });
    if (current.ok) sha = (await current.json()).sha;
    const body = {
      message: `Update ${BOT_KEY} settings from panel`,
      content: Buffer.from(JSON.stringify({ settings }, null, 2)).toString('base64')
    };
    if (sha) body.sha = sha;
    const res = await fetch(settingsUrl, {
      method: 'PUT', headers: ghHeaders, body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error((await res.text()).slice(0, 200));
    console.log('[i] تم حفظ إعدادات ' + BOT_KEY);
  } catch (err) {
    console.error('[!] فشل حفظ الإعدادات:', err.message);
    throw err;
  }
}

function mergeDeep(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeDeep(target[key], value);
    } else target[key] = value;
  }
  return target;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: BOT_KEY, uptimeSeconds: Math.floor(process.uptime()), events: events.length });
});

app.get('/api/state', async (req, res) => {
  let status = { online: false, error: 'unavailable' };
  try {
    const r = await fetch(meta.health, { signal: AbortSignal.timeout(8000) });
    status = { online: r.ok, data: await r.json() };
  } catch (err) {
    status = { online: false, error: err.message };
  }
  res.json({ botKey: BOT_KEY, meta, settings, status, events: events.slice().reverse() });
});

function getSettingsHandler(req, res) {
  res.json(settings);
}
async function postSettingsHandler(req, res) {
  try {
    mergeDeep(settings, req.body);
    await saveSettings();
    res.json({ ok: true, settings });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

app.get('/api/settings', getSettingsHandler);
app.post('/api/settings', postSettingsHandler);
// البوتات تقرأ من /api/settings/<bot> — لازم يكون JSON مو صفحة HTML
app.get('/api/settings/:bot', (req, res) =>
  req.params.bot === BOT_KEY ? getSettingsHandler(req, res) : res.status(404).json({ error: 'not found' })
);
app.post('/api/settings/:bot', (req, res) =>
  req.params.bot === BOT_KEY ? postSettingsHandler(req, res) : res.status(404).json({ error: 'not found' })
);

/* ───────────────────────────────────────────────────────────
   ربط حساب ديسكورد: البوت يرسل نتيجة أمر /link إلى هنا
   ─────────────────────────────────────────────────────────── */
function cleanCode(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}

app.post('/api/link/start', (req, res) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (linkSessions.has(code));

  linkSessions.set(code, {
    code,
    status: 'pending',
    createdAt: Date.now(),
    userId: null,
    username: null,
    avatar: null,
    guilds: []
  });

  for (const [c, s] of linkSessions) {
    if (Date.now() - s.createdAt > LINK_TTL) linkSessions.delete(c);
  }

  res.json({
    ok: true,
    code,
    command: `/link code:${code}`,
    botName: meta.fixedName,
    dmUrl: meta.dmUrl,
    expiresInMinutes: Math.round(LINK_TTL / 60000)
  });
});

app.post('/api/link/complete', (req, res) => {
  if (String(req.header('x-log-token') || '') !== String(LOG_TOKEN)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const code = cleanCode(req.body?.code);
  const session = linkSessions.get(code);
  if (!session) return res.status(404).json({ error: 'code not found or expired' });

  session.userId = String(req.body?.userId || '');
  session.username = String(req.body?.username || '');
  session.avatar = String(req.body?.avatar || '');
  session.guilds = Array.isArray(req.body?.guilds) ? req.body.guilds : [];
  session.status = 'linked';
  session.linkedAt = Date.now();

  events.unshift({
    ts: Date.now(),
    type: 'link',
    title: '🔗 تم ربط ديسكورد',
    description: `${session.username || session.userId} — ${session.guilds.length} سيرفر`,
    color: '#23a55a'
  });

  res.json({ ok: true, token: code, guilds: session.guilds.length });
});

app.get('/api/link/status', (req, res) => {
  const code = cleanCode(req.query.code);
  const session = linkSessions.get(code);
  if (!session) return res.json({ status: 'pending', code });
  if (Date.now() - session.createdAt > LINK_TTL) {
    linkSessions.delete(code);
    return res.json({ status: 'expired', code });
  }
  res.json({
    status: session.status,
    code,
    user: {
      id: session.userId,
      username: session.username,
      avatar: session.avatar
    },
    guilds: session.guilds
  });
});

app.post('/api/link/logout', (req, res) => {
  const code = cleanCode(req.body?.code);
  if (code) linkSessions.delete(code);
  res.json({ ok: true });
});

/* ───────────────────────────────────────────────────────────
   التحكم بالسيرفر: حفظ / استرجاع بضغطة زر
   ─────────────────────────────────────────────────────────── */
async function botRequest(pathname, options = {}) {
  const base = String(meta.health || '').replace(/\/+$/, '');
  const res = await fetch(base + pathname, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-control-token': String(LOG_TOKEN),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(60000)
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 300) }; }
  return { ok: res.ok, data };
}

app.post('/api/server/backup', async (req, res) => {
  if (!meta.supportBackup) return res.status(400).json({ error: 'backup is handled by the security panel' });
  const guildId = String(req.body?.guildId || '').replace(/\D/g, '');
  if (!/^\d{15,25}$/.test(guildId)) return res.status(400).json({ error: 'invalid guild id' });
  try {
    const r = await botRequest(`/control/backup?guild=${guildId}`, { method: 'POST', body: {} });
    events.unshift({
      ts: Date.now(),
      type: 'backup',
      title: '💾 حفظ السيرفر',
      description: r.ok ? `تم الحفظ — ${JSON.stringify(r.data).slice(0, 200)}` : 'فشل الحفظ',
      color: r.ok ? '#23a55a' : '#ed4245'
    });
    res.status(r.ok ? 200 : 502).json(r.data);
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.post('/api/server/restore', async (req, res) => {
  if (!meta.supportBackup) return res.status(400).json({ error: 'restore is handled by the security panel' });
  const guildId = String(req.body?.guildId || '').replace(/\D/g, '');
  if (!/^\d{15,25}$/.test(guildId)) return res.status(400).json({ error: 'invalid guild id' });
  try {
    const r = await botRequest(`/control/restore?guild=${guildId}`, { method: 'POST', body: {} });
    events.unshift({
      ts: Date.now(),
      type: 'restore',
      title: '♻️ استرجاع السيرفر',
      description: r.ok ? `تم الاسترجاع — ${JSON.stringify(r.data).slice(0, 200)}` : 'فشل الاسترجاع',
      color: r.ok ? '#23a55a' : '#ed4245'
    });
    res.status(r.ok ? 200 : 502).json(r.data);
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

app.get('/api/servers', async (req, res) => {
  const userId = String(req.query.userId || '').replace(/\D/g, '');
  if (!/^\d{15,25}$/.test(userId)) return res.json({ ok: false, guilds: [] });
  try {
    const r = await botRequest(`/control/guilds?userId=${userId}`);
    res.json(r.data);
  } catch (err) {
    res.json({ ok: false, guilds: [], error: err.message });
  }
});

app.post('/api/restart', async (req, res) => {
  if (!RENDER_KEY) return res.status(500).json({ error: 'RENDER_KEY not configured' });
  try {
    const r = await fetch(`https://api.render.com/v1/services/${meta.service}/deploys`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${RENDER_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(20000)
    });
    events.unshift({ ts: Date.now(), type: 'restart', title: '🔄 إعادة نشر', description: `${BOT_KEY} → ${r.ok ? 'تم الطلب' : 'فشل'}` });
    res.json({ ok: r.ok, detail: (await r.text()).slice(0, 200) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/log', (req, res) => {
  if (String(req.header('x-log-token') || '') !== String(LOG_TOKEN)) return res.status(401).json({ error: 'unauthorized' });
  const e = req.body || {};
  events.unshift({
    ts: e.ts || Date.now(),
    type: e.type || 'info',
    title: String(e.title || 'حدث').slice(0, 120),
    description: String(e.description || '').slice(0, 600),
    color: e.color || meta.accent
  });
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  res.json({ ok: true });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

loadSettings().finally(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`[i] ${BOT_KEY} panel on ${PORT}`));
  const selfUrl = String(process.env.SELF_PING_URL || '').trim();
  if (selfUrl) {
    setInterval(async () => {
      try { await fetch(selfUrl, { signal: AbortSignal.timeout(15000) }); }
      catch (err) { console.error('[!] self ping failed:', err.message); }
    }, 5 * 60 * 1000).unref();
    console.log('[i] self ping: ' + selfUrl);
  }
});
