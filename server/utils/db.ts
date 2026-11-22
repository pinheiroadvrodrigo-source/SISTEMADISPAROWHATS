import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone_number_id TEXT NOT NULL UNIQUE,
  waba_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  display_phone TEXT,
  verified_name TEXT,
  quality_rating TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  channel_id INTEGER NOT NULL REFERENCES channels(id),
  template_name TEXT NOT NULL,
  template_language TEXT NOT NULL,
  template_json TEXT NOT NULL,
  mapping_json TEXT NOT NULL DEFAULT '{}',
  header_media_url TEXT,
  status TEXT NOT NULL,            -- scheduled | running | paused | completed | canceled
  scheduled_at TEXT,
  rate_per_second INTEGER NOT NULL DEFAULT 20,
  total INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  started_at TEXT,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sending | sent | delivered | read | failed | canceled
  wamid TEXT,
  error_code TEXT,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  sent_at TEXT,
  delivered_at TEXT,
  read_at TEXT,
  failed_at TEXT,
  UNIQUE (campaign_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_status ON messages(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_wamid ON messages(wamid);

-- Status que chegaram pelo webhook antes de salvarmos o wamid
CREATE TABLE IF NOT EXISTS orphan_statuses (
  wamid TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_orphan_wamid ON orphan_statuses(wamid);

-- Contatos que pediram para não receber mais mensagens
CREATE TABLE IF NOT EXISTS optouts (
  phone TEXT PRIMARY KEY,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
`

const g = globalThis as any

export function db(): Database.Database {
  if (g.__disparosDb) return g.__disparosDb
  const path = useRuntimeConfig().databasePath || './data/disparos.db'
  mkdirSync(dirname(path), { recursive: true })
  const conn = new Database(path)
  conn.pragma('journal_mode = WAL')
  conn.pragma('foreign_keys = ON')
  conn.pragma('busy_timeout = 5000')
  conn.exec(SCHEMA)
  g.__disparosDb = conn
  return conn
}

export const nowIso = () => new Date().toISOString()

export function getChannel(id: number | string) {
  const ch = db().prepare('SELECT * FROM channels WHERE id = ?').get(id) as any
  if (!ch) throw createError({ statusCode: 404, message: 'Canal não encontrado' })
  return ch
}

export function getCampaign(id: number | string) {
  const c = db().prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as any
  if (!c) throw createError({ statusCode: 404, message: 'Campanha não encontrada' })
  return c
}

/** Contagem por status de uma campanha (enviados inclui entregues e lidos). */
export function campaignStats(id: number | string) {
  const rows = db().prepare('SELECT status, COUNT(*) n FROM messages WHERE campaign_id = ? GROUP BY status').all(id) as any[]
  const by: Record<string, number> = {}
  for (const r of rows) by[r.status] = r.n
  const n = (k: string) => by[k] || 0
  const total = rows.reduce((s, r) => s + r.n, 0)
  return {
    total,
    pending: n('pending') + n('sending'),
    sent: n('sent') + n('delivered') + n('read'),
    delivered: n('delivered') + n('read'),
    read: n('read'),
    failed: n('failed'),
    canceled: n('canceled'),
  }
}
