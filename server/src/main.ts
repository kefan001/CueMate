import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const dataDir = path.resolve(process.cwd(), 'data');
const dbFile = path.join(dataDir, 'store.json');

fs.mkdirSync(dataDir, { recursive: true });

const SENSITIVE_WORDS = ['赌球', '赌博', '外围', '盘口', '博彩', '洗钱', '刷单', '裸聊', '色情', '援交', '毒品'];

function checkSecurity(text = '') {
  const raw = String(text || '').trim();
  for (const w of SENSITIVE_WORDS) {
    if (raw.includes(w)) {
      return { ok: false, word: w, message: `内容包含违规敏感词「${w}」，已被微信内容安全接口（msgSecCheck）拦截` };
    }
  }
  return { ok: true };
}

function readStore(): Record<string, unknown> {
  if (!fs.existsSync(dbFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch {
    return {};
  }
}

function writeStore(next: Record<string, unknown>) {
  fs.writeFileSync(dbFile, JSON.stringify(next, null, 2), 'utf8');
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'cuemate-server',
    mode: 'node-express',
    date: new Date().toISOString(),
  });
});

app.get('/api/bootstrap', (_req, res) => {
  const data = readStore();
  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    ...data,
  });
});

app.post('/api/sync', (req, res) => {
  const current = readStore();
  const next = { ...current, ...(req.body || {}), updatedAt: new Date().toISOString() };
  writeStore(next);
  res.json({ ok: true, ...next });
});

app.post('/api/security/check', (req, res) => {
  const result = checkSecurity(req.body?.text);
  res.status(result.ok ? 200 : 400).json(result);
});

app.listen(port, () => {
  console.log(`CueMate server listening on http://localhost:${port}`);
});
