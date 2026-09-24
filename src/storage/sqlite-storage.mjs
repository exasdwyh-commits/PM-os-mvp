import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function json(value) { return JSON.stringify(value ?? null); }
function parse(value) { return value == null ? null : JSON.parse(value); }

export class SqliteStorage {
  constructor(file = ':memory:') {
    this.file = file;
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.migrate();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        kind TEXT NOT NULL,
        id TEXT NOT NULL,
        project_id TEXT,
        task_id TEXT,
        data_class TEXT,
        status TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (kind, id)
      );
      CREATE INDEX IF NOT EXISTS idx_records_project ON records(project_id);
      CREATE INDEX IF NOT EXISTS idx_records_task ON records(task_id);
      CREATE INDEX IF NOT EXISTS idx_records_kind_status ON records(kind, status);

      CREATE TABLE IF NOT EXISTS events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        at TEXT NOT NULL,
        actor TEXT NOT NULL,
        project_id TEXT,
        task_id TEXT,
        correlation_id TEXT,
        causation_id TEXT,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_task ON events(task_id, seq);
      CREATE INDEX IF NOT EXISTS idx_events_correlation ON events(correlation_id, seq);

      CREATE TABLE IF NOT EXISTS audit (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        actor TEXT,
        agent TEXT,
        task_id TEXT,
        capability TEXT,
        resource TEXT,
        allowed INTEGER NOT NULL,
        reason TEXT NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  put(kind, record) {
    if (!kind) throw new TypeError('storage kind is required');
    if (!record?.id) throw new TypeError('storage record.id is required');
    const now = new Date().toISOString();
    const createdAt = record.createdAt ?? now;
    const updatedAt = record.updatedAt ?? now;
    const stmt = this.db.prepare(`
      INSERT INTO records(kind,id,project_id,task_id,data_class,status,created_at,updated_at,payload)
      VALUES(?,?,?,?,?,?,?,?,?)
      ON CONFLICT(kind,id) DO UPDATE SET
        project_id=excluded.project_id,
        task_id=excluded.task_id,
        data_class=excluded.data_class,
        status=excluded.status,
        updated_at=excluded.updated_at,
        payload=excluded.payload
    `);
    stmt.run(
      kind, record.id, record.projectId ?? null, record.taskId ?? null,
      record.dataClass ?? null, record.status ?? null, createdAt, updatedAt, json(record)
    );
    return record;
  }

  get(kind, id) {
    const row = this.db.prepare('SELECT payload FROM records WHERE kind=? AND id=?').get(kind, id);
    return row ? parse(row.payload) : null;
  }

  list(kind, { projectId = null, taskId = null, status = null, limit = 100 } = {}) {
    const where = ['kind=?'];
    const args = [kind];
    if (projectId) { where.push('project_id=?'); args.push(projectId); }
    if (taskId) { where.push('task_id=?'); args.push(taskId); }
    if (status) { where.push('status=?'); args.push(status); }
    args.push(limit);
    return this.db.prepare(
      `SELECT payload FROM records WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT ?`
    ).all(...args).map(row => parse(row.payload));
  }

  appendEvent(event) {
    if (!event?.id || !event?.type) throw new TypeError('event id/type required');
    this.db.prepare(`
      INSERT INTO events(id,type,at,actor,project_id,task_id,correlation_id,causation_id,payload)
      VALUES(?,?,?,?,?,?,?,?,?)
    `).run(
      event.id, event.type, event.at, event.actor ?? 'system',
      event.projectId ?? null, event.taskId ?? null,
      event.correlationId ?? null, event.causationId ?? null, json(event.payload ?? {})
    );
    return event;
  }

  listEvents({ taskId = null, correlationId = null, limit = 200 } = {}) {
    const where = [];
    const args = [];
    if (taskId) { where.push('task_id=?'); args.push(taskId); }
    if (correlationId) { where.push('correlation_id=?'); args.push(correlationId); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    args.push(limit);
    return this.db.prepare(
      `SELECT * FROM events ${clause} ORDER BY seq ASC LIMIT ?`
    ).all(...args).map(row => ({
      id: row.id, type: row.type, at: row.at, actor: row.actor,
      projectId: row.project_id, taskId: row.task_id,
      correlationId: row.correlation_id, causationId: row.causation_id,
      sequence: row.seq, payload: parse(row.payload)
    }));
  }

  appendAudit(entry) {
    this.db.prepare(`
      INSERT INTO audit(at,actor,agent,task_id,capability,resource,allowed,reason,payload)
      VALUES(?,?,?,?,?,?,?,?,?)
    `).run(
      entry.at ?? new Date().toISOString(), entry.actor ?? null, entry.agent ?? null,
      entry.taskId ?? null, entry.capability ?? null, entry.resource ?? null,
      entry.allowed ? 1 : 0, entry.reason ?? 'unknown', json(entry)
    );
    return entry;
  }

  listAudit(limit = 200) {
    return this.db.prepare('SELECT payload FROM audit ORDER BY seq DESC LIMIT ?')
      .all(limit).map(row => parse(row.payload));
  }

  setMeta(key, value) {
    this.db.prepare(`
      INSERT INTO metadata(key,value) VALUES(?,?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).run(key, json(value));
  }

  getMeta(key) {
    const row = this.db.prepare('SELECT value FROM metadata WHERE key=?').get(key);
    return row ? parse(row.value) : null;
  }

  close() { this.db.close(); }
}
